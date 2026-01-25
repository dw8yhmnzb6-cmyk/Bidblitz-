// Admin Logs Tab Component
import { Zap, DollarSign, Users, Gavel, Ban, BarChart3, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';

export default function AdminLogs({ logs, fetchData }) {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Systemlogs</h1>
          <p className="text-[#94A3B8]">Aktivitäten und Ereignisse</p>
        </div>
        <Button onClick={fetchData} variant="outline" className="border-white/10 text-white">
          <RefreshCw className="w-4 h-4 mr-2" />Aktualisieren
        </Button>
      </div>

      {/* Log Entries */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="divide-y divide-white/10 max-h-[600px] overflow-y-auto">
          {(logs || []).map((log, index) => (
            <div key={index} className="p-4 hover:bg-white/5 transition-colors">
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  log.type === 'bid' ? 'bg-[#FFD700]/20' :
                  log.type === 'payment' ? 'bg-[#10B981]/20' :
                  log.type === 'user' ? 'bg-[#7C3AED]/20' :
                  log.type === 'auction' ? 'bg-[#06B6D4]/20' :
                  log.type === 'error' ? 'bg-[#EF4444]/20' :
                  'bg-white/10'
                }`}>
                  {log.type === 'bid' && <Zap className="w-5 h-5 text-[#FFD700]" />}
                  {log.type === 'payment' && <DollarSign className="w-5 h-5 text-[#10B981]" />}
                  {log.type === 'user' && <Users className="w-5 h-5 text-[#7C3AED]" />}
                  {log.type === 'auction' && <Gavel className="w-5 h-5 text-[#06B6D4]" />}
                  {log.type === 'error' && <Ban className="w-5 h-5 text-[#EF4444]" />}
                  {!['bid', 'payment', 'user', 'auction', 'error'].includes(log.type) && <BarChart3 className="w-5 h-5 text-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium">{log.message}</p>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-[#94A3B8] text-sm">
                      {new Date(log.timestamp).toLocaleString('de-DE', {dateStyle: 'short', timeStyle: 'medium'})}
                    </span>
                    {log.user_email && (
                      <span className="text-[#7C3AED] text-sm">{log.user_email}</span>
                    )}
                  </div>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  log.type === 'error' ? 'bg-[#EF4444]/20 text-[#EF4444]' :
                  'bg-white/10 text-[#94A3B8]'
                }`}>
                  {log.type?.toUpperCase()}
                </span>
              </div>
            </div>
          ))}
        </div>
        {(logs || []).length === 0 && (
          <p className="text-center text-[#94A3B8] py-12">Keine Logs vorhanden</p>
        )}
      </div>
    </div>
  );
}
