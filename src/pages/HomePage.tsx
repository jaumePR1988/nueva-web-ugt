import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import EventCarousel from '@/components/EventCarousel';
import { supabase, Communique, Survey } from '@/lib/supabase';
import { Calendar, FileText, Vote, MessageSquare, QrCode, Clock, Bell, ChevronRight, ArrowRight, User } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';

// Función para extraer texto plano del HTML y truncarlo de manera segura
function getTextPreview(html: string, maxLength: number = 200): string {
  // Crear un elemento temporal para parsear el HTML
  const temp = document.createElement('div');
  temp.innerHTML = html;

  // Obtener solo el texto sin etiquetas HTML
  const text = temp.textContent || temp.innerText || '';

  // Truncar el texto si es muy largo
  if (text.length > maxLength) {
    return text.substring(0, maxLength).trim() + '...';
  }

  return text;
}

import { BRANDING } from '@/config/branding.config';

export default function HomePage() {
  const [communiques, setCommuniques] = useState<Communique[]>([]);
  const [activeSurveys, setActiveSurveys] = useState<Survey[]>([]);
  const [qrCode, setQrCode] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      // Cargar últimos 3 comunicados
      const { data: comData } = await supabase
        .from('communiques')
        .select('*, category:categories(*)')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(3);
      if (comData) setCommuniques(comData as any);

      // Cargar TODAS las encuestas activas (solo públicas) con fecha_fin vigente
      const { data: surveysData } = await supabase
        .from('surveys')
        .select('*')
        .eq('is_active', true)
        .eq('tipo', 'publica')
        .gte('fecha_fin', new Date().toISOString())
        .order('fecha_fin', { ascending: true });
      if (surveysData) setActiveSurveys(surveysData);

      // Cargar QR code activo
      const { data: qrData } = await supabase
        .from('qr_codes')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (qrData) setQrCode(qrData);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-500">
      <Navbar />

      {/* Hero Section - Solid UGT Red Identity */}
      <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden bg-[#dc2626] text-white">
        {/* Subtle Brand Texture */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white rounded-full blur-[150px] -mr-80 -mt-80" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-black rounded-full blur-[120px] -ml-40 -mb-40" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="animate-in space-y-8">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white text-sm font-black uppercase tracking-widest backdrop-blur-md">
                <span className="relative flex h-2 w-2 mr-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                </span>
                Sección Sindical Oficial
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-[1.1] tracking-tighter">
                TRABAJAMOS <span className="text-red-200">POR TI</span>
              </h1>

              <p className="text-base md:text-lg text-red-50 font-medium max-w-lg leading-relaxed">
                Bienvenido al portal institucional de {BRANDING.companyName}. Gestiona tus servicios y mantente informado con el respaldo de UGT.
              </p>

              <div className="flex flex-wrap gap-5 pt-4">
                <Link
                  to="/citas"
                  className="flex items-center px-8 py-4 bg-white text-red-600 rounded-xl font-black text-lg hover:bg-gray-100 transition-all duration-300 shadow-2xl hover:scale-105"
                >
                  <Calendar className="h-5 w-5 mr-3" />
                  Solicitar Cita
                </Link>
                <Link
                  to="/comunicados"
                  className="flex items-center px-8 py-4 bg-transparent border-2 border-white/30 text-white rounded-xl font-black text-lg hover:bg-white/10 hover:border-white transition-all duration-300"
                >
                  Comunicados
                </Link>
              </div>
            </div>

            <div className="hidden lg:block relative animate-in" style={{ animationDelay: '0.2s' }}>
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white/10 ring-1 ring-white/20 max-h-[450px]">
                <img
                  src="https://zaxdscclkeytakcowgww.supabase.co/storage/v1/object/public/event-images/bandera-ugt-2024.jpg"
                  alt="UGT Brand Strength"
                  className="w-full h-full object-cover grayscale-[0.2] hover:grayscale-0 transition-all duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-[#dc2626]/40 to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Carrusel de Eventos */}
      <EventCarousel />

      <div className="container mx-auto px-4 py-12 relative">
        {/* Encuestas Activas - Modern Dashboard Section */}
        {activeSurveys.length > 0 && (
          <div className="mb-16 animate-in" style={{ animationDelay: '0.3s' }}>
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
              <div>
                <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2">Tu opinión cuenta</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Participa en las decisiones activas de nuestra sección sindical</p>
              </div>
              <Link to="/encuestas" className="inline-flex items-center text-red-600 dark:text-red-400 font-bold group">
                Explorar todas las encuestas
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {activeSurveys.map((survey, index) => {
                const daysRemaining = differenceInDays(new Date(survey.fecha_fin), new Date());
                return (
                  <div
                    key={survey.id}
                    className="glass-card hover-lift p-8 group relative overflow-hidden border-t-4 border-t-red-600"
                    style={{ animationDelay: `${0.4 + (index * 0.1)}s` }}
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-red-600/5 rounded-bl-full -z-10 group-hover:scale-150 transition-transform duration-700" />

                    <div className="flex items-center justify-between mb-6">
                      <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-2xl">
                        <Vote className="h-6 w-6 text-red-600 dark:text-red-400" />
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${daysRemaining <= 2 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        }`}>
                        {daysRemaining === 0 ? 'Expira hoy' : `${daysRemaining}d restantes`}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 leading-snug min-h-[3.5rem]">
                      {survey.question}
                    </h3>

                    <Link
                      to="/encuestas"
                      className="flex items-center justify-center w-full px-6 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold transition-all group-hover:bg-red-600 group-hover:text-white shadow-md shadow-gray-200 dark:shadow-none"
                    >
                      Participar
                      <ChevronRight className="ml-2 h-4 w-4 opacity-70" />
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Últimos Comunicados - Premium Layout */}
          <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-red-600 flex items-center justify-center shadow-lg shadow-red-200 dark:shadow-none">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">Últimos Comunicados</h2>
              </div>
              <Link to="/comunicados" className="hidden sm:flex items-center px-4 py-2 text-sm font-bold text-gray-600 dark:text-gray-400 hover:text-red-600 transition-colors">
                Ver historial
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-900 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-600 border-t-transparent mb-4"></div>
                <p className="text-gray-500 font-medium">Cargando noticias...</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {communiques.map((com, index) => (
                  <Link
                    key={com.id}
                    to={`/comunicados/${com.id}`}
                    className="group bg-white dark:bg-gray-900/50 rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-800 hover:border-red-600 transition-all duration-300 hover:shadow-2xl border-l-4 border-l-red-600"
                    style={{ animationDelay: `${0.6 + (index * 0.1)}s` }}
                  >
                    <div className="flex flex-col md:flex-row">
                      {com.image_url && (
                        <div className="md:w-64 md:flex-shrink-0 overflow-hidden">
                          <img
                            src={com.image_url}
                            alt={com.title}
                            className="w-full h-48 md:h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          />
                        </div>
                      )}
                      <div className="p-8 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center space-x-3 mb-4">
                            {com.category && (
                              <span
                                className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest text-white"
                                style={{ backgroundColor: com.category.color }}
                              >
                                {com.category.name}
                              </span>
                            )}
                            <span className="text-xs font-semibold text-gray-400">
                              {format(new Date(com.created_at), "d 'de' MMMM", { locale: es })}
                            </span>
                          </div>
                          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-red-600 transition-colors leading-tight">
                            {com.title}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400 line-clamp-2 text-base leading-relaxed">
                            {getTextPreview(com.content, 180)}
                          </p>
                        </div>
                        <div className="mt-6 flex items-center text-red-600 dark:text-red-400 font-bold text-sm">
                          Leer artículo completo
                          <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Accesos Rápidos & Más */}
          <div className="space-y-8 animate-in" style={{ animationDelay: '0.8s' }}>
            <div className="glass-card p-8">
              <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-6">Accesos Rápidos</h2>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { to: '/quienes-somos', label: 'Quiénes Somos', icon: User },
                  { to: '/citas', label: 'Solicitar Cita', icon: Calendar },
                  { to: '/encuestas', label: 'Encuestas Activas', icon: Vote },
                  { to: '/documentos', label: 'Documentación', icon: FileText },
                ].map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 hover:border-red-200 dark:hover:border-red-900/40 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all duration-300 group"
                  >
                    <div className="flex items-center space-x-3">
                      <item.icon className="h-5 w-5 text-red-600 dark:text-red-400" />
                      <span className="font-bold text-gray-900 dark:text-white">{item.label}</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
                  </Link>
                ))}
              </div>
            </div>

            {/* QR de Afiliacion - Compact Premium Card */}
            <div className="glass-card p-8 bg-gradient-to-br from-red-600 to-red-700 text-white border-none shadow-red-200 dark:shadow-none overflow-hidden relative group">
              <div className="absolute top-[-20%] right-[-20%] w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
              <h3 className="text-xl font-extrabold mb-2 relative z-10">¡Afíliate ahora!</h3>
              <p className="text-red-100 text-sm mb-6 relative z-10">Escanea el código para unirte a nuestra sección sindical</p>

              {qrCode ? (
                <div className="relative z-10 bg-white p-4 rounded-3xl shadow-2xl flex flex-col items-center">
                  <img
                    src={qrCode.image_url}
                    alt={qrCode.title}
                    className="w-full max-w-[150px] h-auto rounded-xl"
                  />
                  {qrCode.description && (
                    <p className="text-[10px] text-gray-500 mt-3 font-bold uppercase tracking-wider text-center">
                      {qrCode.title}
                    </p>
                  )}
                </div>
              ) : (
                <div className="relative z-10 flex flex-col items-center justify-center p-8 bg-white/10 border-2 border-dashed border-white/20 rounded-3xl h-[200px]">
                  <QrCode className="h-12 w-12 text-white/40 mb-3" />
                  <p className="text-xs text-white/60 font-medium text-center">QR temporalmente fuera de servicio</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Buzón de Sugerencias Anónimas - Full Width Modern Box */}
        <div id="sugerencias" className="mt-24 animate-in" style={{ animationDelay: '1s' }}>
          <div className="glass-card overflow-hidden rounded-[2.5rem] border-red-100 dark:border-red-900/20">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="p-10 lg:p-16 flex flex-col justify-center">
                <div className="w-16 h-16 rounded-2xl bg-gray-900 dark:bg-white flex items-center justify-center mb-8 shadow-xl">
                  <MessageSquare className="h-8 w-8 text-white dark:text-gray-900" />
                </div>
                <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-4">Buzón Ético y de Sugerencias</h2>
                <p className="text-base text-gray-600 dark:text-gray-400 mb-6 leading-relaxed max-w-md">
                  Tu voz es fundamental. Envía comentarios, sugerencias o preocupaciones de forma **100% anónima**.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 text-sm font-bold text-green-600 dark:text-green-400">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span>Conexión encriptada y segura</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900/50 p-10 lg:p-16">
                <SuggestionsForm />
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

function SuggestionsForm() {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('suggestions')
        .insert([{ content }]);

      if (error) throw error;

      setContent('');
      alert('Sugerencia enviada correctamente');
    } catch (error) {
      alert('Error al enviar sugerencia');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Tu mensaje</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Describe tu sugerencia o preocupación de forma detallada..."
          className="w-full h-48 px-6 py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl focus:ring-4 focus:ring-red-600/10 focus:border-red-600 outline-none transition-all resize-none text-gray-700 dark:text-gray-200"
          required
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full sm:w-auto px-8 py-3 bg-red-600 text-white rounded-2xl font-bold text-base hover:bg-red-700 hover:shadow-xl hover:shadow-red-200 dark:hover:shadow-red-900/20 disabled:bg-gray-400 disabled:transform-none transform active:scale-95 transition-all duration-300 flex items-center justify-center"
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3" />
            Enviando...
          </>
        ) : (
          <>
            Enviar Formulario Seguro
            <ArrowRight className="ml-2 h-5 w-5" />
          </>
        )}
      </button>
      <p className="text-xs text-center sm:text-left text-gray-400 dark:text-gray-500 font-medium">
        Al hacer clic en enviar, tu mensaje será procesado de forma anónima. No recolectamos IPs ni datos personales.
      </p>
    </form>
  );
}
