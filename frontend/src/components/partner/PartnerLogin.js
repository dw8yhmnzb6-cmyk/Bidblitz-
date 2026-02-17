/**
 * Partner Login Component
 * Handles partner and staff authentication
 */
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Store, Users, Eye, EyeOff, Loader2, Languages, ChevronDown } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { availableLanguages } from './partnerTranslations';

const API = process.env.REACT_APP_BACKEND_URL;

const PartnerLogin = ({ 
  onLoginSuccess, 
  language, 
  setLanguage, 
  t 
}) => {
  const [loginType, setLoginType] = useState('admin'); // 'admin' or 'staff'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

  // Check for saved login on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('partner_token');
    const savedPartner = localStorage.getItem('partner_data');
    const savedRemember = localStorage.getItem('partner_remember');
    
    if (savedToken && savedPartner && savedRemember === 'true') {
      try {
        const partnerData = JSON.parse(savedPartner);
        onLoginSuccess(savedToken, partnerData);
      } catch (e) {
        localStorage.removeItem('partner_token');
        localStorage.removeItem('partner_data');
        localStorage.removeItem('partner_remember');
      }
    }
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      toast.error(t('error'));
      return;
    }

    setLoading(true);
    try {
      const endpoint = loginType === 'admin' 
        ? `${API}/api/partner-portal/login`
        : `${API}/api/partner-portal/staff/login`;
      
      const response = await axios.post(endpoint, { email, password });
      
      if (response.data.success) {
        const { token, partner, staff } = response.data;
        const userData = partner || staff;
        
        // Save to localStorage if remember me is checked
        if (rememberMe) {
          localStorage.setItem('partner_token', token);
          localStorage.setItem('partner_data', JSON.stringify(userData));
          localStorage.setItem('partner_remember', 'true');
        }
        
        onLoginSuccess(token, userData);
        toast.success(`${t('welcome')}, ${userData.business_name || userData.name || 'Partner'}!`);
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || t('error'));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-amber-50 flex items-center justify-center p-4">
      {/* Language Switcher */}
      <div className="absolute top-4 right-4">
        <div className="relative">
          <button
            onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
            className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow-sm border hover:bg-gray-50 transition-colors"
          >
            <Languages className="w-4 h-4" />
            <span className="text-sm">
              {availableLanguages.find(l => l.code === language)?.flag || '🌐'}
            </span>
            <ChevronDown className="w-4 h-4" />
          </button>
          
          {showLanguageDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border py-2 z-50 max-h-64 overflow-y-auto">
              {availableLanguages.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code);
                    setShowLanguageDropdown(false);
                  }}
                  className={`w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 ${
                    language === lang.code ? 'bg-teal-50 text-teal-700' : ''
                  }`}
                >
                  <span>{lang.flag}</span>
                  <span className="text-sm">{lang.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-teal-500 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg mb-4">
            <Store className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Partner Portal</h1>
          <p className="text-gray-500 mt-1">BidBlitz</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Login Type Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setLoginType('admin')}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                loginType === 'admin'
                  ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Store className="w-4 h-4" />
              {t('adminLogin')}
            </button>
            <button
              onClick={() => setLoginType('staff')}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                loginType === 'staff'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Users className="w-4 h-4" />
              {t('staffLogin')}
            </button>
          </div>

          {/* Login Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('email')}
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="partner@example.com"
                data-testid="partner-login-email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('password')}
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="••••••••"
                  className="pr-10"
                  data-testid="partner-login-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
              />
              <label htmlFor="rememberMe" className="text-sm text-gray-600">
                {t('rememberMe')}
              </label>
            </div>

            <Button
              onClick={handleLogin}
              disabled={loading}
              className={`w-full py-6 text-lg font-medium ${
                loginType === 'admin'
                  ? 'bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700'
                  : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700'
              }`}
              data-testid="partner-login-submit"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t('login')}
            </Button>
          </div>

          {/* Info Text */}
          {loginType === 'staff' && (
            <p className="text-xs text-gray-500 mt-4 text-center">
              {t('counterInfo')}
            </p>
          )}

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              {t('notPartner')}{' '}
              <a href="/partner-application" className="text-teal-600 hover:text-teal-700 font-medium">
                {t('applyNow')}
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartnerLogin;
