import { useCallback, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider, useTheme } from "./contexts/ThemeContext";
import { SubscriptionGuard } from "./components/SubscriptionGuard";
import { AppShell } from "./components/AppShell";
import { SellaSplash } from "./components/SellaSplash";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ConfigGate } from "./components/ConfigGate";
import AuthPage from "./pages/Auth";
import DashboardPage from "./pages/Dashboard";
import AddDebtPage from "./pages/AddDebt";
import DebtsPage from "./pages/Debts";
import SalesPage from "./pages/Sales";
import InventoryPage from "./pages/Inventory";
import InstallPage from "./pages/Install";
import ClientsPage from "./pages/Clients";
import InboxPage from "./pages/Inbox";
import BillingPage from "./pages/Billing";
import SubscribePage from "./pages/Subscribe";
import ForgotPasswordPage from "./pages/ForgotPassword";
import ResetPasswordPage from "./pages/ResetPassword";
import ImportCustomersPage from "./pages/ImportCustomers";
import ImportInventoryPage from "./pages/ImportInventory";
import AccountPage from "./pages/Account";
import AdminPaymentsPage from "./pages/AdminPayments";
import AdminDashboardPage from "./pages/AdminDashboard";
import NotificationsPage from "./pages/Notifications";
import LegalTermsPage from "./pages/LegalTerms";
import PrivacyPolicyPage from "./pages/PrivacyPolicy";
import MorePage from "./pages/More";
import ReceiptSettingsPage from "./pages/ReceiptSettings";
import AssistantPage from "./pages/Assistant";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const SPLASH_KEY = "sella_splash_seen_v9_capital_Sella";

function ThemedToasts() {
  const { appearance } = useTheme();
  return <Sonner position="top-center" richColors theme={appearance} />;
}

const App = () => {
  const [showSplash, setShowSplash] = useState(() => {
    try {
      return sessionStorage.getItem(SPLASH_KEY) !== "1";
    } catch {
      return true;
    }
  });

  const finishSplash = useCallback(() => {
    try {
      sessionStorage.setItem(SPLASH_KEY, "1");
    } catch {
      /* ignore */
    }
    setShowSplash(false);
  }, []);

  return (
  <ErrorBoundary label="root">
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
    <TooltipProvider>
      <ConfigGate>
      <AuthProvider>
        {showSplash && <SellaSplash onDone={finishSplash} />}
        <Toaster />
        <ThemedToasts />
        <BrowserRouter>
          <SubscriptionGuard>
            <Routes>
              <Route path="/" element={<AuthPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/terms" element={<LegalTermsPage />} />
              <Route path="/privacy" element={<PrivacyPolicyPage />} />
              <Route path="/install" element={<InstallPage />} />

              <Route element={<AppShell />}>
                <Route path="/dashboard" element={<ErrorBoundary label="dashboard"><DashboardPage /></ErrorBoundary>} />
                <Route path="/debts" element={<ErrorBoundary label="debts"><DebtsPage /></ErrorBoundary>} />
                <Route path="/sales" element={<ErrorBoundary label="sales"><SalesPage /></ErrorBoundary>} />
                <Route path="/inventory" element={<ErrorBoundary label="inventory"><InventoryPage /></ErrorBoundary>} />
                <Route path="/more" element={<MorePage />} />
                <Route path="/assistant" element={<AssistantPage />} />
                <Route path="/clients" element={<ClientsPage />} />
                <Route path="/inbox" element={<InboxPage />} />
                <Route path="/add-debt" element={<ErrorBoundary label="sale"><AddDebtPage /></ErrorBoundary>} />
                <Route path="/new-sale" element={<ErrorBoundary label="sale"><AddDebtPage /></ErrorBoundary>} />
                <Route path="/receipt-settings" element={<ReceiptSettingsPage />} />
                <Route path="/account" element={<AccountPage />} />
                <Route path="/subscribe" element={<ErrorBoundary label="subscribe"><SubscribePage /></ErrorBoundary>} />
                <Route path="/billing" element={<BillingPage />} />
                <Route path="/import-customers" element={<ImportCustomersPage />} />
                <Route path="/import-inventory" element={<ImportInventoryPage />} />
                <Route path="/admin/payments" element={<AdminPaymentsPage />} />
                <Route path="/admin" element={<AdminDashboardPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </SubscriptionGuard>
        </BrowserRouter>
      </AuthProvider>
      </ConfigGate>
    </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
  </ErrorBoundary>
  );
};

export default App;
