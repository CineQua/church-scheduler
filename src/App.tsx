import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { Navbar } from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import GenerateSchedule from './pages/GenerateSchedule';
import ViewSchedules from './pages/ViewSchedules';
import Settings from './pages/Settings';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-slate-100">
          <Navbar />

          {/* Desktop: offset for sidebar; Mobile: offset for bottom nav */}
          <main className="md:ml-60 pb-20 md:pb-0">
            <div className="max-w-6xl mx-auto px-4 py-8">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/members" element={<Members />} />
                <Route path="/generate" element={<GenerateSchedule />} />
                <Route path="/schedules" element={<ViewSchedules />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </div>
          </main>
        </div>
      </BrowserRouter>
    </AppProvider>
  );
}
