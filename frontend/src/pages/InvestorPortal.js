import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import axios from 'axios';
import { toast } from 'sonner';
import { 
  TrendingUp, Users, DollarSign, BarChart3, 
  Briefcase, Target, ArrowUpRight, CheckCircle,
  Clock, Building2, PieChart, Wallet
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartPie, Pie, Cell
} from 'recharts';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Stats Card Component
const StatCard = ({ icon: Icon, label, value, subValue, color, trend }) => (
  <div className="glass-card rounded-xl p-4 sm:p-6">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-[#94A3B8] text-xs sm:text-sm">{label}</p>
        <p className={`text-xl sm:text-2xl font-bold ${color || 'text-white'} mt-1`}>{value}</p>
        {subValue && <p className="text-[#94A3B8] text-xs mt-1">{subValue}</p>}
      </div>
      <div className={`p-2 sm:p-3 rounded-xl ${color?.replace('text-', 'bg-').replace('[', '[').split(' ')[0]}/20`}>
        <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${color}`} />
      </div>
    </div>
    {trend && (
      <div className="flex items-center gap-1 mt-2 text-xs">
        <ArrowUpRight className="w-3 h-3 text-[#10B981]" />
        <span className="text-[#10B981]">{trend}</span>
      </div>
    )}
  </div>
);

// Crowdfunding Project Card
const ProjectCard = ({ project, onInvest }) => {
  const progress = project.progress_percent || 0;
  
  return (
    <div className="glass-card rounded-xl overflow-hidden">
      {project.image_url && (
        <img src={project.image_url} alt={project.title} className="w-full h-32 object-cover" />
      )}
      <div className="p-4">
        <h3 className="text-white font-bold text-lg">{project.title}</h3>
        <p className="text-[#94A3B8] text-sm mt-1 line-clamp-2">{project.description}</p>
        
        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-[#94A3B8] mb-1">
            <span>€{project.total_funded?.toLocaleString('de-DE') || 0}</span>
            <span>Ziel: €{project.target_amount?.toLocaleString('de-DE')}</span>
          </div>
          <div className="h-2 bg-[#181824] rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] rounded-full transition-all"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs mt-1">
            <span className="text-[#10B981]">{progress.toFixed(1)}% finanziert</span>
            <span className="text-[#94A3B8]">{project.investor_count || 0} Investoren</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-4">
          <span className="text-[#94A3B8] text-xs">
            Min: €{project.min_investment?.toLocaleString('de-DE')}
          </span>
          <Button 
            onClick={() => onInvest(project)}
            className="btn-primary text-sm"
            size="sm"
          >
            Investieren
          </Button>
        </div>
      </div>
    </div>
  );
};

export default function InvestorPortal() {
  const { user, token } = useAuth();
  const { language } = useLanguage();
  
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [projects, setProjects] = useState([]);
  const [myInvestments, setMyInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Investment form
  const [investAmount, setInvestAmount] = useState('');
  const [investType, setInvestType] = useState('standard');
  const [selectedProject, setSelectedProject] = useState(null);
  const [showInvestModal, setShowInvestModal] = useState(false);
  
  useEffect(() => {
    fetchData();
  }, []);
  
  const fetchData = async () => {
    try {
      // Public stats - no auth needed
      const statsRes = await axios.get(`${API}/investor/public/stats`);
      setStats(statsRes.data);
      
      const chartRes = await axios.get(`${API}/investor/public/growth-chart`);
      setChartData(chartRes.data.chart_data || []);
      
      const projectsRes = await axios.get(`${API}/investor/crowdfunding/projects`);
      setProjects(projectsRes.data.projects || []);
      
      // User investments (if logged in)
      if (token) {
        try {
          const myInvRes = await axios.get(`${API}/investor/investments`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setMyInvestments(myInvRes.data.investments || []);
        } catch (e) {
          // User not logged in or no investments
        }
      }
    } catch (error) {
      console.error('Error fetching investor data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleInvest = async (e) => {
    e.preventDefault();
    if (!token) {
      toast.error('Bitte melden Sie sich an, um zu investieren');
      return;
    }
    
    const amount = parseFloat(investAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Bitte geben Sie einen gültigen Betrag ein');
      return;
    }
    
    try {
      if (selectedProject) {
        // Crowdfunding investment
        await axios.post(`${API}/investor/crowdfunding/invest`, {
          project_id: selectedProject.id,
          amount
        }, { headers: { Authorization: `Bearer ${token}` } });
        toast.success(`Investition von €${amount} in "${selectedProject.title}" eingereicht!`);
      } else {
        // Direct investment
        await axios.post(`${API}/investor/investments`, {
          amount,
          investment_type: investType
        }, { headers: { Authorization: `Bearer ${token}` } });
        toast.success(`Investitionsanfrage von €${amount} eingereicht!`);
      }
      
      setShowInvestModal(false);
      setInvestAmount('');
      setSelectedProject(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Fehler bei der Investition');
    }
  };
  
  const COLORS = ['#7C3AED', '#06B6D4', '#10B981', '#F59E0B'];
  
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0D14] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#7C3AED] border-t-transparent" />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-[#0D0D14] pt-20 pb-12 px-4" data-testid="investor-portal">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            💼 Investor Portal
          </h1>
          <p className="text-[#94A3B8]">
            {language === 'de' 
              ? 'Investieren Sie in die Zukunft von BidBlitz' 
              : 'Invest in the future of BidBlitz'}
          </p>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: 'overview', label: 'Übersicht', icon: BarChart3 },
            { id: 'crowdfunding', label: 'Crowdfunding', icon: Target },
            { id: 'invest', label: 'Investieren', icon: Wallet },
            { id: 'my-investments', label: 'Meine Investitionen', icon: Briefcase }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-[#7C3AED] text-white'
                  : 'bg-[#181824] text-[#94A3B8] hover:bg-[#1A1A2E]'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
        
        {/* Overview Tab */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-6">
            {/* Key Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={Users}
                label="Gesamte Nutzer"
                value={stats.platform_stats?.total_users?.toLocaleString('de-DE') || 0}
                subValue={`+${stats.platform_stats?.new_users_30d || 0} (30 Tage)`}
                color="text-[#7C3AED]"
                trend={`${stats.growth_indicators?.monthly_growth_rate || 0}% Wachstum`}
              />
              <StatCard
                icon={DollarSign}
                label="Gesamtumsatz"
                value={`€${stats.financial_stats?.total_revenue_eur?.toLocaleString('de-DE') || 0}`}
                subValue={`Ø €${stats.financial_stats?.avg_transaction_value || 0}/Trans.`}
                color="text-[#10B981]"
              />
              <StatCard
                icon={BarChart3}
                label="Auktionen"
                value={stats.auction_stats?.total_auctions?.toLocaleString('de-DE') || 0}
                subValue={`${stats.auction_stats?.active_auctions || 0} aktiv`}
                color="text-[#06B6D4]"
              />
              <StatCard
                icon={TrendingUp}
                label="Erfolgsrate"
                value={`${stats.auction_stats?.success_rate || 0}%`}
                subValue={`${stats.auction_stats?.completed_auctions || 0} abgeschlossen`}
                color="text-[#F59E0B]"
              />
            </div>
            
            {/* Growth Chart */}
            <div className="glass-card rounded-xl p-6">
              <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#7C3AED]" />
                Wachstumskurve (12 Monate)
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#7C3AED" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} />
                    <YAxis stroke="#94A3B8" fontSize={11} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#181824', border: '1px solid #374151', borderRadius: '8px' }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="users" 
                      stroke="#7C3AED" 
                      fillOpacity={1} 
                      fill="url(#colorUsers)" 
                      name="Neue Nutzer"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#10B981" 
                      strokeWidth={2}
                      name="Umsatz (€)"
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Investment Opportunities */}
            <div className="glass-card rounded-xl p-6">
              <h3 className="text-white font-bold text-lg mb-4">Warum in BidBlitz investieren?</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-[#181824] rounded-lg">
                  <div className="w-10 h-10 bg-[#7C3AED]/20 rounded-lg flex items-center justify-center mb-3">
                    <TrendingUp className="w-5 h-5 text-[#7C3AED]" />
                  </div>
                  <h4 className="text-white font-medium mb-1">Starkes Wachstum</h4>
                  <p className="text-[#94A3B8] text-sm">
                    {stats.growth_indicators?.monthly_growth_rate || 0}% monatliches Nutzerwachstum
                  </p>
                </div>
                <div className="p-4 bg-[#181824] rounded-lg">
                  <div className="w-10 h-10 bg-[#06B6D4]/20 rounded-lg flex items-center justify-center mb-3">
                    <Building2 className="w-5 h-5 text-[#06B6D4]" />
                  </div>
                  <h4 className="text-white font-medium mb-1">Bewährtes Modell</h4>
                  <p className="text-[#94A3B8] text-sm">
                    Penny-Auktionen sind ein etabliertes Geschäftsmodell
                  </p>
                </div>
                <div className="p-4 bg-[#181824] rounded-lg">
                  <div className="w-10 h-10 bg-[#10B981]/20 rounded-lg flex items-center justify-center mb-3">
                    <Target className="w-5 h-5 text-[#10B981]" />
                  </div>
                  <h4 className="text-white font-medium mb-1">Klare Strategie</h4>
                  <p className="text-[#94A3B8] text-sm">
                    Expansion in neue Märkte und Produktkategorien
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Crowdfunding Tab */}
        {activeTab === 'crowdfunding' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Aktive Projekte</h2>
              <span className="text-[#94A3B8] text-sm">{projects.length} Projekte</span>
            </div>
            
            {projects.length === 0 ? (
              <div className="glass-card rounded-xl p-8 text-center">
                <Target className="w-12 h-12 text-[#94A3B8] mx-auto mb-3" />
                <p className="text-[#94A3B8]">Derzeit keine aktiven Crowdfunding-Projekte</p>
                <p className="text-[#94A3B8] text-sm mt-1">Neue Projekte werden bald veröffentlicht</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map(project => (
                  <ProjectCard 
                    key={project.id} 
                    project={project}
                    onInvest={(p) => {
                      setSelectedProject(p);
                      setShowInvestModal(true);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Invest Tab */}
        {activeTab === 'invest' && (
          <div className="max-w-2xl mx-auto">
            <div className="glass-card rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-[#7C3AED]" />
                Direkt investieren
              </h2>
              
              <form onSubmit={handleInvest} className="space-y-4">
                <div>
                  <Label className="text-white">Investitionsbetrag (EUR)</Label>
                  <Input
                    type="number"
                    min="500"
                    step="100"
                    value={investAmount}
                    onChange={(e) => setInvestAmount(e.target.value)}
                    placeholder="z.B. 5000"
                    className="bg-[#181824] border-white/10 text-white"
                    required
                  />
                  <p className="text-[#94A3B8] text-xs mt-1">Mindestinvestition: €500</p>
                </div>
                
                <div>
                  <Label className="text-white">Investitionstyp</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {[
                      { id: 'standard', label: 'Standard', desc: 'Ab €500' },
                      { id: 'premium', label: 'Premium', desc: 'Ab €5.000' },
                      { id: 'partner', label: 'Partner', desc: 'Ab €25.000' }
                    ].map(type => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setInvestType(type.id)}
                        className={`p-3 rounded-lg border transition-all ${
                          investType === type.id
                            ? 'border-[#7C3AED] bg-[#7C3AED]/10'
                            : 'border-white/10 bg-[#181824]'
                        }`}
                      >
                        <p className={`font-medium ${investType === type.id ? 'text-[#7C3AED]' : 'text-white'}`}>
                          {type.label}
                        </p>
                        <p className="text-[#94A3B8] text-xs">{type.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="p-4 bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-lg">
                  <p className="text-[#F59E0B] text-sm">
                    ⚠️ Dies ist eine unverbindliche Interessensbekundung. 
                    Nach Einreichung werden Sie von unserem Team kontaktiert.
                  </p>
                </div>
                
                <Button type="submit" className="w-full btn-primary">
                  Investitionsanfrage senden
                </Button>
              </form>
            </div>
          </div>
        )}
        
        {/* My Investments Tab */}
        {activeTab === 'my-investments' && (
          <div className="space-y-6">
            {!token ? (
              <div className="glass-card rounded-xl p-8 text-center">
                <Briefcase className="w-12 h-12 text-[#94A3B8] mx-auto mb-3" />
                <p className="text-white font-medium">Bitte melden Sie sich an</p>
                <p className="text-[#94A3B8] text-sm mt-1">
                  Um Ihre Investitionen zu sehen, müssen Sie angemeldet sein
                </p>
                <Button 
                  onClick={() => window.location.href = '/login'}
                  className="btn-primary mt-4"
                >
                  Anmelden
                </Button>
              </div>
            ) : myInvestments.length === 0 ? (
              <div className="glass-card rounded-xl p-8 text-center">
                <Briefcase className="w-12 h-12 text-[#94A3B8] mx-auto mb-3" />
                <p className="text-[#94A3B8]">Sie haben noch keine Investitionen</p>
                <Button 
                  onClick={() => setActiveTab('invest')}
                  className="btn-primary mt-4"
                >
                  Jetzt investieren
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="glass-card rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[#94A3B8] text-sm">Gesamtinvestition</p>
                      <p className="text-2xl font-bold text-[#10B981]">
                        €{myInvestments.reduce((sum, inv) => sum + (inv.amount || 0), 0).toLocaleString('de-DE')}
                      </p>
                    </div>
                    <div>
                      <p className="text-[#94A3B8] text-sm">Anzahl</p>
                      <p className="text-2xl font-bold text-white">{myInvestments.length}</p>
                    </div>
                  </div>
                </div>
                
                {myInvestments.map(inv => (
                  <div key={inv.id} className="glass-card rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">€{inv.amount?.toLocaleString('de-DE')}</p>
                        <p className="text-[#94A3B8] text-xs">
                          {new Date(inv.created_at).toLocaleDateString('de-DE')}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        inv.status === 'completed' ? 'bg-[#10B981]/20 text-[#10B981]' :
                        inv.status === 'approved' ? 'bg-[#06B6D4]/20 text-[#06B6D4]' :
                        inv.status === 'pending' ? 'bg-[#F59E0B]/20 text-[#F59E0B]' :
                        'bg-red-500/20 text-red-500'
                      }`}>
                        {inv.status === 'completed' ? 'Abgeschlossen' :
                         inv.status === 'approved' ? 'Genehmigt' :
                         inv.status === 'pending' ? 'Ausstehend' : 'Abgelehnt'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Investment Modal */}
        {showInvestModal && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="bg-[#1A1A2E] rounded-xl border border-white/10 max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-white mb-4">
                {selectedProject ? `In "${selectedProject.title}" investieren` : 'Investieren'}
              </h3>
              
              <form onSubmit={handleInvest} className="space-y-4">
                <div>
                  <Label className="text-white">Betrag (EUR)</Label>
                  <Input
                    type="number"
                    min={selectedProject?.min_investment || 100}
                    value={investAmount}
                    onChange={(e) => setInvestAmount(e.target.value)}
                    placeholder={`Min: €${selectedProject?.min_investment || 100}`}
                    className="bg-[#181824] border-white/10 text-white"
                    required
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowInvestModal(false);
                      setSelectedProject(null);
                    }}
                    className="flex-1"
                  >
                    Abbrechen
                  </Button>
                  <Button type="submit" className="flex-1 btn-primary">
                    Investieren
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
        
      </div>
    </div>
  );
}
