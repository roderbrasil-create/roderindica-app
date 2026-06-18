import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { EndomarketingAction } from '../../types/endomarketing';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { CalendarIcon, MapPin, User, ChevronRight, Clock } from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function CalendarView() {
  const [actions, setActions] = useState<EndomarketingAction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'endomarketing_actions'), orderBy('date_planned', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const actionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as EndomarketingAction[];
      setActions(actionsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Group actions by month
  const groupedActions = actions.reduce((acc: Record<string, EndomarketingAction[]>, action) => {
    if (!action.date_planned) return acc;
    const monthKey = format(parseISO(action.date_planned), 'yyyy-MM');
    if (!acc[monthKey]) acc[monthKey] = [];
    acc[monthKey].push(action);
    return acc;
  }, {});

  const sortedMonths = Object.keys(groupedActions).sort();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Planejada': return 'bg-blue-500';
      case 'Em andamento': return 'bg-yellow-500';
      case 'Concluída': return 'bg-green-500';
      case 'Cancelada': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto py-4">
      {loading ? (
        <div className="text-center py-20 text-muted-foreground animate-pulse">
          Carregando cronograma...
        </div>
      ) : sortedMonths.length === 0 ? (
        <div className="text-center py-20 border border-dashed rounded-xl space-y-4">
          <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto opacity-20" />
          <p className="text-muted-foreground">Nenhuma ação agendada no cronograma.</p>
        </div>
      ) : (
        sortedMonths.map(month => (
          <div key={month} className="space-y-4">
            <h3 className="text-lg font-bold text-orange-600 capitalize pl-4 border-l-4 border-orange-600">
              {format(parseISO(`${month}-01`), 'MMMM yyyy', { locale: ptBR })}
            </h3>
            
            <div className="space-y-3">
              {groupedActions[month].map(action => (
                <Card key={action.id} className="overflow-hidden border-slate-200 hover:border-orange-200 transition-colors cursor-pointer group">
                  <CardContent className="p-0 flex h-24">
                    <div className={`w-2 ${getStatusColor(action.status)}`} />
                    <div className="flex-1 p-4 flex items-center justify-between">
                      <div className="flex gap-4 items-center">
                        <div className="flex flex-col items-center justify-center bg-slate-50 rounded-lg p-2 min-w-[60px] border">
                          <span className="text-[10px] uppercase font-bold text-slate-400">
                            {format(parseISO(action.date_planned), 'EEE', { locale: ptBR })}
                          </span>
                          <span className="text-xl font-black text-slate-700 leading-none">
                            {format(parseISO(action.date_planned), 'dd')}
                          </span>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800">{action.name}</span>
                            <Badge variant="outline" className="text-[9px] py-0 h-4 border-slate-300 text-slate-500">
                              {action.category}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {action.responsible_name}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {action.status}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-orange-400 group-hover:translate-x-1 transition-all" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
