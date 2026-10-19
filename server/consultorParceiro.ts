// CONSULTOR DO PARCEIRO: link pessoal sem senha e indicação pela conversa.
//
// O parceiro (indicador) recebe um link só dele: roderindica.com/consultor?p=<token>.
// O token mora aqui no servidor (consultor_links/{token}) e aponta para o cadastro dele em users.
// Gerar um novo desliga o anterior. O navegador do parceiro não tem login: tudo que ele faz em
// nome dele (indicar, gerar link para o cliente) passa por estas rotas, que conferem o token.
// Quem está logado no app usa o próprio login (o token do Firebase vale mais que o link).
import crypto from 'crypto';
import {
  PAPEIS_QUE_INDICAM, TOKEN_LINK_VALIDO, lerCidadeUf, primeiroNome, validarCnpj, validarTelefoneBR,
} from '../src/lib/consultorIndicar';

export type Quem = { uid: string; email: string; role: string } | null;

export interface DepsConsultorParceiro {
  db: any;
  quemChama: (req: any) => Promise<Quem>;
  passouLimite: (chave: string, max: number, janelaMs: number) => boolean;
  ipDe: (req: any) => string;
  criarLinkCurto: (uid: string, pid: string, mid: string) => Promise<string | null>;
  enviarEmail?: (to: string, subject: string, html: string) => Promise<any>;
  sincronizarAgendor?: (id: string, dados: any) => Promise<any>;
  agora?: () => Date;
}

// Admin, gerente e triagem (Jeferson, Gislene e Luana): só eles geram o link do parceiro
const GESTAO_LINK = ['admin', 'manager', 'triagem'];
const EQUIPE = ['admin', 'manager', 'triagem', 'internal_seller', 'financial', 'finance', 'fiscal', 'marketing', 'assistant'];
export const LIMITE_DIA = 20;

export const novoToken = () => crypto.randomBytes(24).toString('base64url'); // 32 caracteres

