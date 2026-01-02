import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from 'sonner';
import { usePWA_Inteligente as usePWA } from './hooks/usePWA_Inteligente';
import { PWAInstallPrompt } from './components/PWAInstallPrompt_Inteligente';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Lazy Pages
const QuienesSomosPage = lazy(() => import('./pages/QuienesSomosPage'));
const ComunicadosPage = lazy(() => import('./pages/ComunicadosPage'));
const ComunicadoDetailPage = lazy(() => import('./pages/ComunicadoDetailPage'));
const CitasPage = lazy(() => import('./pages/CitasPage'));
const EncuestasPage = lazy(() => import('./pages/EncuestasPage'));

const DocumentosPage = lazy(() => import('./pages/DocumentosPage'));
const NewsletterPage = lazy(() => import('./pages/NewsletterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const GaleriaPage = lazy(() => import('./pages/GaleriaPage'));
const InstallPWAPage = lazy(() => import('./pages/InstallPWAPage'));

// Admin Pages (Lazy)
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminQuienesSomos = lazy(() => import('./pages/admin/AdminQuienesSomos'));
const AdminComunicados = lazy(() => import('./pages/admin/AdminComunicados'));
const AdminCategorias = lazy(() => import('./pages/admin/AdminCategorias'));
const AdminCitas = lazy(() => import('./pages/admin/AdminCitas'));
const AdminDisponibilidad = lazy(() => import('./pages/admin/AdminDisponibilidad'));
const AdminEncuestas = lazy(() => import('./pages/admin/AdminEncuestas'));
const AdminComentarios = lazy(() => import('./pages/admin/AdminComentarios'));
const AdminDocumentos = lazy(() => import('./pages/admin/AdminDocumentos'));
const AdminSugerencias = lazy(() => import('./pages/admin/AdminSugerencias'));
const AdminEncuestasAnalisis = lazy(() => import('./pages/admin/AdminEncuestasAnalisis'));

const AdminCategoriasDocumentos = lazy(() => import('./pages/admin/AdminCategoriasDocumentos'));
const AdminQR = lazy(() => import('./pages/admin/AdminQR'));
const AdminGaleria = lazy(() => import('./pages/admin/AdminGaleria'));
const AdminAfiliados = lazy(() => import('./pages/admin/AdminAfiliados'));
const AdminAdministradores = lazy(() => import('./pages/admin/AdminAdministradores'));
const AdminDocumentosSindicales = lazy(() => import('./pages/admin/AdminDocumentosSindicales'));

const AdminBeneficiosUGT = lazy(() => import('./pages/admin/AdminBeneficiosUGT'));
const AdminNewsletter = lazy(() => import('./pages/admin/AdminNewsletter'));
const AdminNotificaciones = lazy(() => import('./pages/admin/AdminNotificaciones'));

// Affiliate Pages (Lazy)
const AffiliateDashboard = lazy(() => import('./pages/affiliates/AffiliateDashboard'));
const TestAffiliateDashboard = lazy(() => import('./pages/affiliates/TestAffiliateDashboard'));
const BibliotecaPage = lazy(() => import('./pages/affiliates/BibliotecaPage'));
const TestBibliotecaPage = lazy(() => import('./pages/affiliates/TestBibliotecaPage'));
const EncuestasAfiliadosPage = lazy(() => import('./pages/affiliates/EncuestasAfiliadosPage'));
const BeneficiosPage = lazy(() => import('./pages/affiliates/BeneficiosPage'));

// Components
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import AffiliateRoute from './components/AffiliateRoute';
import TestAffiliateRoute from './components/TestAffiliateRoute';

import LoadingSpinner from './components/LoadingSpinner';
import './index.css';

function App() {
  const { state, install } = usePWA();

  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" richColors />

        {/* PWA Install Prompt */}
        <PWAInstallPrompt
          onInstall={install}
        />

        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route path="/quienes-somos" element={<QuienesSomosPage />} />
            <Route path="/comunicados" element={<ComunicadosPage />} />
            <Route path="/comunicados/:id" element={<ComunicadoDetailPage />} />
            <Route path="/galeria" element={<GaleriaPage />} />
            <Route path="/encuestas" element={<EncuestasPage />} />
            <Route path="/newsletter" element={<NewsletterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/instalar" element={<InstallPWAPage />} />


            {/* Protected Routes */}
            <Route
              path="/citas"
              element={
                <PrivateRoute>
                  <CitasPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/documentos"
              element={
                <PrivateRoute>
                  <DocumentosPage />
                </PrivateRoute>
              }
            />

            {/* Affiliate Routes */}
            <Route
              path="/afiliados"
              element={<Navigate to="/afiliados/dashboard" replace />}
            />
            <Route
              path="/afiliados/dashboard"
              element={
                <TestAffiliateRoute>
                  <TestAffiliateDashboard />
                </TestAffiliateRoute>
              }
            />
            <Route
              path="/afiliados/biblioteca"
              element={
                <TestAffiliateRoute>
                  <TestBibliotecaPage />
                </TestAffiliateRoute>
              }
            />

            <Route
              path="/afiliados/encuestas"
              element={
                <TestAffiliateRoute>
                  <EncuestasAfiliadosPage />
                </TestAffiliateRoute>
              }
            />

            <Route
              path="/afiliados/beneficios"
              element={
                <TestAffiliateRoute>
                  <BeneficiosPage />
                </TestAffiliateRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/notificaciones"
              element={
                <AdminRoute>
                  <AdminNotificaciones />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/quienes-somos"
              element={
                <AdminRoute>
                  <AdminQuienesSomos />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/comunicados"
              element={
                <AdminRoute>
                  <AdminComunicados />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/categorias"
              element={
                <AdminRoute>
                  <AdminCategorias />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/citas"
              element={
                <AdminRoute>
                  <AdminCitas />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/disponibilidad"
              element={
                <AdminRoute>
                  <AdminDisponibilidad />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/encuestas"
              element={
                <AdminRoute>
                  <AdminEncuestas />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/comentarios"
              element={
                <AdminRoute>
                  <AdminComentarios />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/documentos"
              element={
                <AdminRoute>
                  <AdminDocumentos />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/sugerencias"
              element={
                <AdminRoute>
                  <AdminSugerencias />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/encuestas-analisis"
              element={
                <AdminRoute>
                  <AdminEncuestasAnalisis />
                </AdminRoute>
              }
            />

            <Route
              path="/admin/categorias-documentos"
              element={
                <AdminRoute>
                  <AdminCategoriasDocumentos />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/qr"
              element={
                <AdminRoute>
                  <AdminQR />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/galeria"
              element={
                <AdminRoute>
                  <AdminGaleria />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/afiliados"
              element={
                <AdminRoute>
                  <AdminAfiliados />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/administradores"
              element={
                <AdminRoute>
                  <AdminAdministradores />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/documentos-sindicales"
              element={
                <AdminRoute>
                  <AdminDocumentosSindicales />
                </AdminRoute>
              }
            />

            <Route
              path="/admin/beneficios-ugt"
              element={
                <AdminRoute>
                  <AdminBeneficiosUGT />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/newsletter"
              element={
                <AdminRoute>
                  <AdminNewsletter />
                </AdminRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
