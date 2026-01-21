import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Building2, Loader2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Impressum() {
  const { t } = useLanguage();
  const [pageContent, setPageContent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const res = await axios.get(`${API}/pages/impressum`);
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
              <h1 className="text-3xl font-bold text-white">{pageContent?.title || 'Impressum'}</h1>
              <p className="text-[#94A3B8]">Angaben gemäß § 5 TMG</p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-[#FFD700] animate-spin" />
            </div>
          ) : pageContent?.content ? (
            <div 
              className="prose prose-invert max-w-none prose-headings:text-white prose-p:text-[#94A3B8] prose-a:text-[#FFD700] prose-strong:text-white"
              dangerouslySetInnerHTML={{ __html: pageContent.content }}
            />
          ) : (
            /* Fallback to hardcoded content if API fails */
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
                <p className="text-[#94A3B8]">E-Mail: info@bidblitz.de</p>
              </section>
            </div>
          )}
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
