// Convite do Consultor Técnico por e-mail para o comercial interno (só admin e gerência).
// Lista quem receberia, envia só aos marcados (um e-mail por pessoa, sem mostrar os outros) e
// guarda a data do último convite por usuário em convites_consultor/{uid}, para não reenviar por engano.
// Tudo passa pelo servidor (admin SDK): não precisa mudar firestore.rules.
import { filtrarDestinatarios, montarConvite, type DestinatarioConvite } from '../src/lib/conviteConsultor';

export interface DepsConviteConsultor {
  db: any;
  exigirGestao: (req: any, res: any) => Promise<any>;
  // precisa LANÇAR erro quando o e-mail não sai (sem configuração de e-mail, SMTP recusou)
  enviarEmail: (to: string, subject: string, html: string, texto: string) => Promise<void>;
  agora?: () => Date;
}

const COLECAO = 'convites_consultor';

export function registrarConviteConsultor(app: any, deps: DepsConviteConsultor) {
  const agora = deps.agora || (() => new Date());

  async function candidatos(): Promise<Array<DestinatarioConvite & { ultimo_convite: string | null }>> {
    const snap = await deps.db.collection('users').get();
    const lista = filtrarDestinatarios(snap.docs.map((d: any) => ({ id: d.id, ...d.data() })));
    const out: Array<DestinatarioConvite & { ultimo_convite: string | null }> = [];
    for (const d of lista) {
      let ultimo: string | null = null;
      try { ultimo = (await deps.db.collection(COLECAO).doc(d.id).get()).data()?.enviado_em || null; } catch { /* sem histórico */ }
      out.push({ ...d, ultimo_convite: ultimo });
    }
    return out;
  }

  app.get('/api/admin/convite-consultor', async (req: any, res: any) => {
    if (!(await deps.exigirGestao(req, res))) return;
    try {
      const lista = await candidatos();
      const exemplo = montarConvite('Nome');
      return res.json({ ok: true, destinatarios: lista, assunto: exemplo.assunto, texto: exemplo.texto });
    } catch (e: any) {
      return res.status(500).json({ ok: false, error: 'Não consegui montar a lista agora.' });
    }
  });

  app.post('/api/admin/convite-consultor/enviar', async (req: any, res: any) => {
    const q = await deps.exigirGestao(req, res); if (!q) return;
    try {
      const pedidos: string[] = Array.isArray(req.body?.emails) ? req.body.emails.map((e: any) => String(e).trim().toLowerCase()).filter(Boolean) : [];
      const reenviar = req.body?.reenviar === true;
      if (pedidos.length === 0 || pedidos.length > 50) return res.status(400).json({ ok: false, error: 'Marque quem vai receber.' });
      // só quem está na lista do comercial interno: o navegador não escolhe endereço livre
      const permitidos = new Map((await candidatos()).map(c => [c.email, c]));
      const resultados: Array<{ email: string; nome: string; status: 'enviado' | 'ja_enviado' | 'fora_da_lista' | 'erro'; detalhe?: string }> = [];
      for (const email of [...new Set(pedidos)]) {
        const d = permitidos.get(email);
        if (!d) { resultados.push({ email, nome: '', status: 'fora_da_lista', detalhe: 'Não está no comercial interno ativo.' }); continue; }
        if (d.ultimo_convite && !reenviar) { resultados.push({ email, nome: d.nome, status: 'ja_enviado', detalhe: d.ultimo_convite }); continue; }
        try {
          const m = montarConvite(d.nome);
          await deps.enviarEmail(email, m.assunto, m.html, m.texto);
          await deps.db.collection(COLECAO).doc(d.id).set({ email, enviado_em: agora().toISOString(), enviado_por: q.email || '' }, { merge: true });
          resultados.push({ email, nome: d.nome, status: 'enviado' });
        } catch (e: any) {
          resultados.push({ email, nome: d.nome, status: 'erro', detalhe: String(e?.message || 'Não saiu.').slice(0, 160) });
        }
      }
      return res.json({ ok: true, resultados });
    } catch {
      return res.status(500).json({ ok: false, error: 'Erro ao enviar o convite.' });
    }
  });
}
