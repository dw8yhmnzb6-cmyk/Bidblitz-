import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { 
  Car, Euro, Check, MapPin, Calendar, Camera, Star,
  TrendingUp, Users, Award, ArrowRight, Sparkles, Globe,
  Clock, Shield, FileText, Upload, CheckCircle, X, Image
} from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Comprehensive translations for all languages
const translations = {
  de: {
    badge: "Auto-Werbung International",
    heroTitle: "Verdienen Sie",
    heroTitleHighlight: "€50-200/Monat",
    heroDesc: "Verdienen Sie passives Einkommen, während Sie fahren! Lassen Sie Ihr Auto für Sie arbeiten mit einer professionellen BidBlitz-Folierung.",
    applyNow: "Jetzt anmelden",
    alreadyRegistered: "Bereits registriert? Status prüfen",
    monthlyEarning: "Monatlich",
    activeDrivers: "Aktive Fahrer",
    countriesCovered: "Länder",
    citiesCovered: "Städte",
    minContract: "Min. Laufzeit",
    benefitsTitle: "Ihre Vorteile",
    benefit1Title: "€50-200 jeden Monat",
    benefit1Desc: "Je nach Fahrzeugtyp und Standort",
    benefit2Title: "Kostenlose Folierung",
    benefit2Desc: "Professionelle Vollfolierung",
    benefit3Title: "Keine Verpflichtungen",
    benefit3Desc: "Kündigen Sie jederzeit nach 3 Monaten",
    benefit4Title: "Einfache Auszahlung",
    benefit4Desc: "Monatliche Überweisung",
    benefit5Title: "Versicherung inklusive",
    benefit5Desc: "Vollkaskoversicherung für die Folie",
    benefit6Title: "Gratis BidBlitz-Gebote",
    benefit6Desc: "Jeden Monat 20 kostenlose Gebote",
    howItWorks: "So funktioniert's",
    step1Title: "Anmelden",
    step1Desc: "5 Fotos hochladen",
    step2Title: "Prüfung",
    step2Desc: "24-48h Überprüfung",
    step3Title: "Folierung",
    step3Desc: "Kostenloser Termin",
    step4Title: "Verdienen",
    step4Desc: "Monatliche Zahlung",
    registerCar: "Fahrzeug registrieren",
    carBrand: "Automarke",
    carModel: "Modell",
    carYear: "Baujahr",
    carColor: "Farbe",
    licensePlate: "Kennzeichen",
    country: "Land",
    city: "Stadt",
    kmPerMonth: "Gefahrene km/Monat",
    kmPlaceholder: "z.B. 1500",
    parkingLocation: "Wo parken Sie hauptsächlich?",
    parkingOptions: {
      street: "Straße (öffentlich)",
      garage: "Garage/Tiefgarage",
      parking: "Parkplatz",
      driveway: "Einfahrt/Grundstück"
    },
    carPhotos: "Fahrzeugfotos (5 erforderlich)",
    photoHint: "Laden Sie 5 Fotos aus verschiedenen Winkeln hoch",
    uploadFront: "Vorne",
    uploadBack: "Hinten",
    uploadLeft: "Links",
    uploadRight: "Rechts",
    uploadInside: "Innen",
    dragDrop: "Klicken oder ziehen",
    additionalInfo: "Zusätzliche Informationen",
    additionalPlaceholder: "z.B. Besonderheiten am Fahrzeug...",
    submit: "Bewerbung absenden",
    submitting: "Wird gesendet...",
    successTitle: "Anmeldung erfolgreich!",
    successDesc: "Vielen Dank! Wir prüfen Ihre Angaben und melden uns innerhalb von 24-48 Stunden.",
    backToHome: "Zur Startseite",
    requirements: "Voraussetzungen",
    req1: "Fahrzeug Baujahr 2016 oder neuer",
    req2: "Mindestens 1.000 km/Monat",
    req3: "Keine größeren Beschädigungen",
    req4: "Mindestvertragslaufzeit 3 Monate",
    faq: "Häufige Fragen",
    faq1Q: "Beschädigt die Folie meinen Lack?",
    faq1A: "Nein! Wir verwenden hochwertige, lackschonende Folien.",
    faq2Q: "Wann erhalte ich mein Geld?",
    faq2A: "Die Auszahlung erfolgt am 1. jedes Monats.",
    faq3Q: "In welchen Ländern ist das Programm verfügbar?",
    faq3A: "UAE, Deutschland, Österreich, Schweiz, Albanien, Kosovo und mehr.",
    faq4Q: "Wie viel verdiene ich genau?",
    faq4A: "€50-100 für Kleinwagen, €100-150 für Mittelklasse, €150-200 für SUV/Premium.",
    yourName: "Ihr Name",
    yourEmail: "Ihre E-Mail",
    yourPhone: "Ihre Telefonnummer",
    selectBrand: "Marke wählen",
    selectYear: "Jahr wählen",
    selectCountry: "Land wählen",
    selectCity: "Stadt wählen",
    applicationSuccess: "Anmeldung erfolgreich!",
    applicationError: "Fehler beim Senden",
    myStatus: "Mein Status",
    pending: "In Prüfung",
    approved: "Genehmigt",
    active: "Aktiv",
    rejected: "Abgelehnt",
    totalEarned: "Bisher verdient",
    nextPayout: "Nächste Auszahlung",
    contractStart: "Vertragsbeginn",
    photosUploaded: "Fotos hochgeladen",
    uploadMore: "Noch {n} Fotos benötigt"
  },
  en: {
    badge: "Car Advertising International",
    heroTitle: "Earn",
    heroTitleHighlight: "€50-200/Month",
    heroDesc: "Earn passive income while you drive! Let your car work for you with professional BidBlitz vehicle wrapping.",
    applyNow: "Apply Now",
    alreadyRegistered: "Already registered? Check status",
    monthlyEarning: "Monthly",
    activeDrivers: "Active Drivers",
    countriesCovered: "Countries",
    citiesCovered: "Cities",
    minContract: "Min. Contract",
    benefitsTitle: "Your Benefits",
    benefit1Title: "€50-200 Every Month",
    benefit1Desc: "Based on vehicle type and location",
    benefit2Title: "Free Vehicle Wrap",
    benefit2Desc: "Professional full wrap included",
    benefit3Title: "No Obligations",
    benefit3Desc: "Cancel anytime after 3 months",
    benefit4Title: "Easy Payout",
    benefit4Desc: "Monthly bank transfer",
    benefit5Title: "Insurance Included",
    benefit5Desc: "Full coverage for the wrap",
    benefit6Title: "Free BidBlitz Bids",
    benefit6Desc: "20 free bids every month",
    howItWorks: "How It Works",
    step1Title: "Apply",
    step1Desc: "Upload 5 photos",
    step2Title: "Review",
    step2Desc: "24-48h verification",
    step3Title: "Wrapping",
    step3Desc: "Free appointment",
    step4Title: "Earn",
    step4Desc: "Monthly payment",
    registerCar: "Register Vehicle",
    carBrand: "Car Brand",
    carModel: "Model",
    carYear: "Year",
    carColor: "Color",
    licensePlate: "License Plate",
    country: "Country",
    city: "City",
    kmPerMonth: "km driven/month",
    kmPlaceholder: "e.g. 1500",
    parkingLocation: "Where do you usually park?",
    parkingOptions: {
      street: "Street (public)",
      garage: "Garage",
      parking: "Parking lot",
      driveway: "Driveway"
    },
    carPhotos: "Vehicle Photos (5 required)",
    photoHint: "Upload 5 photos from different angles",
    uploadFront: "Front",
    uploadBack: "Back",
    uploadLeft: "Left",
    uploadRight: "Right",
    uploadInside: "Inside",
    dragDrop: "Click or drag",
    additionalInfo: "Additional Information",
    additionalPlaceholder: "e.g. special features...",
    submit: "Submit Application",
    submitting: "Submitting...",
    successTitle: "Application Successful!",
    successDesc: "Thank you! We'll review your details and contact you within 24-48 hours.",
    backToHome: "Back to Home",
    requirements: "Requirements",
    req1: "Vehicle year 2016 or newer",
    req2: "At least 1,000 km/month",
    req3: "No major damage",
    req4: "Minimum 3 months contract",
    faq: "FAQ",
    faq1Q: "Will the wrap damage my paint?",
    faq1A: "No! We use high-quality, paint-safe wraps.",
    faq2Q: "When do I get paid?",
    faq2A: "Payment is made on the 1st of each month.",
    faq3Q: "Which countries is the program available in?",
    faq3A: "UAE, Germany, Austria, Switzerland, Albania, Kosovo and more.",
    faq4Q: "How much exactly will I earn?",
    faq4A: "€50-100 for compact cars, €100-150 for mid-size, €150-200 for SUV/Premium.",
    yourName: "Your Name",
    yourEmail: "Your Email",
    yourPhone: "Your Phone",
    selectBrand: "Select brand",
    selectYear: "Select year",
    selectCountry: "Select country",
    selectCity: "Select city",
    applicationSuccess: "Application successful!",
    applicationError: "Error submitting",
    myStatus: "My Status",
    pending: "Under Review",
    approved: "Approved",
    active: "Active",
    rejected: "Rejected",
    totalEarned: "Total Earned",
    nextPayout: "Next Payout",
    contractStart: "Contract Start",
    photosUploaded: "Photos uploaded",
    uploadMore: "{n} more photos needed"
  },
  ar: {
    badge: "إعلانات السيارات الدولية",
    heroTitle: "اكسب",
    heroTitleHighlight: "€50-200/شهرياً",
    heroDesc: "اكسب دخلاً سلبياً أثناء القيادة! دع سيارتك تعمل من أجلك مع تغليف BidBlitz الاحترافي.",
    applyNow: "سجل الآن",
    alreadyRegistered: "مسجل بالفعل؟ تحقق من الحالة",
    monthlyEarning: "شهرياً",
    activeDrivers: "سائقين نشطين",
    countriesCovered: "دولة",
    citiesCovered: "مدينة",
    minContract: "الحد الأدنى للعقد",
    benefitsTitle: "مزاياك",
    benefit1Title: "€50-200 كل شهر",
    benefit1Desc: "حسب نوع السيارة والموقع",
    benefit2Title: "تغليف مجاني",
    benefit2Desc: "تغليف كامل احترافي",
    benefit3Title: "بدون التزامات",
    benefit3Desc: "إلغاء في أي وقت بعد 3 أشهر",
    benefit4Title: "دفع سهل",
    benefit4Desc: "تحويل بنكي شهري",
    benefit5Title: "تأمين شامل",
    benefit5Desc: "تغطية كاملة للتغليف",
    benefit6Title: "عروض BidBlitz مجانية",
    benefit6Desc: "20 عرض مجاني كل شهر",
    howItWorks: "كيف يعمل",
    step1Title: "سجل",
    step1Desc: "ارفع 5 صور",
    step2Title: "مراجعة",
    step2Desc: "تحقق خلال 24-48 ساعة",
    step3Title: "التغليف",
    step3Desc: "موعد مجاني",
    step4Title: "اكسب",
    step4Desc: "دفع شهري",
    registerCar: "سجل السيارة",
    carBrand: "ماركة السيارة",
    carModel: "الموديل",
    carYear: "السنة",
    carColor: "اللون",
    licensePlate: "رقم اللوحة",
    country: "الدولة",
    city: "المدينة",
    kmPerMonth: "كم/شهر",
    kmPlaceholder: "مثال: 1500",
    parkingLocation: "أين تركن عادة؟",
    parkingOptions: {
      street: "شارع (عام)",
      garage: "مرآب",
      parking: "موقف سيارات",
      driveway: "ممر"
    },
    carPhotos: "صور السيارة (5 مطلوبة)",
    photoHint: "ارفع 5 صور من زوايا مختلفة",
    uploadFront: "أمامي",
    uploadBack: "خلفي",
    uploadLeft: "يسار",
    uploadRight: "يمين",
    uploadInside: "داخلي",
    dragDrop: "انقر أو اسحب",
    additionalInfo: "معلومات إضافية",
    additionalPlaceholder: "مثال: ميزات خاصة...",
    submit: "إرسال الطلب",
    submitting: "جاري الإرسال...",
    successTitle: "تم التسجيل بنجاح!",
    successDesc: "شكراً لك! سنراجع بياناتك ونتواصل معك خلال 24-48 ساعة.",
    backToHome: "العودة للرئيسية",
    requirements: "المتطلبات",
    req1: "سيارة 2016 أو أحدث",
    req2: "1,000 كم/شهر على الأقل",
    req3: "بدون أضرار كبيرة",
    req4: "عقد 3 أشهر كحد أدنى",
    faq: "الأسئلة الشائعة",
    faq1Q: "هل سيضر التغليف بالطلاء؟",
    faq1A: "لا! نستخدم أغلفة عالية الجودة وآمنة.",
    faq2Q: "متى أحصل على المال؟",
    faq2A: "الدفع في الأول من كل شهر.",
    faq3Q: "في أي دول البرنامج متاح؟",
    faq3A: "الإمارات، ألمانيا، النمسا، سويسرا، ألبانيا، كوسوفو وأكثر.",
    faq4Q: "كم سأكسب بالضبط؟",
    faq4A: "€50-100 للسيارات الصغيرة، €100-150 للمتوسطة، €150-200 للـSUV/الفاخرة.",
    yourName: "اسمك",
    yourEmail: "بريدك الإلكتروني",
    yourPhone: "هاتفك",
    selectBrand: "اختر الماركة",
    selectYear: "اختر السنة",
    selectCountry: "اختر الدولة",
    selectCity: "اختر المدينة",
    applicationSuccess: "تم التسجيل بنجاح!",
    applicationError: "خطأ في الإرسال",
    myStatus: "حالتي",
    pending: "قيد المراجعة",
    approved: "موافق عليه",
    active: "نشط",
    rejected: "مرفوض",
    totalEarned: "إجمالي الأرباح",
    nextPayout: "الدفعة التالية",
    contractStart: "بداية العقد",
    photosUploaded: "صور مرفوعة",
    uploadMore: "{n} صور إضافية مطلوبة"
  },
  sq: {
    badge: "Reklamë në Makinë Ndërkombëtare",
    heroTitle: "Fitoni",
    heroTitleHighlight: "€50-200/Muaj",
    heroDesc: "Fitoni të ardhura pasive ndërsa ngisni! Lëreni makinën tuaj të punojë për ju me mbështjellësin profesional BidBlitz.",
    applyNow: "Apliko Tani",
    alreadyRegistered: "Tashmë i regjistruar? Kontrollo statusin",
    monthlyEarning: "Mujore",
    activeDrivers: "Shoferë Aktivë",
    countriesCovered: "Vende",
    citiesCovered: "Qytete",
    minContract: "Min. Kontratë",
    benefitsTitle: "Përfitimet Tuaja",
    benefit1Title: "€50-200 Çdo Muaj",
    benefit1Desc: "Sipas llojit të makinës dhe vendndodhjes",
    benefit2Title: "Mbështjellje Falas",
    benefit2Desc: "Mbështjellje e plotë profesionale",
    benefit3Title: "Pa Detyrime",
    benefit3Desc: "Anulo në çdo kohë pas 3 muajsh",
    benefit4Title: "Pagesë e Lehtë",
    benefit4Desc: "Transfertë bankare mujore",
    benefit5Title: "Sigurim i Përfshirë",
    benefit5Desc: "Mbulim i plotë për mbështjellësin",
    benefit6Title: "Oferta Falas BidBlitz",
    benefit6Desc: "20 oferta falas çdo muaj",
    howItWorks: "Si Funksionon",
    step1Title: "Apliko",
    step1Desc: "Ngarko 5 foto",
    step2Title: "Rishikim",
    step2Desc: "Verifikim 24-48 orë",
    step3Title: "Mbështjellje",
    step3Desc: "Takim falas",
    step4Title: "Fito",
    step4Desc: "Pagesë mujore",
    registerCar: "Regjistro Automjetin",
    carBrand: "Marka",
    carModel: "Modeli",
    carYear: "Viti",
    carColor: "Ngjyra",
    licensePlate: "Targa",
    country: "Vendi",
    city: "Qyteti",
    kmPerMonth: "km/muaj",
    kmPlaceholder: "p.sh. 1500",
    parkingLocation: "Ku parkoni zakonisht?",
    parkingOptions: {
      street: "Rrugë (publike)",
      garage: "Garazh",
      parking: "Parking",
      driveway: "Hyrje"
    },
    carPhotos: "Foto të Makinës (5 të nevojshme)",
    photoHint: "Ngarko 5 foto nga kënde të ndryshme",
    uploadFront: "Përpara",
    uploadBack: "Mbrapa",
    uploadLeft: "Majtas",
    uploadRight: "Djathtas",
    uploadInside: "Brenda",
    dragDrop: "Kliko ose tërhiq",
    additionalInfo: "Informacione Shtesë",
    additionalPlaceholder: "p.sh. veçori të veçanta...",
    submit: "Dorëzo Aplikimin",
    submitting: "Duke dërguar...",
    successTitle: "Aplikimi i Suksesshëm!",
    successDesc: "Faleminderit! Do të shqyrtojmë detajet tuaja dhe do t'ju kontaktojmë brenda 24-48 orëve.",
    backToHome: "Kthehu në Fillim",
    requirements: "Kërkesat",
    req1: "Makinë viti 2016 ose më e re",
    req2: "Të paktën 1,000 km/muaj",
    req3: "Pa dëmtime të mëdha",
    req4: "Kontratë minimale 3 muaj",
    faq: "Pyetje të Shpeshta",
    faq1Q: "A do ta dëmtojë mbështjellësi bojën?",
    faq1A: "Jo! Ne përdorim mbështjellës cilësor.",
    faq2Q: "Kur do të paguhem?",
    faq2A: "Pagesa bëhet në datën 1 të çdo muaji.",
    faq3Q: "Në cilat vende është i disponueshëm programi?",
    faq3A: "UAE, Gjermani, Austri, Zvicër, Shqipëri, Kosovë dhe më shumë.",
    faq4Q: "Sa do të fitoj saktësisht?",
    faq4A: "€50-100 për makina të vogla, €100-150 për të mesme, €150-200 për SUV/Premium.",
    yourName: "Emri Juaj",
    yourEmail: "Email-i Juaj",
    yourPhone: "Telefoni Juaj",
    selectBrand: "Zgjidh markën",
    selectYear: "Zgjidh vitin",
    selectCountry: "Zgjidh vendin",
    selectCity: "Zgjidh qytetin",
    applicationSuccess: "Aplikimi i suksesshëm!",
    applicationError: "Gabim gjatë dërgimit",
    myStatus: "Statusi Im",
    pending: "Nën Shqyrtim",
    approved: "Aprovuar",
    active: "Aktiv",
    rejected: "Refuzuar",
    totalEarned: "Totali i Fituar",
    nextPayout: "Pagesa Tjetër",
    contractStart: "Fillimi i Kontratës",
    photosUploaded: "Foto të ngarkuara",
    uploadMore: "{n} foto të tjera të nevojshme"
  },
  tr: {
    badge: "Uluslararası Araç Reklamı",
    heroTitle: "Kazanın",
    heroTitleHighlight: "€50-200/Ay",
    heroDesc: "Zaten sürüyorsunuz? Aracınızın sizin için çalışmasına izin verin! Profesyonel BidBlitz araç giydirme ile pasif gelir kazanın.",
    applyNow: "Şimdi Başvur",
    alreadyRegistered: "Zaten kayıtlı mısınız? Durumu kontrol edin",
    monthlyEarning: "Aylık",
    activeDrivers: "Aktif Sürücü",
    countriesCovered: "Ülke",
    citiesCovered: "Şehir",
    minContract: "Min. Sözleşme",
    benefitsTitle: "Avantajlarınız",
    benefit1Title: "Her Ay €50-200",
    benefit1Desc: "Araç tipine ve konuma göre",
    benefit2Title: "Ücretsiz Araç Giydirme",
    benefit2Desc: "Profesyonel tam giydirme dahil",
    benefit3Title: "Zorunluluk Yok",
    benefit3Desc: "3 aydan sonra istediğiniz zaman iptal edin",
    benefit4Title: "Kolay Ödeme",
    benefit4Desc: "Aylık banka transferi",
    benefit5Title: "Sigorta Dahil",
    benefit5Desc: "Kaplama için tam koruma",
    benefit6Title: "Ücretsiz BidBlitz Teklifleri",
    benefit6Desc: "Her ay 20 ücretsiz teklif",
    howItWorks: "Nasıl Çalışır",
    step1Title: "Başvur",
    step1Desc: "5 fotoğraf yükle",
    step2Title: "İnceleme",
    step2Desc: "24-48 saat doğrulama",
    step3Title: "Giydirme",
    step3Desc: "Ücretsiz randevu",
    step4Title: "Kazan",
    step4Desc: "Aylık ödeme",
    registerCar: "Araç Kaydet",
    carBrand: "Araç Markası",
    carModel: "Model",
    carYear: "Yıl",
    carColor: "Renk",
    licensePlate: "Plaka",
    country: "Ülke",
    city: "Şehir",
    kmPerMonth: "km/ay",
    kmPlaceholder: "örn. 1500",
    parkingLocation: "Genellikle nerede park ediyorsunuz?",
    parkingOptions: {
      street: "Sokak (halka açık)",
      garage: "Garaj",
      parking: "Otopark",
      driveway: "Araba yolu"
    },
    carPhotos: "Araç Fotoğrafları (5 gerekli)",
    photoHint: "Farklı açılardan 5 fotoğraf yükleyin",
    uploadFront: "Ön",
    uploadBack: "Arka",
    uploadLeft: "Sol",
    uploadRight: "Sağ",
    uploadInside: "İç",
    dragDrop: "Tıkla veya sürükle",
    additionalInfo: "Ek Bilgiler",
    additionalPlaceholder: "örn. özel özellikler...",
    submit: "Başvuru Gönder",
    submitting: "Gönderiliyor...",
    successTitle: "Başvuru Başarılı!",
    successDesc: "Teşekkürler! Bilgilerinizi inceleyip 24-48 saat içinde sizinle iletişime geçeceğiz.",
    backToHome: "Ana Sayfaya Dön",
    requirements: "Gereksinimler",
    req1: "2016 veya daha yeni araç",
    req2: "En az 1,000 km/ay",
    req3: "Büyük hasar yok",
    req4: "Minimum 3 ay sözleşme",
    faq: "SSS",
    faq1Q: "Kaplama boyamı zedeleyecek mi?",
    faq1A: "Hayır! Yüksek kaliteli, boyaya zarar vermeyen kaplamalar kullanıyoruz.",
    faq2Q: "Ne zaman ödeme alacağım?",
    faq2A: "Ödeme her ayın 1'inde yapılır.",
    faq3Q: "Program hangi ülkelerde mevcut?",
    faq3A: "BAE, Almanya, Avusturya, İsviçre, Arnavutluk, Kosova ve daha fazlası.",
    faq4Q: "Tam olarak ne kadar kazanacağım?",
    faq4A: "Küçük arabalar için €50-100, orta boy için €100-150, SUV/Premium için €150-200.",
    yourName: "Adınız",
    yourEmail: "E-postanız",
    yourPhone: "Telefonunuz",
    selectBrand: "Marka seçin",
    selectYear: "Yıl seçin",
    selectCountry: "Ülke seçin",
    selectCity: "Şehir seçin",
    applicationSuccess: "Başvuru başarılı!",
    applicationError: "Gönderim hatası",
    myStatus: "Durumum",
    pending: "İnceleniyor",
    approved: "Onaylandı",
    active: "Aktif",
    rejected: "Reddedildi",
    totalEarned: "Toplam Kazanç",
    nextPayout: "Sonraki Ödeme",
    contractStart: "Sözleşme Başlangıcı",
    photosUploaded: "Yüklenen fotoğraflar",
    uploadMore: "{n} fotoğraf daha gerekli"
  },
  fr: {
    badge: "Publicité Auto Internationale",
    heroTitle: "Gagnez",
    heroTitleHighlight: "€50-200/Mois",
    heroDesc: "Gagnez un revenu passif en conduisant! Laissez votre voiture travailler pour vous avec le covering professionnel BidBlitz.",
    applyNow: "Inscrivez-vous",
    monthlyEarning: "Mensuel",
    activeDrivers: "Conducteurs Actifs",
    countriesCovered: "Pays",
    citiesCovered: "Villes",
    benefitsTitle: "Vos Avantages",
    benefit1Title: "€50-200 Chaque Mois",
    benefit1Desc: "Selon le type de véhicule",
    howItWorks: "Comment ça marche",
    registerCar: "Enregistrer Véhicule",
    carBrand: "Marque",
    carModel: "Modèle",
    carYear: "Année",
    carColor: "Couleur",
    licensePlate: "Plaque",
    country: "Pays",
    city: "Ville",
    carPhotos: "Photos du Véhicule (5 requises)",
    photoHint: "Téléchargez 5 photos de différents angles",
    submit: "Envoyer",
    requirements: "Conditions",
    faq: "FAQ",
    yourName: "Votre Nom",
    yourEmail: "Votre Email",
    yourPhone: "Votre Téléphone",
    selectBrand: "Choisir marque",
    selectYear: "Choisir année",
    selectCountry: "Choisir pays",
    selectCity: "Choisir ville"
  }
};

