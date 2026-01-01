import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, AppointmentSlot, Appointment, AttachmentFile } from '@/lib/supabase';
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, Upload, X, FileText, Loader2, ShieldCheck, UserCheck, ArrowRight, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'
];


export default function CitasPage() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedType, setSelectedType] = useState<'sindical' | 'prevencion'>('sindical');
  const [slots, setSlots] = useState<AppointmentSlot[]>([]);
  const [myAppointments, setMyAppointments] = useState<Appointment[]>([]);

  // Modal de reserva
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<AppointmentSlot | null>(null);
  const [comments, setComments] = useState('');
  const [questions, setQuestions] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<AttachmentFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isBooking, setIsBooking] = useState(false);

  useEffect(() => {
    loadSlots();
    if (user) loadMyAppointments();
  }, [selectedDate, selectedType, user]);

  async function loadSlots() {
    const dateStr = selectedDate.toISOString().split('T')[0];

    // 1. Fetch appointments and blocks for this day and type
    const { data: existingSlots } = await supabase
      .from('appointment_slots')
      .select('*')
      .eq('appointment_date', dateStr)
      .eq('delegate_type', selectedType);

    const { data: existingAppointments } = await supabase
      .from('appointments')
      .select('start_time, status')
      .eq('delegate_type', selectedType)
      .neq('status', 'cancelled');

    // 2. Generate virtual slots based on TIME_SLOTS
    const generatedSlots: AppointmentSlot[] = TIME_SLOTS.map(time => {
      const startIso = `${dateStr}T${time}:00`;
      const endHour = parseInt(time.split(':')[0]) + 1;
      const endIso = `${dateStr}T${endHour.toString().padStart(2, '0')}:${time.split(':')[1]}:00`;

      // Check if blocked in appointment_slots
      const block = existingSlots?.find(s => s.start_time.includes(time) && s.status === 'blocked');

      // Check if occupied by an appointment
      const isOccupied = existingAppointments?.some(apt =>
        format(new Date(apt.start_time), 'HH:mm') === time
      );

      return {
        id: block?.id || `virtual-${time}`,
        delegate_type: selectedType,
        start_time: startIso,
        end_time: endIso,
        appointment_date: dateStr,
        status: block ? 'blocked' : (isOccupied ? 'occupied' : 'available'),
        block_reason: block?.block_reason
      };
    });

    setSlots(generatedSlots.filter(s => s.status === 'available'));
  }

  async function loadMyAppointments() {
    const { data } = await supabase
      .from('appointments')
      .select('*, slot:appointment_slots(*)')
      .eq('user_id', user?.id)
      .order('start_time', { ascending: false });
    if (data) setMyAppointments(data as any);
  }

  function openBookingModal(slot: AppointmentSlot) {
    if (!user) {
      toast.error('Debes iniciar sesión para reservar una cita');
      return;
    }
    setSelectedSlot(slot);
    setShowBookingModal(true);
    setComments('');
    setQuestions('');
    setUploadedFiles([]);
  }

  function closeBookingModal() {
    setShowBookingModal(false);
    setSelectedSlot(null);
    setComments('');
    setQuestions('');
    setUploadedFiles([]);
  }

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`El archivo ${file.name} excede el tamaño máximo de 5MB`);
        continue;
      }
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        toast.error(`El archivo ${file.name} no es de un tipo permitido`);
        continue;
      }

      try {
        const formData = new FormData();
        formData.append('file', file);
        const { data, error } = await supabase.functions.invoke('upload-appointment-document', { body: formData });
        if (error) throw error;
        if (data && data.success) {
          setUploadedFiles(prev => [...prev, { url: data.url, fileName: data.fileName, fileSize: data.fileSize, fileType: data.fileType }]);
          toast.success(`Archivo ${file.name} subido correctamente`);
        }
      } catch (error: any) {
        console.error('Error al subir archivo:', error);
        toast.error(`Error al subir ${file.name}: ${error.message}`);
      }
    }
    setIsUploading(false);
    event.target.value = '';
  }

  function removeFile(index: number) {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  }

  async function handleConfirmBooking() {
    if (!user || !selectedSlot) return;
    setIsBooking(true);
    try {
      const { data: newAppointment, error } = await supabase
        .from('appointments')
        .insert([{
          user_id: user.id,
          slot_id: selectedSlot.id.startsWith('virtual-') ? null : selectedSlot.id,
          delegate_type: selectedType,
          appointment_date: selectedSlot.appointment_date,
          start_time: selectedSlot.start_time,
          end_time: selectedSlot.end_time,
          appointment_time: format(new Date(selectedSlot.start_time), 'HH:mm'),
          comments: comments || null,
          questions: questions || null,
          documents: uploadedFiles.length > 0 ? uploadedFiles : null,
          status: 'confirmed'
        }])
        .select()
        .single();

      if (error) throw error;

      await supabase.functions.invoke('notify-appointment', { body: { appointmentId: newAppointment.id, action: 'confirmed' } }).catch(console.error);

      toast.success('Cita reservada correctamente. Recibirás una confirmación por email.');
      closeBookingModal();
      loadSlots();
      loadMyAppointments();
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    } finally {
      setIsBooking(false);
    }
  }

  async function handleCancelAppointment(appointmentId: string) {
    if (!confirm('¿Estás seguro de que quieres cancelar esta cita?')) return;
    const { error } = await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', appointmentId);
    if (!error) {
      await supabase.functions.invoke('notify-appointment', { body: { appointmentId, action: 'cancelled' } }).catch(console.error);
      toast.success('Cita cancelada correctamente');
      loadSlots();
      loadMyAppointments();
    }
  }

  const dateStr = format(selectedDate, "eeee, d 'de' MMMM", { locale: es });

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-[#dc2626] text-white pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[10px] font-black uppercase tracking-widest mb-6">
              <CalendarIcon className="h-3 w-3 mr-2" />
              Reserva de Espacios
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-4 leading-tight">
              Atención Personalizada
            </h1>
            <p className="text-lg text-red-50 font-medium leading-relaxed opacity-90">
              Reserva tu cita con los delegados sindicales o de prevención para consultas, asesoramiento o gestiones.
            </p>
          </div>
        </div>
      </section>

      <main className="flex-1 container mx-auto px-4 -mt-8 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Main Booking Area */}
          <div className="lg:col-span-8 space-y-6">

            {/* Delegate Type Selector */}
            <div className="bg-white rounded-[2rem] shadow-xl shadow-gray-200/50 p-8 border border-gray-100">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-xl font-black text-gray-900 leading-tight">¿Con quién quieres reunirte?</h2>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Selecciona el tipo de apoyo que necesitas</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => setSelectedType('sindical')}
                  className={`relative p-6 rounded-3xl border-2 transition-all duration-300 text-left group ${selectedType === 'sindical'
                    ? 'border-red-600 bg-red-50/50 ring-4 ring-red-600/5'
                    : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                    }`}
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-colors ${selectedType === 'sindical' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-400 group-hover:text-gray-600'
                    }`}>
                    <UserCheck className="h-6 w-6" />
                  </div>
                  <h3 className={`font-black uppercase tracking-widest text-[13px] mb-2 ${selectedType === 'sindical' ? 'text-red-700' : 'text-gray-900'}`}>Asesor sindical</h3>
                  <p className="text-xs text-gray-500 font-medium leading-relaxed">Dudas sobre convenios, nóminas, derechos laborales y acción sindical directa.</p>
                  {selectedType === 'sindical' && <div className="absolute top-6 right-6 w-2 h-2 rounded-full bg-red-600 animate-pulse" />}
                </button>

                <button
                  onClick={() => setSelectedType('prevencion')}
                  className={`relative p-6 rounded-3xl border-2 transition-all duration-300 text-left group ${selectedType === 'prevencion'
                    ? 'border-red-600 bg-red-50/50 ring-4 ring-red-600/5'
                    : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                    }`}
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-colors ${selectedType === 'prevencion' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-400 group-hover:text-gray-600'
                    }`}>
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <h3 className={`font-black uppercase tracking-widest text-[13px] mb-2 ${selectedType === 'prevencion' ? 'text-red-700' : 'text-gray-900'}`}>Delegado de prevención</h3>
                  <p className="text-xs text-gray-500 font-medium leading-relaxed">Salud laboral, seguridad en planta, riesgos de puesto y condiciones ambientales.</p>
                  {selectedType === 'prevencion' && <div className="absolute top-6 right-6 w-2 h-2 rounded-full bg-red-600 animate-pulse" />}
                </button>
              </div>
            </div>

            {/* Date and Time Selector */}
            <div className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/50 p-8 lg:p-10 border border-gray-100 overflow-hidden">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-10 pb-10 border-b border-gray-50">
                <button
                  onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() - 1); setSelectedDate(d); }}
                  className="p-4 bg-gray-50 text-gray-400 hover:bg-red-600 hover:text-white rounded-2xl transition-all shadow-sm"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                <div className="text-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-red-600 block mb-1">Agenda del día</span>
                  <h2 className="text-2xl font-black text-gray-900 capitalize tracking-tight">{dateStr}</h2>
                </div>

                <button
                  onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() + 1); setSelectedDate(d); }}
                  className="p-4 bg-gray-50 text-gray-400 hover:bg-red-600 hover:text-white rounded-2xl transition-all shadow-sm"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              {slots.length === 0 ? (
                <div className="py-20 text-center">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CalendarIcon className="h-10 w-10 text-gray-200" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">No hay huecos disponibles</h3>
                  <p className="text-gray-400 text-sm max-w-xs mx-auto">Selecciona otra fecha para ver la disponibilidad de los delegados.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {slots.map(slot => (
                    <button
                      key={slot.id}
                      onClick={() => openBookingModal(slot)}
                      className="group relative p-6 bg-white border border-gray-100 rounded-[2rem] hover:border-red-600 hover:shadow-xl hover:shadow-red-600/10 transition-all duration-300 text-center"
                    >
                      <Clock className="h-5 w-5 mx-auto mb-3 text-red-600 group-hover:scale-110 transition-transform" />
                      <p className="font-black text-lg text-gray-900 tracking-tight">{slot.start_time.split(' ')[1]?.substring(0, 5) || slot.start_time.substring(11, 16)}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Disponible</p>
                      <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="inline-flex items-center text-[10px] font-black uppercase text-red-600">
                          Reservar <ArrowRight className="h-3 w-3 ml-1" />
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - My Appointments */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-[2rem] shadow-xl shadow-gray-200/50 p-8 border border-gray-100 sticky top-28">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-black text-gray-900">Mis Citas</h2>
                <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
                  <span className="text-[10px] font-black text-red-600">{myAppointments.filter(a => a.status !== 'cancelled').length}</span>
                </div>
              </div>

              <div className="space-y-4">
                {myAppointments.filter(a => a.status !== 'cancelled').length === 0 ? (
                  <div className="py-10 text-center border-2 border-dashed border-gray-50 rounded-3xl">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Sin citas activas</p>
                  </div>
                ) : (
                  myAppointments.filter(a => a.status !== 'cancelled').map(apt => (
                    <div key={apt.id} className="p-5 bg-gray-50/50 rounded-3xl border border-gray-100 hover:bg-white hover:shadow-lg transition-all duration-300 group">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${apt.delegate_type === 'sindical' ? 'bg-red-600 text-white' : 'bg-gray-900 text-white'
                          }`}>
                          {apt.delegate_type === 'sindical' ? 'Sindical' : 'Prevención'}
                        </div>
                        <button
                          onClick={() => handleCancelAppointment(apt.id)}
                          className="p-2 text-gray-300 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center text-xs font-bold text-gray-900">
                          <CalendarIcon className="h-4 w-4 mr-3 text-red-600" />
                          {format(new Date(apt.start_time), "d 'de' MMMM", { locale: es })}
                        </div>
                        <div className="flex items-center text-xs font-bold text-gray-600">
                          <Clock className="h-4 w-4 mr-3 text-red-600" />
                          {format(new Date(apt.start_time), 'HH:mm')} - {format(new Date(apt.end_time), 'HH:mm')}
                        </div>
                      </div>

                      <div className="mt-5 pt-5 border-t border-gray-100 flex items-center justify-between">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-green-50 text-green-700 text-[9px] font-black uppercase tracking-widest">Confirmada</span>
                        <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-red-600 transition-colors group-hover:translate-x-1" />
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-8 p-6 bg-red-600 rounded-3xl text-white relative overflow-hidden group">
                <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
                  <CalendarIcon size={120} />
                </div>
                <h4 className="font-black text-sm mb-2 relative z-10">Recordatorio</h4>
                <p className="text-[11px] font-medium opacity-90 leading-relaxed relative z-10">
                  Si no puedes asistir, por favor cancela con al menos 24h de antelación para que otros compañeros puedan aprovechar el hueco.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Booking Modal */}
      {showBookingModal && selectedSlot && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/20">
            <div className="p-8 lg:p-10 border-b border-gray-50 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">Cerrar Reserva</h2>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Completa los detalles de tu reunión</p>
              </div>
              <button onClick={closeBookingModal} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-gray-50 text-gray-400 hover:bg-red-600 hover:text-white transition-all shadow-sm"><X className="h-6 w-6" /></button>
            </div>

            <div className="p-8 lg:p-10 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100">
                  <span className="text-[10px] font-black uppercase tracking-widest text-red-600 block mb-3">Día seleccionado</span>
                  <div className="flex items-center font-black text-gray-900">
                    <CalendarIcon className="h-5 w-5 mr-3 text-red-600" />
                    {format(new Date(selectedSlot.start_time), "dd/MM/yyyy")}
                  </div>
                </div>
                <div className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100">
                  <span className="text-[10px] font-black uppercase tracking-widest text-red-600 block mb-3">Horario</span>
                  <div className="flex items-center font-black text-gray-900">
                    <Clock className="h-5 w-5 mr-3 text-red-600" />
                    {format(new Date(selectedSlot.start_time), "HH:mm")}h
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Motivo de la consulta</label>
                  <textarea
                    value={questions}
                    onChange={(e) => setQuestions(e.target.value)}
                    placeholder="Describe brevemente de qué quieres hablar..."
                    className="w-full h-32 px-6 py-5 bg-gray-50 border-none rounded-[2rem] focus:ring-4 focus:ring-red-600/10 focus:bg-white transition-all resize-none text-sm font-medium"
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Documentación relevante</label>
                  <div className="relative group">
                    <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={handleFileUpload} className="hidden" id="modal-file-upload" disabled={isUploading} />
                    <label htmlFor="modal-file-upload" className="flex flex-col items-center justify-center w-full py-10 border-2 border-dashed border-gray-100 rounded-[2.5rem] bg-gray-50 hover:bg-white hover:border-red-600 transition-all cursor-pointer group/label">
                      <Upload className="h-10 w-10 text-gray-300 group-hover/label:text-red-600 mb-3 transition-colors" />
                      <span className="text-sm font-black uppercase tracking-tight text-gray-900">Seleccionar archivos</span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">Máximo 5MB por archivo</span>
                    </label>
                  </div>

                  {uploadedFiles.length > 0 && (
                    <div className="grid grid-cols-1 gap-2">
                      {uploadedFiles.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                          <div className="flex items-center min-w-0">
                            <FileText className="h-5 w-5 text-red-600 mr-3 shrink-0" />
                            <p className="text-sm font-bold text-gray-900 truncate">{file.fileName}</p>
                          </div>
                          <button onClick={() => removeFile(idx)} className="p-2 text-gray-400 hover:text-red-600 transition-colors"><X size={16} /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-8 lg:p-10 border-t border-gray-50 flex flex-col sm:flex-row gap-4">
              <button
                onClick={closeBookingModal}
                className="flex-1 py-4 px-8 bg-gray-50 text-gray-600 hover:bg-gray-100 rounded-[2rem] text-sm font-black uppercase tracking-widest transition-all"
                disabled={isBooking}
              >
                Volver
              </button>
              <button
                onClick={handleConfirmBooking}
                disabled={isBooking || !questions.trim()}
                className="flex-[2] py-4 px-8 bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-200 rounded-[2rem] text-sm font-black uppercase tracking-widest shadow-xl shadow-red-600/20 transition-all flex items-center justify-center gap-2"
              >
                {isBooking ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Confirmar Cita'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
