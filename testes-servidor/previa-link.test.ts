// Prévia do link curto no WhatsApp e vídeo do equipamento. Rodar: node --import tsx --test testes-servidor/previa-link.test.ts
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { injetarPrevia, previaPadrao, previaDoEquipamento, escHtml, codigoLimpo } from '../server/previaLink.ts';
import { videoDoEquipamento, comoTocar, idYoutube, textoVideoWhats } from '../src/lib/videoEquipamento.ts';

const INDEX = `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <title>RODER Indica V2</title>
    <meta property="og:image" content="https://antigo/velha.png" />
  </head>
  <body><div id="root"></div></body>
</html>`;

test('código desconhecido: prévia padrão da Roder, com a logo e o endereço do próprio código', () => {
  const html = injetarPrevia(INDEX, previaPadrao('zz9<x>'));
  assert.match(html, /<title>Roder Máquinas e Equipamentos<\/title>/);
  assert.match(html, /og:image" content="https:\/\/roderindica\.com\/marca\/roder-redondo-512\.png"/);
  assert.match(html, /og:url" content="https:\/\/roderindica\.com\/o\/ZZ9X"/);
  assert.match(html, /og:type" content="website"/);
  // a og:image antiga do index.html sai: duas deixam o WhatsApp escolher a errada
  assert.equal((html.match(/og:image"/g) || []).length, 1);
  assert.ok(!html.includes('velha.png'));
  assert.equal((html.match(/<title>/g) || []).length, 1);
  assert.match(html, /<div id="root"><\/div>/);
});

test('nome do equipamento com aspas, tags e "$&" não quebra o HTML nem injeta nada', () => {
  const p = { name: 'Garra "R400" <script>alert(1)</script> $& \'x\'', models: [] };
  const html = injetarPrevia(INDEX, previaDoEquipamento('AB12C', p, null, 'https://x.com/a.png?a=1&b="2"'));
  assert.ok(!html.includes('<script>alert(1)</script>'));
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.match(html, /og:title" content="Garra &quot;R400&quot; &lt;script&gt;alert\(1\)&lt;\/script&gt; \$&amp; &#39;x&#39; \| Roder"/);
  assert.match(html, /og:image" content="https:\/\/x\.com\/a\.png\?a=1&amp;b=&quot;2&quot;"/);
  // "$&" na troca não repete o <title> original
  assert.ok(!html.includes('RODER Indica V2'));
});

test('equipamento com vídeo: a descrição chama para o vídeo; foto do equipamento na og:image', () => {
  const p = { name: 'Cabeçote Multifuncional', models: [{ id: 'm1', name: 'CMF 500', technical_specs: { maquina_base: '8 a 14 ton.' } }] };
  const d = previaDoEquipamento('K7P2Q', p, p.models[0], 'https://roderindica.com/api/foto/abc');
  assert.equal(d.titulo, 'Cabeçote Multifuncional CMF 500 | Roder');
  assert.equal(d.temVideo, true);
  assert.match(d.descricao, /^Para escavadeiras de 8 a 14 t\. Veja o vídeo trabalhando e peça o orçamento\.$/);
  const html = injetarPrevia(INDEX, d);
  assert.match(html, /og:image" content="https:\/\/roderindica\.com\/api\/foto\/abc"/);
  assert.match(html, /twitter:card" content="summary_large_image"/);
});

test('sem foto que abra, fica a logo; sem nome, fica a prévia padrão', () => {
  assert.equal(previaDoEquipamento('A', { name: 'Garfo' }, null, '').imagem, previaPadrao('A').imagem);
  assert.equal(previaDoEquipamento('A', { name: '' }, null, 'x').titulo, 'Roder Máquinas e Equipamentos');
});

test('HTML sem <title> recebe as etiquetas antes do </head>', () => {
  const html = injetarPrevia('<html><head></head><body></body></html>', previaPadrao('A'));
  assert.match(html, /<title>Roder Máquinas e Equipamentos<\/title>[\s\S]*<\/head>/);
});

test('escape e código curto', () => {
  assert.equal(escHtml(`<a href="x">'&'</a>`), '&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;');
  assert.equal(codigoLimpo(' k7p-2q/../x '), 'K7P2QX');
});

test('vídeo do equipamento: catálogo primeiro, depois o mapa por nome; vídeo morto e endereço estranho saem', () => {
  assert.equal(videoDoEquipamento({ name: 'X' }, { name: 'CMF 500', video_url: 'https://cdn/x.mp4' }), 'https://cdn/x.mp4');
  assert.equal(videoDoEquipamento({ name: 'X', video_url: 'db-file://abc123' }, { name: 'Y' }), 'db-file://abc123');
  assert.equal(videoDoEquipamento({ name: 'X' }, { name: 'CMF 500' }), 'https://www.youtube.com/watch?v=Aof_7Q-fS1s');
  assert.equal(videoDoEquipamento({ name: 'X' }, { name: 'R400', video_url: 'https://youtu.be/t_8n_nlf2xk' }), 'https://www.youtube.com/watch?v=Kzqi_Cn2WG4');
  assert.equal(videoDoEquipamento({ name: 'X', video_url: 'javascript:alert(1)' }, { name: 'Z' }), '');
});

test('como tocar: YouTube vira youtube-nocookie com autoplay só no player aberto; arquivo vira <video>', () => {
  assert.equal(idYoutube('https://youtu.be/Aof_7Q-fS1s?t=3'), 'Aof_7Q-fS1s');
  assert.equal(idYoutube('https://www.youtube.com/shorts/Aof_7Q-fS1s'), 'Aof_7Q-fS1s');
  const yt = comoTocar('https://www.youtube.com/watch?v=Aof_7Q-fS1s');
  assert.deepEqual(yt, { tipo: 'iframe', youtube: true, src: 'https://www.youtube-nocookie.com/embed/Aof_7Q-fS1s?autoplay=1&playsinline=1&rel=0&modestbranding=1' });
  assert.deepEqual(comoTocar('https://firebasestorage.googleapis.com/v0/b/x/o/v.mp4?alt=media'), { tipo: 'arquivo', src: 'https://firebasestorage.googleapis.com/v0/b/x/o/v.mp4?alt=media' });
  assert.equal(comoTocar(''), null);
});

test('texto do WhatsApp do vídeo, sem travessão', () => {
  const t = textoVideoWhats('Garra Florestal R400', 'https://roderindica.com/o/K7P2Q');
  assert.equal(t, 'Olha o Garra Florestal R400 da Roder trabalhando. Veja o vídeo e peça o orçamento direto com a Roder: https://roderindica.com/o/K7P2Q');
  assert.ok(!t.includes('\u2014'));
});
