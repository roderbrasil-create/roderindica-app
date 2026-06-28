export type UserRole = 'admin' | 'manager' | 'internal_seller' | 'triagem' | 'external_seller' | 'financial' | 'marketing' | 'fiscal' | 'vendedor_padrao';
export type UserStatus = 'active' | 'inactive' | 'blocked';
export type IndicationStatus = 'pending' | 'triagem' | 'negotiating' | 'sold' | 'archived' | 'cancelled';
export type CommissionStatus = 'pending' | 'waiting_nf' | 'waiting_payment' | 'paid';

export interface UserProfile {
  uid: string;
  name: string;
  email?: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  commission_rate?: number;
  assigned_regions?: string[]; // states like 'PR', 'SC', 'RS'
  monthly_salary?: number;
  pix_key?: string;
  bank_info?: {
    bank: string;
    agency: string;
    account: string;
  };
  cpf_cnpj?: string;
  company_name?: string;
  city?: string;
  state?: string;
  is_icms_contributor?: boolean;
  is_lead_receiver?: boolean;
  is_commissionable?: boolean;
  vacation_start?: string;
  vacation_end?: string;
  contract_accepted?: boolean;
  contract_accepted_at?: string;
  sidebar_order?: string[];
  created_at: string;
  updated_at?: string;
  permissions?: {
    sidebar?: {
      [key: string]: boolean;
    };
    dashboard_cards?: {
      [key: string]: boolean;
    };
  };
}

export interface IndicationItem {
  id?: string;
  product_name: string;
  quantity: number;
  price?: number;
  code?: string;
}

export interface IndicationOptions {
  complete_installation: boolean;
  kit_hydraulic: boolean;
  only_equipment: boolean;
  with_freight: boolean;
}

export interface Indication {
  id: string;
  external_seller_uid: string;
  external_seller_name?: string;
  internal_seller_uid?: string;
  internal_seller_name?: string;
  internal_seller_email?: string;
  
  // Standard Seller (Vendedor Padrão) fields
  standard_seller_uid?: string;
  standard_seller_name?: string;
  standard_seller_commission_rate?: number;
  standard_seller_commission_enabled?: boolean;
  standard_seller_commission_value?: number;

  client_name: string;
  client_cnpj?: string;
  client_person_name?: string;
  client_phone: string;
  client_email?: string;
  client_location?: string;
  is_icms_contributor?: boolean;
  base_machine: string;
  machine_details?: string;
  items?: IndicationItem[];
  options?: IndicationOptions;
  description: string;
  audio_transcription?: string;
  media_urls: string[];
  internal_media_urls?: string[];
  
  // Negotiation History & Timeline
  negotiation_history?: {
    id: string;
    type: 'note' | 'whatsapp' | 'system' | 'status_change' | 'call' | 'meeting' | 'new_quote' | 'discount' | 'sold';
    content: string;
    author_name: string;
    created_at: string;
    attachments?: { name: string; url: string }[];
  }[];
  
  budget_sent_at?: string; // To track the 30-day validity
  reactivated_at?: string;
  cancellation_reason?: string;
  cancellation_details?: string;
  
