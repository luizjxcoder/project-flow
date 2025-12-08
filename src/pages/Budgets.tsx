import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Budget, Client } from '@/types';
import { DataTable } from '@/components/tables/DataTable';
import { Button } from '@/components/ui/button';
import { Plus, FileText, DollarSign, Calendar, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export function Budgets() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [viewingBudget, setViewingBudget] = useState<Budget | null>(null);
  const [status, setStatus] = useState('pending');
  const [clientId, setClientId] = useState<string | undefined>(undefined);
  const [formData, setFormData] = useState({ title: '', description: '', amount: '', valid_until: '' });
  const queryClient = useQueryClient();

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

  const { data: budgets, isLoading } = useQuery({
    queryKey: ['budgets'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('budgets')
        .select(`
          *,
          client:clients(id, name)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Budget[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const budgetData: any = {
        user_id: user.id,
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        amount: parseFloat(formData.get('amount') as string),
        status: status,
        valid_until: formData.get('valid_until') as string || null,
      };

      // Only add client_id if a client is selected
      if (clientId && clientId !== '') {
        budgetData.client_id = clientId;
      }

      const { error } = await supabase.from('budgets').insert([budgetData]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Orçamento criado com sucesso!');
      setIsDialogOpen(false);
    },
    onError: (error) => {
      console.error(error);
      toast.error('Erro ao criar orçamento');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: FormData }) => {
      const budgetData: any = {
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        amount: parseFloat(formData.get('amount') as string),
        status: status,
        valid_until: formData.get('valid_until') as string || null,
        updated_at: new Date().toISOString(),
      };

      // Only add client_id if a client is selected
      if (clientId && clientId !== '') {
        budgetData.client_id = clientId;
      }

      const { error } = await supabase
        .from('budgets')
        .update(budgetData)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Orçamento atualizado com sucesso!');
      setIsDialogOpen(false);
      setEditingBudget(null);
    },
    onError: (error) => {
      console.error(error);
      toast.error('Erro ao atualizar orçamento');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('budgets').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Orçamento excluído com sucesso!');
    },
    onError: (error) => {
      console.error(error);
      toast.error('Erro ao excluir orçamento');
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const submitData = new FormData();
    submitData.append('title', formData.title);
    submitData.append('description', formData.description);
    submitData.append('amount', formData.amount);
    submitData.append('valid_until', formData.valid_until);

    if (editingBudget) {
      updateMutation.mutate({ id: editingBudget.id, formData: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleEdit = (budget: Budget) => {
    setEditingBudget(budget);
    setStatus(budget.status);
    setClientId((budget as any).client_id || undefined);
    setFormData({
      title: budget.title,
      description: budget.description || '',
      amount: budget.amount.toString(),
      valid_until: budget.valid_until?.split('T')[0] || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (budget: Budget) => {
    if (confirm('Tem certeza que deseja excluir este orçamento?')) {
      deleteMutation.mutate(budget.id);
    }
  };

  const handleView = (budget: Budget) => {
    setViewingBudget(budget);
    setIsViewDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: 'bg-[#86BCBE] text-[#FAFBFF]',
      approved: 'bg-[#314755] text-[#FAFBFF]',
      rejected: 'bg-[#D97D54] text-[#FAFBFF]',
      completed: 'bg-[#1B1C20] text-[#FAFBFF]',
    };

    const labels: Record<string, string> = {
      pending: 'Pendente',
      approved: 'Aprovado',
      rejected: 'Rejeitado',
      completed: 'Concluído',
    };

    return <Badge className={variants[status]}>{labels[status]}</Badge>;
  };

  const columns = [
    { header: 'Título', accessor: 'title' as keyof Budget },
    { 
      header: 'Cliente', 
      accessor: (item: Budget) => (item as any).client?.name || '-'
    },
    { header: 'Valor', accessor: (item: Budget) => `R$ ${item.amount.toFixed(2)}` },
    { header: 'Status', accessor: (item: Budget) => getStatusBadge(item.status) },
    { 
      header: 'Válido até', 
      accessor: (item: Budget) => item.valid_until ? new Date(item.valid_until).toLocaleDateString('pt-BR') : '-'
    },
  ];

  return (
    <div className="space-y-4 md:space-y-6 bg-[#FAFBFF] min-h-screen p-3 sm:p-4 md:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-[#314755]">Orçamentos</h1>
          <p className="text-[#314755]/70 mt-1">Gerencie seus orçamentos e propostas</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingBudget(null);
            setStatus('pending');
            setClientId(undefined);
            setFormData({ title: '', description: '', amount: '', valid_until: '' });
          }
        }}>
          <DialogTrigger asChild>
            <Button className="bg-[#D97D54] hover:bg-[#D97D54]/90 text-[#FAFBFF] w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Novo Orçamento</span>
              <span className="sm:hidden">Novo</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#FAFBFF] border-[#314755]/20 max-w-[95vw] sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-[#314755]">{editingBudget ? 'Editar Orçamento' : 'Novo Orçamento'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="client_id" className="text-[#314755]">Cliente</Label>
                <Select value={clientId || ''} onValueChange={(value) => setClientId(value || undefined)}>
                  <SelectTrigger className="border-[#314755]/20 focus:border-[#86BCBE] focus:ring-[#86BCBE]">
                    <SelectValue placeholder="Selecione um cliente (opcional)" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#FAFBFF] border-[#314755]/20">
                    <SelectItem value="none" className="text-[#314755]">Nenhum cliente</SelectItem>
                    {clients?.map((client) => (
                      <SelectItem key={client.id} value={client.id} className="text-[#314755]">
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="title" className="text-[#314755]">Título *</Label>
                <Input 
                  id="title" 
                  name="title" 
                  required 
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="border-[#314755]/20 focus:border-[#86BCBE] focus:ring-[#86BCBE]"
                />
              </div>
              <div>
                <Label htmlFor="description" className="text-[#314755]">Descrição</Label>
                <Textarea 
                  id="description" 
                  name="description" 
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="border-[#314755]/20 focus:border-[#86BCBE] focus:ring-[#86BCBE]"
                />
              </div>
              <div>
                <Label htmlFor="amount" className="text-[#314755]">Valor *</Label>
                <Input 
                  id="amount" 
                  name="amount" 
                  type="number" 
                  step="0.01" 
                  required 
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="border-[#314755]/20 focus:border-[#86BCBE] focus:ring-[#86BCBE]"
                />
              </div>
              <div>
                <Label htmlFor="status" className="text-[#314755]">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="border-[#314755]/20 focus:border-[#86BCBE] focus:ring-[#86BCBE]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#FAFBFF] border-[#314755]/20">
                    <SelectItem value="pending" className="text-[#314755]">Pendente</SelectItem>
                    <SelectItem value="approved" className="text-[#314755]">Aprovado</SelectItem>
                    <SelectItem value="rejected" className="text-[#314755]">Rejeitado</SelectItem>
                    <SelectItem value="completed" className="text-[#314755]">Concluído</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="valid_until" className="text-[#314755]">Válido até</Label>
                <Input 
                  id="valid_until" 
                  name="valid_until" 
                  type="date" 
                  value={formData.valid_until}
                  onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                  className="border-[#314755]/20 focus:border-[#86BCBE] focus:ring-[#86BCBE]"
                />
              </div>
              <Button type="submit" className="w-full bg-[#86BCBE] hover:bg-[#86BCBE]/90 text-[#FAFBFF]">
                {editingBudget ? 'Atualizar' : 'Criar'} Orçamento
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <DataTable
        data={budgets || []}
        columns={columns}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={isLoading}
      />

      {/* Modal de Visualização */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="bg-[#FAFBFF] border-[#314755]/20 max-w-[95vw] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[#314755]">Informações Completas do Orçamento</DialogTitle>
          </DialogHeader>
          {viewingBudget && (
            <div className="space-y-4">
              <div className="bg-[#86BCBE]/10 p-4 rounded-lg">
                <h3 className="text-xl font-bold text-[#314755] mb-2">{viewingBudget.title}</h3>
                <div className="flex items-center gap-2">
                  {getStatusBadge(viewingBudget.status)}
                </div>
                {(viewingBudget as any).client && (
                  <p className="text-sm text-[#314755]/70 mt-2">
                    Cliente: <span className="font-medium text-[#314755]">{(viewingBudget as any).client.name}</span>
                  </p>
                )}
              </div>

              <div className="space-y-3">
                {viewingBudget.description && (
                  <div className="flex items-start gap-3 p-3 bg-[#FAFBFF] border border-[#314755]/20 rounded-lg">
                    <FileText className="w-5 h-5 text-[#314755] mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#314755]/70">Descrição</p>
                      <p className="text-[#314755] whitespace-pre-wrap">{viewingBudget.description}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3 p-3 bg-[#FAFBFF] border border-[#314755]/20 rounded-lg">
                  <DollarSign className="w-5 h-5 text-[#314755] mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#314755]/70">Valor</p>
                    <p className="text-2xl font-bold text-[#314755]">R$ {viewingBudget.amount.toFixed(2)}</p>
                  </div>
                </div>

                {viewingBudget.valid_until && (
                  <div className="flex items-start gap-3 p-3 bg-[#FAFBFF] border border-[#314755]/20 rounded-lg">
                    <Calendar className="w-5 h-5 text-[#314755] mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#314755]/70">Válido até</p>
                      <p className="text-[#314755]">
                        {new Date(viewingBudget.valid_until).toLocaleDateString('pt-BR', {
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
                      {new Date(viewingBudget.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>

                {viewingBudget.updated_at && viewingBudget.updated_at !== viewingBudget.created_at && (
                  <div className="flex items-start gap-3 p-3 bg-[#FAFBFF] border border-[#314755]/20 rounded-lg">
                    <Clock className="w-5 h-5 text-[#314755] mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#314755]/70">Última atualização</p>
                      <p className="text-[#314755]">
                        {new Date(viewingBudget.updated_at).toLocaleDateString('pt-BR', {
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
                    handleEdit(viewingBudget);
                  }} 
                  className="flex-1 bg-[#86BCBE] hover:bg-[#86BCBE]/90 text-[#FAFBFF]"
                >
                  Editar Orçamento
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
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
