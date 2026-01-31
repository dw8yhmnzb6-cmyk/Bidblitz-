import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Gift, CreditCard, Mail, User, MessageSquare, Check, ArrowRight, Sparkles, Package } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Fixed packages
const PACKAGES = [
  { id: 'gc_10', amount: 10, bids: 20, popular: false },
  { id: 'gc_25', amount: 25, bids: 55, popular: true },
  { id: 'gc_50', amount: 50, bids: 120, popular: false },
  { id: 'gc_100', amount: 100, bids: 260, popular: false },
];

export default function GiftCards() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, token } = useAuth();
  const { t } = useLanguage();
  
  const [step, setStep] = useState(1); // 1: Select amount, 2: Recipient details, 3: Payment
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [customAmount, setCustomAmount] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Recipient details
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [senderName, setSenderName] = useState('');
  const [message, setMessage] = useState('');
  const [sendEmail, setSendEmail] = useState(true);
  
  // Redeem mode
  const [redeemMode, setRedeemMode] = useState(false);
  const [redeemCode, setRedeemCode] = useState('');
  const [redeemAs, setRedeemAs] = useState('bids');
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);

  useEffect(() => {
    // Check for redeem code in URL
    const code = searchParams.get('code');
    if (code) {
      setRedeemMode(true);
      setRedeemCode(code);
      validateCode(code);
    }
    
    // Check for canceled payment
    if (searchParams.get('canceled')) {
      toast.error('Zahlung abgebrochen');
    }
  }, [searchParams]);

  const getAmount = () => {
    if (useCustom && customAmount) {
      return parseFloat(customAmount);
    }
    return selectedPackage?.amount || 0;
  };

  const getBidsValue = () => {
    if (useCustom && customAmount) {
      return Math.floor(parseFloat(customAmount) * 2);
    }
    return selectedPackage?.bids || 0;
  };

  const validateCode = async (code) => {
    if (!code || code.length < 10) return;
    
    setValidating(true);
    try {
      const response = await axios.get(`${API}/giftcards/validate/${code}`);
      setValidationResult(response.data);
    } catch (error) {
      setValidationResult({ valid: false, message: 'Ungültiger Code' });
    } finally {
      setValidating(false);
    }
  };

  const handlePurchase = async () => {
    if (!isAuthenticated) {
      toast.error('Bitte melden Sie sich an');
      navigate('/login');
      return;
    }

    const amount = getAmount();
    if (amount < 5 || amount > 500) {
      toast.error('Betrag muss zwischen €5 und €500 liegen');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${API}/giftcards/purchase`,
        {
          amount,
          recipient_name: recipientName || null,
          recipient_email: recipientEmail || null,
          sender_name: senderName || null,
          message: message || null,
          send_now: sendEmail
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Fehler beim Kauf');
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async () => {
    if (!isAuthenticated) {
      toast.error('Bitte melden Sie sich an');
      navigate('/login');
      return;
    }

    if (!redeemCode) {
      toast.error('Bitte geben Sie einen Code ein');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${API}/giftcards/redeem`,
        { code: redeemCode, redeem_as: redeemAs },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(response.data.message);
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Fehler beim Einlösen');
    } finally {
      setLoading(false);
    }
  };

  // Redeem UI
  if (redeemMode) {
    return (
      <div className="min-h-screen bg-[#0F0F16] py-12 px-4" data-testid="giftcard-redeem-page">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#F59E0B] flex items-center justify-center mx-auto mb-4">
              <Gift className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Geschenkkarte einlösen</h1>
            <p className="text-[#94A3B8]">Geben Sie Ihren Code ein und wählen Sie, wie Sie ihn einlösen möchten</p>
          </div>

          <div className="glass-card p-8 rounded-2xl space-y-6">
            {/* Code Input */}
            <div>
              <Label className="text-white mb-2 block">Geschenkkarten-Code</Label>
              <Input
                value={redeemCode}
                onChange={(e) => {
                  setRedeemCode(e.target.value.toUpperCase());
                  if (e.target.value.length >= 10) {
                    validateCode(e.target.value);
                  }
                }}
                placeholder="XXXX-XXXX-XXXX-XXXX"
                className="bg-[#1E1E2D] border-[#2D2D3D] text-white text-center font-mono text-lg tracking-widest"
                data-testid="redeem-code-input"
              />
            </div>

            {/* Validation Result */}
            {validationResult && (
              <div className={`p-4 rounded-lg ${validationResult.valid ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
                <p className={`text-center ${validationResult.valid ? 'text-green-400' : 'text-red-400'}`}>
                  {validationResult.message}
                </p>
                {validationResult.valid && (
                  <div className="flex justify-center gap-8 mt-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-white">€{validationResult.amount}</p>
                      <p className="text-xs text-[#94A3B8]">Wert</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-[#F59E0B]">{validationResult.bids_value}</p>
                      <p className="text-xs text-[#94A3B8]">Gebote</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Redeem As Selection */}
            {validationResult?.valid && (
              <div className="space-y-3">
                <Label className="text-white mb-2 block">Einlösen als:</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setRedeemAs('bids')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      redeemAs === 'bids'
                        ? 'border-[#7C3AED] bg-[#7C3AED]/10'
                        : 'border-[#2D2D3D] bg-[#1E1E2D] hover:border-[#3D3D4D]'
                    }`}
                  >
                    <Sparkles className={`w-6 h-6 mx-auto mb-2 ${redeemAs === 'bids' ? 'text-[#7C3AED]' : 'text-[#94A3B8]'}`} />
                    <p className={`font-bold ${redeemAs === 'bids' ? 'text-white' : 'text-[#94A3B8]'}`}>
                      {validationResult.bids_value} Gebote
                    </p>
                    <p className="text-xs text-[#666]">Sofort verfügbar</p>
                  </button>
                  
                  <button
                    onClick={() => setRedeemAs('balance')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      redeemAs === 'balance'
                        ? 'border-[#10B981] bg-[#10B981]/10'
                        : 'border-[#2D2D3D] bg-[#1E1E2D] hover:border-[#3D3D4D]'
                    }`}
                  >
                    <CreditCard className={`w-6 h-6 mx-auto mb-2 ${redeemAs === 'balance' ? 'text-[#10B981]' : 'text-[#94A3B8]'}`} />
                    <p className={`font-bold ${redeemAs === 'balance' ? 'text-white' : 'text-[#94A3B8]'}`}>
                      €{validationResult.amount} Guthaben
                    </p>
                    <p className="text-xs text-[#666]">Für Gebotspakete</p>
                  </button>
                </div>
              </div>
            )}

            {/* Redeem Button */}
            <Button
              onClick={handleRedeem}
              disabled={loading || !validationResult?.valid}
              className="w-full bg-gradient-to-r from-[#7C3AED] to-[#F59E0B] hover:opacity-90 text-white py-6 text-lg"
              data-testid="redeem-button"
            >
              {loading ? 'Wird eingelöst...' : 'Jetzt einlösen'}
            </Button>

            {/* Switch to purchase */}
            <p className="text-center text-[#94A3B8] text-sm">
              Noch keine Geschenkkarte?{' '}
              <button
                onClick={() => setRedeemMode(false)}
                className="text-[#7C3AED] hover:underline"
              >
                Jetzt kaufen
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Purchase UI
  return (
    <div className="min-h-screen bg-[#0F0F16] py-12 px-4" data-testid="giftcard-page">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#F59E0B] flex items-center justify-center mx-auto mb-4">
            <Gift className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Geschenkkarten</h1>
          <p className="text-[#94A3B8] text-lg">Verschenken Sie Freude mit BidBlitz Geschenkkarten</p>
          
          {/* Toggle to redeem */}
          <button
            onClick={() => setRedeemMode(true)}
            className="mt-4 text-[#7C3AED] hover:underline text-sm"
          >
            Haben Sie einen Code? Hier einlösen →
          </button>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                    step >= s
                      ? 'bg-gradient-to-r from-[#7C3AED] to-[#F59E0B] text-white'
                      : 'bg-[#1E1E2D] text-[#666]'
                  }`}
                >
                  {step > s ? <Check className="w-5 h-5" /> : s}
                </div>
                {s < 3 && (
                  <div className={`w-16 h-1 mx-2 rounded ${step > s ? 'bg-[#7C3AED]' : 'bg-[#2D2D3D]'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-8 rounded-2xl">
          {/* Step 1: Select Amount */}
          {step === 1 && (
            <div className="space-y-8" data-testid="step-1">
              <h2 className="text-2xl font-bold text-white text-center">Wählen Sie einen Betrag</h2>
              
              {/* Fixed Packages */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {PACKAGES.map((pkg) => (
                  <button
                    key={pkg.id}
                    onClick={() => {
                      setSelectedPackage(pkg);
                      setUseCustom(false);
                    }}
                    className={`relative p-6 rounded-xl border-2 transition-all ${
                      selectedPackage?.id === pkg.id && !useCustom
                        ? 'border-[#7C3AED] bg-[#7C3AED]/10 scale-105'
                        : 'border-[#2D2D3D] bg-[#1E1E2D] hover:border-[#3D3D4D] hover:scale-102'
                    }`}
                    data-testid={`package-${pkg.id}`}
                  >
                    {pkg.popular && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#F59E0B] text-white text-xs font-bold rounded-full">
                        BELIEBT
                      </span>
                    )}
                    <p className="text-3xl font-bold text-white mb-1">€{pkg.amount}</p>
                    <p className="text-[#F59E0B] font-medium">{pkg.bids} Gebote</p>
                  </button>
                ))}
              </div>

              {/* Custom Amount */}
              <div className="border-t border-[#2D2D3D] pt-6">
                <button
                  onClick={() => setUseCustom(true)}
                  className={`w-full p-4 rounded-xl border-2 transition-all ${
                    useCustom
                      ? 'border-[#7C3AED] bg-[#7C3AED]/10'
                      : 'border-[#2D2D3D] bg-[#1E1E2D] hover:border-[#3D3D4D]'
                  }`}
                >
                  <p className="text-white font-medium mb-2">Eigenen Betrag wählen (€5 - €500)</p>
                  {useCustom && (
                    <div className="flex items-center gap-4 mt-4">
                      <Input
                        type="number"
                        min="5"
                        max="500"
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        placeholder="Betrag eingeben"
                        className="bg-[#0F0F16] border-[#3D3D4D] text-white text-center text-xl"
                        data-testid="custom-amount-input"
                      />
                      <div className="text-center min-w-[100px]">
                        <p className="text-[#F59E0B] font-bold text-xl">{getBidsValue()}</p>
                        <p className="text-xs text-[#666]">Gebote</p>
                      </div>
                    </div>
                  )}
                </button>
              </div>

              <Button
                onClick={() => setStep(2)}
                disabled={!getAmount()}
                className="w-full bg-gradient-to-r from-[#7C3AED] to-[#F59E0B] hover:opacity-90 text-white py-6 text-lg"
              >
                Weiter <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          )}

          {/* Step 2: Recipient Details */}
          {step === 2 && (
            <div className="space-y-6" data-testid="step-2">
              <h2 className="text-2xl font-bold text-white text-center">Empfänger-Details</h2>
              <p className="text-[#94A3B8] text-center">Optional - Sie können die Karte auch für sich selbst kaufen</p>

              <div className="space-y-4">
                <div>
                  <Label className="text-white mb-2 block">
                    <User className="w-4 h-4 inline mr-2" />
                    Name des Empfängers
                  </Label>
                  <Input
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="Max Mustermann"
                    className="bg-[#1E1E2D] border-[#2D2D3D] text-white"
                  />
                </div>

                <div>
                  <Label className="text-white mb-2 block">
                    <Mail className="w-4 h-4 inline mr-2" />
                    E-Mail des Empfängers
                  </Label>
                  <Input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="empfaenger@email.de"
                    className="bg-[#1E1E2D] border-[#2D2D3D] text-white"
                  />
                </div>

                <div>
                  <Label className="text-white mb-2 block">
                    <User className="w-4 h-4 inline mr-2" />
                    Ihr Name (Absender)
                  </Label>
                  <Input
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="Ihr Name"
                    className="bg-[#1E1E2D] border-[#2D2D3D] text-white"
                  />
                </div>

                <div>
                  <Label className="text-white mb-2 block">
                    <MessageSquare className="w-4 h-4 inline mr-2" />
                    Persönliche Nachricht (optional)
                  </Label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Alles Gute zum Geburtstag! Viel Spaß beim Bieten..."
                    rows={3}
                    className="w-full bg-[#1E1E2D] border border-[#2D2D3D] text-white rounded-lg p-3 resize-none"
                  />
                </div>

                {recipientEmail && (
                  <label className="flex items-center gap-3 p-4 bg-[#1E1E2D] rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sendEmail}
                      onChange={(e) => setSendEmail(e.target.checked)}
                      className="w-5 h-5 rounded"
                    />
                    <span className="text-white">Geschenkkarte sofort per E-Mail senden</span>
                  </label>
                )}
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={() => setStep(1)}
                  variant="outline"
                  className="flex-1 border-[#3D3D4D] text-white hover:bg-[#2D2D3D]"
                >
                  Zurück
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  className="flex-1 bg-gradient-to-r from-[#7C3AED] to-[#F59E0B] hover:opacity-90 text-white"
                >
                  Weiter <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Confirmation & Payment */}
          {step === 3 && (
            <div className="space-y-6" data-testid="step-3">
              <h2 className="text-2xl font-bold text-white text-center">Zusammenfassung</h2>

              {/* Summary Card */}
              <div className="bg-gradient-to-r from-[#7C3AED]/20 to-[#F59E0B]/20 p-6 rounded-xl border border-[#7C3AED]/30">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Gift className="w-8 h-8 text-[#F59E0B]" />
                    <div>
                      <p className="text-white font-bold text-xl">BidBlitz Geschenkkarte</p>
                      <p className="text-[#94A3B8] text-sm">Digitale Geschenkkarte</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-white">€{getAmount()}</p>
                    <p className="text-[#F59E0B]">{getBidsValue()} Gebote</p>
                  </div>
                </div>

                {(recipientName || recipientEmail) && (
                  <div className="border-t border-[#3D3D4D] pt-4 mt-4 space-y-2">
                    {recipientName && (
                      <p className="text-[#94A3B8]">
                        <span className="text-white">Empfänger:</span> {recipientName}
                      </p>
                    )}
                    {recipientEmail && (
                      <p className="text-[#94A3B8]">
                        <span className="text-white">E-Mail:</span> {recipientEmail}
                      </p>
                    )}
                    {message && (
                      <p className="text-[#94A3B8] italic">"{message}"</p>
                    )}
                  </div>
                )}
              </div>

              {/* Info Box */}
              <div className="bg-[#1E1E2D] p-4 rounded-lg">
                <p className="text-[#94A3B8] text-sm">
                  <Package className="w-4 h-4 inline mr-2 text-[#7C3AED]" />
                  Die Geschenkkarte kann als Gebote oder Guthaben eingelöst werden. 
                  Das Guthaben ist nicht auszahlbar.
                </p>
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={() => setStep(2)}
                  variant="outline"
                  className="flex-1 border-[#3D3D4D] text-white hover:bg-[#2D2D3D]"
                >
                  Zurück
                </Button>
                <Button
                  onClick={handlePurchase}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-[#7C3AED] to-[#F59E0B] hover:opacity-90 text-white py-6"
                  data-testid="purchase-button"
                >
                  <CreditCard className="w-5 h-5 mr-2" />
                  {loading ? 'Wird verarbeitet...' : `€${getAmount()} bezahlen`}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
