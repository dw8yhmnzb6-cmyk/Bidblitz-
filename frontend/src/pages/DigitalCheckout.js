/**
 * Digital Payment Checkout Page
 * Allows customers to confirm payments initiated by external POS systems (e.g., Edeka)
 */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Store, CheckCircle, XCircle, Clock, AlertCircle, 
  CreditCard, ArrowLeft, Shield, Loader2 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const translations = {
  de: {
    title: 'Zahlung bestätigen',
    merchant: 'Händler',
    amount: 'Betrag',
    description: 'Beschreibung',
    reference: 'Referenz',
    yourBalance: 'Ihr Guthaben',
    confirmPayment: 'Zahlung bestätigen',
    cancel: 'Abbrechen',
    paymentSuccess: 'Zahlung erfolgreich!',
    paymentSuccessMsg: 'Die Zahlung wurde erfolgreich durchgeführt.',
    backToWallet: 'Zurück zum Wallet',
    paymentExpired: 'Zahlung abgelaufen',
    paymentExpiredMsg: 'Diese Zahlungsanforderung ist abgelaufen.',
    paymentNotFound: 'Zahlung nicht gefunden',
    paymentNotFoundMsg: 'Die angeforderte Zahlung wurde nicht gefunden.',
    insufficientBalance: 'Nicht genug Guthaben',
    insufficientBalanceMsg: 'Bitte laden Sie Ihr BidBlitz Pay Guthaben auf.',
    processing: 'Verarbeitung...',
    securePayment: 'Sichere Zahlung mit BidBlitz Pay',
    loginRequired: 'Bitte melden Sie sich an',
    loginRequiredMsg: 'Sie müssen angemeldet sein, um diese Zahlung zu bestätigen.',
    login: 'Anmelden',
    expiresIn: 'Läuft ab in',
    minutes: 'Minuten',
    alreadyPaid: 'Bereits bezahlt',
    alreadyPaidMsg: 'Diese Zahlung wurde bereits abgeschlossen.'
  },
  en: {
    title: 'Confirm Payment',
    merchant: 'Merchant',
    amount: 'Amount',
    description: 'Description',
    reference: 'Reference',
    yourBalance: 'Your Balance',
    confirmPayment: 'Confirm Payment',
    cancel: 'Cancel',
    paymentSuccess: 'Payment Successful!',
    paymentSuccessMsg: 'The payment has been completed successfully.',
    backToWallet: 'Back to Wallet',
    paymentExpired: 'Payment Expired',
    paymentExpiredMsg: 'This payment request has expired.',
    paymentNotFound: 'Payment Not Found',
    paymentNotFoundMsg: 'The requested payment was not found.',
    insufficientBalance: 'Insufficient Balance',
    insufficientBalanceMsg: 'Please top up your BidBlitz Pay balance.',
    processing: 'Processing...',
    securePayment: 'Secure payment with BidBlitz Pay',
    loginRequired: 'Login Required',
    loginRequiredMsg: 'You need to be logged in to confirm this payment.',
    login: 'Login',
    expiresIn: 'Expires in',
    minutes: 'minutes',
    alreadyPaid: 'Already Paid',
    alreadyPaidMsg: 'This payment has already been completed.'
  }
};

