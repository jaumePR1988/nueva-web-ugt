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
    <div className="min-h-screen bg-[#f8fafc]">
      <Navbar />
      <div className="container mx-auto px-4 py-12">
        {/* Encabezado */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="flex items-center">
            <div className="p-4 bg-red-600 rounded-2xl shadow-xl shadow-red-200 mr-5">
              <BarChart3 className="h-8 w-8 text-white" />
            </div>
            <div>
              <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mb-1">Métricas de Participación</p>
              <h1 className="text-4xl font-black text-gray-900 tracking-tight">Análisis de Encuestas</h1>
            </div>
          </div>
          {analyses.length > 0 && (
            <div className="flex gap-3">
              <button
                onClick={exportToPDF}
                className="bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-[10px] py-4 px-6 rounded-2xl transition-all shadow-xl shadow-red-200 flex items-center group"
              >
                <FileText className="h-4 w-4 mr-2 group-hover:-translate-y-0.5 transition-transform" />
                Exportar PDF
              </button>
              <button
                onClick={exportToExcel}
                className="bg-green-600 hover:bg-green-700 text-white font-black uppercase tracking-widest text-[10px] py-4 px-6 rounded-2xl transition-all shadow-xl shadow-green-100 flex items-center group"
              >
                <FileSpreadsheet className="h-4 w-4 mr-2 group-hover:-translate-y-0.5 transition-transform" />
                Excel Data
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center py-20 bg-white rounded-[2rem] border border-gray-100 shadow-sm">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Analizando datos...</p>
          </div>
        ) : analyses.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[2rem] border border-gray-100 shadow-sm px-8">
            <BarChart3 className="h-16 w-16 text-gray-100 mx-auto mb-4" />
            <p className="text-gray-500 font-medium text-lg">No hay encuestas para analizar</p>
            <p className="text-gray-400 mt-2 font-medium">Crea encuestas desde el panel de gestión para ver aquí los resultados detallados.</p>
          </div>
        ) : (
          <>
            {/* Resumen General */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest leading-none mb-3">Total Encuestas</p>
                <p className="text-4xl font-black text-gray-900">{analyses.length}</p>
              </div>
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 border-l-4 border-l-red-600">
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest leading-none mb-3">Votos Acumulados</p>
                <p className="text-4xl font-black text-red-600">
                  {analyses.reduce((sum, a) => sum + a.totalResponses, 0)}
                </p>
              </div>
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 text-right">
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest leading-none mb-3">Promedio Participación</p>
                <p className="text-4xl font-black text-gray-900">
                  {analyses.length > 0
                    ? (
                      analyses.reduce((sum, a) => sum + a.totalResponses, 0) / analyses.length
                    ).toFixed(1)
                    : '0'}
                </p>
              </div>
            </div>

            {/* Análisis Individual por Encuesta */}
            <div className="space-y-12">
              {analyses.map((analysis, index) => (
                <div key={analysis.survey.id} className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100 p-10">
                  <div className="mb-10 border-b border-gray-100 pb-8">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                          <span className={`px-4 py-1 text-[10px] font-black uppercase tracking-widest rounded-full ${analysis.survey.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'
                            }`}>
                            {analysis.survey.is_active ? 'Encuesta Activa' : 'Finalizada'}
                          </span>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            Creada: {format(new Date(analysis.survey.created_at), "dd/MM/yyyy", { locale: es })}
                          </span>
                        </div>
                        <h2 className="text-3xl font-black text-gray-900 leading-tight mb-4">
                          {analysis.survey.question}
                        </h2>
                      </div>
                      <div className="bg-red-50 px-8 py-5 rounded-[2rem] text-center min-w-[160px]">
                        <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1">Participación</p>
                        <p className="text-3xl font-black text-red-600">{analysis.totalResponses}</p>
                        <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest">votos totales</p>
                      </div>
                    </div>
                  </div>

                  {analysis.totalResponses > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                      {/* Gráfico de Pastel */}
                      <div className="flex flex-col items-center">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-8 w-full text-center">
                          Distribución Visual de Votos
                        </h3>
                        <div
                          ref={el => chartRefs.current[`chart-${index}`] = el}
                          className="w-full max-w-[320px] aspect-square"
                        >
                          <Pie
                            data={getChartData(analysis)}
                            options={{
                              responsive: true,
                              maintainAspectRatio: true,
                              plugins: {
                                legend: {
                                  position: 'bottom',
                                  labels: {
                                    font: {
                                      family: 'system-ui',
                                      weight: 'bold',
                                      size: 11
                                    },
                                    padding: 20,
                                    usePointStyle: true
                                  }
                                },
                              },
                            }}
                          />
                        </div>
                      </div>

                      {/* Tabla de Resultados */}
                      <div className="bg-gray-50 rounded-[2rem] p-8">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6 ml-2">
                          Métricas por Opción
                        </h3>
                        <div className="overflow-hidden bg-white rounded-3xl border border-gray-100 shadow-sm">
                          <table className="w-full">
                            <thead>
                              <tr className="bg-gray-100/50 border-b border-gray-100">
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                  Opción
                                </th>
                                <th className="px-6 py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                  Votos
                                </th>
                                <th className="px-6 py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                  %
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {Object.entries(analysis.optionLabels).map(([optionId, label]) => {
                                const count = analysis.optionCounts[parseInt(optionId)];
                                const percentage =
                                  analysis.totalResponses > 0
                                    ? ((count / analysis.totalResponses) * 100).toFixed(1)
                                    : '0.0';

                                return (
                                  <tr key={optionId} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 text-sm font-bold text-gray-900">{label}</td>
                                    <td className="px-6 py-4 text-sm text-center font-black text-gray-900">
                                      {count}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-center font-black text-red-600">
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
