import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
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
    <div className="min-h-screen bg-[#f8fafc]">
      <Navbar />

      <div className="container mx-auto px-4 py-12">
        {/* Encabezado */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="flex items-center">
            <div className="p-4 bg-red-600 rounded-2xl shadow-xl shadow-red-200 mr-5">
              <Users className="h-8 w-8 text-white" />
            </div>
            <div>
              <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mb-1">Control de Usuarios</p>
              <h1 className="text-4xl font-black text-gray-900 tracking-tight">Censo de Afiliados</h1>
            </div>
          </div>
          <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
            <div className="text-right">
              <p className="text-[10px] text-gray-400 font-bold uppercase leading-none">Total Afiliados</p>
              <p className="text-xl font-black text-green-600">{affiliateCount}</p>
            </div>
            <div className="h-8 w-px bg-gray-100"></div>
            <div className="text-right">
              <p className="text-[10px] text-gray-400 font-bold uppercase leading-none">Pendientes</p>
              <p className="text-xl font-black text-gray-400">{users.length - affiliateCount}</p>
            </div>
          </div>
        </div>


        {/* Búsqueda */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8 mb-8">
          <div className="relative">
            <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o email de trabajador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-red-600 transition-all font-medium text-gray-900"
            />
          </div>
        </div>

        {/* Tabla de Usuarios */}
        <div className="bg-white rounded-[2rem] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-600 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Cargando censo...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-20 px-6">
              <Users className="h-16 w-16 text-gray-100 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No se encontraron usuarios que coincidan con la búsqueda.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Trabajador / Email
                    </th>
                    <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Rol Sistema
                    </th>
                    <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Fecha Registro
                    </th>
                    <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Estado Afiliado
                    </th>
                    <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="text-gray-900 font-bold">{user.full_name}</span>
                          <span className="text-gray-400 text-xs font-medium">{user.email}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full ${user.role === 'admin'
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-100 text-gray-500'
                          }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-sm font-bold text-gray-600">
                        {user.created_at && format(new Date(user.created_at), "dd/MM/yyyy", { locale: es })}
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center space-x-3">
                          <select
                            value={user.is_affiliate ? 'si' : 'no'}
                            onChange={(e) => toggleAffiliate(user.id, e.target.value === 'si')}
                            disabled={updatingUsers.has(user.id)}
                            className={`px-4 py-2 text-xs font-black uppercase tracking-widest border-none rounded-xl focus:ring-2 focus:ring-red-600 cursor-pointer shadow-sm ${user.is_affiliate
                              ? 'bg-green-50 text-green-700'
                              : 'bg-gray-100 text-gray-500'
                              }`}
                          >
                            <option value="no">No Afiliado</option>
                            <option value="si">Confirmado</option>
                          </select>
                          {updatingUsers.has(user.id) && (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-600 border-t-transparent"></div>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button
                          onClick={() => confirmDeleteUser(user)}
                          className="p-3 text-gray-400 hover:text-white hover:bg-red-600 rounded-xl transition-all shadow-sm group"
                          title="Eliminar usuario"
                        >
                          <Trash2 className="h-4 w-4" />
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
      <Footer />
    </div>
  );
}
