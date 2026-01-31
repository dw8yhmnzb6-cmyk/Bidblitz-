import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { 
  Star, TrendingUp, Users, DollarSign, BarChart3, 
  Copy, Check, Eye, ShoppingCart, Calendar, ArrowRight,
  Instagram, Youtube, Clock, Zap, Gift, LogOut, Gavel, Crown,
  Wallet, CreditCard, Building, History, Bell, X
} from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Translations for InfluencerDashboard
const dashboardTranslations = {
  de: {
    title: "Influencer Dashboard",
    login: "Influencer Login",
    loginDesc: "Melden Sie sich mit Ihrem Influencer-Code an",
    code: "Ihr Code",
    codePlaceholder: "z.B. maxpower",
    email: "E-Mail",
    emailPlaceholder: "ihre@email.de",
    loginBtn: "Anmelden",
    checking: "Wird geprüft...",
    logout: "Ausloggen",
    vipActive: "VIP-Status aktiv",
    vipFree: "KOSTENLOS",
    vipDesc: "Als Influencer haben Sie unbegrenzten VIP-Zugang!",
    auctions: "Auktionen",
    vipAuctions: "VIP-Auktionen",
    buyBids: "Gebote kaufen",
    yourBalance: "Ihr Guthaben",
    bids: "Gebote",
    codeUsages: "Code-Nutzungen",
    followers: "Geworbene Kunden",
    purchases: "Käufe",
    totalSales: "Generierter Umsatz",
    yourCommission: "Ihre Provision",
    commission: "Provision",
    payout: "Auszahlung",
    availableBalance: "Verfügbares Guthaben",
    alreadyPaid: "Bereits ausgezahlt",
    minPayout: "Mindestbetrag für Auszahlung",
    requestPayout: "Auszahlung anfordern",
    payoutRequest: "Auszahlung anfordern",
    amount: "Betrag",
    minAmount: "min. €50",
    paymentMethod: "Zahlungsmethode",
    bankTransfer: "Banküberweisung",
    iban: "IBAN",
    bankName: "Bank Name",
    paypalEmail: "PayPal E-Mail",
    lastPayouts: "Letzte Auszahlungen",
    cancel: "Abbrechen",
    sending: "Wird gesendet...",
    submit: "Auszahlung anfordern",
    promoTools: "Promo-Tools",
    shareLink: "Empfehlungslink",
    copyLink: "Link kopieren",
    copied: "Kopiert!",
    discountCode: "Rabattcode für Ihre Follower",
    notifications: "Benachrichtigungen",
    noNotifications: "Keine Benachrichtigungen",
    completed: "Ausgezahlt",
    pending: "In Bearbeitung",
    rejected: "Abgelehnt",
    loginSuccess: "Erfolgreich eingeloggt! Sie haben jetzt VIP-Zugang.",
    loginError: "Login fehlgeschlagen. Bitte prüfen Sie Ihren Code und E-Mail.",
    loggedOut: "Ausgeloggt"
  },
  en: {
    title: "Influencer Dashboard",
    login: "Influencer Login",
    loginDesc: "Log in with your influencer code",
    code: "Your Code",
    codePlaceholder: "e.g. maxpower",
    email: "Email",
    emailPlaceholder: "your@email.com",
    loginBtn: "Login",
    checking: "Checking...",
    logout: "Logout",
    vipActive: "VIP Status Active",
    vipFree: "FREE",
    vipDesc: "As an influencer, you have unlimited VIP access!",
    auctions: "Auctions",
    vipAuctions: "VIP Auctions",
    buyBids: "Buy Bids",
    yourBalance: "Your Balance",
    bids: "Bids",
    codeUsages: "Code Usages",
    followers: "Recruited Customers",
    purchases: "Purchases",
    totalSales: "Total Revenue",
    yourCommission: "Your Commission",
    commission: "Commission",
    payout: "Payout",
    availableBalance: "Available Balance",
    alreadyPaid: "Already Paid",
    minPayout: "Minimum payout amount",
    requestPayout: "Request Payout",
    payoutRequest: "Request Payout",
    amount: "Amount",
    minAmount: "min. €50",
    paymentMethod: "Payment Method",
    bankTransfer: "Bank Transfer",
    iban: "IBAN",
    bankName: "Bank Name",
    paypalEmail: "PayPal Email",
    lastPayouts: "Recent Payouts",
    cancel: "Cancel",
    sending: "Sending...",
    submit: "Request Payout",
    promoTools: "Promo Tools",
    shareLink: "Referral Link",
    copyLink: "Copy Link",
    copied: "Copied!",
    discountCode: "Discount Code for Followers",
    notifications: "Notifications",
    noNotifications: "No notifications",
    completed: "Completed",
    pending: "Pending",
    rejected: "Rejected",
    loginSuccess: "Successfully logged in! You now have VIP access.",
    loginError: "Login failed. Please check your code and email.",
    loggedOut: "Logged out"
  },
  tr: {
    title: "Influencer Paneli",
    login: "Influencer Girişi",
    loginDesc: "Influencer kodunuzla giriş yapın",
    code: "Kodunuz",
    codePlaceholder: "örn. maxpower",
    email: "E-posta",
    emailPlaceholder: "email@adresiniz.com",
    loginBtn: "Giriş Yap",
    checking: "Kontrol ediliyor...",
    logout: "Çıkış Yap",
    vipActive: "VIP Durumu Aktif",
    vipFree: "ÜCRETSİZ",
    vipDesc: "Influencer olarak sınırsız VIP erişiminiz var!",
    auctions: "Müzayedeler",
    vipAuctions: "VIP Müzayedeler",
    buyBids: "Teklif Satın Al",
    yourBalance: "Bakiyeniz",
    bids: "Teklif",
    codeUsages: "Kod Kullanımları",
    followers: "Kazanılan Müşteriler",
    purchases: "Satın Almalar",
    totalSales: "Toplam Gelir",
    yourCommission: "Komisyonunuz",
    commission: "Komisyon",
    payout: "Ödeme",
    availableBalance: "Mevcut Bakiye",
    alreadyPaid: "Ödenen",
    minPayout: "Minimum ödeme tutarı",
    requestPayout: "Ödeme Talep Et",
    payoutRequest: "Ödeme Talep Et",
    amount: "Tutar",
    minAmount: "min. €50",
    paymentMethod: "Ödeme Yöntemi",
    bankTransfer: "Banka Havalesi",
    iban: "IBAN",
    bankName: "Banka Adı",
    paypalEmail: "PayPal E-posta",
    lastPayouts: "Son Ödemeler",
    cancel: "İptal",
    sending: "Gönderiliyor...",
    submit: "Ödeme Talep Et",
    promoTools: "Promosyon Araçları",
    shareLink: "Referans Linki",
    copyLink: "Linki Kopyala",
    copied: "Kopyalandı!",
    discountCode: "Takipçiler için İndirim Kodu",
    notifications: "Bildirimler",
    noNotifications: "Bildirim yok",
    completed: "Tamamlandı",
    pending: "Beklemede",
    rejected: "Reddedildi",
    loginSuccess: "Başarıyla giriş yapıldı! Artık VIP erişiminiz var.",
    loginError: "Giriş başarısız. Lütfen kod ve e-postanızı kontrol edin.",
    loggedOut: "Çıkış yapıldı"
  },
  fr: {
    title: "Tableau de Bord Influenceur",
    login: "Connexion Influenceur",
    loginDesc: "Connectez-vous avec votre code influenceur",
    code: "Votre Code",
    codePlaceholder: "ex. maxpower",
    email: "Email",
    emailPlaceholder: "votre@email.com",
    loginBtn: "Connexion",
    checking: "Vérification...",
    logout: "Déconnexion",
    vipActive: "Statut VIP Actif",
    vipFree: "GRATUIT",
    vipDesc: "En tant qu'influenceur, vous avez un accès VIP illimité!",
    auctions: "Enchères",
    vipAuctions: "Enchères VIP",
    buyBids: "Acheter des Enchères",
    yourBalance: "Votre Solde",
    bids: "Enchères",
    codeUsages: "Utilisations du Code",
    followers: "Clients Recrutés",
    purchases: "Achats",
    totalSales: "Chiffre d'Affaires",
    yourCommission: "Votre Commission",
    commission: "Commission",
    payout: "Paiement",
    availableBalance: "Solde Disponible",
    alreadyPaid: "Déjà Payé",
    minPayout: "Montant minimum de paiement",
    requestPayout: "Demander un Paiement",
    payoutRequest: "Demander un Paiement",
    amount: "Montant",
    minAmount: "min. 50€",
    paymentMethod: "Mode de Paiement",
    bankTransfer: "Virement Bancaire",
    iban: "IBAN",
    bankName: "Nom de la Banque",
    paypalEmail: "Email PayPal",
    lastPayouts: "Derniers Paiements",
    cancel: "Annuler",
    sending: "Envoi...",
    submit: "Demander le Paiement",
    promoTools: "Outils Promo",
    shareLink: "Lien de Parrainage",
    copyLink: "Copier le Lien",
    copied: "Copié!",
    discountCode: "Code de Réduction pour vos Abonnés",
    notifications: "Notifications",
    noNotifications: "Aucune notification",
    completed: "Complété",
    pending: "En attente",
    rejected: "Rejeté",
    loginSuccess: "Connexion réussie! Vous avez maintenant un accès VIP.",
    loginError: "Échec de connexion. Vérifiez votre code et email.",
    loggedOut: "Déconnecté"
  },
  sq: {
    title: "Paneli i Influencerit",
    login: "Hyrja e Influencerit",
    loginDesc: "Hyni me kodin tuaj të influencerit",
    code: "Kodi Juaj",
    codePlaceholder: "p.sh. maxpower",
    email: "Email",
    emailPlaceholder: "email@juaj.com",
    loginBtn: "Hyr",
    checking: "Duke kontrolluar...",
    logout: "Dil",
    vipActive: "Statusi VIP Aktiv",
    vipFree: "FALAS",
    vipDesc: "Si influencer, keni qasje të pakufizuar VIP!",
    auctions: "Ankandet",
    vipAuctions: "Ankandet VIP",
    buyBids: "Bli Oferta",
    yourBalance: "Bilanci Juaj",
    bids: "Oferta",
    codeUsages: "Përdorimet e Kodit",
    followers: "Klientët e Fituar",
    purchases: "Blerjet",
    totalSales: "Të Ardhurat Totale",
    yourCommission: "Komisioni Juaj",
    commission: "Komision",
    payout: "Pagesa",
    availableBalance: "Bilanci i Disponueshëm",
    alreadyPaid: "Tashmë i Paguar",
    minPayout: "Shuma minimale e pagesës",
    requestPayout: "Kërko Pagesë",
    payoutRequest: "Kërko Pagesë",
    amount: "Shuma",
    minAmount: "min. €50",
    paymentMethod: "Metoda e Pagesës",
    bankTransfer: "Transfertë Bankare",
    iban: "IBAN",
    bankName: "Emri i Bankës",
    paypalEmail: "Email PayPal",
    lastPayouts: "Pagesat e Fundit",
    cancel: "Anulo",
    sending: "Duke dërguar...",
    submit: "Kërko Pagesën",
    promoTools: "Mjetet Promo",
    shareLink: "Linku i Referimit",
    copyLink: "Kopjo Linkun",
    copied: "U kopjua!",
    discountCode: "Kodi i Zbritjes për Ndjekësit",
    notifications: "Njoftimet",
    noNotifications: "Nuk ka njoftimet",
    completed: "Përfunduar",
    pending: "Në pritje",
    rejected: "Refuzuar",
    loginSuccess: "Hyrje e suksesshme! Tani keni qasje VIP.",
    loginError: "Hyrja dështoi. Ju lutem kontrolloni kodin dhe emailin.",
    loggedOut: "Dolët"
  }
};

