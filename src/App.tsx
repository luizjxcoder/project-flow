import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import { Dashboard } from '@/pages/Dashboard';
import { Clients } from '@/pages/Clients';
import { Budgets } from '@/pages/Budgets';
import { Financial } from '@/pages/Financial';
import { Cards } from '@/pages/Cards';
import { Installments } from '@/pages/Installments';
import { Investments } from '@/pages/Investments';
import { Projects } from '@/pages/Projects';
import { Reservations } from '@/pages/Reservations';
import { AdminUsers } from '@/pages/AdminUsers';
import { Auth } from '@/pages/Auth';

const queryClient = new QueryClient({
     defaultOptions: {
          queries: {
               staleTime: 1000 * 60 * 5,
               refetchOnWindowFocus: false,
          },
     },
});

function AppContent() {
     const { user, loading } = useAuth();

     if (loading) {
          return (
               <div className="flex items-center justify-center min-h-screen">
                    <p className="text-muted-foreground">Carregando...</p>
               </div>
          );
     }

     if (!user) {
          return <Auth />;
     }

     return (
          <div className="flex flex-col min-h-screen bg-background">
               <Header />
               <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
                    <Routes>
                         <Route path="/" element={<Dashboard />} />
                         <Route path="/clients" element={<Clients />} />
                         <Route path="/budgets" element={<Budgets />} />
                         <Route path="/financial" element={<Financial />} />
                         <Route path="/cards" element={<Cards />} />
                         <Route path="/installments" element={<Installments />} />
                         <Route path="/investments" element={<Investments />} />
                         <Route path="/projects" element={<Projects />} />
                         <Route path="/reservations" element={<Reservations />} />
                         <Route path="/admin/users" element={<AdminUsers />} />
                         <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
               </main>
               <Toaster />
          </div>
     );
}

export default function App() {
     return (
          <QueryClientProvider client={queryClient}>
               <BrowserRouter>
                    <AppContent />
               </BrowserRouter>
          </QueryClientProvider>
     );
}
