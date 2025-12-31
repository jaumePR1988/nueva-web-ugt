import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Camera } from 'lucide-react';
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

export default function EventCarousel() {
  const [eventImages, setEventImages] = useState<EventImage[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
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
        .order('event_date', { ascending: false })
        .limit(6); // Solo las primeras 6 para el carrusel

      if (error) throw error;
      
      if (data && data.length > 0) {
        setEventImages(data as EventImage[]);
      }
    } catch (error) {
      console.error('Error loading event images:', error);
    } finally {
      setLoading(false);
    }
  }

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % Math.max(eventImages.length, 1));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + Math.max(eventImages.length, 1)) % Math.max(eventImages.length, 1));
  };

  if (loading) {
    return (
      <div className="py-8 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Momentos Destacados
            </h2>
          </div>
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (eventImages.length === 0) {
    return null;
  }

  return (
    <section className="py-8 bg-gray-50 dark:bg-gray-800 transition-colors">
      <div className="container mx-auto px-4">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Momentos Destacados
          </h2>
          <p className="text-base text-gray-600 dark:text-gray-300">
            Los últimos eventos y actividades UGT Towa
          </p>
        </div>

        <div className="relative">
          {/* Carousel Container */}
          <div className="overflow-hidden rounded-xl shadow-lg">
            <div 
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {eventImages.map((image, index) => (
                <div key={image.id} className="w-full flex-shrink-0 relative group">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 overflow-hidden" style={{height: '350px'}}>
                    <img
                      src={image.image_url}
                      alt={image.title}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                    />
                    
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    
                    {/* Content */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                      <h3 className="text-xl font-bold mb-2">{image.title}</h3>
                      {image.description && (
                        <p className="text-sm text-gray-200 mb-2 line-clamp-2">
                          {image.description}
                        </p>
                      )}
                      {image.event_date && (
                        <p className="text-xs text-gray-300">
                          {format(new Date(image.event_date), "d 'de' MMMM 'de' yyyy", { locale: es })}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Buttons */}
          {eventImages.length > 1 && (
            <>
              <button
                onClick={prevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg transition-all"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg transition-all"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          {/* Dots Indicator */}
          {eventImages.length > 1 && (
            <div className="flex justify-center space-x-2 mt-4">
              {eventImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    index === currentSlide 
                      ? 'bg-red-600' 
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* View All Button */}
        <div className="text-center mt-6">
          <Link
            to="/galeria"
            className="inline-flex items-center px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition"
          >
            <Camera className="h-5 w-5 mr-2" />
            Ver Galería Completa
          </Link>
        </div>

        {/* Show image count */}
        <div className="text-center mt-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {eventImages.length > 1 
              ? `${currentSlide + 1} de ${eventImages.length} imágenes`
              : '1 imagen destacada'
            }
          </p>
        </div>
      </div>
    </section>
  );
}