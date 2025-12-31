import React, { useEffect, useState, useRef } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase';
import { BarChart3, Download, FileText, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

interface Survey {
  id: string;
  question: string;
  options: any;
  is_active: boolean;
  created_at: string;
}

interface SurveyResponse {
  id: string;
  survey_id: string;
  user_id: string;
  selected_option_id: number;
  created_at: string;
}

interface SurveyAnalysis {
  survey: Survey;
  responses: SurveyResponse[];
  totalResponses: number;
  optionCounts: { [key: number]: number };
  optionLabels: { [key: number]: string };
}

export default function AdminEncuestasAnalisis() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [analyses, setAnalyses] = useState<SurveyAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const chartRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    loadSurveysAndAnalyze();
  }, []);

  async function loadSurveysAndAnalyze() {
    setLoading(true);
    
    // Cargar todas las encuestas
    const { data: surveysData, error: surveysError } = await supabase
      .from('surveys')
      .select('*')
      .order('created_at', { ascending: false });

    if (surveysError) {
      console.error('Error al cargar encuestas:', surveysError);
      toast.error('Error al cargar las encuestas');
      setLoading(false);
      return;
    }

    // Cargar todas las respuestas
    const { data: responsesData, error: responsesError } = await supabase
      .from('survey_responses')
      .select('*');

    if (responsesError) {
      console.error('Error al cargar respuestas:', responsesError);
      toast.error('Error al cargar las respuestas');
      setLoading(false);
      return;
    }

    setSurveys(surveysData || []);

    // Analizar cada encuesta
    const analysisResults: SurveyAnalysis[] = (surveysData || []).map((survey) => {
      const surveyResponses = (responsesData || []).filter(
        (response) => response.survey_id === survey.id
      );

      // Contar respuestas por opción
      const optionCounts: { [key: number]: number } = {};
      const optionLabels: { [key: number]: string } = {};

      // Inicializar contadores y etiquetas usando option.id
      survey.options.forEach((option: any) => {
        optionCounts[option.id] = 0;
        optionLabels[option.id] = option.text || `Opción ${option.id}`;
      });

      // Contar respuestas
      surveyResponses.forEach((response) => {
        if (optionCounts[response.selected_option_id] !== undefined) {
          optionCounts[response.selected_option_id]++;
        }
      });

      return {
        survey,
        responses: surveyResponses,
        totalResponses: surveyResponses.length,
        optionCounts,
        optionLabels,
      };
    });

    setAnalyses(analysisResults);
    setLoading(false);
  }

  function getChartData(analysis: SurveyAnalysis) {
    const labels = Object.values(analysis.optionLabels);
    const data = Object.values(analysis.optionCounts);

    return {
      labels,
      datasets: [
        {
          label: 'Respuestas',
          data,
          backgroundColor: [
            'rgba(239, 68, 68, 0.8)',   // red-500
            'rgba(59, 130, 246, 0.8)',  // blue-500
            'rgba(34, 197, 94, 0.8)',   // green-500
            'rgba(251, 191, 36, 0.8)',  // yellow-500
            'rgba(168, 85, 247, 0.8)',  // purple-500
            'rgba(236, 72, 153, 0.8)',  // pink-500
          ],
          borderColor: [
            'rgba(239, 68, 68, 1)',
            'rgba(59, 130, 246, 1)',
            'rgba(34, 197, 94, 1)',
            'rgba(251, 191, 36, 1)',
            'rgba(168, 85, 247, 1)',
            'rgba(236, 72, 153, 1)',
          ],
          borderWidth: 2,
        },
      ],
    };
  }

  async function exportToPDF() {
    toast.info('Generando PDF con gráficos...');

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPosition = 20;

      // Título
      pdf.setFontSize(20);
      pdf.setTextColor(220, 38, 38); // red-600
      pdf.text('Análisis de Encuestas - UGT Towa', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;

      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Generado el ${format(new Date(), "d 'de' MMMM, yyyy HH:mm", { locale: es })}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      // Resumen general
      pdf.setFontSize(14);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Resumen General', 15, yPosition);
      yPosition += 8;

      pdf.setFontSize(10);
      pdf.text(`Total de encuestas: ${analyses.length}`, 15, yPosition);
      yPosition += 6;
      const totalResponses = analyses.reduce((sum, a) => sum + a.totalResponses, 0);
      pdf.text(`Total de respuestas: ${totalResponses}`, 15, yPosition);
      yPosition += 12;

      // Detalles de cada encuesta con gráficos
      for (let i = 0; i < analyses.length; i++) {
        const analysis = analyses[i];

        // Nueva página para cada encuesta
        if (i > 0) {
          pdf.addPage();
          yPosition = 20;
        }

        pdf.setFontSize(12);
        pdf.setTextColor(220, 38, 38);
        pdf.text(`Encuesta ${i + 1}: ${analysis.survey.question}`, 15, yPosition);
        yPosition += 8;

        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 0);
        pdf.text(`Estado: ${analysis.survey.is_active ? 'Activa' : 'Inactiva'}`, 15, yPosition);
        yPosition += 6;
        pdf.text(`Total de respuestas: ${analysis.totalResponses}`, 15, yPosition);
        yPosition += 8;

        // Tabla de resultados
        pdf.setFillColor(240, 240, 240);
        pdf.rect(15, yPosition, pageWidth - 30, 8, 'F');
        pdf.setFontSize(9);
        pdf.setTextColor(0, 0, 0);
        pdf.text('Opción', 20, yPosition + 5);
        pdf.text('Respuestas', pageWidth - 50, yPosition + 5);
        pdf.text('%', pageWidth - 25, yPosition + 5);
        yPosition += 8;

        Object.entries(analysis.optionLabels).forEach(([optionId, label]) => {
          const count = analysis.optionCounts[parseInt(optionId)];
          const percentage = analysis.totalResponses > 0 
            ? ((count / analysis.totalResponses) * 100).toFixed(1) 
            : '0.0';

          pdf.setFontSize(9);
          pdf.text(label.substring(0, 50), 20, yPosition + 5); // Limitar longitud
          pdf.text(count.toString(), pageWidth - 50, yPosition + 5);
          pdf.text(`${percentage}%`, pageWidth - 25, yPosition + 5);
          yPosition += 6;
        });

        yPosition += 10;

        // Capturar y agregar gráfico si hay respuestas
        if (analysis.totalResponses > 0 && chartRefs.current[`chart-${i}`]) {
          const chartElement = chartRefs.current[`chart-${i}`];
          if (chartElement) {
            try {
              const canvas = await html2canvas(chartElement, {
                scale: 1.5,
                useCORS: true,
                backgroundColor: '#ffffff'
              });
              
              const imgData = canvas.toDataURL('image/png');
              // Reducir tamaño a 100mm de ancho (aproximadamente la mitad de la página)
              const imgWidth = 100;
              const imgHeight = (canvas.height * imgWidth) / canvas.width;
              
              // Verificar si hay suficiente espacio en la página
              if (yPosition + imgHeight > pageHeight - 20) {
                pdf.addPage();
                yPosition = 20;
              }
              
              // Centrar gráfico horizontalmente
              const xPosition = (pageWidth - imgWidth) / 2;
              pdf.addImage(imgData, 'PNG', xPosition, yPosition, imgWidth, imgHeight);
              yPosition += imgHeight + 10;
            } catch (err) {
              console.error('Error capturando gráfico:', err);
            }
          }
        }
      }

      pdf.save(`analisis-encuestas-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      toast.success('PDF generado correctamente con gráficos');
    } catch (error) {
      console.error('Error al generar PDF:', error);
      toast.error('Error al generar el PDF');
    }
  }

  async function exportToExcel() {
    toast.info('Generando Excel...');

    try {
      const workbook = XLSX.utils.book_new();

      // Hoja de resumen
      const summaryData = [
        ['Análisis de Encuestas - UGT Towa'],
        [`Generado el ${format(new Date(), "d 'de' MMMM, yyyy HH:mm", { locale: es })}`],
        [],
        ['Total de encuestas', analyses.length],
        ['Total de respuestas', analyses.reduce((sum, a) => sum + a.totalResponses, 0)],
        [],
      ];

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen');

      // Hoja de detalles por encuesta
      analyses.forEach((analysis, index) => {
        const sheetData = [
          [`Encuesta: ${analysis.survey.question}`],
          [`Estado: ${analysis.survey.is_active ? 'Activa' : 'Inactiva'}`],
          [`Creada el: ${format(new Date(analysis.survey.created_at), "d 'de' MMM, yyyy", { locale: es })}`],
          [`Total de respuestas: ${analysis.totalResponses}`],
          [],
          ['Opción', 'Respuestas', 'Porcentaje'],
        ];

        Object.entries(analysis.optionLabels).forEach(([optionId, label]) => {
          const count = analysis.optionCounts[parseInt(optionId)];
          const percentage = analysis.totalResponses > 0 
            ? ((count / analysis.totalResponses) * 100).toFixed(1) + '%'
            : '0.0%';
          sheetData.push([label, count.toString(), percentage]);
        });

        const sheet = XLSX.utils.aoa_to_sheet(sheetData);
        XLSX.utils.book_append_sheet(workbook, sheet, `Encuesta ${index + 1}`);
      });

      // Hoja de respuestas individuales
      const allResponsesData = [['ID Encuesta', 'Pregunta', 'Opción Seleccionada', 'Fecha']];
      
      analyses.forEach((analysis) => {
        analysis.responses.forEach((response) => {
          const optionLabel = analysis.optionLabels[response.selected_option_id] || 'Desconocida';
          allResponsesData.push([
            analysis.survey.id,
            analysis.survey.question,
            optionLabel,
            format(new Date(response.created_at), "d 'de' MMM, yyyy HH:mm", { locale: es }),
          ]);
        });
      });

      const responsesSheet = XLSX.utils.aoa_to_sheet(allResponsesData);
      XLSX.utils.book_append_sheet(workbook, responsesSheet, 'Todas las Respuestas');

      XLSX.writeFile(workbook, `analisis-encuestas-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
      toast.success('Excel generado correctamente');
    } catch (error) {
      console.error('Error al generar Excel:', error);
      toast.error('Error al generar el Excel');
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <BarChart3 className="h-8 w-8 text-red-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Análisis de Encuestas</h1>
          </div>
          {analyses.length > 0 && (
            <div className="flex gap-3">
              <button
                onClick={exportToPDF}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Exportar PDF
              </button>
              <button
                onClick={exportToExcel}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Exportar Excel
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500">Cargando análisis...</p>
          </div>
        ) : analyses.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-xl text-gray-500">No hay encuestas para analizar</p>
            <p className="text-gray-400 mt-2">Crea encuestas desde el panel de administración</p>
          </div>
        ) : (
          <>
            {/* Resumen General */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <p className="text-sm text-gray-600 mb-1">Total Encuestas</p>
                <p className="text-3xl font-bold text-gray-900">{analyses.length}</p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <p className="text-sm text-gray-600 mb-1">Total Respuestas</p>
                <p className="text-3xl font-bold text-gray-900">
                  {analyses.reduce((sum, a) => sum + a.totalResponses, 0)}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <p className="text-sm text-gray-600 mb-1">Promedio de Participación</p>
                <p className="text-3xl font-bold text-gray-900">
                  {analyses.length > 0
                    ? (
                        analyses.reduce((sum, a) => sum + a.totalResponses, 0) / analyses.length
                      ).toFixed(1)
                    : '0'}
                </p>
              </div>
            </div>

            {/* Análisis Individual por Encuesta */}
            <div className="space-y-8">
              {analyses.map((analysis, index) => (
                <div key={analysis.survey.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="mb-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                          {analysis.survey.question}
                        </h2>
                        <div className="flex gap-4 text-sm text-gray-600">
                          <span>
                            Estado:{' '}
                            <span
                              className={`font-semibold ${
                                analysis.survey.is_active ? 'text-green-600' : 'text-gray-500'
                              }`}
                            >
                              {analysis.survey.is_active ? 'Activa' : 'Inactiva'}
                            </span>
                          </span>
                          <span>
                            Creada:{' '}
                            {format(
                              new Date(analysis.survey.created_at),
                              "d 'de' MMM, yyyy",
                              { locale: es }
                            )}
                          </span>
                          <span className="font-semibold text-red-600">
                            {analysis.totalResponses} respuestas
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {analysis.totalResponses > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Gráfico de Pastel */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4 text-gray-700">
                          Distribución de Respuestas
                        </h3>
                        <div className="flex justify-center">
                          <div 
                            ref={el => chartRefs.current[`chart-${index}`] = el}
                            className="w-80 h-80"
                          >
                            <Pie 
                              data={getChartData(analysis)} 
                              options={{
                                responsive: true,
                                maintainAspectRatio: true,
                                plugins: {
                                  legend: {
                                    position: 'bottom',
                                  },
                                },
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Tabla de Resultados */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4 text-gray-700">
                          Detalle de Resultados
                        </h3>
                        <div className="overflow-hidden border border-gray-200 rounded-lg">
                          <table className="w-full">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                  Opción
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                  Votos
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                  %
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {Object.entries(analysis.optionLabels).map(([optionId, label]) => {
                                const count = analysis.optionCounts[parseInt(optionId)];
                                const percentage =
                                  analysis.totalResponses > 0
                                    ? ((count / analysis.totalResponses) * 100).toFixed(1)
                                    : '0.0';

                                return (
                                  <tr key={optionId} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm text-gray-900">{label}</td>
                                    <td className="px-4 py-3 text-sm text-center font-semibold text-gray-900">
                                      {count}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-center font-semibold text-red-600">
                                      {percentage}%
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Esta encuesta aún no tiene respuestas</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}
