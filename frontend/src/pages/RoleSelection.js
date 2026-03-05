import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { AppBranding } from '../components/AppBranding';
import { Button } from '../components/ui/button';
import { ChefHat, UserCircle, Settings, ArrowRight } from 'lucide-react';

export const RoleSelection = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { t } = useTranslation();

  const roles = [
    { key: 'customer', icon: UserCircle, path: '/customer', gradient: [theme.primaryColor, theme.secondaryColor], label: t('role_selection.customer'), desc: t('role_selection.customer_desc'), btn: t('role_selection.continue_customer') },
    { key: 'kitchen', icon: ChefHat, path: '/kitchen', gradient: [theme.secondaryColor, theme.primaryColor], label: t('role_selection.kitchen'), desc: t('role_selection.kitchen_desc'), btn: t('role_selection.kitchen_login') },
    { key: 'manager', icon: Settings, path: '/manager', gradient: [theme.accentColor, theme.primaryColor], label: t('role_selection.manager'), desc: t('role_selection.manager_desc'), btn: t('role_selection.manager_login') },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-5xl">
        <div className="text-center mb-12 animate-fade-in-up">
          <div className="flex justify-center mb-6">
            <AppBranding size="large" showName={true} />
          </div>
          <p className="text-lg md:text-xl font-light tracking-wide" style={{ color: theme.secondaryColor }}>
            {t('role_selection.tagline')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {roles.map((role, idx) => {
            const Icon = role.icon;
            return (
              <div
                key={role.key}
                onClick={() => navigate(role.path)}
                className="glass-card rounded-3xl p-8 cursor-pointer group"
                style={{ animationDelay: `${idx * 0.1}s` }}
                data-testid={`${role.key}-role-card`}
              >
                <div className="flex flex-col items-center text-center">
                  <div
                    className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg"
                    style={{ background: `linear-gradient(135deg, ${role.gradient[0]}, ${role.gradient[1]})` }}
                  >
                    <Icon className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold mb-3">{role.label}</h2>
                  <p className="text-gray-500 text-sm mb-6 leading-relaxed">{role.desc}</p>
                  <Button
                    className="w-full text-white rounded-xl h-12 font-semibold btn-premium flex items-center justify-center gap-2"
                    style={{ background: `linear-gradient(135deg, ${role.gradient[0]}, ${role.gradient[1]})` }}
                  >
                    {role.btn}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
