import React, { useEffect, useState } from 'react';
import Layout from '../components/layout/Layout';
import { useAuth } from '../contexts/AuthContext';
import { 
  collection, 
  query, 
  onSnapshot, 
  orderBy, 
  doc, 
  setDoc,
  addDoc,
  deleteDoc,
  where,
  getDocs
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Search, 
  Plus, 
  Building, 
  Mail, 
  Phone, 
  MapPin, 
  FileText, 
  Clock, 
  ChevronRight, 
  Edit3, 
  Trash2,
  Calendar,
  X,
  UserCheck,
  Check,
  Briefcase,
  ExternalLink,
  ChevronDown,
  FileCheck
} from 'lucide-react';
import { Customer } from '../types';

export default function Clientes() {
  const { profile } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [customerOrders, setCustomerOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Form states
  const [cnpj, setCnpj] = useState('');
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [clientCode, setClientCode] = useState('');
  const [address, setAddress] = useState('');

  // 1. Subscribe to customers list
  useEffect(() => {
    const q = query(collection(db, 'customers'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Customer[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as Customer);
      });
      setCustomers(list);
    }, (error) => {
      console.error("Error fetching customers:", error);
      toast.error("Erro ao carregar clientes do banco de dados.");
    });
    return unsubscribe;
  }, []);

  // 2. Fetch selected customer's orders/negotiatives
  useEffect(() => {
    if (!selectedCustomer) {
      setCustomerOrders([]);
      return;
    }
    const fetchOrders = async () => {
      setLoadingOrders(true);
      try {
        const indicationsRef = collection(db, 'indications');
        // We look up either by CNPJ (if registered) or by client name or email Match
        let q = query(indicationsRef, where('client_cnpj', '==', selectedCustomer.cnpj));
        let querySnapshot = await getDocs(q);
        
        let ordersList: any[] = [];
        querySnapshot.forEach((docSnap) => {
          ordersList.push({ id: docSnap.id, ...docSnap.data() });
        });

        // Fallback or union search by client name
        if (ordersList.length === 0 && selectedCustomer.name) {
          const qName = query(indicationsRef, where('client_name', '==', selectedCustomer.name));
          const nameSnap = await getDocs(qName);
          nameSnap.forEach((docSnap) => {
            if (!ordersList.some(o => o.id === docSnap.id)) {
              ordersList.push({ id: docSnap.id, ...docSnap.data() });
            }
          });
        }

        // Sort orders descending by date
        ordersList.sort((a, b) => {
          const dateA = a.created_at || a.sale_order_date || '';
          const dateB = b.created_at || b.sale_order_date || '';
          return dateB.localeCompare(dateA);
        });

        setCustomerOrders(ordersList);
      } catch (err) {
        console.error("Error fetching user purchases:", err);
      } finally {
        setLoadingOrders(false);
      }
    };
    fetchOrders();
  }, [selectedCustomer]);

  // Handle Edit click
  const handleEditClick = (cust: Customer) => {
    setSelectedCustomer(cust);
    setCnpj(cust.cnpj || '');
    setName(cust.name || '');
    setCompanyName(cust.company_name || '');
    setEmail(cust.email || '');
    setPhone(cust.phone || '');
    setClientCode(cust.client_code || '');
    setAddress(cust.address || '');
    setIsEditing(true);
    setIsAdding(false);
  };

  // Handle Add click
  const handleAddNewClick = () => {
    setCnpj('');
    setName('');
    setCompanyName('');
    setEmail('');
    setPhone('');
    setClientCode('');
    setAddress('');
    setIsAdding(true);
    setIsEditing(false);
  };

  // Submit hander
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Nome do cliente é obrigatório!');
      return;
    }

    try {
      if (isAdding) {
        // Create unique ID based on cleaned CNPJ or random
        const cleanedCnpj = cnpj.replace(/\D/g, '');
        const custId = cleanedCnpj || `CUST_${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
        
        const newCustomer: Omit<Customer, 'id'> = {
          cnpj: cleanedCnpj,
          name: name.trim(),
          company_name: companyName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          client_code: clientCode.trim(),
          address: address.trim(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        await setDoc(doc(db, 'customers', custId), newCustomer);
        toast.success('Cliente cadastrado com sucesso!');
        setIsAdding(false);
        // Select newly registered client
        setSelectedCustomer({ id: custId, ...newCustomer } as Customer);
      } else if (isEditing && selectedCustomer) {
        const cleanedCnpj = cnpj.replace(/\D/g, '');
        const updatedCust: Partial<Customer> = {
          cnpj: cleanedCnpj,
          name: name.trim(),
          company_name: companyName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          client_code: clientCode.trim(),
          address: address.trim(),
          updated_at: new Date().toISOString()
        };

        await setDoc(doc(db, 'customers', selectedCustomer.id), updatedCust, { merge: true });
        toast.success('Dados do cliente atualizados com sucesso!');
        setIsEditing(false);
        setSelectedCustomer({ ...selectedCustomer, ...updatedCust } as Customer);
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Erro ao salvar cliente: ' + err.message);
    }
  };

  // Delete customer handler
  const handleDeleteCustomer = async (cust: Customer) => {
    if (!window.confirm(`Deseja realmente excluir o cadastro de ${cust.name}?Esta ação é irreversível.`)) return;
    try {
      await deleteDoc(doc(db, 'customers', cust.id));
      toast.success('Cadastro do cliente deletado.');
      if (selectedCustomer?.id === cust.id) {
        setSelectedCustomer(null);
      }
    } catch (err: any) {
      toast.error('Erro ao deletar cliente: ' + err.message);
    }
  };

  // Filter list
  const filteredCustomers = customers.filter(cust => {
    const qString = searchQuery.toLowerCase();
    return (
      (cust.name || '').toLowerCase().includes(qString) ||
      (cust.company_name || '').toLowerCase().includes(qString) ||
      (cust.cnpj || '').toLowerCase().includes(qString) ||
      (cust.client_code || '').toLowerCase().includes(qString) ||
      (cust.email || '').toLowerCase().includes(qString)
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sold':
        return <Badge className="bg-emerald-500 text-white border-none py-0.5 px-2 font-black uppercase text-[8px]">Vendido</Badge>;
      case 'negotiating':
        return <Badge className="bg-indigo-500 text-white border-none py-0.5 px-2 font-black uppercase text-[8px]">Negociando</Badge>;
      case 'in_progress':
        return <Badge className="bg-sky-500 text-white border-none py-0.5 px-2 font-black uppercase text-[8px]">Em Triagem</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500 text-white border-none py-0.5 px-2 font-black uppercase text-[8px]">Cancelado</Badge>;
      default:
        return <Badge className="bg-slate-500 text-white border-none py-0.5 px-2 font-black uppercase text-[8px]">{status}</Badge>;
    }
  };

  return (
    <Layout>
      <div className="h-full flex flex-col gap-6" id="comercial-clientes-view">
        {/* Page Title Header */}
        <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest font-black italic text-primary leading-none mb-1">Setor Comercial</p>
              <h2 className="text-xl font-black italic uppercase tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">
                Central de Clientes Cadastrados
              </h2>
            </div>
          </div>
          <Button onClick={handleAddNewClick} size="sm" className="gap-2 font-black uppercase italic text-xs tracking-wider h-10 px-4 rounded-xl shadow-lg shadow-primary/15 transition-all active:scale-95">
            <Plus className="h-4 w-4" /> Registrar Cliente
          </Button>
        </div>

        {/* Workspace Body Grid */}
        <div className="flex-1 grid grid-cols-12 gap-6 overflow-hidden min-h-0">
          
          {/* LEFT COLUMN: Customer Selection List */}
          <div className="col-span-5 flex flex-col gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 overflow-hidden h-full shadow-sm">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="BUSCAR POR NOME, CNPJ, OU CÓDIGO DO CLIENTE..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-9 font-bold text-xs h-10 uppercase bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-full hover:bg-muted"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {filteredCustomers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground opacity-60">
                  <Users className="h-10 w-10 mb-2 stroke-1" />
                  <p className="text-xs font-black uppercase tracking-widest">Nenhum cliente localizado</p>
                </div>
              ) : (
                filteredCustomers.map((cust) => {
                  const isSelected = selectedCustomer?.id === cust.id;
                  return (
                    <div 
                      key={cust.id}
                      onClick={() => {
                        setSelectedCustomer(cust);
                        setIsEditing(false);
                        setIsAdding(false);
                      }}
                      className={`group p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                        isSelected 
                          ? 'bg-primary/5 border-primary shadow-sm' 
                          : 'bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 border-slate-150 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold leading-none shrink-0 ${
                          isSelected ? 'bg-primary text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}>
                          {cust.name.split(' ').map(q => q[0]).slice(0,2).join('').toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-black uppercase truncate text-slate-800 dark:text-slate-100 leading-tight">
                            {cust.name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {cust.cnpj && (
                              <span className="text-[9px] font-bold text-muted-foreground font-mono">
                                CNPJ: {cust.cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5")}
                              </span>
                            )}
                            <span className="text-[10px] text-muted-foreground font-black uppercase">•</span>
                            {cust.client_code && (
                              <span className="text-[9px] font-black text-primary uppercase bg-primary/5 px-1 py-0.5 rounded">
                                COD: {cust.client_code}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 transition-all shrink-0" />
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Customer Details / Actions Card */}
          <div className="col-span-7 flex flex-col bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden h-full shadow-sm">
            
            {/* Adding/Editing Customer Form view */}
            {isAdding || isEditing ? (
              <form onSubmit={handleSubmit} className="flex-1 flex flex-col bg-white dark:bg-slate-900 justify-between h-full p-6">
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-150 pb-3">
                    <h3 className="text-sm font-black italic uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <Edit3 className="h-4 w-4 text-primary" /> {isAdding ? 'Registrar Novo Cliente' : 'Editar Cadastro de Cliente'}
                    </h3>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      onClick={() => {
                        setIsAdding(false);
                        setIsEditing(false);
                      }}
                      className="h-8 w-8 p-0 hover:bg-slate-100 rounded-full"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5 col-span-2">
                      <Label className="text-[9px] font-black uppercase text-muted-foreground">Nome Completo / Razão Social</Label>
                      <Input 
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                        placeholder="EX: ECOZIMA LTDA" 
                        required
                        className="font-bold text-xs uppercase"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-[9px] font-black uppercase text-muted-foreground">CNPJ / CPF</Label>
                      <Input 
                        value={cnpj} 
                        onChange={(e) => setCnpj(e.target.value.replace(/\D/g, ''))} 
                        placeholder="Apenas números"
                        className="font-mono text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-[9px] font-black uppercase text-muted-foreground">Código Interno ERP</Label>
                      <Input 
                        value={clientCode} 
                        onChange={(e) => setClientCode(e.target.value)} 
                        placeholder="EX: 3290" 
                        className="font-bold text-xs uppercase"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-[9px] font-black uppercase text-muted-foreground">Nome Fantasia / Empresa</Label>
                      <Input 
                        value={companyName} 
                        onChange={(e) => setCompanyName(e.target.value)} 
                        placeholder="EX: ECOZIMA" 
                        className="font-bold text-xs uppercase"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-[9px] font-black uppercase text-muted-foreground">Telefone de Contato</Label>
                      <Input 
                        value={phone} 
                        onChange={(e) => setPhone(e.target.value)} 
                        placeholder="EX: 19998123456" 
                        className="font-bold text-xs"
                      />
                    </div>

                    <div className="space-y-1.5 col-span-2">
                      <Label className="text-[9px] font-black uppercase text-muted-foreground">E-mail</Label>
                      <Input 
                        type="email"
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        placeholder="cliente@email.com" 
                        className="font-bold text-xs"
                      />
                    </div>

                    <div className="space-y-1.5 col-span-2">
                      <Label className="text-[9px] font-black uppercase text-muted-foreground">Endereço Completo</Label>
                      <Input 
                        value={address} 
                        onChange={(e) => setAddress(e.target.value)} 
                        placeholder="Rua, Número, Bairro, Cidade - UF" 
                        className="font-semibold text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 border-t border-slate-100 pt-4 mt-6">
                  <Button 
                    type="submit" 
                    className="flex-1 font-black uppercase italic tracking-wider h-10 select-none bg-primary"
                  >
                    Confirmar e Salvar cadastro
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setIsAdding(false);
                      setIsEditing(false);
                    }}
                    className="border-slate-200 text-slate-500 font-bold max-w-[120px] uppercase h-10"
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            ) : selectedCustomer ? (
              
              /* Customer Dashboard display */
              <div className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Header card info */}
                <div className="p-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[9px] font-black bg-primary/10 text-primary dark:text-orange-400 uppercase py-0.5 px-2 rounded-full leading-none mb-2 inline-block">
                        {selectedCustomer.client_code ? `CLIENTE COD: ${selectedCustomer.client_code}` : 'CLIENTE REGISTRADO'}
                      </span>
                      <h3 className="text-lg font-black uppercase leading-tight text-slate-950 dark:text-slate-100">{selectedCustomer.name}</h3>
                      {selectedCustomer.company_name && (
                        <p className="text-xs text-muted-foreground font-semibold uppercase mt-0.5 tracking-wide flex items-center gap-1">
                          <Building className="h-3 w-3 inline text-slate-400" /> {selectedCustomer.company_name}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button onClick={() => handleEditClick(selectedCustomer)} variant="outline" size="sm" className="h-9 gap-2 border-slate-200 text-slate-600 dark:text-slate-200">
                        <Edit3 className="h-3.5 w-3.5" /> Editar
                      </Button>
                      <Button onClick={() => handleDeleteCustomer(selectedCustomer)} variant="ghost" size="sm" className="h-9 gap-2 text-red-500 hover:bg-red-500/10">
                        <Trash2 className="h-3.5 w-3.5" /> Excluir
                      </Button>
                    </div>
                  </div>

                  {/* Core Properties Row */}
                  <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <div className="space-y-3">
                      {selectedCustomer.cnpj && (
                        <p className="text-slate-600 dark:text-slate-300 font-semibold truncate leading-none">
                          <strong className="text-[10px] block text-muted-foreground font-black uppercase mb-0.5">CNPJ / CPF</strong>
                          {selectedCustomer.cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5")}
                        </p>
                      )}
                      
                      {selectedCustomer.email && (
                        <p className="text-slate-600 dark:text-slate-300 font-semibold truncate">
                          <strong className="text-[10px] block text-muted-foreground font-black uppercase mb-0.5">Email cadastrado</strong>
                          <span className="flex items-center gap-1.5">
                            <Mail className="h-3 w-3 text-slate-400" /> {selectedCustomer.email}
                          </span>
                        </p>
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      {selectedCustomer.phone && (
                        <p className="text-slate-600 dark:text-slate-300 font-semibold truncate">
                          <strong className="text-[10px] block text-muted-foreground font-black uppercase mb-0.5">WhatsApp / Telefone</strong>
                          <span className="flex items-center gap-1.5">
                            <Phone className="h-3 w-3 text-slate-400" /> {selectedCustomer.phone}
                          </span>
                        </p>
                      )}

                      {selectedCustomer.address && (
                        <p className="text-slate-600 dark:text-slate-300 font-semibold truncate" title={selectedCustomer.address}>
                          <strong className="text-[10px] block text-muted-foreground font-black uppercase mb-0.5">Endereço</strong>
                          <span className="flex items-center gap-1.5">
                            <MapPin className="h-3 w-3 text-slate-400 shrink-0" /> {selectedCustomer.address}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* HISTORICAL PURCHASES TABLE (relatórios de pedidos do cliente) */}
                <div className="flex-1 flex flex-col overflow-hidden p-6 mt-2">
                  <div className="flex items-center justify-between mb-3 shrink-0">
                    <h4 className="text-[10px] font-black italic uppercase text-slate-600 dark:text-slate-300 tracking-widest flex items-center gap-2">
                      <FileCheck className="h-3.5 w-3.5 text-primary" /> Relatório Histórico de Pedidos / Negociações
                    </h4>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase">{customerOrders.length} registros associados</span>
                  </div>

                  <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl relative">
                    {loadingOrders ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/70 dark:bg-slate-900/70">
                        <p className="text-xs font-black uppercase text-primary animate-pulse">Carregando histórico...</p>
                      </div>
                    ) : customerOrders.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground opacity-60">
                        <FileText className="h-10 w-10 mb-2 text-slate-300 stroke-1" />
                        <p className="text-xs font-black uppercase tracking-widest">Nenhum pedido atrelado a este cliente</p>
                        <p className="text-[10px] text-muted-foreground/80 lowercase mt-1 w-64 text-center">Quando pedidos de venda forem anexados com o CNPJ deste cliente, eles aparecerão aqui automaticamente.</p>
                      </div>
                    ) : (
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase font-bold text-[9px] tracking-wider">
                            <th className="px-4 py-2 border-b border-slate-200 dark:border-slate-700 w-32">Pedido/Data</th>
                            <th className="px-4 py-2 border-b border-slate-200 dark:border-slate-700">Equipamento/Produtos</th>
                            <th className="px-4 py-2 border-b border-slate-200 dark:border-slate-700 w-24">Valor Gross</th>
                            <th className="px-4 py-2 border-b border-slate-200 dark:border-slate-700 w-24">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {customerOrders.map((ord) => {
                            const dateValue = ord.sale_order_date || ord.sale_date || ord.created_at || '';
                            const displayDate = dateValue ? dateValue.split('T')[0].split('-').reverse().join('/') : '-';
                            return (
                              <tr key={ord.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                                <td className="px-4 py-3 min-w-[125px]">
                                  <p className="font-extrabold text-slate-900 dark:text-slate-100">
                                    {ord.sale_order_number ? `#${ord.sale_order_number}` : 'N/D'}
                                  </p>
                                  <p className="text-[9px] text-muted-foreground font-mono mt-0.5">{displayDate}</p>
                                </td>
                                <td className="px-4 py-3">
                                  <p className="font-bold text-slate-800 dark:text-slate-200 leading-tight">
                                    {ord.equipment_name || 'Equipamento não especificado'}
                                  </p>
                                  {ord.commissioned_products && ord.commissioned_products.length > 0 && (
                                    <p className="text-[9px] text-slate-400 mt-1 uppercase italic leading-none">
                                      {ord.commissioned_products.map((p: any) => `${p.quantity}x ${p.name || p.code}`).join(', ')}
                                    </p>
                                  )}
                                </td>
                                <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-slate-100">
                                  {ord.gross_budget_value ? ord.gross_budget_value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}
                                </td>
                                <td className="px-4 py-3">
                                  {getStatusBadge(ord.status)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-32 text-muted-foreground opacity-60">
                <Users className="h-16 w-16 mb-4 stroke-[1.25] text-primary" />
                <p className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-300">Nenhum cliente selecionado</p>
                <p className="text-xs text-muted-foreground/80 mt-1 max-w-[280px] text-center">Selecione um cliente na lista à esquerda para acessar seus detalhes cadastrais e histórico de faturamento.</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </Layout>
  );
}

// Inline badge mock for quick build
function Badge({ children, className, title }: { children: React.ReactNode; className?: string; title?: string }) {
  return (
    <span 
      title={title}
      className={`inline-flex items-center rounded-sm border px-1.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${className}`}
    >
      {children}
    </span>
  );
}
