import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Plus, Eye, Edit, Trash2, X, Shield, User as UserIcon, Mail, Clock, Ban, CheckCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface UserProfile {
  id: string;
  email: string;
  username: string | null;
  is_active: boolean;
  created_at: string;
  is_admin: boolean;
}

export function AdminUsers() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewingUser, setViewingUser] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState({ email: '', password: '', username: '', isAdmin: false });
  const queryClient = useQueryClient();

  // Check if current user is admin
  const { data: isAdmin, isLoading: isCheckingAdmin } = useQuery({
    queryKey: ['is-admin'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .from('admin_users')
        .select('id')
        .eq('id', user.id)
        .single();

      if (error) return false;
      return !!data;
    },
  });

  // Fetch all users (only admins can see this)
  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['all-users'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get all user profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Get admin users
      const { data: admins, error: adminsError } = await supabase
        .from('admin_users')
        .select('id');

      if (adminsError) throw adminsError;

      const adminIds = new Set(admins?.map(a => a.id) || []);

      return profiles?.map(profile => ({
        ...profile,
        is_admin: adminIds.has(profile.id),
      })) as UserProfile[];
    },
    enabled: isAdmin === true,
  });

  // Create user mutation (admin only)
  const createUserMutation = useMutation({
    mutationFn: async (userData: { email: string; password: string; username: string; isAdmin: boolean }) => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error('Not authenticated');

      // Use Supabase Admin API to create user
      const { data, error } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          username: userData.username || userData.email.split('@')[0],
        },
      });

      if (error) throw error;

      if (!data.user) throw new Error('Failed to create user');

      // Create user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert([{
          id: data.user.id,
          email: userData.email,
          username: userData.username || userData.email.split('@')[0],
          is_active: true,
        }]);

      if (profileError) throw profileError;

      // If admin, add to admin_users
      if (userData.isAdmin) {
        const { error: adminError } = await supabase
          .from('admin_users')
          .insert([{
            id: data.user.id,
            email: userData.email,
            created_by: currentUser.id,
          }]);

        if (adminError) throw adminError;
      }

      return data.user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
      toast.success('Usuário criado com sucesso!');
      setIsCreateDialogOpen(false);
      setFormData({ email: '', password: '', username: '', isAdmin: false });
    },
    onError: (error: any) => {
      console.error('Error creating user:', error);
      toast.error(error.message || 'Erro ao criar usuário');
    },
  });

  // Toggle user active status
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('user_profiles')
        .update({ is_active: !isActive })
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
      toast.success('Status do usuário atualizado!');
    },
    onError: (error: any) => {
      console.error('Error toggling user status:', error);
      toast.error('Erro ao atualizar status do usuário');
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      // Delete from admin_users if exists
      await supabase.from('admin_users').delete().eq('id', userId);

      // Delete user profile
      const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      // Delete from auth.users (requires service role)
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);
      if (authError) throw authError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
      toast.success('Usuário excluído com sucesso!');
    },
    onError: (error: any) => {
      console.error('Error deleting user:', error);
      toast.error('Erro ao excluir usuário');
    },
  });

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      toast.error('Email e senha são obrigatórios');
      return;
    }
    createUserMutation.mutate(formData);
  };

  const handleToggleActive = (user: UserProfile) => {
    toggleActiveMutation.mutate({ userId: user.id, isActive: user.is_active });
  };

  const handleDeleteUser = (user: UserProfile) => {
    if (window.confirm(`Tem certeza que deseja excluir o usuário ${user.email}?`)) {
      deleteUserMutation.mutate(user.id);
    }
  };

  const handleView = (user: UserProfile) => {
    setViewingUser(user);
    setIsViewDialogOpen(true);
  };

  if (isCheckingAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FAFBFF]">
        <p className="text-[#314755]/70">Verificando permissões...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FAFBFF]">
        <Card className="max-w-md border-[#D97D54]">
          <CardHeader>
            <CardTitle className="text-[#D97D54] flex items-center gap-2">
              <Ban className="w-6 h-6" />
              Acesso Negado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[#314755]/70">Você não tem permissão para acessar esta página. Apenas administradores podem gerenciar usuários.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 bg-[#FAFBFF] min-h-screen p-3 sm:p-4 md:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-[#314755] flex items-center gap-2">
            <Shield className="w-8 h-8" />
            Administração de Usuários
          </h1>
          <p className="text-[#314755]/70 mt-1">Gerencie todos os usuários do sistema</p>
        </div>

        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          className="w-full sm:w-auto bg-[#D97D54] hover:bg-[#D97D54]/90 text-[#FAFBFF]"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Usuário
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-[#314755]/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-[#314755]/70">Total de Usuários</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#314755]">{users?.length || 0}</p>
          </CardContent>
        </Card>

        <Card className="border-[#314755]/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-[#314755]/70">Administradores</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#86BCBE]">{users?.filter(u => u.is_admin).length || 0}</p>
          </CardContent>
        </Card>

        <Card className="border-[#314755]/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-[#314755]/70">Usuários Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#314755]">{users?.filter(u => u.is_active).length || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card className="border-[#314755]/20">
        <CardHeader>
          <CardTitle className="text-[#314755]">Usuários Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingUsers ? (
            <p className="text-center py-8 text-[#314755]/70">Carregando usuários...</p>
          ) : users && users.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#314755]/20">
                    <th className="text-left py-3 px-4 text-[#314755] font-semibold">Email</th>
                    <th className="text-left py-3 px-4 text-[#314755] font-semibold">Nome de Usuário</th>
                    <th className="text-left py-3 px-4 text-[#314755] font-semibold">Tipo</th>
                    <th className="text-left py-3 px-4 text-[#314755] font-semibold">Status</th>
                    <th className="text-left py-3 px-4 text-[#314755] font-semibold">Data de Criação</th>
                    <th className="text-right py-3 px-4 text-[#314755] font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-[#314755]/10 hover:bg-[#86BCBE]/5">
                      <td className="py-3 px-4 text-[#314755]">{user.email}</td>
                      <td className="py-3 px-4 text-[#314755]">{user.username || '-'}</td>
                      <td className="py-3 px-4">
                        {user.is_admin ? (
                          <Badge className="bg-[#D97D54] text-[#FAFBFF]">
                            <Shield className="w-3 h-3 mr-1" />
                            Admin
                          </Badge>
                        ) : (
                          <Badge className="bg-[#314755] text-[#FAFBFF]">
                            <UserIcon className="w-3 h-3 mr-1" />
                            Usuário
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {user.is_active ? (
                          <Badge className="bg-[#86BCBE] text-[#FAFBFF]">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Ativo
                          </Badge>
                        ) : (
                          <Badge className="bg-[#314755]/50 text-[#FAFBFF]">
                            <Ban className="w-3 h-3 mr-1" />
                            Inativo
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-[#314755]">
                        {new Date(user.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(user)}
                            className="hover:bg-[#314755]/20 text-[#314755] p-1"
                            title="Visualizar"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleActive(user)}
                            className={`p-1 ${
                              user.is_active 
                                ? 'hover:bg-[#D97D54]/20 text-[#D97D54]' 
                                : 'hover:bg-[#86BCBE]/20 text-[#86BCBE]'
                            }`}
                            title={user.is_active ? 'Desativar' : 'Ativar'}
                          >
                            {user.is_active ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteUser(user)}
                            className="hover:bg-[#D97D54]/20 text-[#D97D54] p-1"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center py-8 text-[#314755]/70">Nenhum usuário encontrado</p>
          )}
        </CardContent>
      </Card>

      {/* Create User Modal */}
      {isCreateDialogOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4"
          onClick={() => setIsCreateDialogOpen(false)}
        >
          <div 
            className="bg-[#FAFBFF] rounded-lg shadow-lg w-full max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto border border-[#314755]/20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[#314755]">Criar Novo Usuário</h2>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsCreateDialogOpen(false)}
                  type="button"
                  className="text-[#314755] hover:bg-[#314755]/10"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <Label htmlFor="email" className="text-[#314755]">Email *</Label>
                  <Input 
                    id="email" 
                    type="email"
                    required 
                    placeholder="usuario@exemplo.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="border-[#314755]/20 focus:border-[#86BCBE] focus:ring-[#86BCBE]"
                  />
                </div>

                <div>
                  <Label htmlFor="password" className="text-[#314755]">Senha *</Label>
                  <Input 
                    id="password" 
                    type="password"
                    required 
                    minLength={6}
                    placeholder="Mínimo 6 caracteres"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="border-[#314755]/20 focus:border-[#86BCBE] focus:ring-[#86BCBE]"
                  />
                </div>

                <div>
                  <Label htmlFor="username" className="text-[#314755]">Nome de Usuário</Label>
                  <Input 
                    id="username" 
                    placeholder="Opcional"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="border-[#314755]/20 focus:border-[#86BCBE] focus:ring-[#86BCBE]"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isAdmin"
                    checked={formData.isAdmin}
                    onChange={(e) => setFormData({ ...formData, isAdmin: e.target.checked })}
                    className="w-4 h-4 text-[#D97D54] border-[#314755]/20 rounded focus:ring-[#86BCBE]"
                  />
                  <Label htmlFor="isAdmin" className="text-[#314755] cursor-pointer">
                    Tornar Administrador
                  </Label>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button 
                    type="button" 
                    variant="outline"
                    className="flex-1 border-[#314755]/20 text-[#314755] hover:bg-[#314755]/10"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1 bg-[#86BCBE] hover:bg-[#86BCBE]/90 text-[#FAFBFF]"
                    disabled={createUserMutation.isPending}
                  >
                    {createUserMutation.isPending ? 'Criando...' : 'Criar Usuário'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View User Modal */}
      {isViewDialogOpen && viewingUser && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4"
          onClick={() => setIsViewDialogOpen(false)}
        >
          <div 
            className="bg-[#FAFBFF] rounded-lg shadow-lg w-full max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto border border-[#314755]/20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[#314755]">Informações do Usuário</h2>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsViewDialogOpen(false)}
                  type="button"
                  className="text-[#314755] hover:bg-[#314755]/10"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="bg-[#86BCBE]/10 p-4 rounded-lg">
                  <h3 className="text-xl font-bold text-[#314755] mb-2">{viewingUser.email}</h3>
                  <div className="flex items-center gap-2">
                    {viewingUser.is_admin ? (
                      <Badge className="bg-[#D97D54] text-[#FAFBFF]">
                        <Shield className="w-3 h-3 mr-1" />
                        Administrador
                      </Badge>
                    ) : (
                      <Badge className="bg-[#314755] text-[#FAFBFF]">
                        <UserIcon className="w-3 h-3 mr-1" />
                        Usuário
                      </Badge>
                    )}
                    {viewingUser.is_active ? (
                      <Badge className="bg-[#86BCBE] text-[#FAFBFF]">Ativo</Badge>
                    ) : (
                      <Badge className="bg-[#314755]/50 text-[#FAFBFF]">Inativo</Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-[#FAFBFF] border border-[#314755]/20 rounded-lg">
                    <Mail className="w-5 h-5 text-[#314755] mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#314755]/70">Email</p>
                      <p className="text-[#314755]">{viewingUser.email}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-[#FAFBFF] border border-[#314755]/20 rounded-lg">
                    <UserIcon className="w-5 h-5 text-[#314755] mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#314755]/70">Nome de Usuário</p>
                      <p className="text-[#314755]">{viewingUser.username || 'Não definido'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-[#FAFBFF] border border-[#314755]/20 rounded-lg">
                    <Clock className="w-5 h-5 text-[#314755] mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#314755]/70">Criado em</p>
                      <p className="text-[#314755]">
                        {new Date(viewingUser.created_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button 
                    onClick={() => {
                      handleToggleActive(viewingUser);
                      setIsViewDialogOpen(false);
                    }} 
                    className={`flex-1 ${
                      viewingUser.is_active 
                        ? 'bg-[#D97D54] hover:bg-[#D97D54]/90' 
                        : 'bg-[#86BCBE] hover:bg-[#86BCBE]/90'
                    } text-[#FAFBFF]`}
                  >
                    {viewingUser.is_active ? 'Desativar' : 'Ativar'} Usuário
                  </Button>
                  <Button 
                    onClick={() => setIsViewDialogOpen(false)} 
                    variant="outline"
                    className="flex-1 border-[#314755]/20 text-[#314755] hover:bg-[#314755]/10"
                  >
                    Fechar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
