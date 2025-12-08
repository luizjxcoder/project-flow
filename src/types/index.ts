export interface Client {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  document?: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  client_id?: string;
  title: string;
  description?: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  created_at: string;
  updated_at: string;
  valid_until?: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: 'income' | 'expense';
  category: string;
  description: string;
  amount: number;
  date: string;
  payment_method?: string;
  card_id?: string;
  status: 'pending' | 'completed' | 'cancelled';
  created_at: string;
}

export interface Card {
  id: string;
  user_id: string;
  name: string;
  last_digits: string;
  brand: 'visa' | 'mastercard' | 'elo' | 'amex' | 'other';
  card_limit: number;
  closing_day: number;
  due_day: number;
  created_at: string;
}

export interface Purchase {
  id: string;
  user_id: string;
  card_id?: string;
  description: string;
  amount: number;
  installments: number;
  current_installment: number;
  purchase_date: string;
  created_at: string;
}

export interface Installment {
  id: string;
  user_id: string;
  purchase_id?: string;
  description: string;
  total_amount: number;
  installments: number;
  installment_value: number;
  start_date: string;
  created_at: string;
}

export interface Investment {
  id: string;
  user_id: string;
  name: string;
  type: 'fixed_income' | 'stocks' | 'funds' | 'crypto' | 'other';
  initial_amount: number;
  current_amount: number;
  expected_return: number;
  start_date: string;
  created_at: string;
}

export interface Reservation {
  id: string;
  user_id: string;
  client_id?: string;
  title: string;
  description?: string;
  date: string;
  start_time: string;
  end_time?: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  location?: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  client_id?: string;
  name: string;
  description?: string;
  status: 'planning' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled';
  budget?: number;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  monthlyProfit: number;
  profitMargin: number;
  totalClients: number;
  activeBudgets: number;
  totalInvestments: number;
  activeReservations: number;
  totalProjects: number;
}
