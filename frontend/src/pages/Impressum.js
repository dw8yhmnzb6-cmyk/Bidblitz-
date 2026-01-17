import { Link } from 'react-router-dom';
import { ArrowLeft, Building2, Mail, Phone, Globe } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function Impressum() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen pt-24 pb-12 px-4" data-testid="impressum-page">
      <div className="max-w-4xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-[#94A3B8] hover:text-white mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Zurück zur Startseite
        </Link>

        <div className="glass-card rounded-2xl p-8 space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-[#FFD700]/20 flex items-center justify-center">
              <Building2 className="w-7 h-7 text-[#FFD700]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Impressum</h1>
              <p className="text-[#94A3B8]">Angaben gemäß § 5 TMG</p>
            </div>
          </div>

          <div className="space-y-6">
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white">Anbieter</h2>
              <div className="text-[#94A3B8] space-y-1">
                <p className="font-semibold text-white">BidBlitz GmbH</p>
                <p>Musterstraße 123</p>
                <p>12345 Berlin</p>
                <p>Deutschland</p>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white">Kontakt</h2>
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-[#94A3B8]">
                  <Phone className="w-5 h-5 text-[#FFD700]" />
                  <span>+49 (0) 30 123456789</span>
                </div>
                <div className="flex items-center gap-3 text-[#94A3B8]">
                  <Mail className="w-5 h-5 text-[#FFD700]" />
                  <a href="mailto:info@bidblitz.de" className="hover:text-[#FFD700] transition-colors">
                    info@bidblitz.de
                  </a>
                </div>
                <div className="flex items-center gap-3 text-[#94A3B8]">
                  <Globe className="w-5 h-5 text-[#FFD700]" />
                  <span>www.bidblitz.de</span>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white">Vertretungsberechtigte Geschäftsführer</h2>
              <p className="text-[#94A3B8]">Max Mustermann, Erika Musterfrau</p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white">Registereintrag</h2>
              <div className="text-[#94A3B8] space-y-1">
                <p>Eintragung im Handelsregister</p>
                <p>Registergericht: Amtsgericht Berlin-Charlottenburg</p>
                <p>Registernummer: HRB 123456</p>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white">Umsatzsteuer-ID</h2>
              <p className="text-[#94A3B8]">
                Umsatzsteuer-Identifikationsnummer gemäß § 27a Umsatzsteuergesetz:<br />
                DE 123456789
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white">Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
              <div className="text-[#94A3B8]">
                <p>Max Mustermann</p>
                <p>Musterstraße 123</p>
                <p>12345 Berlin</p>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white">EU-Streitschlichtung</h2>
              <p className="text-[#94A3B8]">
                Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{' '}
                <a 
                  href="https://ec.europa.eu/consumers/odr/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[#FFD700] hover:underline"
                >
                  https://ec.europa.eu/consumers/odr/
                </a>
              </p>
              <p className="text-[#94A3B8]">
                Unsere E-Mail-Adresse finden Sie oben im Impressum.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white">Verbraucherstreitbeilegung/Universalschlichtungsstelle</h2>
              <p className="text-[#94A3B8]">
                Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer 
                Verbraucherschlichtungsstelle teilzunehmen.
              </p>
            </section>
          </div>
        </div>

        {/* Related Links */}
        <div className="mt-8 flex flex-wrap gap-4 justify-center">
          <Link to="/datenschutz" className="text-[#94A3B8] hover:text-[#FFD700] transition-colors">
            Datenschutz
          </Link>
          <span className="text-[#94A3B8]">•</span>
          <Link to="/agb" className="text-[#94A3B8] hover:text-[#FFD700] transition-colors">
            AGB
          </Link>
        </div>
      </div>
    </div>
  );
}
