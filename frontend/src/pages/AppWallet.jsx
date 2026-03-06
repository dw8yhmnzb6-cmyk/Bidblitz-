/**
 * BidBlitz App Wallet - With Chart & Live Feed
 * Based on provided HTML design
 */
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  Wallet, Coins, ArrowUpRight, ArrowDownLeft, 
  History, Gift, ShoppingCart, Plus, ChevronRight,
  TrendingUp, Cpu, Zap, Server, Activity
} from 'lucide-react';
import BottomNav from '../components/BottomNav';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

export default function AppWallet() {
  const [balance, setBalance] = useState(0);
  const [stats, setStats] = useState({ hashrate: 0, daily: 0, miners: 0, earned: 0, spent: 0 });
  const [chartData, setChartData] = useState({ labels: [], data: [] });
  const [liveFeed, setLiveFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  
  useEffect(() => {
    fetchData();
    
    // Poll live feed every 5 seconds
    const feedInterval = setInterval(fetchLiveFeed, 5000);
    return () => clearInterval(feedInterval);
  }, []);
  
  // Draw chart when data changes
  useEffect(() => {
    if (chartData.labels.length > 0 && canvasRef.current) {
      drawChart();
    }
  }, [chartData]);
  
  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const [walletRes, statsRes, chartRes, minersRes] = await Promise.all([
        axios.get(`${API}/app/wallet/balance`, { headers }),
        axios.get(`${API}/app/mining/stats`, { headers }),
        axios.get(`${API}/app/mining/chart-data`, { headers }),
        axios.get(`${API}/app/miners/my`, { headers })
      ]);
      
      setBalance(walletRes.data.coins || 0);
      setStats({
        hashrate: statsRes.data.total_hashrate || 0,
        daily: statsRes.data.daily_reward || 0,
        miners: minersRes.data.count || 0,
        earned: statsRes.data.total_earned || 0,
        spent: statsRes.data.total_spent || 0
      });
      setChartData({
        labels: chartRes.data.labels || [],
        data: chartRes.data.data || []
      });
      
      fetchLiveFeed();
    } catch (error) {
      console.error('Error fetching wallet data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchLiveFeed = async () => {
    try {
      const res = await axios.get(`${API}/app/live-feed?limit=10`);
      setLiveFeed(res.data.feed || []);
    } catch (error) {
      console.log('Live feed not available');
    }
  };
  
  const drawChart = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const { labels, data } = chartData;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const padding = 40;
    const chartWidth = canvas.width - padding * 2;
    const chartHeight = canvas.height - padding * 2;
    const maxValue = Math.max(...data, 1);
    
    // Draw grid lines
    ctx.strokeStyle = '#2a2f4e';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding + (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(canvas.width - padding, y);
      ctx.stroke();
    }
    
    // Draw line chart
    ctx.strokeStyle = '#6c63ff';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    
    const stepX = chartWidth / (labels.length - 1);
    
    data.forEach((value, index) => {
      const x = padding + stepX * index;
      const y = padding + chartHeight - (value / maxValue) * chartHeight;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();
    
    // Draw gradient fill
    const gradient = ctx.createLinearGradient(0, padding, 0, canvas.height - padding);
    gradient.addColorStop(0, 'rgba(108, 99, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(108, 99, 255, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    
    data.forEach((value, index) => {
      const x = padding + stepX * index;
      const y = padding + chartHeight - (value / maxValue) * chartHeight;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.lineTo(padding + stepX * (data.length - 1), canvas.height - padding);
    ctx.lineTo(padding, canvas.height - padding);
    ctx.closePath();
    ctx.fill();
    
    // Draw points
    ctx.fillStyle = '#6c63ff';
    data.forEach((value, index) => {
      const x = padding + stepX * index;
      const y = padding + chartHeight - (value / maxValue) * chartHeight;
      
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
    });
    
    // Draw labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    
    labels.forEach((label, index) => {
      const x = padding + stepX * index;
      ctx.fillText(label, x, canvas.height - 10);
    });
  };
  
  const addTestCoins = async () => {
    setAdding(true);
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.post(`${API}/app/wallet/add-coins?amount=1000`, {}, { headers });
      setBalance(res.data.new_balance);
    } catch (error) {
      console.error('Error adding coins:', error);
    } finally {
      setAdding(false);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0c0f22] flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-[#6c63ff] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-[#0c0f22] text-white pb-24">
      {/* Header */}
      <div className="p-5 pt-6">
        <h1 className="text-2xl font-bold mb-1">BidBlitz Wallet</h1>
      </div>
      
      {/* Balance Card - Gradient */}
      <div className="px-5 mb-5">
        <div className="bg-gradient-to-br from-[#6a5cff] to-[#8b7dff] rounded-2xl p-6 shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
          <p className="text-white/70 text-sm mb-1">Balance</p>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold">{balance.toLocaleString()}</h1>
            <Coins className="w-8 h-8 text-amber-300" />
          </div>
          
          <div className="grid grid-cols-2 gap-3 mt-5">
            <button
              onClick={addTestCoins}
              disabled={adding}
              className="py-2.5 bg-white/20 hover:bg-white/30 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              {adding ? 'Laden...' : 'Aufladen'}
            </button>
            <Link
              to="/miner-market"
              className="py-2.5 bg-white/20 hover:bg-white/30 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-colors"
            >
              <ShoppingCart className="w-4 h-4" />
              Ausgeben
            </Link>
          </div>
        </div>
      </div>
      
      {/* Stats Grid */}
      <div className="px-5 mb-5">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#1c213f] rounded-xl p-4 text-center">
            <Cpu className="w-5 h-5 mx-auto mb-2 text-cyan-400" />
            <p className="text-lg font-bold">{stats.hashrate} TH</p>
            <p className="text-xs text-slate-500">Mining Power</p>
          </div>
          <div className="bg-[#1c213f] rounded-xl p-4 text-center">
            <TrendingUp className="w-5 h-5 mx-auto mb-2 text-green-400" />
            <p className="text-lg font-bold">{stats.daily}</p>
            <p className="text-xs text-slate-500">Daily Reward</p>
          </div>
          <div className="bg-[#1c213f] rounded-xl p-4 text-center">
            <Server className="w-5 h-5 mx-auto mb-2 text-purple-400" />
            <p className="text-lg font-bold">{stats.miners}</p>
            <p className="text-xs text-slate-500">Total Miners</p>
          </div>
        </div>
      </div>
      
      {/* Profit Chart */}
      <div className="px-5 mb-5">
        <div className="bg-[#1c213f] rounded-xl p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#6c63ff]" />
            Profit Chart
          </h3>
          <canvas 
            ref={canvasRef} 
            width={350} 
            height={200}
            className="w-full"
          />
        </div>
      </div>
      
      {/* Live Transactions */}
      <div className="px-5">
        <div className="bg-[#1c213f] rounded-xl p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <History className="w-5 h-5 text-[#6c63ff]" />
            Live Transactions
          </h3>
          <div className="space-y-3 max-h-48 overflow-y-auto">
            {liveFeed.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-4">Keine Aktivitäten</p>
            ) : (
              liveFeed.map((item, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center gap-3 py-2 border-b border-slate-700/50 last:border-0 animate-fadeIn"
                >
                  <div className={`w-2 h-2 rounded-full ${
                    item.type === 'game_win' ? 'bg-green-400' :
                    item.type === 'purchase' ? 'bg-amber-400' :
                    item.type === 'daily_reward' ? 'bg-purple-400' :
                    'bg-cyan-400'
                  }`} />
                  <p className="text-sm text-slate-300">{item.action}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      
      {/* Bottom Navigation */}
      <BottomNav />
      
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
