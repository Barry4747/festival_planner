import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthGuard } from './components/AuthGuard';
import { LandingPage } from './pages/LandingPage';
import { DiscoverPage } from './pages/DiscoverPage';
import { MyTripsPage } from './pages/MyTripsPage';
import { Layout } from './components/Layout';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LandingPage />} />

        {/* Protected */}
        <Route element={<AuthGuard redirectTo="/" />}>
          <Route element={<Layout />}>
            <Route path="/discover" element={<DiscoverPage />} />
            <Route path="/my-trips" element={<MyTripsPage />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
