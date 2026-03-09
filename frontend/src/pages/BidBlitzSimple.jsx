/**
 * BidBlitz Simple - Minimal Design
 * Coins, Mining, Upgrade, Dice Game
 */
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

export default function BidBlitzSimple() {
  const navigate = useNavigate();
  const [coins, setCoins] = useState(0);
  const [btc, setBtc] = useState(0);
  const [hashrate, setHashrate] = useState(0.65);
  const [minerLevel, setMinerLevel] = useState(1);
  const [diceResult, setDiceResult] = useState(null);
  const [message, setMessage] = useState('');
  
  const userId = localStorage.getItem('userId') || 'guest_' + Math.random().toString(36).substr(2, 9);
  const btcRef = useRef(btc);
  
  useEffect(() => {
    if (!localStorage.getItem('userId')) localStorage.setItem('userId', userId);
    fetchData();
    
    // Hide header
    const header = document.querySelector('header');
    if (header) header.style.display = 'none';
    
    return () => {
      const header = document.querySelector('header');
      if (header) header.style.display = '';
    };
  }, []);
  
  // Live BTC mining
  useEffect(() => {
    btcRef.current = btc;
    const interval = setInterval(() => {
      const reward = hashrate * 0.000000001;
      setBtc(prev => {
        const newBtc = prev + reward;
        btcRef.current = newBtc;
        return newBtc;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [hashrate]);
  
  const fetchData = async () => {
    try {
      // Get coins
      const coinsRes = await axios.get(`${API}/bbz/coins/${userId}`);
      setCoins(coinsRes.data.coins || 100);
      
      // Get miners
      const minersRes = await axios.get(`${API}/bbz/miners/${userId}`);
      if (minersRes.data.miners?.length > 0) {
        const totalHashrate = minersRes.data.miners.reduce((sum, m) => sum + (m.hashrate || 0), 0);
        setHashrate(totalHashrate || 0.65);
        setMinerLevel(minersRes.data.miners[0]?.level || 1);
      }
    } catch (error) {
      setCoins(100);
    }
  };
  
  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };
  
  const upgradeMiner = async () => {
    const price = 100;
    
    if (coins < price) {
      showMessage('❌ Nicht genug Coins!');
      return;
    }
    
    try {
      // Spend coins
      const spendRes = await axios.post(`${API}/bbz/coins/spend`, {
        user_id: userId,
        amount: price,
        source: 'miner_upgrade_simple'
      });
      
      setCoins(spendRes.data.new_balance);
      setHashrate(prev => prev + 0.5);
      setMinerLevel(prev => prev + 1);
      showMessage('✅ Miner Upgrade! +0.5 TH');
    } catch (error) {
      showMessage(error.response?.data?.detail || 'Fehler beim Upgrade');
    }
  };
  
  const playDice = async () => {
    const bet = 10;
    
    if (coins < bet) {
      showMessage('❌ Nicht genug Coins!');
      return;
    }
    
    try {
      // Spend coins for bet
      const spendRes = await axios.post(`${API}/bbz/coins/spend`, {
        user_id: userId,
        amount: bet,
        source: 'dice_bet'
      });
      
      setCoins(spendRes.data.new_balance);
      
      // Roll dice
      const dice = Math.floor(Math.random() * 6) + 1;
      setDiceResult(dice);
      
      if (dice >= 4) {
        // Win! Earn 20 coins
        const earnRes = await axios.post(`${API}/bbz/coins/earn`, {
          user_id: userId,
          amount: 20,
          source: 'dice_win'
        });
        setCoins(earnRes.data.new_balance);
        showMessage(`🎲 Würfel: ${dice} - Gewonnen! +20 Coins`);
      } else {
        showMessage(`🎲 Würfel: ${dice} - Verloren!`);
      }
    } catch (error) {
      showMessage(error.response?.data?.detail || 'Fehler beim Spielen');
    }
  };
  
  return (
    <div style={{
      background: '#0f172a',
      color: 'white',
      fontFamily: 'Arial, sans-serif',
      textAlign: 'center',
      minHeight: '100vh',
      padding: '20px',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      overflowY: 'auto',
      zIndex: 999
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <button 
          onClick={() => navigate('/super-home')}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: '24px',
            cursor: 'pointer'
          }}
        >
          ←
        </button>
        <h2 style={{ margin: 0 }}>⚡ BidBlitz</h2>
        <div style={{ width: 30 }} />
      </div>
      
      {/* Message */}
      {message && (
        <div style={{
          background: '#6366f1',
          padding: '12px 20px',
          borderRadius: '10px',
          marginBottom: '15px',
          fontWeight: 'bold'
        }}>
          {message}
        </div>
      )}
      
      {/* Coins Card */}
      <div style={{
        background: '#1e293b',
        padding: '20px',
        margin: '15px auto',
        borderRadius: '15px',
        maxWidth: '400px'
      }}>
        <h3 style={{ margin: '0 0 10px 0' }}>💰 Coins</h3>
        <div style={{ 
          fontSize: '36px', 
          fontWeight: 'bold',
          color: '#fbbf24'
        }}>
          {coins.toLocaleString()}
        </div>
      </div>
      
      {/* Mining Card */}
      <div style={{
        background: '#1e293b',
        padding: '20px',
        margin: '15px auto',
        borderRadius: '15px',
        maxWidth: '400px'
      }}>
        <h3 style={{ margin: '0 0 10px 0' }}>⛏ Mining</h3>
        <div style={{ 
          fontSize: '24px', 
          fontWeight: 'bold',
          color: '#22c55e',
          fontFamily: 'monospace'
        }}>
          {btc.toFixed(8)} BTC
        </div>
        <div style={{ 
          fontSize: '14px', 
          color: '#94a3b8',
          marginTop: '5px'
        }}>
          {hashrate.toFixed(2)} TH/s
        </div>
      </div>
      
      {/* Miner Card */}
      <div style={{
        background: '#1e293b',
        padding: '20px',
        margin: '15px auto',
        borderRadius: '15px',
        maxWidth: '400px'
      }}>
        <h3 style={{ margin: '0 0 10px 0' }}>Nano Miner S1</h3>
        <div style={{ 
          fontSize: '18px',
          color: '#94a3b8',
          marginBottom: '10px'
        }}>
          Level {minerLevel} • {hashrate.toFixed(2)} TH
        </div>
        <button 
          onClick={upgradeMiner}
          style={{
            background: coins >= 100 ? '#6366f1' : '#374151',
            border: 'none',
            padding: '15px 30px',
            borderRadius: '10px',
            color: 'white',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: coins >= 100 ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s'
          }}
        >
          Upgrade (100 Coins)
        </button>
      </div>
      
      {/* Dice Game Card */}
      <div style={{
        background: '#1e293b',
        padding: '20px',
        margin: '15px auto',
        borderRadius: '15px',
        maxWidth: '400px'
      }}>
        <h3 style={{ margin: '0 0 10px 0' }}>🎲 Dice Game</h3>
        <div style={{ 
          fontSize: '14px',
          color: '#94a3b8',
          marginBottom: '15px'
        }}>
          Würfle 4+ und gewinne 2x!
        </div>
        <button 
          onClick={playDice}
          style={{
            background: coins >= 10 ? '#6366f1' : '#374151',
            border: 'none',
            padding: '15px 30px',
            borderRadius: '10px',
            color: 'white',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: coins >= 10 ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s'
          }}
        >
          Play (10 Coins)
        </button>
        
        {diceResult && (
          <div style={{
            marginTop: '15px',
            fontSize: '48px'
          }}>
            {['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'][diceResult - 1]}
          </div>
        )}
      </div>
      
      {/* Bottom Navigation */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: '#111827',
        display: 'flex',
        justifyContent: 'space-around',
        padding: '15px',
        borderTop: '1px solid #1f2937'
      }}>
        <button 
          onClick={() => navigate('/super-home')}
          style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '24px', cursor: 'pointer' }}
        >
          🏠
        </button>
        <button 
          onClick={() => navigate('/games')}
          style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '24px', cursor: 'pointer' }}
        >
          🎮
        </button>
        <button 
          style={{ background: 'none', border: 'none', color: '#6366f1', fontSize: '24px', cursor: 'pointer' }}
        >
          ⛏
        </button>
        <button 
          onClick={() => navigate('/wallet')}
          style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '24px', cursor: 'pointer' }}
        >
          💰
        </button>
      </div>
    </div>
  );
}
