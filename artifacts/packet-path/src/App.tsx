import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import { ReactNode } from "react";
import LoginPage from "@/pages/Login";
import DashboardPage from "@/pages/Dashboard";
import CasesPage from "@/pages/Cases";
import NewCasePage from "@/pages/NewCase";
import CaseWizardPage from "@/pages/CaseWizard";
import CaseReviewPage from "@/pages/CaseReview";
import AdminPage from "@/pages/Admin";
import SecurityPage from "@/pages/Security";
import AuditLogPage from "@/pages/AuditLog";
import ESignaturesPage from "@/pages/ESignatures";
import SignatureTemplatesPage from "@/pages/SignatureTemplates";
import SignatureRequestDetailPage from "@/pages/SignatureRequestDetail";
import SignPage from "@/pages/SignPage";
import EmailSettingsPage from "@/pages/EmailSettings";
import UserManagementPage from "@/pages/UserManagement";
import AnalyticsPage from "@/pages/Analytics";
import WebhooksPage from "@/pages/Webhooks";
import BrandingPage from "@/pages/Branding";
import AppLayout from "@/components/layout/AppLayout";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

setAuthTokenGetter(() => localStorage.getItem("packetpath_token"));

function ProtectedRoute({ children, adminOnly }: { children: ReactNode; adminOnly?: boolean }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen luminous-gradient flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Loading PacketPath...</p>
        </div>
      </div>
    );
  }
  if (!isAuthenticated) return <Redirect to="/login" />;
  if (adminOnly && user?.role !== "admin") return <Redirect to="/" />;
  return <AppLayout>{children}</AppLayout>;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />

      {/* Public signing page — no auth required */}
      <Route path="/sign/:token">
        {(params) => <SignPage token={params.token} />}
      </Route>

      <Route path="/">
        <ProtectedRoute><DashboardPage /></ProtectedRoute>
      </Route>
      <Route path="/cases">
        <ProtectedRoute><CasesPage /></ProtectedRoute>
      </Route>
      <Route path="/cases/new">
        <ProtectedRoute><NewCasePage /></ProtectedRoute>
      </Route>
      <Route path="/cases/:id/review">
        {(params) => <ProtectedRoute><CaseReviewPage caseId={Number(params.id)} /></ProtectedRoute>}
      </Route>
      <Route path="/cases/:id">
        {(params) => <ProtectedRoute><CaseWizardPage caseId={Number(params.id)} /></ProtectedRoute>}
      </Route>

      {/* E-Signatures */}
      <Route path="/esignatures">
        <ProtectedRoute><ESignaturesPage /></ProtectedRoute>
      </Route>
      <Route path="/signature-templates">
        <ProtectedRoute><SignatureTemplatesPage /></ProtectedRoute>
      </Route>
      <Route path="/signature-requests/:id">
        {(params) => (
          <ProtectedRoute>
            <SignatureRequestDetailPage requestId={Number(params.id)} />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/email-settings">
        <ProtectedRoute adminOnly><EmailSettingsPage /></ProtectedRoute>
      </Route>

      {/* Analytics */}
      <Route path="/analytics">
        <ProtectedRoute><AnalyticsPage /></ProtectedRoute>
      </Route>

      {/* Admin / Security */}
      <Route path="/admin">
        <ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>
      </Route>
      <Route path="/users">
        <ProtectedRoute adminOnly><UserManagementPage /></ProtectedRoute>
      </Route>
      <Route path="/security">
        <ProtectedRoute adminOnly><SecurityPage /></ProtectedRoute>
      </Route>
      <Route path="/audit">
        <ProtectedRoute adminOnly><AuditLogPage /></ProtectedRoute>
      </Route>
      <Route path="/webhooks">
        <ProtectedRoute adminOnly><WebhooksPage /></ProtectedRoute>
      </Route>
      <Route path="/branding">
        <ProtectedRoute adminOnly><BrandingPage /></ProtectedRoute>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
