"""Fixed wording for output the SERVER builds (the PDF report). Everything shown in the web page
lives in frontend/src/i18n/locales instead. Same three languages, same terms."""
from __future__ import annotations

REPORT: dict[str, dict[str, str]] = {
    "title": {"en": "Personalized Agricultural Support Report", "hi": "व्यक्तिगत कृषि सहायता रिपोर्ट", "hinglish": "Personalized Krishi Sahayata Report"},
    "scheme": {"en": "Scheme", "hi": "योजना", "hinglish": "Scheme"},
    "generated": {"en": "Generated", "hi": "तैयार किया गया", "hinglish": "Taiyaar kiya gaya"},
    "farmer_profile": {"en": "Farmer profile", "hi": "किसान की प्रोफाइल", "hinglish": "Farmer profile"},
    "no_profile": {
        "en": "No saved farm profile was available. Eligibility cannot be personalized without profile information.",
        "hi": "कोई सेव की गई फार्म प्रोफाइल उपलब्ध नहीं थी। प्रोफाइल की जानकारी के बिना पात्रता व्यक्तिगत रूप से नहीं जांची जा सकती।",
        "hinglish": "Koi saved farm profile available nahi thi. Profile information ke bina eligibility personalize nahi ho sakti.",
    },
    "eligibility_result": {"en": "Eligibility result", "hi": "पात्रता का नतीजा", "hinglish": "Eligibility result"},
    "criterion": {"en": "Criterion", "hi": "शर्त", "hinglish": "Shart (Criterion)"},
    "result": {"en": "Result", "hi": "नतीजा", "hinglish": "Result"},
    "actual": {"en": "Your value", "hi": "आपकी जानकारी", "hinglish": "Aapki value"},
    "benefits": {"en": "Benefits", "hi": "लाभ", "hinglish": "Benefits"},
    "documents": {"en": "Required documents", "hi": "आवश्यक दस्तावेज़", "hinglish": "Zaroori documents"},
    "steps": {"en": "Application steps", "hi": "आवेदन के चरण", "hinglish": "Application ke steps"},
    "verify": {"en": "Verify this information from the official source.", "hi": "यह जानकारी आधिकारिक स्रोत से सत्यापित करें।", "hinglish": "Ye information official source se verify karein."},
    "important": {
        "en": "Important: Eligibility is based on the information provided and the structured scheme criteria. Final approval is subject to the implementing authority. This report does not submit a government application.",
        "hi": "महत्वपूर्ण: पात्रता आपकी दी गई जानकारी और योजना की संरचित शर्तों पर आधारित है। अंतिम स्वीकृति कार्यान्वयन प्राधिकरण के अधीन है। यह रिपोर्ट कोई सरकारी आवेदन जमा नहीं करती।",
        "hinglish": "Zaroori: Eligibility aapki di gayi information aur scheme ki structured criteria par based hai. Final approval implementing authority ke adheen hai. Ye report koi sarkari application submit nahi karti.",
    },
    "PASS": {"en": "Met", "hi": "पूरी", "hinglish": "Poori"},
    "FAIL": {"en": "Not met", "hi": "पूरी नहीं", "hinglish": "Poori nahi"},
    "UNKNOWN": {"en": "Unknown", "hi": "अज्ञात", "hinglish": "Pata nahi"},
    "ELIGIBLE": {"en": "Eligible", "hi": "पात्र", "hinglish": "Eligible"},
    "ALMOST_ELIGIBLE": {"en": "Almost eligible", "hi": "लगभग पात्र", "hinglish": "Almost eligible"},
    "NOT_ELIGIBLE": {"en": "Not eligible", "hi": "पात्र नहीं", "hinglish": "Eligible nahi"},
    "VERIFICATION_REQUIRED": {"en": "Verification required", "hi": "सत्यापन आवश्यक", "hinglish": "Verification zaroori"},
}

# Profile field names for the report's profile table.
FIELD_LABELS: dict[str, dict[str, str]] = {
    "farmer_name": {"en": "Farmer name", "hi": "किसान का नाम", "hinglish": "Farmer ka naam"},
    "age": {"en": "Age", "hi": "आयु", "hinglish": "Umr"},
    "gender": {"en": "Gender", "hi": "लिंग", "hinglish": "Gender"},
    "farmer_type": {"en": "Farmer type", "hi": "किसान का प्रकार", "hinglish": "Kisan ka type"},
    "social_category": {"en": "Social category", "hi": "सामाजिक श्रेणी", "hinglish": "Social category"},
    "state": {"en": "State", "hi": "राज्य", "hinglish": "Rajya"},
    "district": {"en": "District", "hi": "जिला", "hinglish": "Zila"},
    "block": {"en": "Block", "hi": "ब्लॉक", "hinglish": "Block"},
    "village": {"en": "Village", "hi": "गांव", "hinglish": "Gaon"},
    "land_size_hectares": {"en": "Land size (hectares)", "hi": "भूमि का आकार (हेक्टेयर)", "hinglish": "Zameen (hectare)"},
    "land_ownership_type": {"en": "Land ownership", "hi": "भूमि का स्वामित्व", "hinglish": "Zameen ka malikana haq"},
    "cultivable_land_hectares": {"en": "Cultivable land (hectares)", "hi": "खेती योग्य भूमि (हेक्टेयर)", "hinglish": "Kheti yogya zameen (hectare)"},
    "crop_types": {"en": "Crops grown", "hi": "उगाई जाने वाली फसलें", "hinglish": "Ugayi jaane wali fasalein"},
    "primary_crop": {"en": "Primary crop", "hi": "मुख्य फसल", "hinglish": "Main fasal"},
    "irrigation_type": {"en": "Irrigation", "hi": "सिंचाई", "hinglish": "Sinchai"},
    "soil_type": {"en": "Soil type", "hi": "मिट्टी का प्रकार", "hinglish": "Mitti ka type"},
    "income_category": {"en": "Income category", "hi": "आय श्रेणी", "hinglish": "Income category"},
    "bank_account_status": {"en": "Bank account status", "hi": "बैंक खाते की स्थिति", "hinglish": "Bank account status"},
    "kcc_holder": {"en": "KCC holder", "hi": "KCC धारक", "hinglish": "KCC holder"},
    "years_of_cultivation": {"en": "Years of cultivation", "hi": "खेती के वर्ष", "hinglish": "Kheti ke saal"},
    "farming_type": {"en": "Farming type", "hi": "खेती का प्रकार", "hinglish": "Kheti ka type"},
    "livestock_owned": {"en": "Owns livestock", "hi": "पशुधन है", "hinglish": "Pashudhan hai"},
    "equipment_owned": {"en": "Equipment owned", "hi": "स्वामित्व के उपकरण", "hinglish": "Apne equipment"},
}

YES_NO = {"en": ("Yes", "No"), "hi": ("हाँ", "नहीं"), "hinglish": ("Haan", "Nahi")}


def message(table: dict[str, dict[str, str]], key: str, language: str) -> str:
    entry = table.get(key) or {}
    return entry.get(language) or entry.get("en") or key
