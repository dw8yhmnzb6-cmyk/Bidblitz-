// Admin Dashboard Tab Component
import { 
  Users, Gavel, Package, BarChart3, RefreshCw, TrendingUp, Activity, Search 
} from 'lucide-react';
import { Button } from '../ui/button';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart
} from 'recharts';
import AdminQuickActions from './AdminQuickActions';
import AdminLiveWidgets from './AdminLiveWidgets';

const CHART_COLORS = {
  primary: '#FFD700',
  secondary: '#FF4D4D',
  tertiary: '#06B6D4',
  success: '#10B981',
  purple: '#7C3AED',
  orange: '#F59E0B'
};

const PIE_COLORS = ['#10B981', '#F59E0B', '#94A3B8'];

export default function AdminDashboard({ stats, detailedStats, loading, fetchData, setShowGlobalSearch, t }) {
  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header with Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl lg:text-2xl font-bold text-gray-800">{t('admin.dashboard')}</h1>
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => setShowGlobalSearch && setShowGlobalSearch(true)} 
            variant="outline" 
            className="border-gray-200 text-gray-800 flex-1 sm:flex-none justify-start"
            data-testid="global-search-btn"
          >
            <Search className="w-4 h-4 mr-2" />
            <span className="text-gray-500 text-sm">Suchen...</span>
            <kbd className="hidden sm:inline ml-2 px-1.5 py-0.5 text-xs bg-white/10 rounded">/</kbd>
          </Button>
          <Button onClick={fetchData} variant="outline" className="border-gray-200 text-gray-800 px-3" data-testid="refresh-btn">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>
      
      {/* Quick Actions Bar */}
      <AdminQuickActions onRefresh={fetchData} stats={stats} />
      
      {/* Live Widgets */}
      <AdminLiveWidgets stats={stats} detailedStats={detailedStats} />
      
      {/* Summary Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#7C3AED]/20 flex items-center justify-center">
                <Users className="w-6 h-6 text-[#7C3AED]" />
              </div>
              <div>
                <p className="text-[#94A3B8] text-sm">{t('admin.totalUsers')}</p>
                <p className="text-2xl font-bold text-white">{stats.total_users}</p>
              </div>
            </div>
          </div>
          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#06B6D4]/20 flex items-center justify-center">
                <Gavel className="w-6 h-6 text-[#06B6D4]" />
              </div>
              <div>
                <p className="text-[#94A3B8] text-sm">{t('admin.activeAuctions')}</p>
                <p className="text-2xl font-bold text-white">{stats.active_auctions}</p>
              </div>
            </div>
          </div>
          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#10B981]/20 flex items-center justify-center">
                <Package className="w-6 h-6 text-[#10B981]" />
              </div>
              <div>
                <p className="text-[#94A3B8] text-sm">{t('admin.totalProducts')}</p>
                <p className="text-2xl font-bold text-white">{stats.total_products}</p>
              </div>
            </div>
          </div>
          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#F59E0B]/20 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-[#F59E0B]" />
              </div>
              <div>
                <p className="text-[#94A3B8] text-sm">{t('admin.transactions')}</p>
                <p className="text-2xl font-bold text-white">{stats.completed_transactions}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts Section */}
      {detailedStats && (
        <>
          {/* Revenue & Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="glass-card rounded-xl p-6 border-l-4 border-[#10B981]">
              <p className="text-[#94A3B8] text-sm mb-1">Gesamtumsatz</p>
              <p className="text-3xl font-bold text-[#10B981]">€{detailedStats.summary?.total_revenue?.toFixed(2) || '0.00'}</p>
            </div>
            <div className="glass-card rounded-xl p-6 border-l-4 border-[#FFD700]">
              <p className="text-[#94A3B8] text-sm mb-1">Verkaufte Gebote</p>
              <p className="text-3xl font-bold text-[#FFD700]">{detailedStats.summary?.total_bids_sold || 0}</p>
            </div>
            <div className="glass-card rounded-xl p-6 border-l-4 border-[#06B6D4]">
              <p className="text-[#94A3B8] text-sm mb-1">Platzierte Gebote</p>
              <p className="text-3xl font-bold text-[#06B6D4]">{detailedStats.summary?.total_bids_placed || 0}</p>
            </div>
            <div className="glass-card rounded-xl p-6 border-l-4 border-[#7C3AED]">
              <p className="text-[#94A3B8] text-sm mb-1">Ø Gebote/Auktion</p>
              <p className="text-3xl font-bold text-[#7C3AED]">{detailedStats.summary?.avg_bids_per_auction || 0}</p>
            </div>
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Chart */}
            <div className="glass-card rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#10B981]" />
                Umsatz (7 Tage)
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={detailedStats.charts?.revenue_by_day || []}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS.success} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={CHART_COLORS.success} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" stroke="#94A3B8" fontSize={12} />
                    <YAxis stroke="#94A3B8" fontSize={12} tickFormatter={(v) => `€${v}`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#181824', border: '1px solid #374151', borderRadius: '8px' }}
                      labelStyle={{ color: '#fff' }}
                      formatter={(value) => [`€${value.toFixed(2)}`, 'Umsatz']}
                    />
                    <Area type="monotone" dataKey="revenue" stroke={CHART_COLORS.success} fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bids Chart */}
            <div className="glass-card rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#FFD700]" />
                Gebote (7 Tage)
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={detailedStats.charts?.bids_by_day || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" stroke="#94A3B8" fontSize={12} />
                    <YAxis stroke="#94A3B8" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#181824', border: '1px solid #374151', borderRadius: '8px' }}
                      labelStyle={{ color: '#fff' }}
                      formatter={(value) => [value, 'Gebote']}
                    />
                    <Bar dataKey="bids" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* New Users Chart */}
            <div className="glass-card rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-[#7C3AED]" />
                Neue Nutzer (7 Tage)
              </h3>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={detailedStats.charts?.users_by_day || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} />
                    <YAxis stroke="#94A3B8" fontSize={11} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#181824', border: '1px solid #374151', borderRadius: '8px' }}
                      labelStyle={{ color: '#fff' }}
                      formatter={(value) => [value, 'Nutzer']}
                    />
                    <Line type="monotone" dataKey="users" stroke={CHART_COLORS.purple} strokeWidth={2} dot={{ fill: CHART_COLORS.purple, strokeWidth: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Auction Status Pie Chart */}
            <div className="glass-card rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Gavel className="w-5 h-5 text-[#06B6D4]" />
                Auktionsstatus
              </h3>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Aktiv', value: detailedStats.charts?.status_distribution?.active || 0 },
                        { name: 'Geplant', value: detailedStats.charts?.status_distribution?.scheduled || 0 },
                        { name: 'Beendet', value: detailedStats.charts?.status_distribution?.ended || 0 }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {[0, 1, 2].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#181824', border: '1px solid #374151', borderRadius: '8px' }}
                      formatter={(value, name) => [value, name]}
                    />
                    <Legend 
                      formatter={(value) => <span className="text-[#94A3B8]">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Products */}
            <div className="glass-card rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-[#F59E0B]" />
                Top Produkte
              </h3>
              <div className="space-y-3">
                {(detailedStats.charts?.top_products || []).map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-[#181824]">
                    <div className="flex items-center gap-2">
                      <span className="text-[#FFD700] font-bold text-sm">#{index + 1}</span>
                      <span className="text-white text-sm truncate max-w-[140px]">{product.name}</span>
                    </div>
                    <span className="text-[#06B6D4] font-mono text-sm">{product.bids} Gebote</span>
                  </div>
                ))}
                {(!detailedStats.charts?.top_products || detailedStats.charts.top_products.length === 0) && (
                  <p className="text-[#94A3B8] text-center py-4">Noch keine Daten</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {loading && !stats && (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 text-[#7C3AED] animate-spin" />
        </div>
      )}
    </div>
  );
}
