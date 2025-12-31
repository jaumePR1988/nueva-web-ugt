import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { supabase, Profile } from '@/lib/supabase';
import { Shield, Search, UserPlus, Trash2, ArrowUp } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function AdminAdministradores() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [showDemoteModal, setShowDemoteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [processing, setProcessing] = useState(false);
  
  // Formulario para crear admin
  const [newAdmin, setNewAdmin] = useState({
    email: '',
    fullName: '',
    password: ''
  });

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

  async function promoteToAdmin() {
    if (!selectedUser) return;

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', selectedUser.id);

      if (error) throw error;

      toast.success(`${selectedUser.full_name} promovido a administrador`);
      setShowPromoteModal(false);
      setSelectedUser(null);
      loadUsers();
    } catch (error) {
      console.error('Error al promover usuario:', error);
      toast.error('Error al promover usuario a administrador');
    } finally {
      setProcessing(false);
    }
  }

  async function demoteAdmin() {
    if (!selectedUser) return;

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: 'user' })
        .eq('id', selectedUser.id);

      if (error) throw error;

      toast.success(`${selectedUser.full_name} removido de administrador`);
      setShowDemoteModal(false);
      setSelectedUser(null);
      loadUsers();
    } catch (error) {
      console.error('Error al remover administrador:', error);
      toast.error('Error al remover administrador');
    } finally {
      setProcessing(false);
    }
  }

  async function createAdmin(e: React.FormEvent) {
    e.preventDefault();
    
    if (!newAdmin.email || !newAdmin.fullName || !newAdmin.password) {
      toast.error('Todos los campos son requeridos');
      return;
    }

    // Validar dominio de email
    if (!newAdmin.email.endsWith('@towapharmaceutical.com')) {
      toast.error('El email debe ser del dominio @towapharmaceutical.com');
      return;
    }

    setProcessing(true);
    try {
      // Crear usuario usando la autenticación de Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newAdmin.email,
        password: newAdmin.password,
        options: {
          data: {
            full_name: newAdmin.fullName
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // Actualizar el perfil para hacerlo administrador
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ role: 'admin' })
          .eq('id', authData.user.id);

        if (updateError) throw updateError;
      }

      toast.success('Administrador creado correctamente');
      setShowCreateModal(false);
      setNewAdmin({ email: '', fullName: '', password: '' });
      loadUsers();
    } catch (error: any) {
      console.error('Error al crear administrador:', error);
      toast.error(error.message || 'Error al crear administrador');
    } finally {
      setProcessing(false);
    }
  }

  const filteredUsers = users.filter(user =>
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const adminCount = users.filter(u => u.role === 'admin').length;
  const nonAdminUsers = filteredUsers.filter(u => u.role !== 'admin');
  const adminUsers = filteredUsers.filter(u => u.role === 'admin');

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* Encabezado */}
        <div className="mb-8">
          <Link to="/admin/dashboard" className="text-red-600 hover:text-red-700 mb-4 inline-block">
            Volver al Panel de Administración
          </Link>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-red-600" />
              <h1 className="text-3xl font-bold text-gray-900">Gestión de Administradores</h1>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              <UserPlus className="h-5 w-5 mr-2" />
              Crear Administrador
            </button>
          </div>
          <p className="text-gray-600">
            Gestiona los administradores del sistema: promociona usuarios, crea nuevos administradores o remueve permisos.
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
              <Shield className="h-12 w-12 text-blue-200" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Administradores</p>
                <p className="text-3xl font-bold text-red-600 mt-2">{adminCount}</p>
              </div>
              <Shield className="h-12 w-12 text-red-200" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Usuarios Regulares</p>
                <p className="text-3xl font-bold text-gray-600 mt-2">{users.length - adminCount}</p>
              </div>
              <Shield className="h-12 w-12 text-gray-200" />
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

        {/* Lista de Administradores */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="bg-gray-50 px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Administradores Actuales</h2>
          </div>
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Cargando usuarios...</p>
            </div>
          ) : adminUsers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No hay administradores.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nombre
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha de Registro
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {adminUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Shield className="h-5 w-5 text-red-600 mr-2" />
                          <span className="text-sm font-medium text-gray-900">{user.full_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {user.created_at && format(new Date(user.created_at), "d MMM yyyy", { locale: es })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowDemoteModal(true);
                          }}
                          className="inline-flex items-center px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 transition"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Remover Admin
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Lista de Usuarios Regulares para Promover */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Usuarios Regulares</h2>
            <p className="text-sm text-gray-600 mt-1">Promociona usuarios a administradores</p>
          </div>
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Cargando usuarios...</p>
            </div>
          ) : nonAdminUsers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No hay usuarios regulares.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nombre
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Afiliado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {nonAdminUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          user.is_affiliate
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.is_affiliate ? 'Sí' : 'No'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowPromoteModal(true);
                          }}
                          className="inline-flex items-center px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition"
                        >
                          <ArrowUp className="h-4 w-4 mr-1" />
                          Promover a Admin
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Crear Administrador */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Crear Nuevo Administrador</h3>
            <form onSubmit={createAdmin}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    value={newAdmin.fullName}
                    onChange={(e) => setNewAdmin({ ...newAdmin, fullName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email (@towapharmaceutical.com)
                  </label>
                  <input
                    type="email"
                    value={newAdmin.email}
                    onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contraseña
                  </label>
                  <input
                    type="password"
                    value={newAdmin.password}
                    onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                    minLength={6}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Mínimo 6 caracteres</p>
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  type="submit"
                  disabled={processing}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {processing ? 'Creando...' : 'Crear Administrador'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewAdmin({ email: '', fullName: '', password: '' });
                  }}
                  disabled={processing}
                  className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 disabled:opacity-50"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Promover a Administrador */}
      {showPromoteModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Promover a Administrador</h3>
            <p className="text-gray-600 mb-6">
              ¿Está seguro de que desea promover a <strong>{selectedUser.full_name}</strong> a administrador?
              Este usuario tendrá acceso completo al panel de administración.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={promoteToAdmin}
                disabled={processing}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {processing ? 'Promoviendo...' : 'Promover a Admin'}
              </button>
              <button
                onClick={() => {
                  setShowPromoteModal(false);
                  setSelectedUser(null);
                }}
                disabled={processing}
                className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Remover Administrador */}
      {showDemoteModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Remover Administrador</h3>
            <p className="text-gray-600 mb-6">
              ¿Está seguro de que desea remover los permisos de administrador de <strong>{selectedUser.full_name}</strong>?
              Este usuario pasará a ser un usuario regular.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={demoteAdmin}
                disabled={processing}
                className="flex-1 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 disabled:opacity-50"
              >
                {processing ? 'Removiendo...' : 'Remover Admin'}
              </button>
              <button
                onClick={() => {
                  setShowDemoteModal(false);
                  setSelectedUser(null);
                }}
                disabled={processing}
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
