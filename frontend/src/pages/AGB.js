import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, Gavel, CreditCard, AlertTriangle, CheckCircle } from 'lucide-react';

export default function AGB() {
  return (
    <div className="min-h-screen pt-24 pb-12 px-4" data-testid="agb-page">
      <div className="max-w-4xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-[#94A3B8] hover:text-white mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Zurück zur Startseite
        </Link>

        <div className="glass-card rounded-2xl p-8 space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-[#06B6D4]/20 flex items-center justify-center">
              <FileText className="w-7 h-7 text-[#06B6D4]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Allgemeine Geschäftsbedingungen</h1>
              <p className="text-[#94A3B8]">Stand: Januar 2026</p>
            </div>
          </div>

          <div className="space-y-8">
            {/* Geltungsbereich */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-[#FFD700]" />
                § 1 Geltungsbereich
              </h2>
              <div className="text-[#94A3B8] space-y-3">
                <p>
                  (1) Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für alle Verträge, die über 
                  die Penny-Auktion-Plattform BidBlitz zwischen der BidBlitz GmbH (nachfolgend "Anbieter") 
                  und dem Nutzer (nachfolgend "Kunde") geschlossen werden.
                </p>
                <p>
                  (2) Abweichende Bedingungen des Kunden werden nicht anerkannt, es sei denn, der 
                  Anbieter stimmt ihrer Geltung ausdrücklich schriftlich zu.
                </p>
              </div>
            </section>

            {/* Vertragsgegenstand */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Gavel className="w-5 h-5 text-[#FFD700]" />
                § 2 Vertragsgegenstand / Funktionsweise der Auktionen
              </h2>
              <div className="text-[#94A3B8] space-y-3">
                <p>
                  (1) Der Anbieter betreibt eine Penny-Auktion-Plattform, bei der Produkte versteigert werden.
                </p>
                <p>
                  (2) Bei einer Penny-Auktion erhöht jedes abgegebene Gebot den Preis des Produkts um 
                  einen festgelegten Betrag (z.B. 0,01 € bis 0,15 €). Gleichzeitig wird der Countdown-Timer 
                  zurückgesetzt oder um eine bestimmte Zeit verlängert.
                </p>
                <p>
                  (3) Der Kunde, der das letzte Gebot vor Ablauf des Countdowns abgegeben hat, gewinnt 
                  die Auktion und ist berechtigt, das Produkt zum erreichten Auktionspreis zu erwerben.
                </p>
                <p>
                  (4) Für die Abgabe von Geboten benötigt der Kunde Gebotspunkte, die vorab erworben werden müssen.
                </p>
              </div>
            </section>

            {/* Gebotspakete */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#FFD700]" />
                § 3 Gebotspakete / Preise
              </h2>
              <div className="text-[#94A3B8] space-y-3">
                <p>
                  (1) Gebotspakete können über die Plattform erworben werden. Die aktuellen Preise 
                  sind auf der Website ersichtlich.
                </p>
                <p>
                  (2) Alle angegebenen Preise verstehen sich inklusive der gesetzlichen Mehrwertsteuer.
                </p>
                <p>
                  (3) Erworbene Gebote sind nicht erstattungsfähig und nicht auf andere Nutzer übertragbar.
                </p>
                <p>
                  (4) Bei jedem abgegebenen Gebot wird dem Konto des Nutzers ein Gebot abgezogen.
                </p>
              </div>
            </section>

            {/* Registrierung */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white">§ 4 Registrierung / Nutzerkonto</h2>
              <div className="text-[#94A3B8] space-y-3">
                <p>
                  (1) Für die Teilnahme an Auktionen ist eine Registrierung erforderlich. Der Kunde 
                  muss wahrheitsgemäße Angaben machen.
                </p>
                <p>
                  (2) Das Nutzerkonto ist nicht übertragbar. Der Kunde ist verpflichtet, seine 
                  Zugangsdaten geheim zu halten.
                </p>
                <p>
                  (3) Der Anbieter behält sich das Recht vor, Nutzerkonten bei Verstoß gegen diese 
                  AGB zu sperren oder zu löschen.
                </p>
              </div>
            </section>

            {/* Gewinn */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white">§ 5 Auktionsgewinn / Zahlung</h2>
              <div className="text-[#94A3B8] space-y-3">
                <p>
                  (1) Der Gewinner einer Auktion wird per E-Mail benachrichtigt und ist verpflichtet, 
                  den Auktionspreis innerhalb von 7 Tagen zu bezahlen.
                </p>
                <p>
                  (2) Nach Zahlungseingang wird das gewonnene Produkt an die vom Kunden angegebene 
                  Lieferadresse versandt.
                </p>
                <p>
                  (3) Erfolgt keine Zahlung innerhalb der Frist, verfällt der Anspruch auf das Produkt.
                </p>
              </div>
            </section>

            {/* Widerrufsrecht */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-[#FF4D4D]" />
                § 6 Widerrufsrecht
              </h2>
              <div className="text-[#94A3B8] space-y-3">
                <div className="p-4 rounded-lg bg-[#FF4D4D]/10 border border-[#FF4D4D]/30">
                  <p className="font-semibold text-white mb-2">Wichtiger Hinweis:</p>
                  <p>
                    Das Widerrufsrecht für den Kauf von Gebotspaketen erlischt vorzeitig, wenn der 
                    Kunde vor Ablauf der Widerrufsfrist mit dem Einsatz der Gebote begonnen hat und 
                    der Anbieter den Kunden vor Vertragsschluss auf diesen Umstand hingewiesen hat.
                  </p>
                </div>
                <p>
                  Für gewonnene Produkte gilt das gesetzliche Widerrufsrecht von 14 Tagen.
                </p>
              </div>
            </section>

            {/* Haftung */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white">§ 7 Haftung</h2>
              <div className="text-[#94A3B8] space-y-3">
                <p>
                  (1) Der Anbieter haftet unbeschränkt für Vorsatz und grobe Fahrlässigkeit.
                </p>
                <p>
                  (2) Für leichte Fahrlässigkeit haftet der Anbieter nur bei Verletzung wesentlicher 
                  Vertragspflichten.
                </p>
                <p>
                  (3) Der Anbieter haftet nicht für technische Störungen, die außerhalb seines 
                  Einflussbereichs liegen.
                </p>
              </div>
            </section>

            {/* Schlussbestimmungen */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white">§ 8 Schlussbestimmungen</h2>
              <div className="text-[#94A3B8] space-y-3">
                <p>
                  (1) Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des 
                  UN-Kaufrechts.
                </p>
                <p>
                  (2) Gerichtsstand ist Berlin, sofern der Kunde Kaufmann ist oder keinen allgemeinen 
                  Gerichtsstand in Deutschland hat.
                </p>
                <p>
                  (3) Sollten einzelne Bestimmungen dieser AGB unwirksam sein, bleibt die Wirksamkeit 
                  der übrigen Bestimmungen unberührt.
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
          <Link to="/datenschutz" className="text-[#94A3B8] hover:text-[#FFD700] transition-colors">
            Datenschutz
          </Link>
        </div>
      </div>
    </div>
  );
}
