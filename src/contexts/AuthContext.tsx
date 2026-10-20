import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  User, 
  signOut, 
  GoogleAuthProvider, 
  signInWithPopup
} from 'firebase/auth';
import { doc, onSnapshot, collection, query, where, writeBatch, getDocs, getDoc, updateDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { auth, db, reivindicarPerfilDetalhado, loginComSenhaEmAndamento } from '../lib/firebase';
import { UserProfile, UserRole } from '../types';
import { AuditService, AuditAction } from '../lib/AuditService';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  realProfile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isManager: boolean;
  isInternalSeller: boolean;
  isTriagem: boolean;
  isFinancial: boolean;
  isMarketing: boolean;
  isExternalSeller: boolean;
  isRegionalSeller: boolean;
  isPartner: boolean;
  isEquipeRoder: boolean;
  isPureExternalSeller: boolean;
  isImpersonating: boolean;
  isQuotaExceeded: boolean;
  startImpersonation: (targetProfile: UserProfile) => void;
  stopImpersonation: () => void;
  logout: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  auth: typeof auth;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [impersonatedProfile, setImpersonatedProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);

  // Global monitoring to detect Firebase Quota limits being exceeded anywhere in the application
  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      const msg = event?.message || '';
      const errStr = event?.error ? String(event.error) : '';
      if (
        msg.toLowerCase().includes('quota') || 
        msg.toLowerCase().includes('exhausted') ||
        errStr.toLowerCase().includes('quota') ||
        errStr.toLowerCase().includes('exhausted') ||
        errStr.toLowerCase().includes('quota limit exceeded')
      ) {
        setIsQuotaExceeded(true);
      }
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      const msg = event?.reason?.message || '';
      const reasonStr = event?.reason ? String(event.reason) : '';
      if (
        msg.toLowerCase().includes('quota') || 
        msg.toLowerCase().includes('exhausted') ||
        reasonStr.toLowerCase().includes('quota') ||
        reasonStr.toLowerCase().includes('exhausted') ||
        reasonStr.toLowerCase().includes('quota limit exceeded')
      ) {
        setIsQuotaExceeded(true);
      }
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

    // Persistence for impersonation and simulated login
    useEffect(() => {
      // Safety timeout: if auth takes too long, stop loading
      const safetyTimer = setTimeout(() => {
        if (loading) {
          console.warn("Auth initialization safety timeout reached.");
          setLoading(false);
        }
      }, 4000);

      const savedImpersonation = localStorage.getItem('roder_impersonation');
      if (savedImpersonation) {
        try {
          setImpersonatedProfile(JSON.parse(savedImpersonation));
        } catch (e) {
          localStorage.removeItem('roder_impersonation');
        }
      }

      // Proactive Local Profile Cache (aligning with user decentralized vision)
      const cachedProfile = localStorage.getItem('roder_profile_cache');
      if (cachedProfile && !impersonatedProfile) {
        try {
          const parsed = JSON.parse(cachedProfile);
          if (parsed && parsed.name && parsed.name.includes('Jefferson')) {
            const userEmail = parsed.email?.toLowerCase() || '';
            if (userEmail === 'roderbrasil@gmail.com' || userEmail === 'roderindica@gmail.com' || userEmail === 'jefferson@roderbrasil.com.br' || userEmail === 'jeferson@roderbrasil.com.br') {
              console.log("Self-healing Jeferson's name spelling in local cache...");
              parsed.name = parsed.name.replace('Jefferson', 'Jeferson');
              localStorage.setItem('roder_profile_cache', JSON.stringify(parsed));
            }
          }
          setProfile(parsed);
        } catch (e) {
          localStorage.removeItem('roder_profile_cache');
        }
      }

      return () => clearTimeout(safetyTimer);
    }, [loading, !!impersonatedProfile]);

  useEffect(() => {
    try {
      const unsubscribeAuth = onAuthStateChanged(auth, (authUser) => {
        console.log("Auth state change:", authUser?.email || "No user");
        setUser(authUser);
        
        if (!authUser) {
          setProfile(null);
          setImpersonatedProfile(null);
          localStorage.removeItem('roder_impersonation');
          localStorage.removeItem('roder_profile_cache');
          setLoading(false);
        }
      }, (err) => {
        console.error("Auth state change error:", err);
        setLoading(false);
      });

      return () => unsubscribeAuth();
    } catch (e) {
      console.error("Auth effect setup error:", e);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;
    let isMounted = true;

    async function initializeProfile() {
      if (!user) {
        if (loading) setLoading(false);
        return;
      }

      try {
        // E-mail confirmado pelo servidor depois do login (19/10/2026): o token antigo continua
        // dizendo "não confirmado" por até 1 hora, e as regras só confiam no confirmado. Recarrega
        // a conta e, se ela já estiver confirmada, pede um token novo antes de ler qualquer coisa.
        if (!user.isAnonymous && user.email) {
          try {
            const tk = await user.getIdTokenResult();
            if (tk.claims.email_verified !== true) {
              await user.reload();
              if (auth.currentUser?.emailVerified) await auth.currentUser.getIdToken(true);
            }
          } catch (e) {
            console.warn('Não consegui renovar o token do login:', e);
          }
        }

        const userDocRef = doc(db, 'users', user.uid);
        
        // Check if the user document already exists directly to skip email searches and list queries
        let userDocExists = false;
        try {
          const directSnap = await getDoc(userDocRef);
          userDocExists = directSnap.exists();
        } catch (getDocErr) {
          console.warn("Direct profile getDoc query failed (will try fallback lookup):", getDocErr);
        }

        const normalizeEmailLocally = (em: string | undefined | null): string => {
          if (!em) return '';
          return em
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim();
        };

        // 0. Primeiro acesso de quem foi pré-cadastrado: o servidor faz a passagem do cadastro
        // (pedido único, compartilhado com a tela de login: ver reivindicarPerfilDetalhado)
        if (user.email && !userDocExists) {
          const reivindicado = await reivindicarPerfilDetalhado();
          if (reivindicado.merged) userDocExists = true;
          if ((reivindicado.entrar_de_novo || reivindicado.motivo === 'token_revogado') && !loginComSenhaEmAndamento()) {
            // O servidor confirmou o e-mail e derrubou os logins, e aqui não há senha na mão para
            // entrar de novo (sessão que voltou sozinha, outra aba). Sai com aviso claro, em vez de
            // seguir com um login que cai sozinho daqui a pouco.
            localStorage.removeItem('roder_profile_cache');
            await signOut(auth);
            toast.info('Seu acesso foi confirmado. Entre de novo com seu e-mail e senha.', { duration: 10000 });
            if (isMounted) setLoading(false);
            return;
          }
        }

        // 1. One-time check/migration logic for Email (resolving accent differences & duplicates)
        if (user.email) {
          try {
            const targetEmail = user.email.toLowerCase().trim();
            // Use a secure filtered query that regular users have permission to execute
            const q = query(collection(db, 'users'), where('email', '==', targetEmail));
            const querySnapshot = await getDocs(q);
            
            let tempProfileDocs: any[] = [];
            let realProfileDoc: any = null;
            
            for (const docSnap of querySnapshot.docs) {
              if (docSnap.id === user.uid) {
                realProfileDoc = docSnap;
              } else {
                tempProfileDocs.push(docSnap);
              }
            }
            
            if (tempProfileDocs.length > 0) {
              const batch = writeBatch(db);
              const realRef = doc(db, 'users', user.uid);
              
              let mergedProfile: any = {};
              if (realProfileDoc) {
                mergedProfile = { ...realProfileDoc.data() };
              }
              
              for (const tempDoc of tempProfileDocs) {
                const tempData = tempDoc.data();
                
                // Keep the strongest role (admin, manager, triagem, etc.)
                const rolesPriority = ['admin', 'manager', 'financial', 'triagem', 'internal_seller', 'marketing', 'vendedor_padrao', 'external_seller', ''];
                const currentRoleIdx = rolesPriority.indexOf(mergedProfile.role || '');
                const tempRoleIdx = rolesPriority.indexOf(tempData.role || '');
                const bestRole = (currentRoleIdx !== -1 && tempRoleIdx !== -1 && tempRoleIdx < currentRoleIdx)
                  ? tempData.role
                  : (mergedProfile.role || tempData.role || 'internal_seller');
                
                // Preserve lead receiver status
                const isLeadReceiver = mergedProfile.is_lead_receiver || tempData.is_lead_receiver || false;

                // Merge permissions specifically to ensure they aren't lost
                const currentPermissions = mergedProfile.permissions || {};
                const tempPermissions = tempData.permissions || {};
                const mergedPermissions = {
                  sidebar: { ...(tempPermissions.sidebar || {}), ...(currentPermissions.sidebar || {}) },
                  dashboard_cards: { ...(tempPermissions.dashboard_cards || {}), ...(currentPermissions.dashboard_cards || {}) }
                };
                
                mergedProfile = {
                  ...tempData,
                  ...mergedProfile, // keep realProfile info if any over temp
                  role: bestRole,
                  is_lead_receiver: isLeadReceiver,
                  permissions: mergedPermissions,
                  uid: user.uid,
                  status: 'active',
                  updated_at: new Date().toISOString()
                };
                
                batch.delete(doc(db, 'users', tempDoc.id));
                
                // Keep historical references updated (indications & fair_leads matching temp ID)
                try {
                  const indQ = query(collection(db, 'indications'), where('internal_seller_uid', '==', tempDoc.id));
                  const indSnap = await getDocs(indQ);
                  indSnap.forEach(indDoc => {
                    batch.update(doc(db, 'indications', indDoc.id), {
                      internal_seller_uid: user.uid,
                      updated_at: new Date().toISOString()
                    });
                  });

                  const indQ2 = query(collection(db, 'indications'), where('assigned_to_uid', '==', tempDoc.id));
                  const indSnap2 = await getDocs(indQ2);
                  indSnap2.forEach(indDoc => {
                    batch.update(doc(db, 'indications', indDoc.id), {
                      assigned_to_uid: user.uid,
                      updated_at: new Date().toISOString()
                    });
                  });

                  const fairQ = query(collection(db, 'fair_leads'), where('assigned_to_uid', '==', tempDoc.id));
                  const fairSnap = await getDocs(fairQ);
                  fairSnap.forEach(fairDoc => {
                    batch.update(doc(db, 'fair_leads', fairDoc.id), {
                      assigned_to_uid: user.uid,
                      updated_at: new Date().toISOString()
                    });
                  });
                } catch (updateRefErr) {
                  console.error("Non-blocking reference update error during login merge:", updateRefErr);
                }
              }
              
              // senha inicial e data dela não vão para o próprio cadastro (as regras recusam)
              delete mergedProfile.initial_password;
              delete mergedProfile.initial_password_set_at;
              batch.set(realRef, mergedProfile);
              await batch.commit();
              console.log("Successfully merged duplicate/temp profile in AuthContext for:", user.email);
              userDocExists = true;
            }
          } catch (mergeErr) {
            console.error("Non-blocking profile merge error:", mergeErr);
          }
        }

        if (!isMounted) return;

        // 2. Start the real-time sync after migration/check
        unsubscribeProfile = onSnapshot(doc(db, 'users', user.uid), async (snap) => {
          if (snap.exists()) {
            const profileData = snap.data() as UserProfile;
            
            // Auto-recovery for explicit admins/managers if status is not active
            const userEmail = user.email?.toLowerCase() || '';
            const displayName = (user.displayName || profileData.name || '').toLowerCase();

            // Correct name spelling for Jeferson Roder (only one F)
            if ((userEmail === 'roderbrasil@gmail.com' || userEmail === 'roderindica@gmail.com' || userEmail === 'jefferson@roderbrasil.com.br' || userEmail === 'jeferson@roderbrasil.com.br') && 
                profileData.name && (profileData.name.includes('Jefferson') || profileData.name === 'Admin')) {
              console.log("Self-healing Jeferson's name spelling in Firestore user profile...");
              const correctedName = profileData.name.replace('Jefferson', 'Jeferson');
              profileData.name = correctedName;
              localStorage.setItem('roder_profile_cache', JSON.stringify(profileData));
              updateDoc(doc(db, 'users', user.uid), {
                name: correctedName,
                updated_at: new Date().toISOString()
              }).catch(err => {
                console.error("Failed to update Jeferson's name in Firestore:", err);
              });
            }

            // Self-healing display name for Luana Camargo (contato@roderbrasil.com.br / luana@roderbrasil.com.br)
            const isLuana = userEmail === 'contato@roderbrasil.com.br' || 
                            userEmail === 'luana@roderbrasil.com.br' || 
                            userEmail === 'luana@roder.com.br' ||
                            (profileData.name && (profileData.name.includes('Contato_Roder') || profileData.name.includes('Contato Roder')));
            if (isLuana && profileData.name !== 'Luana Camargo') {
              console.log("Self-healing Luana Camargo's display name in Firestore user profile...");
              profileData.name = 'Luana Camargo';
              localStorage.setItem('roder_profile_cache', JSON.stringify(profileData));
              updateDoc(doc(db, 'users', user.uid), {
                name: 'Luana Camargo',
                updated_at: new Date().toISOString()
              }).catch(err => {
                console.error("Failed to update Luana's name in Firestore:", err);
              });
            }

            // Self-healing for Vanessa Camargo if her role got corrupted/incorrectly-guessed as internal_seller or anything else
            // só e-mail da Roder: antes um parceiro com "finance" ou "vanessa" no e-mail virava financeiro sozinho
            const isVanessaOrFinance = userEmail.endsWith('@roderbrasil.com.br') && (userEmail.includes('vanessa') || userEmail.includes('finance'));
            
            const fDefaults = {
              sidebar: ['dashboard', 'products_stock', 'products_registered', 'accessories', 'finance', 'reports', 'profile'],
              dashboard_cards: ['stats', 'commissions_summary', 'goals', 'recent_indications', 'conversion_ranking', 'manager_financial', 'equipment_banner', 'quick_actions']
            };

            const hasLackingPermissions = !profileData.permissions?.sidebar || 
                                          !fDefaults.sidebar.every(k => profileData.permissions.sidebar[k] === true) ||
                                          !profileData.permissions?.dashboard_cards ||
                                          !fDefaults.dashboard_cards.every(k => profileData.permissions.dashboard_cards[k] === true);

            if (isVanessaOrFinance && 
                profileData.role !== 'admin' && 
                profileData.role !== 'manager' && 
                (profileData.role !== 'financial' || hasLackingPermissions)) {
              console.log("Self-healing Vanessa's profile to financial with full permissions...");
              const fPermissions = {
                sidebar: fDefaults.sidebar.reduce((acc, item) => ({ ...acc, [item]: true }), {}),
                dashboard_cards: fDefaults.dashboard_cards.reduce((acc, item) => ({ ...acc, [item]: true }), {})
              };
              const { updateDoc } = await import('firebase/firestore');
              // com as regras novas a pessoa não muda o próprio papel; se recusar, segue com o perfil atual
              try {
                await updateDoc(doc(db, 'users', user.uid), {
                  role: 'financial',
                  permissions: fPermissions,
                  updated_at: new Date().toISOString()
                });
                return;
              } catch (e) {
                console.warn('[AUTH] ajuste automático do financeiro recusado:', e);
              }
            }
            const isExplicitMasterAdmin = [
              'roderbrasil@gmail.com',
              'roderindica@gmail.com',
              'gislene@roderbrasil.com.br',
              'gislene@roder.com.br',
              'rogerio@roderbrasil.com.br',
              'contato@roderbrasil.com.br',
              'luana@roder.com.br',
              'luana@roderbrasil.com.br'
            ].includes(userEmail);

            if (profileData.status !== 'active') {
              if (isExplicitMasterAdmin || isVanessaOrFinance) {
                console.log("Auto-activating status for master admin/finance:", userEmail);
                const { updateDoc } = await import('firebase/firestore');
                await updateDoc(doc(db, 'users', user.uid), { 
                  status: 'active',
                  updated_at: new Date().toISOString()
                });
                // Snapshot will trigger again
              } else {
                console.warn("[AUTH] Inactive user profile, signing out:", userEmail);
                setProfile(null);
                setImpersonatedProfile(null);
                localStorage.removeItem('roder_impersonation');
                localStorage.removeItem('roder_profile_cache');
                await signOut(auth);
                setLoading(false);
                return;
              }
            } else {
              setProfile(profileData);
              // Save to local cache for proactive loading (user decentralized vision)
              localStorage.setItem('roder_profile_cache', JSON.stringify(profileData));
            }
          } else {
            // Document does NOT exist by user.uid
            const userEmail = user.email?.toLowerCase().trim() || '';
            const isExplicitMasterAdmin = [
              'roderbrasil@gmail.com',
              'roderindica@gmail.com',
              'gislene@roderbrasil.com.br',
              'gislene@roder.com.br',
              'rogerio@roderbrasil.com.br',
              'contato@roderbrasil.com.br',
              'luana@roder.com.br',
              'luana@roderbrasil.com.br'
            ].includes(userEmail);

            // Step A: Check if this user was pre-registered in users collection by email
            let foundByEmail = false;
            if (userEmail) {
              try {
                const q = query(collection(db, 'users'), where('email', '==', userEmail));
                const querySnapshot = await getDocs(q);
                if (!querySnapshot.empty) {
                  const docs = querySnapshot.docs;
                  let mergedData: any = {};
                  for (const d of docs) {
                    mergedData = { ...d.data(), ...mergedData };
                  }
                  delete mergedData.initial_password;
                  delete mergedData.initial_password_set_at;
                  const { setDoc, deleteDoc } = await import('firebase/firestore');
                  for (const d of docs) {
                    if (d.id !== user.uid) {
                      await deleteDoc(doc(db, 'users', d.id));
                    }
                  }
                  await setDoc(doc(db, 'users', user.uid), {
                    ...mergedData,
                    uid: user.uid,
                    status: mergedData.status || 'active',
                    updated_at: new Date().toISOString()
                  });
                  foundByEmail = true;
                  return; // snapshot will trigger again with exists() = true
                }
              } catch (lookupErr) {
                console.warn("[AUTH] Error checking pre-registered email:", lookupErr);
              }
            }

            // Step B: If not pre-registered, only Master Admins are allowed to auto-initialize
            if (isExplicitMasterAdmin) {
              console.log("Auto-initializing master admin profile for:", userEmail);
              try {
                let roleGuess: UserRole = 'admin';
                if (userEmail.includes('gislene') || userEmail.includes('luana') || userEmail.includes('contato')) {
                  roleGuess = 'manager';
                }

                const roleDefaults: Record<string, { sidebar: string[], dashboard_cards: string[] }> = {
                  manager: {
                    sidebar: ['dashboard', 'new_indication', 'fairs', 'finance', 'my_sales', 'catalog', 'products_stock', 'products_registered', 'accessories', 'triagem', 'comercial', 'users', 'reports', 'profile'],
                    dashboard_cards: ['stats', 'funnel', 'commissions_summary', 'active_reservations', 'goals', 'recent_indications', 'conversion_ranking', 'manager_financial', 'equipment_banner', 'quick_actions', 'fairs_summary']
                  },
                  admin: {
                    sidebar: ['dashboard', 'new_indication', 'fairs', 'finance', 'my_sales', 'catalog', 'products_stock', 'products_registered', 'accessories', 'triagem', 'comercial', 'users', 'reports', 'profile'],
                    dashboard_cards: ['stats', 'funnel', 'commissions_summary', 'active_reservations', 'goals', 'recent_indications', 'conversion_ranking', 'manager_financial', 'equipment_banner', 'quick_actions', 'fairs_summary']
                  }
                };

                const defaults = roleDefaults[roleGuess] || { sidebar: [], dashboard_cards: [] };
                const permissionsField = {
                  sidebar: defaults.sidebar.reduce((acc, item) => ({ ...acc, [item]: true }), {}),
                  dashboard_cards: defaults.dashboard_cards.reduce((acc, item) => ({ ...acc, [item]: true }), {})
                };

                const getInitialName = () => {
                  if (userEmail.includes('luana') || userEmail.includes('contato')) return 'Luana Camargo';
                  if (userEmail.includes('gislene')) return 'Gislene';
                  if (userEmail.includes('roder')) return 'Jeferson Roder';
                  return user.displayName || userEmail.split('@')[0];
                };

                const newProfile: any = {
                  uid: user.uid,
                  name: getInitialName(),
                  email: userEmail,
                  role: roleGuess,
                  status: 'active',
                  permissions: permissionsField,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  is_commissionable: false
                };
                
                const { setDoc } = await import('firebase/firestore');
                await setDoc(doc(db, 'users', user.uid), newProfile);
                return; // snapshot will trigger again with exists() = true
              } catch (e) {
                console.error("Failed to auto-create master admin profile:", e);
                setProfile(null);
              }
            } else {
              // CRITICAL: Block any user not pre-registered in users collection
              console.warn("[SECURITY] Access denied: User is not registered in the users screen:", userEmail);
              setProfile(null);
              setImpersonatedProfile(null);
              localStorage.removeItem('roder_impersonation');
              localStorage.removeItem('roder_profile_cache');
              await signOut(auth);
              setLoading(false);
              return;
            }
          }
          // Only set loading to false if we aren't waiting for an auto-creation
          setLoading(false);
        }, (error: any) => {
          console.error("Profile sync error:", error);
          if (error?.message?.includes('quota') || String(error).includes('quota') || error?.code === 'resource-exhausted') {
            setIsQuotaExceeded(true);
          }
          setLoading(false);
        });

      } catch (err) {
        console.error("Profile initialization error:", err);
        if (isMounted) setLoading(false);
      }
    }

    if (user) {
      initializeProfile();
    } else {
      setProfile(null);
      if (loading) setLoading(false);
    }

    return () => {
      isMounted = false;
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, [user]);

  const logout = React.useCallback(async () => {
    await AuditService.log(AuditAction.LOGOUT, `Usuário encerrou a sessão.`);
    
    // Cleanup active node on logout
    if (user) {
      try {
        const deviceId = localStorage.getItem('roder_device_id');
        if (deviceId) {
          const { deleteDoc, doc } = await import('firebase/firestore');
          await deleteDoc(doc(db, 'edge_nodes', `${user.uid}_${deviceId}`));
        }
      } catch (e) {
        console.error("Error cleaning up node on logout:", e);
      }
    }

    setImpersonatedProfile(null);
    localStorage.removeItem('roder_impersonation');
    await signOut(auth);
  }, [user]);

  const signInWithGoogle = React.useCallback(async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        await AuditService.log(AuditAction.LOGIN, `Login via Google: ${result.user.email}`);
      }
    } catch (error: any) {
      console.error("AuthContext Google Login Error:", error);
      // Handled by UI components using this method
      throw error;
    }
  }, []);

  const startImpersonation = React.useCallback((target: UserProfile) => {
    // Only real admins and managers can impersonate
    const isSpecialEmail = user?.email === 'roderbrasil@gmail.com' || 
                           user?.email === 'roderindica@gmail.com' || 
                           user?.email === 'gislene@roderbrasil.com.br' || 
                           user?.email === 'gislene@roder.com.br' ||
                           user?.email === 'contato@roderbrasil.com.br' ||
                           user?.email === 'rogerio@roderbrasil.com.br' ||
                           user?.email === 'luana@roder.com.br';
    const canImpersonate = profile?.role === 'admin' || profile?.role === 'manager' || isSpecialEmail;
    if (!canImpersonate) return;
    
    setImpersonatedProfile(target);
    localStorage.setItem('roder_impersonation', JSON.stringify(target));
  }, [profile?.role, user?.email]);

  const stopImpersonation = React.useCallback(() => {
    setImpersonatedProfile(null);
    localStorage.removeItem('roder_impersonation');
  }, []);

  // "Ver como" só vale para quem é de fato admin ou gerente. Antes bastava gravar
  // roder_impersonation no navegador para qualquer um ver as telas de admin.
  useEffect(() => {
    if (!impersonatedProfile || !profile) return;
    // a mesma lista de startImpersonation, mais a triagem
    const podeVerComo = ['admin', 'manager', 'triagem'].includes(String(profile.role)) ||
      ['roderbrasil@gmail.com', 'roderindica@gmail.com', 'jeferson@roderbrasil.com.br', 'gislene@roderbrasil.com.br',
       'gislene@roder.com.br', 'contato@roderbrasil.com.br', 'rogerio@roderbrasil.com.br', 'luana@roder.com.br',
       'luana@roderbrasil.com.br'].includes(String(user?.email || profile.email || '').toLowerCase());
    if (!podeVerComo) {
      setImpersonatedProfile(null);
      try { localStorage.removeItem('roder_impersonation'); } catch { /* sem armazenamento */ }
    }
  }, [impersonatedProfile, profile, user]);

  const activeProfile = impersonatedProfile || profile;

  const value = React.useMemo(() => {
    const userEmail = user?.email?.toLowerCase() || '';
    const isTopAdmin = !impersonatedProfile && (
                         userEmail === 'roderbrasil@gmail.com' || 
                         userEmail === 'roderindica@gmail.com' ||
                         userEmail === 'rogerio@roderbrasil.com.br' ||
                         userEmail === 'contato@roderbrasil.com.br' ||
                         userEmail === 'gislene@roderbrasil.com.br' ||
                         userEmail === 'gislene@roder.com.br' ||
                         userEmail === 'luana@roder.com.br' ||
                         userEmail === 'luana@roderbrasil.com.br'
                       );

    const checkRole = (role: string) => {
      if (impersonatedProfile) {
        return impersonatedProfile.role === role;
      }
      return profile?.role === role || (role === 'admin' && isTopAdmin);
    };

    // Special case for isManager: it includes admins and specific users
    const getIsManager = () => {
      if (impersonatedProfile) {
        return impersonatedProfile.role === 'manager' || impersonatedProfile.role === 'admin';
      }
      return profile?.role === 'manager' || profile?.role === 'admin' || isTopAdmin;
    };

    const getIsFinancial = () => {
      if (impersonatedProfile) {
        return impersonatedProfile.role === 'financial' || impersonatedProfile.role === 'admin';
      }
      return profile?.role === 'financial' || profile?.role === 'admin' || isTopAdmin;
    };

    const getIsMarketing = () => {
      if (impersonatedProfile) {
        return impersonatedProfile.role === 'marketing' || impersonatedProfile.role === 'admin';
      }
      return profile?.role === 'marketing' || profile?.role === 'admin' || isTopAdmin || (userEmail?.endsWith('@roderbrasil.com.br') && userEmail.includes('marketing') && !impersonatedProfile);
    };

    const getIsInternalSeller = () => {
      if (impersonatedProfile) {
        return impersonatedProfile.role === 'internal_seller';
      }
      return profile?.role === 'internal_seller' || (userEmail.endsWith('@roderbrasil.com.br') && userEmail.includes('pecas') && !impersonatedProfile);
    };

    const getIsTriagem = () => {
      if (impersonatedProfile) {
        return impersonatedProfile.role === 'triagem';
      }
      return profile?.role === 'triagem' ||
             ((userEmail === 'luana@roder.com.br' || userEmail === 'contato@roderbrasil.com.br') && !impersonatedProfile);
    };

    const getIsExternalSeller = () => {
      if (impersonatedProfile) {
        return impersonatedProfile.role === 'external_seller' || impersonatedProfile.role === 'vendedor_padrao';
      }
      return profile?.role === 'external_seller' || profile?.role === 'vendedor_padrao' || userEmail === 'comercial@ff.ind.br';
    };

    return {
    user,
    profile: activeProfile,
    realProfile: profile,
    loading,
    isAdmin: checkRole('admin'),
    isManager: getIsManager(),
    isInternalSeller: getIsInternalSeller(),
    isTriagem: getIsTriagem(),
    isFinancial: getIsFinancial(),
    isMarketing: getIsMarketing(),
    isExternalSeller: getIsExternalSeller(),
    isRegionalSeller: activeProfile?.role === 'vendedor_padrao',
    isPartner: getIsExternalSeller(),
    // Equipe Roder (inclui o vendedor regional, que é funcionário). Parceiro/indicador
    // (external_seller) e quem não tem perfil ficam de fora.
    isEquipeRoder: (!impersonatedProfile && isTopAdmin) ||
      ['admin', 'manager', 'internal_seller', 'triagem', 'financial', 'marketing', 'fiscal', 'vendedor_padrao'].includes(String(activeProfile?.role || '')),
    isPureExternalSeller: !impersonatedProfile && profile?.role === 'external_seller',
    isImpersonating: !!impersonatedProfile,
    isQuotaExceeded,
    startImpersonation,
    stopImpersonation,
    logout,
    signInWithGoogle,
    auth,
    };
  }, [user, profile, activeProfile, impersonatedProfile, loading, isQuotaExceeded, startImpersonation, stopImpersonation, logout, signInWithGoogle]);

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
          <p className="text-sm font-medium">Autenticando...</p>
        </div>
      ) : children}
    </AuthContext.Provider>
  );
}

// Mesmo contexto, sem erro fora do AuthProvider (devolve undefined): para peças montadas
// em qualquer lugar, como o leitor de documentos
export function useAuthOpcional(): AuthContextType | undefined {
  return useContext(AuthContext);
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
