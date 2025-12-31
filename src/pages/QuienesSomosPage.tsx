import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { supabase, Delegate } from '@/lib/supabase';
import { Users, User } from 'lucide-react';


export default function QuienesSomosPage() {
  const [delegates, setDelegates] = useState<{
    comite: Delegate[];
    sindical: Delegate[];
    prevencion: Delegate[];
  }>({ comite: [], sindical: [], prevencion: [] });
  const [content, setContent] = useState<Record<string, string>>({});

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: delegateData } = await supabase
      .from('delegates')
      .select('*')
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
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-8">
            <Users className="h-8 w-8 text-red-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">Quiénes Somos</h1>
          </div>

          <div className="bg-white rounded-lg shadow-md p-8 mb-8">
            <p className="text-gray-700 leading-relaxed">
              {content.intro_quienes_somos || 'Cargando...'}
            </p>
          </div>

          <DelegateSection
            title="Comité de Empresa"
            description={content.intro_comite}
            delegates={delegates.comite}
          />
          <DelegateSection
            title="Delegados Sindicales"
            description={content.intro_sindical}
            delegates={delegates.sindical}
          />
          <DelegateSection
            title="Prevención de Riesgos Laborales"
            description={content.intro_prevencion}
            delegates={delegates.prevencion}
          />
        </div>
      </div>
      <Footer />
    </div>
  );
}

function DelegateSection({ title, description, delegates }: {
  title: string;
  description?: string;
  delegates: Delegate[];
}) {
  return (
    <div className="mb-12">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">{title}</h2>
      {description && (
        <p className="text-gray-700 mb-6">{description}</p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {delegates.map(delegate => {
          const photoUrl = delegate.photo_url || delegate.image_url;
          return (
            <div key={delegate.id} className="bg-white rounded-lg shadow-md p-6 text-center">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={delegate.full_name}
                  className="w-24 h-24 rounded-full mx-auto mb-4 object-cover border-4 border-red-100"
                />
              ) : (
                <div className="w-24 h-24 rounded-full mx-auto mb-4 bg-gray-200 flex items-center justify-center border-4 border-gray-100">
                  <User className="h-12 w-12 text-gray-400" />
                </div>
              )}
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {delegate.full_name}
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">{delegate.bio}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
