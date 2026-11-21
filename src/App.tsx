import { lazy, Suspense, useCallback, useEffect, useState, type ReactNode } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { AccountStatusProvider } from "./contexts/AccountStatusContext";
import { ThemeProvider, useTheme } from "./contexts/ThemeContext";
import { CartProvider } from "./contexts/CartContext";
import { AccountStatusProvider } from "./contexts/AccountStatusContext";
import { SubscriptionGuard } from "./components/SubscriptionGuard";
import { ProFeatureGate } from "./components/ProFeatureGate";
import { AppShell } from "./components/AppShell";
import { DesktopLayoutProvider } from "./hooks/useDesktopLayout";
import { SellaSplash } from "./components/SellaSplash";
import { DesktopSplash } from "./components/DesktopSplash";
import { isDesktopApp, isNativeApp } from "./lib/platform";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ConfigGate } from "./components/ConfigGate";
import { Analytics } from "./components/marketing/Analytics";
import { Capacitor } from "@capacitor/core";

// Eagerly loaded core routes
import AuthPage from "./pages/Auth";
import DashboardPage from "./pages/Dashboard";
import LandingPage from "./pages/LandingPage";

// Code-split routes loaded on demand
const AddDebtPage = lazy(() => import("./pages/AddDebt"));
const DebtsPage = lazy(() => import("./pages/Debts"));
const SalesPage = lazy(() => import("./pages/Sales"));
const InventoryPage = lazy(() => import("./pages/Inventory"));
const InstallPage = lazy(() => import("./pages/Install"));
const ClientsPage = lazy(() => import("./pages/Clients"));
const InboxPage = lazy(() => import("./pages/Inbox"));
const BillingPage = lazy(() => import("./pages/Billing"));
const SubscribePage = lazy(() => import("./pages/Subscribe"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPassword"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPassword"));
const ImportCustomersPage = lazy(() => import("./pages/ImportCustomers"));
const ImportInventoryPage = lazy(() => import("./pages/ImportInventory"));
const AccountPage = lazy(() => import("./pages/Account"));
const SyncConflictsPage = lazy(() => import("./pages/SyncConflicts"));
const AdminPaymentsPage = lazy(() => import("./pages/AdminPayments"));
const AdminDashboardPage = lazy(() => import("./pages/AdminDashboard"));
const NotificationsPage = lazy(() => import("./pages/Notifications"));
const StaffManagementPage = lazy(() => import("./pages/StaffManagement"));
const LegalTermsPage = lazy(() => import("./pages/LegalTerms"));
const PrivacyPolicyPage = lazy(() => import("./pages/PrivacyPolicy"));
const DocumentationPage = lazy(() => import("./pages/DocumentationPage"));
const FeaturesPage = lazy(() => import("./pages/marketing/FeaturesPage"));
const BenefitsPage = lazy(() => import("./pages/marketing/BenefitsPage"));
const HowItWorksPage = lazy(() => import("./pages/marketing/HowItWorksPage"));
const PricingPage = lazy(() => import("./pages/marketing/PricingPage"));
const DownloadPage = lazy(() => import("./pages/marketing/DownloadPage"));
const AboutPage = lazy(() => import("./pages/marketing/AboutPage"));
const ContactPage = lazy(() => import("./pages/marketing/ContactPage"));
const SupportPage = lazy(() => import("./pages/marketing/SupportPage"));
const FaqPage = lazy(() => import("./pages/marketing/FaqPage"));
const DeleteAccountRequestPage = lazy(() => import("./pages/DeleteAccountRequest"));
const MorePage = lazy(() => import("./pages/More"));
const ReceiptSettingsPage = lazy(() => import("./pages/ReceiptSettings"));
const AssistantPage = lazy(() => import("./pages/Assistant"));
const MarketplacePage = lazy(() => import("./pages/Marketplace"));
const StoreProfilePage = lazy(() => import("./pages/StoreProfile"));
const CustomerOrdersPage = lazy(() => import("./pages/CustomerOrders"));
const OrdersPage = lazy(() => import("./pages/Orders"));
const NotFound = lazy(() => import("./pages/NotFound"));

function PageFallback() {
  return (
    <div className="min-h-screen sella-hero-bg flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#1A6FFF]/25 border-t-[#1A6FFF] rounded-full animate-spin" />
    </div>
  );
}

const queryClient = new QueryClient();

const SPLASH_KEY = "sella_splash_seen_v9_capital_Sella";

function ThemedToasts() {
  const { appearance } = useTheme();
  return <Sonner position="top-center" richColors theme={appearance} />;
}

