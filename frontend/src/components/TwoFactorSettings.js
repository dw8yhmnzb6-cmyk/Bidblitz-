import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Shield, ShieldCheck, ShieldOff, QrCode, Key, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const TwoFactorSettings = () => {
  const { user, token, refreshUser } = useAuth();
  const [step, setStep] = useState('initial'); // initial, setup, verify, disable
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [disablePassword, setDisablePassword] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [loading, setLoading] = useState(false);

  const is2FAEnabled = user?.two_factor_enabled;

  const startSetup = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${API}/auth/2fa/setup`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setQrCode(response.data.qr_code);
      setSecret(response.data.secret);
      setStep('setup');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Fehler beim Einrichten');
    } finally {
      setLoading(false);
    }
  };

  const enableTwoFactor = async () => {
    if (!verifyCode || verifyCode.length !== 6) {
      toast.error('Bitte geben Sie einen 6-stelligen Code ein');
      return;
    }
    
    setLoading(true);
    try {
      await axios.post(
        `${API}/auth/2fa/enable?code=${verifyCode}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('2FA erfolgreich aktiviert!');
      await refreshUser();
      setStep('initial');
      setVerifyCode('');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Ungültiger Code');
    } finally {
      setLoading(false);
    }
  };

  const disableTwoFactor = async () => {
    if (!disablePassword || !disableCode) {
      toast.error('Bitte füllen Sie alle Felder aus');
      return;
    }
    
    setLoading(true);
    try {
      await axios.post(
        `${API}/auth/2fa/disable?password=${encodeURIComponent(disablePassword)}&code=${disableCode}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('2FA deaktiviert');
      await refreshUser();
      setStep('initial');
      setDisablePassword('');
      setDisableCode('');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Fehler beim Deaktivieren');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card rounded-xl p-6" data-testid="2fa-settings">
      <div className="flex items-center gap-3 mb-6">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${is2FAEnabled ? 'bg-[#10B981]/20' : 'bg-[#F59E0B]/20'}`}>
          {is2FAEnabled ? (
            <ShieldCheck className="w-6 h-6 text-[#10B981]" />
          ) : (
            <Shield className="w-6 h-6 text-[#F59E0B]" />
          )}
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Zwei-Faktor-Authentifizierung</h3>
          <p className={`text-sm ${is2FAEnabled ? 'text-[#10B981]' : 'text-[#F59E0B]'}`}>
            {is2FAEnabled ? 'Aktiviert' : 'Nicht aktiviert'}
          </p>
        </div>
      </div>

      {step === 'initial' && (
        <>
          {is2FAEnabled ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-[#10B981]/10 border border-[#10B981]/20">
                <CheckCircle className="w-5 h-5 text-[#10B981]" />
                <span className="text-[#10B981] text-sm">Ihr Konto ist durch 2FA geschützt</span>
              </div>
              <Button
                onClick={() => setStep('disable')}
                variant="outline"
                className="w-full border-[#EF4444]/30 text-[#EF4444] hover:bg-[#EF4444]/10"
              >
                <ShieldOff className="w-4 h-4 mr-2" />
                2FA deaktivieren
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/20">
                <AlertTriangle className="w-5 h-5 text-[#F59E0B]" />
                <span className="text-[#F59E0B] text-sm">2FA erhöht die Sicherheit Ihres Kontos erheblich</span>
              </div>
              <p className="text-[#94A3B8] text-sm">
                Verwenden Sie eine Authenticator-App (Google Authenticator, Authy, etc.) um Ihr Konto zusätzlich zu schützen.
              </p>
              <Button
                onClick={startSetup}
                disabled={loading}
                className="w-full btn-primary"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <ShieldCheck className="w-4 h-4 mr-2" />
                )}
                2FA einrichten
              </Button>
            </div>
          )}
        </>
      )}

      {step === 'setup' && (
        <div className="space-y-6">
          <div className="text-center">
            <p className="text-[#94A3B8] text-sm mb-4">
              Scannen Sie den QR-Code mit Ihrer Authenticator-App
            </p>
            {qrCode && (
              <div className="inline-block p-4 bg-white rounded-xl">
                <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
              </div>
            )}
          </div>

          <div className="bg-[#181824] rounded-lg p-4">
            <p className="text-[#94A3B8] text-xs mb-2">Oder geben Sie diesen Code manuell ein:</p>
            <code className="text-[#06B6D4] text-sm font-mono break-all">{secret}</code>
          </div>

          <div className="space-y-3">
            <label className="text-white text-sm font-medium">Bestätigungscode eingeben</label>
            <Input
              type="text"
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              className="text-center text-2xl font-mono tracking-widest bg-[#181824] border-white/10 text-white"
              maxLength={6}
            />
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => setStep('initial')}
              variant="outline"
              className="flex-1 border-white/20 text-white hover:bg-white/10"
            >
              Abbrechen
            </Button>
            <Button
              onClick={enableTwoFactor}
              disabled={loading || verifyCode.length !== 6}
              className="flex-1 btn-primary"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Aktivieren'}
            </Button>
          </div>
        </div>
      )}

      {step === 'disable' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-3 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/20">
            <AlertTriangle className="w-5 h-5 text-[#EF4444]" />
            <span className="text-[#EF4444] text-sm">Das Deaktivieren von 2FA verringert die Sicherheit</span>
          </div>

          <div className="space-y-3">
            <label className="text-white text-sm font-medium">Passwort</label>
            <Input
              type="password"
              value={disablePassword}
              onChange={(e) => setDisablePassword(e.target.value)}
              placeholder="Ihr Passwort"
              className="bg-[#181824] border-white/10 text-white"
            />
          </div>

          <div className="space-y-3">
            <label className="text-white text-sm font-medium">2FA-Code</label>
            <Input
              type="text"
              value={disableCode}
              onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              className="text-center text-xl font-mono tracking-widest bg-[#181824] border-white/10 text-white"
              maxLength={6}
            />
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => setStep('initial')}
              variant="outline"
              className="flex-1 border-white/20 text-white hover:bg-white/10"
            >
              Abbrechen
            </Button>
            <Button
              onClick={disableTwoFactor}
              disabled={loading}
              className="flex-1 bg-[#EF4444] hover:bg-[#DC2626] text-white"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Deaktivieren'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
