import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Shield, Loader2 } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Datenschutz() {
  const [pageContent, setPageContent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const res = await axios.get(`${API}/pages/datenschutz`);
        setPageContent(res.data);
      } catch (error) {
        console.error('Failed to load page content:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, []);

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
              <h1 className="text-3xl font-bold text-white">{pageContent?.title || 'Datenschutzerklärung'}</h1>
              <p className="text-[#94A3B8]">Stand: Januar 2026</p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-[#7C3AED] animate-spin" />
            </div>
          ) : pageContent?.content ? (
            <div 
              className="prose prose-invert max-w-none prose-headings:text-white prose-p:text-[#94A3B8] prose-a:text-[#FFD700] prose-strong:text-white prose-li:text-[#94A3B8]"
              dangerouslySetInnerHTML={{ __html: pageContent.content }}
            />
          ) : (
            /* Fallback content */
            <div className="space-y-6 text-[#94A3B8]">
              <section className="space-y-3">
                <h2 className="text-xl font-bold text-white">1. Datenschutz auf einen Blick</h2>
                <p>
                  Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren 
                  personenbezogenen Daten passiert, wenn Sie diese Website besuchen.
                </p>
              </section>
              <section className="space-y-3">
                <h2 className="text-xl font-bold text-white">2. Ihre Rechte</h2>
                <p>
                  Sie haben jederzeit das Recht auf Auskunft, Berichtigung und Löschung Ihrer Daten.
                </p>
              </section>
            </div>
          )}
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
