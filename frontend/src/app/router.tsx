import { Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from './layout/AppShell';
import { PublicShell } from './layout/PublicShell';
import { AuthGuard } from './guards/AuthGuard';

// Auth
import { LoginPage } from '../features/auth/pages/LoginPage';
import { ForgotPasswordPage } from '../features/auth/pages/ForgotPasswordPage';

// Public
import { ReportePublicoPage } from '../features/publicReport/pages/ReportePublicoPage';
import { ReporteSuccessPage } from '../features/publicReport/pages/ReporteSuccessPage';

// Dashboard
import { DashboardPage } from '../features/dashboard/pages/DashboardPage';

// Siniestros
import { SiniestrosListPage } from '../features/siniestros/pages/SiniestrosListPage';
import { SiniestroDetailPage } from '../features/siniestros/pages/SiniestroDetailPage';

// Pólizas
import { PolizasListPage } from '../features/polizas/pages/PolizasListPage';
import { PolizaDetailPage } from '../features/polizas/pages/PolizaDetailPage';

// Alertas
import { AlertasPage } from '../features/alertas/pages/AlertasPage';

// Reportes
import { ReportesPage } from '../features/reportes/pages/ReportesPage';

// Configuración y Perfil
import { ConfiguracionPage } from '../features/configuracion/pages/ConfiguracionPage';
import { PerfilPage } from '../features/perfil/pages/PerfilPage';

export const AppRouter = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<PublicShell />}>
        <Route path="/reporte" element={<ReportePublicoPage />} />
        <Route path="/reporte/:codigo/confirmacion" element={<ReporteSuccessPage />} />
      </Route>

      {/* Auth Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* Protected Routes */}
      <Route
        path="/app"
        element={
          <AuthGuard>
            <AppShell />
          </AuthGuard>
        }
      >
        <Route index element={<Navigate to="/app/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="siniestros" element={<SiniestrosListPage />} />
        <Route path="siniestros/:id" element={<SiniestroDetailPage />} />
        <Route path="polizas" element={<PolizasListPage />} />
        <Route path="polizas/:id" element={<PolizaDetailPage />} />
        <Route path="alertas" element={<AlertasPage />} />
        <Route path="reportes" element={<ReportesPage />} />
        <Route path="configuracion" element={<ConfiguracionPage />} />
        <Route path="perfil" element={<PerfilPage />} />
      </Route>

      {/* Redirect root to login or dashboard */}
      <Route path="/" element={<Navigate to="/app/dashboard" replace />} />

      {/* 404 */}
      <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
    </Routes>
  );
};