  status: IndicationStatus;
  budget_pdf_url?: string;
  budget_pdf_urls?: string[];
  budget_loaded?: boolean;
  budget_number?: string;
  budget_date?: string;
  budget_commissionable_value?: number;
  gross_budget_value?: number;
  sale_value?: number;
  commission_value?: number;
  commission_rate_applied?: number;
  protection_expires_at?: string;
  commissioned_products?: {
    code: string;
    name: string;
    quantity: number;
    base_value: number;
    is_commissionable?: boolean;
  }[];
  base_commission_value?: number;
  discount_percentage?: number;
  sale_date?: string;
  client_address?: string;
  client_company_name?: string;
  client_code?: string;
  sale_order_number?: string;
  sale_order_date?: string;
  is_duplicate?: boolean;
  duplicate_reason?: string;
  duplicate_details?: string;
  duplicate_proof_url?: string;
  external_crm_source?: string;
  external_crm_id?: string;
  invoice_pdf_url?: string;
  sales_order_pdf_url?: string;
  delivery_date?: string;
  fair_lead_id?: string;
  ai_score?: string;
  source?: string;
  lead_type?: string;
  type?: string;
  is_deleted?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Commission {
  id: string;
  indication_id: string;
  external_seller_uid: string;
  external_seller_name?: string;
  value: number;
  base_value_used?: number;
  discount_applied?: number;
  rate_applied?: number;
  status: CommissionStatus;
  month: number;
  year: number;
  nf_url?: string;
  payment_receipt_url?: string;
  paid_at?: string;
  created_at: string;
}

export interface MonthlyStatement {
  id: string; // sellerUid_month_year
  seller_uid: string;
  seller_name: string;
  month: number;
  year: number;
  total_value: number;
  status: 'waiting_nf' | 'waiting_payment' | 'paid';
  nf_url?: string;
  payment_receipt_url?: string;
  paid_at?: string;
  commission_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface ProductModel {
  id: string;
  name: string;
  base_value?: number;
  pdf_url?: string;
  parts_manual_url?: string;
  video_url?: string;
  images?: string[];
  technical_specs?: {
    // Garra Florestal
    area_carga?: string;
    diametro_minimo?: string;
    abertura_maxima?: string;
    peso?: string;
    pressao_trabalho?: string;
    maquina_base?: string;
    // Cabeçote Multifuncional
    diametro_corte?: string;
    sabre?: string;
    corrente?: string;
    vazao?: string;
    pressao?: string;
    peso_operacional?: string;
    motor?: string;
    giro_360?: string;
  };
  technical_sheet_image?: string;
  image_zoom?: number;
  productivity_text?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  image_url: string;
  image_zoom?: number;
  video_url?: string;
  pdf_url?: string;
  is_blocked: boolean;
  show_banner?: boolean;
  is_banner?: boolean;
  banner_message?: string;
  parts_manual_url?: string;
  models?: ProductModel[];
  sort_order?: number;
  created_at: string;
}

export interface RegisteredProduct {
  id: string;
  code: string;
  name: string;
  base_price: number;
  category: string;
  is_commissionable: boolean;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Accessory {
  id: string;
  brand: string;
  model: string;
  pin: string;
  ponteira_biela_4?: string;
  ponteira_biela_6?: string;
  suporte_destocador?: string;
  suporte_triturador?: string;
  link_garra_biela_6?: string;
  link_garra_biela_4?: string;
  photo_urls?: {
    ponteira?: string;
    suporte?: string;
    link?: string;
  };
  created_at: string;
}

export interface InstallationKitItem {
  code: string;
  quantity: number;
  description: string;
}

export interface InstallationKit {
  id: string;
  code: string;
  description: string;
  items: InstallationKitItem[];
  photo_url?: string;
  created_at: string;
}

export interface StockItem {
  id: string;
  code: string; // Padrão Roder 0000.0000.0000.0000
  description: string;
  quantity: number;
  source: 'roder' | 'fae' | 'accessories' | 'manual' | 'sinop_pdf' | string;
  updated_at: string;
  branch?: 'matriz' | 'sinop' | string;
}

export interface StockSale {
  id: string;
  stock_item_id: string;
  item_code: string;
  item_description: string;
  quantity_sold: number;
  seller_uid: string;
  seller_name: string;
  client_name?: string;
  client_cnpj?: string;
  observation?: string;
  branch?: 'matriz' | 'sinop' | string;
  created_at: any;
  is_import_fae?: boolean;
  stock_imports_fae_id?: string;
}

export interface StockReservation {
  id: string;
  stock_item_id: string;
  item_code: string;
  item_description: string;
  quantity_reserved: number;
  seller_uid: string;
  seller_name: string;
  seller_state?: string;
  client_name: string;
  client_cnpj?: string;
  client_location?: string;
  observation?: string;
  status: 'active' | 'converted' | 'cancelled';
  branch?: 'matriz' | 'sinop' | string;
  expires_at?: any;
  created_at: any;
  is_external?: boolean;
  is_import_fae?: boolean;
  stock_imports_fae_id?: string;
}

export interface StockImportFAE {
  id: string;
  code?: string;
  description: string;
  quantity: number;
  embarque: string;
  chegada: string;
  created_at: any;
  updated_at?: any;
}

export interface Fair {
  id: string;
  name: string;
  logo_url?: string;
  start_date: string;
  end_date: string;
  location: string;
  map_url?: string;
  map_image_url?: string;
  map_info?: string;
  checklist?: {
    area: boolean;
    assembly: boolean;
    beverages: boolean;
    cleaning: boolean;
    internet: boolean;
    catering: boolean;
    marketing_material: boolean;
  };
  status: 'planning' | 'active' | 'completed';
  created_at: string;
}

export interface FairChecklistItem {
  id: string;
  fair_id: string;
  label: string;
  completed: boolean;
  created_at: string;
}

export interface FairChecklistTemplate {
  id: string;
  label: string;
  created_at: string;
}

export interface FairLead {
  id: string;
  fair_id: string;
  type: 'client' | 'partner' | 'supplier';
  name: string;
  email: string;
  phone: string;
  country_code: string;
  cnpj?: string;
  cpf?: string;
  company?: string;
  city?: string;
  state?: string;
  interest_products: string[];
  observations: string;
  ai_score: 'hot' | 'warm' | 'cold' | 'pending';
  ai_reason?: string;
  salesperson_uid: string;
  salesperson_name: string;
  photos: string[];
  status: 'pending' | 'forwarded' | 'converted' | 'discarded';
  assigned_to_uid?: string;
  assigned_to_name?: string;
  created_at: string;
  updated_at: string;
}

export interface FairExpense {
  id: string;
  fair_id: string;
  category: string;
  amount: number;
  description: string;
  vendor_name: string;
  contract_url?: string;
  payment_proof_url?: string;
  date: string;
  created_at: string;
}

export interface FairAsset {
  id: string;
  fair_id: string;
  name: string;
  url: string;
  type: 'image' | 'document';
  created_at: string;
}

export interface Customer {
  id: string;
  cnpj: string;
  name: string;
  company_name?: string;
  email?: string;
  phone?: string;
  client_code?: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

