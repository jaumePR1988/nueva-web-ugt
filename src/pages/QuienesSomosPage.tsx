import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { supabase, Delegate } from '@/lib/supabase';
import { Users, User, Shield, Info, Heart } from 'lucide-react';

export default function QuienesSomosPage() {
  const [delegates, setDelegates] = useState<{
    comite: Delegate[];
    sindical: Delegate[];
    prevencion: Delegate[];
  }>({ comite: [], sindical: [], prevencion: [] });
  const [content, setContent] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const { data: delegateData } = await supabase
        .from('delegates')
        .select('*')
        .eq('active', true)
        .order('display_order', { ascending: true });

      if (delegateData) {
        setDelegates({
          comite: delegateData.filter(d => d.role_type === 'comite'),
          sindical: delegateData.filter(d => d.role_type === 'sindical'),
          prevencion: delegateData.filter(d => d.role_type === 'prevencion'),
        });
      }

      const { data: contentData } = await supabase
        .from('site_content')
        .select('*');

      if (contentData) {
        const contentMap: Record<string, string> = {};
        contentData.forEach(item => {
          contentMap[item.key] = item.content;
        });
        setContent(contentMap);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FDFDFD]">
      <Navbar />

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-red-600 py-12 md:py-16">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-red-500 rounded-full blur-3xl opacity-20"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-72 h-72 bg-red-700 rounded-full blur-3xl opacity-30"></div>

        <div className="container relative mx-auto px-4 text-center">
          <div className="inline-flex items-center justify-center p-2 mb-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-700">
            <Users className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tight animate-in fade-in slide-in-from-bottom-4 duration-700">
            QUIÉNES SOMOS
          </h1>
          <p className="max-w-xl mx-auto text-base md:text-lg text-red-50 font-medium opacity-90 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700">
            Conoce al equipo de delegados que trabaja diariamente para defender tus derechos y mejorar nuestras condiciones laborales.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-6 mb-16">
        <div className="max-w-5xl mx-auto">
          {/* Intro Card */}
          <div className="bg-white rounded-3xl shadow-xl shadow-red-900/5 p-6 md:p-10 mb-12 border border-gray-100 relative overflow-hidden group hover:border-red-100 transition-colors duration-500">
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
              <Info className="w-16 h-16 text-red-600" />
            </div>

            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-1 w-8 bg-red-600 rounded-full"></div>
                <span className="text-red-600 font-bold uppercase tracking-widest text-xs">Nuestro Compromiso</span>
              </div>

              <div className="text-gray-700 text-base md:text-lg leading-relaxed font-medium">
                {loading ? (
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-100 rounded-full w-full animate-pulse"></div>
                    <div className="h-3 bg-gray-100 rounded-full w-5/6 animate-pulse"></div>
                  </div>
                ) : (
                  <p className="whitespace-pre-line text-gray-700/90">
                    {content.intro_quienes_somos || 'En UGT Towa, estamos comprometidos con la transparencia, el apoyo mutuo y la defensa firme de los intereses de toda la plantilla.'}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-20">
            <DelegateSection
              title="Comité de Empresa"
              subtitle="Representación Unitaria"
              icon={<Shield className="h-5 w-5" />}
              description={content.intro_comite}
              delegates={delegates.comite}
              loading={loading}
            />

            <DelegateSection
              title="Delegados Sindicales"
              subtitle="Acción y Soporte"
              icon={<Heart className="h-5 w-5" />}
              description={content.intro_sindical}
              delegates={delegates.sindical}
              loading={loading}
            />

            <DelegateSection
              title="Seguridad y Salud"
              subtitle="Prevención de Riesgos"
              icon={<Users className="h-5 w-5" />}
              description={content.intro_prevencion}
              delegates={delegates.prevencion}
              loading={loading}
            />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

function DelegateSection({ title, subtitle, icon, description, delegates, loading }: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  description?: string;
  delegates: Delegate[];
  loading: boolean;
}) {
  if (!loading && delegates.length === 0) return null;

  return (
    <div className="relative">
      <div className="mb-8 text-center md:text-left flex flex-col md:flex-row md:items-end justify-between gap-4 px-2">
        <div className="max-w-2xl">
          <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
            <div className="p-1.5 bg-red-50 text-red-600 rounded-lg">
              {icon}
            </div>
            <span className="text-red-600 font-bold uppercase tracking-widest text-[10px]">{subtitle}</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-2">{title}</h2>
          {description && (
            <p className="text-gray-600 text-base leading-relaxed font-medium">{description}</p>
          )}
        </div>

        <div className="hidden md:block">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            {delegates.length} Integrantes
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-64 bg-gray-50 rounded-2xl animate-pulse"></div>
          ))
        ) : (
          delegates.map(delegate => (
            <DelegateCard key={delegate.id} delegate={delegate} />
          ))
        )}
      </div>
    </div>
  );
}

function DelegateCard({ delegate }: { delegate: Delegate }) {
  const photoUrl = delegate.photo_url || delegate.image_url;

  return (
    <div className="group bg-white rounded-3xl border border-gray-100 shadow-lg shadow-gray-200/40 hover:shadow-xl hover:shadow-red-900/10 transition-all duration-500 overflow-hidden flex flex-col h-full hover:-translate-y-1">
      <div className="p-6 pb-2 text-center">
        <div className="relative mx-auto mb-4 inline-block">
          {/* Decorative ring */}
          <div className="absolute inset-0 -m-1 border border-dashed border-red-200 rounded-full group-hover:rotate-180 transition-transform duration-1000"></div>

          <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-white shadow-md z-10">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={delegate.full_name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
            ) : (
              <div className="w-full h-full bg-red-50 flex items-center justify-center">
                <User className="h-12 w-12 text-red-100 transition-colors group-hover:text-red-200" />
              </div>
            )}
          </div>
        </div>

        <h3 className="text-lg font-black text-gray-900 mb-0.5 group-hover:text-red-600 transition-colors">
          {delegate.full_name}
        </h3>

        {delegate.position && (
          <p className="text-red-600 text-[10px] font-black uppercase tracking-widest mb-3">
            {delegate.position}
          </p>
        )}
      </div>

      <div className="px-6 pb-6 flex-1">
        <div className="relative">
          {delegate.bio && delegate.bio.trim() && (
            <p className="text-gray-600 text-xs leading-relaxed font-medium line-clamp-3 italic group-hover:line-clamp-none transition-all duration-500 text-center">
              "{delegate.bio}"
            </p>
          )}
        </div>
      </div>

      {/* Visual detail at bottom */}
      <div className="h-1 w-full bg-gray-50 overflow-hidden group-hover:h-1.5 transition-all">
        <div className="h-full bg-red-600 w-0 group-hover:w-full transition-all duration-500"></div>
      </div>
    </div>
  );
}
