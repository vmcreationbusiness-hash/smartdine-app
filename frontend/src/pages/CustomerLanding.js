import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { AppBranding } from '../components/AppBranding';
import api from '../utils/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { User, Phone, ArrowLeft, ArrowRight } from 'lucide-react';

export const CustomerLanding = () => {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (mobile.length !== 10) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }
    setLoading(true);
    try {
      const response = await api.post('/auth/customer-entry', { name, mobile });
      const { token, user } = response.data;
      login(user, token);
      toast.success(`Welcome, ${user.name}!`);
      navigate('/customer/menu');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in-up">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 mb-6 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors"
          data-testid="back-home-button"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('common.back_home')}
        </button>

        <div className="glass-card rounded-3xl p-8 md:p-10">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-5">
              <AppBranding size="medium" showName={false} />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{ color: theme.primaryColor }}>
              {theme.restaurantName}
            </h1>
            <p className="text-gray-500">{t('role_selection.tagline')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="name" className="font-semibold text-sm">{t('auth.full_name')}</Label>
              <div className="relative mt-2">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5" style={{ color: theme.primaryColor }} />
                <Input
                  id="name" type="text" value={name} onChange={(e) => setName(e.target.value)}
                  className="pl-10 h-12 rounded-xl glass-input"
                  placeholder={t('auth.enter_name')} required data-testid="customer-name-input"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="mobile" className="font-semibold text-sm">{t('auth.mobile')}</Label>
              <div className="relative mt-2">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5" style={{ color: theme.primaryColor }} />
                <Input
                  id="mobile" type="tel" value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="pl-10 h-12 rounded-xl glass-input"
                  placeholder={t('auth.enter_mobile')} required data-testid="customer-mobile-input"
                />
              </div>
            </div>

            <Button
              type="submit" disabled={loading}
              className="w-full text-white rounded-xl h-14 text-base font-semibold btn-premium flex items-center justify-center gap-2"
              style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})` }}
              data-testid="customer-submit-button"
            >
              {loading ? t('common.loading') : t('role_selection.continue_customer')}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
