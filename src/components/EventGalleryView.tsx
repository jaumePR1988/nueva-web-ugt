import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import EventCard from './EventCard';
import EventGallery, { EventGroup, groupImagesByEvent } from './EventGallery';

interface EventImage {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  event_date: string | null;
  display_order: number;
}

export default function EventGalleryView() {
  const [eventGroups, setEventGroups] = useState<EventGroup[]>([]);
  const [selectedEventGroup, setSelectedEventGroup] = useState<EventGroup | null>(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEventImages();
  }, []);

  async function loadEventImages() {
    try {
      const { data, error } = await supabase
        .from('event_images')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .order('event_date', { ascending: false });

      if (error) throw error;
      
      if (data && data.length > 0) {
        const grouped = groupImagesByEvent(data as EventImage[]);
        setEventGroups(grouped);
      }
    } catch (error) {
      console.error('Error loading event images:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleEventClick = (eventGroup: EventGroup) => {
    setSelectedEventGroup(eventGroup);
    setIsGalleryOpen(true);
  };

  const handleCloseGallery = () => {
    setIsGalleryOpen(false);
    setSelectedEventGroup(null);
  };

  if (loading) {
    return (
      <section className="py-8 bg-gray-50 dark:bg-gray-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Galería de Eventos
            </h2>
            <p className="text-base text-gray-600 dark:text-gray-300">
              Momentos destacados de nuestra actividad sindical
            </p>
          </div>
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          </div>
        </div>
      </section>
    );
  }

  if (eventGroups.length === 0) {
    return null;
  }

  return (
    <>
      <section className="py-8 bg-gray-50 dark:bg-gray-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Galería de Eventos
            </h2>
            <p className="text-base text-gray-600 dark:text-gray-300">
              Momentos destacados de nuestra actividad sindical
            </p>
          </div>

          {/* Event Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {eventGroups.map((eventGroup, index) => (
              <EventCard
                key={`${eventGroup.eventTitle}-${index}`}
                eventGroup={eventGroup}
                onClick={() => handleEventClick(eventGroup)}
              />
            ))}
          </div>

          {/* Show more indicator if there are many events */}
          {eventGroups.length > 6 && (
            <div className="text-center mt-8">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Mostrando {Math.min(eventGroups.length, 6)} de {eventGroups.length} eventos
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Event Gallery Modal */}
      <EventGallery
        isOpen={isGalleryOpen}
        onClose={handleCloseGallery}
        eventGroup={selectedEventGroup}
      />
    </>
  );
}