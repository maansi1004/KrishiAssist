from __future__ import annotations
import json
import re
import urllib.request
from pathlib import Path
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.auth.dependencies import optional_current_user
from app.core.config import settings
from app.db.session import get_db
from app.models.profile import FarmProfile
from app.models.user import User
from app.schemas.assistant import AssistantChatRequest, AssistantChatResponse
from app.schemas.profile import FarmerProfile
from app.services.scheme_service import load_schemes, get_scheme
from app.engines.eligibility_engine import evaluate_scheme
from app.i18n import humanize_code, scheme_text_field, translate, vocab
from app.engines.recommendation_engine import best_scheme_match, contains_phrase, norm_match, normalize, score_scheme

router = APIRouter(prefix="/api/assistant", tags=["assistant"])
KB_FILE = Path(__file__).resolve().parents[3] / "data/knowledge_base/agriculture_knowledge.json"


def profile_dict(row: FarmProfile | None) -> dict:
    if not row:
        return {}
    return {f: getattr(row, f) for f in FarmerProfile.model_fields.keys()}


def _has(q: str, words: list[str]) -> bool:
    qn = norm_match(q)
    return any(contains_phrase(qn, w) for w in words)


def classify(message: str) -> str:
    """Classify explicit scheme tasks first without treating every use of 'support' as a scheme search."""
    if _has(message, ["eligible", "eligibility", "qualify", "qualified", "am i allowed", "can i get", "पात्र", "योग्य", "kya main le sakta"]):
        return "eligibility"
    if _has(message, ["document", "documents", "paper", "papers", "दस्तावेज", "कागज", "kaun se kagaz"]):
        return "documents"
    if _has(message, ["benefit", "benefits", "amount", "how much", "लाभ", "कितना", "मिलेगा", "kitna paisa"]):
        return "benefits"
    if _has(message, ["how to apply", "apply", "applying", "application", "application process", "आवेदन", "आवेदन कैसे", "प्रक्रिया", "कदम", "apply kaise"]):
        return "application"
    # A topic such as 'irrigation support' is agricultural advice, not automatically a scheme search.
    if _has(message, ["scheme", "schemes", "yojana", "योजना", "subsidy", "सब्सिडी", "government assistance", "सरकारी योजना", "sarkari yojana"]):
        return "scheme_discovery"
    return "general_agriculture_support"


def _kb_score(question: str, item: dict) -> int:
    """Small hybrid lexical matcher: exact phrases first, then meaningful token overlap."""
    qn = norm_match(question)
    best = 0
    stop = {"what", "is", "the", "a", "an", "how", "do", "i", "my", "me", "for", "to", "in", "of", "can", "please", "kya", "hai", "ka", "ki", "ke", "mein", "mera", "meri", "kaise", "kare", "karen", "hai", "hain"}
    q_tokens = {t for t in re.findall(r"[\w]+", qn, flags=re.UNICODE) if len(t) > 2 and t not in stop}
    for keyword in item.get("keywords", []):
        kn = norm_match(keyword)
        if not kn:
            continue
        if contains_phrase(qn, kn):
            best = max(best, 100 + len(kn.split()))
            continue
        k_tokens = {t for t in re.findall(r"[\w]+", kn, flags=re.UNICODE) if len(t) > 2 and t not in stop}
        overlap = len(q_tokens & k_tokens)
        if overlap >= 2:
            best = max(best, 10 * overlap + int(10 * overlap / max(1, len(k_tokens))))
    return best


def _best_kb_item(question: str) -> dict | None:
    ranked = sorted((( _kb_score(question, item), item) for item in load_kb()), key=lambda pair: pair[0], reverse=True)
    return ranked[0][1] if ranked and ranked[0][0] >= 20 else None


def _profile_context(profile: dict) -> dict:
    allowed = ("state", "district", "primary_crop", "crop_types", "land_size_hectares", "irrigation_type", "soil_type", "farming_type")
    return {key: profile[key] for key in allowed if profile.get(key) not in (None, "", [])}


def _personalize_answer(answer: str, profile: dict, language: str, topic: str) -> str:
    """Use only relevant saved farm details; never infer missing agronomic facts."""
    if not profile:
        return answer
    crop = profile.get("primary_crop")
    state = profile.get("state")
    if topic in {"crop_planning", "crop_rotation", "fertilizer_management", "pest_management", "crop_disease_management", "harvesting"} and crop:
        prefix = lang_text(language, f"Since your saved primary crop is {crop}, ", f"आपकी सेव की गई मुख्य फसल {crop} है, इसलिए ", f"Aapki saved primary crop {crop} hai, isliye ")
        return prefix + answer
    if topic in {"irrigation_general", "drought_management", "waterlogging_management"} and state:
        prefix = lang_text(language, f"For your saved location ({state}), check local agricultural advisories. ", f"आपके सेव किए गए क्षेत्र ({state}) के लिए स्थानीय कृषि सलाह देखें। ", f"Aapki saved location ({state}) ke liye local agriculture advisory check karein. ")
        return prefix + answer
    return answer


