import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Survey, SurveyResponse } from '@/lib/supabase';
import { Vote, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';


export default function EncuestasPage() {
  const { user } = useAuth();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [responses, setResponses] = useState<Record<string, SurveyResponse[]>>({});

  useEffect(() => {
    loadSurveys();
  }, []);

  async function loadSurveys() {
    const { data } = await supabase
      .from('surveys')
      .select('*')
      .eq('is_active', true)
      .eq('tipo', 'publica')
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center mb-8">
          <Vote className="h-8 w-8 text-red-600 mr-3" />
          <h1 className="text-4xl font-bold text-gray-900">Encuestas</h1>
        </div>

        <div className="max-w-3xl mx-auto space-y-8">
          {surveys.map(survey => {
            const results = getResults(survey);
            const totalVotes = responses[survey.id]?.length || 0;
            const hasVoted = user && responses[survey.id]?.some(r => r.user_id === user.id);

            return (
              <div key={survey.id} className="bg-white rounded-lg shadow-md p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">{survey.question}</h2>

                <div className="space-y-4">
                  {results.map(option => (
                    <div key={option.id}>
                      {!hasVoted ? (
                        <button
                          onClick={() => handleVote(survey.id, option.id)}
                          className="w-full text-left p-4 border-2 border-gray-200 rounded-lg hover:border-red-600 hover:bg-red-50 transition"
                        >
                          {option.text}
                        </button>
                      ) : (
                        <div className="p-4 border border-gray-200 rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium">{option.text}</span>
                            <span className="text-red-600 font-bold">{option.percentage}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                              className="bg-red-600 h-3 rounded-full transition-all duration-500"
                              style={{ width: `${option.percentage}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{option.votes} votos</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex items-center text-sm text-gray-500">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  <span>Total de votos: {totalVotes}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <Footer />
    </div>
  );
}
