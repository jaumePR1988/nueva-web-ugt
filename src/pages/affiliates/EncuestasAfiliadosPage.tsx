import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Survey, SurveyResponse } from '@/lib/supabase';
import { Vote, BarChart3, User, BookOpen, Gift } from 'lucide-react';
import { toast } from 'sonner';

export default function EncuestasAfiliadosPage() {
  const { user, isAffiliate } = useAuth();
  const navigate = useNavigate();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [responses, setResponses] = useState<Record<string, SurveyResponse[]>>({});

  useEffect(() => {
    if (!isAffiliate) {
      navigate('/');
      return;
    }
    loadSurveys();
  }, [isAffiliate, navigate]);

  async function loadSurveys() {
    const { data } = await supabase
      .from('surveys')
      .select('*')
      .eq('is_active', true)
      .eq('tipo', 'afiliados')
      .order('created_at', { ascending: false });
    if (data) {
      setSurveys(data);
      data.forEach(survey => loadResponses(survey.id));
    }
  }

  async function loadResponses(surveyId: string) {
    const { data } = await supabase
      .from('survey_responses')
      .select('*')
      .eq('survey_id', surveyId);
    if (data) {
      setResponses(prev => ({ ...prev, [surveyId]: data }));
    }
  }

  async function handleVote(surveyId: string, optionId: number) {
    if (!user) {
      toast.error('Debes iniciar sesión para votar');
      return;
    }

    try {
      const { error } = await supabase
        .from('survey_responses')
        .insert([{
          survey_id: surveyId,
          user_id: user.id,
          selected_option_id: optionId
        }]);

      if (error) {
        if (error.code === '23505') {
          toast.error('Ya has votado en esta encuesta');
        } else {
          throw error;
        }
      } else {
        toast.success('Voto registrado correctamente');
        loadResponses(surveyId);
      }
    } catch (error) {
      toast.error('Error al votar');
    }
  }

  function getResults(survey: Survey) {
    const surveyResponses = responses[survey.id] || [];
    const totalVotes = surveyResponses.length;
    
    return survey.options.map(option => {
      const votes = surveyResponses.filter(r => r.selected_option_id === option.id).length;
      const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
      return { ...option, votes, percentage };
    });
  }

  function hasVoted(surveyId: string) {
    const surveyResponses = responses[surveyId] || [];
    return surveyResponses.some(r => r.user_id === user?.id);
  }

  const menuItems = [
    { icon: User, label: 'Dashboard', path: '/afiliados/dashboard' },
    { icon: BookOpen, label: 'Biblioteca', path: '/afiliados/biblioteca' },
    { icon: Vote, label: 'Encuestas', path: '/afiliados/encuestas' },
    { icon: Gift, label: 'Beneficios', path: '/afiliados/beneficios' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Navegación Lateral */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Menú de Afiliado</h2>
              <nav className="space-y-2">
                {menuItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-red-50 transition"
                  >
                    <item.icon className="h-5 w-5 text-red-600" />
                    <span className="text-gray-700">{item.label}</span>
                  </Link>
                ))}
              </nav>
            </div>
          </div>

          {/* Contenido Principal */}
          <div className="md:col-span-3">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-6">
                <Vote className="h-8 w-8 text-red-600 mr-3" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Encuestas para Afiliados</h1>
                  <p className="text-gray-600 text-sm">Participa en las encuestas exclusivas para afiliados UGT</p>
                </div>
              </div>

              <div className="space-y-6">
                {surveys.length === 0 ? (
                  <div className="text-center py-12">
                    <Vote className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No hay encuestas activas para afiliados en este momento</p>
                  </div>
                ) : (
                  surveys.map((survey) => {
                    const voted = hasVoted(survey.id);
                    const results = getResults(survey);
                    const totalVotes = results.reduce((sum, r) => sum + r.votes, 0);

                    return (
                      <div key={survey.id} className="border border-gray-200 rounded-lg p-6">
                        <div className="flex items-start justify-between mb-4">
                          <h3 className="text-xl font-bold text-gray-900">{survey.question}</h3>
                          <span className="px-3 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
                            Solo Afiliados
                          </span>
                        </div>

                        {!voted ? (
                          <div className="space-y-3">
                            {survey.options.map((option) => (
                              <button
                                key={option.id}
                                onClick={() => handleVote(survey.id, option.id)}
                                className="w-full text-left px-4 py-3 border-2 border-gray-200 rounded-lg hover:border-red-600 hover:bg-red-50 transition"
                              >
                                <span className="font-medium text-gray-900">{option.text}</span>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="flex items-center text-sm text-green-600 mb-3">
                              <BarChart3 className="h-4 w-4 mr-2" />
                              Ya has votado. Resultados (Total: {totalVotes} votos)
                            </div>
                            {results.map((result) => (
                              <div key={result.id}>
                                <div className="flex justify-between mb-1">
                                  <span className="text-sm font-medium text-gray-700">{result.text}</span>
                                  <span className="text-sm text-gray-600">{result.percentage}% ({result.votes})</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3">
                                  <div
                                    className="bg-red-600 h-3 rounded-full transition-all"
                                    style={{ width: `${result.percentage}%` }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
