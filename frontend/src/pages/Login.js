import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { AppBranding } from '../components/AppBranding';
import api from '../utils/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { User, Lock } from 'lucide-react';

export const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { username, password });
      const { token, user } = response.data;
      
      login(user, token);
      toast.success('Welcome back!');

      if (user.role === 'customer') {
        navigate('/customer/menu');
      } else if (user.role === 'kitchen') {
        navigate('/kitchen/orders');
      } else if (user.role === 'manager') {
        navigate('/manager/dashboard');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/90 backdrop-blur rounded-2xl shadow-xl p-8" style={{ borderColor: `${theme.primaryColor}20`, borderWidth: 1 }}>
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <AppBranding size="medium" showName={false} />
            </div>
            <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Playfair Display, serif', color: theme.primaryColor }}>
              {theme.restaurantName}
            </h1>
            <p style={{ color: theme.secondaryColor }} className="text-base">Order First, Pay After Ready</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="username" className="font-semibold">Username</Label>
              <div className="relative mt-2">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: theme.primaryColor }} />
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 h-12 rounded-lg"
                  placeholder="Enter your username"
                  required
                  data-testid="login-username-input"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password" className="font-semibold">Password</Label>
              <div className="relative mt-2">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: theme.primaryColor }} />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-12 rounded-lg"
                  placeholder="Enter your password"
                  required
                  data-testid="login-password-input"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full text-white rounded-full h-12 font-semibold shadow-lg hover:shadow-xl transition-all"
              style={{ backgroundColor: theme.primaryColor }}
              data-testid="login-submit-button"
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-500 text-sm">
              New customer?{' '}
              <button
                onClick={() => navigate('/register')}
                className="font-semibold hover:underline"
                style={{ color: theme.primaryColor }}
                data-testid="navigate-register-button"
              >
                Register here
              </button>
            </p>
          </div>

          <div className="mt-8 p-4 rounded-lg" style={{ backgroundColor: `${theme.primaryColor}08`, border: `1px solid ${theme.primaryColor}20` }}>
            <p className="text-xs text-gray-500 font-semibold mb-2">Test Credentials:</p>
            <p className="text-xs">Kitchen: <span className="font-mono">Kitchen Staff / kitchen123</span></p>
            <p className="text-xs">Manager: <span className="font-mono">Manager Admin / manager123</span></p>
          </div>
        </div>
      </div>
    </div>
  );
};
