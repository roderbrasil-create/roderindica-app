import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Indication } from '../types';

interface NegotiationContextType {
  activeIndication: Indication | null;
  isOpen: boolean;
  activeTab: string;
  openNegotiation: (indication: Indication, tab?: string) => void;
  closeNegotiation: () => void;
  refreshIndication: (indication: Indication) => void;
  isInvoiceDialogOpen: boolean;
  setIsInvoiceDialogOpen: (open: boolean) => void;
  invoiceIndication: Indication | null;
  setInvoiceIndication: (ind: Indication | null) => void;
}

const NegotiationContext = createContext<NegotiationContextType | undefined>(undefined);

export function NegotiationProvider({ children }: { children: ReactNode }) {
  const [activeIndication, setActiveIndication] = useState<Indication | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('commercial');

  // Shared faturamento states
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
  const [invoiceIndication, setInvoiceIndication] = useState<Indication | null>(null);

  const openNegotiation = (indication: Indication, tab?: string) => {
    setActiveIndication(indication);
    if (tab) setActiveTab(tab);
    setIsOpen(true);
  };

  const closeNegotiation = () => {
    setIsOpen(false);
    // We keep the activeIndication for a moment to allow exit animations if needed
  };

  const refreshIndication = (indication: Indication) => {
    setActiveIndication(indication);
  };

  return (
    <NegotiationContext.Provider value={{ 
      activeIndication, 
      isOpen, 
      activeTab, 
      openNegotiation, 
      closeNegotiation, 
      refreshIndication,
      isInvoiceDialogOpen,
      setIsInvoiceDialogOpen,
      invoiceIndication,
      setInvoiceIndication
    }}>
      {children}
    </NegotiationContext.Provider>
  );
}

export function useNegotiation() {
  const context = useContext(NegotiationContext);
  if (context === undefined) {
    throw new Error('useNegotiation must be used within a NegotiationProvider');
  }
  return context;
}
