import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, User, LayoutDashboard, Menu, X, Bell, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { BRANDING } from '@/config/branding.config';

export default function Navbar() {
  const { user, signOut, isAdmin, isAffiliate } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Sesión cerrada');
      setIsMobileMenuOpen(false);
    } catch (error) {
      toast.error('Error al cerrar sesión');
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const navLinks = [
    { to: '/', label: 'Inicio' },
    { to: '/quienes-somos', label: 'Quiénes Somos' },
    { to: '/comunicados', label: 'Comunicados' },
    { to: '/galeria', label: 'Galería' },
    { to: '/citas', label: 'Citas' },
    ...(user ? [{ to: '/documentos', label: 'Documentación' }] : []),
    { to: '/encuestas', label: 'Encuestas' },
    ...(user ? [{ to: '/afiliados/dashboard', label: 'Área Afiliados' }] : []),
  ];

  return (
    <nav className="glass-nav">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="flex items-center space-x-4 transition-all duration-300">
            <div className="relative overflow-hidden rounded-xl bg-white p-1 shadow-md">
              <img
                src={BRANDING.logoUrl}
                alt={`${BRANDING.shortName} Logo`}
                className="h-10 w-auto object-contain"
              />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-black text-white tracking-tight leading-none">
                {BRANDING.companyName}
              </h1>
              <p className="text-[10px] uppercase font-bold tracking-widest text-white/90">
                Sección Sindical
              </p>
            </div>
          </Link>

          {/* New Desktop Navigation Links */}
          <div className="hidden xl:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${location.pathname === link.to || (link.to !== '/' && location.pathname.startsWith(link.to))
                  ? 'bg-white text-red-600 shadow-md'
                  : 'text-white hover:bg-white/10'
                  }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop Navigation */}
          <div className="hidden xl:flex items-center space-x-3">
            {user ? (
              <div className="flex items-center space-x-2">
                {isAdmin && (
                  <Link
                    to="/admin/dashboard"
                    className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold hover:scale-105 transition-all duration-300 shadow-md"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    <span>Panel Admin</span>
                  </Link>
                )}
                <button
                  onClick={handleSignOut}
                  className="p-2 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-600 transition-all duration-300 group"
                  title="Cerrar Sesión"
                >
                  <LogOut className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="flex items-center space-x-2 px-4 py-2 rounded-xl text-white hover:bg-white/10 transition-all duration-300"
                >
                  <User className="h-4 w-4" />
                  <span>Entrar</span>
                </Link>
                <Link
                  to="/register"
                  className="px-6 py-2 rounded-xl bg-white text-red-600 font-bold hover:bg-gray-100 hover:shadow-lg transition-all duration-300"
                >
                  Registrarse
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="xl:hidden flex items-center space-x-3">
            <button
              onClick={toggleMobileMenu}
              className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="xl:hidden py-6 animate-in">
            <div className="flex flex-col space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 ${location.pathname === link.to || (link.to !== '/' && location.pathname.startsWith(link.to))
                    ? 'bg-white text-red-600 shadow-lg'
                    : 'text-white hover:bg-white/10'
                    }`}
                >
                  <span className="font-bold">{link.label}</span>
                  <ChevronRight className="h-4 w-4 opacity-70" />
                </Link>
              ))}

              <div className="pt-4 mt-2 border-t border-white/20 space-y-3">
                {user ? (
                  <>
                    {isAdmin && (
                      <Link
                        to="/admin/dashboard"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center justify-center space-x-2 w-full px-4 py-3 rounded-xl bg-white text-red-600 font-bold shadow-md"
                      >
                        <LayoutDashboard className="h-4 w-4" />
                        <span>Panel Admin</span>
                      </Link>
                    )}
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-xl border-2 border-white/20 text-white font-bold hover:bg-white/10 transition-all"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Cerrar Sesión</span>
                    </button>
                  </>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <Link
                      to="/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-center space-x-2 px-4 py-3 rounded-xl border border-white/20 text-white font-semibold"
                    >
                      <User className="h-4 w-4" />
                      <span>Entrar</span>
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-center px-4 py-3 rounded-xl bg-white text-red-600 font-bold shadow-md"
                    >
                      Unirse
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
