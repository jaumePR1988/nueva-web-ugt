/**
 * Configuración de contacto del portal UGT-TOWA
 * Estos datos se pueden modificar fácilmente cambiando las variables de entorno
 * o editando directamente estos valores
 */

export const CONTACT_CONFIG = {
  // Datos de contacto principal
  email: import.meta.env.VITE_CONTACT_EMAIL || 'jpedragosa@towapharmaceutical.com',
  phone: import.meta.env.VITE_CONTACT_PHONE || '629931957',
  company: 'Towa Pharmaceutical Europe',
  
  // Información adicional
  address: 'Towa Pharmaceutical Europe',
  postalCode: '',
  city: '',
  country: 'España',
  
  // Redes sociales (opcional)
  socialMedia: {
    facebook: '',
    twitter: '',
    linkedin: '',
    instagram: ''
  }
};

// Función para validar formato de email
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Función para validar formato de teléfono español
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^[6789]\d{8}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

// Función para formatear número de teléfono
export const formatPhone = (phone: string): string => {
  const cleanPhone = phone.replace(/\s/g, '');
  if (cleanPhone.length === 9) {
    return `${cleanPhone.slice(0, 3)} ${cleanPhone.slice(3, 6)} ${cleanPhone.slice(6)}`;
  }
  return phone;
};