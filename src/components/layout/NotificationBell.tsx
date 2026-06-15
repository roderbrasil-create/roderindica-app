import React, { useEffect, useState, useRef } from 'react';
import { Bell, Check, Info, AlertTriangle, X } from 'lucide-react';
import { collection, query, where, onSnapshot, orderBy, updateDoc, doc, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '../ui/dialog';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';

interface Notification {
  id: string;
  user_uid: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  link?: string;
  created_at: string;
}

export default function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!user) return;

    // Initialize audio
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');

    const q = query(
      collection(db, 'notifications'),
      where('user_uid', '==', user.uid),
      orderBy('created_at', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
      
      setNotifications(prev => {
        // Check for new notifications to play sound
        const hasNew = data.some(n => !n.read && !prev.find(p => p.id === n.id));
        if (hasNew && prev.length > 0) {
          audioRef.current?.play().catch(e => console.log('Audio play blocked', e));
        }
        return data;
      });
      
      setUnreadCount(data.filter(n => !n.read).length);
    }, (error) => {
      console.error("Error fetching notifications:", error);
      handleFirestoreError(error, OperationType.LIST, 'notifications');
    });

    return () => unsubscribe();
  }, [user]);

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (error) {
      console.error('Error marking as read:', error);
      handleFirestoreError(error, OperationType.UPDATE, `notifications/${id}`);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    setIsOpen(false);
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <Check className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error': return <X className="h-4 w-4 text-red-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="h-20 px-6 flex items-center gap-4 text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all duration-300 group">
          <div className={cn("relative transition-transform duration-500", unreadCount > 0 && "animate-shake")}>
            <Bell className={cn("h-16 w-16 transition-all duration-300", unreadCount > 0 ? "text-blue-500 drop-shadow-[0_0_12px_rgba(59,130,246,0.6)]" : "group-hover:rotate-[15deg]")} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-500"></span>
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <div className="flex flex-col items-center justify-center bg-blue-600 text-white h-10 min-w-[40px] px-2 rounded-xl shadow-lg shadow-blue-500/30">
              <span className="text-lg font-black leading-none">
                {unreadCount}
              </span>
              <span className="text-[8px] font-bold uppercase tracking-tighter mt-0.5">Alertas</span>
            </div>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-card border-border p-0 overflow-hidden">
        <DialogHeader className="p-4 border-b border-border bg-muted/30">
          <DialogTitle className="flex items-center justify-between">
            <span>Notificações</span>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                {unreadCount} novas
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <Bell className="h-12 w-12 text-muted-foreground/20 mb-4" />
              <p className="text-sm text-muted-foreground">Nenhuma notificação por enquanto.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((n) => (
                <div 
                  key={n.id} 
                  className={cn(
                    "p-4 hover:bg-muted/50 transition-colors cursor-pointer flex gap-3",
                    !n.read && "bg-primary/5"
                  )}
                  onClick={() => handleNotificationClick(n)}
                >
                  <div className="mt-1 shrink-0">
                    {getIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className={cn("text-sm font-bold truncate", !n.read ? "text-foreground" : "text-muted-foreground")}>
                        {n.title}
                      </p>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {new Date(n.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {n.message}
                    </p>
                  </div>
                  {!n.read && (
                    <div className="mt-2 shrink-0">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        {notifications.length > 0 && (
          <div className="p-3 border-t border-border bg-muted/10 text-center">
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-primary" onClick={() => {
              notifications.forEach(n => !n.read && markAsRead(n.id));
            }}>
              Marcar todas como lidas
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
