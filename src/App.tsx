import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { AppProvider } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import GenerateSchedule from './pages/GenerateSchedule';
import ViewSchedules from './pages/ViewSchedules';
import Settings from './pages/Settings';
import Users from './pages/Users';

function FullScreenSpinner({ label }: { label: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-slate-500 text-sm">{label}</p>
      </div>
    </div>
  );
}

/** Renders <Login> when signed out, otherwise bounces to the dashboard. */
function LoginRoute() {
  const { user, loading } = useAuth();
  if (loading) return <FullScreenSpinner label="Loading…" />;
  if (user) return <Navigate to="/" replace />;
  return <Login />;
}

/** Redirects to the dashboard if the user lacks one of the required roles. */
function RequireRole({ allowed, children }: { allowed: ('canWrite' | 'isSuperAdmin')[]; children: ReactNode }) {
  const auth = useAuth();
  const ok = allowed.some((flag) => auth[flag]);
  return ok ? <>{children}</> : <Navigate to="/" replace />;
}

/** The authenticated application shell. Data is only loaded once signed in. */
function AuthedApp() {
  const { user, loading } = useAuth();
  if (loading) return <FullScreenSpinner label="Loading…" />;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <AppProvider>
      <div className="min-h-screen bg-slate-100">
        <Navbar />
        <main className="md:ml-60 pb-20 md:pb-0">
          <div className="max-w-6xl mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/members" element={<Members />} />
              <Route
                path="/generate"
                element={
                  <RequireRole allowed={['canWrite']}>
                    <GenerateSchedule />
                  </RequireRole>
                }
              />
              <Route path="/schedules" element={<ViewSchedules />} />
              <Route
                path="/settings"
                element={
                  <RequireRole allowed={['canWrite']}>
                    <Settings />
                  </RequireRole>
                }
              />
              <Route
                path="/users"
                element={
                  <RequireRole allowed={['isSuperAdmin']}>
                    <Users />
                  </RequireRole>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </AppProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginRoute />} />
          <Route path="/*" element={<AuthedApp />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
