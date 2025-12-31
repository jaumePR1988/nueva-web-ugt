import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';
import { CONTACT_CONFIG, formatPhone } from '../config/contact';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-bold mb-4 text-red-500">Contacto</h3>
            <div className="space-y-2 text-gray-300">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>{CONTACT_CONFIG.email}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4" />
                <span>{formatPhone(CONTACT_CONFIG.phone)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>{CONTACT_CONFIG.company}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4 text-red-500">Enlaces</h3>
            <div className="space-y-2">
              <Link to="/quienes-somos" className="block text-gray-300 hover:text-white transition">
                Quiénes Somos
              </Link>
              <Link to="/comunicados" className="block text-gray-300 hover:text-white transition">
                Comunicados
              </Link>
              <Link to="/citas" className="block text-gray-300 hover:text-white transition">
                Solicitar Cita
              </Link>
              <Link to="/encuestas" className="block text-gray-300 hover:text-white transition">
                Encuestas
              </Link>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4 text-red-500">Sobre UGT</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              Sección Sindical de UGT en Towa Pharmaceutical Europe. 
              Comprometidos con la defensa de los derechos laborales y 
              el bienestar de todos los trabajadores.
            </p>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-6 text-center text-gray-400 text-sm">
          <p>2025 UGT Towa Pharmaceutical Europe. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
