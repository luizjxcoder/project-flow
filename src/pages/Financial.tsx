import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Transaction } from '@/types';
import { DataTable } from '@/components/tables/DataTable';
import { Button } from '@/components/ui/button';
import { Plus, DollarSign, Calendar, Clock, Tag, CreditCard, FileText, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export function Financial() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [viewingTransaction, setViewingTransaction] = useState<Transaction | null>(null);
  const [type, setType] = useState<'income' | 'expense'>('income');
  const [status, setStatus] = useState('completed');
  const [formData, setFormData] = useState({ category: '', description: '', amount: '', date: '', payment_method: '' });
  const queryClient = useQueryClient();

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;
      return data as Transaction[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const transactionData = {
        user_id: user.id,
        type: type,
        category: formData.get('category') as string,
        description: formData.get('description') as string,
        amount: parseFloat(formData.get('amount') as string),
        date: formData.get('date') as string,
        payment_method: formData.get('payment_method') as string,
        status: status,
      };

      const { error } = await supabase.from('transactions').insert([transactionData]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['recent-transactions'] });
      toast.success('Transação criada com sucesso!');
      setIsDialogOpen(false);
    },
    onError: (error) => {
      console.error(error);
      toast.error('Erro ao criar transação');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: FormData }) => {
      const transactionData = {
        type: type,
        category: formData.get('category') as string,
        description: formData.get('description') as string,
        amount: parseFloat(formData.get('amount') as string),
        date: formData.get('date') as string,
        payment_method: formData.get('payment_method') as string,
        status: status,
      };

      const { error } = await supabase
        .from('transactions')
        .update(transactionData)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['recent-transactions'] });
      toast.success('Transação atualizada com sucesso!');
      setIsDialogOpen(false);
      setEditingTransaction(null);
    },
    onError: (error) => {
      console.error(error);
      toast.error('Erro ao atualizar transação');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['recent-transactions'] });
      toast.success('Transação excluída com sucesso!');
    },
    onError: (error) => {
      console.error(error);
      toast.error('Erro ao excluir transação');
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const submitData = new FormData();
    submitData.append('category', formData.category);
    submitData.append('description', formData.description);
    submitData.append('amount', formData.amount);
    submitData.append('date', formData.date);
    submitData.append('payment_method', formData.payment_method);

    if (editingTransaction) {
      updateMutation.mutate({ id: editingTransaction.id, formData: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setType(transaction.type);
    setStatus(transaction.status);
    setFormData({
      category: transaction.category,
      description: transaction.description,
      amount: transaction.amount.toString(),
      date: transaction.date,
      payment_method: transaction.payment_method || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (transaction: Transaction) => {
    if (confirm('Tem certeza que deseja excluir esta transação?')) {
      deleteMutation.mutate(transaction.id);
    }
  };

  const handleView = (transaction: Transaction) => {
    setViewingTransaction(transaction);
    setIsViewDialogOpen(true);
  };

  const getTypeBadge = (transactionType: 'income' | 'expense') => {
    return (
      <Badge className={transactionType === 'income' ? 'bg-[#86BCBE] text-[#FAFBFF]' : 'bg-[#D97D54] text-[#FAFBFF]'}>
        {transactionType === 'income' ? 'Receita' : 'Despesa'}
      </Badge>
    );
  };

  const getStatusBadge = (statusValue: string) => {
    const variants: Record<string, string> = {
      pending: 'bg-[#86BCBE] text-[#FAFBFF]',
      completed: 'bg-[#314755] text-[#FAFBFF]',
      cancelled: 'bg-[#D97D54] text-[#FAFBFF]',
    };

    const labels: Record<string, string> = {
      pending: 'Pendente',
      completed: 'Concluído',
      cancelled: 'Cancelado',
    };

    return <Badge className={variants[statusValue]}>{labels[statusValue]}</Badge>;
  };

  const columns = [
    { 
      header: 'Tipo', 
      accessor: (item: Transaction) => getTypeBadge(item.type)
    },
    { header: 'Categoria', accessor: 'category' as keyof Transaction },
    { header: 'Descrição', accessor: 'description' as keyof Transaction },
    { header: 'Valor', accessor: (item: Transaction) => `R$ ${item.amount.toFixed(2)}` },
    { 
      header: 'Data', 
      accessor: (item: Transaction) => new Date(item.date).toLocaleDateString('pt-BR')
    },
    { 
      header: 'Status', 
      accessor: (item: Transaction) => getStatusBadge(item.status)
    },
  ];

  return (
    <div className="space-y-4 md:space-y-6 bg-[#FAFBFF] min-h-screen p-3 sm:p-4 md:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-[#314755]">Controle Financeiro</h1>
          <p className="text-[#314755]/70 mt-1">Gerencie suas receitas e despesas</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingTransaction(null);
            setType('income');
            setStatus('completed');
            setFormData({ category: '', description: '', amount: '', date: '', payment_method: '' });
          }
        }}>
          <DialogTrigger asChild>
            <Button className="bg-[#D97D54] hover:bg-[#D97D54]/90 text-[#FAFBFF] w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Nova Transação</span>
              <span className="sm:hidden">Nova</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#FAFBFF] border-[#314755]/20 max-w-[95vw] sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-[#314755]">{editingTransaction ? 'Editar Transação' : 'Nova Transação'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="type" className="text-[#314755]">Tipo *</Label>
                <Select value={type} onValueChange={(value) => setType(value as 'income' | 'expense')}>
                  <SelectTrigger className="border-[#314755]/20 focus:border-[#86BCBE] focus:ring-[#86BCBE]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Receita</SelectItem>
                    <SelectItem value="expense">Despesa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="category" className="text-[#314755]">Categoria *</Label>
                <Input 
                  id="category" 
                  name="category" 
                  required 
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="border-[#314755]/20 focus:border-[#86BCBE] focus:ring-[#86BCBE]"
                />
              </div>
              <div>
                <Label htmlFor="description" className="text-[#314755]">Descrição *</Label>
                <Input 
                  id="description" 
                  name="description" 
                  required 
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
                <Label htmlFor="date" className="text-[#314755]">Data *</Label>
                <Input 
                  id="date" 
                  name="date" 
                  type="date" 
                  required 
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="border-[#314755]/20 focus:border-[#86BCBE] focus:ring-[#86BCBE]"
                />
              </div>
              <div>
                <Label htmlFor="payment_method" className="text-[#314755]">Método de Pagamento</Label>
                <Input 
                  id="payment_method" 
                  name="payment_method" 
                  value={formData.payment_method}
                  onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                  className="border-[#314755]/20 focus:border-[#86BCBE] focus:ring-[#86BCBE]"
                />
              </div>
              <div>
                <Label htmlFor="status" className="text-[#314755]">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="border-[#314755]/20 focus:border-[#86BCBE] focus:ring-[#86BCBE]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="completed">Concluído</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full bg-[#86BCBE] hover:bg-[#86BCBE]/90 text-[#FAFBFF]">
                {editingTransaction ? 'Atualizar' : 'Criar'} Transação
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <DataTable
        data={transactions || []}
        columns={columns}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={isLoading}
      />

      {/* Modal de Visualização */}
      {isViewDialogOpen && viewingTransaction && (
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
                <h2 className="text-2xl font-bold text-[#314755]">Informações Completas da Transação</h2>
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
                  <h3 className="text-xl font-bold text-[#314755] mb-2">{viewingTransaction.description}</h3>
                  <div className="flex items-center gap-2">
                    {getTypeBadge(viewingTransaction.type)}
                    {getStatusBadge(viewingTransaction.status)}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-[#FAFBFF] border border-[#314755]/20 rounded-lg">
                    <DollarSign className="w-5 h-5 text-[#314755] mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#314755]/70">Valor</p>
                      <p className="text-2xl font-bold text-[#314755]">R$ {viewingTransaction.amount.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-[#FAFBFF] border border-[#314755]/20 rounded-lg">
                    <Tag className="w-5 h-5 text-[#314755] mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#314755]/70">Categoria</p>
                      <p className="text-[#314755]">{viewingTransaction.category}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-[#FAFBFF] border border-[#314755]/20 rounded-lg">
                    <Calendar className="w-5 h-5 text-[#314755] mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#314755]/70">Data</p>
                      <p className="text-[#314755]">
                        {new Date(viewingTransaction.date).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>

                  {viewingTransaction.payment_method && (
                    <div className="flex items-start gap-3 p-3 bg-[#FAFBFF] border border-[#314755]/20 rounded-lg">
                      <CreditCard className="w-5 h-5 text-[#314755] mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-[#314755]/70">Método de Pagamento</p>
                        <p className="text-[#314755]">{viewingTransaction.payment_method}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3 p-3 bg-[#FAFBFF] border border-[#314755]/20 rounded-lg">
                    <Clock className="w-5 h-5 text-[#314755] mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#314755]/70">Criado em</p>
                      <p className="text-[#314755]">
                        {new Date(viewingTransaction.created_at).toLocaleDateString('pt-BR', {
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
                      setIsViewDialogOpen(false);
                      handleEdit(viewingTransaction);
                    }} 
                    className="flex-1 bg-[#86BCBE] hover:bg-[#86BCBE]/90 text-[#FAFBFF]"
                  >
                    Editar Transação
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
