/**
 * Auth Callback Page
 * Handles OAuth callback tokens (Microsoft, Google, etc.)
 */
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshUser } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token');
      const error = searchParams.get('error');
      const isNewUser = searchParams.get('new_user') === 'true';

      if (error) {
        console.error('Auth error:', error);
        navigate('/login?error=' + error);
        return;
      }

      if (token) {
        // Store token
        localStorage.setItem('token', token);
        
        // Refresh user data
        await refreshUser();
        
        // Redirect based on new user status
        if (isNewUser) {
          navigate('/dashboard?welcome=true');
        } else {
          navigate('/dashboard');
        }
      } else {
        navigate('/login?error=no_token');
      }
    };

    handleCallback();
  }, [searchParams, navigate, refreshUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-cyan-50 to-cyan-100">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-amber-500 mx-auto mb-4" />
        <p className="text-gray-600">Anmeldung wird verarbeitet...</p>
      </div>
    </div>
  );
}
