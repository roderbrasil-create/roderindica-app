import test from 'node:test';
import assert from 'node:assert/strict';
import { telefoneWhatsBR, linkWhatsConvite, montarMensagemConvite, entregarConvite } from '../src/lib/convitePorWhatsapp';

test('normaliza o telefone brasileiro para 55 + DDD + número', () => {
  assert.equal(telefoneWhatsBR('(37) 99869-3248'), '5537998693248');
  assert.equal(telefoneWhatsBR('37 3232-1234'), '553732321234');
  assert.equal(telefoneWhatsBR('+55 (37) 99869-3248'), '5537998693248');
  assert.equal(telefoneWhatsBR('5537998693248'), '5537998693248');
  assert.equal(telefoneWhatsBR('037998693248'), '5537998693248');
});

test('número impossível vira vazio, nunca um número inexistente', () => {
  assert.equal(telefoneWhatsBR(''), '');
  assert.equal(telefoneWhatsBR(undefined), '');
  assert.equal(telefoneWhatsBR('99869-3248'), '');
  assert.equal(telefoneWhatsBR('12345'), '');
});

test('link usa wa.me com o número e a mensagem codificada', () => {
  const l = linkWhatsConvite('(37) 99869-3248', 'Olá *Ana*!\nSenha: a&b');
  assert.ok(l.startsWith('https://wa.me/5537998693248?text='));
  assert.equal(decodeURIComponent(l.split('?text=')[1]), 'Olá *Ana*!\nSenha: a&b');
  assert.ok(linkWhatsConvite('', 'x').startsWith('https://wa.me/?text='));
});

const user = { name: 'Maria', email: 'maria@exemplo.com', phone: '(37) 99869-3248', role: 'external_seller' };

test('mensagem leva a senha cadastrada quando o interruptor está ligado', () => {
  const m = montarMensagemConvite(user, 'https://app.exemplo', 'segredo123', true);
  assert.ok(m.includes('*Senha de Acesso:* segredo123'));
  assert.ok(m.includes('*Instruções para o seu acesso:*'));
  assert.ok(m.includes('Vendedor Externo'));
});

test('mensagem sem senha quando o interruptor está desligado ou a senha vazia', () => {
  assert.ok(!montarMensagemConvite({ ...user, initial_password: 'guardada1' }, 'u', 'guardada1', false).includes('guardada1'));
  assert.ok(montarMensagemConvite(user, 'u', '', true).includes('Esqueci minha senha'));
});

test('texto enviado = prévia: mesma função e mesmos argumentos dão o mesmo texto', () => {
  const a = montarMensagemConvite(user, 'https://app', ' abc123 '.trim(), true);
  const b = montarMensagemConvite(user, 'https://app', 'abc123', true);
  assert.equal(a, b);
  const url = linkWhatsConvite(user.phone, a);
  assert.equal(decodeURIComponent(url.split('?text=')[1]), a);
});

test('entrega: usa a janela aberta no toque', async () => {
  const janela = { closed: false, location: { href: 'about:blank' } };
  const r = await entregarConvite({ janela, url: 'https://wa.me/x', mensagem: 'm', copiar: async () => { throw new Error('não deveria copiar'); } });
  assert.equal(r, 'aberto');
  assert.equal(janela.location.href, 'https://wa.me/x');
});

test('entrega: janela bloqueada ou fechada copia a mensagem', async () => {
  let copiado = '';
  const copiar = async (t: string) => { copiado = t; };
  assert.equal(await entregarConvite({ janela: null, url: 'u', mensagem: 'texto', copiar }), 'copiado');
  assert.equal(copiado, 'texto');
  assert.equal(await entregarConvite({ janela: { closed: true, location: { href: '' } }, url: 'u', mensagem: 'texto2', copiar }), 'copiado');
  assert.equal(copiado, 'texto2');
});

test('entrega: sem janela e sem área de transferência avisa que falhou', async () => {
  assert.equal(await entregarConvite({ janela: null, url: 'u', mensagem: 'm', copiar: async () => { throw new Error('negado'); } }), 'falhou');
});
