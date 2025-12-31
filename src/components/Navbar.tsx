import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, User, LayoutDashboard, Menu, X } from 'lucide-react';
import { toast } from 'sonner';
import ThemeToggle from './ThemeToggle';

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
    { to: '/galeria', label: 'Galería de Eventos' },
    { to: '/citas', label: 'Citas' },
    ...(user ? [{ to: '/documentos', label: 'Documentos' }] : []),
    { to: '/encuestas', label: 'Encuestas' },
    { to: '/newsletter', label: 'Newsletter' },
    ...(user ? [{ to: '/afiliados/dashboard', label: 'Afiliados' }] : []),
  ];

  return (
    <nav className="bg-white shadow-md border-b-4 border-red-600">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="flex items-center space-x-3">
            <img 
              src="/UGT-logo.jpg" 
              alt="UGT Logo" 
              className="h-14 w-auto"
            />
            <div>
              <h1 className="text-xl font-bold text-gray-900">UGT Towa</h1>
              <p className="text-xs text-gray-600">Sección Sindical</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-6">
            {navLinks.map((link) => (
              <Link 
                key={link.to}
                to={link.to} 
                className={`${
                  location.pathname.startsWith(link.to) 
                    ? 'text-red-600 font-semibold' 
                    : 'text-gray-700 hover:text-red-600 transition'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden lg:flex items-center space-x-3">
            <ThemeToggle />
            {user ? (
              <>
                {isAdmin && (
                  <>
                    <Link
                      to="/admin/dashboard"
                      className="flex items-center space-x-1 px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      <span>Admin</span>
                    </Link>
                    <Link
                      to="/admin/newsletter"
                      className="flex items-center space-x-1 px-3 py-2 rounded-lg border border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                    >
                      <span>Newsletter</span>
                    </Link>
                  </>
                )}
                <button
                  onClick={handleSignOut}
                  className="flex items-center space-x-1 px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Salir</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="flex items-center space-x-1 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition"
                >
                  <User className="h-4 w-4" />
                  <span>Entrar</span>
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
                >
                  Registrarse
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center space-x-2">
            <ThemeToggle />
            <button
              onClick={toggleMobileMenu}
              className="p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-gray-200 py-4">
            <div className="flex flex-col space-y-4">
              {navLinks.map((link) => (
                <Link 
                  key={link.to}
                  to={link.to}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`px-4 py-2 rounded-lg transition ${
                    location.pathname.startsWith(link.to) 
                      ? 'text-red-600 font-semibold bg-red-50' 
                      : 'text-gray-700 hover:text-red-600 hover:bg-gray-50'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              
              <div className="border-t border-gray-200 pt-4 mt-4">
                {user ? (
                  <>
                    {isAdmin && (
                      <>
                        <Link
                          to="/admin/dashboard"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition mb-2"
                        >
                          <LayoutDashboard className="h-4 w-4" />
                          <span>Admin</span>
                        </Link>
                        <Link
                          to="/admin/newsletter"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex items-center space-x-2 px-4 py-2 rounded-lg border border-red-600 text-red-600 hover:bg-red-50 transition mb-2"
                        >
                          <span>Newsletter</span>
                        </Link>
                      </>
                    )}
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center space-x-2 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Salir</span>
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center space-x-2 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition mb-2"
                    >
                      <User className="h-4 w-4" />
                      <span>Entrar</span>
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block w-full text-center px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
                    >
                      Registrarse
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
