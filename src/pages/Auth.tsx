import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

export function Auth() {
  const { signInWithOtp, verifyOtpAndSetPassword, signInWithPassword } = useAuth();
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [email, setEmail] = useState('');

  const handleSendOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const emailValue = formData.get('email') as string;

    try {
      await signInWithOtp(emailValue);
      setEmail(emailValue);
      setIsOtpSent(true);
      toast.success('Código OTP enviado para seu email!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao enviar código OTP');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const token = formData.get('token') as string;
    const password = formData.get('password') as string;

    try {
      await verifyOtpAndSetPassword(email, token, password);
      toast.success('Cadastro realizado com sucesso!');
    } catch (error) {
      console.error(error);
      toast.error('Código OTP inválido ou senha inválida');
    }
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const emailValue = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      await signInWithPassword(emailValue, password);
      toast.success('Login realizado com sucesso!');
    } catch (error) {
      console.error(error);
      toast.error('Email ou senha incorretos');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFBFF] p-4">
      <Card className="w-full max-w-md shadow-xl border-[#314755]/20">
        <CardHeader className="bg-[#314755] text-[#FAFBFF] rounded-t-lg">
          <CardTitle className="text-3xl font-bold text-center">FinanceFlow</CardTitle>
          <CardDescription className="text-center text-[#FAFBFF]/80">Sistema de Gestão Financeira</CardDescription>
        </CardHeader>
        <CardContent className="mt-6">
          <Tabs defaultValue="register">
            <TabsList className="grid w-full grid-cols-2 bg-[#86BCBE]/20">
              <TabsTrigger value="register" className="data-[state=active]:bg-[#86BCBE] data-[state=active]:text-[#FAFBFF]">Cadastro</TabsTrigger>
              <TabsTrigger value="login" className="data-[state=active]:bg-[#86BCBE] data-[state=active]:text-[#FAFBFF]">Login</TabsTrigger>
            </TabsList>

            <TabsContent value="register">
              {!isOtpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <Label htmlFor="register-email" className="text-[#314755]">Email</Label>
                    <Input
                      id="register-email"
                      name="email"
                      type="email"
                      required
                      placeholder="seu@email.com"
                      className="border-[#314755]/20 focus:border-[#86BCBE] focus:ring-[#86BCBE]"
                    />
                  </div>
                  <Button type="submit" className="w-full bg-[#D97D54] hover:bg-[#D97D54]/90 text-[#FAFBFF]">
                    Enviar Código OTP
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div>
                    <Label htmlFor="token" className="text-[#314755]">Código OTP</Label>
                    <Input
                      id="token"
                      name="token"
                      required
                      placeholder="Digite o código recebido"
                      className="border-[#314755]/20 focus:border-[#86BCBE] focus:ring-[#86BCBE]"
                    />
                  </div>
                  <div>
                    <Label htmlFor="register-password" className="text-[#314755]">Criar Senha</Label>
                    <Input
                      id="register-password"
                      name="password"
                      type="password"
                      required
                      placeholder="Mínimo 6 caracteres"
                      minLength={6}
                      className="border-[#314755]/20 focus:border-[#86BCBE] focus:ring-[#86BCBE]"
                    />
                  </div>
                  <Button type="submit" className="w-full bg-[#86BCBE] hover:bg-[#86BCBE]/90 text-[#FAFBFF]">
                    Confirmar e Cadastrar
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-[#314755]/20 text-[#314755] hover:bg-[#314755]/10"
                    onClick={() => setIsOtpSent(false)}
                  >
                    Voltar
                  </Button>
                </form>
              )}
            </TabsContent>

            <TabsContent value="login">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <Label htmlFor="login-email" className="text-[#314755]">Email</Label>
                  <Input
                    id="login-email"
                    name="email"
                    type="email"
                    required
                    placeholder="seu@email.com"
                    className="border-[#314755]/20 focus:border-[#86BCBE] focus:ring-[#86BCBE]"
                  />
                </div>
                <div>
                  <Label htmlFor="login-password" className="text-[#314755]">Senha</Label>
                  <Input
                    id="login-password"
                    name="password"
                    type="password"
                    required
                    placeholder="Digite sua senha"
                    className="border-[#314755]/20 focus:border-[#86BCBE] focus:ring-[#86BCBE]"
                  />
                </div>
                <Button type="submit" className="w-full bg-[#D97D54] hover:bg-[#D97D54]/90 text-[#FAFBFF]">
                  Entrar
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
