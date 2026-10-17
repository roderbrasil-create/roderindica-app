import React, { useEffect, useMemo, useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, auth } from '../../lib/firebase';
import { getApiBaseUrl } from '../../lib/utils';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Product } from '../../types';

type AgendorItem = { name: string; code: string; imageUrl: string };
type Suggestion = {
  key: string;
  productId: string;
  modelIndex: number | null; // null = foto principal da família
  label: string;
  match: AgendorItem;
  score: number;
};

const norm = (v: string) => String(v || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const STOP = new Set(['de', 'da', 'do', 'das', 'dos', 'para', 'com', 'e', 'o', 'a', 'roder', 'modelo', 'equipamento', 'c', 'p', 'kit']);
const tokens = (v: string) => norm(v).split(/[^a-z0-9]+/).filter(t => t.length >= 2 && !STOP.has(t));
// "R600", "CMF600" e "CMF 600" viram o mesmo: junta letras e números colados
const compact = (v: string) => norm(v).replace(/[^a-z0-9]/g, '');

function bestMatch(label: string, list: AgendorItem[]): { item: AgendorItem; score: number } | null {
  const lt = tokens(label);
  const nums = lt.filter(t => /\d/.test(t));
  const lc = compact(label);
  let best: { item: AgendorItem; score: number } | null = null;
  for (const it of list) {
    const at = new Set(tokens(it.name));
    const ac = compact(it.name);
    let score = 0;
    for (const t of lt) if (at.has(t)) score += /\d/.test(t) ? 3 : 1;
    // número do modelo precisa bater (evita foto da R800 na R600)
    if (nums.length && !nums.some(n => at.has(n) || ac.includes(n))) continue;
    if (lc.length >= 4 && ac.includes(lc)) score += 3;
    if (score > 0 && (!best || score > best.score)) best = { item: it, score };
  }
  return best && best.score >= 3 ? best : null;
}

export function AgendorPhotosDialog({ open, onClose, products, onApplied }: { open: boolean; onClose: () => void; products: Product[]; onApplied?: () => void }) {
  const [loading, setLoading] = useState(false);
  const [agendor, setAgendor] = useState<AgendorItem[]>([]);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (!open) return;
    (async () => {
      setLoading(true);
      try {
        const token = await auth.currentUser?.getIdToken();
        const r = await fetch(`${getApiBaseUrl()}/api/admin/agendor-fotos`, { headers: { Authorization: `Bearer ${token}` } });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || 'Erro');
        setAgendor(j.products || []);
      } catch (e: any) {
        toast.error('Não consegui buscar as fotos do Agendor: ' + (e?.message || e));
      } finally {
        setLoading(false);
      }
    })();
  }, [open]);

  const suggestions = useMemo<Suggestion[]>(() => {
    if (!agendor.length) return [];
    const out: Suggestion[] = [];
    for (const p of products) {
      if (!p.image_url) {
        const m = bestMatch(p.name, agendor);
        if (m) out.push({ key: `${p.id}:main`, productId: p.id, modelIndex: null, label: `${p.name} (foto da família)`, match: m.item, score: m.score });
      }
      (p.models || []).forEach((model: any, i: number) => {
        const hasImg = (model.images && model.images.length > 0) || model.image_url;
        if (hasImg) return;
        const m = bestMatch(`${model.name || ''}`, agendor) || bestMatch(`${p.name} ${model.name || ''}`, agendor);
        if (m) out.push({ key: `${p.id}:${i}`, productId: p.id, modelIndex: i, label: `${p.name} › ${model.name}`, match: m.item, score: m.score });
      });
    }
    return out;
  }, [agendor, products]);

  useEffect(() => {
    const init: Record<string, boolean> = {};
    suggestions.forEach(s => { init[s.key] = true; });
    setChecked(init);
  }, [suggestions]);

  const apply = async () => {
    const chosen = suggestions.filter(s => checked[s.key]);
    if (!chosen.length) return;
    setApplying(true);
    const t = toast.loading(`Aplicando ${chosen.length} fotos...`);
    let ok = 0;
    try {
      // agrupa por família para gravar cada documento uma vez
      const byProduct = new Map<string, Suggestion[]>();
      chosen.forEach(s => byProduct.set(s.productId, [...(byProduct.get(s.productId) || []), s]));
      for (const [productId, list] of byProduct) {
        const product = products.find(p => p.id === productId);
        if (!product) continue;
        const models = [...(product.models || [])].map(m => ({ ...m }));
        const update: any = {};
        for (const s of list) {
          try {
            const idToken = await auth.currentUser?.getIdToken();
            const r = await fetch(`${getApiBaseUrl()}/api/admin/agendor-foto?url=${encodeURIComponent(s.match.imageUrl)}`, { headers: { Authorization: `Bearer ${idToken}` } });
            if (!r.ok) throw new Error('download');
            const blob = await r.blob();
            const ext = (blob.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
            const sref = ref(storage, `catalog/agendor/${productId}_${s.modelIndex ?? 'main'}_${Date.now()}.${ext}`);
            await uploadBytes(sref, blob, { contentType: blob.type });
            const url = await getDownloadURL(sref);
            if (s.modelIndex === null) update.image_url = url;
            else models[s.modelIndex] = { ...models[s.modelIndex], images: [url] };
            ok++;
          } catch (e) {
            console.warn('Foto não aplicada', s.label, e);
          }
        }
        if (list.some(s => s.modelIndex !== null)) update.models = models;
        if (Object.keys(update).length) await updateDoc(doc(db, 'products', productId), update);
      }
      toast.success(`${ok} fotos aplicadas.`, { id: t });
      onApplied?.();
      onClose();
    } catch (e: any) {
      toast.error('Erro ao aplicar: ' + (e?.message || e), { id: t });
    } finally {
      setApplying(false);
    }
  };

  const nChecked = suggestions.filter(s => checked[s.key]).length;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl w-[96vw] max-h-[90vh] flex flex-col p-4">
        <DialogHeader>
          <DialogTitle className="text-base">Fotos do Agendor para equipamentos sem foto</DialogTitle>
        </DialogHeader>
        {loading ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Buscando fotos no Agendor...</p>
        ) : suggestions.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            {agendor.length ? 'Nenhum equipamento sem foto com correspondência no Agendor.' : 'Nenhuma foto encontrada.'}
          </p>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">Confira cada par. Desmarque o que não for a mesma máquina. Fotos já cadastradas não são trocadas.</p>
            <div className="flex-1 overflow-y-auto divide-y border rounded-lg mt-2">
              {suggestions.map(s => (
                <label key={s.key} className="flex items-center gap-3 p-2 cursor-pointer">
                  <input type="checkbox" className="h-5 w-5 shrink-0" checked={!!checked[s.key]} onChange={e => setChecked(c => ({ ...c, [s.key]: e.target.checked }))} />
                  <img src={s.match.imageUrl} alt="" className="h-14 w-14 object-contain rounded bg-white border shrink-0" loading="lazy" />
                  <div className="min-w-0 text-[12px] leading-snug">
                    <p className="font-semibold truncate">{s.label}</p>
                    <p className="text-muted-foreground truncate">Agendor: {s.match.name}{s.match.code ? ` (${s.match.code})` : ''}</p>
                  </div>
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-2 pt-3">
              <Button variant="ghost" onClick={onClose} disabled={applying}>Cancelar</Button>
              <Button onClick={apply} disabled={applying || nChecked === 0}>Aplicar {nChecked} fotos</Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