// Car brands with premium/SUV indicators
const carBrands = [
  'Audi', 'BMW', 'Mercedes-Benz', 'Volkswagen', 'Toyota', 'Honda', 'Hyundai', 
  'Kia', 'Mazda', 'Nissan', 'Ford', 'Chevrolet', 'Lexus', 'Infiniti',
  'Porsche', 'Tesla', 'Range Rover', 'Land Rover', 'Jaguar', 'Bentley',
  'Rolls-Royce', 'Ferrari', 'Lamborghini', 'Maserati', 'Aston Martin',
  'GMC', 'Cadillac', 'Lincoln', 'Jeep', 'Dodge', 'RAM', 'Other'
];

// Countries with cities
const countriesWithCities = {
  'UAE': ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Al Ain'],
  'Germany': ['Berlin', 'München', 'Hamburg', 'Frankfurt', 'Köln', 'Düsseldorf', 'Stuttgart'],
  'Austria': ['Wien', 'Graz', 'Linz', 'Salzburg', 'Innsbruck'],
  'Switzerland': ['Zürich', 'Genf', 'Basel', 'Bern', 'Lausanne'],
  'Albania': ['Tirana', 'Durrës', 'Vlorë', 'Shkodër', 'Elbasan'],
  'Kosovo': ['Pristina', 'Prizren', 'Ferizaj', 'Peja', 'Gjakova'],
  'Saudi Arabia': ['Riyadh', 'Jeddah', 'Mecca', 'Medina', 'Dammam'],
  'Qatar': ['Doha', 'Al Wakrah', 'Al Khor'],
  'Bahrain': ['Manama', 'Riffa', 'Muharraq'],
  'Kuwait': ['Kuwait City', 'Hawalli', 'Salmiya'],
  'Oman': ['Muscat', 'Salalah', 'Sohar']
};

