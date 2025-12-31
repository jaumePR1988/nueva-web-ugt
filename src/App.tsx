import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from 'sonner';
import { usePWA_Inteligente as usePWA } from './hooks/usePWA_Inteligente';
import { PWAInstallPrompt } from './components/PWAInstallPrompt_Inteligente';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

import QuienesSomosPage from './pages/QuienesSomosPage';
import ComunicadosPage from './pages/ComunicadosPage';
import ComunicadoDetailPage from './pages/ComunicadoDetailPage';
import CitasPage from './pages/CitasPage';
import EncuestasPage from './pages/EncuestasPage';

import DocumentosPage from './pages/DocumentosPage';
import NewsletterPage from './pages/NewsletterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import GaleriaPage from './pages/GaleriaPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminQuienesSomos from './pages/admin/AdminQuienesSomos';
import AdminComunicados from './pages/admin/AdminComunicados';
import AdminCategorias from './pages/admin/AdminCategorias';
import AdminCitas from './pages/admin/AdminCitas';
import AdminDisponibilidad from './pages/admin/AdminDisponibilidad';
import AdminEncuestas from './pages/admin/AdminEncuestas';
import AdminComentarios from './pages/admin/AdminComentarios';
import AdminDocumentos from './pages/admin/AdminDocumentos';
import AdminSugerencias from './pages/admin/AdminSugerencias';
import AdminEncuestasAnalisis from './pages/admin/AdminEncuestasAnalisis';

import AdminCategoriasDocumentos from './pages/admin/AdminCategoriasDocumentos';
import AdminQR from './pages/admin/AdminQR';
import AdminGaleria from './pages/admin/AdminGaleria';
import AdminAfiliados from './pages/admin/AdminAfiliados';
import AdminAdministradores from './pages/admin/AdminAdministradores';
import AdminDocumentosSindicales from './pages/admin/AdminDocumentosSindicales';

import AdminBeneficiosUGT from './pages/admin/AdminBeneficiosUGT';
import AdminNewsletter from './pages/admin/AdminNewsletter';
import AdminNotificaciones from './pages/admin/AdminNotificaciones';

// Affiliate Pages
import AffiliateDashboard from './pages/affiliates/AffiliateDashboard';
import TestAffiliateDashboard from './pages/affiliates/TestAffiliateDashboard';
import BibliotecaPage from './pages/affiliates/BibliotecaPage';
import TestBibliotecaPage from './pages/affiliates/TestBibliotecaPage';
import EncuestasAfiliadosPage from './pages/affiliates/EncuestasAfiliadosPage';
import BeneficiosPage from './pages/affiliates/BeneficiosPage';

// Components
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import AffiliateRoute from './components/AffiliateRoute';
import TestAffiliateRoute from './components/TestAffiliateRoute';

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
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
