import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Client } from '@/types';
import { DataTable } from '@/components/tables/DataTable';
import { Button } from '@/components/ui/button';
import { Plus, Mail, Phone, FileText, MapPin, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export function Clients() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', document: '', address: '' });
  const queryClient = useQueryClient();

  const { data: clients, isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Client[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const clientData = {
        user_id: user.id,
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        phone: formData.get('phone') as string,
        document: formData.get('document') as string,
        address: formData.get('address') as string,
      };

      const { error } = await supabase.from('clients').insert([clientData]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Cliente cadastrado com sucesso!');
      setIsDialogOpen(false);
    },
    onError: (error) => {
      console.error(error);
      toast.error('Erro ao cadastrar cliente');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: FormData }) => {
      const clientData = {
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        phone: formData.get('phone') as string,
        document: formData.get('document') as string,
        address: formData.get('address') as string,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('clients')
        .update(clientData)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Cliente atualizado com sucesso!');
      setIsDialogOpen(false);
      setEditingClient(null);
    },
    onError: (error) => {
      console.error(error);
      toast.error('Erro ao atualizar cliente');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Cliente excluído com sucesso!');
    },
    onError: (error) => {
      console.error(error);
      toast.error('Erro ao excluir cliente');
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const submitData = new FormData();
    submitData.append('name', formData.name);
    submitData.append('email', formData.email);
    submitData.append('phone', formData.phone);
    submitData.append('document', formData.document);
    submitData.append('address', formData.address);

    if (editingClient) {
      updateMutation.mutate({ id: editingClient.id, formData: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      email: client.email,
      phone: client.phone || '',
      document: client.document || '',
      address: client.address || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (client: Client) => {
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
      deleteMutation.mutate(client.id);
    }
  };

  const handleView = (client: Client) => {
    setViewingClient(client);
    setIsViewDialogOpen(true);
  };

  const columns = [
    { header: 'Nome', accessor: 'name' as keyof Client },
    { header: 'Email', accessor: 'email' as keyof Client },
    { header: 'Telefone', accessor: 'phone' as keyof Client },
    { header: 'Documento', accessor: 'document' as keyof Client },
  ];

  return (
    <div className="space-y-4 md:space-y-6 bg-[#FAFBFF] min-h-screen p-3 sm:p-4 md:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-[#314755]">Clientes</h1>
          <p className="text-[#314755]/70 mt-1">Gerencie sua base de clientes</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingClient(null);
            setFormData({ name: '', email: '', phone: '', document: '', address: '' });
          }
        }}>
          <DialogTrigger asChild>
            <Button className="bg-[#D97D54] hover:bg-[#D97D54]/90 text-[#FAFBFF] w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Novo Cliente</span>
              <span className="sm:hidden">Novo</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#FAFBFF] border-[#314755]/20 max-w-[95vw] sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-[#314755]">{editingClient ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-[#314755]">Nome *</Label>
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
                <Label htmlFor="email" className="text-[#314755]">Email *</Label>
                <Input 
                  id="email" 
                  name="email" 
                  type="email" 
                  required 
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="border-[#314755]/20 focus:border-[#86BCBE] focus:ring-[#86BCBE]"
                />
              </div>
              <div>
                <Label htmlFor="phone" className="text-[#314755]">Telefone</Label>
                <Input 
                  id="phone" 
                  name="phone" 
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="border-[#314755]/20 focus:border-[#86BCBE] focus:ring-[#86BCBE]"
                />
              </div>
              <div>
                <Label htmlFor="document" className="text-[#314755]">CPF/CNPJ</Label>
                <Input 
                  id="document" 
                  name="document" 
                  value={formData.document}
                  onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                  className="border-[#314755]/20 focus:border-[#86BCBE] focus:ring-[#86BCBE]"
                />
              </div>
              <div>
                <Label htmlFor="address" className="text-[#314755]">Endereço</Label>
                <Input 
                  id="address" 
                  name="address" 
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="border-[#314755]/20 focus:border-[#86BCBE] focus:ring-[#86BCBE]"
                />
              </div>
              <Button type="submit" className="w-full bg-[#86BCBE] hover:bg-[#86BCBE]/90 text-[#FAFBFF]">
                {editingClient ? 'Atualizar' : 'Cadastrar'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <DataTable
        data={clients || []}
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
            <DialogTitle className="text-[#314755]">Informações Completas do Cliente</DialogTitle>
          </DialogHeader>
          {viewingClient && (
            <div className="space-y-4">
              <div className="bg-[#86BCBE]/10 p-4 rounded-lg">
                <h3 className="text-xl font-bold text-[#314755] mb-2">{viewingClient.name}</h3>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-[#FAFBFF] border border-[#314755]/20 rounded-lg">
                  <Mail className="w-5 h-5 text-[#314755] mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#314755]/70">Email</p>
                    <p className="text-[#314755]">{viewingClient.email}</p>
                  </div>
                </div>

                {viewingClient.phone && (
                  <div className="flex items-start gap-3 p-3 bg-[#FAFBFF] border border-[#314755]/20 rounded-lg">
                    <Phone className="w-5 h-5 text-[#314755] mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#314755]/70">Telefone</p>
                      <p className="text-[#314755]">{viewingClient.phone}</p>
                    </div>
                  </div>
                )}

                {viewingClient.document && (
                  <div className="flex items-start gap-3 p-3 bg-[#FAFBFF] border border-[#314755]/20 rounded-lg">
                    <FileText className="w-5 h-5 text-[#314755] mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#314755]/70">CPF/CNPJ</p>
                      <p className="text-[#314755]">{viewingClient.document}</p>
                    </div>
                  </div>
                )}

                {viewingClient.address && (
                  <div className="flex items-start gap-3 p-3 bg-[#FAFBFF] border border-[#314755]/20 rounded-lg">
                    <MapPin className="w-5 h-5 text-[#314755] mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#314755]/70">Endereço</p>
                      <p className="text-[#314755]">{viewingClient.address}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3 p-3 bg-[#FAFBFF] border border-[#314755]/20 rounded-lg">
                  <Calendar className="w-5 h-5 text-[#314755] mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#314755]/70">Cadastrado em</p>
                    <p className="text-[#314755]">
                      {new Date(viewingClient.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>

                {viewingClient.updated_at && viewingClient.updated_at !== viewingClient.created_at && (
                  <div className="flex items-start gap-3 p-3 bg-[#FAFBFF] border border-[#314755]/20 rounded-lg">
                    <Calendar className="w-5 h-5 text-[#314755] mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#314755]/70">Última atualização</p>
                      <p className="text-[#314755]">
                        {new Date(viewingClient.updated_at).toLocaleDateString('pt-BR', {
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
                    handleEdit(viewingClient);
                  }} 
                  className="flex-1 bg-[#86BCBE] hover:bg-[#86BCBE]/90 text-[#FAFBFF]"
                >
                  Editar Cliente
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
