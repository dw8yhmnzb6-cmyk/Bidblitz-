import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Activity Index - Snipster Style with individual colored squares
const ActivityIndex = memo(({ auctionId = '' }) => {
  const hash = auctionId ? auctionId.split('').reduce((a, b) => a + b.charCodeAt(0), 0) : 50;
  const filledCount = 3 + (hash % 4); // 3-6 filled (30-60%)
  
  return (
    <div className="flex items-center gap-1 mt-1">
      <span className="text-[8px] text-gray-600">Aktivitätsindex:</span>
      <div className="flex gap-px">
        {[...Array(10)].map((_, i) => {
          let color = '#d1d5db'; // gray
          if (i < filledCount) {
            if (i < 2) color = '#22c55e'; // green
            else if (i < 4) color = '#84cc16'; // lime
            else if (i < 6) color = '#eab308'; // yellow
            else if (i < 8) color = '#f97316'; // orange
            else color = '#ef4444'; // red
          }
          return <div key={i} className="w-1.5 h-2.5 rounded-sm" style={{ backgroundColor: color }} />;
        })}
      </div>
    </div>
  );
});

// Timer Component - Never shows 00:00:00, minimum is 00:00:03
const AuctionTimer = memo(({ endTime, onBid }) => {
  const [time, setTime] = useState({ h: 0, m: 0, s: 10 });
  
  useEffect(() => {
    if (!endTime) return;
    
    const calc = () => {
      const now = Date.now();
      const end = new Date(endTime).getTime();
      const diff = Math.max(3000, end - now); // Minimum 3 seconds
      
      setTime({
        h: Math.floor(diff / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.max(3, Math.floor((diff % 60000) / 1000)) // Never below 3
      });
    };
    
    calc();
    const interval = setInterval(calc, 1000);
    return () => clearInterval(interval);
  }, [endTime]);
  
  const pad = (n) => String(n).padStart(2, '0');
  const isLow = time.h === 0 && time.m === 0 && time.s < 10;
  
  return (
    <div className={`text-center px-2 py-1 rounded text-xs font-mono font-bold ${isLow ? 'bg-red-500 text-white' : 'bg-blue-600 text-white'}`}>
      {pad(time.h)}:{pad(time.m)}:{pad(time.s)}
    </div>
  );
});

// Premium Auction Card (Top Left)
const PremiumCard = memo(({ auction, product, onBid }) => {
  if (!auction || !product) return null;
  
  return (
    <div className="bg-gradient-to-b from-cyan-100 to-cyan-200 rounded-lg p-3 border-2 border-cyan-400">
      {/* Product Name */}
      <h2 className="text-sm font-bold text-gray-800 uppercase leading-tight mb-1">
        {product.name}
      </h2>
      <p className="text-[10px] text-gray-600 mb-2">
        Vergleichspreis*: € {product.retail_price?.toLocaleString('de-DE')},-
      </p>
      
      <div className="flex gap-3">
        {/* Left: Timer + Price + Button */}
        <div className="flex-1">
          <AuctionTimer endTime={auction.end_time} />
          
          <div className="mt-2">
            <span className="text-2xl font-black text-gray-800">
              € {auction.current_price?.toFixed(2).replace('.', ',')}
            </span>
            <p className="text-[10px] text-cyan-700">{auction.last_bidder_name || 'Startpreis'}</p>
          </div>
          
          <button 
            onClick={() => onBid(auction.id)}
            className="mt-2 w-full py-2 bg-gradient-to-b from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400 text-white font-bold text-sm rounded shadow-md"
          >
            BIETEN
          </button>
          
          <ActivityIndex auctionId={auction.id} />
        </div>
        
        {/* Right: Product Image */}
        <div className="w-24 h-24 bg-white rounded flex items-center justify-center shadow">
          <img 
            src={product.image_url || 'https://via.placeholder.com/96'}
            alt=""
            className="max-w-full max-h-full object-contain p-1"
          />
        </div>
      </div>
      
      <p className="text-[9px] text-gray-500 mt-2 text-center">
        Zuletzt versteigert für nur <span className="text-green-600 font-bold">€ {(product.retail_price * 0.02).toFixed(2).replace('.', ',')}</span>
      </p>
    </div>
  );
});

// Small Auction Card
const AuctionCard = memo(({ auction, product, onBid }) => {
  if (!auction || !product) return null;
  
  // Badge text based on auction type
  let badgeText = '';
  let badgeColor = 'bg-orange-500';
  
  if (auction.is_free_auction) {
    badgeText = 'GRATIS BIETEN!';
    badgeColor = 'bg-green-500';
  } else if (auction.is_beginner_only) {
    badgeText = 'FÜR ANFÄNGER!';
    badgeColor = 'bg-purple-500';
  } else if (auction.is_vip_only) {
    badgeText = 'VIP';
    badgeColor = 'bg-yellow-500 text-black';
  } else if (auction.is_night_auction) {
    badgeText = 'NACHT-AUKTION';
    badgeColor = 'bg-indigo-600';
  } else {
    badgeText = 'FÜR PROFIS!';
    badgeColor = 'bg-orange-500';
  }
  
  const discount = product.retail_price 
    ? Math.round((1 - auction.current_price / product.retail_price) * 100)
    : 99;
  
  return (
    <div 
      className="bg-gradient-to-b from-cyan-50 to-cyan-100 rounded-lg overflow-hidden border border-cyan-300 cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => window.location.href = `/auctions/${auction.id}`}
    >
      {/* Badge Header */}
      <div className={`${badgeColor} text-white text-[9px] font-bold text-center py-0.5 flex items-center justify-between px-2`}>
        <span>{badgeText}</span>
        <AuctionTimer endTime={auction.end_time} />
      </div>
      
      {/* Content */}
      <div className="p-2">
        {/* Product Name */}
        <h3 className="text-[10px] font-bold text-gray-800 uppercase leading-tight mb-1 line-clamp-2 min-h-[24px]">
          {product.name}
        </h3>
        <p className="text-[8px] text-gray-500 mb-1">
          Vergleichspreis*: € {product.retail_price?.toLocaleString('de-DE')},-
        </p>
        
        <div className="flex gap-2">
          {/* Left: Price + Button */}
          <div className="flex-1">
            <div className="flex items-center gap-1">
              <span className="text-lg font-black text-gray-800">
                € {auction.current_price?.toFixed(2).replace('.', ',')}
              </span>
              <span className={`text-[8px] font-bold px-1 py-0.5 rounded ${discount > 90 ? 'bg-red-500 text-white' : 'bg-orange-400 text-white'}`}>
                -{discount}%
              </span>
            </div>
            <p className="text-[9px] text-cyan-700">{auction.last_bidder_name || 'Startpreis'}</p>
            
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onBid(auction.id);
              }}
              className="mt-1 w-full py-1.5 bg-gradient-to-b from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400 text-white font-bold text-[10px] rounded"
            >
              BIETEN
            </button>
          </div>
          
          {/* Right: Product Image */}
          <div className="w-14 h-14 bg-white rounded flex items-center justify-center shadow-sm flex-shrink-0">
            <img 
              src={product.image_url || 'https://via.placeholder.com/56'}
              alt=""
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>
        
        <ActivityIndex auctionId={auction.id} />
      </div>
      
      {/* Footer */}
      <div className="bg-cyan-200/50 px-2 py-1 text-center">
        <p className="text-[8px] text-gray-600">
          Zuletzt versteigert für nur <span className="text-green-600 font-bold">€ {(product.retail_price * 0.03).toFixed(2).replace('.', ',')}</span>
        </p>
      </div>
    </div>
  );
});

