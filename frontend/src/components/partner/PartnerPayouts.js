/**
 * Partner Payouts Component - Wise Bank Transfer
 * Handles bank account setup and payout requests
 */
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Euro, CreditCard, CheckCircle, X, Loader2, History } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';

const API = process.env.REACT_APP_BACKEND_URL;

const PartnerPayouts = ({ token, partner, dashboardData, fetchDashboard, t }) => {
  const [loading, setLoading] = useState(false);
  const [wiseStatus, setWiseStatus] = useState(null);
  const [payoutHistory, setPayoutHistory] = useState([]);
  const [showWiseSetup, setShowWiseSetup] = useState(false);
  const [wiseSetupForm, setWiseSetupForm] = useState({ account_holder_name: '', iban: '' });
  const [payoutAmount, setPayoutAmount] = useState('');

  // Fetch Wise status
  const fetchWiseStatus = async () => {
    try {
      const response = await axios.get(`${API}/api/wise-payouts/account-status?token=${token}`);
      setWiseStatus(response.data);
    } catch (err) {
      console.error('Wise status error:', err);
    }
  };

  // Fetch payout history
  const fetchWisePayoutHistory = async () => {
    try {
      const response = await axios.get(`${API}/api/wise-payouts/payout-history?token=${token}`);
      setPayoutHistory(response.data.payouts || []);
    } catch (err) {
      console.error('Wise payout history error:', err);
    }
  };

  // Setup bank account
  const setupWiseAccount = async () => {
    if (!wiseSetupForm.account_holder_name || !wiseSetupForm.iban) {
      toast.error(t('error') || 'Bitte füllen Sie alle Felder aus');
      return;
    }
    
    try {
      setLoading(true);
      const response = await axios.post(`${API}/api/wise-payouts/setup-bank-account?token=${token}`, wiseSetupForm);
      
      toast.success(response.data.message || t('bankConnected'));
      setShowWiseSetup(false);
      fetchWiseStatus();
    } catch (err) {
      toast.error(err.response?.data?.detail || t('error'));
    } finally {
      setLoading(false);
    }
  };

  // Request payout
  const requestWisePayout = async (customAmount = null) => {
    const maxAmount = dashboardData?.stats?.pending_payout || 0;
    const amount = customAmount !== null ? parseFloat(customAmount) : maxAmount;
    
    if (isNaN(amount) || amount < 10) {
      toast.error(`${t('minPayout')}: €10`);
      return;
    }
    
    if (amount > maxAmount) {
      toast.error(`${t('maxAmount')}: €${maxAmount.toFixed(2)}`);
      return;
    }
    
    if (!window.confirm(`${t('payNow')} €${amount.toFixed(2)}?`)) return;
    
    try {
      setLoading(true);
      const response = await axios.post(`${API}/api/wise-payouts/request-payout?token=${token}`, {
        amount: amount,
        reference: `BidBlitz Auszahlung - ${partner?.business_name || 'Partner'}`
      });
      
      toast.success(response.data.message || t('success'));
      setPayoutAmount('');
      fetchDashboard();
      fetchWisePayoutHistory();
    } catch (err) {
      toast.error(err.response?.data?.detail || t('error'));
    } finally {
      setLoading(false);
    }
  };

  // Disconnect bank account
  const disconnectWise = async () => {
    if (!window.confirm(t('disconnectBank') + '?')) return;
    
    try {
      setLoading(true);
      await axios.delete(`${API}/api/wise-payouts/disconnect?token=${token}`);
      toast.success(t('success'));
      setWiseStatus(null);
    } catch (err) {
      toast.error(err.response?.data?.detail || t('error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchWiseStatus();
      fetchWisePayoutHistory();
    }
  }, [token]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-gray-800 text-xl flex items-center gap-2">
          <Euro className="w-6 h-6 text-green-500" />
          {t('payouts')}
        </h2>
        <div className="bg-green-100 text-green-700 px-4 py-2 rounded-lg font-bold">
          €{(dashboardData?.stats?.pending_payout || 0).toFixed(2)} {t('available')}
        </div>
      </div>
      
      {/* Bank Account Setup / Status */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-teal-500" />
          {t('bankTransfer')}
        </h3>
        
        {wiseStatus?.connected ? (
          <div className="space-y-4">
            {/* Connected Status */}
            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle className="w-6 h-6 text-green-500" />
              <div className="flex-1">
                <p className="font-medium text-green-700">{t('bankConnected')}</p>
                <p className="text-sm text-green-600">
                  {wiseStatus.account_holder} • ****{wiseStatus.iban_last4}
                </p>
              </div>
              <button 
                onClick={disconnectWise}
                className="text-gray-400 hover:text-red-500 transition-colors"
                title={t('disconnectBank')}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Payout Form */}
            {(dashboardData?.stats?.pending_payout || 0) >= 10 && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('payoutAmount') || 'Auszahlungsbetrag'}
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">€</span>
                      <Input
                        type="number"
                        min="10"
                        max={dashboardData?.stats?.pending_payout || 0}
                        step="0.01"
                        placeholder={`10 - ${(dashboardData?.stats?.pending_payout || 0).toFixed(2)}`}
                        value={payoutAmount}
                        onChange={(e) => setPayoutAmount(e.target.value)}
                        className="pl-7"
                      />
                    </div>
                    <Button 
                      variant="outline"
                      onClick={() => setPayoutAmount((dashboardData?.stats?.pending_payout || 0).toFixed(2))}
                      className="whitespace-nowrap"
                    >
                      {t('maxAmount') || 'Max'}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {t('minPayout')}: €10 • {t('available')}: €{(dashboardData?.stats?.pending_payout || 0).toFixed(2)}
                  </p>
                </div>
                
                <Button 
                  onClick={() => requestWisePayout(payoutAmount || dashboardData?.stats?.pending_payout)}
                  disabled={loading || (!payoutAmount && !(dashboardData?.stats?.pending_payout >= 10))}
                  className="w-full bg-gradient-to-r from-teal-500 to-green-500 hover:from-teal-600 hover:to-green-600"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <>
                      <Euro className="w-5 h-5 mr-2" />
                      {payoutAmount ? `€${parseFloat(payoutAmount).toFixed(2)} ${t('payNow')}` : `${t('payNow')} €${(dashboardData?.stats?.pending_payout || 0).toFixed(2)}`}
                    </>
                  )}
                </Button>
              </div>
            )}
            
            {(dashboardData?.stats?.pending_payout || 0) < 10 && (
              <p className="text-sm text-gray-500 text-center">
                {t('minPayout')}: €10
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {!showWiseSetup ? (
              <>
                <p className="text-gray-600">
                  {t('stripeDescription')}
                </p>
                <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                  <h4 className="font-medium text-teal-800 mb-2">{t('bankAdvantages')}</h4>
                  <ul className="text-sm text-teal-700 space-y-1">
                    <li>✓ {t('fastTransfer')}</li>
                    <li>✓ {t('noFees')}</li>
                    <li>✓ {t('secureIban')}</li>
                    <li>✓ {t('minAmount')}</li>
                  </ul>
                </div>
                <Button 
                  onClick={() => setShowWiseSetup(true)}
                  className="w-full bg-gradient-to-r from-teal-500 to-green-500 hover:from-teal-600 hover:to-green-600"
                >
                  <CreditCard className="w-5 h-5 mr-2" />
                  {t('connectBank')}
                </Button>
              </>
            ) : (
              <div className="space-y-4">
                <h4 className="font-medium text-gray-800">{t('enterBankDetails')}</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('accountHolder')}
                  </label>
                  <Input
                    placeholder="Max Mustermann"
                    value={wiseSetupForm.account_holder_name}
                    onChange={(e) => setWiseSetupForm({...wiseSetupForm, account_holder_name: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('iban')}
                  </label>
                  <Input
                    placeholder="DE89 3704 0044 0532 0130 00"
                    value={wiseSetupForm.iban}
                    onChange={(e) => setWiseSetupForm({...wiseSetupForm, iban: e.target.value.toUpperCase()})}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {t('ibanHint')}
                  </p>
                </div>
                
                <div className="flex gap-3">
                  <Button 
                    variant="outline"
                    onClick={() => setShowWiseSetup(false)}
                    className="flex-1"
                  >
                    {t('cancel')}
                  </Button>
                  <Button 
                    onClick={setupWiseAccount}
                    disabled={loading || !wiseSetupForm.account_holder_name || !wiseSetupForm.iban}
                    className="flex-1 bg-gradient-to-r from-teal-500 to-green-500 hover:from-teal-600 hover:to-green-600"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t('connect')}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Payout History */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-bold text-gray-800">{t('payoutHistory')}</h3>
          <History className="w-5 h-5 text-gray-400" />
        </div>
        {payoutHistory.length > 0 ? (
          <div className="divide-y">
            {payoutHistory.map((p, i) => (
              <div key={i} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-800">{p.id}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(p.requested_at).toLocaleDateString('de-DE')}
                    {p.wise_transfer_id && ` • Transfer #${p.wise_transfer_id}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">€{p.amount?.toFixed(2)}</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    p.status === 'completed' || p.status === 'outgoing_payment_sent' ? 'bg-green-100 text-green-700' :
                    p.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                    p.status === 'pending' || p.status === 'pending_funding' || p.status === 'pending_manual' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {p.status === 'completed' || p.status === 'outgoing_payment_sent' ? t('completed') : 
                     p.status === 'processing' ? t('processing') :
                     p.status === 'pending' || p.status === 'pending_funding' || p.status === 'pending_manual' ? t('pendingStatus') : p.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-gray-400">
            <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>{t('noPayouts')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PartnerPayouts;
