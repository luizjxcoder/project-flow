import { supabase } from './supabase';
import { Reservation } from '@/types';

export interface CreateReservationData {
  title: string;
  description?: string;
  date: string;
  start_time: string;
  end_time?: string;
  client_id?: string;
  status: string;
  location?: string;
}

export interface UpdateReservationData extends CreateReservationData {
  id: string;
}

/**
 * Busca todas as reservas do usuário autenticado
 */
export async function fetchReservations() {
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
}

/**
 * Busca uma reserva específica por ID
 */
export async function fetchReservationById(id: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('reservations')
    .select('*, clients(name)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error) throw error;
  return data as Reservation & { clients?: { name: string } };
}

/**
 * Busca reservas de uma data específica
 */
export async function fetchReservationsByDate(date: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('reservations')
    .select('*, clients(name)')
    .eq('user_id', user.id)
    .eq('date', date)
    .order('start_time', { ascending: true });

  if (error) throw error;
  return data as (Reservation & { clients?: { name: string } })[];
}

/**
 * Busca reservas de um cliente específico
 */
export async function fetchReservationsByClient(clientId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('reservations')
    .select('*, clients(name)')
    .eq('user_id', user.id)
    .eq('client_id', clientId)
    .order('date', { ascending: true })
    .order('start_time', { ascending: true });

  if (error) throw error;
  return data as (Reservation & { clients?: { name: string } })[];
}

/**
 * Busca reservas por status
 */
export async function fetchReservationsByStatus(status: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('reservations')
    .select('*, clients(name)')
    .eq('user_id', user.id)
    .eq('status', status)
    .order('date', { ascending: true })
    .order('start_time', { ascending: true });

  if (error) throw error;
  return data as (Reservation & { clients?: { name: string } })[];
}

/**
 * Cria uma nova reserva
 */
export async function createReservation(reservationData: CreateReservationData) {
  try {
    console.log('>>> SERVICE: createReservation iniciado');
    console.log('>>> SERVICE: Dados recebidos:', reservationData);
    
    const { data: { user } } = await supabase.auth.getUser();
    console.log('>>> SERVICE: Usuário autenticado:', user?.id);
    
    if (!user) throw new Error('Not authenticated');

    const newReservation: any = {
      user_id: user.id,
      title: reservationData.title,
      date: reservationData.date,
      start_time: reservationData.start_time,
      status: reservationData.status || 'scheduled',
    };

    if (reservationData.description) {
      newReservation.description = reservationData.description;
    }

    if (reservationData.client_id) {
      newReservation.client_id = reservationData.client_id;
    }

    if (reservationData.end_time) {
      newReservation.end_time = reservationData.end_time;
    }

    if (reservationData.location) {
      newReservation.location = reservationData.location;
    }

    console.log('>>> SERVICE: Objeto a ser inserido:', newReservation);

    const { data, error } = await supabase
      .from('reservations')
      .insert([newReservation])
      .select('*, clients(name)')
      .single();

    if (error) {
      console.error('>>> SERVICE: Erro do Supabase:', error);
      throw error;
    }
    
    console.log('>>> SERVICE: Inserção bem-sucedida:', data);
    return data as Reservation & { clients?: { name: string } };
  } catch (error) {
    console.error('>>> SERVICE: Erro capturado em createReservation:', error);
    throw error;
  }
}

/**
 * Atualiza uma reserva existente
 */
export async function updateReservation(reservationData: UpdateReservationData) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const updatedReservation: any = {
    title: reservationData.title,
    date: reservationData.date,
    start_time: reservationData.start_time,
    status: reservationData.status,
    updated_at: new Date().toISOString(),
  };

  if (reservationData.description !== undefined) {
    updatedReservation.description = reservationData.description || null;
  }

  if (reservationData.client_id !== undefined) {
    updatedReservation.client_id = reservationData.client_id || null;
  }

  if (reservationData.end_time !== undefined) {
    updatedReservation.end_time = reservationData.end_time || null;
  }

  if (reservationData.location !== undefined) {
    updatedReservation.location = reservationData.location || null;
  }

  const { data, error } = await supabase
    .from('reservations')
    .update(updatedReservation)
    .eq('id', reservationData.id)
    .eq('user_id', user.id)
    .select('*, clients(name)')
    .single();

  if (error) throw error;
  return data as Reservation & { clients?: { name: string } };
}

/**
 * Atualiza apenas o status de uma reserva
 */
export async function updateReservationStatus(id: string, status: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('reservations')
    .update({ 
      status,
      updated_at: new Date().toISOString() 
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select('*, clients(name)')
    .single();

  if (error) throw error;
  return data as Reservation & { clients?: { name: string } };
}

/**
 * Exclui uma reserva
 */
export async function deleteReservation(id: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('reservations')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw error;
  return true;
}

/**
 * Cancela uma reserva (atualiza status para 'cancelled')
 */
export async function cancelReservation(id: string) {
  return updateReservationStatus(id, 'cancelled');
}

/**
 * Confirma uma reserva (atualiza status para 'confirmed')
 */
export async function confirmReservation(id: string) {
  return updateReservationStatus(id, 'confirmed');
}

/**
 * Completa uma reserva (atualiza status para 'completed')
 */
export async function completeReservation(id: string) {
  return updateReservationStatus(id, 'completed');
}

/**
 * Busca reservas próximas (dos próximos 7 dias)
 */
export async function fetchUpcomingReservations() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const { data, error } = await supabase
    .from('reservations')
    .select('*, clients(name)')
    .eq('user_id', user.id)
    .gte('date', today.toISOString().split('T')[0])
    .lte('date', nextWeek.toISOString().split('T')[0])
    .neq('status', 'cancelled')
    .order('date', { ascending: true })
    .order('start_time', { ascending: true });

  if (error) throw error;
  return data as (Reservation & { clients?: { name: string } })[];
}

/**
 * Busca reservas de hoje
 */
export async function fetchTodayReservations() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('reservations')
    .select('*, clients(name)')
    .eq('user_id', user.id)
    .eq('date', today)
    .order('start_time', { ascending: true });

  if (error) throw error;
  return data as (Reservation & { clients?: { name: string } })[];
}

/**
 * Conta total de reservas por status
 */
export async function countReservationsByStatus() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('reservations')
    .select('status')
    .eq('user_id', user.id);

  if (error) throw error;

  const counts = {
    scheduled: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
  };

  data.forEach((reservation) => {
    if (reservation.status in counts) {
      counts[reservation.status as keyof typeof counts]++;
    }
  });

  return counts;
}