// Info Sidebar
const InfoSidebar = () => (
  <div className="space-y-3">
    {/* Login Box */}
    <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
      <h3 className="text-sm font-bold text-gray-800 mb-2">LOGIN</h3>
      <input type="text" placeholder="Benutzername" className="w-full px-2 py-1 text-xs border rounded mb-1" />
      <input type="password" placeholder="Passwort" className="w-full px-2 py-1 text-xs border rounded mb-2" />
      <button className="w-full py-1.5 bg-cyan-500 text-white text-xs font-bold rounded">EINLOGGEN</button>
      <a href="/register" className="text-[10px] text-cyan-600 block text-center mt-1">Kostenlos anmelden</a>
    </div>
    
    {/* How it Works */}
    <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
      <h3 className="text-xs font-bold text-gray-800 mb-2">DAS IST BIDBLITZ</h3>
      <ol className="text-[9px] text-gray-600 space-y-1">
        <li><span className="font-bold text-cyan-600">1</span> Gebotspaket kaufen</li>
        <li><span className="font-bold text-cyan-600">2</span> Produkt auswählen und 1 Cent mehr bieten</li>
        <li><span className="font-bold text-cyan-600">3</span> Sobald die Zeit abgelaufen ist und niemand höher bietet, Produkt zum Schnäppchenpreis erwerben</li>
      </ol>
    </div>
    
    {/* Badges Legend */}
    <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
      <h3 className="text-xs font-bold text-gray-800 mb-2">AUKTIONS-TYPEN</h3>
      <div className="space-y-1 text-[9px]">
        <div className="flex items-center gap-1">
          <span className="bg-orange-500 text-white px-1 rounded text-[8px]">FÜR PROFIS!</span>
          <span className="text-gray-600">Standard</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="bg-purple-500 text-white px-1 rounded text-[8px]">🎓 ANFÄNGER</span>
          <span className="text-gray-600">&lt;10 Siege</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="bg-green-500 text-white px-1 rounded text-[8px]">🎁 GRATIS</span>
          <span className="text-gray-600">Kostenlos</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="bg-yellow-500 text-black px-1 rounded text-[8px]">⭐ VIP</span>
          <span className="text-gray-600">Exklusiv</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="bg-indigo-600 text-white px-1 rounded text-[8px]">🌙 NACHT</span>
          <span className="text-gray-600">22-6 Uhr</span>
        </div>
      </div>
    </div>
  </div>
);

