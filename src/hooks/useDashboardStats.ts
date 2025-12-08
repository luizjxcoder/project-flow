import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { DashboardStats } from '@/types';

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get transactions
      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id);

      // Get clients
      const { data: clients } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id);

      // Get budgets
      const { data: budgets } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id);

      // Get investments
      const { data: investments } = await supabase
        .from('investments')
        .select('*')
        .eq('user_id', user.id);

      // Get reservations
      const { data: reservations } = await supabase
        .from('reservations')
        .select('*')
        .eq('user_id', user.id);

      // Get projects
      const { data: projects } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id);

      const totalIncome = transactions
        ?.filter(t => t.type === 'income' && t.status === 'completed')
        .reduce((sum, t) => sum + t.amount, 0) || 0;

      const totalExpenses = transactions
        ?.filter(t => t.type === 'expense' && t.status === 'completed')
        .reduce((sum, t) => sum + t.amount, 0) || 0;

      const balance = totalIncome - totalExpenses;
      const monthlyProfit = balance;
      const profitMargin = totalIncome > 0 ? (monthlyProfit / totalIncome) * 100 : 0;

      const totalInvestments = investments?.reduce((sum, inv) => sum + inv.current_amount, 0) || 0;

      const activeReservations = reservations?.filter(
        r => r.status === 'scheduled' || r.status === 'confirmed'
      ).length || 0;

      const totalProjects = projects?.length || 0;

      return {
        totalIncome,
        totalExpenses,
        balance,
        monthlyProfit,
        profitMargin,
        totalClients: clients?.length || 0,
        activeBudgets: budgets?.filter(b => b.status === 'pending' || b.status === 'approved').length || 0,
        totalInvestments,
        activeReservations,
        totalProjects,
      };
    },
  });
}