export default function DigitalCheckout() {
  const { paymentId } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [userBalance, setUserBalance] = useState(0);
  
  const language = localStorage.getItem('language') || 'de';
  const t = (key) => translations[language]?.[key] || translations.de[key] || key;
  
  // Fetch payment details
  useEffect(() => {
    const fetchPayment = async () => {
      try {
        const res = await fetch(`${API_URL}/api/digital/checkout/${paymentId}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError('notFound');
          } else {
            setError('unknown');
          }
          return;
        }
        const data = await res.json();
        setPayment(data);
        
        if (data.status === 'expired') {
          setError('expired');
        } else if (data.status === 'completed') {
          setError('alreadyPaid');
        }
      } catch (err) {
        setError('unknown');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPayment();
  }, [paymentId]);
  
  // Fetch user balance
  useEffect(() => {
    const fetchBalance = async () => {
      if (!token) return;
      try {
        const res = await fetch(`${API_URL}/api/bidblitz-pay/wallet`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setUserBalance(data.wallet?.universal_balance || 0);
        }
      } catch (err) {
        console.error('Failed to fetch balance:', err);
      }
    };
    
    fetchBalance();
  }, [token]);
  
  // Calculate time remaining
  const getTimeRemaining = () => {
    if (!payment?.expires_at) return null;
    const expires = new Date(payment.expires_at);
    const now = new Date();
    const diff = expires - now;
    if (diff <= 0) return 0;
    return Math.floor(diff / 60000); // minutes
  };
  
  const timeRemaining = getTimeRemaining();
  
  // Confirm payment
  const handleConfirm = async () => {
    if (!user) {
      navigate('/login', { state: { returnTo: `/checkout/${paymentId}` } });
      return;
    }
    
    setConfirming(true);
    try {
      const res = await fetch(`${API_URL}/api/digital/checkout/${paymentId}/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ user_id: user.id })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        if (data.detail?.includes('Nicht genug Guthaben')) {
          setError('insufficientBalance');
        } else if (data.detail?.includes('abgelaufen')) {
          setError('expired');
        } else {
          setError('unknown');
        }
        return;
      }
      
      setSuccess(true);
    } catch (err) {
      setError('unknown');
    } finally {
      setConfirming(false);
    }
  };
  
  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">{t('processing')}</p>
        </div>
      </div>
    );
  }
  
  // Error states
  if (error === 'notFound') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('paymentNotFound')}</h1>
          <p className="text-gray-600 mb-6">{t('paymentNotFoundMsg')}</p>
          <button
            onClick={() => navigate('/pay')}
            className="px-6 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600"
          >
            {t('backToWallet')}
          </button>
        </div>
      </div>
    );
  }
  
  if (error === 'expired') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <Clock className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('paymentExpired')}</h1>
          <p className="text-gray-600 mb-6">{t('paymentExpiredMsg')}</p>
          <button
            onClick={() => navigate('/pay')}
            className="px-6 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600"
          >
            {t('backToWallet')}
          </button>
        </div>
      </div>
    );
  }
  
  if (error === 'alreadyPaid') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('alreadyPaid')}</h1>
          <p className="text-gray-600 mb-6">{t('alreadyPaidMsg')}</p>
          <button
            onClick={() => navigate('/pay')}
            className="px-6 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600"
          >
            {t('backToWallet')}
          </button>
        </div>
      </div>
    );
  }
  
  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('paymentSuccess')}</h1>
          <p className="text-gray-600 mb-2">{t('paymentSuccessMsg')}</p>
          <p className="text-3xl font-bold text-green-600 mb-6">€{payment?.amount?.toFixed(2)}</p>
          <p className="text-sm text-gray-500 mb-6">
            {payment?.merchant_name} • {payment?.reference}
          </p>
          <button
            onClick={() => navigate('/pay')}
            className="px-6 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 w-full"
          >
            {t('backToWallet')}
          </button>
        </div>
      </div>
    );
  }
  
  // Login required
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('loginRequired')}</h1>
          <p className="text-gray-600 mb-6">{t('loginRequiredMsg')}</p>
          
          {/* Show payment preview */}
          {payment && (
            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
              <div className="flex items-center gap-3 mb-3">
                <Store className="w-8 h-8 text-orange-500" />
                <div>
                  <p className="font-semibold">{payment.merchant_name}</p>
                  <p className="text-sm text-gray-500">{payment.description}</p>
                </div>
              </div>
              <p className="text-3xl font-bold text-center text-gray-900">
                €{payment.amount?.toFixed(2)}
              </p>
            </div>
          )}
          
          <button
            onClick={() => navigate('/login', { state: { returnTo: `/checkout/${paymentId}` } })}
            className="px-6 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 w-full"
          >
            {t('login')}
          </button>
        </div>
      </div>
    );
  }
  
  // Insufficient balance
  if (error === 'insufficientBalance' || (payment && userBalance < payment.amount)) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <CreditCard className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('insufficientBalance')}</h1>
          <p className="text-gray-600 mb-4">{t('insufficientBalanceMsg')}</p>
          
          <div className="bg-red-50 rounded-xl p-4 mb-6">
            <p className="text-sm text-gray-600">{t('yourBalance')}</p>
            <p className="text-2xl font-bold text-red-600">€{userBalance.toFixed(2)}</p>
            <p className="text-sm text-gray-500 mt-2">
              {t('amount')}: €{payment?.amount?.toFixed(2)}
            </p>
          </div>
          
          <button
            onClick={() => navigate('/pay')}
            className="px-6 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 w-full"
          >
            {t('backToWallet')}
          </button>
        </div>
      </div>
    );
  }
  
  // Main checkout view
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white p-4">
      <div className="max-w-md mx-auto pt-8">
        {/* Header */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          {t('cancel')}
        </button>
        
        {/* Payment Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Merchant Header */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 text-white">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                <Store className="w-8 h-8" />
              </div>
              <div>
                <p className="text-orange-100 text-sm">{t('merchant')}</p>
                <h2 className="text-xl font-bold">{payment?.merchant_name}</h2>
              </div>
            </div>
          </div>
          
          {/* Amount */}
          <div className="p-6 border-b">
            <p className="text-sm text-gray-500 text-center">{t('amount')}</p>
            <p className="text-5xl font-bold text-center text-gray-900 my-2">
              €{payment?.amount?.toFixed(2)}
            </p>
            {payment?.description && (
              <p className="text-center text-gray-600">{payment.description}</p>
            )}
          </div>
          
          {/* Details */}
          <div className="p-6 space-y-4">
            {payment?.reference && (
              <div className="flex justify-between">
                <span className="text-gray-500">{t('reference')}</span>
                <span className="font-mono text-gray-900">{payment.reference}</span>
              </div>
            )}
            
            <div className="flex justify-between">
              <span className="text-gray-500">{t('yourBalance')}</span>
              <span className="font-semibold text-green-600">€{userBalance.toFixed(2)}</span>
            </div>
            
            {timeRemaining !== null && timeRemaining > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-gray-500">{t('expiresIn')}</span>
                <span className="flex items-center gap-1 text-yellow-600">
                  <Clock className="w-4 h-4" />
                  {timeRemaining} {t('minutes')}
                </span>
              </div>
            )}
          </div>
          
          {/* Security Badge */}
          <div className="px-6 pb-4">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <Shield className="w-4 h-4 text-green-500" />
              {t('securePayment')}
            </div>
          </div>
          
          {/* Confirm Button */}
          <div className="p-6 pt-0">
            <button
              onClick={handleConfirm}
              disabled={confirming || userBalance < payment?.amount}
              className={`w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 transition-all ${
                confirming || userBalance < payment?.amount
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-500 text-white hover:bg-green-600 shadow-lg hover:shadow-xl'
              }`}
              data-testid="confirm-payment-btn"
            >
              {confirming ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {t('processing')}
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  {t('confirmPayment')}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
