import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Project, Client } from '@/types';
import { DataTable } from '@/components/tables/DataTable';
import { Button } from '@/components/ui/button';
import { Plus, X, Loader2, FileText, DollarSign, Calendar, Clock, Flag } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface ProjectFormData {
  name: string;
  description: string;
  budget: string;
  start_date: string;
  end_date: string;
  status: string;
  client_id: string;
}

export function Projects() {
  const [showModal, setShowModal] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [viewingProject, setViewingProject] = useState<(Project & { clients?: { name: string } }) | null>(null);
  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    description: '',
    budget: '',
    start_date: '',
    end_date: '',
    status: 'planning',
    client_id: '',
  });
  const queryClient = useQueryClient();

  // Query para buscar projetos
  const { data: projects, isLoading: isLoadingProjects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('projects')
        .select('*, clients(name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as (Project & { clients?: { name: string } })[];
    },
  });

  // Query para buscar clientes
  const { data: clients } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true });

      if (error) throw error;
      return data as Client[];
    },
  });

  // Mutation para criar projeto
  const createMutation = useMutation({
    mutationFn: async (projectData: ProjectFormData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const newProject: any = {
        user_id: user.id,
        name: projectData.name.trim(),
        status: projectData.status,
      };

      if (projectData.description?.trim()) {
        newProject.description = projectData.description.trim();
      }

      if (projectData.client_id) {
        newProject.client_id = projectData.client_id;
      }

      if (projectData.budget) {
        const budgetValue = parseFloat(projectData.budget);
        if (!isNaN(budgetValue)) {
          newProject.budget = budgetValue;
        }
      }

      if (projectData.start_date) {
        newProject.start_date = projectData.start_date;
      }

      if (projectData.end_date) {
        newProject.end_date = projectData.end_date;
      }

      const { data, error } = await supabase
        .from('projects')
        .insert([newProject])
        .select('*, clients(name)')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Projeto criado com sucesso!');
      handleCloseModal();
    },
    onError: (error: any) => {
      console.error('Erro ao criar projeto:', error);
      toast.error(error?.message || 'Erro ao criar projeto');
    },
  });

  // Mutation para atualizar projeto
  const updateMutation = useMutation({
    mutationFn: async ({ id, projectData }: { id: string; projectData: ProjectFormData }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const updatedProject: any = {
        name: projectData.name.trim(),
        status: projectData.status,
        updated_at: new Date().toISOString(),
      };

      if (projectData.description?.trim()) {
        updatedProject.description = projectData.description.trim();
      } else {
        updatedProject.description = null;
      }

      if (projectData.client_id) {
        updatedProject.client_id = projectData.client_id;
      } else {
        updatedProject.client_id = null;
      }

      if (projectData.budget) {
        const budgetValue = parseFloat(projectData.budget);
        if (!isNaN(budgetValue)) {
          updatedProject.budget = budgetValue;
        } else {
          updatedProject.budget = null;
        }
      } else {
        updatedProject.budget = null;
      }

      if (projectData.start_date) {
        updatedProject.start_date = projectData.start_date;
      } else {
        updatedProject.start_date = null;
      }

      if (projectData.end_date) {
        updatedProject.end_date = projectData.end_date;
      } else {
        updatedProject.end_date = null;
      }

      const { data, error } = await supabase
        .from('projects')
        .update(updatedProject)
        .eq('id', id)
        .eq('user_id', user.id)
        .select('*, clients(name)')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Projeto atualizado com sucesso!');
      handleCloseModal();
    },
    onError: (error: any) => {
      console.error('Erro ao atualizar projeto:', error);
      toast.error(error?.message || 'Erro ao atualizar projeto');
    },
  });

  // Mutation para deletar projeto
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Projeto excluído com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao excluir projeto:', error);
      toast.error(error?.message || 'Erro ao excluir projeto');
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      budget: '',
      start_date: '',
      end_date: '',
      status: 'planning',
      client_id: '',
    });
    setEditingProject(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setTimeout(() => {
      resetForm();
    }, 300);
  };

  const handleOpenNewProject = () => {
    resetForm();
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Por favor, preencha o nome do projeto');
      return;
    }

    if (editingProject) {
      updateMutation.mutate({ id: editingProject.id, projectData: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (project: Project & { clients?: { name: string } }) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      description: project.description || '',
      budget: project.budget?.toString() || '',
      start_date: project.start_date?.split('T')[0] || '',
      end_date: project.end_date?.split('T')[0] || '',
      status: project.status,
      client_id: project.client_id || '',
    });
    setShowModal(true);
  };

  const handleDelete = (project: Project) => {
    if (window.confirm('Tem certeza que deseja excluir este projeto?')) {
      deleteMutation.mutate(project.id);
    }
  };

  const handleView = (project: Project & { clients?: { name: string } }) => {
    setViewingProject(project);
    setIsViewDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      planning: 'secondary',
      in_progress: 'default',
      completed: 'outline',
      on_hold: 'secondary',
      cancelled: 'destructive',
    };

    const labels: Record<string, string> = {
      planning: 'Planejamento',
      in_progress: 'Em Progresso',
      completed: 'Concluído',
      on_hold: 'Pausado',
      cancelled: 'Cancelado',
    };

    return <Badge variant={variants[status] || 'secondary'}>{labels[status] || status}</Badge>;
  };

  const columns = [
    { header: 'Nome', accessor: 'name' as keyof Project },
    { 
      header: 'Cliente', 
      accessor: (item: Project & { clients?: { name: string } }) => item.clients?.name || '-'
    },
    { header: 'Status', accessor: (item: Project) => getStatusBadge(item.status) },
    { 
      header: 'Orçamento', 
      accessor: (item: Project) => item.budget ? `R$ ${item.budget.toFixed(2)}` : '-'
    },
    { 
      header: 'Início', 
      accessor: (item: Project) => item.start_date ? new Date(item.start_date).toLocaleDateString('pt-BR') : '-'
    },
    { 
      header: 'Término', 
      accessor: (item: Project) => item.end_date ? new Date(item.end_date).toLocaleDateString('pt-BR') : '-'
    },
  ];

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-4 md:space-y-6 bg-[#FAFBFF] min-h-screen p-3 sm:p-4 md:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-[#314755]">Projetos</h1>
          <p className="text-[#314755]/70 mt-1">Gerencie seus projetos e acompanhe o progresso</p>
        </div>
        <Button onClick={handleOpenNewProject} className="bg-[#D97D54] hover:bg-[#D97D54]/90 text-[#FAFBFF] w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">Novo Projeto</span>
          <span className="sm:hidden">Novo</span>
        </Button>
      </div>

      <DataTable
        data={projects || []}
        columns={columns}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={isLoadingProjects}
      />

      {/* Modal de Criar/Editar */}
      {showModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4"
          onClick={handleCloseModal}
        >
          <div 
            className="bg-[#FAFBFF] rounded-lg shadow-lg w-full max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto border border-[#314755]/20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              {/* Header do Modal */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[#314755]">
                  {editingProject ? 'Editar Projeto' : 'Novo Projeto'}
                </h2>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleCloseModal}
                  type="button"
                  className="text-[#314755] hover:bg-[#314755]/10"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Formulário */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-[#314755]">Nome do Projeto *</Label>
                  <Input 
                    id="name" 
                    required 
                    placeholder="Digite o nome do projeto"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={isPending}
                    className="border-[#314755]/20 focus:border-[#86BCBE] focus:ring-[#86BCBE]"
                  />
                </div>

                <div>
                  <Label htmlFor="description" className="text-[#314755]">Descrição</Label>
                  <Textarea 
                    id="description" 
                    rows={3}
                    placeholder="Descreva o projeto..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    disabled={isPending}
                    className="border-[#314755]/20 focus:border-[#86BCBE] focus:ring-[#86BCBE]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="client" className="text-[#314755]">Cliente</Label>
                    <select
                      id="client"
                      className="flex h-10 w-full rounded-md border border-[#314755]/20 bg-[#FAFBFF] px-3 py-2 text-sm text-[#314755] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#86BCBE] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={formData.client_id}
                      onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                      disabled={isPending}
                    >
                      <option value="">Nenhum cliente</option>
                      {clients?.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="status" className="text-[#314755]">Status</Label>
                    <select
                      id="status"
                      className="flex h-10 w-full rounded-md border border-[#314755]/20 bg-[#FAFBFF] px-3 py-2 text-sm text-[#314755] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#86BCBE] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      disabled={isPending}
                    >
                      <option value="planning">Planejamento</option>
                      <option value="in_progress">Em Progresso</option>
                      <option value="completed">Concluído</option>
                      <option value="on_hold">Pausado</option>
                      <option value="cancelled">Cancelado</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="budget" className="text-[#314755]">Orçamento</Label>
                    <Input 
                      id="budget" 
                      type="number" 
                      step="0.01" 
                      placeholder="0.00"
                      value={formData.budget}
                      onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                      disabled={isPending}
                      className="border-[#314755]/20 focus:border-[#86BCBE] focus:ring-[#86BCBE]"
                    />
                  </div>

                  <div>
                    <Label htmlFor="start_date" className="text-[#314755]">Data de Início</Label>
                    <Input 
                      id="start_date" 
                      type="date" 
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      disabled={isPending}
                      className="border-[#314755]/20 focus:border-[#86BCBE] focus:ring-[#86BCBE]"
                    />
                  </div>

                  <div>
                    <Label htmlFor="end_date" className="text-[#314755]">Data de Término</Label>
                    <Input 
                      id="end_date" 
                      type="date" 
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      disabled={isPending}
                      className="border-[#314755]/20 focus:border-[#86BCBE] focus:ring-[#86BCBE]"
                    />
                  </div>
                </div>

                {/* Botões de ação */}
                <div className="flex gap-3 pt-4">
                  <Button 
                    type="button" 
                    variant="outline"
                    className="flex-1 border-[#314755]/20 text-[#314755] hover:bg-[#314755]/10"
                    onClick={handleCloseModal}
                    disabled={isPending}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1 bg-[#86BCBE] hover:bg-[#86BCBE]/90 text-[#FAFBFF]"
                    disabled={isPending}
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      editingProject ? 'Atualizar' : 'Criar'
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Visualização */}
      {isViewDialogOpen && viewingProject && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4"
          onClick={() => setIsViewDialogOpen(false)}
        >
          <div 
            className="bg-[#FAFBFF] rounded-lg shadow-lg w-full max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto border border-[#314755]/20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              {/* Header do Modal */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[#314755]">Informações Completas do Projeto</h2>
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
                  <h3 className="text-xl font-bold text-[#314755] mb-2">{viewingProject.name}</h3>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(viewingProject.status)}
                  </div>
                  {viewingProject.clients && (
                    <p className="text-sm text-[#314755]/70 mt-2">
                      Cliente: <span className="font-medium text-[#314755]">{viewingProject.clients.name}</span>
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  {viewingProject.description && (
                    <div className="flex items-start gap-3 p-3 bg-[#FAFBFF] border border-[#314755]/20 rounded-lg">
                      <FileText className="w-5 h-5 text-[#314755] mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-[#314755]/70">Descrição</p>
                        <p className="text-[#314755] whitespace-pre-wrap">{viewingProject.description}</p>
                      </div>
                    </div>
                  )}

                  {viewingProject.budget && (
                    <div className="flex items-start gap-3 p-3 bg-[#FAFBFF] border border-[#314755]/20 rounded-lg">
                      <DollarSign className="w-5 h-5 text-[#314755] mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-[#314755]/70">Orçamento</p>
                        <p className="text-2xl font-bold text-[#314755]">R$ {viewingProject.budget.toFixed(2)}</p>
                      </div>
                    </div>
                  )}

                  {viewingProject.start_date && (
                    <div className="flex items-start gap-3 p-3 bg-[#FAFBFF] border border-[#314755]/20 rounded-lg">
                      <Calendar className="w-5 h-5 text-[#314755] mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-[#314755]/70">Data de Início</p>
                        <p className="text-[#314755]">
                          {new Date(viewingProject.start_date).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  )}

                  {viewingProject.end_date && (
                    <div className="flex items-start gap-3 p-3 bg-[#FAFBFF] border border-[#314755]/20 rounded-lg">
                      <Flag className="w-5 h-5 text-[#314755] mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-[#314755]/70">Data de Término</p>
                        <p className="text-[#314755]">
                          {new Date(viewingProject.end_date).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3 p-3 bg-[#FAFBFF] border border-[#314755]/20 rounded-lg">
                    <Clock className="w-5 h-5 text-[#314755] mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#314755]/70">Criado em</p>
                      <p className="text-[#314755]">
                        {new Date(viewingProject.created_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>

                  {viewingProject.updated_at && viewingProject.updated_at !== viewingProject.created_at && (
                    <div className="flex items-start gap-3 p-3 bg-[#FAFBFF] border border-[#314755]/20 rounded-lg">
                      <Clock className="w-5 h-5 text-[#314755] mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-[#314755]/70">Última atualização</p>
                        <p className="text-[#314755]">
                          {new Date(viewingProject.updated_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <Button 
                    onClick={() => {
                      setIsViewDialogOpen(false);
                      handleEdit(viewingProject);
                    }} 
                    className="flex-1 bg-[#86BCBE] hover:bg-[#86BCBE]/90 text-[#FAFBFF]"
                  >
                    Editar Projeto
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
