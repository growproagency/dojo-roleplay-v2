import './index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'sonner';

import { AuthProvider } from './context/AuthProvider';
import { ErrorBoundary } from './components/ErrorBoundary';
import { CallWidget } from './components/CallWidget';
import { ProtectedRoute } from './components/ProtectedRoute';
import { TooltipProvider } from './components/ui/tooltip';

import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { UpdatePasswordPage } from './pages/UpdatePasswordPage';
import { InviteAcceptPage } from './pages/InviteAcceptPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { DashboardPage } from './pages/DashboardPage';
import { PracticeCallPage } from './pages/PracticeCallPage';
import { CallHistoryPage } from './pages/CallHistoryPage';
import { ScorecardDetailPage } from './pages/ScorecardDetailPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { ProfilePage } from './pages/ProfilePage';
import { MembersPage } from './pages/MembersPage';
import { SettingsPage } from './pages/SettingsPage';
import { AdminSchoolsPage } from './pages/AdminSchoolsPage';
import { AdminSchoolDetailPage } from './pages/AdminSchoolDetailPage';
import { CustomScenariosPage } from './pages/CustomScenariosPage';
import { PlatformSettingsPage } from './pages/PlatformSettingsPage';
import { UsagePage } from './pages/UsagePage';
import { SchoolAnalyticsPage } from './pages/SchoolAnalyticsPage';
import { ComponentShowcasePage } from './pages/ComponentShowcasePage';
import { SystemEventsPage } from './pages/SystemEventsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: true,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/update-password" element={<UpdatePasswordPage />} />
                <Route path="/invite/:token" element={<InviteAcceptPage />} />

                <Route element={<ProtectedRoute />}>
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/practice" element={<PracticeCallPage />} />
                  <Route path="/calls" element={<CallHistoryPage />} />
                  <Route path="/calls/:id" element={<ScorecardDetailPage />} />
                  <Route path="/leaderboard" element={<LeaderboardPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/members" element={<MembersPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/analytics" element={<SchoolAnalyticsPage />} />
                  <Route path="/admin/schools" element={<AdminSchoolsPage />} />
                  <Route path="/admin/schools/:id" element={<AdminSchoolDetailPage />} />
                  <Route path="/admin/usage" element={<UsagePage />} />
                  <Route path="/admin/system-events" element={<SystemEventsPage />} />
                  <Route path="/admin/scenarios" element={<CustomScenariosPage />} />
                  <Route path="/admin/platform-settings" element={<PlatformSettingsPage />} />
                  <Route path="/components" element={<ComponentShowcasePage />} />
                </Route>

                <Route path="*" element={<NotFoundPage />} />
              </Routes>

              <CallWidget />
            </BrowserRouter>

            <Toaster richColors position="top-right" />
            <ReactQueryDevtools initialIsOpen={false} />
          </TooltipProvider>
        </QueryClientProvider>
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
