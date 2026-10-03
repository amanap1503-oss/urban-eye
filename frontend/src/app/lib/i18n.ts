import { AUTO_TRANSLATIONS } from "./autoTranslations";

export type LanguageCode = "en" | "hi" | "mr" | "bn" | "ta" | "te" | "gu" | "kn" | "ml" | "pa";

export interface LanguageOption {
  code: LanguageCode;
  name: string;
  nativeName: string;
  speechLocale: string;
  flag: string;
}

export const LANGUAGES: LanguageOption[] = [
  { code: "en", name: "English", nativeName: "English", speechLocale: "en-IN", flag: "🇬🇧" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", speechLocale: "hi-IN", flag: "🇮🇳" },
  { code: "mr", name: "Marathi", nativeName: "मराठी", speechLocale: "mr-IN", flag: "🇮🇳" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা", speechLocale: "bn-IN", flag: "🇮🇳" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்", speechLocale: "ta-IN", flag: "🇮🇳" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు", speechLocale: "te-IN", flag: "🇮🇳" },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી", speechLocale: "gu-IN", flag: "🇮🇳" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ", speechLocale: "kn-IN", flag: "🇮🇳" },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം", speechLocale: "ml-IN", flag: "🇮🇳" },
  { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ", speechLocale: "pa-IN", flag: "🇮🇳" },
];

export const TRANSLATIONS: Record<LanguageCode, Record<string, string>> = {
  en: {
    // Navigation
    nav_dashboard: "Dashboard",
    nav_report: "Report Issue",
    nav_map: "City Map",
    nav_kanban: "Kanban",
    nav_admin: "AI Admin",
    nav_employee: "Field Staff",
    nav_rewards: "Rewards",
    nav_profile: "Profile",

    // Report Issue Form
    report_page_title: "Report a Civic Issue",
    report_page_subtitle: "Submit details, location, and photos to dispatch municipal resolution teams.",
    step_1: "Issue Details",
    step_2: "Location",
    step_3: "Photos",
    step_4: "Preview",
    step_5: "Submit",

    issue_title_label: "Issue Title",
    issue_title_placeholder: "e.g. Deep pothole on main road causing hazard",
    category_label: "Category",
    priority_label: "Priority",
    description_label: "Detailed Description",
    description_placeholder: "Describe the civic problem, exact landmarks, and safety concerns...",
    
    // Voice Recording
    voice_rec_title: "Optional Voice Note & Speech Input",
    voice_rec_subtitle: "Speak in your native language to auto-fill description or record a voice message",
    voice_start_rec: "Start Recording",
    voice_stop_rec: "Stop Recording",
    voice_recording: "Recording in progress...",
    voice_play_preview: "Play Recording",
    voice_pause_preview: "Pause",
    voice_delete_rec: "Remove Recording",
    voice_attached: "Voice recording attached",
    voice_transcribing: "Listening & Transcribing...",
    voice_not_supported: "Speech recognition not supported in this browser. You can still record audio.",

    // Categories
    cat_infrastructure: "Infrastructure",
    cat_safety: "Safety",
    cat_environment: "Environment",
    cat_utilities: "Utilities",
    cat_traffic: "Traffic",
    cat_public_spaces: "Public Spaces",

    // Priorities
    prio_low: "Low",
    prio_low_desc: "Minor inconvenience",
    prio_medium: "Medium",
    prio_medium_desc: "Affects some residents",
    prio_high: "High",
    prio_high_desc: "Significant impact",
    prio_critical: "Critical",
    prio_critical_desc: "Immediate danger",

    // Buttons
    btn_next: "Next Step",
    btn_back: "Back",
    btn_submit: "Submit Complaint",
    btn_submitting: "Submitting to Municipal AI...",
    btn_success: "Issue Reported Successfully!",
    btn_view_dashboard: "View on Dashboard",
    btn_report_another: "Report Another Issue",
    location_detect_gps: "Use Current GPS Location",
    location_pin_map: "Pin on Interactive Map",
    location_address_placeholder: "Enter address or landmark...",
    photos_upload_title: "Upload Photos / Proof",
    photos_drag_drop: "Drag & drop images here, or click to browse",

    // General UI
    select_language: "Select Language",
  },

  hi: {
    // Navigation
    nav_dashboard: "डैशबोर्ड",
    nav_report: "समस्या दर्ज करें",
    nav_map: "शहर का नक्शा",
    nav_kanban: "कार्य स्थिति",
    nav_admin: "एआई एडमिन",
    nav_employee: "फील्ड स्टाफ",
    nav_rewards: "पुरस्कार",
    nav_profile: "प्रोफाइल",

    // Report Issue Form
    report_page_title: "नागरिक समस्या की शिकायत दर्ज करें",
    report_page_subtitle: "नगर निगम टीम को त्वरित समाधान हेतु विवरण, स्थान और तस्वीरें भेजें।",
    step_1: "समस्या का विवरण",
    step_2: "स्थान",
    step_3: "तस्वीरें",
    step_4: "पूर्वावलोकन",
    step_5: "जमा करें",

    issue_title_label: "समस्या का शीर्षक",
    issue_title_placeholder: "उदा. मुख्य सड़क पर खतरनाक बड़ा गड्ढा",
    category_label: "श्रेणी",
    priority_label: "प्राथमिकता",
    description_label: "विस्तृत विवरण",
    description_placeholder: "समस्या, आसपास के मुख्य स्थान और सुरक्षा संबंधी चिंताओं का वर्णन करें...",

    // Voice Recording
    voice_rec_title: "वॉयस रिकॉर्डिंग एवं बोलकर लिखें (ऐच्छिक)",
    voice_rec_subtitle: "अपनी भाषा में बोलें और स्वतः विवरण लिखें या वॉयस मैसेज रिकॉर्ड करें",
    voice_start_rec: "रिकॉर्डिंग शुरू करें",
    voice_stop_rec: "रिकॉर्डिंग बंद करें",
    voice_recording: "रिकॉर्डिंग चालू है...",
    voice_play_preview: "रिकॉर्डिंग सुनें",
    voice_pause_preview: "रोकें",
    voice_delete_rec: "रिकॉर्डिंग हटाएं",
    voice_attached: "वॉयस रिकॉर्डिंग संलग्न है",
    voice_transcribing: "सुनकर लिखा जा रहा है...",
    voice_not_supported: "इस ब्राउज़र में वाक् पहचान उपलब्ध नहीं है। आप ऑडियो रिकॉर्ड कर सकते हैं।",

    // Categories
    cat_infrastructure: "बुनियादी ढांचा",
    cat_safety: "सुरक्षा",
    cat_environment: "पर्यावरण",
    cat_utilities: "जनसुविधाएं",
    cat_traffic: "यातायात",
    cat_public_spaces: "सार्वजनिक स्थल",

    // Priorities
    prio_low: "कम",
    prio_low_desc: "मामूली असुविधा",
    prio_medium: "मध्यम",
    prio_medium_desc: "कुछ निवासियों को प्रभावित करता है",
    prio_high: "उच्च",
    prio_high_desc: "महत्वपूर्ण प्रभाव",
    prio_critical: "गंभीर",
    prio_critical_desc: "तत्काल खतरा",

    // Buttons
    btn_next: "अगला चरण",
    btn_back: "पीछे जाएं",
    btn_submit: "शिकायत दर्ज करें",
    btn_submitting: "नगर निगम एआई को भेजा जा रहा है...",
    btn_success: "शिकायत सफलतापूर्वक दर्ज की गई!",
    btn_view_dashboard: "डैशबोर्ड पर देखें",
    btn_report_another: "दूसरी समस्या दर्ज करें",
    location_detect_gps: "वर्तमान जीपीएस लोकेशन का उपयोग करें",
    location_pin_map: "नक्शे पर स्थान चुनें",
    location_address_placeholder: "पता या लैंडमार्क दर्ज करें...",
    photos_upload_title: "तस्वीरें / प्रमाण अपलोड करें",
    photos_drag_drop: "तस्वीरें यहाँ खींचें या ब्राउज़ करने के लिए क्लिक करें",

    // General UI
    select_language: "भाषा चुनें",
  },

  mr: {
    // Navigation
    nav_dashboard: "डॅशबोर्ड",
    nav_report: "तक्रार नोंदवा",
    nav_map: "शहराचा नकाशा",
    nav_kanban: "कामकाज स्थिती",
    nav_admin: "एआय प्रशासन",
    nav_employee: "फील्ड कर्मचारी",
    nav_rewards: "बक्षीस",
    nav_profile: "प्रोफाइल",

    // Report Issue Form
    report_page_title: "नागरी समस्येची तक्रार नोंदवा",
    report_page_subtitle: "महानगरपालिका पथकास जलद निवारणासाठी तपशील, ठिकाण व फोटो पाठवा.",
    step_1: "समस्येचा तपशील",
    step_2: "ठिकाण",
    step_3: "फोटो",
    step_4: "पूर्वावलोकन",
    step_5: "सादर करा",

    issue_title_label: "समस्येचे नाव",
    issue_title_placeholder: "उदा. मुख्य रस्त्यावरील धोकादायक खड्डा",
    category_label: "वर्गवारी",
    priority_label: "प्राधान्य",
    description_label: "सविस्तर माहिती",
    description_placeholder: "नागरी समस्या, जवळपासच्या खुणा व सुरक्षिततेच्या संदर्भातील माहिती लिहा...",

    // Voice Recording
    voice_rec_title: "व्हॉईस रेकॉर्डिंग आणि बोलून माहिती भरण्याची सुविधा (ऐच्छिक)",
    voice_rec_subtitle: "तुमच्या भाषेत बोला आणि माहिती आपोआप टाईप करा किंवा व्हॉईस मेसेज रेकॉर्ड करा",
    voice_start_rec: "रेकॉर्डिंग सुरू करा",
    voice_stop_rec: "रेकॉर्डिंग थांबवा",
    voice_recording: "रेकॉर्डिंग सुरू आहे...",
    voice_play_preview: "रेकॉर्डिंग ऐका",
    voice_pause_preview: "थंबवा",
    voice_delete_rec: "रेकॉर्डिंग हटवा",
    voice_attached: "व्हॉईस रेकॉर्डिंग जोडले आहे",
    voice_transcribing: "ऐकून टाईप केले जात आहे...",
    voice_not_supported: "या ब्राउझरमध्ये व्हॉईस-टू-टेक्स्ट उपलब्ध नाही.",

    // Categories
    cat_infrastructure: "पायाभूत सुविधा",
    cat_safety: "सुरक्षा",
    cat_environment: "पर्यावरण",
    cat_utilities: "सार्वजनिक सुविधा",
    cat_traffic: "वाहतूक",
    cat_public_spaces: "सार्वजनिक जागा",

    // Priorities
    prio_low: "कमी",
    prio_low_desc: "किरकोळ अडचण",
    prio_medium: "मध्यम",
    prio_medium_desc: "काही नागरिकांना त्रास",
    prio_high: "जास्त",
    prio_high_desc: "मोठा परिणाम",
    prio_critical: "अतिधोकादायक",
    prio_critical_desc: "तत्काळ धोका",

    // Buttons
    btn_next: "पुढील पायरी",
    btn_back: "मागे जा",
    btn_submit: "तक्रार सबमिट करा",
    btn_submitting: "महापालिका एआय कडे पाठवत आहे...",
    btn_success: "तक्रार यशस्वीरित्या नोंदवली गेली!",
    btn_view_dashboard: "डॅशबोर्डवर पहा",
    btn_report_another: "नवीन तक्रार नोंदवा",
    location_detect_gps: "सध्याचे जीपीएस लोकेशन वापरा",
    location_pin_map: "नकाशावर ठिकाण निवडा",
    location_address_placeholder: "पत्ता किंवा लँडमार्क प्रविष्ट करा...",
    photos_upload_title: "फोटो अपलोड करा",
    photos_drag_drop: "फोटो येथे ड्रॅग करा किंवा क्लिक करा",

    // General UI
    select_language: "भाषा निवडा",
  },

  bn: {
    nav_dashboard: "ড্যাশবোর্ড",
    nav_report: "অভিযোগ জানান",
    nav_map: "শহরের মানচিত্র",
    nav_kanban: "কাজের অবস্থা",
    nav_admin: "এআই অ্যাডমিন",
    nav_employee: "ফিল্ড স্টাফ",
    nav_rewards: "পুরস্কার",
    nav_profile: "প্রোফাইল",

    report_page_title: "পৌর সমস্যা নথিভুক্ত করুন",
    report_page_subtitle: "পৌরসভার প্রতিনিধি দলের দ্রত সমাধানের জন্য বিবরণ, অবস্থান এবং ছবি জমা দিন।",
    step_1: "সমস্যার বিবরণ",
    step_2: "অবস্থান",
    step_3: "ছবি",
    step_4: "প্রিভিউ",
    step_5: "জমা দিন",

    issue_title_label: "সমস্যার শিরোনাম",
    issue_title_placeholder: "যেমন: প্রধান সড়কে বিপজ্জনক খানাখন্দ",
    category_label: "বিভাগ",
    priority_label: "অগ্রাধিকার",
    description_label: "বিস্তারিত বিবরণ",
    description_placeholder: "সমস্যা, আশেপাশের ল্যান্ডমার্ক এবং নিরাপত্তার বিষয়ে বিস্তারিত লিখুন...",

    voice_rec_title: "ভয়েস রেকর্ডার ও ভয়েস টাইপিং (ঐচ্ছিক)",
    voice_rec_subtitle: "নিজের ভাষায় বলুন এবং বিবরণ স্বয়ংক্রিয়ভাবে টাইপ করুন অথবা ভয়েস মেসেজ রেকর্ড করুন",
    voice_start_rec: "রেকর্ডিং শুরু করুন",
    voice_stop_rec: "রেকর্ডিং বন্ধ করুন",
    voice_recording: "রেকর্ডিং চলছে...",
    voice_play_preview: "রেকর্ডিং শুনুন",
    voice_pause_preview: "থামান",
    voice_delete_rec: "রেকর্ডিং মুছুন",
    voice_attached: "ভয়েস রেকর্ডিং সংযুক্ত করা হয়েছে",
    voice_transcribing: "শুনে টাইপ করা হচ্ছে...",
    voice_not_supported: "এই ব্রাউজারে ভয়েস টাইপিং সমর্থিত নয়।",

    cat_infrastructure: "অবকাঠামো",
    cat_safety: "সুরক্ষা",
    cat_environment: "পরিবেশ",
    cat_utilities: "জনসেবা",
    cat_traffic: "যানবাহন",
    cat_public_spaces: "জনসাধারণের স্থান",

    prio_low: "কম",
    prio_low_desc: "সামান্য অসুবিধা",
    prio_medium: "মাঝারি",
    prio_medium_desc: "কিছু নাগরিক প্রভাবিত",
    prio_high: "বেশি",
    prio_high_desc: "গুরুত্বপূর্ণ প্রভাব",
    prio_critical: "জরুরি",
    prio_critical_desc: "তাত্ক্ষণিক বিপদ",

    btn_next: "পরবর্তী ধাপ",
    btn_back: "ফিরে যান",
    btn_submit: "অভিযোগ জমা দিন",
    btn_submitting: "পৌরসভা এআই-তে পাঠানো হচ্ছে...",
    btn_success: "অভিযোগ সফলভাবে নথিভুক্ত হয়েছে!",
    btn_view_dashboard: "ড্যাশবোর্ডে দেখুন",
    btn_report_another: "অন্য একটি সমস্যা জানান",
    location_detect_gps: "বর্তমান জিপিএস অবস্থান ব্যবহার করুন",
    location_pin_map: "মানচিত্রে স্থান চিহ্নিত করুন",
    location_address_placeholder: "ঠিকানা লিখুন...",
    photos_upload_title: "ছবি আপলোড করুন",
    photos_drag_drop: "এখানে ছবি টেনে আনুন বা ক্লিক করুন",
    select_language: "ভাষা নির্বাচন করুন",
  },

  ta: {
    nav_dashboard: "டாஷ்போர்டு",
    nav_report: "புகார் அளிக்கவும்",
    nav_map: "நகர வரைபடம்",
    nav_kanban: "பணி நிலை",
    nav_admin: "AI நிர்வாகம்",
    nav_employee: "களப் பணியாளர்கள்",
    nav_rewards: "பரிசுகள்",
    nav_profile: "சுயவிவரம்",

    report_page_title: "நகராட்சி புகாரைப் பதிவு செய்யவும்",
    report_page_subtitle: "உடனடி தீர்வுக்கு விவரங்கள், இருப்பிடம் மற்றும் புகைப்படங்களை அனுப்பவும்.",
    step_1: "புகார் விவரங்கள்",
    step_2: "இருப்பிடம்",
    step_3: "புகைப்படங்கள்",
    step_4: "முன்னோட்டம்",
    step_5: "சமர்ப்பிக்கவும்",

    issue_title_label: "புகாரின் தலைப்பு",
    issue_title_placeholder: "எ.கா. பிரதான சாலையில் உள்ள ஆபத்தான குழி",
    category_label: "வகை",
    priority_label: "முன்னுரிமை",
    description_label: "விரிவான விளக்கம்",
    description_placeholder: "பிரச்சனை, அருகில் உள்ள அடையாளங்கள் மற்றும் பாதுகாப்பு கவலைகளை விளக்கவும்...",

    voice_rec_title: "குரல் பதிவு மற்றும் குரல் தட்டச்சு (விருப்பத்தேர்வு)",
    voice_rec_subtitle: "உங்கள் மொழியில் பேசி விளக்கத்தை வரையறுக்கவும் அல்லது குரல் செய்தியைப் பதிவு செய்யவும்",
    voice_start_rec: "பதிவைத் தொடங்கு",
    voice_stop_rec: "பதிவை நிறுத்து",
    voice_recording: "பதிவு செய்யப்படுகிறது...",
    voice_play_preview: "பதிவைக் கேள்",
    voice_pause_preview: "நிறுத்து",
    voice_delete_rec: "பதிவை நீக்கு",
    voice_attached: "குரல் பதிவு இணைக்கப்பட்டுள்ளது",
    voice_transcribing: "கேட்டு எழுதப்படுகிறது...",
    voice_not_supported: "இந்த உலாவியில் குரல் தட்டச்சு வசதி இல்லை.",

    cat_infrastructure: "உள்கட்டமைப்பு",
    cat_safety: "பாதுகாப்பு",
    cat_environment: "சுற்றுச்சூழல்",
    cat_utilities: "பொதுப் பயன்பாடுகள்",
    cat_traffic: "போக்குவரத்து",
    cat_public_spaces: "பொது இடங்கள்",

    prio_low: "குறைவு",
    prio_low_desc: "சிறிய சிரமம்",
    prio_medium: "நடுத்தரம்",
    prio_medium_desc: "சில குடியிருப்பாளர்களைப் பாதிக்கிறது",
    prio_high: "அதிகம்",
    prio_high_desc: "குறிப்பிடத்தக்க தாக்கம்",
    prio_critical: "அவசரம்",
    prio_critical_desc: "உடனடி ஆபத்து",

    btn_next: "அடுத்த படி",
    btn_back: "பின்னால் செல்",
    btn_submit: "புகாரைச் சமர்ப்பி",
    btn_submitting: "நகராட்சி AI-க்கு அனுப்பப்படுகிறது...",
    btn_success: "புகார் வெற்றிகரமாகப் பதிவு செய்யப்பட்டது!",
    btn_view_dashboard: "டாஷ்போர்டில் காண்",
    btn_report_another: "மற்றொரு புகார் பதிவு செய்ய",
    location_detect_gps: "தற்போதைய GPS இருப்பிடத்தைப் பயன்படுத்து",
    location_pin_map: "வரைபடத்தில் இடத்தைக் குறிக்கவும்",
    location_address_placeholder: "முகவரியை உள்ளிடவும்...",
    photos_upload_title: "புகைப்படங்களைப் பதிவேற்றவும்",
    photos_drag_drop: "படங்களை இங்கே இழுக்கவும் அல்லது கிளிக் செய்யவும்",
    select_language: "மொழியைத் தேர்ந்தெடுக்கவும்",
  },

  te: {
    nav_dashboard: "డాష్‌బోర్డ్",
    nav_report: "ఫిర్యాదు చేయండి",
    nav_map: "నగర పటం",
    nav_kanban: "పని స్థితి",
    nav_admin: "AI అడ్మిన్",
    nav_employee: "ఫీల్డ్ సిబ్బంది",
    nav_rewards: "రివార్డులు",
    nav_profile: "ప్రొఫైల్",

    report_page_title: "పౌర సమస్యను నమోదు చేయండి",
    report_page_subtitle: "మునిసిపల్ బృందం వేగవంతమైన పరిష్కారం కోసం వివరాలు, స్థానం మరియు ఫోటోలను పంపండి.",
    step_1: "సమస్య వివరాలు",
    step_2: "స్థానం",
    step_3: "ఫోటోలు",
    step_4: "ముందస్తు వీక్షణ",
    step_5: "సమర్పించండి",

    issue_title_label: "సమస్య శీర్షిక",
    issue_title_placeholder: "ఉదా. ప్రధాన రహదారిపై ప్రమాదకర గుంత",
    category_label: "వర్గం",
    priority_label: "ప్రాధాన్యత",
    description_label: "వివరమైన వివరణ",
    description_placeholder: "సమస్య, సమీపంలోని గుర్తులు మరియు భద్రతా ఆందోళనలను వివరించండి...",

    voice_rec_title: "వాయిస్ రికార్డింగ్ & వాయిస్ టైపింగ్ (ఐచ్ఛికం)",
    voice_rec_subtitle: "మీ భాషలో మాట్లాడి వివరాలను స్వయంచాలకంగా టైప్ చేయండి లేదా వాయిస్ సందేశాన్ని రికార్డ్ చేయండి",
    voice_start_rec: "రికార్డింగ్ ప్రారంభించు",
    voice_stop_rec: "రికార్డింగ్ ఆపు",
    voice_recording: "రికార్డింగ్ జరుగుతోంది...",
    voice_play_preview: "రికార్డింగ్ వినండి",
    voice_pause_preview: "ఆపు",
    voice_delete_rec: "రికార్డింగ్ తొలగించు",
    voice_attached: "వాయిస్ రికార్డింగ్ జోడించబడింది",
    voice_transcribing: "విని టైప్ చేయబడుతోంది...",
    voice_not_supported: "ఈ బ్రౌజర్‌లో వాయిస్ టైపింగ్ అందుబాటులో లేదు.",

    cat_infrastructure: "మౌలిక సదుపాయాలు",
    cat_safety: "రక్షణ",
    cat_environment: "పర్యావరణం",
    cat_utilities: "ప్రజా ఉపయోగాలు",
    cat_traffic: "రవాణా",
    cat_public_spaces: "ప్రజా స్థలాలు",

    prio_low: "తక్కువ",
    prio_low_desc: "చిన్న అసౌకర్యం",
    prio_medium: "మధ్యస్థం",
    prio_medium_desc: "కొంతమంది నివాసితులపై ప్రభావం",
    prio_high: "ఎక్కువ",
    prio_high_desc: "ముఖ్యమైన ప్రభావం",
    prio_critical: "అత్యవసరం",
    prio_critical_desc: "తక్షణ ప్రమాదం",

    btn_next: "తరువాతి దశ",
    btn_back: "వెనుకకు వెళ్లు",
    btn_submit: "ఫిర్యాదు సమర్పించు",
    btn_submitting: "మున్సిపల్ AIకి పంపబడుతోంది...",
    btn_success: "ఫిర్యాదు విజయవంతంగా నమోదైంది!",
    btn_view_dashboard: "డాష్‌బోర్డ్‌లో చూడండి",
    btn_report_another: "మరొక సమస్యను నమోదు చేయండి",
    location_detect_gps: "ప్రస్తుత GPS స్థానాన్ని ఉపయోగించండి",
    location_pin_map: "మ్యాప్‌లో స్థానాన్ని ఎంచుకోండి",
    location_address_placeholder: "చిరునామా నమోదు చేయండి...",
    photos_upload_title: "ఫోటోలను అప్‌లోడ్ చేయండి",
    photos_drag_drop: "చిత్రాలను ఇక్కడకు లాగండి లేదా క్లిక్ చేయండి",
    select_language: "భాషను ఎంచుకోండి",
  },

  gu: {
    nav_dashboard: "ડેશબોર્ડ",
    nav_report: "ફરિયાદ નોંધાવો",
    nav_map: "શહેરનો નકશો",
    nav_kanban: "કામગીરી સ્થિતિ",
    nav_admin: "AI એડમિન",
    nav_employee: "ફીલ્ડ સ્ટાફ",
    nav_rewards: "ઇનામો",
    nav_profile: "પ્રોફાઇલ",

    report_page_title: "નાગરિક સમસ્યાની ફરિયાદ નોંધાવો",
    report_page_subtitle: "મહાનગરપાલિકા દ્વારા ઝડપી નિરાકરણ માટે વિગત, સ્થળ અને ફોટોગ્રાફ્સ મોકલો.",
    step_1: "સમસ્યાની વિગત",
    step_2: "સ્થળ",
    step_3: "ફોટોગ્રાફ્સ",
    step_4: "પૂર્વાવલોકન",
    step_5: "સબમિટ કરો",

    issue_title_label: "સમસ્યાનું શીર્ષક",
    issue_title_placeholder: "ઉદા. મુખ્ય રોડ પર ભયજનક ખાડો",
    category_label: "કેટેગરી",
    priority_label: "પ્રાથમિકતા",
    description_label: "વિગતવાર વર્ણન",
    description_placeholder: "સમસ્યા, નજીકના સીમાચિહ્નો અને સુરક્ષા ચિંતાઓનું વર્ણન કરો...",

    voice_rec_title: "વોઇસ રેકોર્ડિંગ અને વોઇસ ટાઇપિંગ (વૈકલ્પિક)",
    voice_rec_subtitle: "તમારી ભાષામાં બોલો અને આપમેળે વિગત લખો અથવા વોઇસ સંદેશ રેકોર્ડ કરો",
    voice_start_rec: "રેકોર્ડિંગ શરૂ કરો",
    voice_stop_rec: "રેકોર્ડિંગ બંધ કરો",
    voice_recording: "રેકોર્ડિંગ ચાલુ છે...",
    voice_play_preview: "રેકોર્ડિંગ સાંભળો",
    voice_pause_preview: "અટકાવો",
    voice_delete_rec: "રેકોર્ડિંગ દૂર કરો",
    voice_attached: "વોઇસ રેકોર્ડિંગ જોડવામાં આવ્યું છે",
    voice_transcribing: "સાંભળીને લખાઈ રહ્યું છે...",
    voice_not_supported: "આ બ્રાઉઝરમાં વોઇસ ટાઇપિંગ સપોર્ટેડ નથી.",

    cat_infrastructure: "ઇન્ફ્રાસ્ટ્રક્ચર",
    cat_safety: "સુરક્ષા",
    cat_environment: "પર્યાવરણ",
    cat_utilities: "જાહેર સુવિધાઓ",
    cat_traffic: "ટ્રાફિક",
    cat_public_spaces: "જાહેર જગ્યાઓ",

    prio_low: "ઓછી",
    prio_low_desc: "નાની અગવડતા",
    prio_medium: "મધ્યમ",
    prio_medium_desc: "કેટલાક રહવાસીઓને અસર કરે છે",
    prio_high: "વધુ",
    prio_high_desc: "મોટી અસર",
    prio_critical: "ગંભીર",
    prio_critical_desc: "તાત્કાલિક જોખમ",

    btn_next: "આગળનું પગલું",
    btn_back: "પાછા જાઓ",
    btn_submit: "ફરિયાદ સબમિટ કરો",
    btn_submitting: "મહાનગરપાલિકા AI ને મોકલાઈ રહ્યું છે...",
    btn_success: "ફરિયાદ સફળતાપૂર્વક નોંધાઈ ગઈ!",
    btn_view_dashboard: "ડેશબોર્ડ પર જુઓ",
    btn_report_another: "બીજી સમસ્યા નોંધાવો",
    location_detect_gps: "હાલના GPS લોકેશનનો ઉપયોગ કરો",
    location_pin_map: "નકશા પર સ્થળ પસંદ કરો",
    location_address_placeholder: "સરનામું દાખલ કરો...",
    photos_upload_title: "ફોટોગ્રાફ્સ અપલોડ કરો",
    photos_drag_drop: "ઇમેજ અહીં ડ્રેગ કરો અથવા ક્લિક કરો",
    select_language: "ભાષા પસંદ કરો",
  },

  kn: {
    nav_dashboard: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
    nav_report: "ದೂರು ನೀಡಿ",
    nav_map: "ನಗರದ ನಕ್ಷೆ",
    nav_kanban: "ಕೆಲಸದ ಸ್ಥಿತಿ",
    nav_admin: "AI ಆಡಳಿತ",
    nav_employee: "ಫೀಲ್ಡ್ ಸಿಬ್ಬಂದಿ",
    nav_rewards: "ಬಹುಮಾನಗಳು",
    nav_profile: "ಪ್ರೊಫೈಲ್",

    report_page_title: "ನಾಗರಿಕ ಸಮಸ್ಯೆಯನ್ನು ವರದಿ ಮಾಡಿ",
    report_page_subtitle: "ಶೀಘ್ರ ಪರಿಹಾರಕ್ಕಾಗಿ ವಿವರಗಳು, ಸ್ಥಳ ಮತ್ತು ಫೋಟೋಗಳನ್ನು ಪಾಲಿಕೆಗೆ ಕಳುಹಿಸಿ.",
    step_1: "ಸಮಸ್ಯೆಯ ವಿವರಗಳು",
    step_2: "ಸ್ಥಳ",
    step_3: "ಫೋಟೋಗಳು",
    step_4: "ಮುನ್ನೋಟ",
    step_5: "ಸಲ್ಲಿಸಿ",

    issue_title_label: "ಸಮಸ್ಯೆಯ ಶೀರ್ಷಿಕೆ",
    issue_title_placeholder: "ಉದಾ: ಮುಖ್ಯ ರಸ್ತೆಯಲ್ಲಿ ಅಪಾಯಕಾರಿ ಗುಂಡಿ",
    category_label: "ವರ್ಗ",
    priority_label: "ಆದ್ಯತೆ",
    description_label: "ವಿವರವಾದ ಮಾಹಿತಿ",
    description_placeholder: "ಸಮಸ್ಯೆ, ಸಮೀಪದ ಕುರುಹುಗಳು ಮತ್ತು ಸುರಕ್ಷತಾ ಕಾಳಜಿಗಳನ್ನು ವಿವರಿಸಿ...",

    voice_rec_title: "ಧ್ವನಿ ಮುದ್ರಣ ಮತ್ತು ಧ್ವನಿ ಟೈಪಿಂಗ್ (ಐಚ್ಛಿಕ)",
    voice_rec_subtitle: "ನಿಮ್ಮ ಭಾಷೆಯಲ್ಲಿ ಮಾತನಾಡಿ ವಿವರಗಳನ್ನು ಟೈಪ್ ಮಾಡಿ ಅಥವಾ ಧ್ವನಿ ಸಂದೇಶ ರೆಕಾರ್ಡ್ ಮಾಡಿ",
    voice_start_rec: "ರೆಕಾರ್ಡಿಂಗ್ ಪ್ರಾರಂಭಿಸಿ",
    voice_stop_rec: "ರೆಕಾರ್ಡಿಂಗ್ ನಿಲ್ಲಿಸಿ",
    voice_recording: "ರೆಕಾರ್ಡಿಂಗ್ ನಡೆಯುತ್ತಿದೆ...",
    voice_play_preview: "ರೆಕಾರ್ಡಿಂಗ್ ಕೇಳಿ",
    voice_pause_preview: "ನಿಲ್ಲಿಸಿ",
    voice_delete_rec: "ರೆಕಾರ್ಡಿಂಗ್ ಅಳಿಸಿ",
    voice_attached: "ಧ್ವನಿ ಮುದ್ರಣವನ್ನು ಲಗತ್ತಿಸಲಾಗಿದೆ",
    voice_transcribing: "ಆಲಿಸಿ ಟೈಪ್ ಮಾಡಲಾಗುತ್ತಿದೆ...",
    voice_not_supported: "ಈ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಧ್ವನಿ ಟೈಪಿಂಗ್ ಬೆಂಬಲಿಸುವುದಿಲ್ಲ.",

    cat_infrastructure: "ಮೂಲಸೌಕರ್ಯ",
    cat_safety: "ಸುರಕ್ಷತೆ",
    cat_environment: "ಪರಿಸರ",
    cat_utilities: "ಸಾರ್ವಜನಿಕ ಸೌಲಭ್ಯಗಳು",
    cat_traffic: "ಸಂಚಾರ",
    cat_public_spaces: "ಸಾರ್ವಜನಿಕ ಸ್ಥಳಗಳು",

    prio_low: "ಕಡಿಮೆ",
    prio_low_desc: "ಸಣ್ಣ ಅಡಚಣೆ",
    prio_medium: "ಮಧ್ಯಮ",
    prio_medium_desc: "ಕೆಲವು ನಿವಾಸಿಗಳ ಮೇಲೆ ಪರಿಣಾಮ",
    prio_high: "ಹೆಚ್ಚು",
    prio_high_desc: "ಗಮನಾರ್ಹ ಪರಿಣಾಮ",
    prio_critical: "ಅತ್ಯಗತ್ಯ",
    prio_critical_desc: "ತಕ್ಷಣದ ಅಪಾಯ",

    btn_next: "ಮುಂದಿನ ಹಂತ",
    btn_back: "ಹಿಂದಕ್ಕೆ ಹೋಗಿ",
    btn_submit: "ದೂರನ್ನು ಸಲ್ಲಿಸಿ",
    btn_submitting: "ಪಾಲಿಕೆ AI ಗೆ ಕಳುಹಿಸಲಾಗುತ್ತಿದೆ...",
    btn_success: "ದೂರನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಸಲ್ಲಿಸಲಾಗಿದೆ!",
    btn_view_dashboard: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ನಲ್ಲಿ ನೋಡಿ",
    btn_report_another: "ಮತ್ತೊಂದು ದೂರು ನೀಡಿ",
    location_detect_gps: "ಪ್ರಸ್ತುತ GPS ಸ್ಥಳವನ್ನು ಬಳಸಿ",
    location_pin_map: "ನಕ್ಷೆಯಲ್ಲಿ ಸ್ಥಳವನ್ನು ಗುರುತಿಸಿ",
    location_address_placeholder: "ವಿಳಾಸವನ್ನು ನಮೂದಿಸಿ...",
    photos_upload_title: "ಫೋಟೋಗಳನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ",
    photos_drag_drop: "ಚಿತ್ರಗಳನ್ನು ಇಲ್ಲಿಗೆ ಎಳೆಯಿರಿ ಅಥವಾ ಕ್ಲಿಕ್ ಮಾಡಿ",
    select_language: "ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ",
  },

  ml: {
    nav_dashboard: "ഡാഷ്‌ബോർഡ്",
    nav_report: "പരാതി നൽകുക",
    nav_map: "നഗര ഭൂപടം",
    nav_kanban: "പ്രവർത്തന നില",
    nav_admin: "AI അഡ്മിൻ",
    nav_employee: "ഫീൽഡ് ജീവനക്കാർ",
    nav_rewards: "സമ്മാനങ്ങൾ",
    nav_profile: "പ്രൊഫൈൽ",

    report_page_title: "പരാതി രജിസ്റ്റർ ചെയ്യുക",
    report_page_subtitle: "ത്വരിത പരിഹാരത്തിനായി വിവരങ്ങളും സ്ഥലവും ചിത്രങ്ങളും നഗരസഭയ്ക്ക് അയക്കുക.",
    step_1: "പ്രശ്ന വിവരങ്ങൾ",
    step_2: "സ്ഥലം",
    step_3: "ചിത്രങ്ങൾ",
    step_4: "പ്രിവ്യൂ",
    step_5: "സമർപ്പിക്കുക",

    issue_title_label: "പ്രശ്നത്തിന്റെ തലക്കെട്ട്",
    issue_title_placeholder: "ഉദാ: റോഡിലെ അപകടകരമായ കുഴി",
    category_label: "വിഭാഗം",
    priority_label: "മുൻഗണന",
    description_label: "വിശദമായ വിവരണം",
    description_placeholder: "പ്രശ്നം, സമീപ അടയാളങ്ങൾ, സുരക്ഷാ ആശങ്കകൾ എന്നിവ വിവരിക്കുക...",

    voice_rec_title: "വോയ്‌സ് റെക്കോർഡിംഗും ശബ്ദ ടൈപ്പിംഗും (ഓപ്ഷണൽ)",
    voice_rec_subtitle: "നിങ്ങളുടെ ഭാഷയിൽ സംസാരിച്ച് വിവരങ്ങൾ സ്വയം ടൈപ്പ് ചെയ്യുക അല്ലെങ്കിൽ ശബ്ദ സന്ദേശം റെക്കോർഡ് ചെയ്യുക",
    voice_start_rec: "റെക്കോർഡിംഗ് ആരംഭിക്കുക",
    voice_stop_rec: "റെക്കോർഡിംഗ് നിർത്തുക",
    voice_recording: "റെക്കോർഡിംഗ് നടക്കുന്നു...",
    voice_play_preview: "റെക്കോർഡിംഗ് കേൾക്കുക",
    voice_pause_preview: "നിർത്തുക",
    voice_delete_rec: "റെക്കോർഡിംഗ് മാറ്റുക",
    voice_attached: "വോയ്‌സ് റെക്കോർഡിംഗ് ചേർത്തു",
    voice_transcribing: "ശ്രദ്ധിച്ച് ടൈപ്പ് ചെയ്യുന്നു...",
    voice_not_supported: "ഈ ബ്രൗസറിൽ വോയ്‌സ് ടൈപ്പിംഗ് പിന്തുണയ്ക്കുന്നില്ല.",

    cat_infrastructure: "അടിസ്ഥാന സൗകര്യം",
    cat_safety: "സുരക്ഷ",
    cat_environment: "പരിസ്ഥിതി",
    cat_utilities: "പൊതുസൗകര്യങ്ങൾ",
    cat_traffic: "ഗതാഗതം",
    cat_public_spaces: "പൊതുസ്ഥലങ്ങൾ",

    prio_low: "കുറഞ്ഞത്",
    prio_low_desc: "ചെറിയ ബുദ്ധിമുട്ട്",
    prio_medium: "ഇടത്തരം",
    prio_medium_desc: "ചിലരെ ബാധിക്കുന്നു",
    prio_high: "കൂടിയത്",
    prio_high_desc: "വലിയ പ്രത്യാഘാതം",
    prio_critical: "അടിയന്തിരം",
    prio_critical_desc: "ഉടനടി അപകടം",

    btn_next: "അടുത്ത ഘട്ടം",
    btn_back: "പിന്നോട്ട് പോകുക",
    btn_submit: "പരാതി സമർപ്പിക്കുക",
    btn_submitting: "നഗരസഭ AI-ലേക്ക് അയക്കുന്നു...",
    btn_success: "പരാതി വിജയകരമായി രജിസ്റ്റർ ചെയ്തു!",
    btn_view_dashboard: "ഡാഷ്‌ബോർഡിൽ കാണുക",
    btn_report_another: "മറ്റൊരു പരാതി നൽകുക",
    location_detect_gps: "നിലവിലെ GPS സ്ഥാനം ഉപയോഗിക്കുക",
    location_pin_map: "മാപ്പിൽ സ്ഥാനം അടയാളപ്പെടുത്തുക",
    location_address_placeholder: "മേൽവിലാസം നൽകുക...",
    photos_upload_title: "ചിത്രങ്ങൾ അപ്‌ലോഡ് ചെയ്യുക",
    photos_drag_drop: "ചിത്രങ്ങൾ ഇവിടെ ഡ്രാഗ് ചെയ്യുക അല്ലെങ്കിൽ ക്ലിക്ക് ചെയ്യുക",
    select_language: "ഭാഷ തിരഞ്ഞെടുക്കുക",
  },

  pa: {
    nav_dashboard: "ਡੈਸ਼ਬੋਰਡ",
    nav_report: "ਸ਼ਿਕਾਇਤ ਦਰਜ ਕਰੋ",
    nav_map: "ਸ਼ਹਿਰ ਦਾ ਨਕਸ਼ਾ",
    nav_kanban: "ਕੰਮ ਦੀ ਸਥਿਤੀ",
    nav_admin: "ਏਆਈ ਐਡਮਿਨ",
    nav_employee: "ਫੀਲਡ ਸਟਾਫ",
    nav_rewards: "ਇਨਾਮ",
    nav_profile: "ਪ੍ਰੋਫਾਈਲ",

    report_page_title: "ਨਗਰ ਨਿਗਮ ਸ਼ਿਕਾਇਤ ਦਰਜ ਕਰੋ",
    report_page_subtitle: "ਤੁਰੰਤ ਹੱਲ ਲਈ ਵੇਰਵੇ, ਸਥਾਨ ਅਤੇ ਤਸਵੀਰਾਂ ਨਗਰ ਨਿਗਮ ਟੀਮ ਨੂੰ ਭੇਜੋ।",
    step_1: "ਮਸਲੇ ਦਾ ਵੇਰਵਾ",
    step_2: "ਸਥਾਨ",
    step_3: "ਤਸਵੀਰਾਂ",
    step_4: "ਪੂਰਵਦਰਸ਼ਨ",
    step_5: "ਜਮ੍ਹਾਂ ਕਰੋ",

    issue_title_label: "ਮਸਲੇ ਦਾ ਸਿਰਲੇਖ",
    issue_title_placeholder: "ਜਿਵੇਂ: ਮੁੱਖ ਸੜਕ 'ਤੇ ਖਤਰਨਾਕ ਟੋਆ",
    category_label: "ਸ਼੍ਰੇਣੀ",
    priority_label: "ਪਹਿਲ",
    description_label: "ਵਿਸਤ੍ਰਿਤ ਵੇਰਵਾ",
    description_placeholder: "ਸਮੱਸਿਆ, ਨਜ਼ਦੀਕੀ ਨਿਸ਼ਾਨੀਆਂ ਅਤੇ ਸੁਰੱਖਿਆ ਬਾਰੇ ਲਿਖੋ...",

    voice_rec_title: "ਵੌਇਸ ਰਿਕਾਰਡਿੰਗ ਅਤੇ ਵੌਇਸ ਟਾਈਪਿੰਗ (ਵਿਕਲਪਿਕ)",
    voice_rec_subtitle: "ਆਪਣੀ ਭਾਸ਼ਾ ਵਿੱਚ ਬੋਲੋ ਅਤੇ ਆਪਣੇ ਆਪ ਟਾਈਪ ਕਰੋ ਜਾਂ ਵੌਇਸ ਸੁਨੇਹਾ ਰਿਕਾਰਡ ਕਰੋ",
    voice_start_rec: "ਰਿਕਾਰਡਿੰਗ ਸ਼ੁਰੂ ਕਰੋ",
    voice_stop_rec: "ਰਿਕਾਰਡਿੰਗ ਬੰਦ ਕਰੋ",
    voice_recording: "ਰਿਕਾਰਡਿੰਗ ਚੱਲ ਰਹੀ ਹੈ...",
    voice_play_preview: "ਰਿਕਾਰਡਿੰਗ ਸੁਣੋ",
    voice_pause_preview: "ਰੋਕੋ",
    voice_delete_rec: "ਰਿਕਾਰਡਿੰਗ ਹਟਾਓ",
    voice_attached: "ਵੌਇਸ ਰਿਕਾਰਡਿੰਗ ਨੱਥੀ ਕੀਤੀ ਗਈ ਹੈ",
    voice_transcribing: "ਸੁਣ ਕੇ ਟਾਈਪ ਕੀਤਾ ਜਾ ਰਿਹਾ ਹੈ...",
    voice_not_supported: "ਇਸ ਬ੍ਰਾਊਜ਼ਰ ਵਿੱਚ ਵੌਇਸ ਟਾਈਪਿੰਗ ਉਪਲਬਧ ਨਹੀਂ ਹੈ।",

    cat_infrastructure: "ਬੁਨਿਆਦੀ ਢਾਂਚਾ",
    cat_safety: "ਸੁਰੱਖਿਆ",
    cat_environment: "ਵਾਤਾਵਰਣ",
    cat_utilities: "ਜਨਤਕ ਸੁਵਿਧਾਵਾਂ",
    cat_traffic: "ਟ੍ਰੈਫਿਕ",
    cat_public_spaces: "ਜਨਤਕ ਥਾਵਾਂ",

    prio_low: "ਘੱਟ",
    prio_low_desc: "ਮਾਮੂਲੀ ਅਸੁਵਿਧਾ",
    prio_medium: "ਦਰਮਿਆਨਾ",
    prio_medium_desc: "ਕੁਝ ਨਿਵਾਸੀਆਂ 'ਤੇ ਅਸਰ",
    prio_high: "ਜ਼ਿਆਦਾ",
    prio_high_desc: "ਵੱਡਾ ਅਸਰ",
    prio_critical: "ਬਹੁਤ ਜ਼ਰੂਰੀ",
    prio_critical_desc: "ਤੁਰੰਤ ਖਤਰਾ",

    btn_next: "ਅਗਲਾ ਕਦਮ",
    btn_back: "ਪਿੱਛੇ ਜਾਓ",
    btn_submit: "ਸ਼ਿਕਾਇਤ ਜਮ੍ਹਾਂ ਕਰੋ",
    btn_submitting: "ਨਗਰ ਨਿਗਮ AI ਨੂੰ ਭੇਜਿਆ ਜਾ ਰਿਹਾ ਹੈ...",
    btn_success: "ਸ਼ਿਕਾਇਤ ਸਫਲਤਾਪੂਰਵਕ ਦਰਜ ਕੀਤੀ ਗਈ!",
    btn_view_dashboard: "ਡੈਸ਼ਬੋਰਡ 'ਤੇ ਦੇਖੋ",
    btn_report_another: "ਹੋਰ ਸ਼ਿਕਾਇਤ ਦਰਜ ਕਰੋ",
    location_detect_gps: "ਮੌਜੂਦਾ GPS ਸਥਾਨ ਦੀ ਵਰਤੋਂ ਕਰੋ",
    location_pin_map: "ਨਕਸ਼ੇ 'ਤੇ ਸਥਾਨ ਚੁਣੋ",
    location_address_placeholder: "ਪਤਾ ਦਰਜ ਕਰੋ...",
    photos_upload_title: "ਤਸਵੀਰਾਂ ਅੱਪਲੋਡ ਕਰੋ",
    photos_drag_drop: "ਤਸਵੀਰਾਂ ਇੱਥੇ ਖਿੱਚੋ ਜਾਂ ਕਲਿੱਕ ਕਰੋ",
    select_language: "ਭਾਸ਼ਾ ਚੁਣੋ",
  },
};

export function getTranslation(lang: LanguageCode, key: string): string {
  const langDict = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const enValue = TRANSLATIONS.en[key];

  // 1) Curated translation for this key + language.
  if (langDict[key]) return langDict[key];

  // 2) Fall back to the generated dictionary using the English value.
  if (enValue) {
    const auto = AUTO_TRANSLATIONS[lang]?.[enValue];
    return auto || enValue;
  }

  // 3) Key itself doubles as an English string in the generated dictionary.
  return AUTO_TRANSLATIONS[lang]?.[key] || key;
}

// ─────────────────────────────────────────────────────────────────────────────
// Global runtime translation
//
// The curated dictionaries above cover the hand-authored keys used through
// `t()`. The generated AUTO_TRANSLATIONS dictionary additionally contains every
// static UI string present in the application source (labels, buttons, forms,
// modals, empty states, validation messages, ...).
//
// `translateText` is a pure, synchronous lookup used by the runtime applier so
// that the selected language reaches the WHOLE application without rewriting
// any page. User content, API data, database values and YOLO/Gemini results are
// never passed through here.
// ─────────────────────────────────────────────────────────────────────────────

export function translateText(lang: LanguageCode, text: string): string {
  if (!text || lang === "en") return text;

  const dict = AUTO_TRANSLATIONS[lang];
  if (!dict) return text;

  // Exact match — covers the large majority of static UI strings.
  if (dict[text]) return dict[text];

  // Trimmed match (text nodes often carry surrounding whitespace).
  const trimmed = text.trim();
  if (trimmed && trimmed !== text && dict[trimmed]) {
    return text.replace(trimmed, dict[trimmed]);
  }

  return text;
}

// ─────────────────────────────────────────────────────────────────────────────
// Theme switch labels (Dark / Light)
//
// Kept here (instead of the generated dictionary) because the theme toggle is
// the only place these two strings are used and they must always be available.
// ─────────────────────────────────────────────────────────────────────────────

export const THEME_LABELS: Record<LanguageCode, { light: string; dark: string }> = {
  en: { light: "Light Mode", dark: "Dark Mode" },
  hi: { light: "लाइट मोड", dark: "डार्क मोड" },
  mr: { light: "लाइट मोड", dark: "डार्क मोड" },
  bn: { light: "লাইট মোড", dark: "ডার্ক মোড" },
  ta: { light: "லைட் பயன்முறை", dark: "டார்க் பயன்முறை" },
  te: { light: "లైట్ మోడ్", dark: "డార్క్ మోడ్" },
  gu: { light: "લાઇટ મોડ", dark: "ડાર્ક મોડ" },
  kn: { light: "ಲೈಟ್ ಮೋಡ್", dark: "ಡಾರ್ಕ್ ಮೋಡ್" },
  ml: { light: "ലൈറ്റ് മോഡ്", dark: "ഡാർക്ക് മോഡ്" },
  pa: { light: "ਲਾਈਟ ਮੋਡ", dark: "ਡਾਰਕ ਮੋਡ" },
};

export function getThemeLabel(lang: LanguageCode, mode: "light" | "dark"): string {
  return (THEME_LABELS[lang] || THEME_LABELS.en)[mode];
}

// ─────────────────────────────────────────────────────────────────────────────
// Runtime DOM applier — makes the selected language reach EVERY page
//
// The application renders its static copy directly in JSX (hundreds of strings
// across 10 pages). Instead of rewriting every page, this applier walks the
// rendered DOM and swaps the static English strings for their translation.
//
// Safety rules:
//   * Only strings that exist in the generated dictionary are replaced, so
//     user input, API/DB values, YOLO/Gemini output and numbers are untouched.
//   * <script>/<style>/<code>/<pre>/<textarea>/SVG and contenteditable nodes are
//     skipped, as is anything inside [data-i18n-skip].
//   * Each node remembers the English it was created with, so switching
//     language back and forth is always reversible.
// ─────────────────────────────────────────────────────────────────────────────

const TRANSLATABLE_ATTRS = ["placeholder", "title", "aria-label", "alt"] as const;

const SKIP_TAGS = new Set([
  "SCRIPT", "STYLE", "NOSCRIPT", "CODE", "PRE", "KBD", "SAMP",
  "TEXTAREA", "SVG", "CANVAS", "MATH", "IFRAME",
]);

interface TextRecord {
  en: string;
  lang: LanguageCode;
}

let activeLanguage: LanguageCode = "en";
let domObserver: MutationObserver | null = null;

const textRecords = new WeakMap<Text, TextRecord>();
const attrRecords = new WeakMap<Element, Map<string, TextRecord>>();

function isSkippedElement(el: Element | null): boolean {
  let node: Element | null = el;
  while (node) {
    if (SKIP_TAGS.has(node.tagName)) return true;
    if ((node as HTMLElement).isContentEditable) return true;
    if (node.hasAttribute("data-i18n-skip")) return true;
    node = node.parentElement;
  }
  return false;
}

function applyToTextNode(node: Text): void {
  const current = node.data;
  if (!current || !current.trim()) return;

  const lang = activeLanguage;
  let rec = textRecords.get(node);

  if (!rec) {
    rec = { en: current, lang };
    textRecords.set(node, rec);
  } else if (current !== translateText(rec.lang, rec.en)) {
    // The DOM changed underneath us (React re-render) — adopt the new source,
    // unless it is simply our own translation for the active language.
    if (current !== translateText(lang, rec.en)) {
      rec.en = current;
    }
  }

  rec.lang = lang;
  const out = translateText(lang, rec.en);
  if (node.data !== out) node.data = out;
}

function applyToElement(el: Element): void {
  const lang = activeLanguage;
  let map = attrRecords.get(el);
  if (!map) {
    map = new Map<string, TextRecord>();
    attrRecords.set(el, map);
  }

  for (const attr of TRANSLATABLE_ATTRS) {
    if (!el.hasAttribute(attr)) continue;
    const current = el.getAttribute(attr) || "";
    if (!current.trim()) continue;

    let rec = map.get(attr);
    if (!rec) {
      rec = { en: current, lang };
      map.set(attr, rec);
    } else if (current !== translateText(rec.lang, rec.en)) {
      if (current !== translateText(lang, rec.en)) {
        rec.en = current;
      }
    }

    rec.lang = lang;
    const out = translateText(lang, rec.en);
    if (out !== current) el.setAttribute(attr, out);
  }
}

function walkAndApply(root: Node): void {
  if (root.nodeType === Node.TEXT_NODE) {
    applyToTextNode(root as Text);
    return;
  }
  if (root.nodeType !== Node.ELEMENT_NODE) return;

  const rootEl = root as Element;
  if (isSkippedElement(rootEl)) return;
  applyToElement(rootEl);

  const walker = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
    acceptNode(node) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as Element;
        if (
          SKIP_TAGS.has(el.tagName) ||
          (el as HTMLElement).isContentEditable ||
          el.hasAttribute("data-i18n-skip")
        ) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  let node = walker.nextNode();
  while (node) {
    if (node.nodeType === Node.TEXT_NODE) applyToTextNode(node as Text);
    else applyToElement(node as Element);
    node = walker.nextNode();
  }
}

/** Translate the whole document into `lang`. Safe to call repeatedly. */
export function applyLanguage(lang: LanguageCode): void {
  if (typeof document === "undefined") return;
  activeLanguage = lang;
  document.documentElement.lang = lang;
  if (document.body) walkAndApply(document.body);
}

/**
 * Apply `lang` now and keep the document translated while React keeps
 * rendering (navigation, modals, async data, toasts, ...).
 */
export function startLanguageObserver(lang: LanguageCode): void {
  if (typeof document === "undefined" || typeof MutationObserver === "undefined") return;

  applyLanguage(lang);
  if (domObserver) return;

  domObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === "characterData") {
        const target = mutation.target as Text;
        if (!isSkippedElement(target.parentElement)) applyToTextNode(target);
      } else if (mutation.type === "attributes") {
        const target = mutation.target as Element;
        if (!isSkippedElement(target)) applyToElement(target);
      } else {
        mutation.addedNodes.forEach((added) => walkAndApply(added));
      }
    }
  });

  domObserver.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: [...TRANSLATABLE_ATTRS],
  });
}

/** Stops observing (used for cleanup / tests). */
export function stopLanguageObserver(): void {
  if (domObserver) {
    domObserver.disconnect();
    domObserver = null;
  }
}

