import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import api from '../utils/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { ArrowLeft, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { formatCurrency } from '../utils/helpers';

export const Cart = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme } = useTheme();
  const [cart, setCart] = useState(location.state?.cart || []);
  const [tableNumber, setTableNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [loyaltyPoints, setLoyaltyPoints] = useState(location.state?.loyaltyPoints || 0);
  const [pointsToUse, setPointsToUse] = useState(0);

  const updateQuantity = (itemId, change) => {
    setCart(cart.map(item => {
      if (item._id === itemId) {
        const newQuantity = item.quantity + change;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeItem = (itemId) => {
    setCart(cart.filter(item => item._id !== itemId));
    toast.success('Item removed from cart');
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.priceINR * item.quantity), 0);
  const discount = Math.min(pointsToUse, totalAmount * 0.5);
  const finalAmount = totalAmount - discount;

  const placeOrder = async () => {
    if (!tableNumber) {
      toast.error('Please enter table number');
      return;
    }

    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    if (pointsToUse > loyaltyPoints) {
      toast.error('Insufficient loyalty points');
      return;
    }

    setLoading(true);

    try {
      const items = cart.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.priceINR
      }));

      await api.post('/orders', {
        tableNumber,
        items,
        totalAmount,
        pointsUsed: pointsToUse
      });

      if (pointsToUse > 0) {
        toast.success(`Order placed! You saved ${formatCurrency(discount)} using ${pointsToUse} points`);
      } else {
        toast.success('Order placed successfully!');
      }
      navigate('/customer/orders');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag className="w-24 h-24 mx-auto mb-4" style={{ color: theme.primaryColor }} />
          <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
            Your cart is empty
          </h2>
          <Button
            onClick={() => navigate('/customer/menu')}
            className="text-white rounded-full px-8 py-3 font-semibold"
            style={{ backgroundColor: theme.primaryColor }}
            data-testid="back-to-menu-button"
          >
            Browse Menu
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="bg-white/90 backdrop-blur border-b shadow-sm" style={{ borderColor: `${theme.primaryColor}20` }}>
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            onClick={() => navigate('/customer/menu')}
            variant="ghost"
            data-testid="back-button"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold" style={{ fontFamily: 'Playfair Display, serif', color: theme.primaryColor }}>
            Your Cart
          </h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-4 mb-8">
          {cart.map((item) => (
            <div key={item._id} className="bg-white/90 backdrop-blur rounded-xl p-4 shadow-sm" style={{ border: `1px solid ${theme.primaryColor}15` }} data-testid={`cart-item-${item._id}`}>
              <div className="flex gap-4">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-24 h-24 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold" style={{ fontFamily: 'Playfair Display, serif' }}>
                    {item.name}
                  </h3>
                  <p className="font-bold" style={{ color: theme.primaryColor }}>{formatCurrency(item.priceINR)}</p>
                </div>
                <div className="flex flex-col items-end justify-between">
                  <Button
                    onClick={() => removeItem(item._id)}
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    data-testid={`remove-item-${item._id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <div className="flex items-center gap-2 rounded-full px-3 py-1" style={{ backgroundColor: `${theme.primaryColor}10` }}>
                    <Button
                      onClick={() => updateQuantity(item._id, -1)}
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      data-testid={`decrease-quantity-${item._id}`}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="font-semibold min-w-[20px] text-center">{item.quantity}</span>
                    <Button
                      onClick={() => updateQuantity(item._id, 1)}
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      data-testid={`increase-quantity-${item._id}`}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white/90 backdrop-blur rounded-xl p-6 shadow-sm mb-6" style={{ border: `1px solid ${theme.primaryColor}15` }}>
          <Label htmlFor="tableNumber" className="font-semibold text-lg mb-2 block">
            Table Number *
          </Label>
          <Input
            id="tableNumber"
            type="text"
            value={tableNumber}
            onChange={(e) => setTableNumber(e.target.value)}
            className="h-12 rounded-lg"
            placeholder="Enter your table number"
            required
            data-testid="table-number-input"
          />
        </div>

        {loyaltyPoints > 0 && (
          <div className="rounded-xl p-6 shadow-sm mb-6" style={{ background: `linear-gradient(135deg, ${theme.secondaryColor}15, ${theme.primaryColor}15)`, border: `2px solid ${theme.primaryColor}30` }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>
                  Use Loyalty Points
                </h3>
                <p className="text-sm text-gray-500">You have {loyaltyPoints} points available</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">1 point = 1 off</p>
                <p className="text-xs text-gray-500">Max 50% discount</p>
              </div>
            </div>
            <div className="flex gap-4 items-center">
              <Input
                type="number"
                value={pointsToUse}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0;
                  setPointsToUse(Math.min(Math.max(0, value), loyaltyPoints, totalAmount * 0.5));
                }}
                max={Math.min(loyaltyPoints, totalAmount * 0.5)}
                min={0}
                className="h-12 rounded-lg"
                placeholder="Points to use"
                data-testid="points-input"
              />
              <Button
                onClick={() => setPointsToUse(Math.min(loyaltyPoints, Math.floor(totalAmount * 0.5)))}
                variant="outline"
                className="whitespace-nowrap"
                style={{ borderColor: `${theme.primaryColor}40`, color: theme.primaryColor }}
                data-testid="use-max-points-button"
              >
                Use Maximum
              </Button>
            </div>
            {pointsToUse > 0 && (
              <p className="text-sm font-semibold text-green-600 mt-3">
                You'll save {formatCurrency(discount)} with {pointsToUse} points!
              </p>
            )}
          </div>
        )}

        <div className="bg-white/90 backdrop-blur rounded-xl p-6 shadow-md" style={{ border: `1px solid ${theme.primaryColor}15` }}>
          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-base text-gray-500">Subtotal</span>
              <span className="text-lg font-semibold">{formatCurrency(totalAmount)}</span>
            </div>
            {pointsToUse > 0 && (
              <div className="flex items-center justify-between text-green-600">
                <span className="text-base">Points Discount ({pointsToUse} points)</span>
                <span className="text-lg font-semibold">-{formatCurrency(discount)}</span>
              </div>
            )}
            <div className="border-t pt-3 flex items-center justify-between" style={{ borderColor: `${theme.primaryColor}20` }}>
              <span className="text-lg font-semibold">Final Amount</span>
              <span className="text-3xl font-bold" style={{ color: theme.primaryColor }}>{formatCurrency(finalAmount)}</span>
            </div>
          </div>
          <Button
            onClick={placeOrder}
            disabled={loading}
            className="w-full text-white rounded-full h-12 font-semibold shadow-lg hover:shadow-xl transition-all"
            style={{ backgroundColor: theme.primaryColor }}
            data-testid="place-order-button"
          >
            {loading ? 'Placing Order...' : 'Place Order'}
          </Button>
          <p className="text-xs text-gray-400 text-center mt-3">
            Payment will be enabled after your order is ready
          </p>
          <p className="text-xs text-green-600 text-center mt-2 font-semibold">
            Earn {Math.floor(finalAmount / 10)} loyalty points with this order!
          </p>
        </div>
      </main>
    </div>
  );
};
