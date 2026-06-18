export type ActionStatus = 'Planejada' | 'Em andamento' | 'Concluída' | 'Cancelada';
export type ActionCategory = 'Dia da Cultura' | 'Aniversariantes' | 'Datas comemorativas' | 'Treinamentos' | 'Campanhas internas' | 'Integração' | 'Reconhecimento' | 'Saúde e Bem-estar' | 'Outros';
export type AssetCategory = 'Material' | 'Alimentação' | 'Estrutura' | 'Serviços' | 'Diversos';
export type ResponsibleArea = 'RH' | 'Marketing' | 'Compartilhado';

export interface EndomarketingAction {
  id?: string;
  name: string;
  category: ActionCategory;
  objective: string;
  description: string;
  responsible_name: string;
  responsible_area: ResponsibleArea;
  date_planned: string;
  date_realized?: string;
  status: ActionStatus;
  target_audience: string;
  participants_planned: number;
  participants_actual: number;
  budget_planned: number;
  budget_actual: number;
  created_at: string;
  updated_at: string;
}

export interface FinancialItem {
  id?: string;
  description: string;
  category: AssetCategory;
  value: number;
  supplier?: string;
  cost_center?: string;
  notes?: string;
}

export interface ActionEvidence {
  id?: string;
  name: string;
  type: string;
  url: string;
  created_at: string;
}
