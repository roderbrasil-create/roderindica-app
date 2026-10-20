import React, { useEffect } from 'react';
import { db } from '../../lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';

// O registro de presença (edge_nodes) continua em segundo plano. O painel de "nós ativos" saiu da tela.
export default function EdgeStatus() {
  const { user, profile } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Heartbeat: update current user's node status every 3 minutes
    const updateHeartbeat = async () => {
      if (!user) return;
      try {
        // Generate or get device ID to allow multiple nodes for same user email
        let deviceId = localStorage.getItem('roder_device_id');
        if (!deviceId) {
          deviceId = Math.random().toString(36).substring(2, 10) + Date.now().toString(36).substring(4);
          localStorage.setItem('roder_device_id', deviceId);
        }

        const nodeRef = doc(db, 'edge_nodes', `${user.uid}_${deviceId}`);
        await setDoc(nodeRef, {
          last_seen: serverTimestamp(),
          uid: user.uid,
          email: user.email,
          name: (profile?.name || user.displayName || user.email?.split('@')[0] || 'Node Anonimo').replace('Jefferson', 'Jeferson'),
          app_version: '2.8.6',
          role: profile?.role || 'user',
          is_pwa: window.matchMedia('(display-mode: standalone)').matches,
          device_info: navigator.userAgent.substring(0, 50) + '...'
        }, { merge: true });
      } catch (e) {
        console.error("Heartbeat error", e);
      }
    };

    updateHeartbeat();
    const interval = setInterval(updateHeartbeat, 60000); // 1 min (more frequent for better real-time)

    return () => clearInterval(interval);
  }, [user?.uid, profile]);

  return (
    <div className="flex flex-col gap-2 px-3 py-2.5 bg-sidebar-accent/10 border-t border-sidebar-border/30">
      <div className="flex items-center justify-between border-t border-sidebar-border/30 pt-2.5 mt-1.5 text-xs text-sidebar-foreground/80 font-sans antialiased" translate="no">
        <span className="font-semibold tracking-tight uppercase">Versão:</span>
        <span className="text-[11px] font-mono font-bold bg-gradient-to-r from-orange-600 to-amber-500 text-white border border-orange-500/20 px-2.5 py-0.5 rounded-full shadow-md tracking-wider select-all antialiased notranslate" translate="no">
          v2.8.6-PROD
        </span>
      </div>
    </div>
  );
}
