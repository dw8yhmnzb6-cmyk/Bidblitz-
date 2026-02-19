/**
 * PartnerTransfer - Universelle Überweisungen für Partner
 * Partner können senden an:
 * - Andere Partner (P-XXXXX)
 * - Kunden (BID-XXXXXX) - Karten/Guthaben aufladen
 * - Admin-Guthaben nutzen für Kunden-Aufladungen
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Send, ArrowUpRight, ArrowDownLeft, History, Search, 
  RefreshCw, CheckCircle, AlertCircle, Loader2, Euro, Users,
  CreditCard, Building2, User, Wallet, Gift
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

// Translations
const translations = {
  de: {
    title: 'Geld senden',
    subtitle: 'An Kunden oder Partner senden',
    availableBalance: 'Verfügbares Guthaben',
    adminCredit: 'Admin-Freibetrag',
    adminCreditUsed: 'Freibetrag verwendet',
    sendMoney: 'Geld senden',
    recipient: 'Empfänger',
    recipientPlaceholder: 'BID-XXXXXX (Kunde) oder P-XXXXX (Partner)',
    recipientHint: 'Kundennummer oder Partnernummer eingeben',
    amount: 'Betrag',
    message: 'Nachricht (optional)',
    messagePlaceholder: 'z.B. Gutschrift für Einkauf',
    send: 'Senden',
    sending: 'Wird gesendet...',
    history: 'Verlauf',
    sent: 'Gesendet',
    received: 'Empfangen',
    noTransfers: 'Noch keine Überweisungen',
    transferSuccess: 'Erfolgreich gesendet!',
    insufficientFunds: 'Nicht genug Guthaben',
    recipientNotFound: 'Empfänger nicht gefunden',
    enterAmount: 'Bitte Betrag eingeben',
    enterRecipient: 'Bitte Empfänger eingeben',
    to: 'An',
    from: 'Von',
    useAdminCredit: 'Freibetrag nutzen',
    useAdminCreditHint: 'Für Kunden-Aufladungen vom Admin-Guthaben abziehen',
    customerTopUp: 'Kunden-Aufladung',
    partnerTransfer: 'Partner-Überweisung',
    customer: 'Kunde',
    partner: 'Partner',
    tabs: {
      send: 'Senden',
      history: 'Verlauf',
      topup: 'Kunden aufladen'
    },
    topupTitle: 'Kundenguthaben aufladen',
    topupSubtitle: 'Laden Sie das Guthaben eines Kunden auf',
    scanOrEnter: 'Kundennummer scannen oder eingeben',
    quickAmounts: 'Schnellbeträge',
    customAmount: 'Anderer Betrag',
    chargeToCredit: 'Von Freibetrag abziehen',
    chargeToBalance: 'Von meinem Guthaben',
    noAdminCredit: 'Kein Freibetrag verfügbar. Kontaktieren Sie den Admin.',
    topupSuccess: 'Guthaben aufgeladen!',
    recipientType: 'Empfängertyp'
  },
  en: {
    title: 'Send Money',
    subtitle: 'Send to customers or partners',
    availableBalance: 'Available Balance',
    adminCredit: 'Admin Credit',
    adminCreditUsed: 'Credit Used',
    sendMoney: 'Send Money',
    recipient: 'Recipient',
    recipientPlaceholder: 'BID-XXXXXX (Customer) or P-XXXXX (Partner)',
    recipientHint: 'Enter customer ID or partner number',
    amount: 'Amount',
    message: 'Message (optional)',
    messagePlaceholder: 'e.g. Credit for purchase',
    send: 'Send',
    sending: 'Sending...',
    history: 'History',
    sent: 'Sent',
    received: 'Received',
    noTransfers: 'No transfers yet',
    transferSuccess: 'Successfully sent!',
    insufficientFunds: 'Insufficient funds',
    recipientNotFound: 'Recipient not found',
    enterAmount: 'Please enter amount',
    enterRecipient: 'Please enter recipient',
    to: 'To',
    from: 'From',
    useAdminCredit: 'Use Admin Credit',
    useAdminCreditHint: 'Deduct from admin credit for customer top-ups',
    customerTopUp: 'Customer Top-Up',
    partnerTransfer: 'Partner Transfer',
    customer: 'Customer',
    partner: 'Partner',
    tabs: {
      send: 'Send',
      history: 'History',
      topup: 'Top-up Customer'
    },
    topupTitle: 'Top-up Customer Balance',
    topupSubtitle: 'Add credit to a customer account',
    scanOrEnter: 'Scan or enter customer ID',
    quickAmounts: 'Quick Amounts',
    customAmount: 'Custom Amount',
    chargeToCredit: 'Charge to Admin Credit',
    chargeToBalance: 'Charge to My Balance',
    noAdminCredit: 'No admin credit available. Contact admin.',
    topupSuccess: 'Balance topped up!',
    recipientType: 'Recipient Type'
  },
  sq: {
    title: 'Dërgo Para',
    subtitle: 'Dërgo tek klientët ose partnerët',
    availableBalance: 'Bilanci i Disponueshëm',
    adminCredit: 'Kredia e Adminit',
    adminCreditUsed: 'Kredia e Përdorur',
    sendMoney: 'Dërgo Para',
    recipient: 'Marrësi',
    recipientPlaceholder: 'BID-XXXXXX (Klient) ose P-XXXXX (Partner)',
    recipientHint: 'Vendos numrin e klientit ose partnerit',
    amount: 'Shuma',
    message: 'Mesazhi (opsional)',
    messagePlaceholder: 'p.sh. Kredi për blerje',
    send: 'Dërgo',
    sending: 'Duke dërguar...',
    history: 'Historiku',
    sent: 'Dërguar',
    received: 'Marrë',
    noTransfers: 'Nuk ka transferta ende',
    transferSuccess: 'U dërgua me sukses!',
    insufficientFunds: 'Fonde të pamjaftueshme',
    recipientNotFound: 'Marrësi nuk u gjet',
    enterAmount: 'Ju lutem vendosni shumën',
    enterRecipient: 'Ju lutem vendosni marrësin',
    to: 'Tek',
    from: 'Nga',
    useAdminCredit: 'Përdor Kredinë e Adminit',
    useAdminCreditHint: 'Zbrit nga kredia e adminit për rimbushje klientësh',
    customerTopUp: 'Rimbushje Klienti',
    partnerTransfer: 'Transfer Partneri',
    customer: 'Klient',
    partner: 'Partner',
    tabs: {
      send: 'Dërgo',
      history: 'Historiku',
      topup: 'Rimbush Klient'
    },
    topupTitle: 'Rimbush Bilancin e Klientit',
    topupSubtitle: 'Shto kredi në llogarinë e klientit',
    scanOrEnter: 'Skano ose vendos ID e klientit',
    quickAmounts: 'Shuma të Shpejta',
    customAmount: 'Shumë Tjetër',
    chargeToCredit: 'Ngarko tek Kredia e Adminit',
    chargeToBalance: 'Ngarko tek Bilanci Im',
    noAdminCredit: 'Nuk ka kredi admini. Kontaktoni adminin.',
    topupSuccess: 'Bilanci u rimbush!',
    recipientType: 'Lloji i Marrësit'
  }
};

export const PartnerTransfer = ({ token, partnerId, partnerName, language = 'de' }) => {
  const [activeTab, setActiveTab] = useState('send');
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState({ available_balance: 0, admin_credit: 0, admin_credit_used: 0 });
  const [transfers, setTransfers] = useState([]);
  
  // Form states
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [useAdminCredit, setUseAdminCredit] = useState(false);
  const [sending, setSending] = useState(false);
  const [recipientType, setRecipientType] = useState(null); // 'customer' or 'partner'
  
  const t = (key) => {
    const keys = key.split('.');
    let value = translations[language] || translations.de;
    for (const k of keys) {
      value = value?.[k];
    }
    return value || translations.de[key] || key;
  };

  // Fetch balance from new universal transfer API
  const fetchBalance = useCallback(async () => {
    try {
      const response = await fetch(`${API}/api/universal-transfer/partner/balance?token=${token}`);
      if (response.ok) {
        const data = await response.json();
        setBalance(data);
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Fetch transfer history
  const fetchHistory = useCallback(async () => {
    try {
      const response = await fetch(`${API}/api/universal-transfer/partner/history?token=${token}`);
      if (response.ok) {
        const data = await response.json();
        setTransfers(data.transfers || []);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  }, [token]);

  useEffect(() => {
    fetchBalance();
    fetchHistory();
  }, [fetchBalance, fetchHistory]);

  // Auto-detect recipient type
  useEffect(() => {
    const r = recipient.trim().toUpperCase();
    if (r.startsWith('BID-')) {
      setRecipientType('customer');
    } else if (r.startsWith('P-')) {
      setRecipientType('partner');
    } else {
      setRecipientType(null);
    }
  }, [recipient]);

  // Send money using universal transfer API
  const handleSend = async (e) => {
    e.preventDefault();
    
    if (!recipient) {
      toast.error(t('enterRecipient'));
      return;
    }
    
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error(t('enterAmount'));
      return;
    }
    
    // Check balance
    const availableBalance = useAdminCredit ? balance.admin_credit : balance.available_balance;
    if (amountNum > availableBalance) {
      toast.error(t('insufficientFunds'));
      return;
    }
    
    setSending(true);
    try {
      const response = await fetch(`${API}/api/universal-transfer/partner/send?token=${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient_id: recipient.trim(),
          amount: amountNum,
          message: message || null,
          use_admin_credit: useAdminCredit && recipientType === 'customer'
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success(`${t('transferSuccess')} €${amountNum.toFixed(2)} → ${data.recipient_name}`);
        setRecipient('');
        setAmount('');
        setMessage('');
        setUseAdminCredit(false);
        fetchBalance();
        fetchHistory();
      } else {
        toast.error(data.detail || t('recipientNotFound'));
      }
    } catch (error) {
      console.error('Transfer error:', error);
      toast.error('Transfer fehlgeschlagen');
    } finally {
      setSending(false);
    }
  };

  // Quick amount buttons for customer top-up
  const quickAmounts = [5, 10, 20, 50, 100];

  const formatDate = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="partner-transfer">
      {/* Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Available Balance */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-5 border border-green-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-green-600">{t('availableBalance')}</p>
              <p className="text-2xl font-bold text-green-800">€{(balance.available_balance || 0).toFixed(2)}</p>
            </div>
          </div>
        </div>
        
        {/* Admin Credit */}
        <div className="bg-gradient-to-br from-orange-50 to-amber-100 rounded-xl p-5 border border-orange-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-orange-600">{t('adminCredit')}</p>
              <p className="text-2xl font-bold text-orange-800">€{(balance.admin_credit || 0).toFixed(2)}</p>
            </div>
          </div>
        </div>
        
        {/* Credit Used */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-5 border border-blue-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
              <Gift className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-blue-600">{t('adminCreditUsed')}</p>
              <p className="text-2xl font-bold text-blue-800">€{(balance.admin_credit_used || 0).toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
        <button
          onClick={() => setActiveTab('send')}
          className={`flex-1 py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${
            activeTab === 'send' ? 'bg-white shadow text-orange-600' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Send className="w-5 h-5" />
          {t('tabs.send')}
        </button>
        <button
          onClick={() => setActiveTab('topup')}
          className={`flex-1 py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${
            activeTab === 'topup' ? 'bg-white shadow text-orange-600' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <CreditCard className="w-5 h-5" />
          {t('tabs.topup')}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${
            activeTab === 'history' ? 'bg-white shadow text-orange-600' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <History className="w-5 h-5" />
          {t('tabs.history')}
        </button>
      </div>

      {/* Send Tab */}
      {activeTab === 'send' && (
        <div className="bg-white rounded-xl border p-6">
          <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
            <Send className="w-6 h-6 text-orange-500" />
            {t('title')}
          </h3>
          <p className="text-gray-500 mb-6">{t('subtitle')}</p>
          
          <form onSubmit={handleSend} className="space-y-4">
            {/* Recipient */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('recipient')}</label>
              <div className="relative">
                <Input
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value.toUpperCase())}
                  placeholder={t('recipientPlaceholder')}
                  className="pr-24"
                  data-testid="transfer-recipient"
                />
                {recipientType && (
                  <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium px-2 py-1 rounded-full ${
                    recipientType === 'customer' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                  }`}>
                    {recipientType === 'customer' ? (
                      <span className="flex items-center gap-1"><User className="w-3 h-3" /> {t('customer')}</span>
                    ) : (
                      <span className="flex items-center gap-1"><Building2 className="w-3 h-3" /> {t('partner')}</span>
                    )}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">{t('recipientHint')}</p>
            </div>
            
            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('amount')}</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">€</span>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-8"
                  placeholder="0.00"
                  data-testid="transfer-amount"
                />
              </div>
            </div>
            
            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('message')}</label>
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t('messagePlaceholder')}
                data-testid="transfer-message"
              />
            </div>
            
            {/* Use Admin Credit Toggle - only for customers */}
            {recipientType === 'customer' && balance.admin_credit > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useAdminCredit}
                    onChange={(e) => setUseAdminCredit(e.target.checked)}
                    className="w-5 h-5 rounded border-orange-300 text-orange-500 focus:ring-orange-500"
                  />
                  <div>
                    <p className="font-medium text-orange-800">{t('useAdminCredit')}</p>
                    <p className="text-sm text-orange-600">{t('useAdminCreditHint')}</p>
                  </div>
                </label>
              </div>
            )}
            
            {/* Submit */}
            <Button
              type="submit"
              disabled={sending || !recipient || !amount}
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 h-12 text-lg"
              data-testid="transfer-submit"
            >
              {sending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {t('sending')}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Send className="w-5 h-5" />
                  {t('send')} {amount && `€${parseFloat(amount || 0).toFixed(2)}`}
                </span>
              )}
            </Button>
          </form>
        </div>
      )}

      {/* Customer Top-Up Tab */}
      {activeTab === 'topup' && (
        <div className="bg-white rounded-xl border p-6">
          <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-orange-500" />
            {t('topupTitle')}
          </h3>
          <p className="text-gray-500 mb-6">{t('topupSubtitle')}</p>
          
          <div className="space-y-4">
            {/* Customer ID Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('scanOrEnter')}</label>
              <Input
                value={recipient}
                onChange={(e) => setRecipient(e.target.value.toUpperCase())}
                placeholder="BID-XXXXXX"
                className="text-center text-lg font-mono"
                data-testid="topup-customer-id"
              />
            </div>
            
            {/* Quick Amount Buttons */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('quickAmounts')}</label>
              <div className="grid grid-cols-5 gap-2">
                {quickAmounts.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setAmount(amt.toString())}
                    className={`py-3 rounded-xl font-bold transition-all ${
                      parseFloat(amount) === amt
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    €{amt}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Custom Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('customAmount')}</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">€</span>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-8 text-center text-xl font-bold"
                  placeholder="0.00"
                />
              </div>
            </div>
            
            {/* Payment Source Selection */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setUseAdminCredit(false)}
                className={`p-4 rounded-xl border-2 transition-all ${
                  !useAdminCredit
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Wallet className={`w-6 h-6 mx-auto mb-2 ${!useAdminCredit ? 'text-green-600' : 'text-gray-400'}`} />
                <p className={`font-medium text-sm ${!useAdminCredit ? 'text-green-700' : 'text-gray-600'}`}>
                  {t('chargeToBalance')}
                </p>
                <p className={`text-lg font-bold ${!useAdminCredit ? 'text-green-600' : 'text-gray-500'}`}>
                  €{(balance.available_balance || 0).toFixed(2)}
                </p>
              </button>
              
              <button
                type="button"
                onClick={() => setUseAdminCredit(true)}
                disabled={!balance.admin_credit}
                className={`p-4 rounded-xl border-2 transition-all ${
                  useAdminCredit
                    ? 'border-orange-500 bg-orange-50'
                    : balance.admin_credit > 0
                      ? 'border-gray-200 hover:border-gray-300'
                      : 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                }`}
              >
                <CreditCard className={`w-6 h-6 mx-auto mb-2 ${useAdminCredit ? 'text-orange-600' : 'text-gray-400'}`} />
                <p className={`font-medium text-sm ${useAdminCredit ? 'text-orange-700' : 'text-gray-600'}`}>
                  {t('chargeToCredit')}
                </p>
                <p className={`text-lg font-bold ${useAdminCredit ? 'text-orange-600' : 'text-gray-500'}`}>
                  €{(balance.admin_credit || 0).toFixed(2)}
                </p>
              </button>
            </div>
            
            {/* Submit */}
            <Button
              onClick={handleSend}
              disabled={sending || !recipient.startsWith('BID-') || !amount}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 h-14 text-lg"
            >
              {sending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {t('sending')}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  {t('topupSuccess')} {amount && `€${parseFloat(amount || 0).toFixed(2)}`}
                </span>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-xl border">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-bold flex items-center gap-2">
              <History className="w-5 h-5 text-orange-500" />
              {t('history')}
            </h3>
            <Button onClick={fetchHistory} variant="ghost" size="sm">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
          
          {transfers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <History className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>{t('noTransfers')}</p>
            </div>
          ) : (
            <div className="divide-y max-h-96 overflow-y-auto">
              {transfers.map((transfer) => (
                <div key={transfer.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      transfer.direction === 'sent' ? 'bg-red-100' : 'bg-green-100'
                    }`}>
                      {transfer.direction === 'sent' ? (
                        <ArrowUpRight className="w-5 h-5 text-red-600" />
                      ) : (
                        <ArrowDownLeft className="w-5 h-5 text-green-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">
                        {transfer.direction === 'sent' ? t('to') : t('from')}: {transfer.direction === 'sent' ? transfer.recipient_name : transfer.sender_name}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span className={`px-1.5 py-0.5 rounded text-xs ${
                          transfer.recipient_type === 'customer' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                        }`}>
                          {transfer.recipient_type === 'customer' ? t('customer') : t('partner')}
                        </span>
                        <span>{formatDate(transfer.created_at)}</span>
                      </div>
                      {transfer.message && (
                        <p className="text-xs text-gray-400 mt-1">"{transfer.message}"</p>
                      )}
                    </div>
                  </div>
                  <p className={`text-lg font-bold ${
                    transfer.direction === 'sent' ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {transfer.direction === 'sent' ? '-' : '+'}€{transfer.amount?.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PartnerTransfer;
