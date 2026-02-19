import { useState, useEffect } from 'react';
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
  TrendingUp, Users, Award, ArrowRight, Sparkles,
  Clock, Shield, FileText, Upload, CheckCircle, X
} from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Translations
const translations = {
  de: {
    badge: "Auto-Werbung",
    heroTitle: "Verdienen Sie",
    heroTitleHighlight: "€50/Monat",
    heroDesc: "Fahren Sie sowieso? Lassen Sie Ihr Auto für Sie arbeiten! Bringen Sie BidBlitz-Werbung auf Ihrem Fahrzeug an und verdienen Sie jeden Monat passives Einkommen.",
    applyNow: "Jetzt anmelden",
    alreadyRegistered: "Bereits registriert? Status prüfen",
    monthlyEarning: "Monatlich",
    activeDrivers: "Aktive Fahrer",
    citiesCovered: "Städte",
    minContract: "Min. Laufzeit",
    benefitsTitle: "Ihre Vorteile",
    benefit1Title: "€50 jeden Monat",
    benefit1Desc: "Garantierte monatliche Auszahlung",
    benefit2Title: "Kostenlose Folierung",
    benefit2Desc: "Wir übernehmen alle Kosten für die Beklebung",
    benefit3Title: "Keine Verpflichtungen",
    benefit3Desc: "Kündigen Sie jederzeit nach 3 Monaten",
    benefit4Title: "Einfache Auszahlung",
    benefit4Desc: "Monatliche Überweisung auf Ihr Konto",
    benefit5Title: "Versicherung inklusive",
    benefit5Desc: "Vollkaskoversicherung für die Folie",
    benefit6Title: "Gratis BidBlitz-Gebote",
    benefit6Desc: "Jeden Monat 20 kostenlose Gebote",
    howItWorks: "So funktioniert's",
    step1Title: "Anmelden",
    step1Desc: "Registrieren Sie Ihr Fahrzeug",
    step2Title: "Prüfung",
    step2Desc: "Wir prüfen Ihre Angaben",
    step3Title: "Termin",
    step3Desc: "Folierung in Ihrer Nähe",
    step4Title: "Verdienen",
    step4Desc: "€50/Monat auf Ihr Konto",
    registerCar: "Fahrzeug registrieren",
    carBrand: "Automarke",
    carModel: "Modell",
    carYear: "Baujahr",
    carColor: "Farbe",
    licensePlate: "Kennzeichen",
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
    carPhotos: "Fahrzeugfotos",
    uploadFront: "Frontansicht",
    uploadSide: "Seitenansicht",
    uploadBack: "Heckansicht",
    additionalInfo: "Zusätzliche Informationen",
    additionalPlaceholder: "z.B. Besonderheiten am Fahrzeug, Wunschtermine...",
    submit: "Bewerbung absenden",
    submitting: "Wird gesendet...",
    successTitle: "Anmeldung erfolgreich!",
    successDesc: "Vielen Dank! Wir werden Ihre Angaben prüfen und uns innerhalb von 3-5 Werktagen bei Ihnen melden, um einen Termin für die Folierung zu vereinbaren.",
    backToHome: "Zur Startseite",
    requirements: "Voraussetzungen",
    req1: "Fahrzeug nicht älter als 10 Jahre",
    req2: "Mindestens 1.000 km/Monat Fahrleistung",
    req3: "Keine größeren Beschädigungen am Lack",
    req4: "Mindestvertragslaufzeit 3 Monate",
    req5: "Fahrzeug muss in Deutschland zugelassen sein",
    faq: "Häufige Fragen",
    faq1Q: "Beschädigt die Folie meinen Lack?",
    faq1A: "Nein! Wir verwenden hochwertige, lackschonende Folien, die rückstandslos entfernt werden können.",
    faq2Q: "Wann erhalte ich mein Geld?",
    faq2A: "Die Auszahlung erfolgt am 1. jedes Monats per Banküberweisung.",
    faq3Q: "Was passiert bei einem Unfall?",
    faq3A: "Die Folie ist vollkaskoversichert. Bei Beschädigung wird sie kostenlos ersetzt.",
    faq4Q: "Kann ich jederzeit kündigen?",
    faq4A: "Nach der Mindestlaufzeit von 3 Monaten können Sie jederzeit mit einer Frist von 2 Wochen kündigen.",
    yourName: "Ihr Name",
    yourEmail: "Ihre E-Mail",
    yourPhone: "Ihre Telefonnummer",
    selectBrand: "Marke wählen",
    selectYear: "Jahr wählen",
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
    viewContract: "Vertrag ansehen"
  },
  en: {
    badge: "Car Advertising",
    heroTitle: "Earn",
    heroTitleHighlight: "€50/Month",
    heroDesc: "Driving anyway? Let your car work for you! Put BidBlitz advertising on your vehicle and earn passive income every month.",
    applyNow: "Register Now",
    alreadyRegistered: "Already registered? Check status",
    monthlyEarning: "Monthly",
    activeDrivers: "Active Drivers",
    citiesCovered: "Cities",
    minContract: "Min. Contract",
    benefitsTitle: "Your Benefits",
    benefit1Title: "€50 Every Month",
    benefit1Desc: "Guaranteed monthly payout",
    benefit2Title: "Free Vehicle Wrap",
    benefit2Desc: "We cover all wrapping costs",
    benefit3Title: "No Obligations",
    benefit3Desc: "Cancel anytime after 3 months",
    benefit4Title: "Easy Payout",
    benefit4Desc: "Monthly transfer to your account",
    benefit5Title: "Insurance Included",
    benefit5Desc: "Full coverage for the wrap",
    benefit6Title: "Free BidBlitz Bids",
    benefit6Desc: "20 free bids every month",
    howItWorks: "How It Works",
    step1Title: "Register",
    step1Desc: "Register your vehicle",
    step2Title: "Review",
    step2Desc: "We check your details",
    step3Title: "Appointment",
    step3Desc: "Wrapping near you",
    step4Title: "Earn",
    step4Desc: "€50/month to your account",
    registerCar: "Register Vehicle",
    carBrand: "Car Brand",
    carModel: "Model",
    carYear: "Year",
    carColor: "Color",
    licensePlate: "License Plate",
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
    carPhotos: "Vehicle Photos",
    uploadFront: "Front view",
    uploadSide: "Side view",
    uploadBack: "Rear view",
    additionalInfo: "Additional Information",
    additionalPlaceholder: "e.g. special features, preferred dates...",
    submit: "Submit Application",
    submitting: "Submitting...",
    successTitle: "Registration Successful!",
    successDesc: "Thank you! We will review your details and contact you within 3-5 business days to schedule the wrapping appointment.",
    backToHome: "Back to Home",
    requirements: "Requirements",
    req1: "Vehicle not older than 10 years",
    req2: "At least 1,000 km/month driving",
    req3: "No major paint damage",
    req4: "Minimum contract 3 months",
    req5: "Vehicle must be registered in Germany",
    faq: "FAQ",
    faq1Q: "Will the wrap damage my paint?",
    faq1A: "No! We use high-quality, paint-safe wraps that can be removed without residue.",
    faq2Q: "When do I get paid?",
    faq2A: "Payment is made on the 1st of each month via bank transfer.",
    faq3Q: "What happens in an accident?",
    faq3A: "The wrap is fully insured. If damaged, it will be replaced free of charge.",
    faq4Q: "Can I cancel anytime?",
    faq4A: "After the minimum 3-month term, you can cancel with 2 weeks notice.",
    yourName: "Your Name",
    yourEmail: "Your Email",
    yourPhone: "Your Phone",
    selectBrand: "Select brand",
    selectYear: "Select year",
    selectCity: "Select city",
    applicationSuccess: "Registration successful!",
    applicationError: "Error submitting",
    myStatus: "My Status",
    pending: "Under Review",
    approved: "Approved",
    active: "Active",
    rejected: "Rejected",
    totalEarned: "Total Earned",
    nextPayout: "Next Payout",
    contractStart: "Contract Start",
    viewContract: "View Contract"
  },
  sq: {
    badge: "Reklamë në Makinë",
    heroTitle: "Fitoni",
    heroTitleHighlight: "€50/Muaj",
    heroDesc: "Po ngisni gjithsesi? Lëreni makinën tuaj të punojë për ju! Vendosni reklamën e BidBlitz në automjetin tuaj dhe fitoni të ardhura pasive çdo muaj.",
    applyNow: "Regjistrohu Tani",
    alreadyRegistered: "Tashmë i regjistruar? Kontrollo statusin",
    monthlyEarning: "Mujore",
    activeDrivers: "Shoferë Aktivë",
    citiesCovered: "Qytete",
    minContract: "Min. Kontratë",
    benefitsTitle: "Përfitimet Tuaja",
    benefit1Title: "€50 Çdo Muaj",
    benefit1Desc: "Pagesa mujore e garantuar",
    benefit2Title: "Mbështjellje Falas",
    benefit2Desc: "Ne mbulojmë të gjitha kostot",
    benefit3Title: "Pa Detyrime",
    benefit3Desc: "Anulo në çdo kohë pas 3 muajsh",
    benefit4Title: "Pagesë e Lehtë",
    benefit4Desc: "Transfertë mujore në llogarinë tuaj",
    benefit5Title: "Sigurim i Përfshirë",
    benefit5Desc: "Mbulim i plotë për mbështjellësin",
    benefit6Title: "Oferta Falas BidBlitz",
    benefit6Desc: "20 oferta falas çdo muaj",
    howItWorks: "Si Funksionon",
    step1Title: "Regjistrohu",
    step1Desc: "Regjistro automjetin tënd",
    step2Title: "Rishikim",
    step2Desc: "Ne kontrollojmë detajet tuaja",
    step3Title: "Takim",
    step3Desc: "Mbështjellje pranë jush",
    step4Title: "Fito",
    step4Desc: "€50/muaj në llogarinë tuaj",
    registerCar: "Regjistro Automjetin",
    carBrand: "Marka e Makinës",
    carModel: "Modeli",
    carYear: "Viti",
    carColor: "Ngjyra",
    licensePlate: "Targa",
    city: "Qyteti",
    kmPerMonth: "km të ngjitura/muaj",
    kmPlaceholder: "p.sh. 1500",
    parkingLocation: "Ku parkoni zakonisht?",
    parkingOptions: {
      street: "Rrugë (publike)",
      garage: "Garazh",
      parking: "Parking",
      driveway: "Hyrje"
    },
    carPhotos: "Foto të Automjetit",
    uploadFront: "Pamje përpara",
    uploadSide: "Pamje anësore",
    uploadBack: "Pamje prapa",
    additionalInfo: "Informacione Shtesë",
    additionalPlaceholder: "p.sh. veçori të veçanta, data të preferuara...",
    submit: "Dorëzo Aplikimin",
    submitting: "Duke dërguar...",
    successTitle: "Regjistrimi i Suksesshëm!",
    successDesc: "Faleminderit! Do të shqyrtojmë detajet tuaja dhe do t'ju kontaktojmë brenda 3-5 ditëve pune për të caktuar takimin e mbështjelljes.",
    backToHome: "Kthehu në Fillim",
    requirements: "Kërkesat",
    req1: "Automjeti jo më i vjetër se 10 vjet",
    req2: "Të paktën 1,000 km/muaj ngitje",
    req3: "Pa dëmtime të mëdha në bojë",
    req4: "Kontratë minimale 3 muaj",
    req5: "Automjeti duhet të jetë i regjistruar në Gjermani",
    faq: "Pyetje të Shpeshta",
    faq1Q: "A do ta dëmtojë mbështjellësi bojën time?",
    faq1A: "Jo! Ne përdorim mbështjellës cilësor që mund të hiqen pa mbetje.",
    faq2Q: "Kur do të paguhem?",
    faq2A: "Pagesa bëhet në datën 1 të çdo muaji përmes transfertës bankare.",
    faq3Q: "Çfarë ndodh në rast aksidenti?",
    faq3A: "Mbështjellësi është i siguruar plotësisht. Nëse dëmtohet, do të zëvendësohet falas.",
    faq4Q: "A mund ta anuloj në çdo kohë?",
    faq4A: "Pas afatit minimal 3-mujor, mund ta anuloni me njoftim 2-javor.",
    yourName: "Emri Juaj",
    yourEmail: "Email-i Juaj",
    yourPhone: "Telefoni Juaj",
    selectBrand: "Zgjidh markën",
    selectYear: "Zgjidh vitin",
    selectCity: "Zgjidh qytetin",
    applicationSuccess: "Regjistrimi i suksesshëm!",
    applicationError: "Gabim gjatë dërgimit",
    myStatus: "Statusi Im",
    pending: "Nën Shqyrtim",
    approved: "Aprovuar",
    active: "Aktiv",
    rejected: "Refuzuar",
    totalEarned: "Totali i Fituar",
    nextPayout: "Pagesa Tjetër",
    contractStart: "Fillimi i Kontratës",
    viewContract: "Shiko Kontratën"
  },
  tr: {
    badge: "Araç Reklamı",
    heroTitle: "Kazanın",
    heroTitleHighlight: "€50/Ay",
    heroDesc: "Zaten sürüyorsunuz? Aracınızın sizin için çalışmasına izin verin! Aracınıza BidBlitz reklamı koyun ve her ay pasif gelir kazanın.",
    applyNow: "Şimdi Kaydol",
    alreadyRegistered: "Zaten kayıtlı mısınız? Durumu kontrol edin",
    monthlyEarning: "Aylık",
    activeDrivers: "Aktif Sürücüler",
    citiesCovered: "Şehirler",
    minContract: "Min. Sözleşme",
    benefitsTitle: "Avantajlarınız",
    benefit1Title: "Her Ay €50",
    benefit1Desc: "Garantili aylık ödeme",
    benefit2Title: "Ücretsiz Araç Giydirme",
    benefit2Desc: "Tüm masrafları biz karşılıyoruz",
    benefit3Title: "Zorunluluk Yok",
    benefit3Desc: "3 aydan sonra istediğiniz zaman iptal edin",
    benefit4Title: "Kolay Ödeme",
    benefit4Desc: "Hesabınıza aylık transfer",
    benefit5Title: "Sigorta Dahil",
    benefit5Desc: "Kaplama için tam koruma",
    benefit6Title: "Ücretsiz BidBlitz Teklifleri",
    benefit6Desc: "Her ay 20 ücretsiz teklif",
    howItWorks: "Nasıl Çalışır",
    step1Title: "Kaydol",
    step1Desc: "Aracınızı kaydedin",
    step2Title: "İnceleme",
    step2Desc: "Bilgilerinizi kontrol ediyoruz",
    step3Title: "Randevu",
    step3Desc: "Yakınınızda giydirme",
    step4Title: "Kazan",
    step4Desc: "Hesabınıza €50/ay",
    registerCar: "Araç Kaydet",
    carBrand: "Araç Markası",
    carModel: "Model",
    carYear: "Yıl",
    carColor: "Renk",
    licensePlate: "Plaka",
    city: "Şehir",
    kmPerMonth: "Aylık km",
    kmPlaceholder: "örn. 1500",
    submit: "Başvuru Gönder",
    submitting: "Gönderiliyor...",
    requirements: "Gereksinimler",
    faq: "SSS"
  }
};

