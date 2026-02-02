import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { Users, MapPin, Euro, TrendingUp, CheckCircle, XCircle, LogOut, Building2 } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function ManagerDashboard() {
  const { language } = useLanguage();
  const [manager, setManager] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });

  const texts = {
    de: {
      title: 'Manager Dashboard',
      subtitle: 'Verwalten Sie Ihre Influencer und Provisionen',
      login: 'Anmelden',
      email: 'E-Mail',
      password: 'Passwort',
      loginButton: 'Einloggen',
      logout: 'Abmelden',
      cities: 'Ihre Städte',
      statistics: 'Statistiken',
      totalInfluencers: 'Gesamt Influencer',
      activeInfluencers: 'Aktive Influencer',
      totalRevenue: 'Gesamt-Umsatz (Influencer)',
      totalCommission: 'Influencer-Provisionen',
      yourCommission: 'Ihre Provision (15%)',
      pendingPayout: 'Ausstehende Auszahlung',
      requestPayout: 'Auszahlung anfordern',
      influencers: 'Ihre Influencer',
      noInfluencers: 'Noch keine Influencer in Ihren Städten',
      approve: 'Freischalten',
      block: 'Sperren',
      city: 'Stadt',
      revenue: 'Umsatz',
      commission: 'Provision',
      customers: 'Kunden',
      active: 'Aktiv',
      blocked: 'Gesperrt',
      pending: 'Ausstehend',
      assignCity: 'Stadt zuweisen',
      loginError: 'Ungültige Anmeldedaten',
      approved: 'Influencer freigeschaltet',
      blockedMsg: 'Influencer gesperrt',
      payoutRequested: 'Auszahlung angefordert',
      minPayout: 'Mindestens €10 erforderlich'
    },
    en: {
      title: 'Manager Dashboard',
      subtitle: 'Manage your influencers and commissions',
      login: 'Login',
      email: 'Email',
      password: 'Password',
      loginButton: 'Log In',
      logout: 'Logout',
      cities: 'Your Cities',
      statistics: 'Statistics',
      totalInfluencers: 'Total Influencers',
      activeInfluencers: 'Active Influencers',
      totalRevenue: 'Total Revenue (Influencers)',
      totalCommission: 'Influencer Commissions',
      yourCommission: 'Your Commission (15%)',
      pendingPayout: 'Pending Payout',
      requestPayout: 'Request Payout',
      influencers: 'Your Influencers',
      noInfluencers: 'No influencers in your cities yet',
      approve: 'Approve',
      block: 'Block',
      city: 'City',
      revenue: 'Revenue',
      commission: 'Commission',
      customers: 'Customers',
      active: 'Active',
      blocked: 'Blocked',
      pending: 'Pending',
      assignCity: 'Assign City',
      loginError: 'Invalid credentials',
      approved: 'Influencer approved',
      blockedMsg: 'Influencer blocked',
      payoutRequested: 'Payout requested',
      minPayout: 'Minimum €10 required'
    }
  };

  const t = texts[language] || texts.de;

  // Check for saved manager session
  useEffect(() => {
    const savedManager = localStorage.getItem('manager');
    if (savedManager) {
      const parsed = JSON.parse(savedManager);
      setManager(parsed);
      fetchDashboard(parsed.id);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/manager/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });
      const data = await res.json();
      if (data.success) {
        setManager(data.manager);
        localStorage.setItem('manager', JSON.stringify(data.manager));
        fetchDashboard(data.manager.id);
        toast.success(t.login);
      } else {
        toast.error(t.loginError);
      }
    } catch (err) {
      toast.error(t.loginError);
    }
    setLoading(false);
  };

  const handleLogout = () => {
    setManager(null);
    setDashboard(null);
    localStorage.removeItem('manager');
  };

  const fetchDashboard = async (managerId) => {
    try {
      const res = await fetch(`${API_URL}/api/manager/dashboard/${managerId}`);
      const data = await res.json();
      setDashboard(data);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    }
  };

  const handleApprove = async (influencerId) => {
    try {
      const res = await fetch(`${API_URL}/api/manager/${manager.id}/influencer/approve/${influencerId}`, {
        method: 'POST'
      });
      if (res.ok) {
        toast.success(t.approved);
        fetchDashboard(manager.id);
      }
    } catch (err) {
      toast.error('Error');
    }
  };

  const handleBlock = async (influencerId) => {
    try {
      const res = await fetch(`${API_URL}/api/manager/${manager.id}/influencer/block/${influencerId}`, {
        method: 'POST'
      });
      if (res.ok) {
        toast.success(t.blockedMsg);
        fetchDashboard(manager.id);
      }
    } catch (err) {
      toast.error('Error');
    }
  };

  const handleRequestPayout = async () => {
    if (!dashboard || dashboard.statistics.pending_payout < 10) {
      toast.error(t.minPayout);
      return;
    }
    try {
      const amount = dashboard.statistics.pending_payout;
      const res = await fetch(`${API_URL}/api/manager/${manager.id}/request-payout?amount=${amount}`, {
        method: 'POST'
      });
      if (res.ok) {
        toast.success(t.payoutRequested);
        fetchDashboard(manager.id);
      }
    } catch (err) {
      toast.error('Error');
    }
  };

  // Login Screen
  if (!manager) {
    return (
      <div className="min-h-screen bg-[#0D0D14] py-12 px-4" data-testid="manager-login-page">
        <div className="max-w-md mx-auto">
          <Card className="bg-[#1A1A2E] border-white/10">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#10B981] flex items-center justify-center mb-4">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl text-white">{t.title}</CardTitle>
              <CardDescription className="text-[#94A3B8]">{t.subtitle}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="text-sm text-[#94A3B8] mb-1 block">{t.email}</label>
                  <Input
                    type="email"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    className="bg-[#0D0D14] border-white/10 text-white"
                    placeholder="manager@bidblitz.de"
                    required
                    data-testid="manager-email-input"
                  />
                </div>
                <div>
                  <label className="text-sm text-[#94A3B8] mb-1 block">{t.password}</label>
                  <Input
                    type="password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    className="bg-[#0D0D14] border-white/10 text-white"
                    placeholder="••••••••"
                    required
                    data-testid="manager-password-input"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-[#7C3AED] to-[#10B981]"
                  disabled={loading}
                  data-testid="manager-login-btn"
                >
                  {loading ? '...' : t.loginButton}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Dashboard
  return (
    <div className="min-h-screen bg-[#0D0D14] py-8 px-4" data-testid="manager-dashboard">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">{t.title}</h1>
            <p className="text-[#94A3B8]">{manager.name}</p>
          </div>
          <Button variant="outline" onClick={handleLogout} className="border-white/20 text-white">
            <LogOut className="w-4 h-4 mr-2" />
            {t.logout}
          </Button>
        </div>

        {/* Cities */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-white mb-3">{t.cities}</h2>
          <div className="flex flex-wrap gap-2">
            {manager.cities.map((city) => (
              <Badge key={city} className="bg-[#7C3AED]/20 text-[#7C3AED] border-[#7C3AED]/30 px-3 py-1">
                <MapPin className="w-3 h-3 mr-1" />
                {city}
              </Badge>
            ))}
          </div>
        </div>

        {/* Statistics */}
        {dashboard && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
              <Card className="bg-[#1A1A2E] border-white/10">
                <CardContent className="p-4 text-center">
                  <Users className="w-6 h-6 text-[#7C3AED] mx-auto mb-2" />
                  <p className="text-2xl font-bold text-white">{dashboard.statistics.total_influencers}</p>
                  <p className="text-xs text-[#94A3B8]">{t.totalInfluencers}</p>
                </CardContent>
              </Card>
              <Card className="bg-[#1A1A2E] border-white/10">
                <CardContent className="p-4 text-center">
                  <CheckCircle className="w-6 h-6 text-[#10B981] mx-auto mb-2" />
                  <p className="text-2xl font-bold text-white">{dashboard.statistics.active_influencers}</p>
                  <p className="text-xs text-[#94A3B8]">{t.activeInfluencers}</p>
                </CardContent>
              </Card>
              <Card className="bg-[#1A1A2E] border-white/10">
                <CardContent className="p-4 text-center">
                  <Euro className="w-6 h-6 text-[#F59E0B] mx-auto mb-2" />
                  <p className="text-2xl font-bold text-white">€{dashboard.statistics.total_influencer_revenue}</p>
                  <p className="text-xs text-[#94A3B8]">{t.totalRevenue}</p>
                </CardContent>
              </Card>
              <Card className="bg-[#1A1A2E] border-white/10">
                <CardContent className="p-4 text-center">
                  <TrendingUp className="w-6 h-6 text-[#3B82F6] mx-auto mb-2" />
                  <p className="text-2xl font-bold text-white">€{dashboard.statistics.total_influencer_commission}</p>
                  <p className="text-xs text-[#94A3B8]">{t.totalCommission}</p>
                </CardContent>
              </Card>
              <Card className="bg-[#1A1A2E] border-white/10 border-[#10B981]/30">
                <CardContent className="p-4 text-center">
                  <Euro className="w-6 h-6 text-[#10B981] mx-auto mb-2" />
                  <p className="text-2xl font-bold text-[#10B981]">€{dashboard.statistics.manager_commission.toFixed(2)}</p>
                  <p className="text-xs text-[#94A3B8]">{t.yourCommission}</p>
                </CardContent>
              </Card>
              <Card className="bg-[#1A1A2E] border-white/10">
                <CardContent className="p-4 text-center">
                  <Euro className="w-6 h-6 text-[#EC4899] mx-auto mb-2" />
                  <p className="text-2xl font-bold text-white">€{dashboard.statistics.pending_payout.toFixed(2)}</p>
                  <p className="text-xs text-[#94A3B8]">{t.pendingPayout}</p>
                </CardContent>
              </Card>
            </div>

            {/* Payout Button */}
            {dashboard.statistics.pending_payout >= 10 && (
              <div className="mb-8">
                <Button 
                  onClick={handleRequestPayout}
                  className="bg-gradient-to-r from-[#10B981] to-[#059669]"
                  data-testid="request-payout-btn"
                >
                  <Euro className="w-4 h-4 mr-2" />
                  {t.requestPayout} (€{dashboard.statistics.pending_payout.toFixed(2)})
                </Button>
              </div>
            )}

            {/* Influencers List */}
            <Card className="bg-[#1A1A2E] border-white/10">
              <CardHeader>
                <CardTitle className="text-white">{t.influencers}</CardTitle>
              </CardHeader>
              <CardContent>
                {dashboard.influencers.length === 0 ? (
                  <p className="text-[#94A3B8] text-center py-8">{t.noInfluencers}</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left text-[#94A3B8] py-3 px-2 text-sm">Name</th>
                          <th className="text-left text-[#94A3B8] py-3 px-2 text-sm">Code</th>
                          <th className="text-left text-[#94A3B8] py-3 px-2 text-sm">{t.city}</th>
                          <th className="text-right text-[#94A3B8] py-3 px-2 text-sm">{t.customers}</th>
                          <th className="text-right text-[#94A3B8] py-3 px-2 text-sm">{t.revenue}</th>
                          <th className="text-right text-[#94A3B8] py-3 px-2 text-sm">{t.commission}</th>
                          <th className="text-center text-[#94A3B8] py-3 px-2 text-sm">Status</th>
                          <th className="text-right text-[#94A3B8] py-3 px-2 text-sm">Aktionen</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dashboard.influencers.map((inf) => (
                          <tr key={inf.id} className="border-b border-white/5 hover:bg-white/5">
                            <td className="py-3 px-2 text-white font-medium">{inf.name}</td>
                            <td className="py-3 px-2 text-[#7C3AED]">{inf.code}</td>
                            <td className="py-3 px-2 text-[#94A3B8]">{inf.city || '-'}</td>
                            <td className="py-3 px-2 text-white text-right">{inf.total_customers}</td>
                            <td className="py-3 px-2 text-white text-right">€{inf.total_revenue}</td>
                            <td className="py-3 px-2 text-[#10B981] text-right">€{inf.total_commission}</td>
                            <td className="py-3 px-2 text-center">
                              {inf.is_active ? (
                                <Badge className="bg-[#10B981]/20 text-[#10B981]">{t.active}</Badge>
                              ) : (
                                <Badge className="bg-red-500/20 text-red-500">{t.blocked}</Badge>
                              )}
                            </td>
                            <td className="py-3 px-2 text-right">
                              {inf.is_active ? (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleBlock(inf.id)}
                                  className="border-red-500/30 text-red-500 hover:bg-red-500/10"
                                >
                                  <XCircle className="w-3 h-3 mr-1" />
                                  {t.block}
                                </Button>
                              ) : (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleApprove(inf.id)}
                                  className="border-[#10B981]/30 text-[#10B981] hover:bg-[#10B981]/10"
                                >
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  {t.approve}
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
