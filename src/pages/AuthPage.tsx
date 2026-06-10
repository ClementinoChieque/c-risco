import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { LogIn, UserPlus, Mail, Eye, EyeOff } from 'lucide-react';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgot, setIsForgot] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      toast.error('Sem ligação à internet', {
        description: 'O login requer conexão. Tente novamente quando voltar à rede.',
      });
      return;
    }

    setLoading(true);

    try {
      if (isForgot) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success('Email de recuperação enviado! Verifique a sua caixa de entrada.');
        setIsForgot(false);
      } else if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success('Login realizado com sucesso!');
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast.success('Conta criada! Verifique o seu email para confirmar.');
      }
    } catch (err: any) {
      const msg = String(err?.message || '');
      const lower = msg.toLowerCase();
      if (lower.includes('failed to fetch') || lower.includes('networkerror') || lower.includes('network request failed')) {
        toast.error('Sem ligação ao servidor', {
          description: 'Verifique a sua conexão à internet e tente novamente.',
        });
      } else {
        toast.error(msg || 'Erro na autenticação');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md glass-card border-border/40">
        <CardHeader className="text-center space-y-4">
          <img src="/logoctrader.png" alt="Logo" className="h-12 mx-auto" />
          <CardTitle className="text-xl">
            {isForgot
              ? 'Recuperar palavra-passe'
              : isLogin
              ? 'Entrar na sua conta'
              : 'Criar nova conta'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && !isForgot && (
              <div className="space-y-2">
                <Label>Nome completo</Label>
                <Input
                  placeholder="Seu nome"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required={!isLogin}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="Trader@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            {!isForgot && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Palavra-passe</Label>
                  {isLogin && (
                    <button
                      type="button"
                      onClick={() => setIsForgot(true)}
                      className="text-xs text-muted-foreground hover:text-primary transition-colors"
                    >
                      Esqueci-me
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPassword ? 'Ocultar palavra-passe' : 'Mostrar palavra-passe'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                'A processar...'
              ) : isForgot ? (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Enviar email de recuperação
                </>
              ) : isLogin ? (
                <>
                  <LogIn className="h-4 w-4 mr-2" />
                  Entrar
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Criar conta
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            {isForgot ? (
              <button
                type="button"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
                onClick={() => setIsForgot(false)}
              >
                Voltar ao login
              </button>
            ) : (
              <button
                type="button"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
                onClick={() => setIsLogin(!isLogin)}
              >
                {isLogin ? 'Não tem conta? Criar agora' : 'Já tem conta? Entrar'}
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

