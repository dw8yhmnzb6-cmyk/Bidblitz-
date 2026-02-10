import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Mail, ArrowLeft, CheckCircle, Key, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// ForgotPassword translations
const forgotPasswordTexts = {
  de: {
    backToLogin: 'Zurück zur Anmeldung',
    passwordChanged: 'Passwort geändert!',
    passwordChangedDesc: 'Ihr Passwort wurde erfolgreich zurückgesetzt. Sie können sich jetzt mit Ihrem neuen Passwort anmelden.',
    toLogin: 'Zur Anmeldung',
    forgotPassword: 'Passwort vergessen?',
    enterEmail: 'Geben Sie Ihre E-Mail-Adresse ein und wir senden Ihnen einen Code zum Zurücksetzen.',
    email: 'E-Mail-Adresse',
    emailPlaceholder: 'ihre@email.de',
    sendCode: 'Reset-Code senden',
    codeSent: 'Reset-Code wurde an Ihre E-Mail gesendet',
    sendError: 'Fehler beim Senden des Reset-Codes',
    enterCode: 'Code eingeben',
    codeSentTo: 'Wir haben einen 6-stelligen Code an',
    sent: 'gesendet.',
    resetCode: 'Reset-Code',
    verifyCode: 'Code verifizieren',
    codeVerified: 'Code verifiziert',
    invalidCode: 'Ungültiger Code',
    useOtherEmail: 'Anderen E-Mail verwenden',
    newPassword: 'Neues Passwort',
    enterNewPassword: 'Geben Sie Ihr neues Passwort ein.',
    minChars: 'Mindestens 6 Zeichen',
    confirmPassword: 'Passwort bestätigen',
    repeatPassword: 'Passwort wiederholen',
    changePassword: 'Passwort ändern',
    passwordMismatch: 'Passwörter stimmen nicht überein',
    passwordTooShort: 'Passwort muss mindestens 6 Zeichen lang sein',
    passwordSuccess: 'Passwort erfolgreich geändert!',
    resetError: 'Fehler beim Zurücksetzen des Passworts'
  },
  en: {
    backToLogin: 'Back to Login',
    passwordChanged: 'Password Changed!',
    passwordChangedDesc: 'Your password has been successfully reset. You can now log in with your new password.',
    toLogin: 'Go to Login',
    forgotPassword: 'Forgot Password?',
    enterEmail: 'Enter your email address and we will send you a reset code.',
    email: 'Email Address',
    emailPlaceholder: 'your@email.com',
    sendCode: 'Send Reset Code',
    codeSent: 'Reset code has been sent to your email',
    sendError: 'Error sending reset code',
    enterCode: 'Enter Code',
    codeSentTo: 'We sent a 6-digit code to',
    sent: '',
    resetCode: 'Reset Code',
    verifyCode: 'Verify Code',
    codeVerified: 'Code verified',
    invalidCode: 'Invalid code',
    useOtherEmail: 'Use different email',
    newPassword: 'New Password',
    enterNewPassword: 'Enter your new password.',
    minChars: 'Minimum 6 characters',
    confirmPassword: 'Confirm Password',
    repeatPassword: 'Repeat password',
    changePassword: 'Change Password',
    passwordMismatch: 'Passwords do not match',
    passwordTooShort: 'Password must be at least 6 characters',
    passwordSuccess: 'Password changed successfully!',
    resetError: 'Error resetting password'
  },
  sq: {
    backToLogin: 'Kthehu në Hyrje',
    passwordChanged: 'Fjalëkalimi u Ndryshua!',
    passwordChangedDesc: 'Fjalëkalimi juaj u rivendos me sukses. Tani mund të hyni me fjalëkalimin e ri.',
    toLogin: 'Shko në Hyrje',
    forgotPassword: 'Harruat Fjalëkalimin?',
    enterEmail: 'Vendosni adresën tuaj të email-it dhe do t\'ju dërgojmë një kod rivendosjeje.',
    email: 'Adresa Email',
    emailPlaceholder: 'juaji@email.com',
    sendCode: 'Dërgo Kodin',
    codeSent: 'Kodi i rivendosjes u dërgua në email-in tuaj',
    sendError: 'Gabim në dërgimin e kodit',
    enterCode: 'Vendos Kodin',
    codeSentTo: 'Dërguam një kod 6-shifror te',
    sent: '',
    resetCode: 'Kodi i Rivendosjes',
    verifyCode: 'Verifiko Kodin',
    codeVerified: 'Kodi u verifikua',
    invalidCode: 'Kod i pavlefshëm',
    useOtherEmail: 'Përdor email tjetër',
    newPassword: 'Fjalëkalimi i Ri',
    enterNewPassword: 'Vendosni fjalëkalimin e ri.',
    minChars: 'Minimum 6 karaktere',
    confirmPassword: 'Konfirmo Fjalëkalimin',
    repeatPassword: 'Përsërit fjalëkalimin',
    changePassword: 'Ndrysho Fjalëkalimin',
    passwordMismatch: 'Fjalëkalimet nuk përputhen',
    passwordTooShort: 'Fjalëkalimi duhet të ketë së paku 6 karaktere',
    passwordSuccess: 'Fjalëkalimi u ndryshua me sukses!',
    resetError: 'Gabim në rivendosjen e fjalëkalimit'
  },
  xk: {
    backToLogin: 'Kthehu në Hyrje',
    passwordChanged: 'Fjalëkalimi u Ndryshua!',
    passwordChangedDesc: 'Fjalëkalimi juaj u rivendos me sukses. Tani mund të hyni me fjalëkalimin e ri.',
    toLogin: 'Shko në Hyrje',
    forgotPassword: 'Harruat Fjalëkalimin?',
    enterEmail: 'Vendosni adresën tuaj të email-it dhe do t\'ju dërgojmë një kod rivendosjeje.',
    email: 'Adresa Email',
    emailPlaceholder: 'juaji@email.com',
    sendCode: 'Dërgo Kodin',
    codeSent: 'Kodi i rivendosjes u dërgua në email-in tuaj',
    sendError: 'Gabim në dërgimin e kodit',
    enterCode: 'Vendos Kodin',
    codeSentTo: 'Dërguam një kod 6-shifror te',
    sent: '',
    resetCode: 'Kodi i Rivendosjes',
    verifyCode: 'Verifiko Kodin',
    codeVerified: 'Kodi u verifikua',
    invalidCode: 'Kod i pavlefshëm',
    useOtherEmail: 'Përdor email tjetër',
    newPassword: 'Fjalëkalimi i Ri',
    enterNewPassword: 'Vendosni fjalëkalimin e ri.',
    minChars: 'Minimum 6 karaktere',
    confirmPassword: 'Konfirmo Fjalëkalimin',
    repeatPassword: 'Përsërit fjalëkalimin',
    changePassword: 'Ndrysho Fjalëkalimin',
    passwordMismatch: 'Fjalëkalimet nuk përputhen',
    passwordTooShort: 'Fjalëkalimi duhet të ketë së paku 6 karaktere',
    passwordSuccess: 'Fjalëkalimi u ndryshua me sukses!',
    resetError: 'Gabim në rivendosjen e fjalëkalimit'
  },
  tr: {
    backToLogin: 'Girişe Dön',
    passwordChanged: 'Şifre Değiştirildi!',
    passwordChangedDesc: 'Şifreniz başarıyla sıfırlandı. Artık yeni şifrenizle giriş yapabilirsiniz.',
    toLogin: 'Girişe Git',
    forgotPassword: 'Şifremi Unuttum?',
    enterEmail: 'E-posta adresinizi girin, size bir sıfırlama kodu gönderelim.',
    email: 'E-posta Adresi',
    emailPlaceholder: 'sizin@email.com',
    sendCode: 'Kod Gönder',
    codeSent: 'Sıfırlama kodu e-postanıza gönderildi',
    sendError: 'Kod gönderme hatası',
    enterCode: 'Kod Girin',
    codeSentTo: '6 haneli bir kod gönderdik:',
    sent: '',
    resetCode: 'Sıfırlama Kodu',
    verifyCode: 'Kodu Doğrula',
    codeVerified: 'Kod doğrulandı',
    invalidCode: 'Geçersiz kod',
    useOtherEmail: 'Farklı e-posta kullan',
    newPassword: 'Yeni Şifre',
    enterNewPassword: 'Yeni şifrenizi girin.',
    minChars: 'Minimum 6 karakter',
    confirmPassword: 'Şifreyi Onayla',
    repeatPassword: 'Şifreyi tekrarla',
    changePassword: 'Şifreyi Değiştir',
    passwordMismatch: 'Şifreler uyuşmuyor',
    passwordTooShort: 'Şifre en az 6 karakter olmalıdır',
    passwordSuccess: 'Şifre başarıyla değiştirildi!',
    resetError: 'Şifre sıfırlama hatası'
  },
  fr: {
    backToLogin: 'Retour à la connexion',
    passwordChanged: 'Mot de passe modifié!',
    passwordChangedDesc: 'Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.',
    toLogin: 'Aller à la connexion',
    forgotPassword: 'Mot de passe oublié?',
    enterEmail: 'Entrez votre adresse e-mail et nous vous enverrons un code de réinitialisation.',
    email: 'Adresse e-mail',
    emailPlaceholder: 'votre@email.com',
    sendCode: 'Envoyer le code',
    codeSent: 'Le code a été envoyé à votre e-mail',
    sendError: 'Erreur d\'envoi du code',
    enterCode: 'Entrer le code',
    codeSentTo: 'Nous avons envoyé un code à 6 chiffres à',
    sent: '',
    resetCode: 'Code de réinitialisation',
    verifyCode: 'Vérifier le code',
    codeVerified: 'Code vérifié',
    invalidCode: 'Code invalide',
    useOtherEmail: 'Utiliser un autre e-mail',
    newPassword: 'Nouveau mot de passe',
    enterNewPassword: 'Entrez votre nouveau mot de passe.',
    minChars: 'Minimum 6 caractères',
    confirmPassword: 'Confirmer le mot de passe',
    repeatPassword: 'Répéter le mot de passe',
    changePassword: 'Changer le mot de passe',
    passwordMismatch: 'Les mots de passe ne correspondent pas',
    passwordTooShort: 'Le mot de passe doit contenir au moins 6 caractères',
    passwordSuccess: 'Mot de passe changé avec succès!',
    resetError: 'Erreur de réinitialisation du mot de passe'
  }
};