const carBrands = [
  'Audi', 'BMW', 'Mercedes-Benz', 'Volkswagen', 'Opel', 'Ford', 'Skoda',
  'Seat', 'Toyota', 'Honda', 'Hyundai', 'Kia', 'Mazda', 'Nissan', 'Peugeot',
  'Renault', 'Citroën', 'Fiat', 'Volvo', 'Mini', 'Porsche', 'Tesla', 'Andere'
];

const germanCities = [
  'Berlin', 'Hamburg', 'München', 'Köln', 'Frankfurt', 'Stuttgart', 'Düsseldorf',
  'Leipzig', 'Dortmund', 'Essen', 'Bremen', 'Dresden', 'Hannover', 'Nürnberg',
  'Duisburg', 'Bochum', 'Wuppertal', 'Bielefeld', 'Bonn', 'Münster'
];

export default function CarAdvertising() {
  const { language } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const t = translations[language] || translations.de;
  
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [myApplication, setMyApplication] = useState(null);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    carBrand: '',
    carModel: '',
    carYear: '',
    carColor: '',
    licensePlate: '',
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(`${API}/car-advertising/apply`, {
        ...formData,
        user_id: user?.id
      });
      
      toast.success(t.applicationSuccess);
      setSubmitted(true);
    } catch (error) {
      console.error('Application error:', error);
      toast.error(t.applicationError);
    } finally {
      setLoading(false);
    }
  };

  // Show status for existing applicants
  if (myApplication) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-amber-500 rounded-2xl flex items-center justify-center">
                <Car className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{t.myStatus}</h1>
                <p className="text-gray-500">{myApplication.car_brand} {myApplication.car_model}</p>
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
                  {t[myApplication.status]}
                </span>
              </div>
            </div>

            {myApplication.status === 'active' && (
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-sm text-gray-500">{t.totalEarned}</p>
                  <p className="text-2xl font-bold text-green-600">€{myApplication.total_earned?.toFixed(2) || '0.00'}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-sm text-gray-500">{t.nextPayout}</p>
                  <p className="text-2xl font-bold text-orange-600">€50.00</p>
                </div>
              </div>
            )}

            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">{t.carBrand}</span>
                <span className="font-medium">{myApplication.car_brand} {myApplication.car_model}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">{t.licensePlate}</span>
                <span className="font-medium">{myApplication.license_plate}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">{t.city}</span>
                <span className="font-medium">{myApplication.city}</span>
              </div>
              {myApplication.contract_start && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">{t.contractStart}</span>
                  <span className="font-medium">{new Date(myApplication.contract_start).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            <Link to="/">
              <Button variant="outline" className="w-full mt-6">
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
          <h1 className="text-3xl font-bold text-gray-800 mb-4">{t.successTitle}</h1>
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
      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 md:py-24">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-100/50 to-amber-100/50" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-orange-200 rounded-full blur-3xl opacity-30" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-amber-200 rounded-full blur-3xl opacity-30" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur px-4 py-2 rounded-full text-orange-600 font-medium mb-6 shadow-sm">
              <Car className="w-4 h-4" />
              {t.badge}
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-gray-800 mb-6">
              {t.heroTitle}{' '}
              <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
                {t.heroTitleHighlight}
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              {t.heroDesc}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => document.getElementById('register-form').scrollIntoView({ behavior: 'smooth' })}
                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-lg px-8 py-6 rounded-xl"
              >
                <Car className="w-5 h-5 mr-2" />
                {t.applyNow}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              { icon: Euro, value: '€50', label: t.monthlyEarning, color: 'from-green-400 to-emerald-500' },
              { icon: Users, value: '250+', label: t.activeDrivers, color: 'from-blue-400 to-cyan-500' },
              { icon: MapPin, value: '20+', label: t.citiesCovered, color: 'from-purple-400 to-violet-500' },
              { icon: Calendar, value: '3', label: t.minContract + ' (Mon)', color: 'from-orange-400 to-amber-500' }
            ].map((stat, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-6 shadow-lg text-center">
                <div className={`w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">{t.benefitsTitle}</h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { icon: Euro, title: t.benefit1Title, desc: t.benefit1Desc, color: 'bg-green-100 text-green-600' },
              { icon: Camera, title: t.benefit2Title, desc: t.benefit2Desc, color: 'bg-blue-100 text-blue-600' },
              { icon: Check, title: t.benefit3Title, desc: t.benefit3Desc, color: 'bg-purple-100 text-purple-600' },
              { icon: TrendingUp, title: t.benefit4Title, desc: t.benefit4Desc, color: 'bg-orange-100 text-orange-600' },
              { icon: Shield, title: t.benefit5Title, desc: t.benefit5Desc, color: 'bg-red-100 text-red-600' },
              { icon: Sparkles, title: t.benefit6Title, desc: t.benefit6Desc, color: 'bg-amber-100 text-amber-600' }
            ].map((benefit, idx) => (
              <div key={idx} className="bg-gray-50 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                <div className={`w-12 h-12 rounded-xl ${benefit.color} flex items-center justify-center mb-4`}>
                  <benefit.icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-gray-800 mb-2">{benefit.title}</h3>
                <p className="text-gray-600 text-sm">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-16 bg-gradient-to-b from-orange-50 to-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">{t.howItWorks}</h2>
          <div className="grid md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              { step: 1, title: t.step1Title, desc: t.step1Desc, icon: FileText },
              { step: 2, title: t.step2Title, desc: t.step2Desc, icon: Clock },
              { step: 3, title: t.step3Title, desc: t.step3Desc, icon: Calendar },
              { step: 4, title: t.step4Title, desc: t.step4Desc, icon: Euro }
            ].map((item, idx) => (
              <div key={idx} className="text-center relative">
                {idx < 3 && (
                  <div className="hidden md:block absolute top-8 left-1/2 w-full h-0.5 bg-orange-200" />
                )}
                <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4 relative z-10 shadow-lg">
                  <item.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-bold text-gray-800 mb-1">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Registration Form */}
      <section id="register-form" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-3xl p-8 shadow-xl">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                <Car className="w-8 h-8 text-orange-500" />
                {t.registerCar}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Info */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>{t.yourName} *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder={t.yourName}
                      required
                    />
                  </div>
                  <div>
                    <Label>{t.yourEmail} *</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder={t.yourEmail}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label>{t.yourPhone} *</Label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="+49 123 456789"
                    required
                  />
                </div>

                {/* Car Info */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>{t.carBrand} *</Label>
                    <Select value={formData.carBrand} onValueChange={(val) => setFormData({...formData, carBrand: val})}>
                      <SelectTrigger>
                        <SelectValue placeholder={t.selectBrand} />
                      </SelectTrigger>
                      <SelectContent>
                        {carBrands.map((brand) => (
                          <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{t.carModel} *</Label>
                    <Input
                      value={formData.carModel}
                      onChange={(e) => setFormData({...formData, carModel: e.target.value})}
                      placeholder="z.B. Golf, A4, C-Klasse"
                      required
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label>{t.carYear} *</Label>
                    <Select value={formData.carYear} onValueChange={(val) => setFormData({...formData, carYear: val})}>
                      <SelectTrigger>
                        <SelectValue placeholder={t.selectYear} />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({length: 15}, (_, i) => 2024 - i).map((year) => (
                          <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{t.carColor} *</Label>
                    <Input
                      value={formData.carColor}
                      onChange={(e) => setFormData({...formData, carColor: e.target.value})}
                      placeholder="z.B. Schwarz, Weiß"
                      required
                    />
                  </div>
                  <div>
                    <Label>{t.licensePlate} *</Label>
                    <Input
                      value={formData.licensePlate}
                      onChange={(e) => setFormData({...formData, licensePlate: e.target.value.toUpperCase()})}
                      placeholder="z.B. B-AB 1234"
                      required
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>{t.city} *</Label>
                    <Select value={formData.city} onValueChange={(val) => setFormData({...formData, city: val})}>
                      <SelectTrigger>
                        <SelectValue placeholder={t.selectCity} />
                      </SelectTrigger>
                      <SelectContent>
                        {germanCities.map((city) => (
                          <SelectItem key={city} value={city}>{city}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{t.kmPerMonth} *</Label>
                    <Input
                      type="number"
                      value={formData.kmPerMonth}
                      onChange={(e) => setFormData({...formData, kmPerMonth: e.target.value})}
                      placeholder={t.kmPlaceholder}
                      required
                      min="1000"
                    />
                  </div>
                </div>

                <div>
                  <Label>{t.parkingLocation}</Label>
                  <Select value={formData.parkingLocation} onValueChange={(val) => setFormData({...formData, parkingLocation: val})}>
                    <SelectTrigger>
                      <SelectValue placeholder={t.parkingLocation} />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(t.parkingOptions).map(([key, value]) => (
                        <SelectItem key={key} value={key}>{value}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>{t.additionalInfo}</Label>
                  <Textarea
                    value={formData.additionalInfo}
                    onChange={(e) => setFormData({...formData, additionalInfo: e.target.value})}
                    placeholder={t.additionalPlaceholder}
                    rows={3}
                  />
                </div>

                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 py-6 text-lg"
                >
                  {loading ? t.submitting : t.submit}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">{t.requirements}</h2>
            <div className="bg-white rounded-2xl p-6 space-y-3">
              {[t.req1, t.req2, t.req3, t.req4, t.req5].map((req, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">{req}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center">{t.faq}</h2>
          <div className="max-w-2xl mx-auto space-y-4">
            {[
              { q: t.faq1Q, a: t.faq1A },
              { q: t.faq2Q, a: t.faq2A },
              { q: t.faq3Q, a: t.faq3A },
              { q: t.faq4Q, a: t.faq4A }
            ].map((item, idx) => (
              <div key={idx} className="bg-gray-50 rounded-xl p-5">
                <h3 className="font-semibold text-gray-800 mb-2">{item.q}</h3>
                <p className="text-gray-600 text-sm">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
