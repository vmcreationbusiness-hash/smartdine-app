import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useSocket } from '../contexts/SocketContext';
import api from '../utils/api';
import { downloadInvoice, viewInvoice } from '../utils/invoiceGenerator';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { ArrowLeft, CreditCard, Clock, CheckCircle, FileText, ChefHat, Utensils } from 'lucide-react';
import { formatCurrency, formatDate, getStatusColor, getPaymentStatusColor } from '../utils/helpers';

const STATUS_STEPS = ['Ordered', 'Preparing', 'Ready'];
const STATUS_ICONS = { Ordered: Clock, Preparing: ChefHat, Ready: CheckCircle };

const OrderProgress = ({ status, theme }) => {
  const idx = STATUS_STEPS.indexOf(status);
  return (
    <div className="flex items-center gap-1 my-3">
      {STATUS_STEPS.map((step, i) => {
        const Icon = STATUS_ICONS[step];
        const done = i <= idx;
        const active = i === idx;
        return (
          <div key={step} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-shrink-0">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${done ? 'text-white' : 'bg-gray-100 text-gray-300'} ${active ? 'ring-4' : ''}`}
                style={done ? { backgroundColor: active ? theme.primaryColor : '#16a34a', ringColor: `${theme.primaryColor}30` } : {}}
              >
                <Icon className="w-3.5 h-3.5" />
              </div>
              <span className={`text-[9px] mt-1 font-semibold ${done ? 'text-gray-600' : 'text-gray-300'}`}>{step}</span>
            </div>
            {i < STATUS_STEPS.length - 1 && (
              <div className="flex-1 h-0.5 mx-1 rounded-full mb-4 transition-all" style={{ backgroundColor: i < idx ? '#16a34a' : '#e5e7eb' }} />
            )}
          </div>
        );
      })}
    </div>
  );
};

export const CustomerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const socket = useSocket();

  useEffect(() => { fetchOrders(); }, []);

  useEffect(() => {
    if (socket) {
      const handleUpdate = (updatedOrder) => {
        setOrders(prev => prev.map(o => o.orderId === updatedOrder.orderId ? updatedOrder : o));
        if (updatedOrder.orderStatus === 'Ready') {
          toast.success(`🍽️ Order ${updatedOrder.orderId} is ready! Time to pay.`, { duration: 6000 });
        } else if (updatedOrder.orderStatus === 'Preparing') {
          toast.info(`👨‍🍳 Your order is now being prepared!`, { duration: 4000 });
        }
      };
      socket.on('orderPreparing', handleUpdate);
      socket.on('orderReady', handleUpdate);
      socket.on('paymentCompleted', handleUpdate);
      return () => {
        socket.off('orderPreparing', handleUpdate);
        socket.off('orderReady', handleUpdate);
        socket.off('paymentCompleted', handleUpdate);
      };
    }
  }, [socket]);

  const fetchOrders = async () => {
    try { const res = await api.get('/orders/my-orders'); setOrders(res.data); }
    catch { toast.error('Failed to load orders'); }
    finally { setLoading(false); }
  };

  const handleViewInvoice = async (orderId) => {
    const ok = await viewInvoice(orderId, api);
    if (!ok) toast.error('Failed to generate invoice');
  };

  const handleDownloadInvoice = async (orderId) => {
    const ok = await downloadInvoice(orderId, api);
    if (ok) toast.success('Invoice downloaded!');
    else toast.error('Failed to generate invoice');
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin mx-auto mb-3" style={{ borderColor: `${theme.primaryColor}40`, borderTopColor: theme.primaryColor }}></div>
        <p style={{ color: theme.secondaryColor }}>{t('common.loading')}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <header className="glass-header sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate('/customer/menu')} className="p-2 rounded-xl hover:bg-white/50 transition-colors" data-testid="back-to-menu-button">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl md:text-2xl font-bold" style={{ color: theme.primaryColor }}>{t('orders.title')}</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto w-full px-4 py-6">
        {orders.length === 0 ? (
          <div className="text-center py-16 animate-fade-in-up">
            <Utensils className="w-20 h-20 mx-auto mb-4" style={{ color: `${theme.primaryColor}30` }} />
            <h2 className="text-2xl font-bold mb-2">{t('orders.no_orders')}</h2>
            <p className="text-gray-400 mb-6">{t('orders.start_ordering')}</p>
            <Button onClick={() => navigate('/customer/menu')} className="text-white rounded-xl px-8 h-12 btn-premium" style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})` }} data-testid="browse-menu-button">{t('cart.browse_menu')}</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.orderId} className="glass-card rounded-2xl p-5 animate-fade-in-up" data-testid={`order-${order.orderId}`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-lg font-bold">{order.orderId}</h3>
                    <p className="text-xs text-gray-400">{formatDate(order.createdAt)}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{t('orders.table')}: <span className="font-bold" style={{ color: theme.primaryColor }}>Table {order.tableNumber}</span></p>
                  </div>
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getPaymentStatusColor(order.paymentStatus)}`}>
                    {order.paymentStatus}
                  </span>
                </div>

                {/* Progress Bar */}
                {order.paymentStatus !== 'Paid' && (
                  <OrderProgress status={order.orderStatus} theme={theme} />
                )}

                {/* Items */}
                <div className="border-t pt-3 mb-3 space-y-1" style={{ borderColor: `${theme.primaryColor}10` }}>
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm py-0.5">
                      <span className="text-gray-500">{item.name} × {item.quantity}</span>
                      <span className="font-semibold">{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: `${theme.primaryColor}10` }}>
                  <div>
                    <p className="text-xs text-gray-400">{t('orders.total_amount')}</p>
                    <p className="text-xl font-bold" style={{ color: theme.primaryColor }}>{formatCurrency(order.finalAmount || order.totalAmount)}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    {order.orderStatus === 'Ready' && order.paymentStatus === 'Unpaid' && (
                      <Button
                        onClick={() => navigate(`/customer/payment/${order.orderId}`, { state: { order } })}
                        className="text-white rounded-xl px-5 h-10 btn-premium animate-pulse"
                        style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})` }}
                        data-testid={`pay-now-${order.orderId}`}
                      >
                        <CreditCard className="w-4 h-4 mr-1.5" /> {t('orders.pay_now')}
                      </Button>
                    )}
                    {order.paymentStatus === 'Paid' && (
                      <>
                        <div className="flex items-center gap-1.5 text-green-600 mr-1">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-sm font-semibold">Paid</span>
                        </div>
                        <Button onClick={() => handleViewInvoice(order.orderId)} variant="outline" size="sm" className="rounded-lg h-8 text-xs" data-testid={`view-invoice-${order.orderId}`}>
                          <FileText className="w-3.5 h-3.5 mr-1" /> {t('billing.view')}
                        </Button>
                        <Button onClick={() => handleDownloadInvoice(order.orderId)} variant="outline" size="sm" className="rounded-lg h-8 text-xs" data-testid={`download-invoice-${order.orderId}`}>
                          <FileText className="w-3.5 h-3.5 mr-1" /> {t('billing.save')}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
