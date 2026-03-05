import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { Toaster } from './components/ui/sonner';
import { LanguageSwitcher } from './components/LanguageSwitcher';

import { RoleSelection } from './pages/RoleSelection';
import { CustomerLanding } from './pages/CustomerLanding';
import { KitchenLanding } from './pages/KitchenLanding';
import { ManagerLanding } from './pages/ManagerLanding';
import { StaffRegister } from './pages/StaffRegister';
import { CustomerMenu } from './pages/CustomerMenu';
import { CustomerOrders } from './pages/CustomerOrders';
import { Payment } from './pages/Payment';
import { KitchenDashboard } from './pages/KitchenDashboard';
import { ManagerDashboard } from './pages/ManagerDashboard';
import { ManagerOrders } from './pages/ManagerOrders';
import { ManagerMenu } from './pages/ManagerMenu';
import { ManagerReports } from './pages/ManagerReports';
import { RestaurantSettings } from './pages/RestaurantSettings';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RoleSelection />} />
      <Route path="/customer" element={<CustomerLanding />} />
      <Route path="/kitchen" element={<KitchenLanding />} />
      <Route path="/manager" element={<ManagerLanding />} />
      <Route path="/staff-register" element={<StaffRegister />} />

      <Route path="/customer/menu" element={<ProtectedRoute allowedRoles={['customer']}><CustomerMenu /></ProtectedRoute>} />
      <Route path="/customer/orders" element={<ProtectedRoute allowedRoles={['customer']}><CustomerOrders /></ProtectedRoute>} />
      <Route path="/customer/payment/:orderId" element={<ProtectedRoute allowedRoles={['customer', 'manager']}><Payment /></ProtectedRoute>} />

      <Route path="/kitchen/orders" element={<ProtectedRoute allowedRoles={['kitchen']}><KitchenDashboard /></ProtectedRoute>} />

      <Route path="/manager/dashboard" element={<ProtectedRoute allowedRoles={['manager']}><ManagerDashboard /></ProtectedRoute>} />
      <Route path="/manager/orders" element={<ProtectedRoute allowedRoles={['manager']}><ManagerOrders /></ProtectedRoute>} />
      <Route path="/manager/menu" element={<ProtectedRoute allowedRoles={['manager']}><ManagerMenu /></ProtectedRoute>} />
      <Route path="/manager/reports" element={<ProtectedRoute allowedRoles={['manager']}><ManagerReports /></ProtectedRoute>} />
      <Route path="/manager/settings" element={<ProtectedRoute allowedRoles={['manager']}><RestaurantSettings /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <SocketProvider>
            <BrowserRouter>
              <AppRoutes />
              <LanguageSwitcher />
              <Toaster position="top-right" />
            </BrowserRouter>
          </SocketProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
