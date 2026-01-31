import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { 
  Gift, Search, Send, History, Copy, Check, User, 
  ArrowRight, ArrowLeft, Sparkles, Heart, Clock
} from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function GiftBids() {
  const { user, token, updateBidsBalance } = useAuth();
  const [customerNumber, setCustomerNumber] = useState('');
  const [recipientNumber, setRecipientNumber] = useState('');
  const [recipientInfo, setRecipientInfo] = useState(null);
  const [giftAmount, setGiftAmount] = useState('');
  const [giftMessage, setGiftMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState({ sent: [], received: [], total_sent: 0, total_received: 0 });
  const [activeTab, setActiveTab] = useState('send');

  useEffect(() => {
    if (token) {
      fetchCustomerNumber();
      fetchHistory();
    }
  }, [token]);

  const fetchCustomerNumber = async () => {
    try {
      const response = await axios.get(`${API}/gifts/my-customer-number`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCustomerNumber(response.data.customer_number);
    } catch (error) {
      console.error('Error fetching customer number:', error);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await axios.get(`${API}/gifts/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistory(response.data);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const lookupRecipient = async () => {
    if (!recipientNumber || recipientNumber.length < 8) {
      toast.error('Bitte geben Sie eine gültige 8-stellige Kundennummer ein');
      return;
    }

    setLookupLoading(true);
    try {
      const response = await axios.get(`${API}/gifts/lookup/${recipientNumber}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecipientInfo(response.data);
      toast.success(`Empfänger gefunden: ${response.data.name}`);
    } catch (error) {
      setRecipientInfo(null);
      toast.error(error.response?.data?.detail || 'Kundennummer nicht gefunden');
    } finally {
      setLookupLoading(false);
    }
  };

  const sendGift = async () => {
    const amount = parseInt(giftAmount);
    if (!amount || amount < 1) {
      toast.error('Bitte geben Sie eine gültige Anzahl ein');
      return;
    }

    if (amount > (user?.bids_balance || 0)) {
      toast.error('Nicht genügend Gebote vorhanden');
      return;
    }

    if (!recipientInfo) {
      toast.error('Bitte suchen Sie zuerst einen Empfänger');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/gifts/send`, {
        recipient_customer_number: recipientNumber,
        amount: amount,
        message: giftMessage || null
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        toast.success(response.data.message);
        updateBidsBalance(response.data.new_balance);
        setRecipientNumber('');
        setRecipientInfo(null);
        setGiftAmount('');
        setGiftMessage('');
        fetchHistory();
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Fehler beim Senden des Geschenks');
    } finally {
      setLoading(false);
    }
  };

  const copyCustomerNumber = () => {
    navigator.clipboard.writeText(customerNumber);
    setCopied(true);
    toast.success('Kundennummer kopiert!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (!token) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-4">
        <div className="max-w-lg mx-auto text-center">
          <Gift className="w-16 h-16 text-pink-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-4">Gebote verschenken</h1>
          <p className="text-gray-400 mb-6">Melden Sie sich an, um Gebote zu verschenken</p>
          <Button onClick={() => window.location.href = '/login'} className="bg-pink-500 hover:bg-pink-600">
            Anmelden
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-4" data-testid="gift-bids-page">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center mx-auto mb-4">
            <Gift className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Gebote verschenken</h1>
          <p className="text-gray-400">
            Schenken Sie Ihren Freunden und Familie Gebote!
          </p>
        </div>

        {/* Customer Number Card */}
        <div className="glass-card rounded-xl p-6 mb-6 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-gray-400 text-sm mb-1">Ihre Kundennummer</p>
              <div className="flex items-center gap-3">
                <code className="text-3xl font-bold text-cyan-400 tracking-wider">{customerNumber || '--------'}</code>
                <button 
                  onClick={copyCustomerNumber}
                  className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-colors"
                >
                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-gray-500 text-xs mt-2">
                Teilen Sie diese Nummer mit Freunden, damit diese Ihnen Gebote schenken können
              </p>
            </div>
            <div className="text-right">
              <p className="text-gray-400 text-sm">Ihr Guthaben</p>
              <p className="text-2xl font-bold text-white">{user?.bids_balance || 0} Gebote</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            onClick={() => setActiveTab('send')}
            className={`flex-1 ${activeTab === 'send' 
              ? 'bg-pink-500 text-white' 
              : 'bg-[#181824] text-gray-400 border border-white/10'}`}
          >
            <Send className="w-4 h-4 mr-2" />
            Gebote senden
          </Button>
          <Button
            onClick={() => setActiveTab('history')}
            className={`flex-1 ${activeTab === 'history' 
              ? 'bg-purple-500 text-white' 
              : 'bg-[#181824] text-gray-400 border border-white/10'}`}
          >
            <History className="w-4 h-4 mr-2" />
            Verlauf
          </Button>
        </div>

        {/* Send Tab */}
        {activeTab === 'send' && (
          <div className="glass-card rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Heart className="w-6 h-6 text-pink-400" />
              Gebote verschenken
            </h2>

            {/* Step 1: Find Recipient */}
            <div className="mb-6">
              <Label className="text-white mb-2 block">1. Empfänger suchen</Label>
              <div className="flex gap-2">
                <Input
                  value={recipientNumber}
                  onChange={(e) => {
                    setRecipientNumber(e.target.value.replace(/\D/g, '').slice(0, 8));
                    setRecipientInfo(null);
                  }}
                  placeholder="8-stellige Kundennummer eingeben"
                  className="bg-[#181824] border-white/10 text-white font-mono text-lg tracking-wider"
                  maxLength={8}
                />
                <Button
                  onClick={lookupRecipient}
                  disabled={lookupLoading || recipientNumber.length < 8}
                  className="bg-cyan-500 hover:bg-cyan-600"
                >
                  {lookupLoading ? '...' : <Search className="w-5 h-5" />}
                </Button>
              </div>
              
              {recipientInfo && (
                <div className="mt-3 p-3 rounded-lg bg-green-500/10 border border-green-500/30 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <User className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-green-400 font-semibold">{recipientInfo.name}</p>
                    <p className="text-gray-400 text-sm">Kundennummer: {recipientInfo.customer_number}</p>
                  </div>
                  <Check className="w-6 h-6 text-green-400 ml-auto" />
                </div>
              )}
            </div>

            {/* Step 2: Amount */}
            <div className="mb-6">
              <Label className="text-white mb-2 block">2. Anzahl der Gebote</Label>
              <div className="flex gap-2 flex-wrap mb-3">
                {[5, 10, 25, 50, 100].map((amount) => (
                  <Button
                    key={amount}
                    onClick={() => setGiftAmount(amount.toString())}
                    className={`${giftAmount === amount.toString() 
                      ? 'bg-pink-500 text-white' 
                      : 'bg-[#181824] text-gray-400 border border-white/10'}`}
                  >
                    {amount}
                  </Button>
                ))}
              </div>
              <Input
                type="number"
                value={giftAmount}
                onChange={(e) => setGiftAmount(e.target.value)}
                placeholder="Oder eigene Anzahl eingeben"
                min="1"
                max={user?.bids_balance || 0}
                className="bg-[#181824] border-white/10 text-white"
              />
              <p className="text-gray-500 text-xs mt-1">
                Verfügbar: {user?.bids_balance || 0} Gebote
              </p>
            </div>

            {/* Step 3: Message (optional) */}
            <div className="mb-6">
              <Label className="text-white mb-2 block">3. Nachricht (optional)</Label>
              <Input
                value={giftMessage}
                onChange={(e) => setGiftMessage(e.target.value)}
                placeholder="z.B. Alles Gute zum Geburtstag! 🎉"
                className="bg-[#181824] border-white/10 text-white"
                maxLength={200}
              />
            </div>

            {/* Send Button */}
            <Button
              onClick={sendGift}
              disabled={loading || !recipientInfo || !giftAmount || parseInt(giftAmount) < 1}
              className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-400 hover:to-purple-400 text-white font-bold text-lg"
            >
              {loading ? (
                'Wird gesendet...'
              ) : (
                <>
                  <Gift className="w-5 h-5 mr-2" />
                  {giftAmount && recipientInfo 
                    ? `${giftAmount} Gebote an ${recipientInfo.name} senden`
                    : 'Geschenk senden'
                  }
                </>
              )}
            </Button>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="glass-card rounded-xl p-5">
                <div className="flex items-center gap-3 mb-2">
                  <ArrowRight className="w-5 h-5 text-orange-400" />
                  <span className="text-gray-400 text-sm">Gesendet</span>
                </div>
                <p className="text-3xl font-bold text-orange-400">{history.total_sent}</p>
                <p className="text-gray-500 text-xs">Gebote verschenkt</p>
              </div>
              <div className="glass-card rounded-xl p-5">
                <div className="flex items-center gap-3 mb-2">
                  <ArrowLeft className="w-5 h-5 text-green-400" />
                  <span className="text-gray-400 text-sm">Erhalten</span>
                </div>
                <p className="text-3xl font-bold text-green-400">{history.total_received}</p>
                <p className="text-gray-500 text-xs">Gebote erhalten</p>
              </div>
            </div>

            {/* Sent Gifts */}
            <div className="glass-card rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <ArrowRight className="w-5 h-5 text-orange-400" />
                Gesendete Geschenke
              </h3>
              {history.sent.length > 0 ? (
                <div className="space-y-3">
                  {history.sent.map((gift, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-[#181824] border border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                          <Gift className="w-5 h-5 text-orange-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium">An: {gift.recipient_name}</p>
                          <p className="text-gray-500 text-xs flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(gift.created_at).toLocaleDateString('de-DE')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-orange-400 font-bold">-{gift.amount}</p>
                        {gift.message && (
                          <p className="text-gray-500 text-xs truncate max-w-[150px]">{gift.message}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">Noch keine Geschenke gesendet</p>
              )}
            </div>

            {/* Received Gifts */}
            <div className="glass-card rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <ArrowLeft className="w-5 h-5 text-green-400" />
                Erhaltene Geschenke
              </h3>
              {history.received.length > 0 ? (
                <div className="space-y-3">
                  {history.received.map((gift, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-[#181824] border border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                          <Sparkles className="w-5 h-5 text-green-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium">Von: {gift.sender_name}</p>
                          <p className="text-gray-500 text-xs flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(gift.created_at).toLocaleDateString('de-DE')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-green-400 font-bold">+{gift.amount}</p>
                        {gift.message && (
                          <p className="text-gray-500 text-xs truncate max-w-[150px]">{gift.message}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">Noch keine Geschenke erhalten</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
