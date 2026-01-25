// Admin Payments Tab Component
import { DollarSign, CheckCircle, Zap, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';

export default function AdminPayments({ payments, fetchData }) {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Zahlungsübersicht</h1>
          <p className="text-[#94A3B8]">Alle Transaktionen im Überblick</p>
        </div>
        <Button onClick={fetchData} variant="outline" className="border-white/10 text-white">
          <RefreshCw className="w-4 h-4 mr-2" />Aktualisieren
        </Button>
      </div>

      {/* Payment Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#10B981]/20 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-[#10B981]" />
            </div>
            <div>
              <p className="text-[#94A3B8] text-sm">Umsatz gesamt</p>
              <p className="text-2xl font-bold text-white">€{(payments || []).reduce((sum, p) => sum + (p.amount || 0), 0).toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#7C3AED]/20 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-[#7C3AED]" />
            </div>
            <div>
              <p className="text-[#94A3B8] text-sm">Transaktionen</p>
              <p className="text-2xl font-bold text-white">{(payments || []).length}</p>
            </div>
          </div>
        </div>
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#FFD700]/20 flex items-center justify-center">
              <Zap className="w-6 h-6 text-[#FFD700]" />
            </div>
            <div>
              <p className="text-[#94A3B8] text-sm">Gebote verkauft</p>
              <p className="text-2xl font-bold text-white">{(payments || []).reduce((sum, p) => sum + (p.bids || 0), 0)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#181824]">
              <tr>
                <th className="px-6 py-4 text-left text-[#94A3B8] font-medium">Datum</th>
                <th className="px-6 py-4 text-left text-[#94A3B8] font-medium">Kunde</th>
                <th className="px-6 py-4 text-left text-[#94A3B8] font-medium">Paket</th>
                <th className="px-6 py-4 text-left text-[#94A3B8] font-medium">Gebote</th>
                <th className="px-6 py-4 text-left text-[#94A3B8] font-medium">Betrag</th>
                <th className="px-6 py-4 text-left text-[#94A3B8] font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {(payments || []).map((payment, index) => (
                <tr key={index} className="hover:bg-white/5">
                  <td className="px-6 py-4 text-white">
                    {new Date(payment.created_at).toLocaleString('de-DE', {dateStyle: 'short', timeStyle: 'short'})}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-white">{payment.user_name || 'N/A'}</p>
                    <p className="text-[#94A3B8] text-sm">{payment.user_email}</p>
                  </td>
                  <td className="px-6 py-4 text-white">{payment.package_name}</td>
                  <td className="px-6 py-4 text-[#FFD700] font-bold">{payment.bids}</td>
                  <td className="px-6 py-4 text-[#10B981] font-mono font-bold">€{payment.amount?.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      payment.status === 'paid' ? 'bg-[#10B981]/20 text-[#10B981]' :
                      payment.status === 'pending' ? 'bg-[#F59E0B]/20 text-[#F59E0B]' :
                      'bg-[#EF4444]/20 text-[#EF4444]'
                    }`}>
                      {payment.status === 'paid' ? 'Bezahlt' : payment.status === 'pending' ? 'Ausstehend' : 'Fehlgeschlagen'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(payments || []).length === 0 && (
          <p className="text-center text-[#94A3B8] py-12">Noch keine Zahlungen erfasst</p>
        )}
      </div>
    </div>
  );
}
