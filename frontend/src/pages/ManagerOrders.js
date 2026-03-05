import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import api from '../utils/api';
import { downloadInvoice, viewInvoice } from '../utils/invoiceGenerator';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { ArrowLeft, Filter, CreditCard, FileText } from 'lucide-react';
import { formatCurrency, formatDate, getStatusColor, getPaymentStatusColor } from '../utils/helpers';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";

export const ManagerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => { fetchOrders(); }, [statusFilter, paymentFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchOrders = async () => {
    try {
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (paymentFilter !== 'all') params.paymentStatus = paymentFilter;
      const res = await api.get('/manager/orders', { params });
      setOrders(res.data);
    } catch { toast.error('Failed to load orders'); }
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

  return (
    <div className="min-h-screen flex flex-col">
      <header className="glass-header sticky top-0 z-20">
        <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate('/manager/dashboard')} className="p-2 rounded-xl hover:bg-white/50 transition-colors" data-testid="back-button"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-xl md:text-2xl font-bold" style={{ color: theme.primaryColor }}>{t('manager_orders.title')}</h1>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto w-full px-4 py-6 space-y-4">
        <div className="glass-card rounded-2xl p-4 flex gap-3 items-center flex-wrap">
          <Filter className="w-4 h-4" style={{ color: theme.primaryColor }} />
          <div className="flex-1 min-w-[160px]">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="rounded-xl glass-input" data-testid="status-filter"><SelectValue placeholder={t('manager_orders.order_status')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('manager_orders.all_statuses')}</SelectItem>
                <SelectItem value="Ordered">Ordered</SelectItem>
                <SelectItem value="Preparing">Preparing</SelectItem>
                <SelectItem value="Ready">Ready</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 min-w-[160px]">
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="rounded-xl glass-input" data-testid="payment-filter"><SelectValue placeholder={t('manager_orders.payment')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('manager_orders.all_payments')}</SelectItem>
                <SelectItem value="Paid">Paid</SelectItem>
                <SelectItem value="Unpaid">Unpaid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b" style={{ borderColor: `${theme.primaryColor}10`, backgroundColor: `${theme.primaryColor}05` }}>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{t('payment.order_id')}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 hidden md:table-cell">{t('manager_orders.customer')}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{t('orders.table')}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{t('manager_orders.amount')}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{t('manager_orders.order_status')}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{t('manager_orders.payment')}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{t('manager_orders.date')}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{t('billing.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.orderId} className="border-b last:border-0 hover:bg-white/30 transition-colors" style={{ borderColor: `${theme.primaryColor}08` }} data-testid={`order-row-${order.orderId}`}>
                    <td className="px-4 py-3 text-sm font-semibold">{order.orderId}</td>
                    <td className="px-4 py-3 text-sm text-gray-400 hidden md:table-cell">{order.customerName}</td>
                    <td className="px-4 py-3 text-sm font-bold" style={{ color: theme.primaryColor }}>{order.tableNumber}</td>
                    <td className="px-4 py-3 text-sm font-bold">{formatCurrency(order.finalAmount || order.totalAmount)}</td>
                    <td className="px-4 py-3"><span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusColor(order.orderStatus)}`}>{order.orderStatus}</span></td>
                    <td className="px-4 py-3"><span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getPaymentStatusColor(order.paymentStatus)}`}>{order.paymentStatus}</span></td>
                    <td className="px-4 py-3 text-xs text-gray-400">{formatDate(order.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        {order.orderStatus === 'Ready' && order.paymentStatus === 'Unpaid' && (
                          <Button onClick={() => navigate(`/customer/payment/${order.orderId}`, { state: { order } })} size="sm" className="text-white rounded-lg h-7 text-[10px] btn-premium" style={{ backgroundColor: theme.primaryColor }} data-testid={`pay-${order.orderId}`}>
                            <CreditCard className="w-3 h-3 mr-1" /> {t('billing.pay')}
                          </Button>
                        )}
                        {order.paymentStatus === 'Paid' && (
                          <>
                            <Button onClick={() => handleViewInvoice(order.orderId)} variant="outline" size="sm" className="rounded-lg h-7 text-[10px]" data-testid={`view-invoice-${order.orderId}`}>
                              <FileText className="w-3 h-3 mr-1" /> {t('billing.view')}
                            </Button>
                            <Button onClick={() => handleDownloadInvoice(order.orderId)} variant="outline" size="sm" className="rounded-lg h-7 text-[10px]" data-testid={`download-invoice-${order.orderId}`}>
                              <FileText className="w-3 h-3 mr-1" /> {t('billing.save')}
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {orders.length === 0 && !loading && <div className="text-center py-12 text-gray-400">{t('manager_orders.no_orders')}</div>}
        </div>
      </main>
    </div>
  );
};
