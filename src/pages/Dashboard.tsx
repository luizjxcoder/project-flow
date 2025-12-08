
import { DollarSign, TrendingUp, Users, FileText, Wallet, Target, Eye, Calendar, Clock, User, MapPin, Briefcase } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { FinancialChart } from '@/components/dashboard/FinancialChart';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Reservation, Client } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState } from 'react';

export function Dashboard() {
  const { data: stats, isLoading } = useDashboardStats();
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Query para buscar agendamentos recentes
  const { data: recentReservations, isLoading: isLoadingReservations } = useQuery({
    queryKey: ['recent-reservations'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('reservations')
        .select('*, clients(name)')
        .eq('user_id', user.id)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true })
        .limit(5);

      if (error) throw error;
      return data as (Reservation & { clients?: { name: string } })[];
    },
  });

  // Query para buscar clientes
  const { data: clients, isLoading: isLoadingClients } = useQuery({
    queryKey: ['dashboard-clients'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as Client[];
    },
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      scheduled: 'secondary',
      confirmed: 'default',
      completed: 'outline',
      cancelled: 'destructive',
    };

    const labels: Record<string, string> = {
      scheduled: 'Agendado',
      confirmed: 'Confirmado',
      completed: 'Concluído',
      cancelled: 'Cancelado',
    };

    return <Badge variant={variants[status] || 'secondary'}>{labels[status] || status}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Carregando dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 md:space-y-4">
      {/* Primeira linha - Cards de estatísticas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          title="Saldo Total"
          value={`R$ ${stats?.balance.toFixed(2) || '0.00'}`}
          icon={DollarSign}
          trend="+12.5% vs mês anterior"
          trendUp={true}
          customColors={true}
        />
        <StatCard
          title="Receitas"
          value={`R$ ${stats?.totalIncome.toFixed(2) || '0.00'}`}
          icon={TrendingUp}
          trend="+8.2% vs mês anterior"
          trendUp={true}
          customColors={true}
        />
        <StatCard
          title="Despesas"
          value={`R$ ${stats?.totalExpenses.toFixed(2) || '0.00'}`}
          icon={Wallet}
          trend="-3.1% vs mês anterior"
          trendUp={false}
          customColors={true}
        />
        <StatCard
          title="Margem de Lucro"
          value={`${stats?.profitMargin.toFixed(1) || '0.0'}%`}
          icon={Target}
          customColors={true}
        />
      </div>

      {/* Segunda linha - Cards de estatísticas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          title="Clientes Ativos"
          value={`${stats?.totalClients || 0}`}
          icon={Users}
          customColors={true}
        />
        <StatCard
          title="Orçamentos Ativos"
          value={`${stats?.activeBudgets || 0}`}
          icon={FileText}
          customColors={true}
        />
        <StatCard
          title="Agendamentos Ativos"
          value={`${stats?.activeReservations || 0}`}
          icon={Calendar}
          customColors={true}
        />
        <StatCard
          title="Total de Projetos"
          value={`${stats?.totalProjects || 0}`}
          icon={Briefcase}
          customColors={true}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Lado Esquerdo */}
        {/* Gráfico Financeiro - 3 colunas */}
        <div className="lg:col-span-3 space-y-3 md:space-y-4">
          <FinancialChart />
          <RecentTransactions />
        </div>

        {/* Lado Direito */}
        {/* Agendamentos Recentes - 1 coluna */}
        <div className="lg:col-span-1 lg:row-span-2">
          <Card className="bg-[#314755]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-[#F9FAFF]">
                    <Calendar className="w-5 h-5 text-[#F9FAFF]" />
                    Próximos Agendamentos
                  </CardTitle>
                  <CardDescription className="text-[#F9FAFF]/80">Agendamentos recentes e a vencer</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingReservations ? (
                <p className="text-center text-[#F9FAFF]/70 py-4 text-sm">Carregando...</p>
              ) : !recentReservations || recentReservations.length === 0 ? (
                <p className="text-center text-[#F9FAFF]/70 py-8 text-sm">Nenhum agendamento próximo</p>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                  {recentReservations.map((reservation) => (
                    <div
                      key={reservation.id}
                      className="p-3 border border-[#F9FAFF]/20 rounded-lg bg-[#314755]/60 hover:bg-[#314755]/80 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-semibold text-sm text-[#F9FAFF]">{reservation.title}</h4>
                        {getStatusBadge(reservation.status)}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-[#F9FAFF]/80">
                          <Calendar className="w-3 h-3" />
                          <span>{format(new Date(reservation.date), "dd 'de' MMMM", { locale: ptBR })}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-[#F9FAFF]/80">
                          <Clock className="w-3 h-3" />
                          <span>{reservation.start_time.substring(0, 5)}</span>
                        </div>
                        {reservation.clients && (
                          <div className="flex items-center gap-2 text-xs text-[#F9FAFF]/80">
                            <User className="w-3 h-3" />
                            <span>{reservation.clients.name}</span>
                          </div>
                        )}
                        {reservation.location && (
                          <div className="flex items-center gap-2 text-xs text-[#F9FAFF]/80">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate">{reservation.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card de Clientes - 1 coluna abaixo */}
          <Card className="mt-4 bg-[#314755]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-[#F9FAFF]">
                    <Users className="w-5 h-5 text-[#F9FAFF]" />
                    Clientes
                  </CardTitle>
                  <CardDescription className="text-[#F9FAFF]/80">Lista completa de clientes cadastrados</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingClients ? (
                <p className="text-center text-[#F9FAFF]/70 py-4 text-sm">Carregando...</p>
              ) : !clients || clients.length === 0 ? (
                <p className="text-center text-[#F9FAFF]/70 py-8 text-sm">Nenhum cliente cadastrado</p>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                  {clients.map((client) => (
                    <div
                      key={client.id}
                      className="p-3 border border-[#F9FAFF]/20 rounded-lg bg-[#314755]/60 hover:bg-[#314755]/80 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-semibold text-sm text-[#F9FAFF]">{client.name}</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedClient(client)}
                          className="h-7 px-2 text-[#F9FAFF] hover:bg-[#F9FAFF]/20"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          Ver
                        </Button>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-[#F9FAFF]/80">
                          <User className="w-3 h-3" />
                          <span>{client.email}</span>
                        </div>
                        {client.phone && (
                          <div className="flex items-center gap-2 text-xs text-[#F9FAFF]/80">
                            <span className="w-3 h-3 inline-flex items-center justify-center">📞</span>
                            <span>{client.phone}</span>
                          </div>
                        )}
                        {client.document && (
                          <div className="flex items-center gap-2 text-xs text-[#F9FAFF]/80">
                            <span className="w-3 h-3 inline-flex items-center justify-center">📄</span>
                            <span>{client.document}</span>
                          </div>
                        )}
                        {client.address && (
                          <div className="flex items-center gap-2 text-xs text-[#F9FAFF]/80">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate">{client.address}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal de Detalhes do Cliente */}
      {selectedClient && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelectedClient(null)}
        >
          <div 
            className="bg-background rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-foreground">Detalhes do Cliente</h2>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setSelectedClient(null)}
                >
                  <span className="text-2xl">&times;</span>
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-semibold text-muted-foreground">Nome</Label>
                  <p className="text-lg">{selectedClient.name}</p>
                </div>

                <div>
                  <Label className="text-sm font-semibold text-muted-foreground">Email</Label>
                  <p className="text-lg">{selectedClient.email}</p>
                </div>

                {selectedClient.phone && (
                  <div>
                    <Label className="text-sm font-semibold text-muted-foreground">Telefone</Label>
                    <p className="text-lg">{selectedClient.phone}</p>
                  </div>
                )}

                {selectedClient.document && (
                  <div>
                    <Label className="text-sm font-semibold text-muted-foreground">Documento</Label>
                    <p className="text-lg">{selectedClient.document}</p>
                  </div>
                )}

                {selectedClient.address && (
                  <div>
                    <Label className="text-sm font-semibold text-muted-foreground">Endereço</Label>
                    <p className="text-lg">{selectedClient.address}</p>
                  </div>
                )}

                <div>
                  <Label className="text-sm font-semibold text-muted-foreground">Data de Cadastro</Label>
                  <p className="text-lg">
                    {format(new Date(selectedClient.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <Button onClick={() => setSelectedClient(null)}>
                  Fechar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