def _needs_crop_details(q: str, profile: dict, language: str) -> str | None:
    symptom_words = ["yellow leaves", "leaves turning yellow", "leaves are turning yellow", "leaf spots", "wilting", "plant drying", "पत्ते पीले", "पत्तियों पर धब्बे", "पौधे सूख", "patte peele", "patti peeli", "patte peele pad rahe", "paudhe sukh"]
    if not _has(q, symptom_words):
        return None
    crop = profile.get("primary_crop")
    if crop:
        return lang_text(language,
            f"I see your saved primary crop is {crop}. To narrow this down, tell me the crop's growth stage, when the symptoms started, which plant parts are affected, and whether the problem is spreading. A clear photo can also help, but I cannot confirm a diagnosis from symptoms alone.",
            f"आपकी सेव की गई मुख्य फसल {crop} है। समस्या समझने के लिए फसल की अवस्था, लक्षण कब शुरू हुए, पौधे का कौन-सा हिस्सा प्रभावित है और समस्या फैल रही है या नहीं बताएं। साफ फोटो भी मदद कर सकती है, लेकिन केवल लक्षणों से रोग की पुष्टि नहीं की जा सकती।",
            f"Aapki saved primary crop {crop} hai. Better samajhne ke liye crop growth stage, symptoms kab start hue, plant ka kaunsa part affected hai aur problem spread ho rahi hai ya nahi batayein. Clear photo help kar sakti hai, lekin sirf symptoms se disease confirm nahi hoti.")
    return lang_text(language,
        "Which crop is affected, what is its growth stage, when did the symptoms start, and which plant parts are affected? A clear photo may help. Avoid applying a pesticide or fertilizer until the problem is identified.",
        "कौन-सी फसल प्रभावित है, उसकी अवस्था क्या है, लक्षण कब शुरू हुए और पौधे का कौन-सा हिस्सा प्रभावित है? साफ फोटो मदद कर सकती है। समस्या की पहचान से पहले कीटनाशक या उर्वरक न डालें।",
        "Kaunsi crop affected hai, growth stage kya hai, symptoms kab start hue aur plant ka kaunsa part affected hai? Clear photo help kar sakti hai. Problem identify hone se pehle pesticide ya fertilizer apply na karein.")


def relevant_schemes(q: str, profile: dict) -> list[dict]:
    scored = []
    for s in load_schemes():
        score = score_scheme(s, q, profile)
        if score > 0:
            scored.append({"schemeCode": s["schemeCode"], "name": s["name"], "state": s.get("state"), "category": s.get("category"), "relevanceScore": score})
    scored.sort(key=lambda x: x["relevanceScore"], reverse=True)
    return scored[:6]


def find_scheme_for_question(q: str, profile: dict, context_scheme_code: str | None = None) -> dict | None:
    """Resolve the scheme for a question without letting stale UI context override an explicit request."""
    # 1. A scheme the farmer clearly named (code, name, Hindi name or common word).
    #    If several match, prefer the strongest name, then the farmer's own state.
    named = best_scheme_match(q, profile, load_schemes())
    if named:
        return named

    # 2. Only then use the selected scheme as conversational context.
    if context_scheme_code:
        contextual = get_scheme(context_scheme_code.strip())
        if contextual:
            return contextual

    # 3. Finally use relevance ranking.
    matches = relevant_schemes(q, profile)
    return get_scheme(matches[0]["schemeCode"]) if matches and matches[0]["relevanceScore"] >= 35 else None


def _readable(result: dict, fields: list[str], language: str = "en") -> list[str]:
    """Turn raw field names (agr50_preapproval) into the rule's plain sentence."""
    by_field: dict[str, str] = {}
    for c in result.get("criteria", []) + result.get("exclusions", []) + result.get("verificationCriteria", []):
        by_field.setdefault(c["field"], c.get("criterion") or c["field"].replace("_", " "))
    seen, out = set(), []
    for f in fields:
        text = translate(by_field.get(f, f.replace("_", " ")), language).rstrip(" .")
        if text not in seen:
            seen.add(text)
            out.append(text)
    return out


