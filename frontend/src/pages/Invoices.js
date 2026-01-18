import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { 
  FileText, Download, Calendar, CreditCard, 
  Package, Euro, ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Invoices() {
  const { isAuthenticated, token } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      fetchInvoices();
    }
  }, [isAuthenticated]);

  const fetchInvoices = async () => {
    try {
      const response = await axios.get(`${API}/invoices`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInvoices(response.data);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadInvoice = async (invoiceId) => {
    try {
      const response = await axios.get(`${API}/invoices/${invoiceId}/download`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `BidBlitz_Rechnung_${invoiceId.substring(0, 8)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading invoice:', error);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-4 flex items-center justify-center">
        <div className="glass-card p-8 rounded-xl text-center max-w-md">
          <FileText className="w-16 h-16 text-[#FFD700] mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-4">Rechnungen</h2>
          <p className="text-[#94A3B8] mb-6">Melden Sie sich an, um Ihre Rechnungen zu sehen.</p>
          <Button className="btn-primary" onClick={() => window.location.href = '/login'}>
            Anmelden
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD700]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-4" data-testid="invoices-page">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-[#94A3B8] hover:text-white mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Zurück zum Dashboard
        </Link>

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#FFD700] to-[#FF4D4D] flex items-center justify-center">
            <FileText className="w-7 h-7 text-black" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Meine Rechnungen</h1>
            <p className="text-[#94A3B8]">Alle Ihre Käufe auf einen Blick</p>
          </div>
        </div>

        {/* Invoices List */}
        {invoices.length === 0 ? (
          <div className="glass-card p-12 rounded-xl text-center">
            <FileText className="w-16 h-16 text-[#475569] mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Keine Rechnungen vorhanden</h3>
            <p className="text-[#94A3B8] mb-6">
              Sobald Sie ein Gebotspaket kaufen, erscheint hier Ihre Rechnung.
            </p>
            <Link to="/buy-bids">
              <Button className="bg-gradient-to-r from-[#FFD700] to-[#FF4D4D] text-black font-bold">
                <Package className="w-5 h-5 mr-2" />
                Gebote kaufen
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {invoices.map((invoice) => (
              <div 
                key={invoice.id}
                className="glass-card p-5 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                data-testid={`invoice-${invoice.id}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-[#181824] flex items-center justify-center">
                    <FileText className="w-6 h-6 text-[#FFD700]" />
                  </div>
                  <div>
                    <p className="font-bold text-white">{invoice.invoice_number}</p>
                    <p className="text-[#94A3B8] text-sm flex items-center gap-2">
                      <Calendar className="w-3 h-3" />
                      {new Date(invoice.date).toLocaleDateString('de-DE')}
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-4">
                  <div className="text-center">
                    <p className="text-[#94A3B8] text-xs">Paket</p>
                    <p className="text-white font-medium">{invoice.package_name}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[#94A3B8] text-xs">Gebote</p>
                    <p className="text-[#FFD700] font-bold">{invoice.bids}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[#94A3B8] text-xs">Betrag</p>
                    <p className="text-white font-bold font-mono">€{invoice.amount?.toFixed(2)}</p>
                  </div>
                  <Button
                    onClick={() => downloadInvoice(invoice.id)}
                    variant="outline"
                    className="border-[#FFD700]/30 text-[#FFD700] hover:bg-[#FFD700]/10"
                    data-testid={`download-invoice-${invoice.id}`}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    PDF
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info */}
        <div className="glass-card p-4 rounded-xl mt-8 border border-white/10">
          <p className="text-[#94A3B8] text-sm text-center">
            Alle Preise inkl. 19% MwSt. • Rechnungen werden automatisch nach jedem Kauf erstellt
          </p>
        </div>
      </div>
    </div>
  );
}