export default function ForgotPassword() {
  const { language } = useLanguage();
  const [step, setStep] = useState(1); // 1: Email, 2: Code, 3: New Password
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const t = forgotPasswordTexts[language] || forgotPasswordTexts.de;

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API}/auth/forgot-password`, { email });
      toast.success(t.codeSent);
      setStep(2);
    } catch (error) {
      toast.error(error.response?.data?.detail || t.sendError);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API}/auth/verify-reset-code`, { email, code });
      toast.success(t.codeVerified);
      setStep(3);
    } catch (error) {
      toast.error(error.response?.data?.detail || t.invalidCode);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error(t.passwordMismatch);
      return;
    }

    if (newPassword.length < 6) {
      toast.error(t.passwordTooShort);
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API}/auth/reset-password`, { 
        email, 
        code, 
        new_password: newPassword 
      });
      setSuccess(true);
      toast.success(t.passwordSuccess);
    } catch (error) {
      toast.error(error.response?.data?.detail || t.resetError);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-4 flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="glass-card rounded-2xl p-8 text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-[#10B981]/20 flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 text-[#10B981]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">{t.passwordChanged}</h1>
              <p className="text-gray-500">{t.passwordChangedDesc}</p>
            </div>
            <Link to="/login">
              <Button className="w-full btn-primary">{t.toLogin}</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 flex items-center justify-center" data-testid="forgot-password-page">
      <div className="w-full max-w-md">
        <Link to="/login" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-800 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          {t.backToLogin}
        </Link>

        <div className="glass-card rounded-2xl p-8 space-y-6">
          {/* Progress */}
          <div className="flex items-center justify-center gap-2 mb-4">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`w-3 h-3 rounded-full transition-colors ${
                  s === step ? 'bg-[#FFD700]' : s < step ? 'bg-[#10B981]' : 'bg-white/20'
                }`}
              />
            ))}
          </div>

          {/* Step 1: Email */}
          {step === 1 && (
            <>
              <div className="text-center">
                <div className="w-16 h-16 rounded-xl bg-[#FFD700]/20 flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-[#FFD700]" />
                </div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">{t.forgotPassword}</h1>
                <p className="text-gray-500">{t.enterEmail}</p>
              </div>

              <form onSubmit={handleRequestReset} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-gray-800">{t.email}</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.emailPlaceholder}
                    required
                    className="bg-white border-gray-200 text-gray-800 h-12"
                    data-testid="email-input"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full btn-primary h-12"
                  disabled={loading}
                  data-testid="submit-email-btn"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t.sendCode}
                </Button>
              </form>
            </>
          )}

          {/* Step 2: Code */}
          {step === 2 && (
            <>
              <div className="text-center">
                <div className="w-16 h-16 rounded-xl bg-[#7C3AED]/20 flex items-center justify-center mx-auto mb-4">
                  <Key className="w-8 h-8 text-[#7C3AED]" />
                </div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">{t.enterCode}</h1>
                <p className="text-gray-500">
                  {t.codeSentTo} <span className="text-gray-800">{email}</span> {t.sent}
                </p>
              </div>

              <form onSubmit={handleVerifyCode} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-gray-800">{t.resetCode}</Label>
                  <Input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="ABC123"
                    maxLength={6}
                    required
                    className="bg-white border-gray-200 text-gray-800 h-12 text-center text-2xl tracking-widest font-mono"
                    data-testid="code-input"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full btn-primary h-12"
                  disabled={loading}
                  data-testid="verify-code-btn"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t.verifyCode}
                </Button>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full text-gray-500 hover:text-gray-800 text-sm transition-colors"
                >
                  {t.useOtherEmail}
                </button>
              </form>
            </>
          )}

          {/* Step 3: New Password */}
          {step === 3 && (
            <>
              <div className="text-center">
                <div className="w-16 h-16 rounded-xl bg-[#10B981]/20 flex items-center justify-center mx-auto mb-4">
                  <Key className="w-8 h-8 text-[#10B981]" />
                </div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">{t.newPassword}</h1>
                <p className="text-gray-500">{t.enterNewPassword}</p>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-gray-800">{t.newPassword}</Label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t.minChars}
                    required
                    minLength={6}
                    className="bg-white border-gray-200 text-gray-800 h-12"
                    data-testid="new-password-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-800">{t.confirmPassword}</Label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t.repeatPassword}
                    required
                    className="bg-white border-gray-200 text-gray-800 h-12"
                    data-testid="confirm-password-input"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full btn-primary h-12"
                  disabled={loading}
                  data-testid="reset-password-btn"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t.changePassword}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
