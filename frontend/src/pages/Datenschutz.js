import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, Eye, Database, Lock, UserCheck, Mail } from 'lucide-react';

export default function Datenschutz() {
  return (
    <div className="min-h-screen pt-24 pb-12 px-4" data-testid="datenschutz-page">
      <div className="max-w-4xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-[#94A3B8] hover:text-white mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Zurück zur Startseite
        </Link>

        <div className="glass-card rounded-2xl p-8 space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-[#7C3AED]/20 flex items-center justify-center">
              <Shield className="w-7 h-7 text-[#7C3AED]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Datenschutzerklärung</h1>
              <p className="text-[#94A3B8]">Stand: Januar 2026</p>
            </div>
          </div>

          <div className="space-y-8">
            {/* Einleitung */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Eye className="w-5 h-5 text-[#FFD700]" />
                1. Datenschutz auf einen Blick
              </h2>
              <div className="text-[#94A3B8] space-y-3">
                <h3 className="font-semibold text-white">Allgemeine Hinweise</h3>
                <p>
                  Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren 
                  personenbezogenen Daten passiert, wenn Sie diese Website besuchen. Personenbezogene 
                  Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können.
                </p>
              </div>
            </section>

            {/* Datenerfassung */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-[#FFD700]" />
                2. Datenerfassung auf unserer Website
              </h2>
              <div className="text-[#94A3B8] space-y-4">
                <div>
                  <h3 className="font-semibold text-white mb-2">Wer ist verantwortlich für die Datenerfassung?</h3>
                  <p>
                    Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber. 
                    Die Kontaktdaten finden Sie im Impressum dieser Website.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">Wie erfassen wir Ihre Daten?</h3>
                  <p>
                    Ihre Daten werden zum einen dadurch erhoben, dass Sie uns diese mitteilen. 
                    Hierbei kann es sich z.B. um Daten handeln, die Sie bei der Registrierung eingeben.
                  </p>
                  <p className="mt-2">
                    Andere Daten werden automatisch beim Besuch der Website durch unsere IT-Systeme erfasst. 
                    Das sind vor allem technische Daten (z.B. Internetbrowser, Betriebssystem oder Uhrzeit 
                    des Seitenaufrufs).
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">Wofür nutzen wir Ihre Daten?</h3>
                  <p>
                    Ein Teil der Daten wird erhoben, um eine fehlerfreie Bereitstellung der Website zu 
                    gewährleisten. Andere Daten können zur Analyse Ihres Nutzerverhaltens verwendet werden.
                  </p>
                </div>
              </div>
            </section>

            {/* Rechte */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-[#FFD700]" />
                3. Ihre Rechte
              </h2>
              <div className="text-[#94A3B8] space-y-3">
                <p>Sie haben jederzeit das Recht:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Auskunft über Ihre gespeicherten personenbezogenen Daten zu erhalten</li>
                  <li>Berichtigung unrichtiger Daten zu verlangen</li>
                  <li>Löschung Ihrer Daten zu verlangen</li>
                  <li>Einschränkung der Verarbeitung zu verlangen</li>
                  <li>Widerspruch gegen die Verarbeitung einzulegen</li>
                  <li>Datenübertragbarkeit zu verlangen</li>
                </ul>
              </div>
            </section>

            {/* SSL */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-[#FFD700]" />
                4. SSL-Verschlüsselung
              </h2>
              <p className="text-[#94A3B8]">
                Diese Seite nutzt aus Sicherheitsgründen und zum Schutz der Übertragung vertraulicher 
                Inhalte eine SSL-Verschlüsselung. Eine verschlüsselte Verbindung erkennen Sie daran, 
                dass die Adresszeile des Browsers von "http://" auf "https://" wechselt und an dem 
                Schloss-Symbol in Ihrer Browserzeile.
              </p>
            </section>

            {/* Cookies */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white">5. Cookies</h2>
              <div className="text-[#94A3B8] space-y-3">
                <p>
                  Unsere Website verwendet Cookies. Das sind kleine Textdateien, die Ihr Webbrowser 
                  auf Ihrem Endgerät speichert. Cookies helfen uns dabei, unser Angebot 
                  nutzerfreundlicher, effektiver und sicherer zu machen.
                </p>
                <p>
                  Einige Cookies sind "Session-Cookies". Solche Cookies werden nach Ende Ihrer 
                  Browser-Sitzung von selbst gelöscht. Hingegen bleiben andere Cookies auf Ihrem 
                  Endgerät bestehen, bis Sie diese selbst löschen.
                </p>
              </div>
            </section>

            {/* Zahlungsanbieter */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white">6. Zahlungsanbieter</h2>
              <div className="text-[#94A3B8] space-y-3">
                <h3 className="font-semibold text-white">Stripe</h3>
                <p>
                  Wir nutzen den Zahlungsdienstleister Stripe. Anbieter ist die Stripe Payments Europe, 
                  Ltd., 1 Grand Canal Street Lower, Grand Canal Dock, Dublin, Irland.
                </p>
                <p>
                  Bei Zahlung via Stripe werden die von Ihnen eingegebenen Zahlungsdaten an Stripe 
                  übermittelt. Die Übermittlung Ihrer Daten an Stripe erfolgt auf Grundlage von 
                  Art. 6 Abs. 1 lit. a DSGVO (Einwilligung) und Art. 6 Abs. 1 lit. b DSGVO 
                  (Verarbeitung zur Erfüllung eines Vertrags).
                </p>
              </div>
            </section>

            {/* Kontakt */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Mail className="w-5 h-5 text-[#FFD700]" />
                7. Kontakt zum Datenschutzbeauftragten
              </h2>
              <div className="text-[#94A3B8]">
                <p>Bei Fragen zum Datenschutz erreichen Sie uns unter:</p>
                <p className="mt-2">
                  <a href="mailto:datenschutz@bidblitz.de" className="text-[#FFD700] hover:underline">
                    datenschutz@bidblitz.de
                  </a>
                </p>
              </div>
            </section>
          </div>
        </div>

        {/* Related Links */}
        <div className="mt-8 flex flex-wrap gap-4 justify-center">
          <Link to="/impressum" className="text-[#94A3B8] hover:text-[#FFD700] transition-colors">
            Impressum
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
