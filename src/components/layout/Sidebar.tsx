import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Wallet, 
  CreditCard, 
  TrendingUp,
  ArrowLeftRight,
  FolderKanban,
  LogOut,
  Shield
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/clients', icon: Users, label: 'Clientes' },
  { to: '/budgets', icon: FileText, label: 'Orçamentos' },
  { to: '/projects', icon: FolderKanban, label: 'Projetos' },
  { to: '/financial', icon: Wallet, label: 'Financeiro' },
  { to: '/cards', icon: CreditCard, label: 'Cartões' },
  { to: '/installments', icon: ArrowLeftRight, label: 'Parcelamentos' },
  { to: '/investments', icon: TrendingUp, label: 'Investimentos' },
];

export function Sidebar() {
  const { signOut } = useAuth();

  // Check if current user is admin
  const { data: isAdmin } = useQuery({
    queryKey: ['is-admin'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .from('admin_users')
        .select('id')
        .eq('id', user.id)
        .single();

      if (error) return false;
      return !!data;
    },
  });

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Logout realizado com sucesso!');
    } catch (error) {
      toast.error('Erro ao fazer logout');
      console.error(error);
    }
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-card border-r border-border flex flex-col">
      <div className="p-6 border-b border-border">
        <h1 className="text-2xl font-bold text-primary">FinanceFlow</h1>
        <p className="text-xs text-muted-foreground mt-1">Sistema de Gestão</p>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-foreground hover:bg-muted'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
        
        {/* Admin Section */}
        {isAdmin && (
          <div className="pt-4 mt-4 border-t border-border">
            <p className="px-4 text-xs font-semibold text-muted-foreground mb-2">ADMINISTRAÇÃO</p>
            <NavLink
              to="/admin/users"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'text-foreground hover:bg-muted'
                }`
              }
            >
              <Shield className="w-5 h-5" />
              <span className="font-medium">Gerenciar Usuários</span>
            </NavLink>
          </div>
        )}
      </nav>

      <div className="p-4 border-t border-border">
        <Button
          variant="outline"
          className="w-full justify-start gap-3"
          onClick={handleSignOut}
        >
          <LogOut className="w-5 h-5" />
          Sair
        </Button>
      </div>
    </aside>
  );
}
