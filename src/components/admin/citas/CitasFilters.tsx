import React from 'react';
import { Filter, RefreshCcw, Search, User, Calendar, Clock } from 'lucide-react';
import { DayPicker, DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface UserOption {
    id: string;
    full_name: string;
    email: string;
}

interface AdvancedFilters {
    searchTerm: string;
    selectedUser: UserOption | null;
    dateRange: DateRange | undefined;
    timeFilter: 'all' | 'morning' | 'afternoon';
    showDatePicker: boolean;
}

interface CitasFiltersProps {
    advancedFilters: AdvancedFilters;
    updateAdvancedFilters: (updates: Partial<AdvancedFilters>) => void;
    clearAllFilters: () => void;
    users: UserOption[];
}

export const CitasFilters: React.FC<CitasFiltersProps> = ({
    advancedFilters,
    updateAdvancedFilters,
    clearAllFilters,
    users
}) => {
    return (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-center gap-4 mb-4">
                <Filter className="w-5 h-5 text-gray-500" />
                <h3 className="text-lg font-semibold text-gray-900">Filtros Avanzados</h3>
                <button
                    onClick={clearAllFilters}
                    className="ml-auto text-gray-500 hover:text-red-600 flex items-center gap-2 text-sm"
                >
                    <RefreshCcw className="w-4 h-4" />
                    Limpiar filtros
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Búsqueda por texto */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Buscar
                    </label>
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar en tipo, estado..."
                            value={advancedFilters.searchTerm}
                            onChange={(e) => updateAdvancedFilters({ searchTerm: e.target.value })}
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                    </div>
                </div>

                {/* Filtro por usuario */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Usuario
                    </label>
                    <div className="relative">
                        <User className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <select
                            value={advancedFilters.selectedUser?.id || ''}
                            onChange={(e) => {
                                const userId = e.target.value;
                                const user = users.find(u => u.id === userId);
                                updateAdvancedFilters({ selectedUser: user || null });
                            }}
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        >
                            <option value="">Todos los usuarios</option>
                            {users.map(user => (
                                <option key={user.id} value={user.id}>
                                    {user.full_name} ({user.email})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Filtro por rango de fechas */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rango de fechas
                    </label>
                    <div className="relative">
                        <Calendar className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <button
                            onClick={() => updateAdvancedFilters({ showDatePicker: !advancedFilters.showDatePicker })}
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-left bg-white hover:bg-gray-50"
                        >
                            {advancedFilters.dateRange?.from || advancedFilters.dateRange?.to
                                ? `${advancedFilters.dateRange?.from ? format(advancedFilters.dateRange.from, 'dd/MM/yyyy', { locale: es }) : '...'} - ${advancedFilters.dateRange?.to ? format(advancedFilters.dateRange.to, 'dd/MM/yyyy', { locale: es }) : '...'}`
                                : 'Seleccionar fechas'
                            }
                        </button>
                    </div>

                    {advancedFilters.showDatePicker && (
                        <div className="absolute z-50 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg p-3">
                            <DayPicker
                                mode="range"
                                selected={advancedFilters.dateRange}
                                onSelect={(range) => {
                                    updateAdvancedFilters({
                                        dateRange: range
                                    });
                                }}
                                locale={es}
                                className="text-sm"
                            />
                            <div className="flex gap-2 mt-3">
                                <button
                                    onClick={() => updateAdvancedFilters({
                                        dateRange: undefined,
                                        showDatePicker: false
                                    })}
                                    className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
                                >
                                    Limpiar
                                </button>
                                <button
                                    onClick={() => updateAdvancedFilters({ showDatePicker: false })}
                                    className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Filtro por horario */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Horario
                    </label>
                    <div className="relative">
                        <Clock className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <select
                            value={advancedFilters.timeFilter}
                            onChange={(e) => updateAdvancedFilters({ timeFilter: e.target.value as 'all' | 'morning' | 'afternoon' })}
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        >
                            <option value="all">Todo el día</option>
                            <option value="morning">Mañana (8:00-14:00)</option>
                            <option value="afternoon">Tarde (14:00-20:00)</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Resumen de filtros activos */}
            <div className="mt-4 flex flex-wrap gap-2">
                {advancedFilters.searchTerm && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                        Texto: "{advancedFilters.searchTerm}"
                    </span>
                )}
                {advancedFilters.selectedUser && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                        Usuario: {advancedFilters.selectedUser.full_name}
                    </span>
                )}
                {(advancedFilters.dateRange?.from || advancedFilters.dateRange?.to) && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                        Fechas seleccionadas
                    </span>
                )}
                {advancedFilters.timeFilter !== 'all' && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">
                        Horario: {advancedFilters.timeFilter === 'morning' ? 'Mañana' : 'Tarde'}
                    </span>
                )}
            </div>
        </div>
    );
};
