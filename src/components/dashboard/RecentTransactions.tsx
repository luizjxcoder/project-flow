import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Transaction } from '@/types';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export function RecentTransactions() {
  const { data: transactions, isLoading } = useQuery({
    queryKey: ['recent-transactions'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data as Transaction[];
    },
  });

  if (isLoading) {
    return (
      <Card className="bg-[#1B1C20]">
        <CardHeader>
          <CardTitle className="text-[#F9FAFF]">Transações Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-[#F9FAFF]/70 text-sm">Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-[#1B1C20]">
      <CardHeader>
        <CardTitle className="text-[#F9FAFF]">Transações Recentes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions && transactions.length > 0 ? (
            transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 border border-[#F9FAFF]/20 rounded-lg bg-[#1B1C20]/60 hover:bg-[#1B1C20]/80 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    transaction.type === 'income' ? 'bg-[#F9FAFF]/20' : 'bg-[#F9FAFF]/10'
                  }`}>
                    {transaction.type === 'income' ? (
                      <ArrowUpRight className="w-4 h-4 text-[#86BCBE]" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4 text-[#D97D54]" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm text-[#F9FAFF]">{transaction.description}</p>
                    <p className="text-xs text-[#F9FAFF]/70">{transaction.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${
                    transaction.type === 'income' ? 'text-[#86BCBE]' : 'text-[#D97D54]'
                  }`}>
                    {transaction.type === 'income' ? '+' : '-'} R$ {transaction.amount.toFixed(2)}
                  </p>
                  <Badge variant={transaction.status === 'completed' ? 'default' : 'secondary'} className="mt-1">
                    {transaction.status === 'completed' ? 'Concluído' : 
                     transaction.status === 'pending' ? 'Pendente' : 'Cancelado'}
                  </Badge>
                </div>
              </div>
            ))
          ) : (
            <p className="text-[#F9FAFF]/70 text-sm text-center py-8">
              Nenhuma transação encontrada
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
