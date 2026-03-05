import jsPDF from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import i18n from '../i18n';

const getT = (key, fallback) => {
  const val = i18n.t(key);
  return val === key ? (fallback || key) : val;
};

export const generateInvoicePDF = (order, restaurant) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(restaurant.restaurantName || 'SmartDine India', pageWidth / 2, 20, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  if (restaurant.address) doc.text(restaurant.address, pageWidth / 2, 28, { align: 'center' });
  if (restaurant.contactNumber) doc.text(`${getT('invoice.phone', 'Phone')}: ${restaurant.contactNumber}`, pageWidth / 2, 34, { align: 'center' });
  if (restaurant.GSTNumber) doc.text(`${getT('invoice.gst_label', 'GST')}: ${restaurant.GSTNumber}`, pageWidth / 2, 40, { align: 'center' });

  const startY = restaurant.GSTNumber ? 46 : restaurant.contactNumber ? 40 : restaurant.address ? 34 : 28;
  doc.setDrawColor(200);
  doc.line(14, startY, pageWidth - 14, startY);

  // Invoice title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(getT('invoice.title', 'INVOICE'), pageWidth / 2, startY + 10, { align: 'center' });

  // Order info
  const infoY = startY + 18;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`${getT('invoice.invoice_no', 'Invoice No')}: ${order.orderId}`, 14, infoY);
  doc.text(`${getT('invoice.date', 'Date')}: ${new Date(order.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}`, pageWidth - 14, infoY, { align: 'right' });
  doc.text(`${getT('invoice.table', 'Table')}: ${order.tableNumber}`, 14, infoY + 6);
  doc.text(`${getT('invoice.customer', 'Customer')}: ${order.customerName || 'Guest'}`, 14, infoY + 12);
  if (order.paymentMode) doc.text(`${getT('invoice.payment_mode', 'Payment')}: ${order.paymentMode}`, pageWidth - 14, infoY + 6, { align: 'right' });

  // Items table
  const items = (order.items || []).map((item, i) => [
    i + 1,
    item.name,
    item.quantity,
    `Rs ${item.price}`,
    `Rs ${item.price * item.quantity}`
  ]);

  autoTable(doc, {
    startY: infoY + 20,
    head: [[getT('invoice.hash', '#'), getT('invoice.item', 'Item'), getT('invoice.qty', 'Qty'), getT('invoice.price', 'Price'), getT('invoice.total', 'Total')]],
    body: items,
    theme: 'striped',
    headStyles: { fillColor: [230, 81, 0], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 10, cellPadding: 4 },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      2: { cellWidth: 16, halign: 'center' },
      3: { halign: 'right' },
      4: { halign: 'right', fontStyle: 'bold' }
    }
  });

  // Totals
  let yPos = doc.lastAutoTable.finalY + 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`${getT('invoice.subtotal', 'Subtotal')}:`, pageWidth - 70, yPos);
  doc.text(`Rs ${order.totalAmount}`, pageWidth - 14, yPos, { align: 'right' });

  if (order.discount > 0) {
    yPos += 7;
    doc.setTextColor(22, 163, 74);
    doc.text(`${getT('invoice.points_discount', 'Points Discount')} (${order.pointsUsed} ${getT('invoice.pts', 'pts')}):`, pageWidth - 70, yPos);
    doc.text(`-Rs ${order.discount}`, pageWidth - 14, yPos, { align: 'right' });
    doc.setTextColor(0);
  }

  // GST
  if (order.sgstAmount > 0 || order.cgstAmount > 0) {
    yPos += 7;
    doc.text(`${getT('billing.sgst', 'SGST')} (${order.sgstPercent || 2.5}%):`, pageWidth - 70, yPos);
    doc.text(`+Rs ${order.sgstAmount || 0}`, pageWidth - 14, yPos, { align: 'right' });
    yPos += 7;
    doc.text(`${getT('billing.cgst', 'CGST')} (${order.cgstPercent || 2.5}%):`, pageWidth - 70, yPos);
    doc.text(`+Rs ${order.cgstAmount || 0}`, pageWidth - 14, yPos, { align: 'right' });
  }

  yPos += 8;
  doc.setDrawColor(200);
  doc.line(pageWidth - 80, yPos - 2, pageWidth - 14, yPos - 2);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`${getT('invoice.grand_total', 'Total')}:`, pageWidth - 70, yPos + 5);
  doc.text(`Rs ${order.finalAmount || order.totalAmount}`, pageWidth - 14, yPos + 5, { align: 'right' });

  // Footer
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(130);
  doc.text(getT('invoice.thank_you', 'Thank you for dining with us!'), pageWidth / 2, yPos + 20, { align: 'center' });
  if (restaurant.UPI_ID) doc.text(`UPI: ${restaurant.UPI_ID}`, pageWidth / 2, yPos + 26, { align: 'center' });

  return doc;
};

export const viewInvoice = async (orderId, api) => {
  try {
    const res = await api.get(`/orders/invoice/${orderId}`);
    const { order, restaurant } = res.data;
    const doc = generateInvoicePDF(order, restaurant);
    const pdfBlob = doc.output('blob');
    const url = URL.createObjectURL(pdfBlob);
    window.open(url, '_blank');
    return true;
  } catch (error) {
    console.error('Invoice view failed:', error);
    return false;
  }
};

export const downloadInvoice = async (orderId, api) => {
  try {
    const res = await api.get(`/orders/invoice/${orderId}`);
    const { order, restaurant } = res.data;
    const doc = generateInvoicePDF(order, restaurant);
    doc.save(`Invoice_${orderId}.pdf`);
    return true;
  } catch (error) {
    console.error('Invoice download failed:', error);
    return false;
  }
};
