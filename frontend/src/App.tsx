import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthGuard } from './components/AuthGuard';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ścieżki publiczne */}
        <Route path="/login" element={<Login />} />

        {/* Ścieżki chronione (wymagające zalogowania w Supabase) */}
        <Route element={<AuthGuard redirectTo="/login" />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>

        {/* Fallback dla nieistniejących ścieżek */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

