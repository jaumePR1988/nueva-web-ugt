import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
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
    password: '',
    role: 'admin' as 'admin' | 'editor'
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

  async function promoteToRole(role: 'admin' | 'editor') {
    if (!selectedUser) return;

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', selectedUser.id);

      if (error) throw error;

      toast.success(`${selectedUser.full_name} promovido a ${role === 'admin' ? 'administrador' : 'editor'}`);
      setShowPromoteModal(false);
      setSelectedUser(null);
      loadUsers();
    } catch (error) {
      console.error('Error al promover usuario:', error);
      toast.error(`Error al promover usuario a ${role}`);
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
          .update({ role: newAdmin.role })
          .eq('id', authData.user.id);

        if (updateError) throw updateError;
      }

      toast.success(newAdmin.role === 'admin' ? 'Administrador creado correctamente' : 'Editor creado correctamente');
      setShowCreateModal(false);
      setNewAdmin({ email: '', fullName: '', password: '', role: 'admin' });
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
  const editorCount = users.filter(u => u.role === 'editor').length;
  const nonAdminUsers = filteredUsers.filter(u => u.role === 'user');
  const managementUsers = filteredUsers.filter(u => u.role === 'admin' || u.role === 'editor');

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Navbar />

      <div className="container mx-auto px-4 py-12">
        {/* Encabezado */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="flex items-center">
            <div className="p-4 bg-red-600 rounded-2xl shadow-xl shadow-red-200 mr-5">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <div>
              <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mb-1">Seguridad del Sistema</p>
              <h1 className="text-4xl font-black text-gray-900 tracking-tight">Gestión de Administradores</h1>
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-xs py-4 px-8 rounded-2xl transition-all shadow-xl shadow-red-200 flex items-center group"
          >
            <UserPlus className="h-4 w-4 mr-3 group-hover:-translate-y-1 transition-transform" />
            Nuevo Administrador
          </button>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 flex items-center">
            <div className="p-4 bg-gray-50 rounded-2xl mr-6">
              <Shield className="h-6 w-6 text-gray-400" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest leading-none mb-2">Total Usuarios</p>
              <p className="text-3xl font-black text-gray-900">{users.length}</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 flex items-center">
            <div className="p-4 bg-red-50 rounded-2xl mr-6">
              <Shield className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest leading-none mb-2">Admins / Editores</p>
              <p className="text-3xl font-black text-red-600">{adminCount + editorCount}</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 flex items-center border-l-4 border-l-green-600">
            <div className="p-4 bg-green-50 rounded-2xl mr-6">
              <Shield className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest leading-none mb-2">Usuarios Regulares</p>
              <p className="text-3xl font-black text-gray-600">{users.length - adminCount}</p>
            </div>
          </div>
        </div>

        {/* Búsqueda */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8 mb-8">
          <div className="relative">
            <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-red-600 transition-all font-medium text-gray-900"
            />
          </div>
        </div>

        {/* Lista de Administradores */}
        <div className="bg-white rounded-[2rem] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden mb-12">
          <div className="bg-gray-50/50 px-8 py-5 border-b border-gray-100">
            <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Equipo de Gestión (Admins y Editores)</h2>
          </div>
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Cargando equipo...</p>
            </div>
          ) : managementUsers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No hay equipo de gestión.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Nombre / Email
                    </th>
                    <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Fecha Alta
                    </th>
                    <th className="px-8 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {managementUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex items-center">
                          <div className={`p-2 rounded-lg mr-4 group-hover:bg-opacity-100 transition-colors ${user.role === 'admin'
                            ? 'bg-red-50 text-red-600 group-hover:bg-red-600 group-hover:text-white'
                            : 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white'
                            }`}>
                            <Shield className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold text-gray-900">{user.full_name}</p>
                              <span className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter ${user.role === 'admin'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-blue-100 text-blue-700'
                                }`}>
                                {user.role}
                              </span>
                            </div>
                            <p className="text-xs text-gray-400 font-medium">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-sm font-bold text-gray-600">
                        {user.created_at && format(new Date(user.created_at), "dd/MM/yyyy", { locale: es })}
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowDemoteModal(true);
                          }}
                          className="px-4 py-2 bg-orange-50 text-orange-700 hover:bg-orange-600 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm"
                        >
                          Revocar Acceso
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
        <div className="bg-white rounded-[2rem] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
          <div className="bg-gray-50/50 px-8 py-5 border-b border-gray-100">
            <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Base de Usuarios (No Admins)</h2>
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
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Nombre / Email
                    </th>
                    <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Estado
                    </th>
                    <th className="px-8 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {nonAdminUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-8 py-5">
                        <p className="text-sm font-bold text-gray-900">{user.full_name}</p>
                        <p className="text-xs text-gray-400 font-medium">{user.email}</p>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-xl ${user.is_affiliate
                          ? 'bg-green-50 text-green-700'
                          : 'bg-gray-100 text-gray-400'
                          }`}>
                          {user.is_affiliate ? 'Afiliado Confirmado' : 'Pendiente'}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowPromoteModal(true);
                          }}
                          className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm"
                        >
                          Promover / Acceso
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
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl p-10 max-w-md w-full animate-in fade-in zoom-in duration-300">
            <div className="flex items-center mb-8">
              <div className="p-3 bg-red-600 rounded-2xl mr-4 shadow-lg shadow-red-200">
                <UserPlus className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">Nuevo Administrador</h3>
            </div>

            <form onSubmit={createAdmin}>
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    value={newAdmin.fullName}
                    onChange={(e) => setNewAdmin({ ...newAdmin, fullName: e.target.value })}
                    className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-red-600 font-medium text-gray-900 transition-all"
                    placeholder="Nombre y apellidos"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">
                    Email Corporativo (@towapharmaceutical.com)
                  </label>
                  <input
                    type="email"
                    value={newAdmin.email}
                    onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                    className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-red-600 font-medium text-gray-900 transition-all"
                    placeholder="usuario@towapharmaceutical.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">
                    Contraseña Temporal
                  </label>
                  <input
                    type="password"
                    value={newAdmin.password}
                    onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                    className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-red-600 font-medium text-gray-900 transition-all"
                    placeholder="••••••••"
                    minLength={6}
                    required
                  />
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2 ml-1">Mínimo 6 caracteres</p>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">
                    Rol Asignado
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setNewAdmin({ ...newAdmin, role: 'admin' })}
                      className={`py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${newAdmin.role === 'admin'
                        ? 'border-red-600 bg-red-50 text-red-600'
                        : 'border-gray-100 bg-gray-50 text-gray-400'
                        }`}
                    >
                      Administrador
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewAdmin({ ...newAdmin, role: 'editor' })}
                      className={`py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${newAdmin.role === 'editor'
                        ? 'border-blue-600 bg-blue-50 text-blue-600'
                        : 'border-gray-100 bg-gray-50 text-gray-400'
                        }`}
                    >
                      Editor
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-3 mt-10">
                <button
                  type="submit"
                  disabled={processing}
                  className="w-full bg-red-600 text-white font-black uppercase tracking-widest text-xs py-5 rounded-2xl hover:bg-red-700 disabled:opacity-50 transition-all shadow-xl shadow-red-200"
                >
                  {processing ? 'Procesando...' : 'Dar de Alta'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewAdmin({ email: '', fullName: '', password: '', role: 'admin' });
                  }}
                  disabled={processing}
                  className="w-full bg-gray-50 text-gray-500 font-black uppercase tracking-widest text-xs py-5 rounded-2xl hover:bg-gray-100 disabled:opacity-50 transition-all"
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
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl p-10 max-w-md w-full animate-in fade-in zoom-in duration-300 text-center">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="h-10 w-10 text-green-600" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-4 tracking-tight">Asignar Privilegios</h3>
            <p className="text-gray-500 font-medium leading-relaxed mb-10">
              Vas a otorgar permisos especiales a <strong className="text-gray-900">{selectedUser.full_name}</strong>.
              Selecciona el nivel de acceso que deseas asignar para este usuario.
            </p>
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3 mb-2">
                <button
                  onClick={() => promoteToRole('admin')}
                  disabled={processing}
                  className="bg-red-600 text-white font-black uppercase tracking-widest text-[10px] py-4 rounded-2xl hover:bg-red-700 disabled:opacity-50 transition-all shadow-lg shadow-red-100"
                >
                  Hacer Admin
                </button>
                <button
                  onClick={() => promoteToRole('editor')}
                  disabled={processing}
                  className="bg-blue-600 text-white font-black uppercase tracking-widest text-[10px] py-4 rounded-2xl hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-100"
                >
                  Hacer Editor
                </button>
              </div>
              <button
                onClick={() => {
                  setShowPromoteModal(false);
                  setSelectedUser(null);
                }}
                disabled={processing}
                className="w-full bg-gray-50 text-gray-500 font-black uppercase tracking-widest text-xs py-5 rounded-2xl hover:bg-gray-100 disabled:opacity-50 transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Remover Administrador */}
      {showDemoteModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl p-10 max-w-md w-full animate-in fade-in zoom-in duration-300 text-center">
            <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trash2 className="h-10 w-10 text-orange-600" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-4 tracking-tight">Revocar Privilegios</h3>
            <p className="text-gray-500 font-medium leading-relaxed mb-10">
              ¿Estás seguro de que deseas quitar los permisos de administrador a <strong className="text-gray-900">{selectedUser.full_name}</strong>?
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={demoteAdmin}
                disabled={processing}
                className="w-full bg-orange-600 text-white font-black uppercase tracking-widest text-xs py-5 rounded-2xl hover:bg-orange-700 disabled:opacity-50 transition-all shadow-xl shadow-orange-100"
              >
                {processing ? 'Procesando...' : 'Confirmar Revocación'}
              </button>
              <button
                onClick={() => {
                  setShowDemoteModal(false);
                  setSelectedUser(null);
                }}
                disabled={processing}
                className="w-full bg-gray-50 text-gray-500 font-black uppercase tracking-widest text-xs py-5 rounded-2xl hover:bg-gray-100 disabled:opacity-50 transition-all"
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