def _name(scheme: dict, language: str) -> str:
    return scheme_text_field(scheme, "name", language)


def lang_text(language: str, en: str, hi: str, hinglish: str) -> str:
    if language == "hi": return hi
    if language == "hinglish": return hinglish
    return en


def load_kb() -> list[dict]:
    try:
        return json.loads(KB_FILE.read_text(encoding="utf-8"))
    except Exception:
        return []


def general_answer(q: str, language: str, profile: dict, history: list[dict] | None = None) -> str | None:
    item = _best_kb_item(q)
    if item:
        answer = item.get("answers", {}).get(language) or item.get("answers", {}).get("en")
        if answer:
            return _personalize_answer(answer, profile, language, item.get("topic", ""))

    # Optional LLM fallback: include only recent, user/assistant text and minimal farm context.
    if settings.openrouter_api_key and settings.llm_model:
        context = {
            "farm_profile": _profile_context(profile),
            "related_verified_schemes": [{"code": s["schemeCode"], "name": s["name"], "description": s.get("description"), "benefits": s.get("benefits", [])[:3]} for s in (get_scheme(m["schemeCode"]) for m in relevant_schemes(q, profile)[:5]) if s],
        }
        safe_history = []
        for turn in (history or [])[-6:]:
            if isinstance(turn, dict) and turn.get("role") in {"user", "assistant"} and isinstance(turn.get("content"), str):
                safe_history.append({"role": turn["role"], "content": turn["content"][:1200]})
        system = ("You are KrishiAssist, a farmer-friendly agricultural support assistant. Answer in the requested language. "
                  "Use saved profile facts only as context, never invent missing facts. Ask concise clarifying questions when crop, location, growth stage or symptoms are needed. "
                  "Use supplied scheme context only for scheme claims. Never invent eligibility, benefit amounts, official links, deadlines or documents. "
                  "Personal eligibility must be evaluated by the deterministic rule engine. For pesticide, fertilizer, disease or animal-health advice, be cautious, "
                  "do not prescribe unsupported chemical doses, and recommend local expert confirmation where needed. If context is insufficient, say what is missing.")
        messages = [{"role": "system", "content": system}, *safe_history,
                    {"role": "user", "content": json.dumps({"language": language, "question": q, "context": context}, ensure_ascii=False)}]
        payload = json.dumps({"model": settings.llm_model, "messages": messages, "temperature": 0.2}).encode()
        req = urllib.request.Request("https://openrouter.ai/api/v1/chat/completions", data=payload,
            headers={"Authorization": f"Bearer {settings.openrouter_api_key}", "Content-Type": "application/json",
                     "HTTP-Referer": "http://localhost:5173", "X-Title": "KrishiAssist"}, method="POST")
        try:
            with urllib.request.urlopen(req, timeout=20) as resp:
                data = json.loads(resp.read().decode())
            content = data["choices"][0]["message"]["content"].strip()
            return content or None
        except Exception:
            return None
    return None