// Years 2016-2026 only
const years = Array.from({length: 11}, (_, i) => 2026 - i);

export default function CarAdvertising() {
  const { language, mappedLanguage } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const langKey = mappedLanguage || language;
  const t = translations[langKey] || translations[language] || translations.en;
  
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [myApplication, setMyApplication] = useState(null);
  const [photos, setPhotos] = useState([null, null, null, null, null]);
  const [selectedCountry, setSelectedCountry] = useState('');
  const fileInputRefs = [useRef(), useRef(), useRef(), useRef(), useRef()];
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    carBrand: '',
    carModel: '',
    carYear: '',
    carColor: '',
    licensePlate: '',
    country: '',
    city: '',
    kmPerMonth: '',
    parkingLocation: '',
    additionalInfo: ''
  });

  // Check existing application
  useEffect(() => {
    if (isAuthenticated && user?.email) {
      checkExistingApplication();
    }
  }, [isAuthenticated, user]);

  const checkExistingApplication = async () => {
    try {
      const response = await axios.get(`${API}/car-advertising/my-application`, {
        params: { email: user.email }
      });
      if (response.data) {
        setMyApplication(response.data);
      }
    } catch (error) {
      // No existing application
    }
  };

  const handlePhotoUpload = (index, event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newPhotos = [...photos];
        newPhotos[index] = reader.result;
        setPhotos(newPhotos);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCountryChange = (country) => {
    setSelectedCountry(country);
    setFormData({...formData, country, city: ''});
  };

  const uploadedCount = photos.filter(p => p !== null).length;
  const photoLabels = [t.uploadFront, t.uploadBack, t.uploadLeft, t.uploadRight, t.uploadInside];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (uploadedCount < 5) {
      toast.error(t.uploadMore?.replace('{n}', 5 - uploadedCount) || `${5 - uploadedCount} more photos needed`);
      return;
    }
    
    setLoading(true);

    try {
      await axios.post(`${API}/car-advertising/apply`, {
        ...formData,
        photos: photos.filter(p => p !== null),
        user_id: user?.id
      });
      
      toast.success(t.applicationSuccess);
      setSubmitted(true);
    } catch (error) {
      console.error('Application error:', error);
      toast.error(error.response?.data?.detail || t.applicationError);
    } finally {
      setLoading(false);
    }
  };

  // Show status for existing applicants
  if (myApplication) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white py-8 sm:py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-orange-400 to-amber-500 rounded-2xl flex items-center justify-center">
                <Car className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800">{t.myStatus}</h1>
                <p className="text-gray-500 text-sm sm:text-base">{myApplication.car_brand} {myApplication.car_model}</p>
              </div>
            </div>

            <div className={`p-4 rounded-xl mb-6 ${
              myApplication.status === 'active' ? 'bg-green-50 border border-green-200' :
              myApplication.status === 'approved' ? 'bg-blue-50 border border-blue-200' :
              myApplication.status === 'rejected' ? 'bg-red-50 border border-red-200' :
              'bg-amber-50 border border-amber-200'
            }`}>
              <div className="flex items-center gap-3">
                {myApplication.status === 'active' && <CheckCircle className="w-6 h-6 text-green-500" />}
                {myApplication.status === 'approved' && <Check className="w-6 h-6 text-blue-500" />}
                {myApplication.status === 'rejected' && <X className="w-6 h-6 text-red-500" />}
                {myApplication.status === 'pending' && <Clock className="w-6 h-6 text-amber-500" />}
                <span className={`font-semibold ${
                  myApplication.status === 'active' ? 'text-green-700' :
                  myApplication.status === 'approved' ? 'text-blue-700' :
                  myApplication.status === 'rejected' ? 'text-red-700' :
                  'text-amber-700'
                }`}>
                  {t[myApplication.status] || myApplication.status}
                </span>
              </div>
            </div>

            {myApplication.status === 'active' && (
              <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6">
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-xs sm:text-sm text-gray-500">{t.totalEarned}</p>
                  <p className="text-xl sm:text-2xl font-bold text-green-600">€{myApplication.total_earned?.toFixed(2) || '0.00'}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-xs sm:text-sm text-gray-500">{t.nextPayout}</p>
                  <p className="text-xl sm:text-2xl font-bold text-orange-600">€50-200</p>
                </div>
              </div>
            )}

            <Link to="/">
              <Button variant="outline" className="w-full mt-4">
                {t.backToHome}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center py-12 px-4">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">{t.successTitle}</h1>
          <p className="text-gray-600 mb-8">{t.successDesc}</p>
          <Link to="/">
            <Button className="bg-gradient-to-r from-orange-500 to-amber-500">
              {t.backToHome}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-amber-50">
      {/* Hero Section - Mobile Optimized */}
      <section className="relative overflow-hidden py-10 sm:py-16 md:py-20">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-100/50 to-amber-100/50" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur px-3 sm:px-4 py-2 rounded-full text-orange-600 font-medium mb-4 sm:mb-6 shadow-sm text-sm sm:text-base">
              <Globe className="w-4 h-4" />
              {t.badge}
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800 mb-4 sm:mb-6">
              {t.heroTitle}{' '}
              <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
                {t.heroTitleHighlight}
              </span>
            </h1>
            
            <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-6 sm:mb-8 max-w-2xl mx-auto px-2">
              {t.heroDesc}
            </p>
            
            <Button 
              onClick={() => document.getElementById('register-form')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg rounded-xl shadow-lg"
              data-testid="apply-now-btn"
            >
              <Car className="w-5 h-5 mr-2" />
              {t.applyNow}
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section - Mobile Grid */}
      <section className="py-6 sm:py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {[
              { icon: Euro, value: '€50-200', label: t.monthlyEarning, color: 'bg-green-500' },
              { icon: Users, value: '785+', label: t.activeDrivers, color: 'bg-blue-500' },
              { icon: Globe, value: '11+', label: t.countriesCovered, color: 'bg-purple-500' },
              { icon: MapPin, value: '50+', label: t.citiesCovered, color: 'bg-orange-500' }
            ].map((stat, i) => (
              <div key={i} className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-md text-center">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 ${stat.color} rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3`}>
                  <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">{stat.value}</p>
                <p className="text-xs sm:text-sm text-gray-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-8 sm:py-12 px-4 bg-white/50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-800 mb-6 sm:mb-10">{t.benefitsTitle}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[
              { icon: Euro, title: t.benefit1Title, desc: t.benefit1Desc, color: 'text-green-500 bg-green-100' },
              { icon: Camera, title: t.benefit2Title, desc: t.benefit2Desc, color: 'text-blue-500 bg-blue-100' },
              { icon: Shield, title: t.benefit3Title, desc: t.benefit3Desc, color: 'text-purple-500 bg-purple-100' },
              { icon: TrendingUp, title: t.benefit4Title, desc: t.benefit4Desc, color: 'text-orange-500 bg-orange-100' },
              { icon: Award, title: t.benefit5Title, desc: t.benefit5Desc, color: 'text-amber-500 bg-amber-100' },
              { icon: Sparkles, title: t.benefit6Title, desc: t.benefit6Desc, color: 'text-pink-500 bg-pink-100' }
            ].map((benefit, i) => (
              <div key={i} className="bg-white rounded-xl p-4 sm:p-6 shadow-md hover:shadow-lg transition-shadow">
                <div className={`w-12 h-12 rounded-xl ${benefit.color} flex items-center justify-center mb-3 sm:mb-4`}>
                  <benefit.icon className="w-6 h-6" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-1 sm:mb-2">{benefit.title}</h3>
                <p className="text-sm text-gray-600">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-8 sm:py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-800 mb-6 sm:mb-10">{t.howItWorks}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            {[
              { num: '1', title: t.step1Title, desc: t.step1Desc },
              { num: '2', title: t.step2Title, desc: t.step2Desc },
              { num: '3', title: t.step3Title, desc: t.step3Desc },
              { num: '4', title: t.step4Title, desc: t.step4Desc }
            ].map((step, i) => (
              <div key={i} className="text-center">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 text-white font-bold text-lg sm:text-xl">
                  {step.num}
                </div>
                <h3 className="font-bold text-gray-800 text-sm sm:text-base mb-1">{step.title}</h3>
                <p className="text-xs sm:text-sm text-gray-600">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Registration Form */}
      <section id="register-form" className="py-8 sm:py-12 px-4 bg-white/50">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-5 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl flex items-center justify-center">
                <Car className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">{t.registerCar}</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
              {/* Personal Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">{t.yourName} *</Label>
                  <Input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder={t.yourName}
                    className="mt-1"
                    data-testid="car-ad-name"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">{t.yourEmail} *</Label>
                  <Input
                    required
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder={t.yourEmail}
                    className="mt-1"
                    data-testid="car-ad-email"
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">{t.yourPhone} *</Label>
                <Input
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="+971 50 123 4567"
                  className="mt-1"
                  data-testid="car-ad-phone"
                />
              </div>

              {/* Vehicle Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">{t.carBrand} *</Label>
                  <Select value={formData.carBrand} onValueChange={(v) => setFormData({...formData, carBrand: v})}>
                    <SelectTrigger className="mt-1" data-testid="car-ad-brand">
                      <SelectValue placeholder={t.selectBrand} />
                    </SelectTrigger>
                    <SelectContent>
                      {carBrands.map(brand => (
                        <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium">{t.carModel} *</Label>
                  <Input
                    required
                    value={formData.carModel}
                    onChange={(e) => setFormData({...formData, carModel: e.target.value})}
                    placeholder="z.B. Golf, A4, C-Klasse"
                    className="mt-1"
                    data-testid="car-ad-model"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">{t.carYear} *</Label>
                  <Select value={formData.carYear} onValueChange={(v) => setFormData({...formData, carYear: v})}>
                    <SelectTrigger className="mt-1" data-testid="car-ad-year">
                      <SelectValue placeholder={t.selectYear} />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map(year => (
                        <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium">{t.carColor} *</Label>
                  <Input
                    required
                    value={formData.carColor}
                    onChange={(e) => setFormData({...formData, carColor: e.target.value})}
                    placeholder="z.B. Schwarz, Weiß"
                    className="mt-1"
                    data-testid="car-ad-color"
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">{t.licensePlate} *</Label>
                <Input
                  required
                  value={formData.licensePlate}
                  onChange={(e) => setFormData({...formData, licensePlate: e.target.value.toUpperCase()})}
                  placeholder="z.B. DXB 12345"
                  className="mt-1"
                  data-testid="car-ad-plate"
                />
              </div>

              {/* Location */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">{t.country} *</Label>
                  <Select value={formData.country} onValueChange={handleCountryChange}>
                    <SelectTrigger className="mt-1" data-testid="car-ad-country">
                      <SelectValue placeholder={t.selectCountry} />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(countriesWithCities).map(country => (
                        <SelectItem key={country} value={country}>{country}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium">{t.city} *</Label>
                  <Select 
                    value={formData.city} 
                    onValueChange={(v) => setFormData({...formData, city: v})}
                    disabled={!selectedCountry}
                  >
                    <SelectTrigger className="mt-1" data-testid="car-ad-city">
                      <SelectValue placeholder={t.selectCity} />
                    </SelectTrigger>
                    <SelectContent>
                      {(countriesWithCities[selectedCountry] || []).map(city => (
                        <SelectItem key={city} value={city}>{city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">{t.kmPerMonth} *</Label>
                <Input
                  required
                  type="number"
                  value={formData.kmPerMonth}
                  onChange={(e) => setFormData({...formData, kmPerMonth: e.target.value})}
                  placeholder={t.kmPlaceholder}
                  className="mt-1"
                  data-testid="car-ad-km"
                />
              </div>

              {/* Photo Upload Section */}
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  {t.carPhotos} 
                  <span className="text-orange-500 ml-2">({uploadedCount}/5)</span>
                </Label>
                <p className="text-xs text-gray-500 mb-3">{t.photoHint}</p>
                
                <div className="grid grid-cols-5 gap-2 sm:gap-3">
                  {[0, 1, 2, 3, 4].map((index) => (
                    <div key={index} className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRefs[index]}
                        onChange={(e) => handlePhotoUpload(index, e)}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRefs[index].current?.click()}
                        className={`w-full aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center transition-colors ${
                          photos[index] 
                            ? 'border-green-400 bg-green-50' 
                            : 'border-gray-300 hover:border-orange-400 bg-gray-50 hover:bg-orange-50'
                        }`}
                        data-testid={`photo-upload-${index}`}
                      >
                        {photos[index] ? (
                          <div className="relative w-full h-full">
                            <img 
                              src={photos[index]} 
                              alt={`Photo ${index + 1}`}
                              className="w-full h-full object-cover rounded-lg"
                            />
                            <div className="absolute top-1 right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          </div>
                        ) : (
                          <>
                            <Camera className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
                            <span className="text-[10px] sm:text-xs text-gray-500 mt-1 text-center px-1">
                              {photoLabels[index]}
                            </span>
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
                
                {uploadedCount < 5 && (
                  <p className="text-xs text-orange-500 mt-2">
                    {t.uploadMore?.replace('{n}', (5 - uploadedCount).toString()) || `${5 - uploadedCount} more photos needed`}
                  </p>
                )}
              </div>

              {/* Additional Info */}
              <div>
                <Label className="text-sm font-medium">{t.additionalInfo}</Label>
                <Textarea
                  value={formData.additionalInfo}
                  onChange={(e) => setFormData({...formData, additionalInfo: e.target.value})}
                  placeholder={t.additionalPlaceholder}
                  className="mt-1"
                  rows={3}
                  data-testid="car-ad-info"
                />
              </div>

              {/* Requirements */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <h4 className="font-semibold text-amber-800 mb-2 text-sm">{t.requirements}</h4>
                <ul className="text-xs sm:text-sm text-amber-700 space-y-1">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{t.req1}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{t.req2}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{t.req3}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{t.req4}</span>
                  </li>
                </ul>
              </div>

              <Button 
                type="submit" 
                disabled={loading || uploadedCount < 5}
                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-4 sm:py-6 text-base sm:text-lg rounded-xl shadow-lg disabled:opacity-50"
                data-testid="car-ad-submit"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {t.submitting}
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Car className="w-5 h-5" />
                    {t.submit}
                  </span>
                )}
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-8 sm:py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-800 mb-6 sm:mb-10">{t.faq}</h2>
          <div className="space-y-4">
            {[
              { q: t.faq1Q, a: t.faq1A },
              { q: t.faq2Q, a: t.faq2A },
              { q: t.faq3Q, a: t.faq3A },
              { q: t.faq4Q, a: t.faq4A }
            ].map((faq, i) => (
              <div key={i} className="bg-white rounded-xl p-4 sm:p-5 shadow-md">
                <h3 className="font-bold text-gray-800 text-sm sm:text-base mb-2">{faq.q}</h3>
                <p className="text-gray-600 text-sm">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
