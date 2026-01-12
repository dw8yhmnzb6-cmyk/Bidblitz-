import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Zap, Trophy, Target, TrendingUp, ArrowRight, User, Mail, Ticket, Bot, Trash2, Power } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Dashboard() {
  const { user, token, refreshUser } = useAuth();
  const { t } = useLanguage();
  const [wonAuctions, setWonAuctions] = useState([]);
  const [autobidders, setAutobidders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [voucherCode, setVoucherCode] = useState('');
  const [redeemingVoucher, setRedeemingVoucher] = useState(false);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch won auctions
      if (user?.won_auctions?.length) {
        const auctions = await Promise.all(
          user.won_auctions.slice(0, 5).map(async (auctionId) => {
            try {
              const response = await axios.get(`${API}/auctions/${auctionId}`);
              return response.data;
            } catch {
              return null;
            }
          })
        );
        setWonAuctions(auctions.filter(Boolean));
      }

      // Fetch autobidders
      const autobiddersRes = await axios.get(`${API}/autobidder/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAutobidders(autobiddersRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeemVoucher = async (e) => {
    e.preventDefault();
    if (!voucherCode.trim()) return;

    setRedeemingVoucher(true);
    try {
      const response = await axios.post(
        `${API}/vouchers/redeem`,
        { code: voucherCode },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(response.data.message);
      setVoucherCode('');
      await refreshUser();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Fehler beim Einlösen');
    } finally {
      setRedeemingVoucher(false);
    }
  };

  const handleToggleAutobidder = async (autobidderId, currentStatus) => {
    try {
      await axios.put(
        `${API}/autobidder/${autobidderId}/toggle`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(currentStatus ? 'Autobidder deaktiviert' : 'Autobidder aktiviert');
      fetchData();
    } catch (error) {
      toast.error('Fehler beim Ändern');
    }
  };

  const handleDeleteAutobidder = async (autobidderId) => {
    try {
      await axios.delete(`${API}/autobidder/${autobidderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Autobidder gelöscht');
      fetchData();
    } catch (error) {
      toast.error('Fehler beim Löschen');
    }
  };

  const stats = [
    {
      icon: <Zap className="w-6 h-6" />,
      label: t('dashboard.availableBids'),
      value: user?.bids_balance || 0,
      color: 'text-[#06B6D4]',
      bgColor: 'bg-[#06B6D4]/20'
    },
    {
      icon: <Trophy className="w-6 h-6" />,
      label: t('dashboard.wonAuctions'),
      value: user?.won_auctions?.length || 0,
      color: 'text-[#10B981]',
      bgColor: 'bg-[#10B981]/20'
    },
    {
      icon: <Target className="w-6 h-6" />,
      label: t('dashboard.placedBids'),
      value: user?.total_bids_placed || 0,
      color: 'text-[#7C3AED]',
      bgColor: 'bg-[#7C3AED]/20'
    }
  ];

  return (
    <div className="min-h-screen pt-24 pb-12 px-4" data-testid="dashboard-page">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            {t('dashboard.welcome')}, {user?.name}!
          </h1>
          <p className="text-[#94A3B8]">{t('dashboard.manage')}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="glass-card rounded-xl p-6">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-xl ${stat.bgColor} flex items-center justify-center ${stat.color}`}>
                  {stat.icon}
                </div>
                <div>
                  <p className="text-[#94A3B8] text-sm">{stat.label}</p>
                  <p className={`text-3xl font-bold ${stat.color} font-mono`}>{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          <Link to="/buy-bids" className="block">
            <div className="glass-card rounded-xl p-6 hover:border-[#7C3AED]/50 transition-colors group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] flex items-center justify-center">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{t('dashboard.buyBids')}</h3>
                    <p className="text-[#94A3B8] text-sm">{t('dashboard.moreBids')}</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-[#94A3B8] group-hover:text-[#7C3AED] transition-colors" />
              </div>
            </div>
          </Link>
          
          <Link to="/auctions" className="block">
            <div className="glass-card rounded-xl p-6 hover:border-[#06B6D4]/50 transition-colors group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#06B6D4] to-[#10B981] flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{t('dashboard.liveAuctions')}</h3>
                    <p className="text-[#94A3B8] text-sm">{t('dashboard.bidAndWin')}</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-[#94A3B8] group-hover:text-[#06B6D4] transition-colors" />
              </div>
            </div>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-8">
            {/* Voucher Redemption */}
            <div className="glass-card rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Ticket className="w-6 h-6 text-[#F59E0B]" />
                <h2 className="text-xl font-bold text-white">{t('voucher.title') || 'Gutschein einlösen'}</h2>
              </div>
              <form onSubmit={handleRedeemVoucher} className="flex gap-3">
                <Input
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                  placeholder={t('voucher.placeholder') || 'Gutscheincode eingeben'}
                  className="flex-1 bg-[#181824] border-white/10 text-white uppercase font-mono"
                  data-testid="voucher-input"
                />
                <Button 
                  type="submit" 
                  disabled={redeemingVoucher || !voucherCode.trim()}
                  className="btn-primary"
                  data-testid="redeem-voucher-btn"
                >
                  {redeemingVoucher ? '...' : (t('voucher.redeem') || 'Einlösen')}
                </Button>
              </form>
            </div>

            {/* Profile Info */}
            <div className="glass-card rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-6">{t('dashboard.profile')}</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-lg bg-[#181824]">
                  <User className="w-5 h-5 text-[#7C3AED]" />
                  <div>
                    <p className="text-[#94A3B8] text-sm">{t('dashboard.name')}</p>
                    <p className="text-white font-medium">{user?.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-lg bg-[#181824]">
                  <Mail className="w-5 h-5 text-[#06B6D4]" />
                  <div>
                    <p className="text-[#94A3B8] text-sm">{t('dashboard.email')}</p>
                    <p className="text-white font-medium">{user?.email}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Autobidders */}
            <div className="glass-card rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <Bot className="w-6 h-6 text-[#7C3AED]" />
                <h2 className="text-xl font-bold text-white">{t('autobidder.title') || 'Autobidder'}</h2>
              </div>
              
              {loading ? (
                <div className="space-y-4">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="h-16 bg-[#181824] rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : autobidders.length > 0 ? (
                <div className="space-y-4">
                  {autobidders.map((ab) => (
                    <div key={ab.id} className={`p-4 rounded-lg bg-[#181824] ${!ab.is_active ? 'opacity-50' : ''}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <img
                            src={ab.product?.image_url}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                          <div>
                            <p className="text-white font-medium text-sm">{ab.product?.name}</p>
                            <p className="text-[#94A3B8] text-xs">Max: €{ab.max_price?.toFixed(2)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${ab.is_active ? 'bg-[#10B981]/20 text-[#10B981]' : 'bg-[#EF4444]/20 text-[#EF4444]'}`}>
                            {ab.is_active ? (t('autobidder.active') || 'Aktiv') : (t('autobidder.inactive') || 'Inaktiv')}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-[#94A3B8] text-xs">
                          {t('autobidder.bidsPlaced') || 'Gebote platziert'}: <span className="text-[#06B6D4] font-bold">{ab.bids_placed}</span>
                        </p>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className={ab.is_active ? "text-[#F59E0B] hover:bg-[#F59E0B]/10" : "text-[#10B981] hover:bg-[#10B981]/10"}
                            onClick={() => handleToggleAutobidder(ab.id, ab.is_active)}
                          >
                            <Power className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-[#EF4444] hover:bg-[#EF4444]/10"
                            onClick={() => handleDeleteAutobidder(ab.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Bot className="w-10 h-10 text-[#475569] mx-auto mb-3" />
                  <p className="text-[#94A3B8] text-sm">{t('autobidder.noAutobidders') || 'Keine aktiven Autobidder'}</p>
                  <Link to="/auctions">
                    <Button variant="link" className="text-[#7C3AED] mt-2 text-sm">
                      Autobidder bei Auktion aktivieren
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Won Auctions */}
            <div className="glass-card rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-6">{t('dashboard.wonAuctions')}</h2>
              {loading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 bg-[#181824] rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : wonAuctions.length > 0 ? (
                <div className="space-y-4">
                  {wonAuctions.map((auction) => (
                    <div key={auction.id} className="flex items-center gap-4 p-3 rounded-lg bg-[#181824]">
                      <img
                        src={auction.product?.image_url}
                        alt={auction.product?.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">{auction.product?.name}</p>
                        <p className="text-[#10B981] text-sm font-mono">€{auction.current_price?.toFixed(2)}</p>
                      </div>
                      <Trophy className="w-5 h-5 text-[#F59E0B] flex-shrink-0" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Trophy className="w-12 h-12 text-[#475569] mx-auto mb-3" />
                  <p className="text-[#94A3B8]">{t('dashboard.noWonAuctions')}</p>
                  <Link to="/auctions">
                    <Button variant="link" className="text-[#7C3AED] mt-2">
                      {t('dashboard.bidNow')}
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
