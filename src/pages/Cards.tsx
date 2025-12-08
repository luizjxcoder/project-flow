import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card as CardType } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, CreditCard, Eye, X, DollarSign, Calendar, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export function Cards() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CardType | null>(null);
  const [viewingCard, setViewingCard] = useState<CardType | null>(null);
  const [brand, setBrand] = useState('visa');
  const [formData, setFormData] = useState({ name: '', last_digits: '', limit: '', closing_day: '', due_day: '' });
  const queryClient = useQueryClient();

  const { data: cards, isLoading } = useQuery({
    queryKey: ['cards'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('cards')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as CardType[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const cardData = {
        user_id: user.id,
        name: formData.get('name') as string,
        last_digits: formData.get('last_digits') as string,
        brand: brand,
        card_limit: parseFloat(formData.get('limit') as string),
        closing_day: parseInt(formData.get('closing_day') as string),
        due_day: parseInt(formData.get('due_day') as string),
      };

      const { error } = await supabase.from('cards').insert([cardData]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      toast.success('Cartão cadastrado com sucesso!');
      setIsDialogOpen(false);
    },
    onError: (error) => {
      console.error(error);
      toast.error('Erro ao cadastrar cartão');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: FormData }) => {
      const cardData = {
        name: formData.get('name') as string,
        last_digits: formData.get('last_digits') as string,
        brand: brand,
        card_limit: parseFloat(formData.get('limit') as string),
        closing_day: parseInt(formData.get('closing_day') as string),
        due_day: parseInt(formData.get('due_day') as string),
      };

      const { error } = await supabase
        .from('cards')
        .update(cardData)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      toast.success('Cartão atualizado com sucesso!');
      setIsDialogOpen(false);
      setEditingCard(null);
    },
    onError: (error) => {
      console.error(error);
      toast.error('Erro ao atualizar cartão');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('cards').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      toast.success('Cartão excluído com sucesso!');
    },
    onError: (error) => {
      console.error(error);
      toast.error('Erro ao excluir cartão');
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const submitData = new FormData();
    submitData.append('name', formData.name);
    submitData.append('last_digits', formData.last_digits);
    submitData.append('limit', formData.limit);
    submitData.append('closing_day', formData.closing_day);
    submitData.append('due_day', formData.due_day);

    if (editingCard) {
      updateMutation.mutate({ id: editingCard.id, formData: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleEdit = (card: CardType) => {
    setEditingCard(card);
    setBrand(card.brand);
    setFormData({
      name: card.name,
      last_digits: card.last_digits,
      limit: card.card_limit.toString(),
      closing_day: card.closing_day.toString(),
      due_day: card.due_day.toString()
    });
    setIsDialogOpen(true);
  };

  const handleView = (card: CardType) => {
    setViewingCard(card);
    setIsViewDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este cartão?')) {
      deleteMutation.mutate(id);
    }
  };

  const getBrandBadge = (brand: string) => {
    const variants: Record<string, string> = {
      visa: 'bg-[#314755] text-[#FAFBFF]',
      mastercard: 'bg-[#D97D54] text-[#FAFBFF]',
      elo: 'bg-[#86BCBE] text-[#FAFBFF]',
      amex: 'bg-[#1B1C20] text-[#FAFBFF]',
      other: 'bg-[#314755]/50 text-[#FAFBFF]',
    };

    return <Badge className={variants[brand]}>{brand.toUpperCase()}</Badge>;
  };

  const getBrandName = (brand: string) => {
    const names: Record<string, string> = {
      visa: 'Visa',
      mastercard: 'Mastercard',
      elo: 'Elo',
      amex: 'American Express',
      other: 'Outro',
    };
    return names[brand] || brand;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-[#FAFBFF] min-h-screen">
        <p className="text-[#314755]/70">Carregando cartões...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 bg-[#FAFBFF] min-h-screen p-3 sm:p-4 md:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-[#314755]">Gestão de Cartões</h1>
          <p className="text-[#314755]/70 mt-1">Gerencie seus cartões de crédito</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingCard(null);
            setBrand('visa');
            setFormData({ name: '', last_digits: '', limit: '', closing_day: '', due_day: '' });
          }
        }}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto bg-[#D97D54] hover:bg-[#D97D54]/90 text-[#FAFBFF]">
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Novo Cartão</span>
              <span className="sm:hidden">Novo</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-md bg-[#FAFBFF] border-[#314755]/20">
            <DialogHeader>
              <DialogTitle className="text-[#314755]">{editingCard ? 'Editar Cartão' : 'Novo Cartão'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-[#314755]">Nome do Cartão *</Label>
                <Input 
                  id="name" 
                  name="name" 
                  required 
                  placeholder="Ex: Nubank" 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="border-[#314755]/20 focus:border-[#86BCBE] focus:ring-[#86BCBE]"
                />
              </div>
              <div>
                <Label htmlFor="last_digits" className="text-[#314755]">Últimos 4 Dígitos *</Label>
                <Input 
                  id="last_digits" 
                  name="last_digits" 
                  required 
                  maxLength={4} 
                  placeholder="1234" 
                  value={formData.last_digits}
                  onChange={(e) => setFormData({ ...formData, last_digits: e.target.value })}
                  className="border-[#314755]/20 focus:border-[#86BCBE] focus:ring-[#86BCBE]"
                />
              </div>
              <div>
                <Label htmlFor="brand" className="text-[#314755]">Bandeira</Label>
                <Select value={brand} onValueChange={setBrand}>
                  <SelectTrigger className="border-[#314755]/20 focus:border-[#86BCBE] focus:ring-[#86BCBE]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="visa">Visa</SelectItem>
                    <SelectItem value="mastercard">Mastercard</SelectItem>
                    <SelectItem value="elo">Elo</SelectItem>
                    <SelectItem value="amex">American Express</SelectItem>
                    <SelectItem value="other">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="limit" className="text-[#314755]">Limite *</Label>
                <Input 
                  id="limit" 
                  name="limit" 
                  type="number" 
                  step="0.01" 
                  required 
                  value={formData.limit}
                  onChange={(e) => setFormData({ ...formData, limit: e.target.value })}
                  className="border-[#314755]/20 focus:border-[#86BCBE] focus:ring-[#86BCBE]"
                />
              </div>
              <div>
                <Label htmlFor="closing_day" className="text-[#314755]">Dia de Fechamento *</Label>
                <Input 
                  id="closing_day" 
                  name="closing_day" 
                  type="number" 
                  min="1" 
                  max="31" 
                  required 
                  value={formData.closing_day}
                  onChange={(e) => setFormData({ ...formData, closing_day: e.target.value })}
                  className="border-[#314755]/20 focus:border-[#86BCBE] focus:ring-[#86BCBE]"
                />
              </div>
              <div>
                <Label htmlFor="due_day" className="text-[#314755]">Dia de Vencimento *</Label>
                <Input 
                  id="due_day" 
                  name="due_day" 
                  type="number" 
                  min="1" 
                  max="31" 
                  required 
                  value={formData.due_day}
                  onChange={(e) => setFormData({ ...formData, due_day: e.target.value })}
                  className="border-[#314755]/20 focus:border-[#86BCBE] focus:ring-[#86BCBE]"
                />
              </div>
              <Button type="submit" className="w-full bg-[#86BCBE] hover:bg-[#86BCBE]/90 text-[#FAFBFF]">
                {editingCard ? 'Atualizar' : 'Cadastrar'} Cartão
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {cards && cards.length > 0 ? (
          cards.map((card) => (
            <Card key={card.id} className="hover:shadow-lg transition-shadow bg-[#FAFBFF] border-[#314755]/20">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-[#314755]" />
                    <span className="text-[#314755]">{card.name}</span>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleView(card)}
                      className="hover:bg-[#314755]/20 text-[#314755] hover:text-[#314755] p-1"
                      title="Visualizar"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(card)}
                      className="hover:bg-[#86BCBE]/20 text-[#86BCBE] hover:text-[#86BCBE]"
                    >
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(card.id)}
                      className="hover:bg-[#D97D54]/20 text-[#D97D54] hover:text-[#D97D54]"
                    >
                      Excluir
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-[#314755]/70">
                  **** **** **** {card.last_digits}
                </p>
                <div className="flex items-center gap-2">
                  {getBrandBadge(card.brand)}
                </div>
                <p className="text-sm text-[#314755]">
                  <span className="font-medium">Limite:</span> R$ {card.card_limit.toFixed(2)}
                </p>
                <div className="flex justify-between text-sm text-[#314755]">
                  <span>Fechamento: dia {card.closing_day}</span>
                  <span>Vencimento: dia {card.due_day}</span>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <CreditCard className="w-12 h-12 mx-auto text-[#314755]/70 mb-4" />
            <p className="text-[#314755]/70">Nenhum cartão cadastrado</p>
          </div>
        )}
      </div>

      {/* Modal de Visualização */}
      {isViewDialogOpen && viewingCard && (
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
                <h2 className="text-2xl font-bold text-[#314755]">Informações Completas do Cartão</h2>
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
                  <h3 className="text-xl font-bold text-[#314755] mb-2">{viewingCard.name}</h3>
                  <div className="flex items-center gap-2">
                    {getBrandBadge(viewingCard.brand)}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-[#FAFBFF] border border-[#314755]/20 rounded-lg">
                    <CreditCard className="w-5 h-5 text-[#314755] mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#314755]/70">Bandeira</p>
                      <p className="text-[#314755]">{getBrandName(viewingCard.brand)}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-[#FAFBFF] border border-[#314755]/20 rounded-lg">
                    <CreditCard className="w-5 h-5 text-[#314755] mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#314755]/70">Últimos Dígitos</p>
                      <p className="text-[#314755] font-mono text-lg">•••• {viewingCard.last_digits}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-[#FAFBFF] border border-[#314755]/20 rounded-lg">
                    <DollarSign className="w-5 h-5 text-[#314755] mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#314755]/70">Limite do Cartão</p>
                      <p className="text-2xl font-bold text-[#314755]">R$ {viewingCard.card_limit.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-[#FAFBFF] border border-[#314755]/20 rounded-lg">
                    <Calendar className="w-5 h-5 text-[#314755] mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#314755]/70">Dia de Fechamento</p>
                      <p className="text-[#314755]">Dia {viewingCard.closing_day} de cada mês</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-[#FAFBFF] border border-[#314755]/20 rounded-lg">
                    <Calendar className="w-5 h-5 text-[#314755] mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#314755]/70">Dia de Vencimento</p>
                      <p className="text-[#314755]">Dia {viewingCard.due_day} de cada mês</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-[#FAFBFF] border border-[#314755]/20 rounded-lg">
                    <Clock className="w-5 h-5 text-[#314755] mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#314755]/70">Criado em</p>
                      <p className="text-[#314755]">
                        {new Date(viewingCard.created_at).toLocaleDateString('pt-BR', {
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
                      handleEdit(viewingCard);
                    }} 
                    className="flex-1 bg-[#86BCBE] hover:bg-[#86BCBE]/90 text-[#FAFBFF]"
                  >
                    Editar Cartão
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
