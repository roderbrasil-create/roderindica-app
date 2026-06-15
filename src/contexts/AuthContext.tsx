import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  User, 
  signOut, 
  GoogleAuthProvider, 
  signInWithPopup
} from 'firebase/auth';
import { doc, onSnapshot, collection, query, where, writeBatch, getDocs, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
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
          setProfile(JSON.parse(cachedProfile));
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

            // Self-healing for Vanessa Camargo if her role got corrupted/incorrectly-guessed as internal_seller or anything else
            const isVanessaOrFinance = userEmail.includes('vanessa') || displayName.includes('vanessa') || userEmail.includes('finance');
            
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
              await updateDoc(doc(db, 'users', user.uid), {
                role: 'financial',
                permissions: fPermissions,
                updated_at: new Date().toISOString()
              });
              return;
            }
            const isExplicitAdmin = [
              'roderbrasil@gmail.com',
              'roderindica@gmail.com',
              'gislene@roderbrasil.com.br',
              'gislene@roder.com.br',
              'rogerio@roderbrasil.com.br',
              'contato@roderbrasil.com.br',
              'luana@roder.com.br',
              'luana@roderbrasil.com.br',
              'yury@roderbrasil.com.br',
              'yuri@roderbrasil.com.br',
              'marketing@roderbrasil.com.br',
              'pecas@roderbrasil.com.br',
              'peças@roderbrasil.com.br',
              'vendas@roderbrasil.com.br',
              'comercial@roderbrasil.com.br',
              'posvenda@roderbrasil.com.br',
              'pedidos@roderbrasil.com.br',
              'rudineisolmario@outlook.com'
            ].includes(userEmail);

            if (profileData.status !== 'active') {
              if (isExplicitAdmin || isVanessaOrFinance) {
                console.log("Auto-activating status for admin/finance:", userEmail);
                const { updateDoc } = await import('firebase/firestore');
                await updateDoc(doc(db, 'users', user.uid), { 
                  status: 'active',
                  updated_at: new Date().toISOString()
                });
                // Snapshot will trigger again
              } else {
                setProfile(null);
                signOut(auth);
              }
            } else {
              setProfile(profileData);
              // Save to local cache for proactive loading (user decentralized vision)
              localStorage.setItem('roder_profile_cache', JSON.stringify(profileData));
            }
          } else {
            // Auto-create profile for explicit admins if they don't have one
            const userEmail = user.email?.toLowerCase() || '';
            const isExplicitAdmin = [
              'roderbrasil@gmail.com',
              'roderindica@gmail.com',
              'gislene@roderbrasil.com.br',
              'gislene@roder.com.br',
              'rogerio@roderbrasil.com.br',
              'contato@roderbrasil.com.br',
              'luana@roder.com.br',
              'luana@roderbrasil.com.br',
              'yury@roderbrasil.com.br',
              'yuri@roderbrasil.com.br',
              'marketing@roderbrasil.com.br',
              'pecas@roderbrasil.com.br',
              'peças@roderbrasil.com.br',
              'vendas@roderbrasil.com.br',
              'comercial@roderbrasil.com.br',
              'posvenda@roderbrasil.com.br',
              'pedidos@roderbrasil.com.br',
              'rudineisolmario@outlook.com'
            ].includes(userEmail);

            const isInternal = userEmail.endsWith('@roderbrasil.com.br') || userEmail.endsWith('@roder.com.br');
            const isAutoCreateAllowed = isExplicitAdmin || 
                                       userEmail === 'comercial@ff.ind.br' || 
                                       isInternal ||
                                       userEmail.includes('vanessa') ||
                                       userEmail.includes('finance') ||
                                       userEmail.includes('@outlook.com') ||
                                       userEmail.includes('@gmail.com') ||
                                       userEmail.includes('@hotmail.com');

            if (isAutoCreateAllowed) {
              console.log("Auto-creating or fixing profile for:", userEmail);
              try {
                let roleGuess: UserRole = 'external_seller'; 
                
                if (userEmail === 'comercial@ff.ind.br') {
                  roleGuess = 'external_seller';
                } else if (userEmail.includes('marketing')) {
                  roleGuess = 'marketing';
                } else if (userEmail.includes('finance') || userEmail.includes('vanessa')) {
                  roleGuess = 'financial';
                } else if (userEmail.includes('pecas') || userEmail.includes('peças')) {
                  roleGuess = 'internal_seller';
                } else if (userEmail.includes('vendas') || userEmail.includes('pedidos') || userEmail.includes('posvenda')) {
                  roleGuess = 'internal_seller';
                } else if (isExplicitAdmin && !isInternal) {
                  roleGuess = 'admin';
                } else if (userEmail === 'gislene@roderbrasil.com.br' || userEmail === 'gislene@roder.com.br' || userEmail === 'luana@roder.com.br' || userEmail === 'luana@roderbrasil.com.br' || userEmail === 'contato@roderbrasil.com.br') {
                  roleGuess = 'manager';
                } else if (isInternal) {
                  roleGuess = 'internal_seller';
                }


                const roleDefaults: Record<string, { sidebar: string[], dashboard_cards: string[] }> = {
                  external_seller: {
                    sidebar: ['dashboard', 'new_indication', 'my_sales', 'catalog', 'comissoes_ext', 'profile'],
                    dashboard_cards: ['stats', 'commissions_summary', 'recent_indications', 'equipment_banner', 'quick_actions']
                  },
                  vendedor_padrao: {
                    sidebar: ['dashboard', 'new_indication', 'my_sales', 'catalog', 'comissoes_ext', 'profile'],
                    dashboard_cards: ['stats', 'commissions_summary', 'recent_indications', 'equipment_banner', 'quick_actions']
                  },
                  internal_seller: {
                    sidebar: ['dashboard', 'new_indication', 'catalog', 'products_stock', 'products_registered', 'accessories', 'my_sales', 'fairs', 'profile'],
                    dashboard_cards: ['stats', 'funnel', 'recent_indications', 'equipment_banner', 'quick_actions']
                  },
                  triagem: {
                    sidebar: ['dashboard', 'catalog', 'products_stock', 'products_registered', 'accessories', 'my_sales', 'triagem', 'comercial', 'fairs', 'users', 'profile'],
                    dashboard_cards: ['stats', 'funnel', 'recent_indications', 'active_reservations', 'equipment_banner', 'quick_actions', 'fairs_summary']
                  },
                  manager: {
                    sidebar: ['dashboard', 'new_indication', 'fairs', 'finance', 'my_sales', 'catalog', 'products_stock', 'products_registered', 'accessories', 'triagem', 'comercial', 'users', 'reports', 'profile'],
                    dashboard_cards: ['stats', 'funnel', 'commissions_summary', 'active_reservations', 'goals', 'recent_indications', 'conversion_ranking', 'manager_financial', 'equipment_banner', 'quick_actions', 'fairs_summary']
                  },
                  financial: {
                    sidebar: ['dashboard', 'products_stock', 'products_registered', 'accessories', 'finance', 'reports', 'profile'],
                    dashboard_cards: ['stats', 'commissions_summary', 'goals', 'recent_indications', 'conversion_ranking', 'manager_financial', 'equipment_banner', 'quick_actions']
                  }
                };

                const defaults = roleDefaults[roleGuess] || { sidebar: [], dashboard_cards: [] };
                const permissionsField = {
                  sidebar: defaults.sidebar.reduce((acc, item) => ({ ...acc, [item]: true }), {}),
                  dashboard_cards: defaults.dashboard_cards.reduce((acc, item) => ({ ...acc, [item]: true }), {})
                };

                const newProfile: any = {
                  uid: user.uid,
                  name: userEmail === 'comercial@ff.ind.br' ? 'Fábio' : (user.displayName || userEmail.split('@')[0]),
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
                // snapshot will trigger again with exists() = true
                return; // exit current snapshot callback to let the next one take over
              } catch (e) {
                console.error("Failed to auto-create admin profile:", e);
                setProfile(null);
              }
            } else {
              setProfile(null);
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
      return profile?.role === 'marketing' || profile?.role === 'admin' || isTopAdmin || (userEmail?.includes('marketing') && !impersonatedProfile);
    };

    const getIsInternalSeller = () => {
      if (impersonatedProfile) {
        return impersonatedProfile.role === 'internal_seller';
      }
      return profile?.role === 'internal_seller' || (userEmail.includes('pecas') && !impersonatedProfile) || (userEmail.includes('peças') && !impersonatedProfile);
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

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
