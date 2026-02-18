/**
 * CashbackSystem - Cashback bei Händlern verdienen und auszahlen
 * - Variabel: Händler setzen eigene % (3% Standard, 5% Premium, 10% Aktionen)
 * - Auszahlung: Wallet oder Gebote
 * - Kosten: 40% BidBlitz, 60% Händler
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Percent, Store, Euro, Gift, ChevronRight, ChevronLeft,
  Loader2, CheckCircle, Star, Sparkles, History, Wallet,
  ArrowRight, TrendingUp, Crown, Search
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

const translations = {
  de: {
    cashback: 'Cashback',
    yourCashback: 'Dein Cashback',
    totalEarned: 'Gesamt verdient',
    availableBalance: 'Verfügbar',
    payoutOptions: 'Auszahlungsoptionen',
    toWallet: 'Auf Wallet',
    toBids: 'In Gebote',
    bidsPerEuro: 'Gebote pro €1',
    merchants: 'Händler',
    allMerchants: 'Alle Händler',
    premiumMerchants: 'Premium-Händler',
    cashbackRate: 'Cashback-Rate',
    specialOffer: 'Sonderangebot',
    earnCashback: 'Cashback verdienen',
    history: 'Verlauf',
    noHistory: 'Noch keine Transaktionen',
    payout: 'Auszahlen',
    amount: 'Betrag',
    payoutSuccess: 'Auszahlung erfolgreich!',
    notEnoughBalance: 'Nicht genügend Guthaben',
    shopAndEarn: 'Einkaufen & Cashback verdienen',
    howItWorks: 'So funktioniert\'s',
    step1: 'Bei Partner-Händler einkaufen',
    step2: 'Cashback wird automatisch gutgeschrieben',
    step3: 'Auszahlen auf Wallet oder als Gebote',
    searchMerchants: 'Händler suchen...',
    back: 'Zurück',
    viewAll: 'Alle anzeigen',
    recentTransactions: 'Letzte Transaktionen',
    earnedFrom: 'Verdient bei',
    paidOut: 'Ausgezahlt',
    convertedToBids: 'In Gebote umgewandelt',
    standard: 'Standard',
    premium: 'Premium',
    promo: 'Aktion'
  },
  en: {
    cashback: 'Cashback',
    yourCashback: 'Your Cashback',
    totalEarned: 'Total Earned',
    availableBalance: 'Available',
    payoutOptions: 'Payout Options',
    toWallet: 'To Wallet',
    toBids: 'To Bids',
    bidsPerEuro: 'Bids per €1',
    merchants: 'Merchants',
    allMerchants: 'All Merchants',
    premiumMerchants: 'Premium Merchants',
    cashbackRate: 'Cashback Rate',
    specialOffer: 'Special Offer',
    earnCashback: 'Earn Cashback',
    history: 'History',
    noHistory: 'No transactions yet',
    payout: 'Payout',
    amount: 'Amount',
    payoutSuccess: 'Payout successful!',
    notEnoughBalance: 'Insufficient balance',
    shopAndEarn: 'Shop & Earn Cashback',
    howItWorks: 'How it works',
    step1: 'Shop at partner merchants',
    step2: 'Cashback is credited automatically',
    step3: 'Withdraw to wallet or convert to bids',
    searchMerchants: 'Search merchants...',
    back: 'Back',
    viewAll: 'View All',
    recentTransactions: 'Recent Transactions',
    earnedFrom: 'Earned from',
    paidOut: 'Paid out',
    convertedToBids: 'Converted to bids',
    standard: 'Standard',
    premium: 'Premium',
    promo: 'Promo'
  },
  tr: {
    cashback: 'Cashback', yourCashback: 'Cashback\'iniz', totalEarned: 'Toplam Kazanılan',
    availableBalance: 'Mevcut', toWallet: 'Cüzdana', toBids: 'Tekliflere',
    merchants: 'Satıcılar', history: 'Geçmiş', payout: 'Çekim', back: 'Geri'
  },
  ar: {
    cashback: 'استرداد نقدي', yourCashback: 'استردادك النقدي', totalEarned: 'إجمالي المكتسب',
    availableBalance: 'متاح', toWallet: 'إلى المحفظة', toBids: 'إلى المزايدات',
    merchants: 'التجار', history: 'السجل', payout: 'سحب', back: 'رجوع'
  },
  el: {
    cashback: 'Cashback', yourCashback: 'Το Cashback σας', totalEarned: 'Συνολικά κερδισμένα',
    availableBalance: 'Διαθέσιμο', toWallet: 'Στο Πορτοφόλι', toBids: 'Σε Προσφορές',
    merchants: 'Έμποροι', history: 'Ιστορικό', payout: 'Ανάληψη', back: 'Πίσω'
  }
};

const CashbackSystem = ({ language = 'de', onBalanceUpdate }) => {
  const [view, setView] = useState('main'); // main, merchants, history, payout
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(null);
  const [merchants, setMerchants] = useState([]);
  const [history, setHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutType, setPayoutType] = useState('wallet');
  const [processing, setProcessing] = useState(false);
  
  const token = localStorage.getItem('token') || sessionStorage.getItem('token') || localStorage.getItem('bidblitz_token');
  
  const t = (key) => translations[language]?.[key] || translations.de[key] || translations.en[key] || key;
  
  const fetchData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    
    try {
      const [balanceRes, merchantsRes, historyRes] = await Promise.all([
        fetch(`${API}/api/cashback/balance`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API}/api/cashback/merchants`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API}/api/cashback/history?limit=20`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);
      
      if (balanceRes.ok) {
        const data = await balanceRes.json();
        setBalance(data);
      }
      
      if (merchantsRes.ok) {
        const data = await merchantsRes.json();
        setMerchants(data.merchants || []);
      }
      
      if (historyRes.ok) {
        const data = await historyRes.json();
        setHistory(data.transactions || []);
      }
    } catch (error) {
      console.error('Error fetching cashback data:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  const handlePayout = async () => {
    const amount = parseFloat(payoutAmount);
    if (!amount || amount <= 0) {
      toast.error('Bitte geben Sie einen gültigen Betrag ein');
      return;
    }
    
    if (amount > (balance?.balance || 0)) {
      toast.error(t('notEnoughBalance'));
      return;
    }
    
    setProcessing(true);
    
    try {
      const res = await fetch(`${API}/api/cashback/payout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount,
          payout_type: payoutType
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        toast.success(data.message || t('payoutSuccess'));
        setPayoutAmount('');
        fetchData();
        if (onBalanceUpdate) onBalanceUpdate();
      } else {
        const error = await res.json();
        toast.error(error.detail || 'Fehler bei der Auszahlung');
      }
    } catch (error) {
      console.error('Error processing payout:', error);
      toast.error('Fehler bei der Auszahlung');
    } finally {
      setProcessing(false);
    }
  };
  
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };
  
  const filteredMerchants = merchants.filter(m => 
    m.business_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }
  
  // Merchants View
  if (view === 'merchants') {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setView('main')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ChevronLeft className="w-5 h-5" />
          {t('back')}
        </button>
        
        <h2 className="text-xl font-bold">{t('allMerchants')}</h2>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('searchMerchants')}
            className="pl-10"
          />
        </div>
        
        <div className="space-y-2">
          {filteredMerchants.map((merchant) => (
            <div
              key={merchant.id}
              className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  merchant.is_premium ? 'bg-gradient-to-br from-yellow-400 to-amber-500' : 'bg-gray-100'
                }`}>
                  {merchant.is_premium ? (
                    <Crown className="w-6 h-6 text-white" />
                  ) : (
                    <Store className="w-6 h-6 text-gray-500" />
                  )}
                </div>
                <div>
                  <p className="font-semibold flex items-center gap-2">
                    {merchant.business_name}
                    {merchant.is_premium && (
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                        {t('premium')}
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-gray-500 capitalize">{merchant.category}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-2xl font-bold ${
                  merchant.has_special_offer ? 'text-green-600' : 'text-orange-600'
                }`}>
                  {merchant.cashback_rate}%
                </p>
                {merchant.has_special_offer && (
                  <span className="text-xs text-green-600 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    {t('specialOffer')}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  // History View
  if (view === 'history') {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setView('main')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ChevronLeft className="w-5 h-5" />
          {t('back')}
        </button>
        
        <h2 className="text-xl font-bold">{t('history')}</h2>
        
        {history.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <History className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>{t('noHistory')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {history.map((tx) => (
              <div
                key={tx.id}
                className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    tx.type === 'earn' ? 'bg-green-100' : 'bg-blue-100'
                  }`}>
                    {tx.type === 'earn' ? (
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    ) : (
                      <ArrowRight className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">
                      {tx.type === 'earn' ? tx.merchant_name : (
                        tx.payout_type === 'wallet' ? t('paidOut') : t('convertedToBids')
                      )}
                    </p>
                    <p className="text-sm text-gray-500">{formatDate(tx.created_at)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${tx.type === 'earn' ? 'text-green-600' : 'text-blue-600'}`}>
                    {tx.type === 'earn' ? '+' : '-'}€{(tx.cashback_amount || tx.amount || 0).toFixed(2)}
                  </p>
                  {tx.type === 'earn' && (
                    <p className="text-xs text-gray-500">{tx.cashback_rate}% von €{tx.purchase_amount}</p>
                  )}
                  {tx.bids_received && (
                    <p className="text-xs text-blue-600">{tx.bids_received} Gebote</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
  
  // Payout View
  if (view === 'payout') {
    const bidsPreview = Math.floor((parseFloat(payoutAmount) || 0) * (balance?.bids_conversion_rate || 5));
    
    return (
      <div className="space-y-4">
        <button
          onClick={() => setView('main')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ChevronLeft className="w-5 h-5" />
          {t('back')}
        </button>
        
        <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl p-6 text-white">
          <p className="text-white/80 text-sm">{t('availableBalance')}</p>
          <p className="text-4xl font-bold">€{(balance?.balance || 0).toFixed(2)}</p>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
          <h3 className="font-semibold">{t('payoutOptions')}</h3>
          
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setPayoutType('wallet')}
              className={`p-4 rounded-xl border-2 transition-all ${
                payoutType === 'wallet' 
                  ? 'border-orange-500 bg-orange-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Wallet className={`w-8 h-8 mx-auto mb-2 ${payoutType === 'wallet' ? 'text-orange-500' : 'text-gray-400'}`} />
              <p className="font-medium">{t('toWallet')}</p>
              <p className="text-xs text-gray-500">BidBlitz Pay</p>
            </button>
            
            <button
              onClick={() => setPayoutType('bids')}
              className={`p-4 rounded-xl border-2 transition-all ${
                payoutType === 'bids' 
                  ? 'border-orange-500 bg-orange-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Gift className={`w-8 h-8 mx-auto mb-2 ${payoutType === 'bids' ? 'text-orange-500' : 'text-gray-400'}`} />
              <p className="font-medium">{t('toBids')}</p>
              <p className="text-xs text-gray-500">{balance?.bids_conversion_rate || 5} {t('bidsPerEuro')}</p>
            </button>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('amount')}</label>
            <Input
              type="number"
              value={payoutAmount}
              onChange={(e) => setPayoutAmount(e.target.value)}
              placeholder="0.00"
              min="0.01"
              max={balance?.balance || 0}
              step="0.01"
            />
            
            {/* Quick amount buttons */}
            <div className="flex gap-2 mt-2">
              {[5, 10, 25, balance?.balance].filter(Boolean).map((amt) => (
                <button
                  key={amt}
                  onClick={() => setPayoutAmount(Math.min(amt, balance?.balance || 0).toFixed(2))}
                  className="flex-1 py-2 px-3 rounded-lg border border-gray-200 hover:border-orange-300 text-sm"
                >
                  €{Math.min(amt, balance?.balance || 0).toFixed(0)}
                </button>
              ))}
            </div>
          </div>
          
          {payoutType === 'bids' && payoutAmount && (
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <p className="text-sm text-blue-600">
                €{payoutAmount} = <span className="font-bold text-lg">{bidsPreview}</span> Gebote
              </p>
            </div>
          )}
          
          <Button
            onClick={handlePayout}
            disabled={processing || !payoutAmount || parseFloat(payoutAmount) <= 0}
            className="w-full bg-gradient-to-r from-orange-500 to-amber-600"
          >
            {processing ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : (
              <CheckCircle className="w-5 h-5 mr-2" />
            )}
            {t('payout')} €{payoutAmount || '0'}
          </Button>
        </div>
      </div>
    );
  }
  
  // Main View
  return (
    <div className="space-y-4">
      {/* Balance Card */}
      <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Percent className="w-6 h-6" />
            <span className="font-medium">{t('yourCashback')}</span>
          </div>
          <button
            onClick={() => setView('history')}
            className="text-white/80 hover:text-white text-sm flex items-center gap-1"
          >
            <History className="w-4 h-4" />
            {t('history')}
          </button>
        </div>
        
        <div className="text-4xl font-bold mb-1">€{(balance?.balance || 0).toFixed(2)}</div>
        <p className="text-white/70 text-sm">{t('availableBalance')}</p>
        
        <div className="mt-4 pt-4 border-t border-white/20 flex justify-between text-sm">
          <div>
            <p className="text-white/70">{t('totalEarned')}</p>
            <p className="font-semibold">€{(balance?.total_earned || 0).toFixed(2)}</p>
          </div>
          <Button
            onClick={() => setView('payout')}
            variant="secondary"
            className="bg-white/20 hover:bg-white/30 text-white border-0"
            disabled={(balance?.balance || 0) <= 0}
          >
            {t('payout')}
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
      
      {/* How it Works */}
      <div className="bg-blue-50 rounded-xl p-4">
        <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          {t('howItWorks')}
        </h3>
        <div className="space-y-2 text-sm text-blue-800">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-200 flex items-center justify-center text-xs font-bold">1</span>
            {t('step1')}
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-200 flex items-center justify-center text-xs font-bold">2</span>
            {t('step2')}
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-200 flex items-center justify-center text-xs font-bold">3</span>
            {t('step3')}
          </div>
        </div>
      </div>
      
      {/* Premium Merchants */}
      {merchants.filter(m => m.is_premium).length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <Crown className="w-5 h-5 text-yellow-500" />
              {t('premiumMerchants')}
            </h3>
          </div>
          <div className="divide-y divide-gray-100">
            {merchants.filter(m => m.is_premium).slice(0, 3).map((merchant) => (
              <div key={merchant.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center">
                    <Crown className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium">{merchant.business_name}</p>
                    <p className="text-sm text-gray-500 capitalize">{merchant.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-green-600">{merchant.cashback_rate}%</p>
                  <p className="text-xs text-gray-500">{t('cashbackRate')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* All Merchants */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <Store className="w-5 h-5 text-orange-500" />
            {t('merchants')}
          </h3>
          <button
            onClick={() => setView('merchants')}
            className="text-orange-500 text-sm flex items-center gap-1"
          >
            {t('viewAll')}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="divide-y divide-gray-100">
          {merchants.slice(0, 5).map((merchant) => (
            <div key={merchant.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  merchant.is_premium ? 'bg-yellow-100' : 'bg-gray-100'
                }`}>
                  {merchant.is_premium ? (
                    <Star className="w-5 h-5 text-yellow-600" />
                  ) : (
                    <Store className="w-5 h-5 text-gray-500" />
                  )}
                </div>
                <div>
                  <p className="font-medium">{merchant.business_name}</p>
                  <p className="text-xs text-gray-500 capitalize">{merchant.category}</p>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                merchant.has_special_offer 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-orange-100 text-orange-700'
              }`}>
                {merchant.cashback_rate}%
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Recent Transactions */}
      {history.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <History className="w-5 h-5 text-orange-500" />
              {t('recentTransactions')}
            </h3>
            <button
              onClick={() => setView('history')}
              className="text-orange-500 text-sm flex items-center gap-1"
            >
              {t('viewAll')}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="divide-y divide-gray-100">
            {history.slice(0, 3).map((tx) => (
              <div key={tx.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {tx.type === 'earn' ? tx.merchant_name : t('payout')}
                  </p>
                  <p className="text-xs text-gray-500">{formatDate(tx.created_at)}</p>
                </div>
                <p className={`font-bold ${tx.type === 'earn' ? 'text-green-600' : 'text-blue-600'}`}>
                  {tx.type === 'earn' ? '+' : '-'}€{(tx.cashback_amount || tx.amount || 0).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CashbackSystem;
