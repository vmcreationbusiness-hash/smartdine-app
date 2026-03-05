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
import { User, Phone } from 'lucide-react';

export const Register = () => {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (mobile.length !== 10) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/register', { name, mobile });
      const { token, user } = response.data;
      
      login(user, token);
      toast.success('Registration successful! Your password is your mobile number.');
      navigate('/customer/menu');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Registration failed');
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
              Join {theme.restaurantName}
            </h1>
            <p style={{ color: theme.secondaryColor }} className="text-base">Create your customer account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="name" className="font-semibold">Full Name</Label>
              <div className="relative mt-2">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: theme.primaryColor }} />
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10 h-12 rounded-lg"
                  placeholder="Enter your full name"
                  required
                  data-testid="register-name-input"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="mobile" className="font-semibold">Mobile Number</Label>
              <div className="relative mt-2">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: theme.primaryColor }} />
                <Input
                  id="mobile"
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="pl-10 h-12 rounded-lg"
                  placeholder="Enter 10-digit mobile"
                  required
                  data-testid="register-mobile-input"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Your mobile number will be your password</p>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full text-white rounded-full h-12 font-semibold shadow-lg hover:shadow-xl transition-all"
              style={{ backgroundColor: theme.primaryColor }}
              data-testid="register-submit-button"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-500 text-sm">
              Already have an account?{' '}
              <button
                onClick={() => navigate('/login')}
                className="font-semibold hover:underline"
                style={{ color: theme.primaryColor }}
                data-testid="navigate-login-button"
              >
                Login here
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
