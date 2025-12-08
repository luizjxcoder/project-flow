import { useState } from 'react';
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
  Calendar,
  LogOut,
  User,
  Menu,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/clients', icon: Users, label: 'Clientes' },
  { to: '/budgets', icon: FileText, label: 'Orçamentos' },
  { to: '/projects', icon: FolderKanban, label: 'Projetos' },
  { to: '/reservations', icon: Calendar, label: 'Agenda' },
  { to: '/financial', icon: Wallet, label: 'Financeiro' },
  { to: '/cards', icon: CreditCard, label: 'Cartões' },
  { to: '/installments', icon: ArrowLeftRight, label: 'Parcelamentos' },
  { to: '/investments', icon: TrendingUp, label: 'Investimentos' },
];

export function Header() {
  const { user, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
    <>
      <header className="sticky top-0 z-40 bg-[#314755] border-b border-[#FAFBFF]/20 px-4 md:px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-8">
            {/* Menu Hambúrguer - Mobile */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-[#FAFBFF] hover:bg-[#FAFBFF]/10"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>

            <div>
              <h1 className="text-lg md:text-2xl font-bold text-[#FAFBFF]">FinanceFlow</h1>
              <p className="text-xs text-[#FAFBFF]/80 mt-0.5 hidden sm:block">Sistema de Gestão</p>
            </div>

            {/* Menu Desktop */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  title={item.label}
                  className={({ isActive }) =>
                    `flex flex-col 2xl:flex-row items-center gap-1 2xl:gap-2 px-2 2xl:px-4 py-2 rounded-lg transition-all text-xs 2xl:text-sm font-medium ${
                      isActive
                        ? 'bg-[#D97D54] text-[#FAFBFF] shadow-md'
                        : 'text-[#FAFBFF] hover:bg-[#FAFBFF]/10'
                    }`
                  }
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="lg:inline 2xl:inline">{item.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-[#FAFBFF] hover:bg-[#FAFBFF]/10">
                  <User className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="text-muted-foreground text-xs">
                  {user?.email}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="gap-2 bg-[#D97D54] text-[#FAFBFF] hover:bg-[#D97D54]/90"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Menu Mobile - Slide-in */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <nav 
            className="absolute top-[73px] left-0 w-64 h-[calc(100vh-73px)] bg-[#314755] border-r border-[#FAFBFF]/20 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col p-4 space-y-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium ${
                      isActive
                        ? 'bg-[#D97D54] text-[#FAFBFF] shadow-md'
                        : 'text-[#FAFBFF] hover:bg-[#FAFBFF]/10'
                    }`
                  }
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
