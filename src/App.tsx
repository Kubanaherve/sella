import { useCallback, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { SubscriptionGuard } from "./components/SubscriptionGuard";
import { AppShell } from "./components/AppShell";
import { SellaSplash } from "./components/SellaSplash";
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
import LegalTermsPage from "./pages/LegalTerms";
import PrivacyPolicyPage from "./pages/PrivacyPolicy";
import MorePage from "./pages/More";
import ReceiptSettingsPage from "./pages/ReceiptSettings";
import AssistantPage from "./pages/Assistant";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const SPLASH_KEY = "sella_splash_seen_v2_neon";

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
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        {showSplash && <SellaSplash onDone={finishSplash} />}
        <Toaster />
        <Sonner position="top-center" richColors />
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
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/debts" element={<DebtsPage />} />
                <Route path="/sales" element={<SalesPage />} />
                <Route path="/inventory" element={<InventoryPage />} />
                <Route path="/more" element={<MorePage />} />
                <Route path="/assistant" element={<AssistantPage />} />
                <Route path="/clients" element={<ClientsPage />} />
                <Route path="/inbox" element={<InboxPage />} />
                <Route path="/add-debt" element={<AddDebtPage />} />
                <Route path="/new-sale" element={<AddDebtPage />} />
                <Route path="/receipt-settings" element={<ReceiptSettingsPage />} />
                <Route path="/account" element={<AccountPage />} />
                <Route path="/subscribe" element={<SubscribePage />} />
                <Route path="/billing" element={<BillingPage />} />
                <Route path="/import-customers" element={<ImportCustomersPage />} />
                <Route path="/import-inventory" element={<ImportInventoryPage />} />
                <Route path="/admin/payments" element={<AdminPaymentsPage />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </SubscriptionGuard>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
