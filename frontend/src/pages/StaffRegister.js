import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { AppBranding } from '../components/AppBranding';
import api from '../utils/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { User, Lock, ArrowLeft, ArrowRight } from 'lucide-react';

export const StaffRegister = () => {
  const location = useLocation();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(location.state?.role || 'kitchen');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post('/auth/staff-register', { name, username, password, role });
      const { token, user } = response.data;
      login(user, token);
      toast.success('Registration successful!');
      navigate(role === 'kitchen' ? '/kitchen/orders' : '/manager/dashboard');
    } catch (error) { toast.error(error.response?.data?.error || 'Registration failed'); }
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
            <div className="flex justify-center mb-5"><AppBranding size="medium" showName={false} /></div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: theme.primaryColor }}>{t('staff_register.title')}</h1>
            <p className="text-gray-500 text-sm">{t('staff_register.desc')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="font-semibold text-sm">{t('staff_register.role')}</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="mt-2 h-12 rounded-xl glass-input" data-testid="role-select"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="kitchen">{t('staff_register.kitchen_staff')}</SelectItem>
                  <SelectItem value="manager">{t('staff_register.manager')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="font-semibold text-sm">{t('auth.full_name')}</Label>
              <div className="relative mt-2">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5" style={{ color: theme.primaryColor }} />
                <Input type="text" value={name} onChange={(e) => setName(e.target.value)} className="pl-10 h-12 rounded-xl glass-input" placeholder={t('auth.enter_name')} required data-testid="staff-name-input" />
              </div>
            </div>
            <div>
              <Label className="font-semibold text-sm">{t('auth.username')}</Label>
              <div className="relative mt-2">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5" style={{ color: theme.primaryColor }} />
                <Input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="pl-10 h-12 rounded-xl glass-input" placeholder={t('staff_register.choose_username')} required data-testid="staff-username-input" />
              </div>
            </div>
            <div>
              <Label className="font-semibold text-sm">{t('auth.password')}</Label>
              <div className="relative mt-2">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5" style={{ color: theme.primaryColor }} />
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 h-12 rounded-xl glass-input" placeholder={t('staff_register.choose_password')} required data-testid="staff-password-input" />
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full text-white rounded-xl h-14 font-semibold btn-premium flex items-center justify-center gap-2" style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})` }} data-testid="staff-register-button">
              {loading ? t('auth.creating_account') : t('staff_register.create_staff_account')}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-500 text-sm">{t('auth.already_have_account')}{' '}
              <button onClick={() => navigate(role === 'kitchen' ? '/kitchen' : '/manager')} className="font-semibold hover:underline" style={{ color: theme.primaryColor }} data-testid="navigate-login-button">{t('auth.login_here')}</button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
