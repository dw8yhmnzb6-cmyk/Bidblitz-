/**
 * BidBlitz Loan System
 * Request loans with adjustable interest rate, repay loans
 */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import BottomNav from '../components/BottomNav';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

export default function Loans() {
  const [balance, setBalance] = useState(1000);
  const [loanAmount, setLoanAmount] = useState('');
  const [interestRate, setInterestRate] = useState(10); // Adjustable interest rate
  const [activeLoan, setActiveLoan] = useState(null);
  const [loanHistory, setLoanHistory] = useState([]);
  const [result, setResult] = useState('');

  useEffect(() => {
    fetchData();
    // Load saved loan data
    const savedLoan = localStorage.getItem('activeLoan');
    if (savedLoan) {
      setActiveLoan(JSON.parse(savedLoan));
    }
    const savedHistory = localStorage.getItem('loanHistory');
    if (savedHistory) {
      setLoanHistory(JSON.parse(savedHistory));
    }
    const savedRate = localStorage.getItem('interestRate');
    if (savedRate) {
      setInterestRate(parseInt(savedRate));
    }
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get(`${API}/app/wallet/balance`, { headers });
      setBalance(res.data.coins || 1000);
    } catch (error) {
      console.log('Data error');
    }
  };

  const handleInterestChange = (newRate) => {
    setInterestRate(newRate);
    localStorage.setItem('interestRate', newRate.toString());
  };

  const requestLoan = async () => {
    const amount = parseInt(loanAmount);
    if (!amount || amount <= 0) {
      setResult({ type: 'error', message: 'Ungültiger Betrag!' });
      setTimeout(() => setResult(''), 3000);
      return;
    }

    if (amount > 10000) {
      setResult({ type: 'error', message: 'Maximaler Kredit: 10.000 Coins' });
      setTimeout(() => setResult(''), 3000);
      return;
    }

    if (activeLoan) {
      setResult({ type: 'error', message: 'Du hast bereits einen aktiven Kredit!' });
      setTimeout(() => setResult(''), 3000);
      return;
    }

    // Calculate repayment with interest
    const repayAmount = Math.ceil(amount * (1 + interestRate / 100));
    
    const newLoan = {
      id: Date.now(),
      amount: amount,
      repayAmount: repayAmount,
      interestRate: interestRate,
      date: new Date().toLocaleString('de-DE'),
      status: 'active'
    };

    setActiveLoan(newLoan);
    setBalance(prev => prev + amount);
    localStorage.setItem('activeLoan', JSON.stringify(newLoan));

    // Try backend
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.post(`${API}/app/loans/request`, {
        amount,
        interest_rate: interestRate
      }, { headers });
    } catch (error) {
      // Continue with local
    }

    setLoanAmount('');
    setResult({ type: 'success', message: `Kredit von ${amount} Coins genehmigt! 💰` });
    setTimeout(() => setResult(''), 3000);
  };

  const repayLoan = async () => {
    if (!activeLoan) {
      setResult({ type: 'error', message: 'Kein aktiver Kredit!' });
      setTimeout(() => setResult(''), 3000);
      return;
    }

    if (balance < activeLoan.repayAmount) {
      setResult({ type: 'error', message: `Du brauchst ${activeLoan.repayAmount} Coins zum Zurückzahlen!` });
      setTimeout(() => setResult(''), 3000);
      return;
    }

    setBalance(prev => prev - activeLoan.repayAmount);
    
    const completedLoan = { ...activeLoan, status: 'repaid', repaidDate: new Date().toLocaleString('de-DE') };
    const updatedHistory = [completedLoan, ...loanHistory];
    setLoanHistory(updatedHistory);
    localStorage.setItem('loanHistory', JSON.stringify(updatedHistory));
    
    setActiveLoan(null);
    localStorage.removeItem('activeLoan');

    // Try backend
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.post(`${API}/app/loans/repay`, { loan_id: completedLoan.id }, { headers });
    } catch (error) {
      // Continue with local
    }

    setResult({ type: 'success', message: 'Kredit zurückgezahlt! ✅' });
    setTimeout(() => setResult(''), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b0e24] via-[#0f1332] to-[#0b0e24] text-white pb-24">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -left-20 w-60 h-60 bg-blue-500/10 rounded-full blur-[80px]"></div>
        <div className="absolute bottom-40 -right-20 w-60 h-60 bg-purple-500/10 rounded-full blur-[80px]"></div>
      </div>

      <div className="relative p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link to="/super-app" className="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-all">
              <span className="text-lg">←</span>
            </Link>
            <div>
              <h2 className="text-2xl font-bold">💳 Kredit</h2>
              <p className="text-xs text-slate-400">Mikrokredite aufnehmen</p>
            </div>
          </div>
          <div className="bg-amber-500/20 px-4 py-2 rounded-xl border border-amber-500/30">
            <span className="text-amber-400 font-bold" data-testid="balance">{balance.toLocaleString()} 💰</span>
          </div>
        </div>

        {/* Result Message */}
        {result && (
          <div className={`mb-4 p-4 rounded-xl text-center font-medium ${
            result.type === 'success' 
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-red-500/20 text-red-400 border border-red-500/30'
          }`}>
            {result.message}
          </div>
        )}

        {/* Active Loan Status */}
        {activeLoan ? (
          <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/10 p-5 rounded-2xl border border-amber-500/30 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">📋</span>
                <div>
                  <p className="text-xs text-slate-400">Aktiver Kredit</p>
                  <h3 className="font-bold text-lg">Laufend</h3>
                </div>
              </div>
              <span className="px-3 py-1 bg-amber-500/30 text-amber-400 text-xs rounded-full font-bold">
                {activeLoan.interestRate}% Zinsen
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-black/20 p-3 rounded-xl">
                <p className="text-xs text-slate-400">Geliehen</p>
                <p className="text-xl font-bold">{activeLoan.amount} 💰</p>
              </div>
              <div className="bg-black/20 p-3 rounded-xl">
                <p className="text-xs text-slate-400">Zurückzahlen</p>
                <p className="text-xl font-bold text-amber-400">{activeLoan.repayAmount} 💰</p>
              </div>
            </div>
            
            <p className="text-xs text-slate-400 mb-4">Aufgenommen: {activeLoan.date}</p>
            
            <button
              onClick={repayLoan}
              disabled={balance < activeLoan.repayAmount}
              className={`w-full py-3.5 rounded-xl font-semibold transition-all ${
                balance < activeLoan.repayAmount
                  ? 'bg-slate-600 cursor-not-allowed opacity-50'
                  : 'bg-emerald-500 hover:bg-emerald-600'
              }`}
              data-testid="repay-btn"
            >
              {balance < activeLoan.repayAmount 
                ? `Nicht genug Coins (${activeLoan.repayAmount} benötigt)`
                : `Kredit zurückzahlen (${activeLoan.repayAmount} Coins)`
              }
            </button>
          </div>
        ) : (
          <div className="bg-white/5 backdrop-blur-sm p-5 rounded-2xl border border-white/10 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">✅</span>
              <h3 className="font-semibold">Kein aktiver Kredit</h3>
            </div>
            <p className="text-sm text-slate-400">Du kannst einen neuen Kredit aufnehmen.</p>
          </div>
        )}

        {/* Request Loan */}
        {!activeLoan && (
          <div className="bg-white/5 backdrop-blur-sm p-5 rounded-2xl border border-white/10 mb-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <span>💰</span> Kredit aufnehmen
            </h3>
            
            {/* Interest Rate Slider */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-slate-400">Zinssatz</label>
                <span className="text-lg font-bold text-amber-400">{interestRate}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="50"
                step="5"
                value={interestRate}
                onChange={(e) => handleInterestChange(parseInt(e.target.value))}
                className="w-full h-2 bg-black/30 rounded-lg appearance-none cursor-pointer accent-[#6c63ff]"
                data-testid="interest-slider"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>5%</span>
                <span>25%</span>
                <span>50%</span>
              </div>
            </div>

            <div className="mb-4">
              <label className="text-sm text-slate-400 mb-2 block">Kreditbetrag</label>
              <input
                type="number"
                value={loanAmount}
                onChange={(e) => setLoanAmount(e.target.value)}
                placeholder="z.B. 500"
                max="10000"
                className="w-full p-3.5 rounded-xl bg-black/30 border border-white/10 text-white placeholder-slate-500 focus:border-[#6c63ff] focus:outline-none"
                data-testid="loan-amount-input"
              />
              <p className="text-xs text-slate-500 mt-1">Max. 10.000 Coins</p>
            </div>

            {loanAmount && parseInt(loanAmount) > 0 && (
              <div className="bg-black/20 p-3 rounded-xl mb-4">
                <p className="text-sm text-slate-400">
                  Rückzahlung: <span className="text-amber-400 font-bold">
                    {Math.ceil(parseInt(loanAmount) * (1 + interestRate / 100))} Coins
                  </span>
                  <span className="text-slate-500"> (+{interestRate}%)</span>
                </p>
              </div>
            )}
            
            <button
              onClick={requestLoan}
              className="w-full py-3.5 bg-[#6c63ff] hover:bg-[#8b6dff] rounded-xl font-semibold transition-all"
              data-testid="request-loan-btn"
            >
              Kredit aufnehmen
            </button>
          </div>
        )}

        {/* Loan History */}
        <div className="bg-white/5 backdrop-blur-sm p-5 rounded-2xl border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <span>📜</span> Kredit-Historie
            </h3>
            <span className="text-xs text-slate-400">{loanHistory.length} Kredite</span>
          </div>
          
          {loanHistory.length === 0 ? (
            <p className="text-center text-slate-500 py-6">Keine Kredit-Historie</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto" data-testid="loan-history">
              {loanHistory.map((loan) => (
                <div 
                  key={loan.id}
                  className="bg-black/20 p-3 rounded-xl flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">✅</span>
                    <div>
                      <p className="font-medium">{loan.amount} Coins ({loan.interestRate}%)</p>
                      <p className="text-xs text-slate-400">Zurückgezahlt: {loan.repaidDate}</p>
                    </div>
                  </div>
                  <p className="text-emerald-400 font-bold text-sm">Bezahlt</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-white/5 p-4 rounded-2xl border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <span>💡</span>
            <h4 className="font-semibold">Kredit-Info</h4>
          </div>
          <p className="text-sm text-slate-400">
            Kredite werden sofort ausgezahlt. Zinsen werden bei Rückzahlung berechnet. 
            Du kannst den Zinssatz selbst einstellen ({interestRate}% aktuell).
          </p>
        </div>

        {/* Quick Link */}
        <Link 
          to="/merchant"
          className="mt-4 block bg-white/5 p-4 rounded-xl flex items-center gap-3 hover:bg-white/10 transition-all border border-white/5"
        >
          <span className="text-2xl">🏪</span>
          <div>
            <p className="font-medium">Merchant werden</p>
            <p className="text-xs text-slate-400">Zahlungen empfangen</p>
          </div>
        </Link>
      </div>

      <BottomNav />
    </div>
  );
}
