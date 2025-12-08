import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Investment } from '@/types';
import { DataTable } from '@/components/tables/DataTable';
import { Button } from '@/components/ui/button';
import { Plus, DollarSign, TrendingUp, Calendar, Clock, Tag, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export function Investments() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);
  const [viewingInvestment, setViewingInvestment] = useState<Investment | null>(null);
  const [investmentType, setInvestmentType] = useState('fixed_income');
  const [formData, setFormData] = useState({ name: '', initial_amount: '', current_amount: '', expected_return: '', start_date: '' });
  const queryClient = useQueryClient();

  const { data: investments, isLoading } = useQuery({
    queryKey: ['investments'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('investments')
        .select('*')
        .eq('user_id', user.id)
        .order('start_date', { ascending: false });

      if (error) throw error;
      return data as Investment[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const initialAmount = parseFloat(formData.get('initial_amount') as string);

      const investmentData = {
        user_id: user.id,
        name: formData.get('name') as string,
        type: investmentType,
        initial_amount: initialAmount,
        current_amount: initialAmount,
        expected_return: parseFloat(formData.get('expected_return') as string),
        start_date: formData.get('start_date') as string,
      };

      const { error } = await supabase.from('investments').insert([investmentData]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Investimento criado com sucesso!');
      setIsDialogOpen(false);
    },
    onError: (error) => {
      console.error(error);
      toast.error('Erro ao criar investimento');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: FormData }) => {
      const investmentData = {
        name: formData.get('name') as string,
        type: investmentType,
        current_amount: parseFloat(formData.get('current_amount') as string),
        expected_return: parseFloat(formData.get('expected_return') as string),
      };

      const { error } = await supabase
        .from('investments')
        .update(investmentData)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Investimento atualizado com sucesso!');
      setIsDialogOpen(false);
      setEditingInvestment(null);
    },
    onError: (error) => {
      console.error(error);
      toast.error('Erro ao atualizar investimento');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('investments').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Investimento excluído com sucesso!');
    },
    onError: (error) => {
      console.error(error);
      toast.error('Erro ao excluir investimento');
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const submitData = new FormData();
    submitData.append('name', formData.name);
    submitData.append('initial_amount', formData.initial_amount);
    submitData.append('current_amount', formData.current_amount);
    submitData.append('expected_return', formData.expected_return);
    submitData.append('start_date', formData.start_date);

    if (editingInvestment) {
      updateMutation.mutate({ id: editingInvestment.id, formData: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleEdit = (investment: Investment) => {
    setEditingInvestment(investment);
    setInvestmentType(investment.type);
    setFormData({
      name: investment.name,
      initial_amount: investment.initial_amount.toString(),
      current_amount: investment.current_amount.toString(),
      expected_return: investment.expected_return.toString(),
      start_date: investment.start_date
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (investment: Investment) => {
    if (confirm('Tem certeza que deseja excluir este investimento?')) {
      deleteMutation.mutate(investment.id);
    }
  };

  const handleView = (investment: Investment) => {
    setViewingInvestment(investment);
    setIsViewDialogOpen(true);
  };

  const getTypeBadge = (type: string) => {
    const labels: Record<string, string> = {
      fixed_income: 'Renda Fixa',
      stocks: 'Ações',
      funds: 'Fundos',
      crypto: 'Cripto',
      other: 'Outro',
    };

    return <Badge>{labels[type]}</Badge>;
  };

  const columns = [
    { header: 'Nome', accessor: 'name' as keyof Investment },
    { header: 'Tipo', accessor: (item: Investment) => getTypeBadge(item.type) },
    { header: 'Valor Inicial', accessor: (item: Investment) => `R$ ${item.initial_amount.toFixed(2)}` },
    { header: 'Valor Atual', accessor: (item: Investment) => `R$ ${item.current_amount.toFixed(2)}` },
    { 
      header: 'Retorno', 
      accessor: (item: Investment) => {
        const returnValue = ((item.current_amount - item.initial_amount) / item.initial_amount) * 100;
        return (
          <span className={returnValue >= 0 ? 'text-success' : 'text-destructive'}>
            {returnValue >= 0 ? '+' : ''}{returnValue.toFixed(2)}%
          </span>
        );
      }
    },
    { 
      header: 'Data Início', 
      accessor: (item: Investment) => new Date(item.start_date).toLocaleDateString('pt-BR')
    },
  ];

  return (
    <div className="space-y-4 md:space-y-6 bg-[#FAFBFF] min-h-screen p-3 sm:p-4 md:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-[#314755]">Investimentos</h1>
          <p className="text-[#314755]/70 mt-1">Gerencie e acompanhe seus investimentos</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingInvestment(null);
            setInvestmentType('fixed_income');
            setFormData({ name: '', initial_amount: '', current_amount: '', expected_return: '', start_date: '' });
          }
        }}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto bg-[#D97D54] hover:bg-[#D97D54]/90 text-[#FAFBFF]">
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Novo Investimento</span>
              <span className="sm:hidden">Novo</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-md bg-[#FAFBFF] border-[#314755]/20">
            <DialogHeader>
              <DialogTitle className="text-[#314755]">{editingInvestment ? 'Editar Investimento' : 'Novo Investimento'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-[#314755]">Nome do Investimento *</Label>
                <Input 
                  id="name" 
                  name="name" 
                  required 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="border-[#314755]/20 focus:border-[#86BCBE] focus:ring-[#86BCBE]"
                />
              </div>
              <div>
                <Label htmlFor="type" className="text-[#314755]">Tipo</Label>
                <Select value={investmentType} onValueChange={setInvestmentType}>
                  <SelectTrigger className="border-[#314755]/20 focus:border-[#86BCBE] focus:ring-[#86BCBE]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed_income">Renda Fixa</SelectItem>
                    <SelectItem value="stocks">Ações</SelectItem>
                    <SelectItem value="funds">Fundos</SelectItem>
                    <SelectItem value="crypto">Cripto</SelectItem>
                    <SelectItem value="other">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {!editingInvestment && (
                <div>
                  <Label htmlFor="initial_amount" className="text-[#314755]">Valor Inicial *</Label>
                  <Input 
                    id="initial_amount" 
                    name="initial_amount" 
                    type="number" 
                    step="0.01" 
                    required 
                    value={formData.initial_amount}
                    onChange={(e) => setFormData({ ...formData, initial_amount: e.target.value })}
                    className="border-[#314755]/20 focus:border-[#86BCBE] focus:ring-[#86BCBE]"
                  />
                </div>
              )}
              <div>
                <Label htmlFor="current_amount" className="text-[#314755]">Valor Atual *</Label>
                <Input 
                  id="current_amount" 
                  name="current_amount" 
                  type="number" 
                  step="0.01" 
                  required 
                  value={formData.current_amount}
                  onChange={(e) => setFormData({ ...formData, current_amount: e.target.value })}
                  className="border-[#314755]/20 focus:border-[#86BCBE] focus:ring-[#86BCBE]"
                />
              </div>
              <div>
                <Label htmlFor="expected_return" className="text-[#314755]">Retorno Esperado (%) *</Label>
                <Input 
                  id="expected_return" 
                  name="expected_return" 
                  type="number" 
                  step="0.01" 
                  required 
                  value={formData.expected_return}
                  onChange={(e) => setFormData({ ...formData, expected_return: e.target.value })}
                  className="border-[#314755]/20 focus:border-[#86BCBE] focus:ring-[#86BCBE]"
                />
              </div>
              {!editingInvestment && (
                <div>
                  <Label htmlFor="start_date" className="text-[#314755]">Data de Início *</Label>
                  <Input 
                    id="start_date" 
                    name="start_date" 
                    type="date" 
                    required 
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="border-[#314755]/20 focus:border-[#86BCBE] focus:ring-[#86BCBE]"
                  />
                </div>
              )}
              <Button type="submit" className="w-full bg-[#86BCBE] hover:bg-[#86BCBE]/90 text-[#FAFBFF]">
                {editingInvestment ? 'Atualizar' : 'Criar'} Investimento
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <DataTable
        data={investments || []}
        columns={columns}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={isLoading}
      />

      {/* Modal de Visualização */}
      {isViewDialogOpen && viewingInvestment && (
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
                <h2 className="text-2xl font-bold text-[#314755]">Informações Completas do Investimento</h2>
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
                  <h3 className="text-xl font-bold text-[#314755] mb-2">{viewingInvestment.name}</h3>
                  <div className="flex items-center gap-2">
                    {getTypeBadge(viewingInvestment.type)}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-[#FAFBFF] border border-[#314755]/20 rounded-lg">
                    <Tag className="w-5 h-5 text-[#314755] mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#314755]/70">Tipo de Investimento</p>
                      <p className="text-[#314755]">{(() => {
                        const labels: Record<string, string> = {
                          fixed_income: 'Renda Fixa',
                          stocks: 'Ações',
                          funds: 'Fundos',
                          crypto: 'Cripto',
                          other: 'Outro',
                        };
                        return labels[viewingInvestment.type] || viewingInvestment.type;
                      })()}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-[#FAFBFF] border border-[#314755]/20 rounded-lg">
                    <DollarSign className="w-5 h-5 text-[#314755] mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#314755]/70">Valor Inicial</p>
                      <p className="text-xl font-bold text-[#314755]">R$ {viewingInvestment.initial_amount.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-[#FAFBFF] border border-[#314755]/20 rounded-lg">
                    <DollarSign className="w-5 h-5 text-[#314755] mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#314755]/70">Valor Atual</p>
                      <p className="text-2xl font-bold text-[#86BCBE]">R$ {viewingInvestment.current_amount.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-[#FAFBFF] border border-[#314755]/20 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-[#314755] mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#314755]/70">Retorno Obtido</p>
                      <p className={`text-xl font-bold ${
                        ((viewingInvestment.current_amount - viewingInvestment.initial_amount) / viewingInvestment.initial_amount) * 100 >= 0 
                        ? 'text-[#86BCBE]' 
                        : 'text-[#D97D54]'
                      }`}>
                        {((viewingInvestment.current_amount - viewingInvestment.initial_amount) / viewingInvestment.initial_amount) * 100 >= 0 ? '+' : ''}
                        {(((viewingInvestment.current_amount - viewingInvestment.initial_amount) / viewingInvestment.initial_amount) * 100).toFixed(2)}%
                      </p>
                      <p className="text-sm text-[#314755]/70 mt-1">
                        {((viewingInvestment.current_amount - viewingInvestment.initial_amount) >= 0 ? 'Lucro' : 'Prejuízo')}: R$ {Math.abs(viewingInvestment.current_amount - viewingInvestment.initial_amount).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-[#FAFBFF] border border-[#314755]/20 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-[#314755] mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#314755]/70">Retorno Esperado</p>
                      <p className="text-[#314755] text-lg font-semibold">{viewingInvestment.expected_return.toFixed(2)}%</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-[#FAFBFF] border border-[#314755]/20 rounded-lg">
                    <Calendar className="w-5 h-5 text-[#314755] mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#314755]/70">Data de Início</p>
                      <p className="text-[#314755]">
                        {new Date(viewingInvestment.start_date).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-[#FAFBFF] border border-[#314755]/20 rounded-lg">
                    <Clock className="w-5 h-5 text-[#314755] mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#314755]/70">Criado em</p>
                      <p className="text-[#314755]">
                        {new Date(viewingInvestment.created_at).toLocaleDateString('pt-BR', {
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
                      handleEdit(viewingInvestment);
                    }} 
                    className="flex-1 bg-[#86BCBE] hover:bg-[#86BCBE]/90 text-[#FAFBFF]"
                  >
                    Editar Investimento
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
