import React, { useState, useEffect, useCallback } from 'react';
import { 
  Wallet, QrCode, CreditCard, History, ChevronRight, 
  Store, RefreshCw, Euro, CheckCircle, AlertCircle,
  Smartphone, ArrowUpRight, ArrowDownLeft, Gift
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

const BidBlitzPay = () => {
  const [wallet, setWallet] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showQR, setShowQR] = useState(false);
  const [view, setView] = useState('wallet'); // wallet, qr, history

  const token = localStorage.getItem('token') || sessionStorage.getItem('token') || localStorage.getItem('bidblitz_token');

  const fetchWallet = useCallback(async () => {
    if (!token) return;
    
    try {
      const response = await fetch(`${API}/api/bidblitz-pay/wallet`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setWallet(data);
      }
    } catch (error) {
      console.error('Error fetching wallet:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchTransactions = useCallback(async () => {
    if (!token) return;
    
    try {
      const response = await fetch(`${API}/api/bidblitz-pay/transactions?limit=20`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  }, [token]);

  const generateQR = async () => {
    if (!token) {
      toast.error('Bitte einloggen');
      return;
    }
    
    try {
      const response = await fetch(`${API}/api/bidblitz-pay/payment-qr`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setQrCode(data);
        setShowQR(true);
        setView('qr');
      } else {
        toast.error('Fehler beim Generieren des QR-Codes');
      }
    } catch (error) {
      console.error('Error generating QR:', error);
      toast.error('Fehler beim Generieren des QR-Codes');
    }
  };

  useEffect(() => {
    fetchWallet();
    fetchTransactions();
  }, [fetchWallet, fetchTransactions]);

  // Auto-refresh QR code every 4 minutes
  useEffect(() => {
    if (showQR) {
      const interval = setInterval(generateQR, 240000);
      return () => clearInterval(interval);
    }
  }, [showQR]);

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex items-center justify-center p-4">
        <div className="text-center">
          <Wallet className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">BidBlitz Pay</h1>
          <p className="text-gray-600 mb-4">Bitte einloggen, um fortzufahren</p>
          <Button onClick={() => window.location.href = '/login'} className="bg-amber-500 hover:bg-amber-600">
            Einloggen
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-4 sm:p-6">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Wallet className="w-6 h-6" />
              <h1 className="text-xl font-bold">BidBlitz Pay</h1>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={fetchWallet}
              className="text-white hover:bg-white/20"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Balance Card */}
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
            <p className="text-white/80 text-sm mb-1">Verfügbares Guthaben</p>
            <p className="text-3xl font-bold">
              €{(wallet?.wallet?.total_value || 0).toFixed(2)}
            </p>
            <div className="flex gap-4 mt-3 text-sm">
              <div>
                <p className="text-white/70">Partner-Gutscheine</p>
                <p className="font-semibold">€{(wallet?.wallet?.partner_vouchers_value || 0).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-white/70">Universal</p>
                <p className="font-semibold">€{(wallet?.wallet?.universal_balance || 0).toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-lg mx-auto px-4 -mt-4">
        <div className="bg-white rounded-xl shadow-lg p-1 flex gap-1">
          <button
            onClick={() => setView('wallet')}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
              view === 'wallet' ? 'bg-amber-500 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Gift className="w-4 h-4 inline mr-1" />
            Gutscheine
          </button>
          <button
            onClick={() => { setView('qr'); generateQR(); }}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
              view === 'qr' ? 'bg-amber-500 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <QrCode className="w-4 h-4 inline mr-1" />
            Bezahlen
          </button>
          <button
            onClick={() => { setView('history'); fetchTransactions(); }}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
              view === 'history' ? 'bg-amber-500 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <History className="w-4 h-4 inline mr-1" />
            Verlauf
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 mt-6">
        {/* Wallet View - Vouchers */}
        {view === 'wallet' && (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : (
              <>
                {/* Partner-specific Vouchers */}
                {wallet?.partner_vouchers?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                      <Store className="w-4 h-4" />
                      Partner-Gutscheine
                    </h3>
                    <div className="space-y-3">
                      {wallet.partner_vouchers.map((voucher) => (
                        <div 
                          key={voucher.id}
                          className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                                <Store className="w-6 h-6 text-amber-600" />
                              </div>
                              <div>
                                <p className="font-semibold text-gray-800">{voucher.name}</p>
                                <p className="text-sm text-gray-500">{voucher.partner_name || 'Partner'}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-lg text-green-600">
                                €{(voucher.remaining_value || voucher.value).toFixed(2)}
                              </p>
                              {voucher.remaining_value < voucher.value && (
                                <p className="text-xs text-gray-400">von €{voucher.value.toFixed(2)}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Universal Vouchers */}
                {wallet?.universal_vouchers?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      Universal-Guthaben
                    </h3>
                    <div className="space-y-3">
                      {wallet.universal_vouchers.map((voucher) => (
                        <div 
                          key={voucher.id}
                          className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-100"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                                <CreditCard className="w-6 h-6 text-purple-600" />
                              </div>
                              <div>
                                <p className="font-semibold text-gray-800">{voucher.name}</p>
                                <p className="text-sm text-purple-600">Bei allen Partnern einlösbar</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-lg text-purple-600">
                                €{(voucher.remaining_value || voucher.value).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {(!wallet?.vouchers || wallet.vouchers.length === 0) && (
                  <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <Gift className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Noch keine Gutscheine</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Gewinne Gutscheine bei Auktionen!
                    </p>
                    <Button 
                      onClick={() => window.location.href = '/'}
                      className="mt-4 bg-amber-500 hover:bg-amber-600"
                    >
                      Zu den Auktionen
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* QR Code View - For Payment */}
        {view === 'qr' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
              <div className="mb-4">
                <Smartphone className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                <h2 className="text-lg font-bold text-gray-800">Zeige diesen QR-Code</h2>
                <p className="text-sm text-gray-500">Der Partner scannt ihn zum Bezahlen</p>
              </div>

              {qrCode ? (
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-xl inline-block border-4 border-amber-200">
                    <img 
                      src={qrCode.qr_code} 
                      alt="Payment QR Code" 
                      className="w-48 h-48 mx-auto"
                    />
                  </div>
                  
                  <div className="bg-amber-50 rounded-xl p-4">
                    <p className="text-xs text-amber-600 mb-2">Verfügbar für Zahlung:</p>
                    <p className="text-2xl font-bold text-amber-700">
                      €{(qrCode.wallet_summary?.total_value || 0).toFixed(2)}
                    </p>
                  </div>

                  <p className="text-xs text-gray-400">
                    QR-Code gültig für 5 Minuten
                  </p>

                  <Button 
                    onClick={generateQR}
                    variant="outline"
                    className="w-full"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Neuen Code generieren
                  </Button>
                </div>
              ) : (
                <div className="py-8">
                  <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-gray-500 mt-2">Generiere QR-Code...</p>
                </div>
              )}
            </div>

            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">So funktioniert's:</p>
                  <ol className="list-decimal list-inside space-y-1 text-blue-700">
                    <li>Zeige dem Partner diesen QR-Code</li>
                    <li>Partner scannt und gibt Betrag ein</li>
                    <li>Bestätige die Zahlung</li>
                    <li>Fertig - Guthaben wird abgezogen</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Transaction History */}
        {view === 'history' && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
              <History className="w-4 h-4" />
              Transaktionsverlauf
            </h3>

            {transactions.length > 0 ? (
              <div className="space-y-3">
                {transactions.map((tx) => (
                  <div 
                    key={tx.id}
                    className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          tx.type === 'payment' ? 'bg-red-100' : 'bg-green-100'
                        }`}>
                          {tx.type === 'payment' ? (
                            <ArrowUpRight className="w-5 h-5 text-red-600" />
                          ) : (
                            <ArrowDownLeft className="w-5 h-5 text-green-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">
                            {tx.type === 'payment' ? tx.partner_name : 'Gutschrift'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(tx.created_at).toLocaleDateString('de-DE', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${
                          tx.type === 'payment' ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {tx.type === 'payment' ? '-' : '+'}€{tx.amount.toFixed(2)}
                        </p>
                        {tx.status === 'completed' && (
                          <CheckCircle className="w-4 h-4 text-green-500 inline" />
                        )}
                      </div>
                    </div>
                    
                    {tx.used_vouchers?.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-xs text-gray-500 mb-1">Verwendete Gutscheine:</p>
                        <div className="flex flex-wrap gap-1">
                          {tx.used_vouchers.map((v, i) => (
                            <span key={i} className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {v.voucher_name}: €{v.amount_used.toFixed(2)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Noch keine Transaktionen</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BidBlitzPay;