function DesktopBoot({ children }: { children: ReactNode }) {
  const desktop = isDesktopApp();
  const { isLoading } = useAuth();
  const [minElapsed, setMinElapsed] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!desktop) return;
    setMinElapsed(false);
    setGaveUp(false);
    const min = window.setTimeout(() => setMinElapsed(true), 700);
    const max = window.setTimeout(() => setGaveUp(true), 8000);
    return () => {
      window.clearTimeout(min);
      window.clearTimeout(max);
    };
  }, [desktop, attempt]);

  if (!desktop) return <>{children}</>;

  const ready = minElapsed && !isLoading;
  if (!ready && !gaveUp) return <DesktopSplash />;
  if (!ready && gaveUp && isLoading) {
    return (
      <DesktopSplash
        failed
        onRetry={() => {
          setAttempt((n) => n + 1);
          window.location.reload();
        }}
      />
    );
  }
  return <>{children}</>;
}

const App = () => {
  const [showSplash, setShowSplash] = useState(() => {
    // Only native mobile app requires the full boot splash; web pages (landing, docs, privacy, subscribe) load instantly
    if (!Capacitor.isNativePlatform()) {
      return false;
    }
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
        <DesktopBoot>
        <DesktopLayoutProvider>
        <CartProvider>
        <AccountStatusProvider>
        <BrowserRouter>
          <Analytics />
          <SubscriptionGuard>
            <Suspense fallback={<PageFallback />}>
              <Routes>
                <Route
                  path="/"
                  element={
                    isNativeApp() || isDesktopApp() ? (
                      <AuthPage />
                    ) : (
                      <LandingPage />
                    )
                  }
                />
                <Route path="/marketplace" element={<MarketplacePage />} />
                <Route path="/store/:shopCode" element={<StoreProfilePage />} />
                <Route path="/orders" element={<CustomerOrdersPage />} />
                <Route path="/orders/:orderId" element={<CustomerOrdersPage />} />
                <Route path="/app" element={<AuthPage />} />
                <Route path="/login" element={<AuthPage />} />
                <Route path="/docs" element={<DocumentationPage />} />
                <Route path="/features" element={<FeaturesPage />} />
                <Route path="/benefits" element={<BenefitsPage />} />
                <Route path="/how-it-works" element={<HowItWorksPage />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/download" element={<DownloadPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/support" element={<SupportPage />} />
                <Route path="/faq" element={<FaqPage />} />
                <Route path="/delete-account" element={<DeleteAccountRequestPage />} />
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
                  <Route path="/orders-manage" element={<ErrorBoundary label="orders"><OrdersPage /></ErrorBoundary>} />
                  <Route path="/more" element={<MorePage />} />
                  <Route path="/assistant" element={<ProFeatureGate feature="Ask the Shop"><AssistantPage /></ProFeatureGate>} />
                  <Route path="/clients" element={<ClientsPage />} />
                  <Route path="/inbox" element={<InboxPage />} />
                  <Route path="/add-debt" element={<ErrorBoundary label="sale"><AddDebtPage /></ErrorBoundary>} />
                  <Route path="/new-sale" element={<ErrorBoundary label="sale"><AddDebtPage /></ErrorBoundary>} />
                  <Route path="/receipt-settings" element={<ReceiptSettingsPage />} />
                  <Route path="/account" element={<AccountPage />} />
                  <Route path="/staff" element={<ErrorBoundary label="staff"><StaffManagementPage /></ErrorBoundary>} />
                  <Route path="/sync-conflicts" element={<ErrorBoundary label="sync-conflicts"><SyncConflictsPage /></ErrorBoundary>} />
                  <Route path="/subscribe" element={<ErrorBoundary label="subscribe"><SubscribePage /></ErrorBoundary>} />
                  <Route path="/billing" element={<BillingPage />} />
                  <Route path="/import-customers" element={<ProFeatureGate feature="Customer import"><ImportCustomersPage /></ProFeatureGate>} />
                  <Route path="/import-inventory" element={<ProFeatureGate feature="Product import"><ImportInventoryPage /></ProFeatureGate>} />
                  <Route path="/admin/payments" element={<AdminPaymentsPage />} />
                  <Route path="/admin" element={<AdminDashboardPage />} />
                  <Route path="/notifications" element={<NotificationsPage />} />
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </SubscriptionGuard>
        </BrowserRouter>
        </AccountStatusProvider>
        </CartProvider>
        </DesktopLayoutProvider>
        </DesktopBoot>
      </AuthProvider>
      </ConfigGate>
    </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
  </ErrorBoundary>
  );
};

export default App;
