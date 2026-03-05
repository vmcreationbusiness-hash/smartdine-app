import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import api from '../utils/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { Settings, User, Lock, ArrowLeft, ArrowRight } from 'lucide-react';

export const ManagerLanding = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { username, password });
      const { token, user } = response.data;
      if (user.role !== 'manager') { toast.error('This portal is for Managers only'); return; }
      login(user, token);
      toast.success('Welcome to Manager Dashboard!');
      navigate('/manager/dashboard');
    } catch (error) { toast.error(error.response?.data?.error || 'Login failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in-up">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 mb-6 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors" data-testid="back-home-button">
          <ArrowLeft className="w-4 h-4" /> {t('common.back_home')}
        </button>

        <div className="glass-card rounded-3xl p-8 md:p-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-5 shadow-lg" style={{ background: `linear-gradient(135deg, ${theme.accentColor}, ${theme.primaryColor})` }}>
              <Settings className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{ color: theme.accentColor }}>{t('manager_portal.title')}</h1>
            <p className="text-gray-500">{t('manager_portal.desc')}</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <Label className="font-semibold text-sm">{t('auth.username')}</Label>
              <div className="relative mt-2">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5" style={{ color: theme.accentColor }} />
                <Input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="pl-10 h-12 rounded-xl glass-input" placeholder={t('auth.enter_username')} required data-testid="manager-username-input" />
              </div>
            </div>
            <div>
              <Label className="font-semibold text-sm">{t('auth.password')}</Label>
              <div className="relative mt-2">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5" style={{ color: theme.accentColor }} />
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 h-12 rounded-xl glass-input" placeholder={t('auth.enter_password')} required data-testid="manager-password-input" />
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full text-white rounded-xl h-14 font-semibold btn-premium flex items-center justify-center gap-2" style={{ background: `linear-gradient(135deg, ${theme.accentColor}, ${theme.primaryColor})` }} data-testid="manager-login-button">
              {loading ? t('auth.logging_in') : t('manager_portal.login_button')}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-500 text-sm">{t('manager_portal.new_manager')}{' '}
              <button onClick={() => navigate('/staff-register', { state: { role: 'manager' } })} className="font-semibold hover:underline" style={{ color: theme.accentColor }} data-testid="manager-register-link">{t('auth.register_here')}</button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
