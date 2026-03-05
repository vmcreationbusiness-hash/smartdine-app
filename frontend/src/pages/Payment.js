import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { downloadInvoice, viewInvoice } from '../utils/invoiceGenerator';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { ArrowLeft, Smartphone, FileText } from 'lucide-react';
import { formatCurrency } from '../utils/helpers';

export const Payment = () => {
  const { orderId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [order, setOrder] = useState(location.state?.order || null);
  const [loading, setLoading] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);

  const isManager = user?.role === 'manager';
  const backPath = isManager ? '/manager/orders' : '/customer/orders';

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    document.body.appendChild(script);
    if (!order) fetchOrderDetails();
    return () => { if (document.body.contains(script)) document.body.removeChild(script); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchOrderDetails = async () => {
    try {
      let found;
      if (isManager) {
        const response = await api.get('/manager/orders');
        found = response.data.find(o => o.orderId === orderId);
      } else {
        const response = await api.get('/orders/my-orders');
        found = response.data.find(o => o.orderId === orderId);
      }
      if (found) setOrder(found);
      else { toast.error('Order not found'); navigate(backPath); }
    } catch { toast.error('Failed to load order'); }
  };

  const initiatePayment = async () => {
    if (!razorpayLoaded) { toast.error('Payment system loading...'); return; }
    if (order.orderStatus !== 'Ready') { toast.error('Order must be ready first'); return; }
    setLoading(true);
    try {
      const response = await api.post(`/orders/create-payment-order/${orderId}`);
      const { razorpayOrderId, amount, currency, keyId, demoMode } = response.data;
      if (demoMode) {
        toast.info('Demo: Simulating payment...');
        await new Promise(r => setTimeout(r, 1500));
        await verifyPayment({ razorpay_payment_id: `pay_demo_${Date.now()}`, razorpay_order_id: razorpayOrderId, razorpay_signature: 'demo', demoMode: true });
      } else {
        const rzp = new window.Razorpay({ key: keyId, amount: amount * 100, currency, name: theme.restaurantName, order_id: razorpayOrderId,
          handler: async (r) => { await verifyPayment(r); }, theme: { color: theme.primaryColor }, modal: { ondismiss: () => { setLoading(false); } }
        });
        rzp.open();
      }
    } catch (error) { toast.error(error.response?.data?.error || 'Payment failed'); setLoading(false); }
  };

  const verifyPayment = async (r) => {
    try {
      const res = await api.post(`/orders/verify-payment/${orderId}`, { razorpayPaymentId: r.razorpay_payment_id, razorpayOrderId: r.razorpay_order_id, razorpaySignature: r.razorpay_signature, paymentMode: 'UPI', demoMode: r.demoMode || false });
      const { pointsEarned } = res.data;
      setOrder(res.data.order);
      setPaymentDone(true);
      toast.success(pointsEarned > 0 ? `Paid! Earned ${pointsEarned} points` : 'Payment successful!');
      // Auto-open invoice in new tab
      const ok = await viewInvoice(orderId, api);
      if (!ok) toast.info('You can view invoice using the button below');
    } catch { toast.error('Verification failed'); }
    finally { setLoading(false); }
  };

  const handleDownloadInvoice = async () => {
    const ok = await downloadInvoice(orderId, api);
    if (ok) toast.success('Invoice downloaded!');
    else toast.error('Failed to generate invoice');
  };

  const handleViewInvoice = async () => {
    const ok = await viewInvoice(orderId, api);
    if (!ok) toast.error('Failed to generate invoice');
  };

  const payAmount = order ? (order.finalAmount || order.totalAmount) : 0;

  if (!order) return <div className="min-h-screen flex items-center justify-center"><p>{t('common.loading')}</p></div>;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="glass-header sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(backPath)} className="p-2 rounded-xl hover:bg-white/50 transition-colors" data-testid="back-button"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-xl md:text-2xl font-bold" style={{ color: theme.primaryColor }}>{t('payment.title')}</h1>
        </div>
      </header>
      <main className="max-w-2xl mx-auto w-full px-4 py-6 space-y-4">
        <div className="glass-card rounded-2xl p-6">
          <h2 className="text-lg font-bold mb-4" data-testid="order-summary-heading">{t('payment.order_summary')}</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-400">{t('payment.order_id')}</span><span className="font-semibold">{order.orderId}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">{t('payment.table_number')}</span><span className="font-semibold">{order.tableNumber}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">{t('payment.status')}</span><span className="font-semibold text-green-600">{order.orderStatus}</span></div>
          </div>
          <div className="border-t mt-4 pt-4" style={{ borderColor: `${theme.primaryColor}10` }}>
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm py-0.5">
                <span className="text-gray-500">{item.name} x {item.quantity}</span>
                <span className="font-semibold">{formatCurrency(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="border-t mt-4 pt-4 space-y-2" style={{ borderColor: `${theme.primaryColor}10` }}>
            {order.pointsUsed > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>{t('payment.points_discount', { points: order.pointsUsed })}</span><span>-{formatCurrency(order.discount)}</span>
              </div>
            )}
            {order.sgstAmount > 0 && (
              <div className="flex justify-between text-sm text-gray-500">
                <span>SGST ({order.sgstPercent}%)</span><span>+{formatCurrency(order.sgstAmount)}</span>
              </div>
            )}
            {order.cgstAmount > 0 && (
              <div className="flex justify-between text-sm text-gray-500">
                <span>CGST ({order.cgstPercent}%)</span><span>+{formatCurrency(order.cgstAmount)}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="font-bold text-lg">{t('payment.total')}</span>
              <span className="text-3xl font-bold" style={{ color: theme.primaryColor }}>{formatCurrency(payAmount)}</span>
            </div>
          </div>
        </div>

        {!paymentDone && order.paymentStatus !== 'Paid' && (
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: `${theme.primaryColor}08` }}>
              <Smartphone className="w-5 h-5" style={{ color: theme.primaryColor }} />
              <div>
                <p className="font-semibold text-sm">{t('payment.upi_card')}</p>
                <p className="text-xs text-gray-400">{t('payment.powered_by')}</p>
              </div>
            </div>
          </div>
        )}

        {paymentDone || order.paymentStatus === 'Paid' ? (
          <div className="space-y-3">
            <div className="glass-card rounded-2xl p-5 text-center">
              <div className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center bg-green-100">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <p className="text-lg font-bold text-green-700" data-testid="payment-success-text">{t('payment.already_paid')}</p>
            </div>
            <Button onClick={handleViewInvoice} className="w-full text-white rounded-xl h-14 text-base font-semibold btn-premium flex items-center justify-center gap-2" style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})` }} data-testid="view-invoice-button">
              <FileText className="w-5 h-5" /> View Invoice
            </Button>
            <Button onClick={handleDownloadInvoice} variant="outline" className="w-full rounded-xl h-12 flex items-center justify-center gap-2" data-testid="download-invoice-button">
              <FileText className="w-5 h-5" /> Save Invoice
            </Button>
            <Button onClick={() => navigate(backPath)} variant="outline" className="w-full rounded-xl h-12" data-testid="back-to-orders-button">
              {t('common.back')}
            </Button>
          </div>
        ) : (
          <>
            <Button onClick={initiatePayment} disabled={loading || order.orderStatus !== 'Ready'} className="w-full text-white rounded-xl h-14 text-base font-semibold btn-premium" style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})` }} data-testid="initiate-payment-button">
              {loading ? t('payment.processing') : `${t('payment.pay', { amount: formatCurrency(payAmount) })}`}
            </Button>
            <p className="text-[10px] text-center text-gray-400">{t('payment.secure')}</p>
          </>
        )}
      </main>
    </div>
  );
};
