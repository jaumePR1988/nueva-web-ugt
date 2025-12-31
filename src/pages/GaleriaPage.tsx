import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import EventGalleryView from '@/components/EventGalleryView';

export default function GaleriaPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Page Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Galería de Eventos
            </h1>
            <p className="text-xl text-red-100 max-w-2xl mx-auto">
              Revive los momentos más destacados de nuestra actividad sindical y eventos UGT Towa
            </p>
          </div>
        </div>
      </div>

      {/* Event Gallery Component */}
      <EventGalleryView />

      <Footer />
    </div>
  );
}