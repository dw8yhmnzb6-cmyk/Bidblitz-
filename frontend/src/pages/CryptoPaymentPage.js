import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import axios from 'axios';
import { toast } from 'sonner';
import { 
  Bitcoin, Wallet, QrCode, Copy, Check,
  ArrowRight, Clock, Shield, Zap
} from 'lucide-react';
import { Button } from '../components/ui/button';

const API = process.env.REACT_APP_BACKEND_URL;

// Crypto icons
const cryptoIcons = {
  BTC: '₿',
  ETH: 'Ξ',
  USDT: '₮',
  USDC: '$',
  LTC: 'Ł'
};

// Translations
const translations = {
  de: {
    title: 'Krypto-Zahlung',
    subtitle: 'Bezahle mit Bitcoin, Ethereum und mehr',
    selectCrypto: 'Währung wählen',
    amount: 'Betrag (EUR)',
    equivalent: 'Entspricht',
    createPayment: 'Zahlung erstellen',
    waitingPayment: 'Warte auf Zahlung...',
    sendExactly: 'Sende genau',
    toAddress: 'an folgende Adresse',
    copyAddress: 'Adresse kopieren',
    copied: 'Kopiert!',
    expiresIn: 'Läuft ab in',
    minutes: 'Minuten',
    paymentReceived: 'Zahlung empfangen!',
    processing: 'Verarbeitung...',
    benefits: {
      fast: 'Schnelle Bestätigung',
      secure: 'Sichere Blockchain',
      anonymous: 'Keine Bankdaten nötig'
    },
    instructions: 'Anleitung',
    step1: 'Wähle deine Kryptowährung',
    step2: 'Gib den Betrag ein',
    step3: 'Scanne den QR-Code oder kopiere die Adresse',
    step4: 'Sende den exakten Betrag',
    demoButton: 'Demo: Zahlung bestätigen'
  },
  en: {
    title: 'Crypto Payment',
    subtitle: 'Pay with Bitcoin, Ethereum and more',
    selectCrypto: 'Select Currency',
    amount: 'Amount (EUR)',
    equivalent: 'Equivalent to',
    createPayment: 'Create Payment',
    waitingPayment: 'Waiting for payment...',
    sendExactly: 'Send exactly',
    toAddress: 'to the following address',
    copyAddress: 'Copy Address',
    copied: 'Copied!',
    expiresIn: 'Expires in',
    minutes: 'minutes',
    paymentReceived: 'Payment received!',
    processing: 'Processing...',
    benefits: {
      fast: 'Fast confirmation',
      secure: 'Secure blockchain',
      anonymous: 'No bank details needed'
    },
    instructions: 'Instructions',
    step1: 'Select your cryptocurrency',
    step2: 'Enter the amount',
    step3: 'Scan the QR code or copy the address',
    step4: 'Send the exact amount',
    demoButton: 'Demo: Confirm Payment'
  }
};

