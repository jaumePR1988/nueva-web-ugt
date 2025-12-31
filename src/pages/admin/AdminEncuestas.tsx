import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { supabase, Survey } from '@/lib/supabase';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminEncuestas() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [tipo, setTipo] = useState<'publica' | 'afiliados'>('publica');

  useEffect(() => {
    loadSurveys();
  }, []);

  async function loadSurveys() {
    const { data } = await supabase.from('surveys').select('*').order('created_at', { ascending: false });
    if (data) setSurveys(data);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const formattedOptions = options.filter(o => o.trim()).map((text, idx) => ({ id: idx + 1, text }));
    const { error } = await supabase.from('surveys').insert([{ 
      question, 
      options: formattedOptions, 
      is_active: true,
      tipo 
    }]);
    if (error) toast.error('Error al crear encuesta');
    else { 
      toast.success('Encuesta creada'); 
      setShowForm(false); 
      setQuestion('');
      setOptions(['', '']);
      setTipo('publica');
      loadSurveys(); 
    }
  }

  async function toggleActive(id: string, currentStatus: boolean) {
    const { error } = await supabase.from('surveys').update({ is_active: !currentStatus }).eq('id', id);
    if (error) toast.error('Error al actualizar');
    else { toast.success(currentStatus ? 'Encuesta desactivada' : 'Encuesta activada'); loadSurveys(); }
  }

  async function handleDelete(id: string) {
    if (confirm('¿Eliminar esta encuesta? Se perderán todas las respuestas.')) {
      const { error } = await supabase.from('surveys').delete().eq('id', id);
      if (error) toast.error('Error al eliminar');
      else { toast.success('Eliminada'); loadSurveys(); }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-12">
        <div className="flex justify-between mb-8">
          <h1 className="text-3xl font-bold">Gestionar Encuestas</h1>
          <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
            <Plus className="inline h-5 w-5 mr-1" /> Nueva
          </button>
        </div>
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow mb-8">
            <h2 className="text-xl font-bold mb-4">Nueva Encuesta</h2>
            <input type="text" placeholder="Pregunta" value={question} onChange={e => setQuestion(e.target.value)} className="w-full p-3 border rounded mb-4" required />
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Encuesta</label>
              <select 
                value={tipo} 
                onChange={e => setTipo(e.target.value as 'publica' | 'afiliados')}
                className="w-full p-3 border rounded"
              >
                <option value="publica">Pública (Todos pueden participar)</option>
                <option value="afiliados">Solo Afiliados</option>
              </select>
            </div>

            <p className="text-sm text-gray-600 mb-2">Opciones de respuesta:</p>
            {options.map((opt, idx) => (
              <div key={idx} className="flex gap-2 mb-2">
                <input type="text" placeholder={`Opción ${idx + 1}`} value={opt} onChange={e => {
                  const newOpts = [...options];
                  newOpts[idx] = e.target.value;
                  setOptions(newOpts);
                }} className="flex-1 p-3 border rounded" required />
                {options.length > 2 && (
                  <button type="button" onClick={() => setOptions(options.filter((_, i) => i !== idx))} className="px-3 text-red-600 hover:bg-red-50 rounded">
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={() => setOptions([...options, ''])} className="text-red-600 text-sm mb-4 hover:underline">
              + Añadir opción
            </button>
            <div className="flex gap-2 mt-4">
              <button type="submit" className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700">Crear Encuesta</button>
              <button type="button" onClick={() => { setShowForm(false); setQuestion(''); setOptions(['', '']); setTipo('publica'); }} className="px-6 py-2 bg-gray-200 rounded hover:bg-gray-300">Cancelar</button>
            </div>
          </form>
        )}
        <div className="space-y-4">
          {surveys.map(survey => (
            <div key={survey.id} className="bg-white p-6 rounded-lg shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-xl font-bold">{survey.question}</h3>
                    <span className={`px-3 py-1 text-xs rounded-full ${survey.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {survey.is_active ? 'Activa' : 'Inactiva'}
                    </span>
                    <span className={`px-3 py-1 text-xs rounded-full ${(survey as any).tipo === 'afiliados' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                      {(survey as any).tipo === 'afiliados' ? 'Solo Afiliados' : 'Pública'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {survey.options.map((opt: any) => (
                      <div key={opt.id} className="mb-1">• {opt.text}</div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <button 
                    onClick={() => toggleActive(survey.id, survey.is_active)} 
                    className={`px-4 py-2 rounded text-sm ${survey.is_active ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                  >
                    {survey.is_active ? 'Desactivar' : 'Activar'}
                  </button>
                  <button onClick={() => handleDelete(survey.id)} className="px-4 py-2 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200">
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}
