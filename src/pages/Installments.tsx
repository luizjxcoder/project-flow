import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Installment } from '@/types';
import { DataTable } from '@/components/tables/DataTable';
import { Button } from '@/components/ui/button';
import { Plus, FileText, DollarSign, Calendar, Clock, CreditCard, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export function Installments() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingInstallment, setEditingInstallment] = useState<Installment | null>(null);
  const [viewingInstallment, setViewingInstallment] = useState<Installment | null>(null);
  const [formData, setFormData] = useState({ description: '', total_amount: '', installments: '', start_date: '' });
  const queryClient = useQueryClient();

  const { data: installments, isLoading } = useQuery({
    queryKey: ['installments'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('installments')
        .select('*')
        .eq('user_id', user.id)
        .order('start_date', { ascending: false });

      if (error) throw error;
      return data as Installment[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const totalAmount = parseFloat(formData.get('total_amount') as string);
      const installments = parseInt(formData.get('installments') as string);
      const installmentValue = totalAmount / installments;

      const installmentData = {
        user_id: user.id,
        description: formData.get('description') as string,
        total_amount: totalAmount,
        installments: installments,
        installment_value: installmentValue,
        start_date: formData.get('start_date') as string,
      };

      const { error } = await supabase.from('installments').insert([installmentData]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['installments'] });
      toast.success('Parcelamento criado com sucesso!');
      setIsDialogOpen(false);
    },
    onError: (error) => {
      console.error(error);
      toast.error('Erro ao criar parcelamento');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: FormData }) => {
      const totalAmount = parseFloat(formData.get('total_amount') as string);
      const installments = parseInt(formData.get('installments') as string);
      const installmentValue = totalAmount / installments;

      const installmentData = {
        description: formData.get('description') as string,
        total_amount: totalAmount,
        installments: installments,
        installment_value: installmentValue,
        start_date: formData.get('start_date') as string,
      };

      const { error } = await supabase
        .from('installments')
        .update(installmentData)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['installments'] });
      toast.success('Parcelamento atualizado com sucesso!');
      setIsDialogOpen(false);
      setEditingInstallment(null);
    },
    onError: (error) => {
      console.error(error);
      toast.error('Erro ao atualizar parcelamento');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('installments').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['installments'] });
      toast.success('Parcelamento excluído com sucesso!');
    },
    onError: (error) => {
      console.error(error);
      toast.error('Erro ao excluir parcelamento');
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const submitData = new FormData();
    submitData.append('description', formData.description);
    submitData.append('total_amount', formData.total_amount);
    submitData.append('installments', formData.installments);
    submitData.append('start_date', formData.start_date);

    if (editingInstallment) {
      updateMutation.mutate({ id: editingInstallment.id, formData: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleEdit = (installment: Installment) => {
    setEditingInstallment(installment);
    setFormData({
      description: installment.description,
      total_amount: installment.total_amount.toString(),
      installments: installment.installments.toString(),
      start_date: installment.start_date
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (installment: Installment) => {
    if (confirm('Tem certeza que deseja excluir este parcelamento?')) {
      deleteMutation.mutate(installment.id);
    }
  };

  const handleView = (installment: Installment) => {
    setViewingInstallment(installment);
    setIsViewDialogOpen(true);
  };

  const columns = [
    { header: 'Descrição', accessor: 'description' as keyof Installment },
    { header: 'Valor Total', accessor: (item: Installment) => `R$ ${item.total_amount.toFixed(2)}` },
    { header: 'Parcelas', accessor: 'installments' as keyof Installment },
    { header: 'Valor da Parcela', accessor: (item: Installment) => `R$ ${item.installment_value.toFixed(2)}` },
    { 
      header: 'Data Início', 
      accessor: (item: Installment) => new Date(item.start_date).toLocaleDateString('pt-BR')
    },
  ];

  return (
    <div className="space-y-4 md:space-y-6 bg-[#FAFBFF] min-h-screen p-3 sm:p-4 md:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-[#314755]">Projeção de Parcelamentos</h1>
          <p className="text-[#314755]/70 mt-1">Gerencie suas compras parceladas</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingInstallment(null);
            setFormData({ description: '', total_amount: '', installments: '', start_date: '' });
          }
        }}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto bg-[#D97D54] hover:bg-[#D97D54]/90 text-[#FAFBFF]">
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Novo Parcelamento</span>
              <span className="sm:hidden">Novo</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-md bg-[#FAFBFF] border-[#314755]/20">
            <DialogHeader>
              <DialogTitle className="text-[#314755]">{editingInstallment ? 'Editar Parcelamento' : 'Novo Parcelamento'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                <Label htmlFor="total_amount" className="text-[#314755]">Valor Total *</Label>
                <Input 
                  id="total_amount" 
                  name="total_amount" 
                  type="number" 
                  step="0.01" 
                  required 
                  value={formData.total_amount}
                  onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
                  className="border-[#314755]/20 focus:border-[#86BCBE] focus:ring-[#86BCBE]"
                />
              </div>
              <div>
                <Label htmlFor="installments" className="text-[#314755]">Número de Parcelas *</Label>
                <Input 
                  id="installments" 
                  name="installments" 
                  type="number" 
                  min="1" 
                  required 
                  value={formData.installments}
                  onChange={(e) => setFormData({ ...formData, installments: e.target.value })}
                  className="border-[#314755]/20 focus:border-[#86BCBE] focus:ring-[#86BCBE]"
                />
              </div>
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
              <Button type="submit" className="w-full bg-[#86BCBE] hover:bg-[#86BCBE]/90 text-[#FAFBFF]">
                {editingInstallment ? 'Atualizar' : 'Criar'} Parcelamento
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <DataTable
        data={installments || []}
        columns={columns}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={isLoading}
      />

      {/* Modal de Visualização */}
      {isViewDialogOpen && viewingInstallment && (
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
                <h2 className="text-2xl font-bold text-[#314755]">Informações Completas do Parcelamento</h2>
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
                  <h3 className="text-xl font-bold text-[#314755] mb-2">{viewingInstallment.description}</h3>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-[#FAFBFF] border border-[#314755]/20 rounded-lg">
                    <DollarSign className="w-5 h-5 text-[#314755] mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#314755]/70">Valor Total</p>
                      <p className="text-2xl font-bold text-[#314755]">R$ {viewingInstallment.total_amount.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-[#FAFBFF] border border-[#314755]/20 rounded-lg">
                    <CreditCard className="w-5 h-5 text-[#314755] mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#314755]/70">Número de Parcelas</p>
                      <p className="text-[#314755] text-lg font-semibold">{viewingInstallment.installments}x</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-[#FAFBFF] border border-[#314755]/20 rounded-lg">
                    <DollarSign className="w-5 h-5 text-[#314755] mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#314755]/70">Valor de Cada Parcela</p>
                      <p className="text-xl font-bold text-[#86BCBE]">R$ {viewingInstallment.installment_value.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-[#FAFBFF] border border-[#314755]/20 rounded-lg">
                    <Calendar className="w-5 h-5 text-[#314755] mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#314755]/70">Data de Início</p>
                      <p className="text-[#314755]">
                        {new Date(viewingInstallment.start_date).toLocaleDateString('pt-BR', {
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
                        {new Date(viewingInstallment.created_at).toLocaleDateString('pt-BR', {
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
                      handleEdit(viewingInstallment);
                    }} 
                    className="flex-1 bg-[#86BCBE] hover:bg-[#86BCBE]/90 text-[#FAFBFF]"
                  >
                    Editar Parcelamento
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
