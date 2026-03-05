import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import api from '../utils/api';
import { downloadInvoice, viewInvoice } from '../utils/invoiceGenerator';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import { ArrowLeft, Calendar, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { formatCurrency, formatDate, getPaymentStatusColor } from '../utils/helpers';

export const ManagerReports = () => {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => { fetchReport(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await api.get('/manager/reports/daily', { params: { startDate, endDate } });
      setStats(res.data); setOrders(res.data.orders || []);
    } catch { toast.error('Failed to load report'); }
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

  const toggleExpand = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="glass-header sticky top-0 z-20">
        <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate('/manager/dashboard')} className="p-2 rounded-xl hover:bg-white/50 transition-colors" data-testid="back-button"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-xl md:text-2xl font-bold" style={{ color: theme.primaryColor }}>{t('reports.title')}</h1>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto w-full px-4 py-6 space-y-5">
        <div className="glass-card rounded-2xl p-4 flex gap-3 items-center flex-wrap">
          <Calendar className="w-4 h-4" style={{ color: theme.primaryColor }} />
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="flex-1 min-w-[140px] rounded-xl glass-input h-10" data-testid="start-date" />
          <span className="text-gray-400 text-sm">to</span>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="flex-1 min-w-[140px] rounded-xl glass-input h-10" data-testid="end-date" />
          <Button onClick={fetchReport} className="text-white rounded-xl btn-premium" style={{ backgroundColor: theme.primaryColor }} data-testid="generate-report">{t('reports.generate')}</Button>
        </div>

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
            {[
              { label: t('manager.total_orders'), value: stats.totalOrders, color: theme.primaryColor },
              { label: t('manager.paid_orders'), value: stats.paidOrders, color: '#16a34a' },
              { label: t('manager.unpaid_orders'), value: stats.unpaidOrders, color: '#dc2626' },
              { label: t('manager.total_revenue'), value: formatCurrency(stats.totalRevenue), color: theme.secondaryColor },
            ].map((s, i) => (
              <div key={i} className="glass-card rounded-2xl p-4 md:p-5" data-testid={`report-stat-${i}`}>
                <p className="text-xs text-gray-400">{s.label}</p>
                <p className="text-2xl md:text-3xl font-bold" style={{ color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b" style={{ borderColor: `${theme.primaryColor}10`, backgroundColor: `${theme.primaryColor}05` }}>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{t('payment.order_id')}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 hidden md:table-cell">{t('manager_orders.customer')}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 hidden md:table-cell">{t('manager_orders.date')}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{t('orders.table')}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{t('manager_orders.amount')}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 hidden sm:table-cell">{t('reports.payment_mode')}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{t('manager_orders.payment')}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <>
                    <tr key={order.orderId} className="border-b last:border-0 hover:bg-white/30 transition-colors cursor-pointer" style={{ borderColor: `${theme.primaryColor}08` }} onClick={() => toggleExpand(order.orderId)} data-testid={`report-order-${order.orderId}`}>
                      <td className="px-4 py-3 text-sm font-semibold flex items-center gap-1.5">
                        {expandedOrder === order.orderId ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
                        {order.orderId}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400 hidden md:table-cell">{order.customerName}</td>
                      <td className="px-4 py-3 text-xs text-gray-400 hidden md:table-cell">{formatDate(order.createdAt)}</td>
                      <td className="px-4 py-3 text-sm font-bold" style={{ color: theme.primaryColor }}>{order.tableNumber}</td>
                      <td className="px-4 py-3 text-sm font-bold">{formatCurrency(order.finalAmount || order.totalAmount)}</td>
                      <td className="px-4 py-3 text-sm text-gray-400 hidden sm:table-cell">{order.paymentMode || '-'}</td>
                      <td className="px-4 py-3"><span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getPaymentStatusColor(order.paymentStatus)}`}>{order.paymentStatus}</span></td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        {order.paymentStatus === 'Paid' && (
                          <div className="flex gap-1">
                            <Button onClick={() => handleViewInvoice(order.orderId)} variant="outline" size="sm" className="rounded-lg h-7 text-[10px]" data-testid={`view-invoice-${order.orderId}`}>
                              <FileText className="w-3 h-3 mr-1" /> View
                            </Button>
                            <Button onClick={() => handleDownloadInvoice(order.orderId)} variant="outline" size="sm" className="rounded-lg h-7 text-[10px]" data-testid={`download-invoice-${order.orderId}`}>
                              <FileText className="w-3 h-3 mr-1" /> Save
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                    {expandedOrder === order.orderId && (
                      <tr key={`${order.orderId}-detail`}>
                        <td colSpan="8" className="px-6 py-3" style={{ backgroundColor: `${theme.primaryColor}03` }}>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs font-semibold text-gray-500 mb-2">{t('manager_orders.items')}</p>
                              {order.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between text-sm py-0.5">
                                  <span className="text-gray-500">{item.name} x {item.quantity}</span>
                                  <span className="font-semibold">{formatCurrency(item.price * item.quantity)}</span>
                                </div>
                              ))}
                            </div>
                            <div className="text-sm space-y-1">
                              <div className="flex justify-between"><span className="text-gray-400">Subtotal</span><span className="font-semibold">{formatCurrency(order.totalAmount)}</span></div>
                              {order.discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-{formatCurrency(order.discount)}</span></div>}
                              <div className="flex justify-between font-bold border-t pt-1" style={{ borderColor: `${theme.primaryColor}10` }}><span>Total</span><span style={{ color: theme.primaryColor }}>{formatCurrency(order.finalAmount || order.totalAmount)}</span></div>
                              {order.pointsEarned > 0 && <div className="text-xs text-gray-400">Points earned: {order.pointsEarned}</div>}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
          {orders.length === 0 && !loading && <div className="text-center py-12 text-gray-400">{t('reports.no_orders')}</div>}
        </div>
      </main>
    </div>
  );
};
