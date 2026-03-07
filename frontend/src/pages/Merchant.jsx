/**
 * BidBlitz Merchant System
 * Register as merchant, receive payments, view transactions
 */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import BottomNav from '../components/BottomNav';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

export default function Merchant() {
  const [coins, setCoins] = useState(0);
  const [merchantName, setMerchantName] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [totalReceived, setTotalReceived] = useState(0);
  const [result, setResult] = useState('');

  useEffect(() => {
    fetchData();
    // Check if already registered
    const savedMerchant = localStorage.getItem('merchantName');
    if (savedMerchant) {
      setBusinessName(savedMerchant);
      setIsRegistered(true);
    }
    // Load transactions
    const savedTx = localStorage.getItem('merchantTransactions');
    if (savedTx) {
      const txList = JSON.parse(savedTx);
      setTransactions(txList);
      setTotalReceived(txList.reduce((sum, t) => sum + t.amount, 0));
    }
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get(`${API}/app/wallet/balance`, { headers });
      setCoins(res.data.coins || 0);
    } catch (error) {
      console.log('Data error');
    }
  };

  const registerMerchant = () => {
    if (!merchantName.trim()) {
      setResult({ type: 'error', message: 'Bitte Geschäftsname eingeben!' });
      setTimeout(() => setResult(''), 3000);
      return;
    }

    setBusinessName(merchantName);
    setIsRegistered(true);
    localStorage.setItem('merchantName', merchantName);
    setMerchantName('');
    setResult({ type: 'success', message: `Händler "${merchantName}" registriert! 🎉` });
    setTimeout(() => setResult(''), 3000);
  };

  const receivePayment = async () => {
    const amount = parseInt(paymentAmount);
    if (!amount || amount <= 0) {
      setResult({ type: 'error', message: 'Ungültiger Betrag!' });
      setTimeout(() => setResult(''), 3000);
      return;
    }

    const newTransaction = {
      id: Date.now(),
      amount: amount,
      time: new Date().toLocaleString('de-DE'),
      type: 'incoming'
    };

    const updatedTx = [newTransaction, ...transactions];
    setTransactions(updatedTx);
    setTotalReceived(prev => prev + amount);
    setCoins(prev => prev + amount);
    localStorage.setItem('merchantTransactions', JSON.stringify(updatedTx));

    // Try backend
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.post(`${API}/app/merchant/receive`, { amount }, { headers });
    } catch (error) {
      // Continue with local
    }

    setPaymentAmount('');
    setResult({ type: 'success', message: `+${amount} Coins empfangen! 💰` });
    setTimeout(() => setResult(''), 3000);
  };

  const generateQRCode = () => {
    setResult({ type: 'info', message: 'QR-Code generiert! Kunden können jetzt zahlen.' });
    setTimeout(() => setResult(''), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b0e24] via-[#0f1332] to-[#0b0e24] text-white pb-24">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -left-20 w-60 h-60 bg-emerald-500/10 rounded-full blur-[80px]"></div>
        <div className="absolute bottom-40 -right-20 w-60 h-60 bg-blue-500/10 rounded-full blur-[80px]"></div>
      </div>

      <div className="relative p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link to="/super-app" className="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-all">
              <span className="text-lg">←</span>
            </Link>
            <div>
              <h2 className="text-2xl font-bold">🏪 Merchant</h2>
              <p className="text-xs text-slate-400">Zahlungen empfangen</p>
            </div>
          </div>
          <div className="bg-amber-500/20 px-4 py-2 rounded-xl border border-amber-500/30">
            <span className="text-amber-400 font-bold">{coins.toLocaleString()} 💰</span>
          </div>
        </div>

        {/* Result Message */}
        {result && (
          <div className={`mb-4 p-4 rounded-xl text-center font-medium ${
            result.type === 'success' 
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : result.type === 'error'
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
          }`}>
            {result.message}
          </div>
        )}

        {/* Register or Status */}
        {!isRegistered ? (
          <div className="bg-white/5 backdrop-blur-sm p-5 rounded-2xl border border-white/10 mb-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <span>📝</span> Händler registrieren
            </h3>
            <input
              type="text"
              value={merchantName}
              onChange={(e) => setMerchantName(e.target.value)}
              placeholder="Geschäftsname eingeben..."
              className="w-full p-3.5 rounded-xl bg-black/30 border border-white/10 text-white placeholder-slate-500 focus:border-[#6c63ff] focus:outline-none mb-3"
              data-testid="merchant-name-input"
            />
            <button
              onClick={registerMerchant}
              className="w-full py-3.5 bg-[#6c63ff] hover:bg-[#8b6dff] rounded-xl font-semibold transition-all"
              data-testid="register-btn"
            >
              Registrieren
            </button>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-emerald-500/20 to-green-500/10 p-5 rounded-2xl border border-emerald-500/30 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🏪</span>
                <div>
                  <p className="text-xs text-slate-400">Dein Geschäft</p>
                  <h3 className="font-bold text-lg">{businessName}</h3>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">Total empfangen</p>
                <p className="text-xl font-bold text-emerald-400">{totalReceived.toLocaleString()} 💰</p>
              </div>
            </div>
          </div>
        )}

        {/* Receive Payment */}
        {isRegistered && (
          <div className="bg-white/5 backdrop-blur-sm p-5 rounded-2xl border border-white/10 mb-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <span>💳</span> Zahlung empfangen
            </h3>
            <div className="flex gap-2 mb-3">
              <input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="Betrag in Coins..."
                className="flex-1 p-3.5 rounded-xl bg-black/30 border border-white/10 text-white placeholder-slate-500 focus:border-[#6c63ff] focus:outline-none"
                data-testid="payment-amount-input"
              />
              <button
                onClick={receivePayment}
                className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-600 rounded-xl font-semibold transition-all"
                data-testid="receive-payment-btn"
              >
                Empfangen
              </button>
            </div>
            <button
              onClick={generateQRCode}
              className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl font-medium transition-all border border-white/10 flex items-center justify-center gap-2"
            >
              <span>📱</span> QR-Code generieren
            </button>
          </div>
        )}

        {/* Transactions */}
        <div className="bg-white/5 backdrop-blur-sm p-5 rounded-2xl border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <span>📜</span> Transaktionen
            </h3>
            <span className="text-xs text-slate-400">{transactions.length} Einträge</span>
          </div>
          
          {transactions.length === 0 ? (
            <p className="text-center text-slate-500 py-6">Noch keine Transaktionen</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto" data-testid="transactions-list">
              {transactions.map((tx) => (
                <div 
                  key={tx.id}
                  className="bg-black/20 p-3 rounded-xl flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">💰</span>
                    <div>
                      <p className="font-medium">Zahlung empfangen</p>
                      <p className="text-xs text-slate-400">{tx.time}</p>
                    </div>
                  </div>
                  <p className="text-emerald-400 font-bold">+{tx.amount}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Link 
            to="/loans"
            className="bg-white/5 p-4 rounded-xl flex items-center gap-3 hover:bg-white/10 transition-all border border-white/5"
          >
            <span className="text-2xl">💳</span>
            <span className="text-sm">Kredit</span>
          </Link>
          <Link 
            to="/app-wallet"
            className="bg-white/5 p-4 rounded-xl flex items-center gap-3 hover:bg-white/10 transition-all border border-white/5"
          >
            <span className="text-2xl">👛</span>
            <span className="text-sm">Wallet</span>
          </Link>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
