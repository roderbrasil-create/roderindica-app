import React, { useState, useEffect } from 'react';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail 
} from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc, collection, query, where, getDocs, deleteDoc, writeBatch } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

import { Package, ClipboardEdit, Loader2, Mail, Eye, EyeOff, ArrowLeft } from 'lucide-react';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  useEffect(() => {
    if (user || profile) {
      navigate('/', { replace: true });
    }
  }, [user, profile, navigate]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user exists in Firestore by UID
      let userDocRef = doc(db, 'users', user.uid);
      let userDoc = await getDoc(userDocRef);
      
      if (user.email === 'comercial@ff.ind.br') {
        const fabioName = 'Fábio';
        await setDoc(userDocRef, {
          uid: user.uid,
          name: fabioName,
          email: user.email,
          role: 'external_seller',
          status: 'active',
          updated_at: new Date().toISOString()
        }, { merge: true });
        toast.success(`Olá, ${fabioName}! Perfil sincronizado.`);
        navigate('/');
        return;
      }

      if (user.email === 'marketing@roderbrasil.com.br' || user.email === 'franciele@roderbrasil.com.br') {
        const mktName = 'Franciélli Lopes';
        await setDoc(userDocRef, {
          uid: user.uid,
          name: mktName,
          email: user.email,
          phone: '(14) 99887-5110',
          role: 'marketing',
          status: 'active',
          updated_at: new Date().toISOString()
        }, { merge: true });
        toast.success(`Olá, ${mktName}! Perfil de Marketing sincronizado.`);
        navigate('/');
        return;
      }

      if (user.email === 'jeferson@roderbrasil.com.br' || user.email === 'jefferson@roderbrasil.com.br') {
        const name = 'Jeferson Roder';
        await setDoc(userDocRef, {
          uid: user.uid,
          name: name,
          email: user.email,
          role: 'internal_seller',
          status: 'active',
          updated_at: new Date().toISOString()
        }, { merge: true });
        toast.success(`Olá, ${name}! Perfil sincronizado.`);
        navigate('/');
        return;
      }
      
      if (!userDoc.exists()) {
        const targetEmail = (user.email || '').toLowerCase().trim();
        const q = query(collection(db, 'users'), where('email', '==', targetEmail));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          // Found pre-created profile(s)! Use the first one or merge if there are multiple duplicates
          const docs = querySnapshot.docs;
          let mergedData: any = {};
          
          for (const d of docs) {
            const currentData = d.data();
            const rolesPriority = ['admin', 'manager', 'triagem', 'internal_seller', 'financial', 'marketing', 'vendedor_padrao', 'external_seller', ''];
            const currentRoleIdx = rolesPriority.indexOf(mergedData.role || '');
            const tempRoleIdx = rolesPriority.indexOf(currentData.role || '');
            const bestRole = (currentRoleIdx !== -1 && tempRoleIdx !== -1 && tempRoleIdx < currentRoleIdx)
              ? currentData.role
              : (mergedData.role || currentData.role || 'internal_seller');
            
            mergedData = {
              ...currentData,
              ...mergedData,
              role: bestRole,
              is_lead_receiver: mergedData.is_lead_receiver || currentData.is_lead_receiver || false,
              permissions: {
                sidebar: { ...(currentData.permissions?.sidebar || {}), ...(mergedData.permissions?.sidebar || {}) },
                dashboard_cards: { ...(currentData.permissions?.dashboard_cards || {}), ...(mergedData.permissions?.dashboard_cards || {}) }
              }
            };
          }
          
          const batch = writeBatch(db);
          for (const d of docs) {
            if (d.id !== user.uid) {
              batch.delete(doc(db, 'users', d.id));
            }
          }
          
          batch.set(doc(db, 'users', user.uid), {
            ...mergedData,
            uid: user.uid,
            status: 'active',
            updated_at: new Date().toISOString()
          });
          
          await batch.commit();
          
          toast.success(`Olá, ${mergedData.name || 'Usuário'}!`);
        } else if (user.email === 'roderbrasil@gmail.com' || user.email === 'roderindica@gmail.com') {
          const adminName = user.displayName || 'Admin';
          await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            name: adminName,
            email: user.email,
            role: 'admin',
            status: 'active',
            created_at: new Date().toISOString(),
          });
          toast.success(`Olá, ${adminName}!`);
        } else if (user.email === 'marketing@roderbrasil.com.br') {
          const mktName = 'Franciélli Lopes';
          await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            name: mktName,
            email: user.email,
            phone: '(14) 99887-5110',
            role: 'marketing',
            status: 'active',
            created_at: new Date().toISOString(),
          });
          toast.success(`Olá, ${mktName}! Seu perfil de Marketing foi configurado.`);
        } else if (user.email === 'yury@roderbrasil.com.br' || user.email === 'yuri@roderbrasil.com.br') {
          const name = 'Yury Mello';
          await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            name: name,
            email: user.email,
            role: 'manager',
            status: 'active',
            created_at: new Date().toISOString(),
          });
          toast.success(`Olá, ${name}! Seu perfil de Gestão foi configurado.`);
        } else if (user.email === 'jeferson@roderbrasil.com.br' || user.email === 'jefferson@roderbrasil.com.br') {
          const name = 'Jeferson Roder';
          await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            name: name,
            email: user.email,
            role: 'internal_seller',
            status: 'active',
            created_at: new Date().toISOString(),
          });
          toast.success(`Olá, ${name}! Seu perfil de Vendedor foi configurado.`);
        } else {
          // Permissão automática para domínios da empresa
          const defaultName = user.displayName || user.email?.split('@')[0] || 'Novo Usuário';
          const isRoder = user.email?.endsWith('@roderbrasil.com.br') || user.email?.endsWith('@roder.com.br');
          
          await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            name: defaultName,
            email: user.email,
            role: isRoder ? 'internal_seller' : 'external_seller',
            status: 'active',
            created_at: new Date().toISOString(),
          });
          toast.success(`Olá, ${defaultName}! Seu perfil foi configurado como ${isRoder ? 'Interno' : 'Externo'}.`);
        }
      }

      navigate('/');
    } catch (error: any) {
      console.error("Login error:", error);
      const isStorageError = error.message?.includes('missing initial state') || 
                            error.message?.includes('sessionStorage') ||
                            error.message?.includes('auth/web-storage-unsupported') ||
                            error.message?.includes('auth/operation-not-supported-in-this-environment');

      if (error.code === 'auth/popup-closed-by-user') {
        toast.error('O login foi cancelado. Por favor, tente novamente sem fechar a janela do Google.');
      } else if (error.code === 'auth/cancelled-popup-request') {
        // Ignorar se já houver um popup sendo aberto
      } else if (error.code === 'auth/network-request-failed' || isStorageError) {
        toast.error(
          <div className="flex flex-col gap-2">
            <p className="font-bold">Bloqueio de Segurança do Navegador</p>
            <p className="text-sm">O navegador bloqueou o login devido a restrições de privacidade em janelas dentro de outros sites (iFrame).</p>
            <Button 
              size="sm" 
              variant="secondary" 
              className="bg-white text-slate-900 border-none mt-1"
              onClick={() => window.open(window.location.origin, '_blank')}
            >
              Abrir em Nova Aba para Logar
            </Button>
          </div>,
          { duration: 15000, position: 'top-center' }
        );
      } else {
        toast.error('Erro ao fazer login: ' + (error.message || 'Verifique sua conexão'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Preencha e-mail e senha.');
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Entrada realizada com sucesso!');
      navigate('/');
    } catch (error: any) {
      console.error("Email login error:", error);
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        toast.error('E-mail ou senha incorretos.');
      } else if (error.code === 'auth/too-many-requests') {
        toast.error('Muitas tentativas. Tente novamente em instantes.');
      } else {
        toast.error('Erro ao entrar: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error('Digite seu e-mail no campo acima para recuperar a senha.');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      toast.success('E-mail de recuperação enviado! Verifique sua caixa de entrada.');
    } catch (error: any) {
      toast.error('Erro ao enviar e-mail: ' + error.message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md border-border bg-card text-card-foreground shadow-2xl overflow-hidden">
        <div className="h-1 bg-primary w-full shadow-[0_0_15px_rgba(var(--primary),0.5)]" />
        <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center p-2 shadow-inner border border-border overflow-hidden">
                 <img 
                   src="https://roderbrasil.com.br/wp-content/uploads/2024/05/favicon.png" 
                   alt="Roder Logo" 
                   referrerPolicy="no-referrer" 
                   className="max-w-full"
                   onError={(e) => {
                     e.currentTarget.style.display = 'none';
                     const parent = e.currentTarget.parentElement;
                     if (parent) parent.innerHTML = '<span class="text-xl font-black text-white tracking-tighter">RODER</span>';
                   }}
                 />
              </div>
            </div>
          <CardTitle className="text-2xl font-black tracking-tighter text-foreground uppercase italic">RODER Indica V2</CardTitle>
          <CardDescription className="text-muted-foreground font-medium">
            Acesse sua conta para gerenciar indicações e comissões.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {!showEmailLogin ? (
            <>
              <Button 
                variant="outline" 
                className="w-full border-border bg-background hover:bg-muted text-foreground h-16 text-lg font-bold shadow-sm"
                onClick={handleGoogleLogin}
                disabled={loading}
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                  <div className="flex items-center gap-3">
                    <svg className="h-6 w-6" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.27.81-.57z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    Google
                  </div>
                )}
              </Button>

              <Button 
                variant="outline" 
                className="w-full border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10 text-blue-600 h-16 text-lg font-bold shadow-sm"
                onClick={() => setShowEmailLogin(true)}
                disabled={loading}
              >
                <Mail className="h-6 w-6 mr-3 text-blue-500 fill-blue-500/20" />
                E-mail e Senha
              </Button>
            </>
          ) : (
            <form onSubmit={handleEmailLogin} className="space-y-4 animate-in slide-in-from-right duration-200">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Seu E-mail</Label>
                <Input 
                  id="email"
                  type="email"
                  placeholder="exemplo@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 text-base font-medium bg-background border-border"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="pass" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Sua Senha</Label>
                  <button 
                    type="button" 
                    onClick={handleForgotPassword}
                    className="text-[10px] text-primary hover:underline font-bold uppercase tracking-widest"
                  >
                    Esqueci minha senha
                  </button>
                </div>
                <div className="relative">
                  <Input 
                    id="pass"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 text-base font-medium bg-background border-border pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    title={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <p className="text-[10px] text-muted-foreground uppercase font-medium leading-tight mt-1">
                  * Primeiro acesso? Clique em "Esqueci minha senha" para criar sua conta.
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  type="button"
                  variant="ghost" 
                  className="h-12 w-12 p-0"
                  onClick={() => setShowEmailLogin(false)}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <Button 
                  type="submit"
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest h-12 text-sm shadow-lg shadow-primary/20"
                  disabled={loading}
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Entrar'}
                </Button>
              </div>
            </form>
          )}

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground font-black tracking-widest">Links Externos</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 text-center">
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-[10px] h-12 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
              onClick={() => navigate('/estoque-publico')}
            >
              <Package className="h-4 w-4" />
              Estoque Roder Operacional
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
