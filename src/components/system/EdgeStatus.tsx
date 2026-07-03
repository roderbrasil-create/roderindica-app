import React, { useEffect, useState } from 'react';
import { db, auth } from '../../lib/firebase';
import { doc, setDoc, serverTimestamp, onSnapshot, collection, query, where, Timestamp } from 'firebase/firestore';
import { Activity, Shield, Wifi } from 'lucide-react';
import { Badge } from '../ui/badge';
import { useAuth } from '../../contexts/AuthContext';

export default function EdgeStatus() {
  const { user, profile } = useAuth();
  const [activeNodes, setActiveNodes] = useState(1);

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

  useEffect(() => {
    if (!user?.uid) return;

    // Listen to active nodes (using a generous 30 minutes window to fully bypass client-side clock skew issues)
    const thirtyMinsAgo = new Date();
    thirtyMinsAgo.setMinutes(thirtyMinsAgo.getMinutes() - 30);
    
    // Convert to Firestore Timestamp for the query
    const tsThreshold = Timestamp.fromDate(thirtyMinsAgo);

    const q = query(collection(db, 'edge_nodes'), where('last_seen', '>=', tsThreshold));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const now = new Date();
      let activeCount = 0;
      
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        let lastSeenDate: Date | null = null;
        const lastSeenRaw = data.last_seen;
        
        if (lastSeenRaw) {
          if (typeof lastSeenRaw.toDate === 'function') {
            lastSeenDate = lastSeenRaw.toDate();
          } else if (lastSeenRaw.seconds !== undefined) {
            lastSeenDate = new Date(lastSeenRaw.seconds * 1000);
          } else if (lastSeenRaw instanceof Date) {
            lastSeenDate = lastSeenRaw;
          } else {
            const parsed = new Date(lastSeenRaw);
            if (!isNaN(parsed.getTime())) {
              lastSeenDate = parsed;
            }
          }
        }

        if (lastSeenDate) {
          const diffMins = Math.abs(now.getTime() - lastSeenDate.getTime()) / 60000;
          // Filter in-memory: 10 minutes tolerance (taking timezone/clock skews into consideration with absolute math)
          if (diffMins <= 10) {
            activeCount++;
          }
        }
      });
      
      setActiveNodes(activeCount > 0 ? activeCount : 1);
    }, (error) => {
      console.warn("Edge nodes query restricted or unavailable:", error.message);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  return (
    <div className="flex flex-col gap-2 px-3 py-2.5 bg-sidebar-accent/10 border-t border-sidebar-border/30">
      <div className="flex items-center gap-1.5">
        <Activity className="h-3 w-3 text-emerald-500 animate-pulse shrink-0" />
        <span className="text-[9px] font-black uppercase tracking-wider text-sidebar-foreground/50 truncate">
          Rede Híbrida Roder
        </span>
      </div>
      
      <div className="flex items-center justify-between gap-1 mt-0.5">
        <div className="flex items-center gap-1" title="Dispositivos ativos agora que atuam como nós da rede">
          <Shield className="h-2.5 w-2.5 text-primary animate-bounce duration-[2000ms] shrink-0" />
          <span className="text-[9px] font-black text-primary tracking-tighter">
            {activeNodes} {activeNodes === 1 ? 'NÓ' : 'NÓS'} ONLINE
          </span>
        </div>
        
        <div className="flex items-center gap-1 shrink-0">
          <Wifi className="h-2.5 w-2.5 text-emerald-500 shrink-0" />
          <Badge className="bg-emerald-500/10 text-emerald-650 dark:text-emerald-400 text-[8px] h-3.5 px-1 border-emerald-500/20 font-black uppercase tracking-tighter">Sync P2P</Badge>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-sidebar-border/30 pt-2.5 mt-1.5 text-xs text-sidebar-foreground/80 font-sans antialiased" translate="no">
        <span className="font-semibold tracking-tight uppercase">Versão:</span>
        <span className="text-[11px] font-mono font-bold bg-gradient-to-r from-orange-600 to-amber-500 text-white border border-orange-500/20 px-2.5 py-0.5 rounded-full shadow-md tracking-wider select-all antialiased notranslate" translate="no">
          v2.8.6-PROD
        </span>
      </div>
    </div>
  );
}
