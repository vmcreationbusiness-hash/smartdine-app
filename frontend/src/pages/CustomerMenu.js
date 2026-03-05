import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { AppBranding } from '../components/AppBranding';
import { VoiceSearch } from '../components/VoiceSearch';
import api from '../utils/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { Plus, Minus, Trash2, LogOut, Package, ShoppingBag, Search, X, Star } from 'lucide-react';
import { formatCurrency } from '../utils/helpers';

const CartPanel = ({ cart, theme, totalAmount, totalItems, discount, finalAmount, pointsToUse, setPointsToUse, loyaltyPoints, tableNumber, setTableNumber, updateQuantity, removeFromCart, placeOrder, ordering, t, idPrefix = '', sgstAmount = 0, cgstAmount = 0, gstRates = { sgst: 2.5, cgst: 2.5 }, getItemName }) => {
  const pfx = idPrefix ? `${idPrefix}-` : '';
  if (!t) return null;
  if (cart.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <ShoppingBag className="w-16 h-16 mb-4" style={{ color: `${theme.primaryColor}30` }} />
        <p className="text-lg font-semibold text-gray-400">{t('cart.empty')}</p>
        <p className="text-sm text-gray-300 mt-1">Add items from the menu</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b hidden lg:block" style={{ borderColor: `${theme.primaryColor}10` }}>
        <h3 className="text-xl font-bold" style={{ color: theme.primaryColor }}>{t('cart.title')}</h3>
        <p className="text-xs text-gray-400">{totalItems} item{totalItems !== 1 ? 's' : ''}</p>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {cart.map((item) => (
          <div key={item._id} className="flex items-center gap-3 p-3 rounded-xl bg-white/50 hover:bg-white/70 transition-colors" data-testid={`cart-item-${item._id}`}>
            <img src={item.image} alt={getItemName(item)} className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{getItemName(item)}</p>
              <p className="text-sm font-bold mt-0.5" style={{ color: theme.primaryColor }}>{formatCurrency(item.priceINR * item.quantity)}</p>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={(e) => { e.stopPropagation(); updateQuantity(item._id, -1); }} className="w-7 h-7 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200" data-testid={`decrease-${item._id}`}><Minus className="w-3 h-3" /></button>
              <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
              <button onClick={(e) => { e.stopPropagation(); updateQuantity(item._id, 1); }} className="w-7 h-7 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: theme.primaryColor }} data-testid={`increase-${item._id}`}><Plus className="w-3 h-3" /></button>
            </div>
            <button onClick={(e) => { e.stopPropagation(); removeFromCart(item._id); }} className="p-1.5 text-red-400 hover:text-red-600 rounded-full" data-testid={`remove-${item._id}`}><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        ))}
      </div>
      <div className="p-4 border-t space-y-3 bg-white/20" style={{ borderColor: `${theme.primaryColor}10` }}>
        <div>
          <Label className="text-xs font-semibold">{t('cart.table_number')} *</Label>
          <Input value={tableNumber} onChange={(e) => setTableNumber(e.target.value)} placeholder={t('cart.enter_table')} className="h-10 rounded-lg glass-input mt-1 text-sm" data-testid={`${pfx}table-number-input`} />
        </div>
        {loyaltyPoints > 0 && (
          <div className="rounded-xl p-3 border" style={{ backgroundColor: `${theme.primaryColor}06`, borderColor: `${theme.primaryColor}20` }}>
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5" style={{ color: theme.secondaryColor }} />
                <span className="text-xs font-semibold">{t('menu.loyalty_points')}</span>
              </div>
              <span className="text-xs text-gray-400">{loyaltyPoints} available</span>
            </div>
            <Input type="number" value={pointsToUse} onChange={(e) => setPointsToUse(Math.min(parseInt(e.target.value) || 0, loyaltyPoints, totalAmount * 0.5))} className="h-8 rounded-lg glass-input text-sm" data-testid={`${pfx}points-input`} />
          </div>
        )}
        <div className="space-y-1.5">
          <div className="flex justify-between text-sm"><span className="text-gray-500">{t('cart.subtotal')}</span><span className="font-semibold">{formatCurrency(totalAmount)}</span></div>
          {discount > 0 && <div className="flex justify-between text-sm text-green-600"><span>Points discount</span><span>-{formatCurrency(discount)}</span></div>}
          <div className="flex justify-between text-sm text-gray-400"><span>SGST ({gstRates.sgst}%)</span><span>+{formatCurrency(sgstAmount)}</span></div>
          <div className="flex justify-between text-sm text-gray-400"><span>CGST ({gstRates.cgst}%)</span><span>+{formatCurrency(cgstAmount)}</span></div>
          <div className="flex justify-between items-center pt-2 border-t" style={{ borderColor: `${theme.primaryColor}15` }}>
            <span className="font-bold">{t('payment.total')}</span>
            <span className="text-2xl font-bold" style={{ color: theme.primaryColor }}>{formatCurrency(finalAmount)}</span>
          </div>
        </div>
        <Button onClick={placeOrder} disabled={ordering} className="w-full text-white rounded-xl h-12 font-semibold btn-premium" style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})` }} data-testid={`${pfx}place-order-button`}>
          {ordering ? t('cart.placing_order') : t('cart.place_order')}
        </Button>
        <p className="text-[10px] text-center text-gray-400">{t('cart.payment_after_ready')}</p>
      </div>
    </div>
  );
};

export const CustomerMenu = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [tableNumber, setTableNumber] = useState('');
  const [pointsToUse, setPointsToUse] = useState(0);
  const [ordering, setOrdering] = useState(false);
  const [gstRates, setGstRates] = useState({ sgst: 2.5, cgst: 2.5 });
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const { currentLang } = useLanguage();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const cartRef = useRef(null);

  const getItemName = useCallback((item) => item.translations?.[currentLang]?.name || item.name, [currentLang]);
  const getItemDescription = useCallback((item) => item.translations?.[currentLang]?.description || item.description, [currentLang]);

  const handleVoiceResult = useCallback(({ text, matchedItem }) => {
    setSearchQuery(text);
    if (matchedItem) {
      setTimeout(() => {
        setCart(prev => {
          const inCart = prev.find(c => c._id === matchedItem._id);
          if (inCart) {
            toast.success(`🎤 Added one more "${getItemName(matchedItem)}"!`);
            return prev.map(c => c._id === matchedItem._id ? { ...c, quantity: c.quantity + 1 } : c);
          }
          toast.success(`🎤 Added "${getItemName(matchedItem)}" to cart!`);
          return [...prev, { ...matchedItem, quantity: 1 }];
        });
      }, 500);
    }
  }, [getItemName]);

  useEffect(() => { fetchMenu(); fetchLoyaltyInfo(); fetchGstRates(); }, []); // eslint-disable-line

  const fetchMenu = async () => {
    try { const r = await api.get('/menu'); setMenuItems(r.data); }
    catch { toast.error('Failed to load menu'); }
    finally { setLoading(false); }
  };

  const fetchLoyaltyInfo = async () => {
    try { const r = await api.get('/orders/loyalty-info'); setLoyaltyPoints(r.data.loyaltyPoints); } catch {}
  };

  const fetchGstRates = async () => {
    try { const r = await api.get('/settings/theme'); setGstRates({ sgst: r.data.sgstPercent ?? 2.5, cgst: r.data.cgstPercent ?? 2.5 }); } catch {}
  };

  const categories = useMemo(() => ['All', ...new Set(menuItems.map(i => i.category).filter(Boolean))], [menuItems]);

  const filteredItems = useMemo(() => menuItems.filter(item => {
    const matchesSearch = !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.translations?.[currentLang]?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  }), [menuItems, searchQuery, activeCategory, currentLang]);

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(c => c._id === item._id);
      if (existing) return prev.map(c => c._id === item._id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { ...item, quantity: 1 }];
    });
    toast.success(`${getItemName(item)} added!`, { duration: 1500 });
  };

  const updateQuantity = (itemId, change) => {
    setCart(prev => prev.map(item => item._id === itemId ? { ...item, quantity: item.quantity + change } : item).filter(item => item.quantity > 0));
  };

  const removeFromCart = (itemId) => setCart(prev => prev.filter(c => c._id !== itemId));
  const getCartQty = (itemId) => cart.find(c => c._id === itemId)?.quantity || 0;
  const scrollToCart = () => cartRef.current?.scrollIntoView({ behavior: 'smooth' });

  const totalAmount = cart.reduce((sum, item) => sum + item.priceINR * item.quantity, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const discount = Math.min(pointsToUse, totalAmount * 0.5);
  const afterDiscount = totalAmount - discount;
  const sgstAmount = Math.round(afterDiscount * gstRates.sgst / 100 * 100) / 100;
  const cgstAmount = Math.round(afterDiscount * gstRates.cgst / 100 * 100) / 100;
  const finalAmount = Math.round((afterDiscount + sgstAmount + cgstAmount) * 100) / 100;

  const placeOrder = async () => {
    if (!tableNumber) { toast.error('Please enter your table number'); return; }
    if (cart.length === 0) { toast.error('Cart is empty'); return; }
    setOrdering(true);
    try {
      const items = cart.map(item => ({ name: item.name, quantity: item.quantity, price: item.priceINR }));
      await api.post('/orders', { tableNumber, items, totalAmount, pointsUsed: pointsToUse });
      toast.success('Order placed successfully!');
      setCart([]); setTableNumber(''); setPointsToUse(0);
      navigate('/customer/orders');
    } catch (error) { toast.error(error.response?.data?.error || 'Failed to place order'); }
    finally { setOrdering(false); }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin mx-auto mb-4" style={{ borderColor: `${theme.primaryColor}40`, borderTopColor: theme.primaryColor }}></div>
          <p style={{ color: theme.secondaryColor }}>{t('menu.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="glass-header sticky top-0 z-20">
        <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center justify-between">
          <AppBranding size="small" showName={true} />
          <div className="flex items-center gap-2 md:gap-3">
            {loyaltyPoints > 0 && (
              <div className="flex items-center gap-1 px-3 py-1.5 rounded-full text-white text-xs font-semibold" style={{ background: `linear-gradient(135deg, ${theme.secondaryColor}, ${theme.primaryColor})` }} data-testid="loyalty-points-display">
                <Star className="w-3 h-3 fill-white" />
                <span>{loyaltyPoints} {t('menu.loyalty_points')}</span>
              </div>
            )}
            <Button onClick={() => navigate('/customer/orders')} variant="ghost" size="sm" className="text-xs font-semibold" data-testid="view-orders-button">
              <Package className="w-4 h-4 mr-1" /> {t('menu.my_orders')}
            </Button>
            <Button onClick={() => { logout(); navigate('/'); }} variant="ghost" size="sm" data-testid="logout-button">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row max-w-[1400px] mx-auto w-full">
        <div className="flex-1 p-4 md:p-6 overflow-y-auto">

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
            <h2 className="text-2xl md:text-3xl font-bold flex-shrink-0" style={{ color: theme.primaryColor }}>{t('menu.our_menu', 'Our Menu')}</h2>
            <div className="flex items-center gap-2 flex-1 max-w-sm">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search dishes..." className="search-bar w-full pl-9 pr-8 py-2.5 outline-none" data-testid="menu-search" />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full hover:bg-gray-100">
                    <X className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                )}
              </div>
              <VoiceSearch onResult={handleVoiceResult} menuItems={menuItems} />
            </div>
          </div>

          {categories.length > 1 && (
            <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
              {categories.map((cat) => (
                <button key={cat} onClick={() => setActiveCategory(cat)} className={`category-pill flex-shrink-0 ${activeCategory === cat ? 'active' : 'bg-white/50 text-gray-600'}`} style={activeCategory === cat ? { background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`, borderColor: 'transparent' } : { borderColor: 'rgba(0,0,0,0.1)' }} data-testid={`category-${cat}`}>
                  {cat}
                </button>
              ))}
            </div>
          )}

          {(searchQuery || activeCategory !== 'All') && (
            <p className="text-sm text-gray-400 mb-4">{filteredItems.length} dish{filteredItems.length !== 1 ? 'es' : ''} found</p>
          )}

          {filteredItems.length === 0 ? (
            <div className="text-center py-16 animate-fade-in-up">
              <Search className="w-16 h-16 mx-auto mb-4" style={{ color: `${theme.primaryColor}30` }} />
              <h3 className="text-xl font-bold text-gray-400 mb-2">No dishes found</h3>
              <button onClick={() => { setSearchQuery(''); setActiveCategory('All'); }} className="mt-3 text-sm font-semibold underline" style={{ color: theme.primaryColor }}>Clear filters</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-5">
              {filteredItems.map((item) => {
                const qty = getCartQty(item._id);
                return (
                  <div key={item._id} className="glass-card rounded-2xl overflow-hidden group" data-testid={`menu-item-${item._id}`}>
                    <div className="aspect-[4/3] overflow-hidden relative">
                      <img src={item.image} alt={getItemName(item)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      {item.category && (
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-semibold text-white" style={{ background: `${theme.primaryColor}cc` }}>
                          {item.category}
                        </span>
                      )}
                      <div className="absolute bottom-2 right-2">
                        {qty > 0 ? (
                          <div className="flex items-center gap-1 bg-white/95 backdrop-blur rounded-full px-2 py-1 shadow-lg">
                            <button onClick={(e) => { e.stopPropagation(); updateQuantity(item._id, -1); }} className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-gray-100" data-testid={`decrease-overlay-${item._id}`}>
                              <Minus className="w-3 h-3 text-gray-600" />
                            </button>
                            <span className="text-sm font-bold w-4 text-center" style={{ color: theme.primaryColor }}>{qty}</span>
                            <button onClick={(e) => { e.stopPropagation(); addToCart(item); }} className="w-5 h-5 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: theme.primaryColor }} data-testid={`increase-overlay-${item._id}`}>
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => addToCart(item)} className="flex items-center gap-1 bg-white/95 backdrop-blur rounded-full px-3 py-1.5 text-xs font-semibold shadow-lg hover:bg-white" style={{ color: theme.primaryColor }} data-testid={`add-btn-${item._id}`}>
                            <Plus className="w-3 h-3" />Add
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="p-3 md:p-4">
                      <h3 className="text-sm md:text-base font-bold truncate">{getItemName(item)}</h3>
                      <p className="text-xs text-gray-400 truncate mt-0.5 hidden md:block">{getItemDescription(item)}</p>
                      <p className="text-base md:text-lg font-bold mt-1" style={{ color: theme.primaryColor }}>{formatCurrency(item.priceINR)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>

        <div className="hidden lg:flex flex-col w-[380px] border-l glass-strong sticky top-[60px] h-[calc(100vh-60px)]" style={{ borderColor: `${theme.primaryColor}15` }}>
          <CartPanel cart={cart} theme={theme} totalAmount={totalAmount} totalItems={totalItems} discount={discount} finalAmount={finalAmount} pointsToUse={pointsToUse} setPointsToUse={setPointsToUse} loyaltyPoints={loyaltyPoints} tableNumber={tableNumber} setTableNumber={setTableNumber} updateQuantity={updateQuantity} removeFromCart={removeFromCart} placeOrder={placeOrder} ordering={ordering} t={t} idPrefix="desktop" sgstAmount={sgstAmount} cgstAmount={cgstAmount} gstRates={gstRates} getItemName={getItemName} />
        </div>
      </div>

      <div ref={cartRef} className="lg:hidden">
        {cart.length > 0 && (
          <div className="mx-4 mb-4 glass-card rounded-2xl overflow-hidden" data-testid="mobile-cart-section">
            <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: `${theme.primaryColor}15`, background: `linear-gradient(135deg, ${theme.primaryColor}10, ${theme.secondaryColor}10)` }}>
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" style={{ color: theme.primaryColor }} />
                <h3 className="text-lg font-bold" style={{ color: theme.primaryColor }}>{t('cart.title')}</h3>
              </div>
              <span className="text-sm font-semibold px-2.5 py-0.5 rounded-full text-white" style={{ backgroundColor: theme.primaryColor }}>{totalItems} item{totalItems !== 1 ? 's' : ''}</span>
            </div>
            <CartPanel cart={cart} theme={theme} totalAmount={totalAmount} totalItems={totalItems} discount={discount} finalAmount={finalAmount} pointsToUse={pointsToUse} setPointsToUse={setPointsToUse} loyaltyPoints={loyaltyPoints} tableNumber={tableNumber} setTableNumber={setTableNumber} updateQuantity={updateQuantity} removeFromCart={removeFromCart} placeOrder={placeOrder} ordering={ordering} t={t} idPrefix="mobile" sgstAmount={sgstAmount} cgstAmount={cgstAmount} gstRates={gstRates} getItemName={getItemName} />
          </div>
        )}
      </div>

      {cart.length > 0 && (
        <div className="lg:hidden fixed bottom-4 right-4 z-30">
          <button onClick={scrollToCart} className="floating-cart-btn text-white flex items-center gap-2" style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})` }} data-testid="mobile-cart-fab">
            <ShoppingBag className="w-5 h-5" />
            <span className="text-sm font-bold">{totalItems} item{totalItems !== 1 ? 's' : ''}</span>
            <span className="text-sm opacity-80">• {formatCurrency(finalAmount)}</span>
          </button>
        </div>
      )}
    </div>
  </div>
  );
};
/ /   f i x e d  
 