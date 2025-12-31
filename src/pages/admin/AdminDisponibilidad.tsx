import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, AppointmentSlot } from '@/lib/supabase';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Lock, Unlock } from 'lucide-react';
import { toast } from 'sonner';

const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00'
];

const DELEGATE_TYPES = [
  { value: 'sindical', label: 'Delegados Sindicales' },
  { value: 'prevencion', label: 'Delegados de Prevención' }
];

export default function AdminDisponibilidad() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedDelegateType, setSelectedDelegateType] = useState<'sindical' | 'prevencion'>('sindical');
  const [slots, setSlots] = useState<AppointmentSlot[]>([]);
  const [blockReason, setBlockReason] = useState('');
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<AppointmentSlot | null>(null);

  useEffect(() => {
    loadSlots();
  }, [selectedDate, selectedDelegateType]);

  async function loadSlots() {
    const dateStr = selectedDate.toISOString().split('T')[0];
    const { data } = await supabase
      .from('appointment_slots')
      .select('*')
      .eq('appointment_date', dateStr)
      .eq('delegate_type', selectedDelegateType)
      .order('start_time');
    
    if (data) setSlots(data);
  }

  async function createSlotsForDay() {
    const dateStr = selectedDate.toISOString().split('T')[0];
    const slotsToCreate = TIME_SLOTS.map((time, index) => {
      const startHour = parseInt(time.split(':')[0]);
      const endHour = startHour + 1;
      return {
        delegate_type: selectedDelegateType,
        start_time: `${dateStr} ${time}:00+00`,
        end_time: `${dateStr} ${endHour.toString().padStart(2, '0')}:00:00+00`,
        appointment_date: dateStr,
        status: 'available'
      };
    });

    const { error } = await supabase.from('appointment_slots').insert(slotsToCreate);
    
    if (error) {
      toast.error('Error al crear slots');
    } else {
      toast.success('Slots creados para este día');
      loadSlots();
    }
  }

  async function toggleBlockSlot(slot: AppointmentSlot) {
    if (slot.status === 'blocked') {
      // Desbloquear
      const { error } = await supabase
        .from('appointment_slots')
        .update({ status: 'available', blocked_by: null, block_reason: null })
        .eq('id', slot.id);
      
      if (!error) {
        toast.success('Horario desbloqueado');
        loadSlots();
      }
    } else if (slot.status === 'available') {
      // Mostrar modal para bloquear
      setSelectedSlot(slot);
      setShowBlockModal(true);
    } else {
      toast.error('Este horario está ocupado, no se puede bloquear');
    }
  }

  async function confirmBlock() {
    if (!selectedSlot || !user) return;

    const { error } = await supabase
      .from('appointment_slots')
      .update({ 
        status: 'blocked', 
        blocked_by: user.id, 
        block_reason: blockReason || 'Sin especificar' 
      })
      .eq('id', selectedSlot.id);
    
    if (!error) {
      toast.success('Horario bloqueado');
      setShowBlockModal(false);
      setBlockReason('');
      setSelectedSlot(null);
      loadSlots();
    }
  }

  function changeDate(days: number) {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  }

  function getSlotForTime(time: string): AppointmentSlot | undefined {
    return slots.find(s => {
      const slotTime = new Date(s.start_time).getHours();
      const targetHour = parseInt(time.split(':')[0]);
      return slotTime === targetHour;
    });
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'available':
        return { bg: 'bg-green-100', text: 'text-green-700', label: 'Disponible' };
      case 'blocked':
        return { bg: 'bg-red-100', text: 'text-red-700', label: 'Bloqueado' };
      case 'occupied':
        return { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Ocupado' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-500', label: 'Sin definir' };
    }
  }

  const dateStr = selectedDate.toLocaleDateString('es-ES', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center mb-8">
          <CalendarIcon className="h-8 w-8 text-red-600 mr-3" />
          <h1 className="text-3xl font-bold">Gestión de Disponibilidad</h1>
        </div>

        {/* Selector de tipo de delegado */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Tipo de Delegado</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {DELEGATE_TYPES.map(type => (
              <button
                key={type.value}
                onClick={() => setSelectedDelegateType(type.value as any)}
                className={`p-4 rounded-lg border-2 font-semibold transition ${
                  selectedDelegateType === type.value
                    ? 'border-red-600 bg-red-50 text-red-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Navegación de fecha */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => changeDate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <h2 className="text-xl font-bold capitalize">{dateStr}</h2>
            <button
              onClick={() => changeDate(1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>

          <div className="text-center">
            <button
              onClick={createSlotsForDay}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Crear Slots para este Día
            </button>
          </div>
        </div>

        {/* Calendario de slots */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Horarios (8:00 - 16:00)</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {TIME_SLOTS.map(time => {
              const slot = getSlotForTime(time);
              const endHour = (parseInt(time.split(':')[0]) + 1).toString().padStart(2, '0');
              const badge = slot ? getStatusBadge(slot.status) : null;

              return (
                <div
                  key={time}
                  className={`p-4 rounded-lg border-2 ${
                    !slot
                      ? 'border-gray-200 bg-gray-50'
                      : slot.status === 'available'
                      ? 'border-green-300 bg-green-50'
                      : slot.status === 'blocked'
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-300 bg-gray-100'
                  }`}
                >
                  <div className="text-center mb-2">
                    <p className="font-bold text-lg">{time} - {endHour}:00</p>
                  </div>
                  
                  {slot ? (
                    <>
                      <div className="flex justify-center mb-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge?.bg} ${badge?.text}`}>
                          {badge?.label}
                        </span>
                      </div>
                      {slot.block_reason && (
                        <p className="text-xs text-gray-600 mb-2 text-center italic">
                          Motivo: {slot.block_reason}
                        </p>
                      )}
                      {slot.status !== 'occupied' && (
                        <button
                          onClick={() => toggleBlockSlot(slot)}
                          className={`w-full py-2 rounded-lg flex items-center justify-center gap-2 transition ${
                            slot.status === 'blocked'
                              ? 'bg-green-600 text-white hover:bg-green-700'
                              : 'bg-red-600 text-white hover:bg-red-700'
                          }`}
                        >
                          {slot.status === 'blocked' ? (
                            <>
                              <Unlock className="h-4 w-4" />
                              Desbloquear
                            </>
                          ) : (
                            <>
                              <Lock className="h-4 w-4" />
                              Bloquear
                            </>
                          )}
                        </button>
                      )}
                    </>
                  ) : (
                    <p className="text-gray-400 text-center text-sm">Sin slot</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal de bloqueo */}
      {showBlockModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Bloquear Horario</h3>
            <p className="text-gray-600 mb-4">
              Indica el motivo del bloqueo (opcional):
            </p>
            <input
              type="text"
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              placeholder="Ej: Reunión externa, vacaciones..."
              className="w-full p-3 border border-gray-300 rounded-lg mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={confirmBlock}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition"
              >
                Confirmar Bloqueo
              </button>
              <button
                onClick={() => {
                  setShowBlockModal(false);
                  setBlockReason('');
                  setSelectedSlot(null);
                }}
                className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
