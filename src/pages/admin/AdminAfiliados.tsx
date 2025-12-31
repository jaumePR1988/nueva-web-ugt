import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { supabase, Profile } from '@/lib/supabase';
import { Users, Search, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function AdminAfiliados() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingUsers, setUpdatingUsers] = useState<Set<string>>(new Set());
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<Profile | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } finally {
      setLoading(false);
    }
  }

  async function toggleAffiliate(userId: string, newStatus: boolean | null) {
    if (newStatus === null) return;
    
    // Actualizar estado local inmediatamente para feedback visual
    setUpdatingUsers(prev => new Set(prev).add(userId));
    
    const currentUser = users.find(u => u.id === userId);
    const currentStatus = currentUser?.is_affiliate || false;
    
    console.log(`Actualizando usuario ${userId} de ${currentStatus} a ${newStatus}`);
    
    try {
      // Actualizar en la base de datos
      const { data, error } = await supabase
        .from('profiles')
        .update({ is_affiliate: newStatus })
        .eq('id', userId)
        .select('is_affiliate');

      if (error) {
        console.error('Error de Supabase:', error);
        throw error;
      }

      console.log('Actualización exitosa en BD:', data);
      
      // Verificar que el cambio se persistió correctamente
      if (data && data.length > 0) {
        const updatedUser = data[0];
        if (updatedUser.is_affiliate !== newStatus) {
          throw new Error('El cambio no se persistió correctamente en la base de datos');
        }
      }
      
      // Actualizar la lista local con el resultado confirmado
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId 
            ? { ...user, is_affiliate: newStatus }
            : user
        )
      );
      
      toast.success(newStatus ? 'Usuario marcado como afiliado' : 'Afiliación removida');
      
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al actualizar el estado de afiliación: ' + (error instanceof Error ? error.message : 'Error desconocido'));
      // No revertimos aquí porque el estado local ya se actualizó correctamente
    } finally {
      setUpdatingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  }

  function confirmDeleteUser(user: Profile) {
    setUserToDelete(user);
    setShowDeleteModal(true);
  }

  async function deleteUser() {
    if (!userToDelete) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userToDelete.id);

      if (error) throw error;

      toast.success('Usuario eliminado correctamente');
      setShowDeleteModal(false);
      setUserToDelete(null);
      loadUsers();
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      toast.error('Error al eliminar el usuario');
    } finally {
      setDeleting(false);
    }
  }

  const filteredUsers = users.filter(user =>
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const affiliateCount = users.filter(u => u.is_affiliate).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* Encabezado */}
        <div className="mb-8">
          <Link to="/admin/dashboard" className="text-red-600 hover:text-red-700 mb-4 inline-block">
            Volver al Panel de Administración
          </Link>
          <div className="flex items-center space-x-3 mb-4">
            <Users className="h-8 w-8 text-red-600" />
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Afiliados</h1>
          </div>
          <p className="text-gray-600">
            Gestiona qué usuarios tienen acceso a las funcionalidades exclusivas para afiliados.
          </p>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Usuarios</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{users.length}</p>
              </div>
              <Users className="h-12 w-12 text-blue-200" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Afiliados</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{affiliateCount}</p>
              </div>
              <CheckCircle className="h-12 w-12 text-green-200" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">No Afiliados</p>
                <p className="text-3xl font-bold text-gray-600 mt-2">{users.length - affiliateCount}</p>
              </div>
              <XCircle className="h-12 w-12 text-gray-200" />
            </div>
          </div>
        </div>

        {/* Búsqueda */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
            />
          </div>
        </div>

        {/* Tabla de Usuarios */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Cargando usuarios...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No se encontraron usuarios.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rol
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha de Registro
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado Afiliado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          user.role === 'admin'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {user.created_at && format(new Date(user.created_at), "d MMM yyyy", { locale: es })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={user.is_affiliate ? 'si' : 'no'}
                          onChange={(e) => toggleAffiliate(user.id, e.target.value === 'si')}
                          disabled={updatingUsers.has(user.id)}
                          className="w-24 px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <option value="no">No</option>
                          <option value="si">Sí</option>
                        </select>
                        {updatingUsers.has(user.id) && (
                          <span className="ml-2 text-xs text-gray-400">Actualizando...</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => confirmDeleteUser(user)}
                          className="inline-flex items-center px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Información */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Nota:</strong> Los usuarios marcados como afiliados tendrán acceso a la sección exclusiva 
            que incluye Biblioteca de Documentos y Beneficios.
          </p>
        </div>
      </div>

      {/* Modal de confirmación de eliminación */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Confirmar Eliminación</h3>
            <p className="text-gray-600 mb-6">
              ¿Está seguro de que desea eliminar al usuario <strong>{userToDelete?.full_name}</strong> ({userToDelete?.email}) del sistema?
              Esta acción no se puede deshacer.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={deleteUser}
                disabled={deleting}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'Eliminando...' : 'Eliminar Usuario'}
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setUserToDelete(null);
                }}
                disabled={deleting}
                className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
