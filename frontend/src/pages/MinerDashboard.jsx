/**
 * BidBlitz Mining Dashboard - Premium Design
 * Mit Tabs: Farm, Übersicht, Belohnung, Verkauf
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

// Miner Images (using gradient boxes as 3D-style placeholders)
const MinerVisual = ({ tier, level, size = 'normal' }) => {
  const tierColors = {
    bronze: 'from-amber-600 to-amber-800',
    silver: 'from-slate-400 to-slate-600',
    gold: 'from-yellow-400 to-amber-500',
    platinum: 'from-cyan-400 to-blue-500',
    diamond: 'from-purple-400 to-pink-500',
  };
  
  const sizeClasses = {
    small: 'w-12 h-16',
    normal: 'w-20 h-28',
    large: 'w-32 h-44',
  };
  
  return (
    <div className={`${sizeClasses[size]} mx-auto relative`}>
      {/* Main Box */}
      <div 
        className={`w-full h-full rounded-lg bg-gradient-to-br ${tierColors[tier] || tierColors.bronze} shadow-2xl`}
        style={{ 
          transform: 'perspective(500px) rotateY(-5deg)',
          boxShadow: '8px 8px 20px rgba(0,0,0,0.4), -2px -2px 10px rgba(255,255,255,0.1)'
        }}
      >
        {/* Screen */}
        <div className="absolute top-2 left-2 right-2 h-1/3 bg-black/80 rounded flex items-center justify-center">
          <span className="text-green-400 font-mono text-xs font-bold tracking-wider">
            {level >= 5 ? 'BONUS' : `LV.${level}`}
          </span>
        </div>
        
        {/* Fans/Vents */}
        <div className="absolute bottom-2 left-2 right-2 flex gap-1 justify-center">
          <div className="w-4 h-4 rounded-full bg-black/60 animate-spin-slow" style={{animationDuration: '3s'}} />
          <div className="w-4 h-4 rounded-full bg-black/60 animate-spin-slow" style={{animationDuration: '2.5s'}} />
          <div className="w-4 h-4 rounded-full bg-black/60 animate-spin-slow" style={{animationDuration: '3.5s'}} />
        </div>
      </div>
      
      {/* Level indicator */}
      <div className="absolute -top-2 -right-2 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-xs font-bold shadow-lg">
        {level}
      </div>
    </div>
  );
};