@router.post("/chat", response_model=AssistantChatResponse)
def chat(request: AssistantChatRequest, user: User | None = Depends(optional_current_user), db: Session = Depends(get_db)):
    profile = profile_dict(db.query(FarmProfile).filter_by(user_id=user.id).first()) if user else {}
    q = request.message.strip()
    intent = classify(q)
    # Use previous scheme context only for follow-up questions. A new/general
    # question must be free to select a different topic.
    follow_up_intent = intent in {"documents", "benefits", "application", "eligibility"}
    selected = find_scheme_for_question(q, profile, request.context_scheme_code if follow_up_intent else None)
    schemes = relevant_schemes(q, profile)
    profile_used = bool(profile)

    if intent == "documents":
        if selected and selected.get("documents"):
            selected_name = _name(selected, request.language)
            docs = [translate(d if isinstance(d, str) else d.get("name", d.get("document", "Document")), request.language) for d in selected["documents"]]
            reply = lang_text(request.language,
                f"For {selected_name}, the verified scheme record lists: " + "; ".join(docs) + ". Final requirements should be confirmed from the official source.",
                f"{selected_name} के सत्यापित रिकॉर्ड में ये दस्तावेज़ दिए गए हैं: " + "; ".join(docs) + ". अंतिम आवश्यकताएं आधिकारिक स्रोत से जांचें।",
                f"{selected_name} ke verified record mein ye documents diye gaye hain: " + "; ".join(docs) + ". Final requirements official source se confirm karein.")
        else:
            reply = lang_text(request.language, "Tell me the scheme or support you mean, for example crop insurance, tractor subsidy or irrigation.", "योजना या सहायता का नाम बताएं, जैसे फसल बीमा, ट्रैक्टर सब्सिडी या सिंचाई।", "Scheme ya support bataiye, jaise crop insurance, tractor subsidy ya irrigation.")
    elif intent == "benefits":
        if selected and selected.get("benefits"):
            selected_name = _name(selected, request.language)
            items = [translate(b if isinstance(b, str) else b.get("description", b.get("benefitType", str(b))), request.language) for b in selected["benefits"][:5]]
            reply = lang_text(request.language,
                f"For {selected_name}, the verified record says: " + " ".join(items),
                f"{selected_name} के सत्यापित रिकॉर्ड के अनुसार: " + " ".join(items),
                f"{selected_name} ke verified record ke hisaab se: " + " ".join(items))
        else:
            reply = lang_text(request.language, "Tell me the scheme name or support you mean and I’ll explain its verified benefits.", "योजना या सहायता का नाम बताएं; मैं उसके सत्यापित लाभ बताऊंगा।", "Scheme ya support ka naam bataiye; main verified benefits bataunga.")
    elif intent == "application":
        if selected and selected.get("actionSteps"):
            selected_name = _name(selected, request.language)
            steps = []
            for step in selected["actionSteps"][:6]:
                steps.append(f"{step.get('step')}. {translate(step.get('title'), request.language)}: {translate(step.get('description'), request.language)}")
            reply = lang_text(request.language, f"Application steps for {selected_name}: " + " ".join(steps), f"{selected_name} के आवेदन के कदम: " + " ".join(steps), f"{selected_name} ke application steps: " + " ".join(steps))
        else:
            reply = lang_text(request.language, "Tell me the scheme you want to apply for and I’ll explain the verified steps.", "जिस योजना के लिए आवेदन करना है उसका नाम बताएं; मैं सत्यापित कदम बताऊंगा।", "Jis scheme ke liye apply karna hai uska naam bataiye; main verified steps bataunga.")
    elif intent == "eligibility":
        if not user:
            reply = lang_text(request.language, "Please sign in and save your farm profile first. Then I can evaluate your eligibility against the scheme rules.", "पहले साइन इन करके अपनी फार्म प्रोफाइल सेव करें। उसके बाद मैं योजना के नियमों के आधार पर पात्रता जांच सकता हूं।", "Pehle sign in karke apni farm profile save karein. Uske baad main scheme rules ke basis par eligibility check karunga.")
        elif not profile:
            reply = lang_text(request.language, "Your farm profile is empty. Complete My Farm Profile first; I will not guess missing information.", "आपकी फार्म प्रोफाइल खाली है। पहले My Farm Profile पूरा करें; मैं missing information का अनुमान नहीं लगाऊंगा।", "Aapki farm profile empty hai. Pehle My Farm Profile complete karein; main missing information guess nahi karunga.")
        elif selected:
            result = evaluate_scheme(selected, profile)
            status_map = {"ELIGIBLE": ("Eligible", "पात्र", "Eligible"), "ALMOST_ELIGIBLE": ("Almost eligible", "लगभग पात्र", "Almost eligible"), "NOT_ELIGIBLE": ("Not eligible", "पात्र नहीं", "Eligible nahi"), "VERIFICATION_REQUIRED": ("Verification required", "सत्यापन आवश्यक", "Verification zaroori hai")}
            status = status_map.get(result["status"], (result["status"], result["status"], result["status"]))[0 if request.language == "en" else 1 if request.language == "hi" else 2]
            passed = [translate(c["criterion"], request.language).rstrip(" .") for c in result["criteria"] if c["result"] == "PASS"][:4]
            needed = _readable(result, result["missingRequirements"] + [f for f in result.get("verificationRequired", []) if f not in result["missingRequirements"]], request.language)[:4]
            failed = _readable(result, result["failedRequirements"], request.language)[:4]
            name = _name(selected, request.language)
            reply = f"{name}: {status}. "
            if passed: reply += lang_text(request.language, "Passed: ", "पूरे हुए नियम: ", "Pass hue rules: ") + "; ".join(passed) + ". "
            if needed: reply += lang_text(request.language, "Information needed: ", "ज़रूरी जानकारी: ", "Zaroori jaankari: ") + "; ".join(needed) + ". "
            if failed: reply += lang_text(request.language, "Not met: ", "पूरे न होने वाले नियम: ", "Pure na hone wale rules: ") + "; ".join(failed) + ". "
            if result.get("unverifiedScheme"):
                reply += lang_text(request.language,
                    "This scheme's data is still being verified, so please confirm the rules with the official source. ",
                    "इस योजना का डेटा अभी सत्यापित हो रहा है, इसलिए आधिकारिक स्रोत से नियम जांच लें। ",
                    "Is scheme ka data abhi verify ho raha hai, isliye official source se rules confirm karein. ")
            reply += lang_text(request.language,
                "This result comes from the structured rule engine, not an AI guess.",
                "यह नतीजा नियम इंजन से आया है, AI के अंदाज़े से नहीं।",
                "Ye result rule engine se aaya hai, AI ke andaaze se nahi.")
            return AssistantChatResponse(reply=reply, intent=intent, schemes=schemes, profile_used=profile_used, eligibility=result)  # canonical: the app translates it itself; `reply` is the localized text
        else:
            reply = lang_text(request.language, "Tell me which scheme you mean, for example ‘Am I eligible for tractor subsidy?’", "किस योजना की पात्रता जाननी है बताएं, जैसे ‘क्या मैं ट्रैक्टर सब्सिडी के लिए पात्र हूं?’", "Kaunsi scheme ki eligibility check karni hai bataiye, jaise ‘Am I eligible for tractor subsidy?’")
    elif intent == "scheme_discovery":
        if schemes:
            top = schemes[:5]
            labels = []
            for x in top:
                full = get_scheme(x["schemeCode"])
                name = _name(full, request.language) if full else x["name"]
                labels.append(f"{name} ({x['schemeCode']})")
            reply = lang_text(request.language,
                "I found these schemes related to your request: " + ", ".join(labels) + ". They are relevance matches, not an eligibility decision. Ask me about a scheme's benefits, documents, application steps, or whether you qualify.",
                "आपकी जरूरत से संबंधित ये योजनाएं मिलीं: " + ", ".join(labels) + "। ये केवल संबंधित योजनाएं हैं, पात्रता का अंतिम निर्णय नहीं। आप किसी योजना के लाभ, दस्तावेज़, आवेदन प्रक्रिया या अपनी पात्रता के बारे में पूछ सकते हैं।",
                "Aapki need se related ye schemes mili hain: " + ", ".join(labels) + ". Ye relevance matches hain, final eligibility decision nahi. Aap benefits, documents, application steps ya eligibility pooch sakte hain.")
        else:
            reply = lang_text(request.language, "I could not find a matching scheme in the current verified dataset. Try words such as tractor, machinery, crop insurance, irrigation, seeds or training.", "वर्तमान सत्यापित डेटासेट में मिलती हुई योजना नहीं मिली। ट्रैक्टर, मशीनरी, फसल बीमा, सिंचाई, बीज या प्रशिक्षण जैसे शब्दों से पूछें।", "Current verified dataset mein matching scheme nahi mili. Tractor, machinery, crop insurance, irrigation, seeds ya training jaise words try karein.")
    else:
        if selected:
            name = _name(selected, request.language)
            category = vocab("categories", selected.get("category"), request.language) or humanize_code(selected.get("category") or "agriculture")
            summary = scheme_text_field(selected, "description", request.language) or selected.get("description") or "Government agricultural support programme."
            reply = lang_text(request.language,
                f"{name} is a {category} support programme. {summary} Ask me about its eligibility, benefits, documents or application steps.",
                f"{name} {category} से जुड़ी योजना है। {summary} आप इसकी पात्रता, लाभ, दस्तावेज़ या आवेदन के कदम पूछ सकते हैं।",
                f"{name} ek {category} support scheme hai. {summary} Aap iski eligibility, benefits, documents ya application steps pooch sakte hain.")
        else:
            reply = _needs_crop_details(q, profile, request.language) or general_answer(q, request.language, profile, request.history)
        if not reply:
            reply = lang_text(request.language,
                "I can answer agriculture questions, explain verified schemes, list documents and evaluate eligibility when your profile is saved. Tell me your crop, problem or support need.",
                "मैं कृषि से जुड़े सामान्य सवालों, सत्यापित योजनाओं, दस्तावेज़ों और आपकी सेव प्रोफाइल के आधार पर पात्रता में मदद कर सकता हूं। अपनी फसल, समस्या या सहायता की जरूरत बताएं।",
                "Main agriculture questions, verified schemes, documents aur saved profile ke basis par eligibility mein help kar sakta hoon. Apni crop, problem ya support need bataiye.")
    return AssistantChatResponse(reply=reply, intent=intent, schemes=schemes, profile_used=profile_used)
