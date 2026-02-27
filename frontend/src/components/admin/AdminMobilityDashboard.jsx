/**
 * BidBlitz Mobility Admin Dashboard
 * Overview of all mobility operations across organizations
 */

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import {
  Bike, Users, Building2, Euro, TrendingUp, Clock, Battery,
  MapPin, Ticket, Activity, RefreshCw, ChevronRight, Zap,
  AlertCircle, CheckCircle, Loader2, BarChart3
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

// Stat Card Component
const StatCard = ({ title, value, subtitle, icon: Icon, color = 'blue', trend }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        {subtitle && (
          <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
        )}
        {trend && (
          <div className={`flex items-center gap-1 mt-2 text-sm ${
            trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-500'
          }`}>
            <TrendingUp className={`w-4 h-4 ${trend < 0 ? 'rotate-180' : ''}`} />
            <span>{Math.abs(trend)}% vs. letzte Woche</span>
          </div>
        )}
      </div>
      <div className={`p-3 rounded-xl bg-${color}-100 dark:bg-${color}-900/30`}>
        <Icon className={`w-6 h-6 text-${color}-600 dark:text-${color}-400`} />
      </div>
    </div>
  </div>
);

// Organization Card
const OrgCard = ({ org, onClick }) => (
  <div 
    onClick={onClick}
    className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:border-emerald-500 cursor-pointer transition-all"
  >
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
        {org.logo_url ? (
          <img src={org.logo_url} alt={org.name} className="w-8 h-8 rounded" />
        ) : (
          <Building2 className="w-6 h-6 text-emerald-600" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 dark:text-white truncate">{org.name}</h3>
        <p className="text-sm text-gray-500">{org.slug}</p>
      </div>
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        org.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
        org.status === 'suspended' ? 'bg-red-100 text-red-700' :
        'bg-yellow-100 text-yellow-700'
      }`}>
        {org.status === 'active' ? 'Aktiv' : org.status === 'suspended' ? 'Gesperrt' : org.status}
      </span>
    </div>
    <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
      <div className="text-center">
        <p className="text-lg font-bold text-gray-900 dark:text-white">{org.stats?.total_devices || 0}</p>
        <p className="text-xs text-gray-500">Geräte</p>
      </div>
      <div className="text-center">
        <p className="text-lg font-bold text-gray-900 dark:text-white">{org.stats?.total_sessions || 0}</p>
        <p className="text-xs text-gray-500">Fahrten</p>
      </div>
      <div className="text-center">
        <p className="text-lg font-bold text-emerald-600">€{((org.stats?.total_revenue_cents || 0) / 100).toFixed(0)}</p>
        <p className="text-xs text-gray-500">Umsatz</p>
      </div>
    </div>
  </div>
);

// Recent Activity Item
const ActivityItem = ({ type, title, subtitle, time, status }) => {
  const icons = {
    unlock: Bike,
    ticket: Ticket,
    device: Battery,
    user: Users
  };
  const Icon = icons[type] || Activity;
  
  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
      <div className={`p-2 rounded-lg ${
        status === 'success' ? 'bg-green-100 dark:bg-green-900/30' :
        status === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
        status === 'error' ? 'bg-red-100 dark:bg-red-900/30' :
        'bg-gray-100 dark:bg-gray-700'
      }`}>
        <Icon className={`w-4 h-4 ${
          status === 'success' ? 'text-green-600' :
          status === 'warning' ? 'text-yellow-600' :
          status === 'error' ? 'text-red-600' :
          'text-gray-600'
        }`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{title}</p>
        <p className="text-xs text-gray-500 truncate">{subtitle}</p>
      </div>
      <span className="text-xs text-gray-400 whitespace-nowrap">{time}</span>
    </div>
  );
};

export default function AdminMobilityDashboard() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [organizations, setOrganizations] = useState([]);
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  
  const fetchData = useCallback(async () => {
    try {
      // Fetch organizations
      const orgsRes = await axios.get(`${API}/organizations/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrganizations(orgsRes.data.organizations || []);
      
      // Calculate aggregated stats
      const orgs = orgsRes.data.organizations || [];
      const aggregatedStats = {
        totalOrganizations: orgs.length,
        activeOrganizations: orgs.filter(o => o.status === 'active').length,
        totalDevices: orgs.reduce((sum, o) => sum + (o.stats?.total_devices || 0), 0),
        totalSessions: orgs.reduce((sum, o) => sum + (o.stats?.total_sessions || 0), 0),
        totalRevenue: orgs.reduce((sum, o) => sum + (o.stats?.total_revenue_cents || 0), 0),
        totalUsers: orgs.reduce((sum, o) => sum + (o.stats?.total_users || 0), 0)
      };
      setStats(aggregatedStats);
      
      // Mock recent activity for now
      setRecentActivity([
        { type: 'unlock', title: 'Scooter entsperrt', subtitle: 'SCOOT-001 by user@test.com', time: 'vor 2 Min', status: 'success' },
        { type: 'ticket', title: 'Neues Ticket', subtitle: 'TKT-ABC123: Batterie leer', time: 'vor 15 Min', status: 'warning' },
        { type: 'device', title: 'Gerät hinzugefügt', subtitle: 'SCOOT-006 in Dubai Marina', time: 'vor 1 Std', status: 'success' },
      ]);
      
    } catch (error) {
      console.error('Error fetching mobility data:', error);
      toast.error('Fehler beim Laden der Daten');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Bike className="w-7 h-7 text-emerald-600" />
            Mobility Dashboard
          </h2>
          <p className="text-gray-500 mt-1">Übersicht über alle Scooter-Operationen</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Aktualisieren
        </button>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Organisationen"
          value={stats?.totalOrganizations || 0}
          subtitle={`${stats?.activeOrganizations || 0} aktiv`}
          icon={Building2}
          color="blue"
        />
        <StatCard
          title="Geräte gesamt"
          value={stats?.totalDevices || 0}
          subtitle="In allen Flotten"
          icon={Bike}
          color="emerald"
        />
        <StatCard
          title="Fahrten gesamt"
          value={stats?.totalSessions || 0}
          subtitle="Alle Zeiten"
          icon={Activity}
          color="purple"
        />
        <StatCard
          title="Umsatz gesamt"
          value={`€${((stats?.totalRevenue || 0) / 100).toFixed(2)}`}
          subtitle="Alle Organisationen"
          icon={Euro}
          color="amber"
        />
      </div>
      
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Organizations List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Organisationen</h3>
            <button className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
              Alle anzeigen <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          {organizations.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center border border-gray-200 dark:border-gray-700">
              <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">Keine Organisationen vorhanden</p>
              <button className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm">
                Erste Organisation erstellen
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {organizations.map(org => (
                <OrgCard 
                  key={org.id} 
                  org={org}
                  onClick={() => toast.info(`Details für ${org.name}`)}
                />
              ))}
            </div>
          )}
        </div>
        
        {/* Recent Activity */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Letzte Aktivitäten</h3>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            {recentActivity.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Keine Aktivitäten</p>
            ) : (
              recentActivity.map((activity, idx) => (
                <ActivityItem key={idx} {...activity} />
              ))
            )}
          </div>
          
          {/* Quick Stats */}
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-5 text-white">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Heute
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-emerald-100">Neue Fahrten</p>
              </div>
              <div>
                <p className="text-2xl font-bold">€0</p>
                <p className="text-sm text-emerald-100">Umsatz heute</p>
              </div>
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-emerald-100">Aktive Fahrten</p>
              </div>
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-emerald-100">Neue Tickets</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