// Tab Button Component
const TabButton = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 font-medium transition-all ${
      active 
        ? 'text-white border-b-2 border-purple-500' 
        : 'text-gray-400 hover:text-gray-200'
    }`}
  >
    {children}
  </button>
);

export default function MinerDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('farm');
  const [miners, setMiners] = useState([]);
  const [coins, setCoins] = useState(0);
  const [poolStats, setPoolStats] = useState(null);
  const [shop, setShop] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  
  const userId = localStorage.getItem('userId') || 'guest_' + Math.random().toString(36).substr(2, 9);
  
  useEffect(() => {
    if (!localStorage.getItem('userId')) localStorage.setItem('userId', userId);
    fetchData();
  }, []);
  
  const fetchData = async () => {
    try {
      const [minersRes, walletRes, poolRes, shopRes] = await Promise.all([
        axios.get(`${API}/bbz/miners/${userId}`).catch(() => ({ data: { miners: [] } })),
        axios.get(`${API}/bbz/coins/${userId}`).catch(() => ({ data: { coins: 100 } })),
        axios.get(`${API}/bbz/miners/pool-stats`).catch(() => ({ data: null })),
        axios.get(`${API}/bbz/miners/shop`).catch(() => ({ data: { miners: [] } })),
      ]);
      
      setMiners(minersRes.data.miners || []);
      setCoins(walletRes.data.coins || 100);
      setPoolStats(poolRes.data);
      setShop(shopRes.data.miners || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const showMessage = (msg, type = 'success') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 4000);
  };
  
  const upgradeMiner = async (minerId, currentLevel) => {
    const cost = currentLevel * 50;
    
    if (coins < cost) {
      showMessage(`❌ Nicht genug Coins! Du brauchst ${cost} Coins.`, 'error');
      return;
    }
    
    if (!window.confirm(`Miner auf Level ${currentLevel + 1} upgraden?\n\nKosten: ${cost} Coins`)) {
      return;
    }
    
    try {
      const res = await axios.post(`${API}/bbz/miners/upgrade`, {
        user_id: userId,
        miner_id: minerId
      });
      
      showMessage(`✅ Miner upgraded! -${res.data.cost} Coins`);
      setCoins(res.data.new_balance);
      fetchData();
    } catch (error) {
      showMessage(error.response?.data?.detail || 'Upgrade fehlgeschlagen', 'error');
    }
  };
  
  const buyMiner = async (minerType, price) => {
    if (coins < price) {
      showMessage(`❌ Nicht genug Coins! Du brauchst ${price} Coins.`, 'error');
      return;
    }
    
    if (!window.confirm(`Miner kaufen?\n\nKosten: ${price} Coins`)) {
      return;
    }
    
    try {
      const res = await axios.post(`${API}/bbz/miners/create`, {
        user_id: userId,
        miner_type: minerType
      });
      
      showMessage(`✅ ${res.data.miner.name} gekauft! -${res.data.cost} Coins`);
      setCoins(res.data.new_balance);
      fetchData();
    } catch (error) {
      showMessage(error.response?.data?.detail || 'Kauf fehlgeschlagen', 'error');
    }
  };
  
  const sellMiner = async (minerId, minerName) => {
    if (!window.confirm(`${minerName} verkaufen?\n\nDu erhältst 50% des Kaufpreises + Level-Bonus zurück.`)) {
      return;
    }
    
    try {
      const res = await axios.post(`${API}/bbz/miners/sell`, {
        user_id: userId,
        miner_id: minerId
      });
      
      showMessage(`✅ Miner verkauft! +${res.data.sell_value} Coins`);
      setCoins(res.data.new_balance);
      fetchData();
    } catch (error) {
      showMessage(error.response?.data?.detail || 'Verkauf fehlgeschlagen', 'error');
    }
  };
  
  const claimRewards = async () => {
    try {
      const res = await axios.post(`${API}/bbz/miners/claim-rewards/${userId}`);
      showMessage(`✅ ${res.data.reward} Coins gesammelt!`);
      setCoins(res.data.new_balance);
    } catch (error) {
      showMessage(error.response?.data?.detail || 'Zu früh! Warte noch etwas.', 'error');
    }
  };
  
  const claimBonusMiner = async () => {
    try {
      const res = await axios.post(`${API}/bbz/miners/give-bonus/${userId}`);
      showMessage(`🎁 Bonus Miner erhalten!`);
      fetchData();
    } catch (error) {
      showMessage(error.response?.data?.detail || 'Bonus bereits erhalten', 'error');
    }
  };
  
  // Calculate totals
  const totalHashrate = miners.reduce((sum, m) => sum + (m.hashrate || 0), 0);
  const dailyBTC = (totalHashrate * 0.00000001 * 24).toFixed(8);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
      `}</style>
      
      {/* Header */}
      <div className="bg-white px-4 py-4 flex items-center justify-between shadow-sm">
        <h1 className="text-xl font-bold text-gray-800">Meine Bergleute</h1>
        <button onClick={() => navigate(-1)} className="p-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>
      
      {/* Promo Banner */}
      <div className="mx-4 mt-4 bg-gradient-to-r from-purple-500 to-violet-600 rounded-2xl p-4 text-white relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-lg font-bold">Bis zu 9.85% p.a.</h2>
          <p className="text-sm opacity-90">Lassen Sie Ihre Krypto für sich arbeiten – einfach, flexibel, täglich</p>
          <button 
            onClick={claimBonusMiner}
            className="mt-3 flex items-center gap-2 text-sm font-medium hover:underline"
          >
            Jetzt starten <span>→</span>
          </button>
        </div>
        <div className="absolute right-0 top-0 w-24 h-24 opacity-50">
          <div className="w-full h-full rounded-full bg-white/20 animate-pulse" />
        </div>
      </div>
      
      {/* Miner Count & Actions */}
      <div className="mx-4 mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-gray-800 font-semibold">Miner</span>
          <span className="text-gray-500">{miners.length}</span>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setActiveTab('shop')}
            className="px-4 py-2 bg-purple-500 text-white rounded-full flex items-center gap-2 text-sm font-medium hover:bg-purple-600 transition-all"
          >
            <span className="text-lg">+</span> Miner erstellen
          </button>
          <button 
            onClick={fetchData}
            className="p-2 border border-gray-300 rounded-full hover:bg-gray-100 transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="mt-4 border-b border-gray-200 flex justify-around bg-white">
        <TabButton active={activeTab === 'farm'} onClick={() => setActiveTab('farm')}>Farm</TabButton>
        <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>Übersicht</TabButton>
        <TabButton active={activeTab === 'rewards'} onClick={() => setActiveTab('rewards')}>Belohnung</TabButton>
        <TabButton active={activeTab === 'sell'} onClick={() => setActiveTab('sell')}>Verkauf</TabButton>
      </div>
      
      {/* Message */}
      {message && (
        <div className={`mx-4 mt-4 p-3 rounded-xl text-center font-medium ${
          messageType === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {message}
        </div>
      )}
      
      {/* Coin Balance */}
      <div className="mx-4 mt-4 bg-white rounded-xl p-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-xl">💰</div>
          <div>
            <p className="text-xs text-gray-500">Guthaben</p>
            <p className="text-lg font-bold text-gray-800">{coins.toLocaleString()} Coins</p>
          </div>
        </div>
        <button 
          onClick={() => navigate('/buy-bids')}
          className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200 transition-all"
        >
          + Aufladen
        </button>
      </div>
      
      {/* Tab Content */}
      <div className="mx-4 mt-4">
        
        {/* FARM TAB */}
        {activeTab === 'farm' && (
          <div className="space-y-4">
            {miners.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center">
                <div className="text-6xl mb-4">⛏️</div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Keine Miner</h3>
                <p className="text-gray-500 mb-4">Kaufe deinen ersten Miner im Shop!</p>
                <button 
                  onClick={claimBonusMiner}
                  className="px-6 py-3 bg-purple-500 text-white rounded-xl font-medium hover:bg-purple-600 transition-all"
                >
                  🎁 Gratis Bonus-Miner holen
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {miners.map((miner) => (
                  <div key={miner.id} className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-4">
                      <MinerVisual tier={miner.tier} level={miner.level} size="normal" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded">⚡ {miner.hashrate} TH</span>
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded">⚙️ {miner.efficiency || 15} W/TH</span>
                        </div>
                        <h3 className="font-semibold text-gray-800 mt-2">#{miner.id.slice(0,4).toUpperCase()}</h3>
                        <p className="text-sm text-gray-500">{miner.name}</p>
                        
                        {miner.level < 10 && (
                          <button
                            onClick={() => upgradeMiner(miner.id, miner.level)}
                            className={`mt-3 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                              coins >= miner.level * 50
                                ? 'bg-purple-500 text-white hover:bg-purple-600'
                                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            }`}
                          >
                            Upgrade (Lv.{miner.level + 1}) - {miner.level * 50} 🪙
                          </button>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
                          {miner.is_bonus ? '∞' : '0'} TAGE
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-4">📊 Deine Mining-Statistiken</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Total Hashrate</p>
                  <p className="text-xl font-bold text-cyan-600">{totalHashrate.toFixed(2)} TH</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Est. Daily</p>
                  <p className="text-xl font-bold text-green-600">{dailyBTC} BTC</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Miner Anzahl</p>
                  <p className="text-xl font-bold text-amber-600">{miners.length}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Coins/Tag</p>
                  <p className="text-xl font-bold text-purple-600">~{Math.round(totalHashrate * 48)}</p>
                </div>
              </div>
            </div>
            
            {poolStats && (
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <h3 className="font-semibold text-gray-800 mb-4">🌍 Pool Statistiken</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500">Pool Hashrate</p>
                    <p className="font-semibold">{poolStats.total_hashrate} TH/s</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Active Miners</p>
                    <p className="font-semibold">{poolStats.total_miners}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Pool Luck</p>
                    <p className={`font-semibold ${poolStats.pool_luck >= 100 ? 'text-green-600' : 'text-amber-600'}`}>
                      {poolStats.pool_luck}%
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Block Reward</p>
                    <p className="font-semibold">{poolStats.next_block_reward} BTC</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* REWARDS TAB */}
        {activeTab === 'rewards' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-6 shadow-sm text-center">
              <div className="text-6xl mb-4">💎</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Mining Belohnungen</h3>
              <p className="text-gray-500 mb-4">
                Deine Miner verdienen: ~{Math.round(totalHashrate * 2)} Coins/Stunde
              </p>
              <button
                onClick={claimRewards}
                disabled={miners.length === 0}
                className={`px-8 py-4 rounded-xl font-semibold text-lg transition-all ${
                  miners.length > 0
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-lg'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
              >
                💰 Belohnung abholen
              </button>
              <p className="text-xs text-gray-400 mt-3">Kann alle 60 Minuten abgeholt werden</p>
            </div>
            
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-3">🎁 Bonus</h3>
              <button
                onClick={claimBonusMiner}
                className="w-full py-3 bg-purple-100 text-purple-700 rounded-xl font-medium hover:bg-purple-200 transition-all"
              >
                Gratis Bonus-Miner holen
              </button>
            </div>
          </div>
        )}
        
        {/* SELL TAB */}
        {activeTab === 'sell' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-6 shadow-sm text-center">
              <MinerVisual tier="gold" level={5} size="large" />
              <h3 className="text-lg font-bold text-gray-800 mt-4">Verkaufen Sie Ihren Miner jederzeit</h3>
              <p className="text-gray-500 mt-2">
                Ihr Miner gehört Ihnen ein Leben lang, aber Sie können ihn jederzeit problemlos auf unserem Marktplatz weiterverkaufen.
              </p>
            </div>
            
            {miners.length > 0 ? (
              <div className="space-y-3">
                {miners.map((miner) => {
                  const sellValue = Math.floor((miner.type === 'bonus' ? 0 : 50) * 0.5) + (miner.level - 1) * 25;
                  return (
                    <div key={miner.id} className="bg-white rounded-xl p-4 shadow-sm flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <MinerVisual tier={miner.tier} level={miner.level} size="small" />
                        <div>
                          <p className="font-semibold text-gray-800">{miner.name}</p>
                          <p className="text-sm text-gray-500">Lv.{miner.level} • {miner.hashrate} TH</p>
                        </div>
                      </div>
                      <button
                        onClick={() => sellMiner(miner.id, miner.name)}
                        disabled={miner.is_bonus}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          miner.is_bonus
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-red-100 text-red-600 hover:bg-red-200'
                        }`}
                      >
                        {miner.is_bonus ? 'Nicht verkaufbar' : `Verkaufen (+${sellValue} 🪙)`}
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">Keine Miner zum Verkaufen</p>
            )}
          </div>
        )}
        
        {/* SHOP TAB */}
        {activeTab === 'shop' && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-800">🛒 Miner Shop</h3>
            <div className="grid grid-cols-1 gap-4">
              {shop.map((item) => (
                <div key={item.type} className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-4">
                    <MinerVisual tier={item.tier} level={1} size="normal" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800">{item.name}</h4>
                      <p className="text-sm text-gray-500">{item.hashrate} TH/s • {item.tier}</p>
                      <p className="text-lg font-bold text-purple-600 mt-1">{item.price} Coins</p>
                    </div>
                    <button
                      onClick={() => buyMiner(item.type, item.price)}
                      disabled={coins < item.price}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        coins >= item.price
                          ? 'bg-purple-500 text-white hover:bg-purple-600'
                          : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      Kaufen
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-3">
        <button onClick={() => navigate('/super-home')} className="flex flex-col items-center text-gray-400 hover:text-purple-500">
          <span className="text-xl">🏠</span>
          <span className="text-xs">Home</span>
        </button>
        <button onClick={() => navigate('/games')} className="flex flex-col items-center text-gray-400 hover:text-purple-500">
          <span className="text-xl">🎮</span>
          <span className="text-xs">Games</span>
        </button>
        <button className="flex flex-col items-center text-purple-500">
          <div className="w-12 h-12 -mt-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-xl shadow-lg">
            ⛏️
          </div>
          <span className="text-xs mt-1">Mining</span>
        </button>
        <button onClick={() => navigate('/wallet')} className="flex flex-col items-center text-gray-400 hover:text-purple-500">
          <span className="text-xl">💳</span>
          <span className="text-xs">Wallet</span>
        </button>
        <button onClick={() => navigate('/profile')} className="flex flex-col items-center text-gray-400 hover:text-purple-500">
          <span className="text-xl">👤</span>
          <span className="text-xs">Profile</span>
        </button>
      </nav>
    </div>
  );
}
