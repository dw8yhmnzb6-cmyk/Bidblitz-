/**
 * Credit KYC Verification Page - Upload documents for loan eligibility
 * Required: 3 pay slips + ID front/back + Selfie with ID
 */
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import {
  Upload, FileText, Camera, CreditCard, CheckCircle, Clock,
  XCircle, AlertCircle, Loader2, ArrowLeft, Shield, ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

const DOC_CONFIG = [
  { key: 'payslip_1', label: 'Lohnabrechnung 1', desc: 'Letzte Monatsabrechnung', icon: FileText, color: 'bg-blue-50 text-blue-600' },
  { key: 'payslip_2', label: 'Lohnabrechnung 2', desc: 'Vorletzte Monatsabrechnung', icon: FileText, color: 'bg-blue-50 text-blue-600' },
  { key: 'payslip_3', label: 'Lohnabrechnung 3', desc: 'Drittletzte Monatsabrechnung', icon: FileText, color: 'bg-blue-50 text-blue-600' },
  { key: 'id_front', label: 'Ausweis Vorderseite', desc: 'Personalausweis oder Reisepass', icon: CreditCard, color: 'bg-emerald-50 text-emerald-600' },
  { key: 'id_back', label: 'Ausweis Rückseite', desc: 'Rückseite des Ausweises', icon: CreditCard, color: 'bg-emerald-50 text-emerald-600' },
  { key: 'selfie', label: 'Selfie mit Ausweis', desc: 'Foto von Ihnen mit Ausweis in der Hand', icon: Camera, color: 'bg-violet-50 text-violet-600' },
];

const STATUS_MAP = {
  not_started: { label: 'Nicht gestartet', color: 'text-slate-500', icon: AlertCircle },
  incomplete: { label: 'Unvollständig', color: 'text-amber-500', icon: Clock },
  submitted: { label: 'Eingereicht', color: 'text-blue-500', icon: Clock },
  approved: { label: 'Genehmigt', color: 'text-emerald-500', icon: CheckCircle },
  rejected: { label: 'Abgelehnt', color: 'text-red-500', icon: XCircle },
};

export default function CreditKYCPage() {
  const { token } = useAuth();
  const [status, setStatus] = useState(null);
  const [uploading, setUploading] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef(null);
  const [currentDocType, setCurrentDocType] = useState(null);

  const fetchStatus = async () => {
    try {
      const res = await axios.get(`${API}/credit-kyc/status`, { headers: { Authorization: `Bearer ${token}` } });
      setStatus(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (token) fetchStatus(); }, [token]);

  const handleUpload = (docType) => {
    setCurrentDocType(docType);
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !currentDocType) return;

    setUploading(currentDocType);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('doc_type', currentDocType);

    try {
      const res = await axios.post(`${API}/credit-kyc/upload-document`, formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      toast.success(res.data.message);
      fetchStatus();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Upload fehlgeschlagen');
    } finally {
      setUploading(null);
      e.target.value = '';
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await axios.post(`${API}/credit-kyc/submit`, {}, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(res.data.message);
      fetchStatus();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Fehler');
    } finally { setSubmitting(false); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>;

  const s = STATUS_MAP[status?.status || 'not_started'];
  const docs = status?.documents || {};
  const uploadedCount = status?.uploaded_count || 0;
  const allUploaded = uploadedCount === 6;

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white p-4 pb-24" data-testid="credit-kyc-page">
      <div className="max-w-lg mx-auto pt-2">
        <Link to="/loans" className="flex items-center gap-1 text-emerald-600 text-sm font-medium mb-4">
          <ArrowLeft className="w-4 h-4" /> Zurück zu Kredite
        </Link>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-bold text-slate-800">Kredit-Verifizierung</h1>
          <p className="text-sm text-slate-500 mt-1">Laden Sie Ihre Dokumente hoch</p>
        </div>

        {/* Status Banner */}
        <div className={`flex items-center gap-3 p-4 rounded-xl mb-6 ${
          status?.status === 'approved' ? 'bg-emerald-50 border border-emerald-200' :
          status?.status === 'submitted' ? 'bg-blue-50 border border-blue-200' :
          status?.status === 'rejected' ? 'bg-red-50 border border-red-200' :
          'bg-amber-50 border border-amber-200'
        }`}>
          <s.icon className={`w-6 h-6 ${s.color}`} />
          <div>
            <p className={`font-bold text-sm ${s.color}`}>{s.label}</p>
            <p className="text-xs text-slate-500">{uploadedCount}/6 Dokumente hochgeladen</p>
            {status?.rejection_reason && <p className="text-xs text-red-600 mt-1">Grund: {status.rejection_reason}</p>}
          </div>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div className="bg-emerald-500 rounded-full h-2 transition-all" style={{ width: `${(uploadedCount / 6) * 100}%` }} />
          </div>
        </div>

        {/* Hidden file input */}
        <input ref={fileInputRef} type="file" accept="image/*,.pdf" capture="environment" className="hidden" onChange={handleFileSelected} />

        {/* Document Upload List */}
        <div className="space-y-3 mb-6">
          {DOC_CONFIG.map((doc) => {
            const isUploaded = docs[doc.key];
            const isUploading = uploading === doc.key;
            const Icon = doc.icon;

            return (
              <button
                key={doc.key}
                onClick={() => handleUpload(doc.key)}
                disabled={isUploading || status?.status === 'approved'}
                className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all text-left ${
                  isUploaded ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200 hover:border-emerald-300'
                } disabled:opacity-50`}
                data-testid={`upload-${doc.key}`}
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  isUploaded ? 'bg-emerald-100' : doc.color.split(' ')[0]
                }`}>
                  {isUploading ? <Loader2 className="w-5 h-5 animate-spin text-emerald-500" /> :
                   isUploaded ? <CheckCircle className="w-5 h-5 text-emerald-500" /> :
                   <Icon className={`w-5 h-5 ${doc.color.split(' ')[1]}`} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-sm ${isUploaded ? 'text-emerald-700' : 'text-slate-800'}`}>{doc.label}</p>
                  <p className="text-xs text-slate-500">{isUploaded ? 'Hochgeladen' : doc.desc}</p>
                </div>
                {!isUploaded && <Upload className="w-4 h-4 text-slate-400 flex-shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Submit Button */}
        {allUploaded && status?.status !== 'approved' && status?.status !== 'submitted' && (
          <button onClick={handleSubmit} disabled={submitting}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
            data-testid="submit-kyc-btn">
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />}
            Zur Prüfung einreichen
          </button>
        )}

        {status?.status === 'approved' && (
          <Link to="/loans" className="block w-full py-3.5 bg-emerald-600 text-white font-bold rounded-xl text-center">
            Kredit beantragen
          </Link>
        )}
      </div>
    </div>
  );
}