export default function CryptoPaymentPage() {
  const { isAuthenticated, token } = useAuth();
  const { language, mappedLanguage } = useLanguage();
  const navigate = useNavigate();
  const t = translations[mappedLanguage] || translations[language] || translations.de;
  
  const [cryptos, setCryptos] = useState([]);
  const [selectedCrypto, setSelectedCrypto] = useState('BTC');
  const [amount, setAmount] = useState(50);
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  
  // Fetch supported cryptos
  useEffect(() => {
    const fetchCryptos = async () => {
      try {
        const res = await axios.get(`${API}/api/crypto/supported`);
        setCryptos(res.data.cryptocurrencies || []);
      } catch (error) {
        console.error('Error fetching cryptos:', error);
      }
    };
    fetchCryptos();
  }, []);
  
  // Countdown timer
  useEffect(() => {
    if (payment && payment.expires_at) {
      const updateTimer = () => {
        const expires = new Date(payment.expires_at).getTime();
        const now = Date.now();
        const diff = Math.max(0, Math.floor((expires - now) / 1000));
        setTimeLeft(diff);
        
        if (diff === 0) {
          setPayment(null);
          toast.error('Zahlung abgelaufen');
        }
      };
      
      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    }
  }, [payment]);
  
  const createPayment = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    setLoading(true);
    try {
      const res = await axios.post(
        `${API}/api/crypto/create-payment`,
        {
          amount_eur: amount,
          crypto_code: selectedCrypto,
          bid_package_id: 'starter' // Would be selected by user
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPayment(res.data.payment);
      toast.success('Zahlung erstellt!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Fehler beim Erstellen');
    } finally {
      setLoading(false);
    }
  };
  
  const copyAddress = () => {
    if (payment?.wallet_address) {
      navigator.clipboard.writeText(payment.wallet_address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success(t.copied);
    }
  };
  
  const confirmDemo = async () => {
    if (!payment) return;
    
    try {
      const res = await axios.post(
        `${API}/api/crypto/demo/confirm/${payment.id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(res.data.message);
      setPayment(null);
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Fehler');
    }
  };
  
  const selectedCryptoInfo = cryptos.find(c => c.code === selectedCrypto);
  const cryptoAmount = selectedCryptoInfo 
    ? (amount / selectedCryptoInfo.current_rate_usd).toFixed(8)
    : 0;
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black py-8 px-4" data-testid="crypto-payment-page">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/20 border border-orange-500/30 mb-4">
            <Bitcoin className="w-5 h-5 text-orange-400" />
            <span className="text-orange-400 font-bold">CRYPTO</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">{t.title}</h1>
          <p className="text-gray-400">{t.subtitle}</p>
        </div>
        
        {!payment ? (
          <>
            {/* Crypto Selection */}
            <div className="bg-gray-800/50 rounded-xl p-6 mb-6">
              <h3 className="text-white font-bold mb-4">{t.selectCrypto}</h3>
              <div className="grid grid-cols-5 gap-2">
                {cryptos.map(crypto => (
                  <button
                    key={crypto.code}
                    onClick={() => setSelectedCrypto(crypto.code)}
                    className={`p-4 rounded-xl border transition-all ${
                      selectedCrypto === crypto.code
                        ? 'bg-orange-500/20 border-orange-500'
                        : 'bg-gray-700/50 border-gray-600 hover:border-gray-500'
                    }`}
                  >
                    <span className="text-2xl block text-center">{cryptoIcons[crypto.code]}</span>
                    <span className="text-white text-sm font-bold block text-center mt-1">{crypto.code}</span>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Amount Input */}
            <div className="bg-gray-800/50 rounded-xl p-6 mb-6">
              <h3 className="text-white font-bold mb-4">{t.amount}</h3>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  min="5"
                  max="1000"
                  className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white text-xl font-bold"
                />
                <span className="text-gray-400 text-xl">EUR</span>
              </div>
              
              {selectedCryptoInfo && (
                <p className="text-gray-400 mt-3">
                  {t.equivalent}: <span className="text-orange-400 font-bold">{cryptoAmount} {selectedCrypto}</span>
                </p>
              )}
            </div>
            
            {/* Create Payment Button */}
            <Button 
              onClick={createPayment}
              disabled={loading || !isAuthenticated}
              className="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-lg font-bold"
            >
              {loading ? t.processing : t.createPayment}
              <ArrowRight className="ml-2" />
            </Button>
            
            {/* Benefits */}
            <div className="grid grid-cols-3 gap-4 mt-8">
              <div className="text-center p-4">
                <Zap className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                <p className="text-white text-sm">{t.benefits.fast}</p>
              </div>
              <div className="text-center p-4">
                <Shield className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                <p className="text-white text-sm">{t.benefits.secure}</p>
              </div>
              <div className="text-center p-4">
                <Wallet className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                <p className="text-white text-sm">{t.benefits.anonymous}</p>
              </div>
            </div>
          </>
        ) : (
          /* Payment Created - Show QR and Address */
          <div className="bg-gray-800/50 rounded-xl p-6">
            <div className="text-center mb-6">
              <Clock className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
              <p className="text-yellow-400 font-bold">
                {t.expiresIn}: {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')} {t.minutes}
              </p>
            </div>
            
            <div className="text-center mb-6">
              <p className="text-gray-400 mb-2">{t.sendExactly}</p>
              <p className="text-3xl font-bold text-orange-400">
                {payment.crypto_amount} {payment.crypto_code}
              </p>
              <p className="text-gray-500 text-sm">(€{payment.amount_eur})</p>
            </div>
            
            {/* QR Code */}
            <div className="flex justify-center mb-6">
              <div className="bg-white p-4 rounded-xl">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?data=${payment.wallet_address}&size=200x200`}
                  alt="QR Code"
                  className="w-48 h-48"
                />
              </div>
            </div>
            
            {/* Address */}
            <div className="mb-6">
              <p className="text-gray-400 text-sm mb-2 text-center">{t.toAddress}</p>
              <div className="flex items-center gap-2 bg-gray-700 rounded-lg p-3">
                <input 
                  type="text"
                  value={payment.wallet_address}
                  readOnly
                  className="flex-1 bg-transparent text-white text-sm font-mono"
                />
                <button 
                  onClick={copyAddress}
                  className="p-2 bg-gray-600 rounded-lg hover:bg-gray-500 transition-colors"
                >
                  {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5 text-white" />}
                </button>
              </div>
            </div>
            
            {/* Demo Button */}
            <Button 
              onClick={confirmDemo}
              variant="outline"
              className="w-full"
            >
              {t.demoButton}
            </Button>
            
            <p className="text-gray-500 text-xs text-center mt-4">
              Demo-Modus: Klicke oben um die Zahlung zu simulieren
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
