import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useSocket } from '../contexts/SocketContext';
import api from '../utils/api';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { LogOut, Clock, ChefHat, CheckCircle, RefreshCw, Utensils } from 'lucide-react';
import { formatDate } from '../utils/helpers';

const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ago`;
};

const OrderCard = ({ order, col, onAction, t }) => {
  const [elapsed, setElapsed] = useState(timeAgo(order.createdAt));
  const isUrgent = (new Date() - new Date(order.createdAt)) > 15 * 60 * 1000; // 15 min

  useEffect(() => {
    const interval = setInterval(() => setElapsed(timeAgo(order.createdAt)), 30000);
    return () => clearInterval(interval);
  }, [order.createdAt]);

  return (
    <div
      className="glass-card rounded-xl p-4 border-l-4 animate-fade-in-up"
      style={{ borderLeftColor: isUrgent && col.action ? '#ef4444' : col.color }}
      data-testid={`order-${order.orderId}`}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="font-bold text-sm">{order.orderId}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Clock className="w-3 h-3 text-gray-400" />
            <p className={`text-xs ${isUrgent && col.action ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>{elapsed}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold rounded-lg px-2.5 py-1 text-white inline-block" style={{ backgroundColor: col.color }}>
            T{order.tableNumber}
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="mb-3 space-y-1 bg-white/30 rounded-lg p-2.5">
        {order.items.map((item, idx) => (
          <div key={idx} className="flex justify-between items-center">
            <p className="text-xs text-gray-600 font-medium">{item.name}</p>
            <span className="text-xs font-bold px-1.5 py-0.5 rounded-md bg-white/60" style={{ color: col.color }}>x{item.quantity}</span>
          </div>
        ))}
        <div className="border-t pt-1 mt-1 text-xs text-gray-400 text-right" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
          {order.items.reduce((s, i) => s + i.quantity, 0)} items total
        </div>
      </div>

      {isUrgent && col.action && (
        <div className="mb-2 bg-red-50 border border-red-100 rounded-lg px-3 py-1.5 text-xs text-red-600 font-semibold text-center">
          ⚠ Waiting over 15 minutes
        </div>
      )}

      {col.action ? (
        <Button
          onClick={() => onAction(order.orderId, col.action)}
          className="w-full text-white rounded-lg h-9 text-sm font-semibold btn-premium"
          style={{ backgroundColor: col.actionColor }}
          data-testid={`action-${order.orderId}`}
        >
          {col.actionLabel}
        </Button>
      ) : (
        <div className="bg-green-50 border border-green-100 p-2.5 rounded-lg text-center">
          <CheckCircle className="w-4 h-4 text-green-600 mx-auto mb-0.5" />
          <p className="text-xs font-semibold text-green-700">{t('kitchen.awaiting_payment')}</p>
        </div>
      )}
    </div>
  );
};

export const KitchenDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const socket = useSocket();

  const fetchOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const response = await api.get('/kitchen/orders');
      setOrders(response.data);
    } catch (error) { toast.error('Failed to load orders'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  useEffect(() => {
    if (socket) {
      socket.on('orderPlaced', (newOrder) => {
        setOrders(prev => [newOrder, ...prev]);
        toast.success(`🔔 New order: Table ${newOrder.tableNumber}`, { duration: 5000 });
      });
      return () => { socket.off('orderPlaced'); };
    }
  }, [socket]);

  // Auto-refresh every 60s
  useEffect(() => {
    const interval = setInterval(() => fetchOrders(true), 60000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const updateOrderStatus = async (orderId, status) => {
    try {
      await api.put(`/kitchen/orders/${orderId}/status`, { status });
      setOrders(orders.map(order => order.orderId === orderId ? { ...order, orderStatus: status } : order));
      toast.success(`Order marked as ${status}`);
    } catch (error) { toast.error('Failed to update status'); }
  };

  const handleLogout = () => { logout(); navigate('/'); };

  const orderedOrders = orders.filter(o => o.orderStatus === 'Ordered');
  const preparingOrders = orders.filter(o => o.orderStatus === 'Preparing');
  const readyOrders = orders.filter(o => o.orderStatus === 'Ready');

  const columns = [
    { title: t('kitchen.new_orders'), icon: Clock, orders: orderedOrders, color: theme.primaryColor, action: 'Preparing', actionLabel: t('kitchen.start_preparing'), actionColor: theme.secondaryColor, emptyMsg: t('kitchen.no_new') },
    { title: t('kitchen.preparing'), icon: ChefHat, orders: preparingOrders, color: theme.secondaryColor, action: 'Ready', actionLabel: t('kitchen.mark_ready'), actionColor: '#16a34a', emptyMsg: t('kitchen.no_preparing') },
    { title: t('kitchen.ready'), icon: CheckCircle, orders: readyOrders, color: '#16a34a', action: null, actionLabel: null, actionColor: null, emptyMsg: t('kitchen.no_ready') },
  ];

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <ChefHat className="w-12 h-12 mx-auto mb-3 animate-bounce-subtle" style={{ color: theme.primaryColor }} />
        <p style={{ color: theme.secondaryColor }}>{t('common.loading')}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <header className="glass-header sticky top-0 z-20">
        <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl shadow-md" style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})` }}>
              <ChefHat className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold" style={{ color: theme.primaryColor }}>{t('kitchen.title')}</h1>
              <p className="text-xs text-gray-400">{t('kitchen.welcome', { name: user?.name })}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchOrders(true)}
              disabled={refreshing}
              className="p-2 rounded-xl hover:bg-white/50 transition-colors"
              title="Refresh orders"
            >
              <RefreshCw className={`w-4 h-4 text-gray-500 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <Button onClick={handleLogout} variant="ghost" size="sm" data-testid="logout-button"><LogOut className="w-4 h-4" /></Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1400px] mx-auto w-full px-4 py-6">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 md:gap-5 mb-6">
          {columns.map((col, i) => {
            const Icon = col.icon;
            return (
              <div key={i} className="glass-card rounded-2xl p-4 md:p-5 stat-card overflow-hidden">
                <div className="flex items-center justify-between mb-1">
                  <Icon className="w-4 h-4" style={{ color: col.color }} />
                  {col.orders.length > 0 && i === 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white animate-pulse" style={{ backgroundColor: col.color }}>NEW</span>
                  )}
                </div>
                <p className="text-2xl md:text-3xl font-bold" style={{ color: col.color }}>{col.orders.length}</p>
                <p className="text-xs text-gray-400 mt-0.5">{col.title}</p>
              </div>
            );
          })}
        </div>

        {/* 3-column kanban */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {columns.map((col, i) => {
            const Icon = col.icon;
            return (
              <div key={i} className="kitchen-column">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b" style={{ borderColor: `${col.color}30` }}>
                  <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${col.color}15` }}>
                    <Icon className="w-4 h-4" style={{ color: col.color }} />
                  </div>
                  <h2 className="text-base font-bold" style={{ color: col.color }}>{col.title}</h2>
                  <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: col.color }}>{col.orders.length}</span>
                </div>
                <div className="space-y-3">
                  {col.orders.map((order) => (
                    <OrderCard key={order.orderId} order={order} col={col} onAction={updateOrderStatus} t={t} />
                  ))}
                  {col.orders.length === 0 && (
                    <div className="text-center py-10 glass-card rounded-xl border-dashed" style={{ borderColor: `${col.color}30`, borderWidth: '2px' }}>
                      <Utensils className="w-8 h-8 mx-auto mb-2" style={{ color: `${col.color}40` }} />
                      <p className="text-sm text-gray-300">{col.emptyMsg}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
};
