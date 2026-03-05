import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import api from '../utils/api';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { LogOut, Settings, FileText, LayoutDashboard, Utensils, CreditCard, TrendingUp, ShoppingBag, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { formatCurrency, formatDate, getStatusColor, getPaymentStatusColor } from '../utils/helpers';

const StatCard = ({ label, value, color, icon: Icon, trend }) => (
  <div className="glass-card rounded-2xl p-4 md:p-6 relative overflow-hidden group cursor-default">
    <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-5 -translate-y-4 translate-x-4" style={{ backgroundColor: color }} />
    <div className="flex items-start justify-between mb-3">
      <div className="p-2 rounded-xl" style={{ backgroundColor: `${color}15` }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      {trend !== undefined && (
        <div className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${color}10`, color }}>
          <TrendingUp className="w-3 h-3" />
          Today
        </div>
      )}
    </div>
    <p className="text-2xl md:text-3xl font-bold" style={{ color }}>{value}</p>
    <p className="text-xs text-gray-400 mt-1">{label}</p>
  </div>
);

export const ManagerDashboard = () => {
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => { fetchData(); }, []);

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const [statsRes, ordersRes] = await Promise.all([
        api.get('/manager/reports/daily'),
        api.get('/manager/orders')
      ]);
      setStats(statsRes.data);
      setOrders(ordersRes.data);
    } catch (error) { toast.error('Failed to load data'); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const handleLogout = () => { logout(); navigate('/'); };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin mx-auto mb-4" style={{ borderColor: `${theme.primaryColor}40`, borderTopColor: theme.primaryColor }}></div>
        <p style={{ color: theme.secondaryColor }}>{t('common.loading')}</p>
      </div>
    </div>
  );

  const statCards = [
    { label: t('manager.total_orders'), value: stats?.totalOrders || 0, color: theme.primaryColor, icon: ShoppingBag, trend: 0 },
    { label: t('manager.paid_orders'), value: stats?.paidOrders || 0, color: '#16a34a', icon: CheckCircle },
    { label: t('manager.unpaid_orders'), value: stats?.unpaidOrders || 0, color: '#dc2626', icon: AlertCircle },
    { label: t('manager.total_revenue'), value: formatCurrency(stats?.totalRevenue || 0), color: theme.secondaryColor, icon: TrendingUp },
  ];

  const navItems = [
    { label: t('manager.dashboard'), icon: LayoutDashboard, path: '/manager/dashboard', active: true },
    { label: t('manager.manage_menu'), icon: Utensils, path: '/manager/menu' },
    { label: t('manager.daily_reports'), icon: FileText, path: '/manager/reports' },
    { label: t('manager.restaurant_settings'), icon: Settings, path: '/manager/settings' },
  ];

  const pendingPaymentOrders = orders.filter(o => o.orderStatus === 'Ready' && o.paymentStatus === 'Unpaid');
  const recentOrders = orders.slice(0, 20);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="glass-header sticky top-0 z-20">
        <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold" style={{ color: theme.primaryColor }}>{t('manager.dashboard')}</h1>
            <p className="text-xs text-gray-400">{t('manager.welcome', { name: user?.name })}</p>
          </div>
          <div className="flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button key={item.path} onClick={() => navigate(item.path)} variant={item.active ? 'default' : 'ghost'} size="sm"
                  className={`text-xs font-semibold hidden md:flex ${item.active ? 'text-white' : ''}`}
                  style={item.active ? { background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})` } : {}}
                  data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <Icon className="w-4 h-4 mr-1" /> {item.label}
                </Button>
              );
            })}
            <button onClick={() => fetchData(true)} disabled={refreshing} className="p-2 rounded-xl hover:bg-white/50 transition-colors">
              <RefreshCw className={`w-4 h-4 text-gray-500 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <Button onClick={handleLogout} variant="ghost" size="sm" data-testid="logout-button"><LogOut className="w-4 h-4" /></Button>
          </div>
        </div>
        <div className="md:hidden flex gap-1 px-4 pb-2 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button key={item.path} onClick={() => navigate(item.path)} variant={item.active ? 'default' : 'ghost'} size="sm"
                className={`text-xs whitespace-nowrap ${item.active ? 'text-white' : ''}`}
                style={item.active ? { backgroundColor: theme.primaryColor } : {}}
              >
                <Icon className="w-3 h-3 mr-1" /> {item.label}
              </Button>
            );
          })}
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto w-full px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5 stagger-children">
          {statCards.map((s, i) => (
            <StatCard key={i} {...s} />
          ))}
        </div>

        {/* Pending Payment Alert */}
        {pendingPaymentOrders.length > 0 && (
          <div className="glass-card rounded-2xl p-4 border-l-4 animate-fade-in-up" style={{ borderLeftColor: theme.primaryColor }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" style={{ color: theme.primaryColor }} />
                <h3 className="font-bold" style={{ color: theme.primaryColor }}>
                  {pendingPaymentOrders.length} order{pendingPaymentOrders.length > 1 ? 's' : ''} waiting for payment
                </h3>
              </div>
              <Button onClick={() => navigate('/manager/orders')} size="sm" variant="outline" className="text-xs rounded-lg">View All</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {pendingPaymentOrders.map(order => (
                <button
                  key={order.orderId}
                  onClick={() => navigate(`/customer/payment/${order.orderId}`, { state: { order } })}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-white text-xs font-semibold btn-premium"
                  style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})` }}
                  data-testid={`quick-pay-${order.orderId}`}
                >
                  <CreditCard className="w-3 h-3" />
                  Table {order.tableNumber} · {formatCurrency(order.finalAmount || order.totalAmount)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Recent Orders Table */}
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="p-4 md:p-5 border-b flex items-center justify-between" style={{ borderColor: `${theme.primaryColor}10` }}>
            <div>
              <h2 className="text-xl font-bold" style={{ color: theme.primaryColor }}>{t('manager_orders.title')}</h2>
              <p className="text-xs text-gray-400">{orders.length} total orders today</p>
            </div>
            <Button onClick={() => navigate('/manager/orders')} variant="outline" size="sm" className="text-xs rounded-xl">View All</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b" style={{ borderColor: `${theme.primaryColor}10`, backgroundColor: `${theme.primaryColor}05` }}>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{t('payment.order_id')}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 hidden md:table-cell">{t('manager_orders.customer')}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{t('orders.table')}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 hidden sm:table-cell">{t('manager_orders.items')}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{t('manager_orders.amount')}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{t('manager_orders.order_status')}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{t('manager_orders.payment')}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 hidden lg:table-cell">{t('manager_orders.date')}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.orderId} className="border-b last:border-0 hover:bg-white/30 transition-colors" style={{ borderColor: `${theme.primaryColor}08` }} data-testid={`order-row-${order.orderId}`}>
                    <td className="px-4 py-3 text-sm font-semibold">{order.orderId}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 hidden md:table-cell">{order.customerName}</td>
                    <td className="px-4 py-3 text-sm font-bold" style={{ color: theme.primaryColor }}>T{order.tableNumber}</td>
                    <td className="px-4 py-3 text-sm text-gray-400 hidden sm:table-cell">{order.items.length} items</td>
                    <td className="px-4 py-3 text-sm font-bold">{formatCurrency(order.finalAmount || order.totalAmount)}</td>
                    <td className="px-4 py-3"><span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusColor(order.orderStatus)}`}>{order.orderStatus}</span></td>
                    <td className="px-4 py-3"><span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getPaymentStatusColor(order.paymentStatus)}`}>{order.paymentStatus}</span></td>
                    <td className="px-4 py-3 text-xs text-gray-400 hidden lg:table-cell">{formatDate(order.createdAt)}</td>
                    <td className="px-4 py-3">
                      {order.orderStatus === 'Ready' && order.paymentStatus === 'Unpaid' && (
                        <Button onClick={() => navigate(`/customer/payment/${order.orderId}`, { state: { order } })} size="sm" className="text-white rounded-lg h-7 text-[10px] btn-premium" style={{ backgroundColor: theme.primaryColor }} data-testid={`pay-${order.orderId}`}>
                          <CreditCard className="w-3 h-3 mr-1" /> Pay
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {orders.length === 0 && <div className="text-center py-12 text-gray-400">{t('manager_orders.no_orders')}</div>}
        </div>
      </main>
    </div>
  );
};
