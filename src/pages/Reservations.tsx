import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Reservation, Client } from '@/types';
import { Button } from '@/components/ui/button';
import { Plus, Clock, MapPin, User, Trash2, Edit, X, Loader2, ChevronLeft, ChevronRight, Grid3x3, List, Calendar as CalendarIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface ReservationFormData {
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  location: string;
  status: string;
  client_id: string;
}

export function Reservations() {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(new Date().getDate());
  const [showModal, setShowModal] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  const [formData, setFormData] = useState<ReservationFormData>({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    location: '',
    status: 'scheduled',
    client_id: '',
  });
  const queryClient = useQueryClient();

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Query para buscar reservas
  const { data: reservations, isLoading } = useQuery({
    queryKey: ['reservations'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('reservations')
        .select('*, clients(name)')
        .eq('user_id', user.id)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;
      return data as (Reservation & { clients?: { name: string } })[];
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

  // Mutation para criar reserva
  const createMutation = useMutation({
    mutationFn: async (reservationData: ReservationFormData & { date: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const newReservation: any = {
        user_id: user.id,
        title: reservationData.title.trim(),
        date: reservationData.date,
        start_time: reservationData.start_time,
        status: reservationData.status,
      };

      if (reservationData.description?.trim()) {
        newReservation.description = reservationData.description.trim();
      }

      if (reservationData.client_id) {
        newReservation.client_id = reservationData.client_id;
      }

      if (reservationData.end_time) {
        newReservation.end_time = reservationData.end_time;
      }

      if (reservationData.location?.trim()) {
        newReservation.location = reservationData.location.trim();
      }

      const { data, error } = await supabase
        .from('reservations')
        .insert([newReservation])
        .select('*, clients(name)')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      toast.success('Agendamento criado com sucesso!');
      handleCloseModal();
    },
    onError: (error: any) => {
      console.error('Erro ao criar agendamento:', error);
      toast.error(error?.message || 'Erro ao criar agendamento');
    },
  });

  // Mutation para atualizar reserva
  const updateMutation = useMutation({
    mutationFn: async ({ id, reservationData }: { id: string; reservationData: ReservationFormData & { date: string } }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const updatedReservation: any = {
        title: reservationData.title.trim(),
        date: reservationData.date,
        start_time: reservationData.start_time,
        status: reservationData.status,
        updated_at: new Date().toISOString(),
      };

      if (reservationData.description?.trim()) {
        updatedReservation.description = reservationData.description.trim();
      } else {
        updatedReservation.description = null;
      }

      if (reservationData.client_id) {
        updatedReservation.client_id = reservationData.client_id;
      } else {
        updatedReservation.client_id = null;
      }

      if (reservationData.end_time) {
        updatedReservation.end_time = reservationData.end_time;
      } else {
        updatedReservation.end_time = null;
      }

      if (reservationData.location?.trim()) {
        updatedReservation.location = reservationData.location.trim();
      } else {
        updatedReservation.location = null;
      }

      const { data, error } = await supabase
        .from('reservations')
        .update(updatedReservation)
        .eq('id', id)
        .eq('user_id', user.id)
        .select('*, clients(name)')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      toast.success('Agendamento atualizado com sucesso!');
      handleCloseModal();
    },
    onError: (error: any) => {
      console.error('Erro ao atualizar agendamento:', error);
      toast.error(error?.message || 'Erro ao atualizar agendamento');
    },
  });

  // Mutation para deletar reserva
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('reservations')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      toast.success('Agendamento excluído com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao excluir agendamento:', error);
      toast.error(error?.message || 'Erro ao excluir agendamento');
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      start_time: '',
      end_time: '',
      location: '',
      status: 'scheduled',
      client_id: '',
    });
    setEditingReservation(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setTimeout(() => {
      resetForm();
    }, 300);
  };

  const handleOpenNewReservation = () => {
    resetForm();
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Por favor, preencha o título do agendamento');
      return;
    }

    if (!formData.start_time) {
      toast.error('Por favor, preencha o horário de início');
      return;
    }

    if (selectedDay === null) {
      toast.error('Por favor, selecione uma data');
      return;
    }

    const year = currentYear;
    const month = String(currentMonth + 1).padStart(2, '0');
    const day = String(selectedDay).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;

    const reservationData = {
      ...formData,
      date: formattedDate,
    };

    if (editingReservation) {
      updateMutation.mutate({ id: editingReservation.id, reservationData });
    } else {
      createMutation.mutate(reservationData);
    }
  };

  const handleEdit = (reservation: Reservation & { clients?: { name: string } }) => {
    setEditingReservation(reservation);
    const reservationDate = new Date(reservation.date);
    setCurrentDate(reservationDate);
    setSelectedDay(reservationDate.getDate());
    setFormData({
      title: reservation.title,
      description: reservation.description || '',
      start_time: reservation.start_time,
      end_time: reservation.end_time || '',
      location: reservation.location || '',
      status: reservation.status,
      client_id: reservation.client_id || '',
    });
    setShowModal(true);
  };

  const handleDelete = (reservation: Reservation) => {
    if (window.confirm('Tem certeza que deseja excluir este agendamento?')) {
      deleteMutation.mutate(reservation.id);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      scheduled: 'bg-[#86BCBE] text-[#FAFBFF]',
      confirmed: 'bg-[#314755] text-[#FAFBFF]',
      completed: 'bg-[#314755]/50 text-[#FAFBFF]',
      cancelled: 'bg-[#D97D54] text-[#FAFBFF]',
    };

    const labels: Record<string, string> = {
      scheduled: 'Agendado',
      confirmed: 'Confirmado',
      completed: 'Concluído',
      cancelled: 'Cancelado',
    };

    return <Badge className={variants[status] || 'bg-[#314755] text-[#FAFBFF]'}>{labels[status] || status}</Badge>;
  };

  // Funções para navegação do calendário
  const previousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
    setSelectedDay(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
    setSelectedDay(null);
  };

  const selectMonth = (month: number) => {
    setCurrentDate(new Date(currentYear, month, 1));
    setSelectedDay(null);
  };

  const selectYear = (year: number) => {
    setCurrentDate(new Date(year, currentMonth, 1));
    setSelectedDay(null);
  };

  // Gerar dias do calendário
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth);
  const daysInPreviousMonth = getDaysInMonth(currentYear, currentMonth - 1);

  // Criar array de dias
  const calendarDays: Array<{ day: number; isCurrentMonth: boolean; date: Date }> = [];

  // Dias do mês anterior
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    calendarDays.push({
      day: daysInPreviousMonth - i,
      isCurrentMonth: false,
      date: new Date(currentYear, currentMonth - 1, daysInPreviousMonth - i)
    });
  }

  // Dias do mês atual
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push({
      day: i,
      isCurrentMonth: true,
      date: new Date(currentYear, currentMonth, i)
    });
  }

  // Dias do próximo mês (completar a grade)
  const remainingDays = 42 - calendarDays.length; // 6 semanas * 7 dias
  for (let i = 1; i <= remainingDays; i++) {
    calendarDays.push({
      day: i,
      isCurrentMonth: false,
      date: new Date(currentYear, currentMonth + 1, i)
    });
  }

  // Obter reservas do mês atual
  const monthReservations = reservations?.filter((r) => {
    const reservationDate = new Date(r.date);
    return reservationDate.getMonth() === currentMonth && 
           reservationDate.getFullYear() === currentYear;
  }) || [];

  // Obter reservas do dia selecionado
  const selectedDayReservations = selectedDay !== null ? reservations?.filter((r) => {
    const reservationDate = new Date(r.date);
    return reservationDate.getDate() === selectedDay &&
           reservationDate.getMonth() === currentMonth &&
           reservationDate.getFullYear() === currentYear;
  }) || [] : [];

  // Verificar se um dia tem reservas
  const dayHasReservations = (day: number) => {
    return reservations?.some((r) => {
      const reservationDate = new Date(r.date);
      return reservationDate.getDate() === day &&
             reservationDate.getMonth() === currentMonth &&
             reservationDate.getFullYear() === currentYear;
    });
  };

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-4 md:space-y-6 bg-[#FAFBFF] min-h-screen p-3 sm:p-4 md:p-6">
      {/* Layout em Duas Colunas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Coluna Esquerda - Calendário */}
        <div className="bg-white rounded-lg shadow-sm border border-[#314755]/20 p-4 md:p-6">
          {/* Header do Calendário */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={previousMonth}
                className="text-[#314755] hover:bg-[#314755]/10"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <h2 className="text-2xl font-bold text-[#314755]">
                {monthNames[currentMonth]} {currentYear}
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={nextMonth}
                className="text-[#314755] hover:bg-[#314755]/10"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Seletores de Mês e Ano */}
          <div className="flex items-center gap-2 mb-6">
            <select
              value={currentMonth}
              onChange={(e) => selectMonth(parseInt(e.target.value))}
              className="flex-1 text-sm border border-[#314755]/20 rounded-md px-3 py-1.5 text-[#314755] bg-white focus:outline-none focus:ring-2 focus:ring-[#86BCBE]"
            >
              {monthNames.map((name, index) => (
                <option key={index} value={index}>
                  {name}
                </option>
              ))}
            </select>
            <select
              value={currentYear}
              onChange={(e) => selectYear(parseInt(e.target.value))}
              className="text-sm border border-[#314755]/20 rounded-md px-3 py-1.5 text-[#314755] bg-white focus:outline-none focus:ring-2 focus:ring-[#86BCBE]"
            >
              {Array.from({ length: 10 }, (_, i) => currentYear - 5 + i).map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {/* Grade do Calendário */}
          <div className="grid grid-cols-7 gap-2">
            {/* Cabeçalho dos dias da semana */}
            {weekDays.map((day) => (
              <div key={day} className="text-center text-sm font-semibold text-[#314755]/70 py-2">
                {day}
              </div>
            ))}

            {/* Dias do calendário */}
            {calendarDays.map((dayObj, index) => {
              const isSelected = selectedDay === dayObj.day && dayObj.isCurrentMonth;
              const hasReservations = dayObj.isCurrentMonth && dayHasReservations(dayObj.day);
              const isToday = dayObj.isCurrentMonth && 
                             dayObj.day === new Date().getDate() && 
                             currentMonth === new Date().getMonth() && 
                             currentYear === new Date().getFullYear();

              return (
                <button
                  key={index}
                  onClick={() => dayObj.isCurrentMonth && setSelectedDay(dayObj.day)}
                  className={`
                    aspect-square min-h-[50px] rounded-lg flex flex-col items-center justify-center text-sm
                    transition-all
                    ${!dayObj.isCurrentMonth ? 'text-[#314755]/30 cursor-default' : 'text-[#314755] hover:bg-[#86BCBE]/10 cursor-pointer'}
                    ${isSelected ? 'bg-[#86BCBE] text-white hover:bg-[#86BCBE]/90' : ''}
                    ${isToday && !isSelected ? 'border-2 border-[#86BCBE]' : 'border border-[#314755]/10'}
                    ${hasReservations && !isSelected ? 'font-bold' : ''}
                  `}
                >
                  <span>{dayObj.day}</span>
                  {hasReservations && !isSelected && (
                    <div className="w-1 h-1 bg-[#86BCBE] rounded-full mt-1"></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Coluna Direita - Lista de Eventos */}
        <div className="bg-white rounded-lg shadow-sm border border-[#314755]/20 p-4 md:p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-[#314755]">
                Eventos de {monthNames[currentMonth]} {currentYear}
              </h3>
              <p className="text-sm text-[#314755]/70 mt-1">
                {monthReservations.length} {monthReservations.length === 1 ? 'evento' : 'eventos'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={handleOpenNewReservation}
                className="bg-[#D97D54] hover:bg-[#D97D54]/90 text-[#FAFBFF]"
              >
                <Plus className="w-4 h-4 mr-2" />
                Novo
              </Button>
              <div className="flex items-center gap-1 border border-[#314755]/20 rounded-md p-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('grid')}
                  className={viewMode === 'grid' ? 'bg-[#86BCBE] hover:bg-[#86BCBE]/90' : ''}
                >
                  <Grid3x3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('list')}
                  className={viewMode === 'list' ? 'bg-[#86BCBE] hover:bg-[#86BCBE]/90' : ''}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Filtros de Eventos (visual apenas) */}
          <div className="flex flex-wrap items-center gap-2 mb-6 pb-4 border-b border-[#314755]/10">
            <select className="text-sm border border-[#314755]/20 rounded-md px-3 py-1.5 text-[#314755] bg-white focus:outline-none focus:ring-2 focus:ring-[#86BCBE]">
              <option>Todas Prioridades</option>
            </select>
            <select className="text-sm border border-[#314755]/20 rounded-md px-3 py-1.5 text-[#314755] bg-white focus:outline-none focus:ring-2 focus:ring-[#86BCBE]">
              <option>Todos os Tipos</option>
            </select>
            <Button variant="outline" size="sm" className="border-[#314755]/20 text-[#314755]">
              <CalendarIcon className="w-4 h-4 mr-2" />
              Data
            </Button>
          </div>

          {/* Conteúdo dos Eventos */}
          <div className="max-h-[600px] overflow-y-auto pr-2">
            {isLoading ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-[#86BCBE] mx-auto mb-4" />
                <p className="text-[#314755]/70">Carregando eventos...</p>
              </div>
            ) : monthReservations.length === 0 ? (
              <div className="text-center py-12">
                <CalendarIcon className="w-16 h-16 text-[#314755]/30 mx-auto mb-4" />
                <p className="text-lg font-semibold text-[#314755] mb-2">Nenhum evento encontrado</p>
                <p className="text-sm text-[#314755]/70 mb-4">
                  Clique em um dia do calendário para criar um novo evento.
                </p>
              </div>
            ) : (
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 gap-4' : 'space-y-3'}>
                {(selectedDay !== null ? selectedDayReservations : monthReservations).map((reservation) => {
                  const reservationDate = new Date(reservation.date);
                  const formattedDate = `${reservationDate.getDate().toString().padStart(2, '0')}/${(reservationDate.getMonth() + 1).toString().padStart(2, '0')}/${reservationDate.getFullYear()}`;

                  return (
                    <div
                      key={reservation.id}
                      className="p-4 border border-[#314755]/20 rounded-lg hover:bg-[#86BCBE]/5 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-[#314755]">{reservation.title}</h4>
                            {getStatusBadge(reservation.status)}
                          </div>
                          {reservation.description && (
                            <p className="text-sm text-[#314755]/70 mb-2 line-clamp-2">{reservation.description}</p>
                          )}
                        </div>
                        <div className="flex gap-1 ml-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(reservation)}
                            className="h-8 w-8 hover:bg-[#86BCBE]/20 text-[#86BCBE]"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(reservation)}
                            className="h-8 w-8 hover:bg-[#D97D54]/20 text-[#D97D54]"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2 text-[#314755]/70">
                          <CalendarIcon className="w-4 h-4" />
                          <span>{formattedDate}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[#314755]/70">
                          <Clock className="w-4 h-4" />
                          <span>
                            {reservation.start_time.substring(0, 5)}
                            {reservation.end_time && ` - ${reservation.end_time.substring(0, 5)}`}
                          </span>
                        </div>
                        {reservation.clients && (
                          <div className="flex items-center gap-2 text-[#314755]/70">
                            <User className="w-4 h-4" />
                            <span className="truncate">{reservation.clients.name}</span>
                          </div>
                        )}
                        {reservation.location && (
                          <div className="flex items-center gap-2 text-[#314755]/70">
                            <MapPin className="w-4 h-4" />
                            <span className="truncate">{reservation.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

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
                  {editingReservation ? 'Editar Agendamento' : 'Novo Agendamento'}
                  {selectedDay && ` - ${selectedDay}/${(currentMonth + 1).toString().padStart(2, '0')}/${currentYear}`}
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
                  <Label htmlFor="title" className="text-[#314755]">Título *</Label>
                  <Input 
                    id="title" 
                    required 
                    placeholder="Ex: Reunião com cliente"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    disabled={isPending}
                    className="border-[#314755]/20 focus:border-[#86BCBE] focus:ring-[#86BCBE]"
                  />
                </div>

                <div>
                  <Label htmlFor="description" className="text-[#314755]">Descrição</Label>
                  <Textarea 
                    id="description" 
                    rows={3}
                    placeholder="Detalhes do agendamento..."
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
                      <option value="scheduled">Agendado</option>
                      <option value="confirmed">Confirmado</option>
                      <option value="completed">Concluído</option>
                      <option value="cancelled">Cancelado</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_time" className="text-[#314755]">Horário de Início *</Label>
                    <Input 
                      id="start_time" 
                      type="time" 
                      required
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                      disabled={isPending}
                      className="border-[#314755]/20 focus:border-[#86BCBE] focus:ring-[#86BCBE]"
                    />
                  </div>

                  <div>
                    <Label htmlFor="end_time" className="text-[#314755]">Horário de Término</Label>
                    <Input 
                      id="end_time" 
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                      disabled={isPending}
                      className="border-[#314755]/20 focus:border-[#86BCBE] focus:ring-[#86BCBE]"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="location" className="text-[#314755]">Local</Label>
                  <Input 
                    id="location" 
                    placeholder="Ex: Escritório, Online, etc."
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    disabled={isPending}
                    className="border-[#314755]/20 focus:border-[#86BCBE] focus:ring-[#86BCBE]"
                  />
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
                      editingReservation ? 'Atualizar' : 'Criar'
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
