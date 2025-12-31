import React from 'react';
import { Calendar, Image as ImageIcon } from 'lucide-react';
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

interface EventGroup {
  eventTitle: string;
  eventDate: string | null;
  images: EventImage[];
}

interface EventCardProps {
  eventGroup: EventGroup;
  onClick: () => void;
}

export default function EventCard({ eventGroup, onClick }: EventCardProps) {
  const primaryImage = eventGroup.images[0];
  const imageCount = eventGroup.images.length;
  const hasMultipleImages = imageCount > 1;

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden transform hover:-translate-y-1"
    >
      {/* Image container */}
      <div className="relative aspect-[16/10] overflow-hidden bg-gray-200">
        <img
          src={primaryImage.image_url}
          alt={eventGroup.eventTitle}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Image count badge */}
        {hasMultipleImages && (
          <div className="absolute top-3 right-3 bg-black/70 text-white px-2 py-1 rounded-full text-sm font-medium flex items-center space-x-1">
            <ImageIcon className="h-4 w-4" />
            <span>{imageCount}</span>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="bg-white/90 text-gray-800 px-4 py-2 rounded-lg font-medium">
              Ver galería
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-red-600 transition-colors">
          {eventGroup.eventTitle}
        </h3>
        
        {eventGroup.eventDate && (
          <div className="flex items-center text-sm text-gray-600 mb-2">
            <Calendar className="h-4 w-4 mr-2" />
            <span>
              {format(new Date(eventGroup.eventDate), "d 'de' MMMM, yyyy", { locale: es })}
            </span>
          </div>
        )}

        {primaryImage.description && (
          <p className="text-sm text-gray-600 line-clamp-2">
            {primaryImage.description}
          </p>
        )}

        {/* Image count info */}
        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
          <span className="flex items-center">
            <ImageIcon className="h-3 w-3 mr-1" />
            {imageCount} {imageCount === 1 ? 'imagen' : 'imágenes'}
          </span>
          <span className="text-red-600 group-hover:text-red-700 font-medium">
            Hacer clic para ver
          </span>
        </div>
      </div>
    </div>
  );
}