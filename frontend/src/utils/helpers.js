export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0
  }).format(amount);
};

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const getStatusColor = (status) => {
  const colors = {
    Ordered: 'bg-orange-100 text-orange-800 border-orange-300',
    Preparing: 'bg-amber-100 text-amber-800 border-amber-300',
    Ready: 'bg-green-100 text-green-800 border-green-300',
    Delivered: 'bg-blue-100 text-blue-800 border-blue-300'
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

export const getPaymentStatusColor = (status) => {
  return status === 'Paid'
    ? 'bg-green-100 text-green-800 border-green-300'
    : 'bg-red-100 text-red-800 border-red-300';
};
