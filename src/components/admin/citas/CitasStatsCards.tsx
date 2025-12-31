import React from 'react';
import { Calendar, Clock, AlertCircle, TrendingUp } from 'lucide-react';

interface Stats {
  today: number;
  upcoming: number;
  pending: number;
  completed: number;
}

interface CitasStatsCardsProps {
  stats: Stats;
}

export const CitasStatsCards: React.FC<CitasStatsCardsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Citas Hoy</p>
            <p className="text-3xl font-bold text-blue-600">{stats.today}</p>
          </div>
          <Calendar className="w-10 h-10 text-blue-600" />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Próximas (7 días)</p>
            <p className="text-3xl font-bold text-green-600">{stats.upcoming}</p>
          </div>
          <Clock className="w-10 h-10 text-green-600" />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Pendientes</p>
            <p className="text-3xl font-bold text-orange-600">{stats.pending}</p>
          </div>
          <AlertCircle className="w-10 h-10 text-orange-600" />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Completadas</p>
            <p className="text-3xl font-bold text-gray-600">{stats.completed}</p>
          </div>
          <TrendingUp className="w-10 h-10 text-gray-600" />
        </div>
      </div>
    </div>
  );
};
