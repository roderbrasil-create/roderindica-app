
export interface PartnerData {
  nome: string;
  documento: string;
  relacionamento: string;
  capital_percentual?: string;
  cargo?: string;
  data_entrada?: string;
  endereco?: string;
  outras_empresas?: string[];
}

export interface CnpjData {
  cnpj: string;
  razao_social: string;
  nome_fantasia: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cep: string;
  municipio: string;
  uf: string;
  email?: string;
  telefone?: string;
  situacao_cadastral?: string;
  data_abertura?: string;
  capital_social?: number;
  natureza_juridica?: string;
  is_icms_contributor?: boolean;
  cnae_principal_descricao?: string;
  socios?: PartnerData[];
}

export async function fetchCnpjData(cnpj: string): Promise<CnpjData | null> {
  const rawCnpj = cnpj.replace(/\D/g, '');
  if (rawCnpj.length !== 14) return null;

  // Try BrasilAPI first (usually fastest and most complete)
  try {
    const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${rawCnpj}`);
    if (response.ok) {
      const data = await response.json();
      
      const parsedSocios: PartnerData[] = (data.qsa || []).map((s: any) => {
        // Format document
        let docStr = s.cnpj_cpf_do_socio || s.cpf || '';
        if (docStr && !docStr.includes('*') && docStr.length === 11) {
          docStr = `${docStr.slice(0, 3)}.${docStr.slice(3, 6)}.${docStr.slice(6, 9)}-${docStr.slice(9)}`;
        } else if (docStr && !docStr.includes('*') && docStr.length === 14) {
          docStr = `${docStr.slice(0, 2)}.${docStr.slice(2, 5)}.${docStr.slice(5, 8)}/${docStr.slice(8, 12)}-${docStr.slice(12)}`;
        }
        
        return {
          nome: s.nome_socio || s.nome || 'SÓCIO NÃO IDENTIFICADO',
          documento: docStr,
          relacionamento: s.qualificacao_socio || s.qualificacao || 'Sócio',
          capital_percentual: s.percentual_capital_social ? `${s.percentual_capital_social}%` : undefined,
          cargo: s.qualificacao_socio || 'Sócio',
          data_entrada: s.data_entrada_sociedade || undefined
        };
      });

      return {
        cnpj: data.cnpj,
        razao_social: data.razao_social,
        nome_fantasia: data.nome_fantasia || data.razao_social,
        logradouro: data.logradouro,
        numero: data.numero,
        complemento: data.complemento,
        bairro: data.bairro,
        cep: data.cep,
        municipio: data.municipio,
        uf: data.uf,
        email: data.email,
        telefone: data.ddd_telefone_1 || data.telefone,
        situacao_cadastral: data.descricao_situacao_cadastral,
        data_abertura: data.data_inicio_atividade,
        capital_social: data.capital_social,
        natureza_juridica: data.natureza_juridica,
        is_icms_contributor: data.descricao_situacao_cadastral === 'ATIVA', // Simple heuristic for now
        cnae_principal_descricao: data.cnae_fiscal_descricao || data.cnae_principal_descricao, // BrasilAPI often uses cnae_fiscal_descricao
        socios: parsedSocios
      };
    }
  } catch (error) {
    console.error('BrasilAPI error:', error);
  }

  // Fallback to CNPJ.ws
  try {
    const response = await fetch(`https://publica.cnpj.ws/cnpj/${rawCnpj}`);
    if (response.ok) {
      const data = await response.json();
      
      const parsedSocios: PartnerData[] = (data.socios || []).map((s: any) => {
        let docStr = s.cnpj_cpf_do_socio || s.cpf || '';
        if (docStr && !docStr.includes('*') && docStr.length === 11) {
          docStr = `${docStr.slice(0, 3)}.${docStr.slice(3, 6)}.${docStr.slice(6, 9)}-${docStr.slice(9)}`;
        }
        return {
          nome: s.nome || 'SÓCIO NÃO IDENTIFICADO',
          documento: docStr,
          relacionamento: s.qualificacao_socio?.descricao || s.tipo_socio || 'Sócio',
          data_entrada: s.data_entrada_sociedade || undefined
        };
      });

      return {
        cnpj: data.cnpj_raiz + data.cnpj_ordem + data.cnpj_dv,
        razao_social: data.razao_social,
        nome_fantasia: data.estabelecimento.nome_fantasia || data.razao_social,
        logradouro: data.estabelecimento.logradouro,
        numero: data.estabelecimento.numero,
        complemento: data.estabelecimento.complemento,
        bairro: data.estabelecimento.bairro,
        cep: data.estabelecimento.cep,
        municipio: data.estabelecimento.cidade.nome,
        uf: data.estabelecimento.estado.sigla,
        email: data.estabelecimento.email,
        telefone: `(${data.estabelecimento.ddd1}) ${data.estabelecimento.telefone1}`,
        situacao_cadastral: data.estabelecimento.situacao_cadastral,
        data_abertura: data.estabelecimento.data_inicio_atividade || data.estabelecimento.data_abertura,
        socios: parsedSocios
      };
    }
  } catch (error) {
    console.error('CNPJ.ws error:', error);
  }

  // Final fallback to ReceitaWS (limited to 3 req/min)
  try {
    const response = await fetch(`https://receitaws.com.br/v1/cnpj/${rawCnpj}`);
    if (response.ok) {
      const data = await response.json();
      if (data.status !== 'ERROR') {
        
        const parsedSocios: PartnerData[] = (data.qsa || []).map((s: any) => ({
          nome: s.nome || 'SÓCIO NÃO IDENTIFICADO',
          documento: '',
          relacionamento: s.qual || 'Sócio'
        }));

        return {
          cnpj: data.cnpj.replace(/\D/g, ''),
          razao_social: data.nome,
          nome_fantasia: data.fantasia || data.nome,
          logradouro: data.logradouro,
          numero: data.numero,
          complemento: data.complemento,
          bairro: data.bairro,
          cep: data.cep.replace(/\D/g, ''),
          municipio: data.municipio,
          uf: data.uf,
          email: data.email,
          telefone: data.telefone,
          situacao_cadastral: data.situacao,
          data_abertura: data.abertura,
          socios: parsedSocios
        };
      }
    }
  } catch (error) {
    console.error('ReceitaWS error:', error);
  }

  return null;
}
