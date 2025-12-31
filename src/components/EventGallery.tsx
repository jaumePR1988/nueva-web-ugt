import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface EventImage {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  event_date: string | null;
  display_order: number;
}

export interface EventGroup {
  eventTitle: string;
  eventDate: string | null;
  images: EventImage[];
}

interface EventGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  eventGroup?: EventGroup | null;
}

export default function EventGallery({ isOpen, onClose, eventGroup }: EventGalleryProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  // Reset image index when event changes
  useEffect(() => {
    if (eventGroup) {
      setCurrentImageIndex(0);
    }
  }, [eventGroup]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!eventGroup || eventGroup.images.length === 0) return;

      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          goToPrevious();
          break;
        case 'ArrowRight':
          e.preventDefault();
          goToNext();
          break;
        case ' ':
          e.preventDefault();
          toggleZoom();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, eventGroup]);

  const goToPrevious = () => {
    if (!eventGroup) return;
    setCurrentImageIndex((prev) => 
      prev === 0 ? eventGroup.images.length - 1 : prev - 1
    );
  };

  const goToNext = () => {
    if (!eventGroup) return;
    setCurrentImageIndex((prev) => 
      (prev + 1) % eventGroup.images.length
    );
  };

  const toggleZoom = () => {
    setIsZoomed(!isZoomed);
  };

  if (!isOpen || !eventGroup) return null;

  const currentImage = eventGroup.images[currentImageIndex];
  const hasMultipleImages = eventGroup.images.length > 1;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4">
        <div className="flex items-center justify-between text-white">
          <div className="flex-1">
            <h2 className="text-xl font-bold">{eventGroup.eventTitle}</h2>
            {eventGroup.eventDate && (
              <p className="text-sm text-gray-300">
                {format(new Date(eventGroup.eventDate), "d 'de' MMMM, yyyy", { locale: es })}
              </p>
            )}
            <p className="text-sm text-gray-300">
              {currentImageIndex + 1} de {eventGroup.images.length} imágenes
            </p>
          </div>
          
          {/* Zoom control */}
          <button
            onClick={toggleZoom}
            className="p-2 hover:bg-white/20 rounded-full transition-colors mr-4"
            aria-label={isZoomed ? 'Alejar imagen' : 'Acercar imagen'}
          >
            {isZoomed ? <ZoomOut className="h-5 w-5" /> : <ZoomIn className="h-5 w-5" />}
          </button>

          {/* Close button */}
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
            aria-label="Cerrar galería"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Main image area */}
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
        <div
          className={`relative max-w-full max-h-full transition-transform duration-300 ${
            isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'
          }`}
          onClick={toggleZoom}
        >
          <img
            src={currentImage.image_url}
            alt={currentImage.title}
            className={`max-w-full max-h-full object-contain transition-transform duration-300 ${
              isZoomed ? 'scale-150' : 'scale-100'
            }`}
            style={{
              maxHeight: isZoomed ? 'none' : '85vh',
              maxWidth: isZoomed ? 'none' : '90vw',
            }}
          />
        </div>
      </div>

      {/* Navigation arrows */}
      {hasMultipleImages && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-colors z-10"
            aria-label="Imagen anterior"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-colors z-10"
            aria-label="Imagen siguiente"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      {/* Image info overlay (bottom) */}
      <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/80 to-transparent p-4">
        <div className="text-white">
          <h3 className="text-lg font-semibold mb-1">{currentImage.title}</h3>
          {currentImage.description && (
            <p className="text-sm text-gray-300">{currentImage.description}</p>
          )}
        </div>
      </div>

      {/* Thumbnail navigation */}
      {hasMultipleImages && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-10">
          <div className="flex space-x-2 bg-black/50 rounded-lg p-2">
            {eventGroup.images.map((image, index) => (
              <button
                key={image.id}
                onClick={() => setCurrentImageIndex(index)}
                className={`w-12 h-12 rounded overflow-hidden border-2 transition-colors ${
                  index === currentImageIndex
                    ? 'border-white'
                    : 'border-transparent hover:border-gray-300'
                }`}
                aria-label={`Ir a imagen ${index + 1}`}
              >
                <img
                  src={image.image_url}
                  alt={image.title}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to group images by event
export function groupImagesByEvent(images: EventImage[]): EventGroup[] {
  const eventGroups: { [key: string]: EventGroup } = {};

  images.forEach((image) => {
    const eventKey = image.title; // Using title as event identifier
    const eventDate = image.event_date;

    if (!eventGroups[eventKey]) {
      eventGroups[eventKey] = {
        eventTitle: image.title,
        eventDate: eventDate,
        images: [],
      };
    }

    eventGroups[eventKey].images.push(image);
  });

  // Sort images within each event by display_order
  Object.values(eventGroups).forEach((group) => {
    group.images.sort((a, b) => a.display_order - b.display_order);
  });

  // Sort events by date (most recent first)
  return Object.values(eventGroups).sort((a, b) => {
    if (!a.eventDate && !b.eventDate) return 0;
    if (!a.eventDate) return 1;
    if (!b.eventDate) return -1;
    return new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime();
  });
}