const limpaTexto = (t: any, max: number) => String(t ?? '').replace(/[\u0000-\u001f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
const escHtml = (t: string) => String(t || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function criarRotasConsultorParceiro(deps: DepsConsultorParceiro) {
  const { db, quemChama, passouLimite, ipDe } = deps;
  const agora = () => (deps.agora ? deps.agora() : new Date());

  // ---- link pessoal ----------------------------------------------------------------------
  async function linkDoUsuario(uid: string, regenerar: boolean, criadoPor: string) {
    const userRef = db.collection('users').doc(uid);
    const userSnap = await userRef.get();
    if (!userSnap.exists) return null;
    const u: any = userSnap.data() || {};
    const atual = String(u.consultor_link_token || '');
    if (!regenerar && TOKEN_LINK_VALIDO.test(atual)) {
      const l = await db.collection('consultor_links').doc(atual).get();
      if (l.exists && l.data()?.ativo === true && l.data()?.uid === uid) return { token: atual, nome: u.name || '' };
    }
    const token = novoToken();
    const iso = agora().toISOString();
    const lote = db.batch();
    if (TOKEN_LINK_VALIDO.test(atual)) {
      lote.set(db.collection('consultor_links').doc(atual), { ativo: false, desativado_em: iso }, { merge: true });
    }
    lote.set(db.collection('consultor_links').doc(token), { uid, nome: u.name || '', criado_em: iso, criado_por: criadoPor, ativo: true });
    lote.set(userRef, { consultor_link_token: token, consultor_link_em: iso }, { merge: true });
    await lote.commit();
    return { token, nome: u.name || '' };
  }

  // Dono de um token ativo, com o cadastro ativo. Nulo para desconhecido, desligado ou inativo.
  async function donoDoToken(token: string) {
    if (!TOKEN_LINK_VALIDO.test(token)) return null;
    const l = await db.collection('consultor_links').doc(token).get();
    if (!l.exists) return null;
    const ld: any = l.data() || {};
    if (ld.ativo !== true || !ld.uid) return null;
    const u = await db.collection('users').doc(String(ld.uid)).get();
    if (!u.exists) return null;
    const ud: any = u.data() || {};
    if (ud.status !== 'active' || ud.consultor_link_token !== token) return null;
    return { uid: String(ld.uid), nome: String(ud.name || ''), email: String(ud.email || '').toLowerCase(), role: String(ud.role || 'external_seller') };
  }

  // Quem está pedindo: o login (se houver) vale mais que o link
  async function donoDoPedido(req: any): Promise<{ uid: string; nome: string; email: string; role: string; via: 'login' | 'link' } | { erro: number; msg: string }> {
    const q = await quemChama(req);
    if (q) {
      const u = await db.collection('users').doc(q.uid).get();
      const ud: any = u.exists ? u.data() : null;
      const role = q.role || String(ud?.role || '');
      if (!ud || ud.status !== 'active' || !PAPEIS_QUE_INDICAM.includes(role)) return { erro: 403, msg: 'Seu cadastro não pode fazer indicações por aqui.' };
      return { uid: q.uid, nome: String(ud.name || q.email || ''), email: String(ud.email || q.email || '').toLowerCase(), role, via: 'login' };
    }
    const dono = await donoDoToken(String(req.body?.p || ''));
    if (!dono) return { erro: 401, msg: 'Seu link não vale mais. Peça um novo ao comercial da Roder.' };
    return { ...dono, via: 'link' };
  }

  // POST /api/consultor/links/:uid  { novo?: boolean }  (admin, gerente, triagem)
  async function rotaLink(req: any, res: any) {
    try {
      const q = await quemChama(req);
      if (!q || !GESTAO_LINK.includes(q.role)) return res.status(403).json({ error: 'Só a gestão comercial gera o link do parceiro.' });
      const uid = String(req.params?.uid || '');
      if (!/^[A-Za-z0-9_-]{1,128}$/.test(uid)) return res.status(400).json({ error: 'Usuário inválido.' });
      if (passouLimite(`conslink:${q.uid}`, 60, 60 * 60 * 1000)) return res.status(429).json({ error: 'Muitos pedidos. Espere alguns minutos.' });
      const r = await linkDoUsuario(uid, req.body?.novo === true, q.uid);
      if (!r) return res.status(404).json({ error: 'Usuário não encontrado.' });
      res.json({ ok: true, token: r.token, caminho: `/consultor?p=${r.token}`, nome: r.nome, primeiroNome: primeiroNome(r.nome) });
    } catch {
      res.status(500).json({ error: 'Não consegui gerar o link.' });
    }
  }

  // GET /api/consultor/parceiro/:token  (público: só o nome)
  async function rotaResolver(req: any, res: any) {
    try {
      if (passouLimite(`consparc-ip:${ipDe(req)}`, 40, 15 * 60 * 1000)) return res.status(429).json({ error: 'Muitas tentativas. Espere alguns minutos.' });
      const dono = await donoDoToken(String(req.params?.token || ''));
      if (!dono) return res.status(404).json({ error: 'Link não encontrado.' });
      res.setHeader?.('Cache-Control', 'no-store');
      res.json({ ok: true, nome: dono.nome, primeiroNome: primeiroNome(dono.nome) });
    } catch {
      res.status(500).json({ error: 'Erro ao abrir o link.' });
    }
  }

  // POST /api/consultor/link-cliente  { p?, pid, mid }  -> { codigo }
  async function rotaLinkCliente(req: any, res: any) {
    try {
      if (passouLimite(`conslc-ip:${ipDe(req)}`, 40, 60 * 60 * 1000)) return res.status(429).json({ error: 'Muitos pedidos. Espere alguns minutos.' });
      const dono = await donoDoPedido(req);
      if ('erro' in dono) return res.status(dono.erro).json({ error: dono.msg });
      const pid = String(req.body?.pid || '').slice(0, 80);
      const mid = String(req.body?.mid || '').slice(0, 80);
      if (!/^[A-Za-z0-9_-]{1,80}$/.test(pid) || (mid && !/^[A-Za-z0-9_.-]{1,80}$/.test(mid))) return res.status(400).json({ error: 'Equipamento inválido.' });
      const p = await db.collection('products').doc(pid).get();
      if (!p.exists) return res.status(404).json({ error: 'Equipamento não encontrado.' });
      const codigo = await deps.criarLinkCurto(dono.uid, pid, mid);
      if (!codigo) return res.status(500).json({ error: 'Não consegui gerar o link.' });
      res.json({ ok: true, codigo });
    } catch {
      res.status(500).json({ error: 'Não consegui gerar o link.' });
    }
  }

  // Vendedor regional do estado do cliente (o mesmo que a tela de nova indicação escolhe)
  async function regionalDoEstado(uf: string) {
    try {
      const snap = await db.collection('users').where('role', '==', 'vendedor_padrao').where('status', '==', 'active').get();
      const achado = snap.docs.map((d: any) => ({ uid: d.id, ...(d.data() || {}) })).find((u: any) => Array.isArray(u.assigned_regions) && u.assigned_regions.includes(uf));
      return achado || null;
    } catch { return null; }
  }

  // Equipamento: do catálogo (nome conferido aqui) ou escrito pelo parceiro
  async function equipamentoDe(body: any): Promise<{ nome: string; pid: string; mid: string } | null> {
    const pid = String(body?.equipamento?.pid || '').slice(0, 80);
    const mid = String(body?.equipamento?.mid || '').slice(0, 80);
    const escrito = limpaTexto(body?.equipamento?.nome, 120);
    if (pid && /^[A-Za-z0-9_-]{1,80}$/.test(pid)) {
      const p = await db.collection('products').doc(pid).get();
      if (p.exists) {
        const pd: any = p.data() || {};
        const m = mid ? (pd.models || []).find((x: any) => String(x?.id) === mid) : null;
        const nome = m ? `${pd.name} - ${m.name}` : String(pd.name || escrito);
        return { nome: limpaTexto(nome, 160), pid, mid: m ? mid : '' };
      }
    }
    if (escrito.length < 2) return null;
    return { nome: escrito, pid: '', mid: '' };
  }

  async function avisarGestao(titulo: string, mensagem: string) {
    const snap = await db.collection('users').where('role', 'in', ['admin', 'manager', 'triagem']).get();
    const lote = db.batch();
    const iso = agora().toISOString();
    snap.docs.forEach((d: any) => lote.set(db.collection('notifications').doc(), {
      user_uid: d.id, title: titulo, message: mensagem, link: '/indicacoes', type: 'info', read: false, created_at: iso,
    }));
    await lote.commit();
  }

  // Os mesmos e-mails do envio pelo app (src/services/emailService.ts): gestão e confirmação ao parceiro
  async function enviarEmails(dados: any, dono: { nome: string; email: string }) {
    if (!deps.enviarEmail) return;
    const obrigatorios = ['gislene@roderbrasil.com.br', 'contato@roderbrasil.com.br', 'roderbrasil@gmail.com', 'luana@roderbrasil.com.br'];
    let config: any = {};
    try { const s = await db.collection('settings').doc('notifications').get(); config = s.exists ? (s.data() || {}) : {}; } catch { /* usa o padrão */ }
    const lista = String(Array.isArray(config.manager_emails) ? config.manager_emails.join(',') : (config.manager_emails || ''))
      .split(',').map((e: string) => e.trim()).filter(Boolean);
    for (const e of obrigatorios) if (!lista.map(x => x.toLowerCase()).includes(e)) lista.push(e);
    const corte = dados.client_location.lastIndexOf(' - ');
    const cidade = corte >= 0 ? dados.client_location.slice(0, corte) : dados.client_location;
    const uf = corte >= 0 ? dados.client_location.slice(corte + 3) : '';
    const produto = dados.items?.[0]?.product_name || 'Equipamento';
    const assunto = `🔥 NOVO LEAD CADASTRADO: ${dados.client_name} (via ${dono.nome})`;
    const html = `
      <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #f97316; color: white; padding: 20px; text-align: center;">
          <h2 style="margin: 0; text-transform: uppercase;">Nova Indicação Recebida</h2>
          <p style="margin: 5px 0 0 0; opacity: 0.9;">Um novo negócio foi registrado pela conversa do Consultor Roder por <strong>${escHtml(dono.nome)}</strong></p>
        </div>
        <div style="padding: 24px;">
          <div style="background-color: #fdf2f7; border-left: 4px solid #f97316; padding: 15px; margin-bottom: 20px;">
            <p style="margin: 0; font-weight: bold; color: #7c2d12; font-size: 16px;">CLIENTE: ${escHtml(dados.client_name)}</p>
          </div>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; color: #666; width: 140px;">Origem / Indicador:</td><td style="padding: 8px 0; font-weight: bold; color: #f97316;">${escHtml(dono.nome)}</td></tr>
            <tr><td style="padding: 8px 0; color: #666;">Canal:</td><td style="padding: 8px 0; font-weight: bold;">Conversa do Consultor Roder</td></tr>
            <tr><td style="padding: 8px 0; color: #666;">WhatsApp Cliente:</td><td style="padding: 8px 0; font-weight: bold;">${escHtml(dados.client_phone)}</td></tr>
            <tr><td style="padding: 8px 0; color: #666;">Cidade/UF:</td><td style="padding: 8px 0;">${escHtml(cidade)}/${escHtml(uf)}</td></tr>
            ${dados.client_cnpj ? `<tr><td style="padding: 8px 0; color: #666;">CNPJ:</td><td style="padding: 8px 0;">${escHtml(dados.client_cnpj)}</td></tr>` : ''}
            <tr><td style="padding: 8px 0; color: #666;">Equipamento:</td><td style="padding: 8px 0; color: #f97316; font-weight: bold;">${escHtml(produto)}</td></tr>
          </table>
          <div style="margin-top: 30px; text-align: center;">
            <a href="https://roderindica.roderbrasil.com.br/triagem" style="background-color: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">ACESSAR TRIAGEM NO SISTEMA</a>
          </div>
        </div>
      </div>`;
    const envios: Promise<any>[] = lista.map(e => deps.enviarEmail!(e, assunto, html));
    if (dono.email && dono.email.includes('@') && !dono.email.endsWith('@mobile.roder.com.br') && config.confirmation_partner !== false) {
      const htmlParceiro = `
        <div style="font-family: sans-serif; color: #333;">
          <h2 style="color: #eab308;">Olá ${escHtml(dono.nome)},</h2>
          <p>Recebemos com sucesso a sua indicação para <strong>${escHtml(dados.client_name)}</strong>.</p>
          <p>Nossa equipe comercial já foi notificada. Em breve, um de nossos vendedores entrará em contato para dar continuidade ao atendimento.</p>
          <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #eab308;">
            <p style="margin: 0;"><strong>Equipamento:</strong> ${escHtml(produto)}</p>
            <p style="margin: 5px 0 0 0;"><strong>Status Inicial:</strong> Em Triagem</p>
          </div>
          <p>Você pode acompanhar o andamento no seu painel no sistema <strong>Roder Indica</strong>.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #666;">Atenciosamente,<br>Equipe Roder Máquinas</p>
        </div>`;
      envios.push(deps.enviarEmail(dono.email, `Confirmação de Recebimento: Sua indicação de ${dados.client_name}`, htmlParceiro));
    }
    await Promise.allSettled(envios);
  }

  // POST /api/consultor/indicacao
  // { p?, equipamento: { nome, pid?, mid? }, cliente, telefone, cidade (ex. "Sorriso - MT"), cnpj? }
  async function rotaIndicacao(req: any, res: any) {
    try {
      if (passouLimite(`consind-ip:${ipDe(req)}`, 30, 60 * 60 * 1000)) return res.status(429).json({ error: 'Muitas indicações seguidas. Espere um pouco.' });
      const dono = await donoDoPedido(req);
      if ('erro' in dono) return res.status(dono.erro).json({ error: dono.msg });
      const b = req.body || {};
      const cliente = limpaTexto(b.cliente, 120);
      if (cliente.length < 2) return res.status(400).json({ error: 'Informe o nome do cliente ou da fazenda.' });
      const tel = validarTelefoneBR(String(b.telefone || ''));
      if (!tel.ok) return res.status(400).json({ error: 'Telefone inválido. Use DDD e número.' });
      const local = lerCidadeUf(String(b.cidade || ''));
      if (!local) return res.status(400).json({ error: 'Informe a cidade e o estado (UF).' });
      let cnpj = '';
      if (String(b.cnpj || '').trim()) {
        const c = validarCnpj(String(b.cnpj));
        if (!c.ok) return res.status(400).json({ error: 'CNPJ inválido.' });
        cnpj = c.formatado;
      }
      const equip = await equipamentoDe(b);
      if (!equip) return res.status(400).json({ error: 'Informe o equipamento.' });

      // limite por dono: 20 por dia (conta no banco, vale mesmo depois de reiniciar o servidor)
      const agoraMs = agora().getTime();
      const recentes = await db.collection('indications').where('external_seller_uid', '==', dono.uid).where('origem', '==', 'consultor').get();
      const doDia = recentes.docs.map((d: any) => ({ id: d.id, ...(d.data() || {}) }))
        .filter((d: any) => agoraMs - new Date(d.created_at || 0).getTime() < 24 * 3600_000);
      // toque duplo / reenvio: o mesmo cliente e equipamento nos últimos 10 minutos devolve a mesma indicação
      const repetida = doDia.find((d: any) => d.client_phone === tel.formatado && d.items?.[0]?.product_name === equip.nome &&
        agoraMs - new Date(d.created_at || 0).getTime() < 10 * 60_000);
      if (repetida) return res.json({ ok: true, id: repetida.id, repetida: true });
      if (doDia.length >= LIMITE_DIA || passouLimite(`consind:${dono.uid}`, LIMITE_DIA, 24 * 3600_000)) {
        return res.status(429).json({ error: `Limite de ${LIMITE_DIA} indicações por dia pela conversa. Use o app para mais.` });
      }

      const ehEquipe = EQUIPE.includes(dono.role);
      const ehInterna = dono.role === 'internal_seller' || dono.role === 'triagem';
      const regional: any = await regionalDoEstado(local.uf);
      const iso = agora().toISOString();
      const ref = db.collection('indications').doc();
      const localizacao = `${local.cidade} - ${local.uf}`;
      const descricao = 'Indicação feita pela conversa do Consultor Roder.' +
        (!equip.pid ? ' Equipamento escrito pelo indicador.' : !equip.mid ? ' Modelo a definir com a Roder.' : '');
      const dados: any = {
        client_name: cliente,
        client_person_name: cliente,
        client_phone: tel.formatado,
        client_email: '',
        client_cnpj: cnpj,
        client_location: localizacao,
        base_machine: '',
        machine_details: '',
        machine_porte: '',
        description: descricao,
        is_icms_contributor: false,
        ai_score: 'hot',
        id: ref.id,
        items: [{ id: equip.mid ? `model-${equip.mid}` : (equip.pid || 'custom-item'), product_name: equip.nome, quantity: 1 }],
        options: [],
        origin_type: ehEquipe ? 'direct' : 'partner',
        is_client_referral: false,
        referring_client_name: null,
        referring_client_phone: null,
        referring_client_notes: null,
        external_seller_uid: dono.uid,
        external_seller_name: ehEquipe ? `${dono.nome || 'Venda Direta'} (Fábrica)` : (dono.nome || 'Parceiro'),
        external_seller_email: dono.email || null,
        internal_seller_uid: ehInterna ? dono.uid : null,
        internal_seller_name: ehInterna ? dono.nome : null,
        internal_seller_email: ehInterna ? dono.email : null,
        created_by_uid: dono.uid,
        created_by_name: dono.nome || null,
        created_by_role: dono.role || null,
        standard_seller_uid: regional?.uid || null,
        standard_seller_name: regional?.name || null,
        standard_seller_commission_rate: regional?.commission_rate || 2,
        standard_seller_commission_enabled: !!regional,
        media_urls: [],
        media_upload_status: 'none',
        status: 'pending',
        negotiation_history: [{
          id: Math.random().toString(36).substring(2, 11),
          type: 'system',
          author_name: dono.nome || 'Sistema',
          created_at: iso,
          content: `Indicação inicial enviada pela conversa do Consultor Roder${dono.via === 'link' ? ' (link pessoal do parceiro)' : ''}.\n\nSOLICITAÇÃO: 1x ${equip.nome}\n\nCLIENTE: ${cliente} | ${tel.formatado} | ${localizacao}${cnpj ? ` | CNPJ ${cnpj}` : ''}`,
          attachments: [],
        }],
        created_at: iso,
        updated_at: iso,
        protection_expires_at: new Date(agoraMs + 60 * 24 * 60 * 60 * 1000).toISOString(),
        origem: 'consultor',
        origem_via: dono.via,
      };
      if (equip.pid) dados.product_id = equip.pid;
      if (equip.mid) dados.model_id = equip.mid;
      await ref.set(dados);
      res.json({ ok: true, id: ref.id });

      // depois de responder: sino da gestão, e-mails e Agendor (como o envio pelo app)
      (async () => {
        await avisarGestao('Nova Indicação Recebida', `${dono.nome || 'Parceiro'} enviou uma nova indicação para ${cliente} pela conversa do consultor.`).catch(() => {});
        await enviarEmails(dados, dono).catch(() => {});
        try {
          const ag = await db.collection('settings').doc('agendor').get();
          if (ag.exists && ag.data()?.enabled && deps.sincronizarAgendor) await deps.sincronizarAgendor(ref.id, dados);
        } catch { /* a indicação já está gravada */ }
      })();
    } catch {
      if (!res.headersSent) res.status(500).json({ error: 'Não consegui enviar a indicação. Tente de novo.' });
    }
  }

  return { rotaLink, rotaResolver, rotaLinkCliente, rotaIndicacao, donoDoToken, linkDoUsuario };
}

export function registrarConsultorParceiro(app: any, deps: DepsConsultorParceiro) {
  const r = criarRotasConsultorParceiro(deps);
  app.post('/api/consultor/links/:uid', r.rotaLink);
  app.get('/api/consultor/parceiro/:token', r.rotaResolver);
  app.post('/api/consultor/link-cliente', r.rotaLinkCliente);
  app.post('/api/consultor/indicacao', r.rotaIndicacao);
  return r;
}