export default function Auctions() {
  const { isAuthenticated, token, updateBidsBalance } = useAuth();
  const navigate = useNavigate();
  
  const [auctions, setAuctions] = useState([]);
  const [products, setProducts] = useState({});
  const [loading, setLoading] = useState(true);
  const wsRef = useRef(null);
  
  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      const [auctionsRes, productsRes] = await Promise.all([
        axios.get(`${API}/auctions?status=active`),
        axios.get(`${API}/products`)
      ]);
      
      const prodMap = {};
      productsRes.data.forEach(p => { prodMap[p.id] = p; });
      setProducts(prodMap);
      setAuctions(auctionsRes.data.filter(a => a.status === 'active'));
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, []);
  
  // WebSocket for real-time updates
  useEffect(() => {
    const connectWS = () => {
      const wsUrl = process.env.REACT_APP_BACKEND_URL?.replace('https://', 'wss://').replace('http://', 'ws://');
      if (!wsUrl) return;
      
      const ws = new WebSocket(`${wsUrl}/ws/auctions/all_auctions`);
      wsRef.current = ws;
      
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'bid_update' && msg.data) {
            setAuctions(prev => prev.map(a => 
              a.id === msg.auction_id
                ? { ...a, ...msg.data }
                : a
            ));
          }
        } catch (e) {}
      };
      
      ws.onclose = () => setTimeout(connectWS, 3000);
    };
    
    connectWS();
    return () => wsRef.current?.close();
  }, []);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  // Handle bid
  const handleBid = async (auctionId) => {
    if (!isAuthenticated) {
      toast.error('Bitte anmelden um zu bieten');
      navigate('/login');
      return;
    }
    
    try {
      const res = await axios.post(
        `${API}/auctions/place-bid/${auctionId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Gebot platziert!');
      if (res.data.bids_remaining !== undefined) {
        updateBidsBalance(res.data.bids_remaining);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Fehler beim Bieten');
    }
  };
  
  // Get premium auction
  const premiumAuction = auctions.find(a => a.is_vip_only) || auctions[0];
  
  // Get grid auctions (max 6 to fit on screen)
  const gridAuctions = auctions.filter(a => a.id !== premiumAuction?.id).slice(0, 6);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-cyan-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-cyan-600 border-t-transparent" />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-200 to-cyan-300 p-3" data-testid="auctions-page">
      {/* Header with current time */}
      <div className="text-center text-xs text-gray-600 mb-2">
        {new Date().toLocaleTimeString('de-DE')} UHR | Öffnungszeiten 0-24 Uhr | {auctions.length} Live-Auktionen
      </div>
      
      {/* Main Content - No Scroll, Everything on One Screen */}
      <div className="flex gap-3 max-w-6xl mx-auto">
        {/* Left Side: Auctions */}
        <div className="flex-1">
          {/* Premium Auction */}
          {premiumAuction && products[premiumAuction.product_id] && (
            <PremiumCard 
              auction={premiumAuction}
              product={products[premiumAuction.product_id]}
              onBid={handleBid}
            />
          )}
          
          {/* Live Auctions Label */}
          <h2 className="text-sm font-bold text-gray-800 mt-3 mb-2">
            Live-Auktionen
          </h2>
          
          {/* Grid of Auctions - 2 columns, 3 rows = 6 auctions max on screen */}
          <div className="grid grid-cols-2 gap-2">
            {gridAuctions.map(auction => (
              <AuctionCard 
                key={auction.id}
                auction={auction}
                product={products[auction.product_id]}
                onBid={handleBid}
              />
            ))}
          </div>
        </div>
        
        {/* Right Sidebar - Only on larger screens */}
        <div className="hidden md:block w-48 flex-shrink-0">
          <InfoSidebar />
        </div>
      </div>
      
      {/* Footer Note */}
      <p className="text-center text-[8px] text-gray-500 mt-2">
        * Vergleichspreis = UVP des Herstellers
      </p>
    </div>
  );
}