export default function InfluencerDashboard() {
  const navigate = useNavigate();
  const { loginAsInfluencer, logout: authLogout, user: authUser, isInfluencer } = useAuth();
  const { language } = useLanguage();
  const t = dashboardTranslations[language] || dashboardTranslations.de;
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [influencer, setInfluencer] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Notifications state
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Payout states
  const [payoutBalance, setPayoutBalance] = useState(null);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutMethod, setPayoutMethod] = useState('bank_transfer');
  const [payoutAmount, setPayoutAmount] = useState('');
  const [bankIban, setBankIban] = useState('');
  const [bankName, setBankName] = useState('');
  const [paypalEmail, setPaypalEmail] = useState('');
  const [payoutHistory, setPayoutHistory] = useState([]);
  const [payoutLoading, setPayoutLoading] = useState(false);
  
  // Login form
  const [loginCode, setLoginCode] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  
  // Check if already logged in (either via localStorage or AuthContext)
  useEffect(() => {
    // If logged in via AuthContext as influencer
    if (authUser && isInfluencer) {
      const savedInfluencer = localStorage.getItem('influencer_data');
      if (savedInfluencer) {
        try {
          const data = JSON.parse(savedInfluencer);
          setInfluencer(data);
          setIsLoggedIn(true);
          fetchStats(data.code);
        } catch (e) {
          localStorage.removeItem('influencer_data');
        }
      }
    } else {
      // Check localStorage for influencer data
      const savedInfluencer = localStorage.getItem('influencer_data');
      if (savedInfluencer) {
        try {
          const data = JSON.parse(savedInfluencer);
          setInfluencer(data);
          setIsLoggedIn(true);
          fetchStats(data.code);
        } catch (e) {
          localStorage.removeItem('influencer_data');
        }
      }
    }
  }, [authUser, isInfluencer]);
  
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Validate influencer code and email
      const response = await axios.post(`${API}/influencer/login`, {
        code: loginCode.toLowerCase(),
        email: loginEmail
      });
      
      if (response.data.success) {
        // Save influencer data
        setInfluencer(response.data.influencer);
        setIsLoggedIn(true);
        localStorage.setItem('influencer_data', JSON.stringify(response.data.influencer));
        
        // Login to AuthContext with JWT token (enables bidding, VIP features)
        if (response.data.token && response.data.user) {
          loginAsInfluencer(response.data.token, response.data.user);
        }
        
        toast.success(t.loginSuccess);
        fetchStats(response.data.influencer.code);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || t.loginError);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchStats = async (code) => {
    try {
      const response = await axios.get(`${API}/influencer/stats/${code}`);
      setStats(response.data);
      // Also fetch payout balance and notifications
      fetchPayoutBalance(code);
      fetchNotifications(code);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };
  
  const fetchPayoutBalance = async (code) => {
    try {
      const response = await axios.get(`${API}/influencer/payout/balance/${code}`);
      setPayoutBalance(response.data);
    } catch (error) {
      console.error('Error fetching payout balance:', error);
    }
  };
  
  const fetchNotifications = async (code) => {
    try {
      const [notifResponse, countResponse] = await Promise.all([
        axios.get(`${API}/influencer/notifications/${code}`),
        axios.get(`${API}/influencer/notifications/${code}/unread-count`)
      ]);
      setNotifications(notifResponse.data);
      setUnreadCount(countResponse.data.unread_count);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };
  
  const markNotificationsRead = async () => {
    if (!influencer?.code) return;
    try {
      await axios.post(`${API}/influencer/notifications/${influencer.code}/mark-read`);
      setUnreadCount(0);
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking notifications read:', error);
    }
  };
  
  const fetchPayoutHistory = async (code) => {
    try {
      const response = await axios.get(`${API}/influencer/payout/history/${code}`);
      setPayoutHistory(response.data);
    } catch (error) {
      console.error('Error fetching payout history:', error);
    }
  };
  
  const handlePayoutRequest = async () => {
    if (!influencer?.code) return;
    
    const amount = parseFloat(payoutAmount);
    if (isNaN(amount) || amount < 50) {
      toast.error('Mindestbetrag für Auszahlung: €50');
      return;
    }
    
    if (payoutMethod === 'bank_transfer' && (!bankIban || !bankName)) {
      toast.error('Bitte IBAN und Bankname eingeben');
      return;
    }
    
    if (payoutMethod === 'paypal' && !paypalEmail) {
      toast.error('Bitte PayPal E-Mail eingeben');
      return;
    }
    
    setPayoutLoading(true);
    try {
      const response = await axios.post(`${API}/influencer/payout/request/${influencer.code}`, {
        amount,
        payment_method: payoutMethod,
        bank_iban: bankIban,
        bank_name: bankName,
        paypal_email: paypalEmail
      });
      
      if (response.data.success) {
        toast.success(response.data.message);
        setShowPayoutModal(false);
        setPayoutAmount('');
        setBankIban('');
        setBankName('');
        setPaypalEmail('');
        fetchPayoutBalance(influencer.code);
        fetchPayoutHistory(influencer.code);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Fehler bei der Auszahlungsanfrage');
    } finally {
      setPayoutLoading(false);
    }
  };
  
  const handleLogout = () => {
    localStorage.removeItem('influencer_data');
    authLogout(); // Also logout from AuthContext
    setIsLoggedIn(false);
    setInfluencer(null);
    setStats(null);
    toast.success(t.loggedOut);
    navigate('/');
  };
  
  const copyCode = () => {
    if (influencer?.code) {
      navigator.clipboard.writeText(influencer.code);
      setCopied(true);
      toast.success(t.copied);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  const copyLink = () => {
    const link = `https://bidblitz.de/register?ref=${influencer?.code}`;
    navigator.clipboard.writeText(link);
    toast.success(t.copied);
  };
  
  // Login Page
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-4" data-testid="influencer-login">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center mx-auto mb-4">
              <Star className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Influencer Login</h1>
            <p className="text-gray-400">
              Melden Sie sich an, um Ihre Statistiken und Einnahmen zu sehen
            </p>
          </div>
          
          {/* Login Form */}
          <div className="glass-card rounded-2xl p-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label className="text-white">Ihr Influencer-Code</Label>
                <Input
                  value={loginCode}
                  onChange={(e) => setLoginCode(e.target.value)}
                  placeholder="z.B. maxpower"
                  className="bg-[#181824] border-white/10 text-white"
                  required
                />
              </div>
              <div>
                <Label className="text-white">E-Mail-Adresse</Label>
                <Input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="ihre@email.de"
                  className="bg-[#181824] border-white/10 text-white"
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={loading || !loginCode || !loginEmail}
                className="w-full py-3 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-black font-bold"
              >
                {loading ? 'Wird geprüft...' : 'Anmelden'}
              </Button>
            </form>
            
            <div className="mt-6 pt-6 border-t border-white/10 text-center">
              <p className="text-gray-400 text-sm mb-3">Noch kein Influencer?</p>
              <Link to="/influencer-werden">
                <Button variant="outline" className="border-yellow-400/50 text-yellow-400 hover:bg-yellow-400/10">
                  Jetzt Partner werden →
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Dashboard
  return (
    <div className="min-h-screen pt-24 pb-12 px-4" data-testid="influencer-dashboard">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center">
                <Star className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">{influencer?.name}</h1>
                <p className="text-gray-400 flex items-center gap-2">
                  <span>Code:</span>
                  <code className="bg-yellow-400/20 text-yellow-400 px-2 py-0.5 rounded font-bold">
                    {influencer?.code}
                  </code>
                  <button onClick={copyCode} className="text-yellow-400 hover:text-yellow-300">
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {/* Notifications Button */}
            <div className="relative">
              <Button 
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  if (!showNotifications && unreadCount > 0) {
                    markNotificationsRead();
                  }
                }} 
                variant="outline" 
                className="border-white/20 text-white relative"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center text-white font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>
              
              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 top-12 w-80 md:w-96 max-h-96 overflow-y-auto glass-card rounded-xl p-4 z-50 shadow-2xl">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-white font-bold flex items-center gap-2">
                      <Bell className="w-4 h-4 text-yellow-400" />
                      Benachrichtigungen
                    </h3>
                    <button onClick={() => setShowNotifications(false)} className="text-gray-400 hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {notifications.length > 0 ? (
                    <div className="space-y-2">
                      {notifications.map((notif, idx) => (
                        <div 
                          key={idx} 
                          className={`p-3 rounded-lg ${notif.read ? 'bg-[#181824]' : 'bg-yellow-400/10 border border-yellow-400/30'}`}
                        >
                          <p className="text-white font-medium text-sm">{notif.title}</p>
                          <p className="text-gray-400 text-xs mt-1">{notif.message}</p>
                          <p className="text-gray-500 text-xs mt-2 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(notif.created_at).toLocaleDateString('de-DE', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">Keine Benachrichtigungen</p>
                  )}
                </div>
              )}
            </div>
            
            <Button onClick={handleLogout} variant="outline" className="border-white/20 text-white">
              <LogOut className="w-4 h-4 mr-2" />
              Ausloggen
            </Button>
          </div>
        </div>
        
        {/* VIP Status Banner */}
        <div className="glass-card rounded-xl p-4 mb-6 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-white font-bold flex items-center gap-2">
                  VIP-Status aktiv
                  <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">KOSTENLOS</span>
                </p>
                <p className="text-gray-400 text-sm">Als Influencer haben Sie unbegrenzten VIP-Zugang!</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to="/auctions">
                <Button className="bg-cyan-500 hover:bg-cyan-600 text-white">
                  <Gavel className="w-4 h-4 mr-2" />
                  Auktionen
                </Button>
              </Link>
              <Link to="/vip-auctions">
                <Button className="bg-purple-500 hover:bg-purple-600 text-white">
                  <Crown className="w-4 h-4 mr-2" />
                  VIP-Auktionen
                </Button>
              </Link>
              <Link to="/buy-bids">
                <Button className="bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-black font-bold">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Gebote kaufen
                </Button>
              </Link>
            </div>
          </div>
          {authUser && (
            <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-4">
              <span className="text-gray-400 text-sm">Ihr Guthaben:</span>
              <span className="text-2xl font-bold text-cyan-400">{authUser.bids_balance || 0} Gebote</span>
            </div>
          )}
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="glass-card rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-cyan-400" />
              <span className="text-gray-400 text-sm">Code-Nutzungen</span>
            </div>
            <p className="text-3xl font-bold text-white">{stats?.total_uses || 0}</p>
          </div>
          
          <div className="glass-card rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <ShoppingCart className="w-5 h-5 text-green-400" />
              <span className="text-gray-400 text-sm">Käufe</span>
            </div>
            <p className="text-3xl font-bold text-white">{stats?.total_purchases || 0}</p>
          </div>
          
          <div className="glass-card rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              <span className="text-gray-400 text-sm">Generierter Umsatz</span>
            </div>
            <p className="text-3xl font-bold text-green-400">€{(stats?.total_revenue || 0).toFixed(2)}</p>
          </div>
          
          <div className="glass-card rounded-xl p-5 bg-gradient-to-br from-yellow-400/10 to-amber-500/10 border border-yellow-400/30">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-5 h-5 text-yellow-400" />
              <span className="text-yellow-400 text-sm">Ihre Provision</span>
            </div>
            <p className="text-3xl font-bold text-yellow-400">€{(stats?.total_commission || 0).toFixed(2)}</p>
            <p className="text-xs text-gray-400 mt-1">{influencer?.commission_percent || 10}% Provision</p>
          </div>
        </div>
        
        {/* Payout Section */}
        <div className="glass-card rounded-xl p-6 mb-8 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-green-400" />
                Auszahlung
              </h3>
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-gray-400 text-sm">Verfügbares Guthaben</p>
                  <p className="text-3xl font-bold text-green-400">€{(payoutBalance?.available_balance || 0).toFixed(2)}</p>
                </div>
                <div className="border-l border-white/10 pl-4">
                  <p className="text-gray-400 text-sm">Bereits ausgezahlt</p>
                  <p className="text-xl font-bold text-gray-300">€{(payoutBalance?.total_paid || 0).toFixed(2)}</p>
                </div>
              </div>
              <p className="text-gray-500 text-xs mt-2">Mindestbetrag für Auszahlung: €50</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  fetchPayoutHistory(influencer?.code);
                  setShowPayoutModal(true);
                }}
                disabled={!payoutBalance?.can_withdraw}
                className={`${payoutBalance?.can_withdraw 
                  ? 'bg-green-500 hover:bg-green-600' 
                  : 'bg-gray-600 cursor-not-allowed'} text-white font-bold px-6`}
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Auszahlung anfordern
              </Button>
            </div>
          </div>
        </div>
        
        {/* Payout Modal */}
        {showPayoutModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="glass-card rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Wallet className="w-6 h-6 text-green-400" />
                Auszahlung anfordern
              </h3>
              
              {/* Balance Info */}
              <div className="bg-[#181824] rounded-lg p-4 mb-4">
                <p className="text-gray-400 text-sm">Verfügbares Guthaben</p>
                <p className="text-2xl font-bold text-green-400">€{(payoutBalance?.available_balance || 0).toFixed(2)}</p>
              </div>
              
              {/* Amount Input */}
              <div className="mb-4">
                <Label className="text-white">Betrag (min. €50)</Label>
                <Input
                  type="number"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  placeholder="z.B. 50.00"
                  min="50"
                  max={payoutBalance?.available_balance || 0}
                  className="bg-[#181824] border-white/10 text-white"
                />
              </div>
              
              {/* Payment Method */}
              <div className="mb-4">
                <Label className="text-white mb-2 block">Zahlungsmethode</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={() => setPayoutMethod('bank_transfer')}
                    className={`flex-1 ${payoutMethod === 'bank_transfer' 
                      ? 'bg-green-500 text-white' 
                      : 'bg-[#181824] text-gray-400 border border-white/10'}`}
                  >
                    <Building className="w-4 h-4 mr-2" />
                    Banküberweisung
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setPayoutMethod('paypal')}
                    className={`flex-1 ${payoutMethod === 'paypal' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-[#181824] text-gray-400 border border-white/10'}`}
                  >
                    PayPal
                  </Button>
                </div>
              </div>
              
              {/* Bank Transfer Fields */}
              {payoutMethod === 'bank_transfer' && (
                <div className="space-y-3 mb-4">
                  <div>
                    <Label className="text-white">IBAN</Label>
                    <Input
                      value={bankIban}
                      onChange={(e) => setBankIban(e.target.value)}
                      placeholder="DE89 3704 0044 0532 0130 00"
                      className="bg-[#181824] border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Bank Name</Label>
                    <Input
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="z.B. Deutsche Bank"
                      className="bg-[#181824] border-white/10 text-white"
                    />
                  </div>
                </div>
              )}
              
              {/* PayPal Fields */}
              {payoutMethod === 'paypal' && (
                <div className="mb-4">
                  <Label className="text-white">PayPal E-Mail</Label>
                  <Input
                    type="email"
                    value={paypalEmail}
                    onChange={(e) => setPaypalEmail(e.target.value)}
                    placeholder="ihre@paypal-email.de"
                    className="bg-[#181824] border-white/10 text-white"
                  />
                </div>
              )}
              
              {/* Payout History */}
              {payoutHistory.length > 0 && (
                <div className="mb-4">
                  <Label className="text-white mb-2 block flex items-center gap-2">
                    <History className="w-4 h-4" />
                    Letzte Auszahlungen
                  </Label>
                  <div className="bg-[#181824] rounded-lg p-3 max-h-32 overflow-y-auto">
                    {payoutHistory.slice(0, 5).map((payout, idx) => (
                      <div key={idx} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                        <div>
                          <p className="text-white text-sm">€{payout.amount?.toFixed(2)}</p>
                          <p className="text-gray-500 text-xs">{new Date(payout.created_at).toLocaleDateString('de-DE')}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded ${
                          payout.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                          payout.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {payout.status === 'completed' ? 'Ausgezahlt' : 
                           payout.status === 'pending' ? 'In Bearbeitung' : 'Abgelehnt'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowPayoutModal(false)}
                  variant="outline"
                  className="flex-1 border-white/20 text-white"
                >
                  Abbrechen
                </Button>
                <Button
                  onClick={handlePayoutRequest}
                  disabled={payoutLoading || !payoutAmount || parseFloat(payoutAmount) < 50}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold"
                >
                  {payoutLoading ? 'Wird gesendet...' : 'Auszahlung anfordern'}
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {/* Promo Tools */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Share Link */}
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-cyan-400" />
              Ihr Empfehlungslink
            </h3>
            <div className="bg-[#181824] rounded-lg p-3 flex items-center gap-2">
              <code className="text-cyan-400 text-sm flex-1 truncate">
                https://bidblitz.de/register?ref={influencer?.code}
              </code>
              <Button size="sm" onClick={copyLink} className="bg-cyan-500 hover:bg-cyan-600">
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-gray-400 text-sm mt-3">
              Teilen Sie diesen Link mit Ihren Followern. Bei jeder Registrierung und Kauf erhalten Sie Provision!
            </p>
          </div>
          
          {/* Code Promo */}
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Gift className="w-5 h-5 text-green-400" />
              Rabattcode für Follower
            </h3>
            <div className="bg-gradient-to-r from-yellow-400/20 to-amber-500/20 rounded-lg p-4 text-center border border-yellow-400/30">
              <p className="text-gray-400 text-sm mb-1">Mit Code</p>
              <p className="text-3xl font-black text-yellow-400">{influencer?.code?.toUpperCase()}</p>
              <p className="text-white text-sm mt-1">5% Rabatt auf den ersten Kauf!</p>
            </div>
            <p className="text-gray-400 text-sm mt-3">
              Ihre Follower geben den Code beim Checkout ein und sparen!
            </p>
          </div>
        </div>
        
        {/* Recent Activity */}
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-400" />
            Letzte Aktivitäten
          </h3>
          
          {stats?.recent_uses && stats.recent_uses.length > 0 ? (
            <div className="space-y-3">
              {stats.recent_uses.map((use, index) => (
                <div key={index} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
                      <Users className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-white">{use.user_name || 'Neuer Nutzer'}</p>
                      <p className="text-gray-500 text-xs flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(use.created_at).toLocaleDateString('de-DE')}
                      </p>
                    </div>
                  </div>
                  {use.purchase_amount > 0 && (
                    <span className="text-green-400 font-bold">+€{use.purchase_amount.toFixed(2)}</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>Noch keine Aktivitäten</p>
              <p className="text-sm mt-1">Teilen Sie Ihren Code, um Einnahmen zu generieren!</p>
            </div>
          )}
        </div>
        
        {/* Social Profiles */}
        {(influencer?.instagram || influencer?.youtube || influencer?.tiktok) && (
          <div className="mt-6 flex items-center justify-center gap-4">
            {influencer.instagram && (
              <a href={`https://instagram.com/${influencer.instagram}`} target="_blank" rel="noopener noreferrer"
                className="text-gray-400 hover:text-pink-400 transition-colors">
                <Instagram className="w-6 h-6" />
              </a>
            )}
            {influencer.youtube && (
              <a href={`https://youtube.com/${influencer.youtube}`} target="_blank" rel="noopener noreferrer"
                className="text-gray-400 hover:text-red-500 transition-colors">
                <Youtube className="w-6 h-6" />
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
