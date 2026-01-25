import { useState } from 'react';
import { Building2, Phone, Mail, Globe, Package, MessageSquare, CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

export default function WholesaleApply() {
  const [formData, setFormData] = useState({
    company_name: '',
    contact_name: '',
    email: '',
    phone: '',
    website: '',
    expected_volume: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.company_name || !formData.contact_name || !formData.email || !formData.phone || !formData.expected_volume) {
      toast.error('Bitte füllen Sie alle Pflichtfelder aus');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API}/api/wholesale/apply`, formData);
      setSubmitted(true);
      toast.success('Bewerbung erfolgreich eingereicht!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Fehler beim Einreichen');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#050509] py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Bewerbung eingereicht!</h1>
          <p className="text-gray-400 mb-8">
            Vielen Dank für Ihre Bewerbung als Großkunde. Unser Team wird Ihre Anfrage 
            innerhalb von 24-48 Stunden prüfen und sich bei Ihnen melden.
          </p>
          <Button 
            onClick={() => window.location.href = '/'}
            className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-black"
          >
            Zurück zur Startseite
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050509] py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FFD700]/10 text-[#FFD700] text-sm mb-6">
            <Building2 className="w-4 h-4" />
            B2B Großkundenbereich
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Werden Sie <span className="text-[#FFD700]">Großkunde</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Profitieren Sie von exklusiven Rabatten, persönlicher Betreuung und 
            flexiblen Zahlungsbedingungen für Ihr Unternehmen.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {[
            { icon: Package, title: 'Mengenrabatte', desc: 'Bis zu 25% Rabatt auf alle Gebotspakete' },
            { icon: Mail, title: 'Persönlicher Kontakt', desc: 'Ihr dedizierter Ansprechpartner' },
            { icon: Globe, title: 'Flexible Zahlung', desc: 'Kauf auf Rechnung möglich' }
          ].map((benefit, i) => (
            <div key={i} className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FFD700]/20 to-[#FF4D4D]/20 flex items-center justify-center mb-4">
                <benefit.icon className="w-6 h-6 text-[#FFD700]" />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">{benefit.title}</h3>
              <p className="text-gray-400 text-sm">{benefit.desc}</p>
            </div>
          ))}
        </div>

        {/* Application Form */}
        <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <Building2 className="w-6 h-6 text-[#FFD700]" />
            Bewerbung als Großkunde
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Company Name */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Firmenname *</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <Input
                    value={formData.company_name}
                    onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                    placeholder="Ihre Firma GmbH"
                    className="pl-10 bg-white/5 border-white/10 text-white"
                    required
                  />
                </div>
              </div>

              {/* Contact Name */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Ansprechpartner *</label>
                <Input
                  value={formData.contact_name}
                  onChange={(e) => setFormData({...formData, contact_name: e.target.value})}
                  placeholder="Max Mustermann"
                  className="bg-white/5 border-white/10 text-white"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">E-Mail *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="kontakt@firma.de"
                    className="pl-10 bg-white/5 border-white/10 text-white"
                    required
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Telefon *</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="+49 123 456789"
                    className="pl-10 bg-white/5 border-white/10 text-white"
                    required
                  />
                </div>
              </div>

              {/* Website */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Website (optional)</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <Input
                    value={formData.website}
                    onChange={(e) => setFormData({...formData, website: e.target.value})}
                    placeholder="https://www.firma.de"
                    className="pl-10 bg-white/5 border-white/10 text-white"
                  />
                </div>
              </div>

              {/* Expected Volume */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Erwartetes monatliches Volumen *</label>
                <select
                  value={formData.expected_volume}
                  onChange={(e) => setFormData({...formData, expected_volume: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#FFD700]"
                  required
                >
                  <option value="" className="bg-[#0a0a0f]">Bitte wählen...</option>
                  <option value="500-1000" className="bg-[#0a0a0f]">500 - 1.000 Gebote</option>
                  <option value="1000-2500" className="bg-[#0a0a0f]">1.000 - 2.500 Gebote</option>
                  <option value="2500-5000" className="bg-[#0a0a0f]">2.500 - 5.000 Gebote</option>
                  <option value="5000-10000" className="bg-[#0a0a0f]">5.000 - 10.000 Gebote</option>
                  <option value="10000+" className="bg-[#0a0a0f]">Mehr als 10.000 Gebote</option>
                </select>
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Nachricht (optional)</label>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  placeholder="Erzählen Sie uns mehr über Ihre Anforderungen..."
                  rows={4}
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[#FFD700] resize-none"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-black font-semibold py-6 text-lg hover:opacity-90"
            >
              {loading ? (
                'Wird gesendet...'
              ) : (
                <>
                  Bewerbung absenden
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
