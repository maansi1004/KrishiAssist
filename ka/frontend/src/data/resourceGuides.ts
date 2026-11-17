export type GuideLanguage = 'en' | 'hi' | 'hinglish';
export type GuideSection = { title: string; intro: string; points: string[] };
export type LocalizedGuide = { title: string; summary: string; sections: GuideSection[] };
export const RESOURCE_GUIDES: Record<string, Record<GuideLanguage, LocalizedGuide>> = {
  crop: {
    en: { title: "Crop planning & cultivation", summary: "Plan a crop cycle around local climate, soil, water, market access and the farm's available labour.", sections: [
      { title: "1. Understand your farm", intro: "Start with the field, not the seed catalogue.", points: [
        "Record field size, slope, drainage, previous crop and available irrigation.",
        "Check local rainfall pattern, temperature range and frost or heat risk.",
        "Consider labour, machinery, storage, transport and likely market demand.",
        "Ask the local KVK or agriculture office which crops and varieties suit your block.",
      ] },
      { title: "2. Select crops and varieties", intro: "Choose crops that fit the season and the resources you can reliably provide.", points: [
        "Compare duration, water demand, disease resistance, expected harvest window and buyer access.",
        "Prefer varieties recommended for your agro-climatic zone and current season.",
        "Diversify where practical; avoid putting the whole farm at risk with one crop.",
        "Use certified seed from an authorised source and retain the label and purchase receipt.",
      ] },
      { title: "3. Prepare land and sow", intro: "Prepare a suitable seedbed while protecting soil structure and moisture.", points: [
        "Remove problematic weeds and manage residues safely; avoid burning crop residue.",
        "Use soil-test results to plan amendments rather than applying inputs by guesswork.",
        "Follow the locally recommended sowing window, seed rate, spacing and depth for the crop and variety.",
        "Check seed germination and calibrate the seed drill or planter before sowing.",
      ] },
      { title: "4. Manage the growing crop", intro: "Monitor the field regularly and respond early to changing crop needs.", points: [
        "Check emergence, plant population, weeds, moisture and nutrient symptoms at regular intervals.",
        "Use irrigation based on crop stage, soil moisture and local weather, not a fixed calendar alone.",
        "Keep field records of sowing, irrigation, inputs, labour, pest observations and costs.",
        "Seek local expert advice before changing nutrient or plant-protection practices.",
      ] },
      { title: "5. Harvest and review", intro: "Harvest at the right maturity and use the season's records to improve the next cycle.", points: [
        "Use crop-specific maturity indicators and avoid harvesting when produce is excessively wet.",
        "Dry, clean, grade and store produce safely; protect it from moisture, pests and contamination.",
        "Compare yield, quality, costs and sale price with the plan.",
        "Record lessons and adjust crop choice, timing and practices for the next season.",
      ] },
    ] },
    hi: { title: "फसल योजना और खेती", summary: "स्थानीय जलवायु, मिट्टी, पानी, बाजार और उपलब्ध श्रम के अनुसार फसल चक्र की योजना बनाएं.", sections: [
      { title: "1. खेत की स्थिति समझें", intro: "बीज चुनने से पहले खेत और उसकी जरूरतों को समझें.", points: [
        "खेत का रकबा, ढलान, जल निकास, पिछली फसल और सिंचाई की उपलब्धता लिखें.",
        "स्थानीय वर्षा, तापमान तथा पाला या गर्मी के जोखिम की जानकारी लें.",
        "मजदूरी, मशीन, भंडारण, परिवहन और बाजार की मांग पर विचार करें.",
        "अपने क्षेत्र के लिए उपयुक्त फसल और किस्म की जानकारी KVK या कृषि कार्यालय से लें.",
      ] },
      { title: "2. फसल और किस्म चुनें", intro: "ऐसी फसल चुनें जिसकी जरूरतें उपलब्ध संसाधनों से पूरी हो सकें.", points: [
        "फसल की अवधि, पानी की जरूरत, रोग प्रतिरोध, कटाई का समय और खरीदार की उपलब्धता देखें.",
        "अपने कृषि-जलवायु क्षेत्र और मौसम के लिए अनुशंसित किस्म चुनें.",
        "जहां संभव हो फसल विविधता रखें और पूरा जोखिम एक ही फसल पर न डालें.",
        "अधिकृत स्रोत से प्रमाणित बीज लें और रसीद तथा बीज का लेबल सुरक्षित रखें.",
      ] },
      { title: "3. खेत तैयार करें और बुवाई करें", intro: "मिट्टी की संरचना और नमी बचाते हुए उपयुक्त बीज-बिस्तर तैयार करें.", points: [
        "खरपतवार का उचित प्रबंधन करें; फसल अवशेष न जलाएं.",
        "मिट्टी जांच के आधार पर सुधार करें, अनुमान से खाद न डालें.",
        "फसल और किस्म के अनुसार स्थानीय बुवाई समय, बीज दर, दूरी और गहराई अपनाएं.",
        "बुवाई से पहले बीज अंकुरण जांचें और मशीन की सेटिंग सही करें.",
      ] },
      { title: "4. बढ़ती फसल की देखभाल", intro: "खेत का नियमित निरीक्षण करें और जरूरत के अनुसार कदम उठाएं.", points: [
        "अंकुरण, पौधों की संख्या, खरपतवार, नमी और पोषक तत्वों के लक्षण देखें.",
        "सिंचाई फसल की अवस्था, मिट्टी की नमी और मौसम देखकर करें.",
        "बुवाई, सिंचाई, खाद, मजदूरी, लागत और कीट निरीक्षण का रिकॉर्ड रखें.",
        "खाद या पौध संरक्षण में बदलाव से पहले स्थानीय विशेषज्ञ की सलाह लें.",
      ] },
      { title: "5. कटाई और समीक्षा", intro: "सही परिपक्वता पर कटाई करें और अगले मौसम के लिए अनुभव दर्ज करें.", points: [
        "फसल के अनुसार पकने के संकेत देखें और बहुत गीली उपज की कटाई से बचें.",
        "उपज को सुखाएं, साफ करें, छांटें और नमी, कीट तथा गंदगी से सुरक्षित रखें.",
        "उपज, गुणवत्ता, लागत और बिक्री मूल्य की तुलना योजना से करें.",
        "अगले मौसम के लिए फसल, समय और तरीकों में जरूरी सुधार लिखें.",
      ] },
    ] },
    hinglish: { title: "Fasal planning aur kheti", summary: "Local climate, mitti, paani, market aur available labour ke hisaab se crop cycle plan karein.", sections: [
      { title: "1. Apne khet ko samjhein", intro: "Seed catalogue dekhne se pehle field ki condition samjhein.", points: [
        "Field size, slope, drainage, pichhli fasal aur irrigation availability note karein.",
        "Local rainfall, temperature aur frost ya heat risk check karein.",
        "Labour, machinery, storage, transport aur market demand consider karein.",
        "Apne block ke liye suitable crops aur varieties KVK ya agriculture office se poochhein.",
      ] },
      { title: "2. Crop aur variety choose karein", intro: "Wahi crop choose karein jiske resources aap reliably manage kar sakte hain.", points: [
        "Duration, water need, disease resistance, harvest time aur buyer access compare karein.",
        "Apne agro-climatic zone aur season ke liye recommended variety choose karein.",
        "Possible ho to crop diversification rakhein; saara risk ek crop par na rakhein.",
        "Authorised source se certified seed lein aur bill aur seed label sambhal kar rakhein.",
      ] },
      { title: "3. Field prepare karein aur sowing karein", intro: "Soil structure aur moisture ko bachate hue seedbed taiyar karein.", points: [
        "Weeds ka sahi management karein; crop residue ko burn na karein.",
        "Soil test ke basis par amendments plan karein, guesswork se inputs na daalein.",
        "Crop aur variety ke hisaab se local sowing window, seed rate, spacing aur depth follow karein.",
        "Sowing se pehle germination check karein aur seed drill ki setting calibrate karein.",
      ] },
      { title: "4. Growing crop manage karein", intro: "Field ko regularly inspect karein aur crop ki changing needs par action lein.", points: [
        "Emergence, plant population, weeds, moisture aur nutrient symptoms check karein.",
        "Irrigation crop stage, soil moisture aur weather ke hisaab se karein.",
        "Sowing, irrigation, inputs, labour, pest observations aur costs ka record rakhein.",
        "Nutrient ya plant-protection practice badalne se pehle local expert se advice lein.",
      ] },
      { title: "5. Harvest aur review", intro: "Sahi maturity par harvest karein aur next season ke liye learning note karein.", points: [
        "Crop-specific maturity signs follow karein; bahut wet produce harvest na karein.",
        "Produce ko dry, clean, grade aur safely store karein; moisture aur pests se bachayein.",
        "Yield, quality, costs aur sale price ko original plan se compare karein.",
        "Next season ke crop choice, timing aur practices ke improvements note karein.",
      ] },
    ] },
  },
  soil: {
    en: { title: "Soil health & nutrients", summary: "Build soil fertility through testing, balanced nutrition, organic matter and careful field observation.", sections: [
      { title: "1. Test before treating", intro: "A soil test helps identify what the field needs.", points: [
        "Collect a representative sample using the local laboratory's sampling instructions.",
        "Sample separate fields or visibly different soil areas separately.",
        "Use a recognised soil testing laboratory and keep the report with field records.",
        "Check pH, electrical conductivity and nutrients reported; ask for help interpreting unfamiliar values.",
      ] },
      { title: "2. Read the soil health card", intro: "Use the card as a field-specific guide, not a generic fertilizer recipe.", points: [
        "Match the report to the correct field and crop.",
        "Compare nutrient status with the recommendations printed on the card.",
        "Follow local recommendations for the crop, yield target and season.",
        "Retest at the interval advised by the agriculture department or laboratory.",
      ] },
      { title: "3. Apply balanced nutrients", intro: "Supply nutrients according to crop need and soil-test advice.", points: [
        "Account for nutrients supplied by manure, compost, residues and previous crops.",
        "Apply the right source, dose, time and placement recommended locally.",
        "Avoid excessive nitrogen; it can increase lodging, losses and pest or disease pressure.",
        "Do not mix or apply products unless the label or an expert confirms compatibility.",
      ] },
      { title: "4. Improve organic matter", intro: "Protect soil structure, biological activity and moisture retention.", points: [
        "Use well-decomposed farmyard manure or compost of known quality.",
        "Retain or incorporate crop residues where locally appropriate and safe.",
        "Use legumes, cover crops or green manures when suitable for the rotation.",
        "Prevent erosion, compaction and prolonged bare-soil exposure.",
      ] },
      { title: "5. Monitor and maintain", intro: "Review soil and crop response over time.", points: [
        "Watch for uneven growth, leaf symptoms, crusting, waterlogging and erosion.",
        "Keep records of test results, amendments, fertilizer use and crop response.",
        "Use micronutrients only when deficiency is diagnosed or locally recommended.",
        "Consult KVK or the soil testing laboratory before corrective applications.",
      ] },
    ] },
    hi: { title: "मिट्टी का स्वास्थ्य और पोषक तत्व", summary: "मिट्टी जांच, संतुलित पोषण, जैविक पदार्थ और खेत के निरीक्षण से मिट्टी की उर्वरता बढ़ाएं.", sections: [
      { title: "1. उपचार से पहले मिट्टी जांचें", intro: "मिट्टी जांच से खेत की वास्तविक जरूरत समझने में मदद मिलती है.", points: [
        "स्थानीय प्रयोगशाला के निर्देश के अनुसार प्रतिनिधि नमूना लें.",
        "अलग खेतों या अलग मिट्टी वाले हिस्सों के नमूने अलग रखें.",
        "मान्यता प्राप्त मिट्टी जांच प्रयोगशाला से जांच कराएं और रिपोर्ट सुरक्षित रखें.",
        "रिपोर्ट में pH, लवणता और पोषक तत्व देखें; समझ न आए तो सहायता लें.",
      ] },
      { title: "2. मृदा स्वास्थ्य कार्ड पढ़ें", intro: "कार्ड को अपने खेत की सलाह मानें, सामान्य खाद नुस्खा नहीं.", points: [
        "रिपोर्ट सही खेत और फसल से संबंधित हो यह जांचें.",
        "पोषक तत्वों की स्थिति को कार्ड की सिफारिशों से मिलाएं.",
        "फसल, उपज लक्ष्य और मौसम के लिए स्थानीय सलाह अपनाएं.",
        "कृषि विभाग या प्रयोगशाला द्वारा बताई अवधि पर दोबारा जांच कराएं.",
      ] },
      { title: "3. संतुलित पोषक तत्व दें", intro: "मिट्टी जांच और फसल की जरूरत के अनुसार पोषण दें.", points: [
        "गोबर खाद, कम्पोस्ट, फसल अवशेष और पिछली फसल से मिले पोषक तत्व भी गिनें.",
        "सही स्रोत, मात्रा, समय और स्थान पर खाद डालने की स्थानीय सलाह मानें.",
        "नाइट्रोजन का जरूरत से ज्यादा उपयोग न करें; इससे गिरना और नुकसान बढ़ सकता है.",
        "लेबल या विशेषज्ञ की पुष्टि के बिना उत्पादों को मिलाकर न डालें.",
      ] },
      { title: "4. जैविक पदार्थ बढ़ाएं", intro: "मिट्टी की संरचना, जैविक गतिविधि और नमी धारण क्षमता सुधारें.", points: [
        "अच्छी तरह सड़ी और गुणवत्तापूर्ण गोबर खाद या कम्पोस्ट उपयोग करें.",
        "जहां उपयुक्त और सुरक्षित हो वहां फसल अवशेष खेत में रखें या मिलाएं.",
        "फसल चक्र में दलहनी, कवर या हरी खाद वाली फसलें शामिल करें.",
        "मिट्टी कटाव, दबाव और लंबे समय तक खाली मिट्टी रहने से बचाएं.",
      ] },
      { title: "5. निगरानी और रखरखाव", intro: "समय के साथ मिट्टी और फसल की प्रतिक्रिया देखें.", points: [
        "असमान बढ़वार, पत्तियों के लक्षण, पपड़ी, जलभराव और कटाव देखें.",
        "जांच रिपोर्ट, सुधार, खाद और फसल प्रतिक्रिया का रिकॉर्ड रखें.",
        "सूक्ष्म पोषक तत्व तभी दें जब कमी की पुष्टि हो या स्थानीय सलाह हो.",
        "सुधारात्मक खाद डालने से पहले KVK या प्रयोगशाला से सलाह लें.",
      ] },
    ] },
    hinglish: { title: "Soil health aur nutrients", summary: "Soil testing, balanced nutrition, organic matter aur field observation se mitti ki fertility improve karein.", sections: [
      { title: "1. Treatment se pehle soil test", intro: "Soil test se field ki actual requirement samajh aati hai.", points: [
        "Local lab ki sampling instructions follow karke representative sample lein.",
        "Alag fields ya different soil patches ke samples alag rakhein.",
        "Recognised soil testing lab se test karayein aur report save karein.",
        "Report mein pH, salinity aur nutrients dekhein; values samajh na aayein to help lein.",
      ] },
      { title: "2. Soil Health Card samjhein", intro: "Card ko apne field ki guidance samjhein, generic fertilizer formula nahi.", points: [
        "Confirm karein ki report correct field aur crop ki hai.",
        "Nutrient status ko card ki recommendations se compare karein.",
        "Crop, yield target aur season ke liye local recommendation follow karein.",
        "Agriculture department ya lab ke suggested interval par retest karein.",
      ] },
      { title: "3. Balanced nutrients dein", intro: "Crop need aur soil-test advice ke basis par nutrients supply karein.", points: [
        "Manure, compost, residues aur previous crop se mile nutrients ko account karein.",
        "Recommended source, dose, timing aur placement follow karein.",
        "Nitrogen overuse na karein; lodging, nutrient loss aur pest pressure badh sakta hai.",
        "Label ya expert confirmation ke bina products mix na karein.",
      ] },
      { title: "4. Organic matter badhayein", intro: "Soil structure, biological activity aur moisture retention protect karein.", points: [
        "Well-decomposed farmyard manure ya good-quality compost use karein.",
        "Locally suitable ho to crop residues retain ya incorporate karein.",
        "Rotation mein legumes, cover crops ya green manure include karein.",
        "Soil erosion, compaction aur long bare-soil exposure avoid karein.",
      ] },
      { title: "5. Monitor aur maintain karein", intro: "Time ke saath soil aur crop response review karein.", points: [
        "Uneven growth, leaf symptoms, crusting, waterlogging aur erosion observe karein.",
        "Soil reports, amendments, fertilizer use aur crop response ka record rakhein.",
        "Micronutrients tabhi use karein jab deficiency confirm ho ya local advice ho.",
        "Corrective application se pehle KVK ya soil lab se consult karein.",
      ] },
    ] },
  },
  water: {
    en: { title: "Water & irrigation", summary: "Use water efficiently by matching irrigation to crop stage, soil moisture, field conditions and local weather.", sections: [
      { title: "1. Understand water needs", intro: "Water needs differ by crop, soil, growth stage and weather.", points: [
        "Identify the crop's sensitive growth stages using local crop guidance.",
        "Check soil texture, rooting depth, drainage and water availability.",
        "Observe rainfall forecasts and avoid unnecessary irrigation before expected rain.",
        "Do not assume every field needs the same interval or quantity.",
      ] },
      { title: "2. Choose an irrigation method", intro: "Select a method suited to the crop, field and available resources.", points: [
        "Surface irrigation may suit some level fields but needs careful distribution.",
        "Drip irrigation can deliver water near roots and may suit row crops or orchards.",
        "Sprinklers can suit selected crops and soils; consider wind and evaporation.",
        "Compare installation, energy, maintenance, filtration and subsidy conditions before purchase.",
      ] },
      { title: "3. Schedule irrigation", intro: "Use field observations rather than a rigid calendar alone.", points: [
        "Check soil moisture at root depth and observe crop stress early.",
        "Give priority to critical growth stages identified for the crop locally.",
        "Irrigate at cooler times where practical to reduce evaporation losses.",
        "Avoid over-irrigation that causes waterlogging, nutrient leaching or root disease.",
      ] },
      { title: "4. Conserve and drain water", intro: "Keep water where crops can use it and remove excess safely.", points: [
        "Repair leaks, maintain channels and use field levelling where appropriate.",
        "Use mulch or residue cover where suitable to reduce evaporation.",
        "Provide drainage outlets before heavy rain in waterlogging-prone fields.",
        "Consider farm ponds or rainwater harvesting only after checking design and local permissions.",
      ] },
      { title: "5. Maintain systems safely", intro: "Regular maintenance protects water quality and equipment life.", points: [
        "Clean filters and inspect emitters, pipes, pumps and electrical connections.",
        "Use only recommended water-treatment and fertigation procedures.",
        "Protect wells and water sources from fuel, chemicals and waste contamination.",
        "Seek local technical advice for pump sizing and system repairs.",
      ] },
    ] },
    hi: { title: "पानी और सिंचाई", summary: "फसल की अवस्था, मिट्टी की नमी, खेत और स्थानीय मौसम के अनुसार सिंचाई करके पानी बचाएं.", sections: [
      { title: "1. पानी की जरूरत समझें", intro: "फसल, मिट्टी, बढ़वार की अवस्था और मौसम के अनुसार पानी की जरूरत बदलती है.", points: [
        "स्थानीय फसल सलाह से पानी की संवेदनशील अवस्थाएं पहचानें.",
        "मिट्टी का प्रकार, जड़ों की गहराई, जल निकास और पानी की उपलब्धता देखें.",
        "बारिश का पूर्वानुमान देखें और बारिश से ठीक पहले अनावश्यक सिंचाई न करें.",
        "हर खेत के लिए एक जैसा अंतराल या मात्रा न मानें.",
      ] },
      { title: "2. सिंचाई विधि चुनें", intro: "फसल, खेत और उपलब्ध संसाधनों के अनुसार तरीका चुनें.", points: [
        "समतल खेतों में सतही सिंचाई उपयोगी हो सकती है, लेकिन पानी का समान वितरण जरूरी है.",
        "ड्रिप से जड़ों के पास पानी दिया जा सकता है; यह कतार वाली फसलों और बागों में उपयोगी हो सकती है.",
        "स्प्रिंकलर कुछ फसलों और मिट्टियों के लिए उपयुक्त है; हवा और वाष्पीकरण देखें.",
        "खरीद से पहले लागत, ऊर्जा, रखरखाव, फिल्टर और सब्सिडी की शर्तें जांचें.",
      ] },
      { title: "3. सिंचाई का समय तय करें", intro: "केवल तय कैलेंडर नहीं, खेत का निरीक्षण भी करें.", points: [
        "जड़ों की गहराई पर नमी जांचें और तनाव के शुरुआती संकेत देखें.",
        "फसल की स्थानीय रूप से बताई महत्वपूर्ण अवस्थाओं को प्राथमिकता दें.",
        "संभव हो तो कम गर्म समय में सिंचाई करें ताकि वाष्पीकरण घटे.",
        "अधिक पानी से जलभराव, पोषक तत्वों का बहाव और जड़ रोग हो सकते हैं.",
      ] },
      { title: "4. पानी बचाएं और निकास रखें", intro: "पानी को फसल के उपयोग में रखें और अतिरिक्त पानी सुरक्षित निकालें.", points: [
        "रिसाव ठीक करें, नालियों की देखभाल करें और जरूरत पर खेत समतल करें.",
        "उपयुक्त होने पर मल्च या फसल अवशेष से वाष्पीकरण घटाएं.",
        "जलभराव वाले खेतों में भारी बारिश से पहले निकास व्यवस्था रखें.",
        "तालाब या वर्षा जल संचयन से पहले डिजाइन और स्थानीय अनुमति जांचें.",
      ] },
      { title: "5. प्रणाली की सुरक्षित देखभाल", intro: "नियमित रखरखाव से पानी की गुणवत्ता और उपकरण सुरक्षित रहते हैं.", points: [
        "फिल्टर साफ करें और ड्रिपर, पाइप, पंप तथा बिजली कनेक्शन जांचें.",
        "पानी उपचार और फर्टिगेशन की केवल अनुशंसित प्रक्रिया अपनाएं.",
        "कुएं और जल स्रोत को ईंधन, रसायन और कचरे से दूषित न होने दें.",
        "पंप क्षमता और मरम्मत के लिए स्थानीय तकनीकी सलाह लें.",
      ] },
    ] },
    hinglish: { title: "Water aur irrigation", summary: "Crop stage, soil moisture, field condition aur local weather ke hisaab se irrigation karke paani efficiently use karein.", sections: [
      { title: "1. Water requirement samjhein", intro: "Crop, soil, growth stage aur weather ke hisaab se paani ki need badalti hai.", points: [
        "Local crop guidance se sensitive growth stages identify karein.",
        "Soil texture, root depth, drainage aur water availability check karein.",
        "Rain forecast dekhein aur expected rain se pehle unnecessary irrigation avoid karein.",
        "Har field ke liye same interval ya quantity assume na karein.",
      ] },
      { title: "2. Irrigation method choose karein", intro: "Crop, field aur available resources ke suitable method ko select karein.", points: [
        "Level fields mein surface irrigation useful ho sakti hai, lekin distribution uniform rakhein.",
        "Drip roots ke paas water deti hai aur row crops ya orchards ke liye useful ho sakti hai.",
        "Sprinkler selected crops aur soils ke liye suitable ho sakta hai; wind aur evaporation consider karein.",
        "Purchase se pehle cost, energy, maintenance, filtration aur subsidy conditions compare karein.",
      ] },
      { title: "3. Irrigation schedule karein", intro: "Sirf fixed calendar nahi, field observation bhi use karein.", points: [
        "Root zone par soil moisture check karein aur early crop stress observe karein.",
        "Crop ki locally identified critical stages ko priority dein.",
        "Possible ho to cooler time par irrigation karein taaki evaporation kam ho.",
        "Over-irrigation se waterlogging, nutrient leaching aur root disease ho sakti hai.",
      ] },
      { title: "4. Water conserve aur drainage karein", intro: "Paani ko crop ke kaam mein rakhein aur excess water safely remove karein.", points: [
        "Leaks repair karein, channels maintain karein aur zarurat par land levelling karein.",
        "Suitable ho to mulch ya residue cover se evaporation reduce karein.",
        "Waterlogging-prone fields mein heavy rain se pehle drainage outlets rakhein.",
        "Farm pond ya rainwater harvesting se pehle design aur local permission check karein.",
      ] },
      { title: "5. System safely maintain karein", intro: "Regular maintenance se water quality aur equipment life protect hoti hai.", points: [
        "Filters clean karein aur emitters, pipes, pumps aur electrical connections inspect karein.",
        "Recommended water treatment aur fertigation procedure hi follow karein.",
        "Wells aur water sources ko fuel, chemicals aur waste contamination se bachayein.",
        "Pump sizing aur repairs ke liye local technical advice lein.",
      ] },
    ] },
  },
  pest: {
    en: { title: "Pest & disease management", summary: "Protect crops through regular scouting, prevention, correct identification and integrated pest management.", sections: [
      { title: "1. Scout and identify", intro: "Correct identification is the first step; not every leaf mark is a pest or disease.", points: [
        "Inspect plants regularly, including leaf undersides, stems, roots and field edges.",
        "Record the crop stage, affected area, symptoms and whether damage is spreading.",
        "Compare symptoms with trusted KVK or state agriculture guidance; use clear photos if seeking advice.",
        "Do not spray based only on an unverified social-media message or a single symptom.",
      ] },
      { title: "2. Prevent problems", intro: "Healthy crop practices reduce the chance and impact of outbreaks.", points: [
        "Use locally recommended resistant varieties and healthy certified seed.",
        "Follow crop rotation, timely sowing, field sanitation and balanced nutrition.",
        "Manage weeds and alternate host plants where recommended.",
        "Avoid excessive irrigation or nitrogen that can favour some diseases and pests.",
      ] },
      { title: "3. Use integrated pest management", intro: "Combine monitoring, cultural, mechanical, biological and need-based chemical measures.", points: [
        "Use traps, hand removal or barriers where suitable and recommended.",
        "Conserve beneficial insects and use biological controls from reliable sources.",
        "Act when local economic-threshold or advisory guidance indicates intervention is needed.",
        "Choose only a registered product approved for the crop and target pest.",
      ] },
      { title: "4. Apply plant-protection products safely", intro: "The product label and local official advice must guide every application.", points: [
        "Read the label for crop, target pest, dose, water volume, timing, protective equipment and waiting period.",
        "Never exceed label dose or mix products unless the label permits it.",
        "Wear required protective clothing; keep children, livestock and bystanders away.",
        "Avoid spraying in strong wind, imminent rain or conditions that increase drift; protect water bodies.",
      ] },
      { title: "5. Review and seek help", intro: "Check whether the action worked and prevent repeat problems.", points: [
        "Reinspect at the interval advised on the label or by the local expert.",
        "Record product name, batch, date, field, dose and observed result.",
        "Follow the pre-harvest interval and dispose of containers as instructed; never reuse them.",
        "Contact KVK or the agriculture department for severe, unfamiliar or rapidly spreading damage.",
      ] },
    ] },
    hi: { title: "कीट और रोग प्रबंधन", summary: "नियमित निरीक्षण, रोकथाम, सही पहचान और समेकित कीट प्रबंधन से फसल की सुरक्षा करें.", sections: [
      { title: "1. निरीक्षण और पहचान", intro: "सही पहचान पहला कदम है; पत्ती का हर निशान कीट या रोग नहीं होता.", points: [
        "पौधों, पत्तियों की निचली सतह, तने, जड़ों और खेत के किनारों की नियमित जांच करें.",
        "फसल की अवस्था, प्रभावित क्षेत्र, लक्षण और नुकसान बढ़ रहा है या नहीं, लिखें.",
        "विश्वसनीय KVK या राज्य कृषि सलाह से लक्षण मिलाएं; सलाह लेते समय साफ फोटो दें.",
        "केवल सोशल मीडिया संदेश या एक लक्षण के आधार पर छिड़काव न करें.",
      ] },
      { title: "2. समस्या की रोकथाम करें", intro: "स्वस्थ खेती से प्रकोप की संभावना और असर कम हो सकता है.", points: [
        "स्थानीय रूप से अनुशंसित रोगरोधी किस्म और स्वस्थ प्रमाणित बीज लें.",
        "फसल चक्र, समय पर बुवाई, खेत की सफाई और संतुलित पोषण अपनाएं.",
        "सलाह के अनुसार खरपतवार और वैकल्पिक पोषक पौधों का प्रबंधन करें.",
        "अधिक सिंचाई या नाइट्रोजन से बचें, क्योंकि कुछ रोग और कीट बढ़ सकते हैं.",
      ] },
      { title: "3. समेकित कीट प्रबंधन अपनाएं", intro: "निरीक्षण, कृषि तरीके, यांत्रिक, जैविक और जरूरत आधारित रासायनिक उपाय मिलाएं.", points: [
        "उपयुक्त और अनुशंसित होने पर ट्रैप, हाथ से हटाना या अवरोध अपनाएं.",
        "लाभकारी कीटों को बचाएं और विश्वसनीय स्रोत के जैविक नियंत्रण अपनाएं.",
        "स्थानीय आर्थिक सीमा या सलाह पर ही उपचार का निर्णय लें.",
        "फसल और लक्षित कीट के लिए पंजीकृत उत्पाद ही चुनें.",
      ] },
      { title: "4. पौध संरक्षण उत्पाद सुरक्षित लगाएं", intro: "हर छिड़काव में उत्पाद का लेबल और स्थानीय आधिकारिक सलाह मानें.", points: [
        "फसल, कीट, मात्रा, पानी, समय, सुरक्षा उपकरण और प्रतीक्षा अवधि लेबल पर पढ़ें.",
        "लेबल से अधिक मात्रा न लें और अनुमति के बिना उत्पाद न मिलाएं.",
        "जरूरी सुरक्षा कपड़े पहनें; बच्चों, पशुओं और अन्य लोगों को दूर रखें.",
        "तेज हवा या बारिश की आशंका में छिड़काव न करें; जल स्रोतों को बचाएं.",
      ] },
      { title: "5. परिणाम देखें और सहायता लें", intro: "उपाय का असर जांचें और दोबारा समस्या रोकें.", points: [
        "लेबल या विशेषज्ञ द्वारा बताई अवधि पर खेत का दोबारा निरीक्षण करें.",
        "उत्पाद, बैच, तारीख, खेत, मात्रा और परिणाम का रिकॉर्ड रखें.",
        "कटाई से पहले प्रतीक्षा अवधि मानें और खाली डिब्बों का निर्देशानुसार निपटान करें.",
        "गंभीर, अनजान या तेजी से फैलते नुकसान पर KVK या कृषि विभाग से संपर्क करें.",
      ] },
    ] },
    hinglish: { title: "Pest aur disease management", summary: "Regular scouting, prevention, correct identification aur integrated pest management se crop protect karein.", sections: [
      { title: "1. Scout aur identify karein", intro: "Correct identification first step hai; har leaf mark pest ya disease nahi hota.", points: [
        "Plants, leaf undersides, stems, roots aur field edges regularly inspect karein.",
        "Crop stage, affected area, symptoms aur damage spread ho raha hai ya nahi note karein.",
        "Trusted KVK ya state agriculture guidance se symptoms compare karein; advice ke liye clear photos lein.",
        "Unverified social media message ya single symptom par spray na karein.",
      ] },
      { title: "2. Problems prevent karein", intro: "Healthy crop practices outbreak ka chance aur impact reduce kar sakti hain.", points: [
        "Locally recommended resistant varieties aur healthy certified seed use karein.",
        "Crop rotation, timely sowing, field sanitation aur balanced nutrition follow karein.",
        "Recommendation ke hisaab se weeds aur alternate host plants manage karein.",
        "Excess irrigation ya nitrogen avoid karein jo kuch pests aur diseases ko favour kar sakte hain.",
      ] },
      { title: "3. Integrated pest management use karein", intro: "Monitoring, cultural, mechanical, biological aur need-based chemical methods combine karein.", points: [
        "Suitable ho to traps, hand removal ya barriers use karein.",
        "Beneficial insects conserve karein aur reliable biological controls use karein.",
        "Local economic threshold ya advisory intervention suggest kare tab action lein.",
        "Crop aur target pest ke liye registered product hi choose karein.",
      ] },
      { title: "4. Plant protection safely apply karein", intro: "Har application mein product label aur local official advice follow karein.", points: [
        "Label par crop, target pest, dose, water volume, timing, PPE aur waiting period read karein.",
        "Label dose exceed na karein aur permission ke bina products mix na karein.",
        "Required protective clothing pehnein; children, livestock aur bystanders ko door rakhein.",
        "Strong wind ya rain ke time spray avoid karein; water bodies protect karein.",
      ] },
      { title: "5. Review aur expert help lein", intro: "Action ka result check karein aur repeat problem prevent karein.", points: [
        "Label ya local expert ke advised interval par field re-inspect karein.",
        "Product, batch, date, field, dose aur result ka record rakhein.",
        "Pre-harvest interval follow karein aur containers ko instructions ke hisaab se dispose karein.",
        "Severe, unknown ya fast-spreading damage par KVK ya agriculture department se contact karein.",
      ] },
    ] },
  },
  seeds: {
    en: { title: "Seeds & farm machinery", summary: "Choose quality seed and suitable equipment, and maintain both for reliable and safe farm operations.", sections: [
      { title: "1. Buy quality seed", intro: "Seed quality influences crop establishment and uniformity.", points: [
        "Buy certified or truthfully labelled seed from authorised dealers or recognised sources.",
        "Check crop, variety, lot number, germination, purity, packing and validity details on the label.",
        "Keep the bill, tag and package details until the crop is established.",
        "Choose varieties recommended for the region and season; avoid unknown loose seed.",
      ] },
      { title: "2. Store and prepare seed", intro: "Protect seed viability before sowing.", points: [
        "Store in a cool, dry, clean and pest-protected place as directed on the package.",
        "Keep seed bags off the floor and away from chemicals, fuel and direct moisture.",
        "Use only crop-specific seed treatment recommended by official guidance and product labels.",
        "Wear protection and never use treated seed for food, feed or oil.",
      ] },
      { title: "3. Select machinery", intro: "Match equipment to farm size, crop, soil and service availability.", points: [
        "Compare ownership, rental and custom-hiring options before purchasing.",
        "Check field capacity, power requirement, fuel or electricity, spare parts and service support.",
        "Verify safety guards, brakes, lights and operator training.",
        "Check current subsidy eligibility and approved dealer or model lists on official portals.",
      ] },
      { title: "4. Operate safely", intro: "Safe operation prevents injury and equipment damage.", points: [
        "Read the operator manual and switch off the machine before clearing blockages or servicing.",
        "Keep children and bystanders away from moving parts and operating areas.",
        "Use suitable footwear and protective equipment; do not wear loose clothing near rotating parts.",
        "Do not overload machinery or operate on unsafe slopes or wet ground.",
      ] },
      { title: "5. Maintain and keep records", intro: "Regular care extends equipment life and supports repair decisions.", points: [
        "Follow service intervals for oil, filters, belts, tyres, blades and batteries.",
        "Clean equipment after use and store it under cover where possible.",
        "Record purchase, warranty, service, repair and operating costs.",
        "Use trained technicians for complex repairs and safe disposal of used oil or batteries.",
      ] },
    ] },
    hi: { title: "बीज और कृषि मशीनरी", summary: "अच्छी गुणवत्ता के बीज और उपयुक्त मशीन चुनें तथा सुरक्षित उपयोग और रखरखाव करें.", sections: [
      { title: "1. गुणवत्तापूर्ण बीज खरीदें", intro: "बीज की गुणवत्ता से फसल का अंकुरण और समान बढ़वार प्रभावित होती है.", points: [
        "अधिकृत विक्रेता या मान्यता प्राप्त स्रोत से प्रमाणित अथवा सही लेबल वाला बीज लें.",
        "लेबल पर फसल, किस्म, लॉट नंबर, अंकुरण, शुद्धता, पैकिंग और वैधता जांचें.",
        "फसल जमने तक बिल, टैग और पैकेट का विवरण सुरक्षित रखें.",
        "क्षेत्र और मौसम के लिए अनुशंसित किस्म लें; अनजान खुला बीज न खरीदें.",
      ] },
      { title: "2. बीज का भंडारण और तैयारी", intro: "बुवाई तक बीज की गुणवत्ता बनाए रखें.", points: [
        "पैकेट के निर्देश के अनुसार ठंडी, सूखी, साफ और कीट-सुरक्षित जगह रखें.",
        "बीज की बोरियां जमीन से ऊपर रखें और रसायन, ईंधन तथा नमी से दूर रखें.",
        "केवल आधिकारिक सलाह और उत्पाद लेबल के अनुसार फसल-विशिष्ट बीज उपचार करें.",
        "सुरक्षा उपकरण पहनें और उपचारित बीज भोजन, चारे या तेल के लिए उपयोग न करें.",
      ] },
      { title: "3. मशीनरी चुनें", intro: "खेत के आकार, फसल, मिट्टी और सेवा उपलब्धता के अनुसार मशीन लें.", points: [
        "खरीदने से पहले मालिकाना, किराये और कस्टम हायरिंग विकल्प तुलना करें.",
        "क्षमता, शक्ति, ईंधन या बिजली, स्पेयर पार्ट्स और सर्विस सहायता जांचें.",
        "सुरक्षा गार्ड, ब्रेक, लाइट और ऑपरेटर प्रशिक्षण सुनिश्चित करें.",
        "सब्सिडी पात्रता और अनुमोदित विक्रेता या मॉडल की सूची आधिकारिक पोर्टल पर जांचें.",
      ] },
      { title: "4. सुरक्षित संचालन करें", intro: "सुरक्षित उपयोग से चोट और मशीन का नुकसान रोका जा सकता है.", points: [
        "मैनुअल पढ़ें; जाम हटाने या मरम्मत से पहले मशीन बंद करें.",
        "चलते पुर्जों और कार्य क्षेत्र से बच्चों तथा अन्य लोगों को दूर रखें.",
        "उपयुक्त जूते और सुरक्षा उपकरण पहनें; घूमते पुर्जों के पास ढीले कपड़े न पहनें.",
        "मशीन पर अधिक भार न डालें और असुरक्षित ढलान या गीली जमीन पर न चलाएं.",
      ] },
      { title: "5. रखरखाव और रिकॉर्ड रखें", intro: "नियमित देखभाल से मशीन की आयु और काम की गुणवत्ता बढ़ती है.", points: [
        "तेल, फिल्टर, बेल्ट, टायर, ब्लेड और बैटरी की सर्विस समय पर करें.",
        "उपयोग के बाद मशीन साफ करें और संभव हो तो ढककर रखें.",
        "खरीद, वारंटी, सर्विस, मरम्मत और संचालन लागत का रिकॉर्ड रखें.",
        "जटिल मरम्मत प्रशिक्षित तकनीशियन से कराएं और पुराने तेल या बैटरी का सुरक्षित निपटान करें.",
      ] },
    ] },
    hinglish: { title: "Seeds aur farm machinery", summary: "Quality seed aur suitable equipment choose karein, aur dono ka safe use aur maintenance karein.", sections: [
      { title: "1. Quality seed khareedein", intro: "Seed quality crop establishment aur uniform growth ko affect karti hai.", points: [
        "Authorised dealer ya recognised source se certified ya truthfully labelled seed khareedein.",
        "Label par crop, variety, lot number, germination, purity, packing aur validity check karein.",
        "Crop establish hone tak bill, tag aur packet details sambhal kar rakhein.",
        "Region aur season ke liye recommended variety choose karein; unknown loose seed avoid karein.",
      ] },
      { title: "2. Seed store aur prepare karein", intro: "Sowing se pehle seed viability protect karein.", points: [
        "Package instructions ke hisaab se cool, dry, clean aur pest-protected jagah store karein.",
        "Seed bags ko floor se upar rakhein aur chemicals, fuel aur moisture se door rakhein.",
        "Official guidance aur product label ke hisaab se crop-specific seed treatment karein.",
        "Protection use karein; treated seed ko food, feed ya oil ke liye kabhi use na karein.",
      ] },
      { title: "3. Machinery select karein", intro: "Farm size, crop, soil aur service availability ke hisaab se equipment choose karein.", points: [
        "Purchase se pehle ownership, rental aur custom-hiring options compare karein.",
        "Field capacity, power, fuel/electricity, spare parts aur service support check karein.",
        "Safety guards, brakes, lights aur operator training verify karein.",
        "Current subsidy eligibility aur approved dealer/model list official portal par check karein.",
      ] },
      { title: "4. Safely operate karein", intro: "Safe operation injury aur equipment damage prevent karta hai.", points: [
        "Operator manual read karein; blockage clear ya service se pehle machine switch off karein.",
        "Moving parts aur operating area se children aur bystanders ko door rakhein.",
        "Suitable footwear aur PPE use karein; rotating parts ke paas loose clothes na pehnein.",
        "Machinery overload na karein aur unsafe slope ya wet ground par operate na karein.",
      ] },
      { title: "5. Maintain karein aur records rakhein", intro: "Regular care equipment life badhati hai aur repair decisions easy banati hai.", points: [
        "Oil, filters, belts, tyres, blades aur batteries ke service intervals follow karein.",
        "Use ke baad equipment clean karein aur possible ho to covered jagah store karein.",
        "Purchase, warranty, service, repair aur operating costs record karein.",
        "Complex repairs trained technicians se karayein aur used oil/batteries safely dispose karein.",
      ] },
    ] },
  },
  insurance: {
    en: { title: "Insurance & risk management", summary: "Understand notified crop cover, protect farm records and act promptly when crop loss occurs.", sections: [
      { title: "1. Understand available cover", intro: "Insurance is subject to scheme rules, notified crops, areas, seasons and enrolment conditions.", points: [
        "Check whether your village or area and crop are notified for the season.",
        "Read the current policy or scheme notice for risks covered, exclusions and farmer share of premium.",
        "Confirm enrolment deadlines and whether cover is automatic or requires an application.",
        "Use the official scheme portal, insurer or agriculture office; do not rely on an agent's promise.",
      ] },
      { title: "2. Enrol accurately", intro: "Correct land, crop and bank details help avoid claim problems.", points: [
        "Enter the correct farmer identity, bank account, land/tenancy and sown-crop details through the prescribed channel.",
        "Check spelling, account number, IFSC, crop and area before submitting.",
        "Keep application acknowledgement, premium receipt and policy or enrolment number.",
        "Ask the authorised channel how tenant farmers or sharecroppers can enrol under current rules.",
      ] },
      { title: "3. Reduce farm risks", intro: "Risk reduction can limit losses even when insurance is available.", points: [
        "Use locally suitable varieties and follow timely sowing advice.",
        "Maintain drainage, water access and safe storage; plan for heat, drought or excess rain.",
        "Diversify crops or income where practical and protect essential farm equipment.",
        "Follow weather advisories from official agencies and take timely protective action.",
      ] },
      { title: "4. Report crop damage", intro: "Deadlines and reporting channels vary; act as soon as loss is noticed.", points: [
        "Contact the insurer, scheme helpline, local agriculture office or notified reporting channel promptly.",
        "Record the date, location, crop stage, affected area and likely cause of damage.",
        "Take clear photos or videos and preserve relevant field and purchase records.",
        "Follow current instructions for localised calamity or post-harvest loss reporting; keep the complaint reference.",
      ] },
      { title: "5. Follow the claim", intro: "Keep documents and track the official process.", points: [
        "Provide requested documents through the authorised channel and retain submission proof.",
        "Respond to inspection or verification requests within the stated timeframe.",
        "Track status using the official reference number or portal.",
        "For delay or dispute, use the insurer grievance route or official government grievance portal.",
      ] },
    ] },
    hi: { title: "बीमा और जोखिम प्रबंधन", summary: "अधिसूचित फसल बीमा समझें, खेत के रिकॉर्ड सुरक्षित रखें और नुकसान होने पर समय पर सूचना दें.", sections: [
      { title: "1. उपलब्ध बीमा समझें", intro: "बीमा योजना के नियम, अधिसूचित फसल, क्षेत्र, मौसम और नामांकन की शर्तों पर निर्भर है.", points: [
        "जांचें कि आपके गांव या क्षेत्र और फसल को इस मौसम के लिए अधिसूचित किया गया है या नहीं.",
        "वर्तमान योजना सूचना में कवर जोखिम, अपवाद और किसान प्रीमियम हिस्सा पढ़ें.",
        "नामांकन की अंतिम तारीख और बीमा अपने आप है या आवेदन जरूरी है, इसकी पुष्टि करें.",
        "आधिकारिक पोर्टल, बीमा कंपनी या कृषि कार्यालय से जानकारी लें; एजेंट के वादे पर निर्भर न रहें.",
      ] },
      { title: "2. सही जानकारी से नामांकन करें", intro: "सही जमीन, फसल और बैंक विवरण से दावा संबंधी समस्या कम होती है.", points: [
        "निर्धारित माध्यम से किसान पहचान, बैंक खाता, जमीन/किरायेदारी और बोई गई फसल का सही विवरण दें.",
        "जमा करने से पहले नाम, खाता नंबर, IFSC, फसल और रकबा जांचें.",
        "आवेदन रसीद, प्रीमियम भुगतान और पॉलिसी या नामांकन नंबर सुरक्षित रखें.",
        "वर्तमान नियमों में किरायेदार या बटाईदार किसान के नामांकन की प्रक्रिया अधिकृत माध्यम से पूछें.",
      ] },
      { title: "3. खेत के जोखिम घटाएं", intro: "बीमा होने पर भी जोखिम घटाने से नुकसान कम हो सकता है.", points: [
        "स्थानीय उपयुक्त किस्म और समय पर बुवाई की सलाह अपनाएं.",
        "जल निकास, पानी और सुरक्षित भंडारण रखें; गर्मी, सूखे या अधिक बारिश की तैयारी करें.",
        "जहां संभव हो फसल या आय के स्रोतों में विविधता रखें और जरूरी मशीन सुरक्षित रखें.",
        "आधिकारिक मौसम सलाह देखें और समय पर बचाव के कदम उठाएं.",
      ] },
      { title: "4. फसल नुकसान की सूचना दें", intro: "समय सीमा और सूचना का माध्यम अलग हो सकता है; नुकसान दिखते ही कार्रवाई करें.", points: [
        "बीमा कंपनी, योजना हेल्पलाइन, स्थानीय कृषि कार्यालय या अधिसूचित माध्यम से तुरंत संपर्क करें.",
        "नुकसान की तारीख, स्थान, फसल अवस्था, प्रभावित क्षेत्र और संभावित कारण लिखें.",
        "साफ फोटो या वीडियो लें और खेत तथा खरीद के रिकॉर्ड सुरक्षित रखें.",
        "स्थानीय आपदा या कटाई बाद नुकसान की मौजूदा सूचना प्रक्रिया अपनाएं और शिकायत नंबर रखें.",
      ] },
      { title: "5. दावे की स्थिति देखें", intro: "दस्तावेज सुरक्षित रखें और आधिकारिक प्रक्रिया का पालन करें.", points: [
        "मांगे गए दस्तावेज अधिकृत माध्यम से दें और जमा करने का प्रमाण रखें.",
        "निरीक्षण या सत्यापन के अनुरोध का तय समय में जवाब दें.",
        "आधिकारिक संदर्भ नंबर या पोर्टल से स्थिति जांचें.",
        "देरी या विवाद पर बीमा कंपनी की शिकायत व्यवस्था या सरकारी शिकायत पोर्टल का उपयोग करें.",
      ] },
    ] },
    hinglish: { title: "Insurance aur risk management", summary: "Notified crop cover samjhein, farm records safe rakhein aur crop loss hone par promptly report karein.", sections: [
      { title: "1. Available cover samjhein", intro: "Insurance scheme rules, notified crops, areas, season aur enrolment conditions par depend karta hai.", points: [
        "Check karein ki aapka village/area aur crop current season ke liye notified hai.",
        "Current scheme notice mein covered risks, exclusions aur farmer premium share read karein.",
        "Enrolment deadline aur cover automatic hai ya application required hai, confirm karein.",
        "Official portal, insurer ya agriculture office se verify karein; agent ke promise par depend na karein.",
      ] },
      { title: "2. Correct details se enrol karein", intro: "Correct land, crop aur bank details claim issues ko reduce karte hain.", points: [
        "Prescribed channel se farmer identity, bank account, land/tenancy aur sown crop details sahi enter karein.",
        "Submit se pehle name, account number, IFSC, crop aur area verify karein.",
        "Application acknowledgement, premium receipt aur policy/enrolment number save karein.",
        "Tenant farmers ya sharecroppers ke enrolment rules authorised channel se poochhein.",
      ] },
      { title: "3. Farm risks reduce karein", intro: "Insurance ke saath risk reduction bhi losses limit kar sakta hai.", points: [
        "Locally suitable varieties aur timely sowing advice follow karein.",
        "Drainage, water access aur safe storage maintain karein; heat, drought ya excess rain ke liye plan karein.",
        "Possible ho to crops ya income sources diversify karein aur essential equipment protect karein.",
        "Official weather advisories follow karein aur timely protective action lein.",
      ] },
      { title: "4. Crop damage report karein", intro: "Deadlines aur reporting channel vary karte hain; loss notice hote hi action lein.", points: [
        "Insurer, scheme helpline, local agriculture office ya notified reporting channel ko promptly contact karein.",
        "Damage date, location, crop stage, affected area aur likely cause note karein.",
        "Clear photos/videos lein aur field aur purchase records preserve karein.",
        "Local calamity ya post-harvest loss ke current reporting instructions follow karein; complaint reference save karein.",
      ] },
      { title: "5. Claim follow karein", intro: "Documents safe rakhein aur official process track karein.", points: [
        "Requested documents authorised channel se submit karein aur proof retain karein.",
        "Inspection ya verification request ka stated timeframe mein response dein.",
        "Official reference number ya portal se status track karein.",
        "Delay ya dispute ke liye insurer grievance route ya government grievance portal use karein.",
      ] },
    ] },
  },
};