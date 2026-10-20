# E-mail só vale confirmado (19/10/2026)

## O problema

As regras do Firebase tratavam toda conta com senha como e-mail confirmado, supondo que o
cadastro público estivesse desligado. Não está: o app usa login anônimo (estoque público,
cadastro rápido, visitante do Consultor), e com a criação de usuário ligada qualquer pessoa cria
`qualquer@roderbrasil.com.br` com senha pela API do Firebase, sem acesso àquela caixa de e-mail.
Esse login passava por equipe (leitura ampla) e, se um e-mail da diretoria ainda não tivesse
conta, por diretoria (admin).

No servidor, a troca de senha da tela de Usuários também aceitava quem tivesse gravado
`roderbrasil@gmail.com` no próprio cadastro, e o primeiro acesso de pré-cadastrado aceitava conta
com senha sem confirmação.

## O que mudou

- Regras (`firestore.rules`): e-mail só vale com `email_verified`. A busca do próprio cadastro
  pelo e-mail também passou a exigir e-mail confirmado. `storage.rules` já exigia.
- Servidor: papel vem de `users/{uid}.role`; diretoria só com e-mail confirmado
  (`server/emailConfiavel.ts`). Quem cria conta ou troca senha pela tela de Usuários deixa o
  e-mail confirmado. Uma rodada única no início do servidor (trava
  `cron_locks/marcar_email_confirmado_equipe_v1`) confirma as contas com senha antigas, só de
  quem tem cadastro ATIVO no app com o mesmo uid e e-mail. Conta desconhecida fica como está.
- App: no login, se o token diz "não confirmado" mas a conta já está confirmada, pede um token
  novo na hora (o antigo vale até 1 hora).

## Primeiro acesso de pré-cadastrado

A conta de senha não confirmada só ganha o cadastro provisório quando: o login foi por senha, o
cadastro provisório tem senha inicial, e o login aconteceu depois de `initial_password_set_at`
(data gravada só pelo servidor, em `/api/admin/set-user-password`). Aí o servidor confirma o
e-mail, derruba os logins antigos e o app entra de novo com a mesma senha. Fora disso a tela de
login diz "Peça à Roder para redefinir sua senha".

Cadastro forjado: a data no cadastro não basta, porque qualquer login grava o próprio `users/{uid}`.
Uma conta B gravava ali o e-mail de A, uma senha inicial e uma data antiga, e o primeiro acesso de A
(criada por fora) confirmava o e-mail dela. Agora:

- Servidor: só vale cadastro de código `temp_` ou `phone_` (como a tela de Usuários cria), que não
  seja o uid de uma conta de login, e com a marca `senhas_iniciais/{código}` que só o servidor grava
  em `/api/admin/set-user-password` (mesmo código, mesmo e-mail, data da senha e quem definiu). A data
  que vale é a da marca. A marca é apagada no primeiro acesso.
- Regras: o próprio cadastro não leva `initial_password` nem `initial_password_set_at`, e o e-mail
  só pode ser o do próprio login (ou vazio). Gerente e triagem continuam cadastrando com senha
  inicial, mas a data dela é só do servidor. Ninguém lê nem grava `senhas_iniciais` pelo navegador.
- O app faz um pedido só por login (a tela de login e o AuthContext recebem a mesma resposta). Se o
  servidor pedir para entrar de novo e não houver senha na mão, o app sai e avisa. Login derrubado
  recebe 401 (`token_revogado`), e não 500.

## Administrador que entra com senha

Depois de publicar, o administrador que entra com e-mail e senha só continua administrador se o
cadastro dele (`users/{uid}`) tiver `role: 'admin'`. O e-mail da diretoria sozinho só vale
confirmado: sem o papel no cadastro, confirme o e-mail entrando uma vez com o Google ou pelo
"Esqueci a senha" antes de publicar.

## Senha pela tela de Usuários

- Só para quem tem cadastro. E-mail com dois cadastros: o app manda o código do cadastro; sem ele,
  o servidor responde 409.
- Gerente e triagem só definem senha dos papéis que podem cadastrar, nunca de administrador,
  gerente, triagem, diretoria ou conta que entra com Google.
- Conta que já existia: os logins abertos caem e a tela avisa que a pessoa vai entrar de novo.

## Ordem para publicar

1. Publicar o servidor (Hostinger).
2. Abrir o app como administrador, no cartão "Regras de segurança do Firebase". Uns 15 segundos
   depois de o servidor subir, o quadro "Conferência das contas da equipe" mostra quantas contas
   foram confirmadas e quais ficaram como estavam, com o motivo. Antes disso o botão "Publicar
   regras novas" fica bloqueado (e o servidor recusa com 409).
3. Ver a lista "Ver quem é". As confirmadas aparecem com o papel e o código do cadastro: confira se
   ninguém virou equipe sem dever. Se alguém da equipe ficou de fora, redefinir a senha dele na tela
   de Usuários (isso confirma o e-mail). A diretoria nunca é confirmada pela rodada: entra pelo
   Google ou pelo "Esqueci a senha" (ou tem `role: 'admin'` no cadastro). Se a rodada terminou com
   erros, o botão de publicar continua liberado, mas a tela avisa: quem deu erro e tem senha perde o
   acesso de equipe até a senha ser redefinida.
4. Publicar as regras pelo botão "Publicar regras novas".
5. Recomendado: no console do Firebase, em Authentication > Configurações > Ações do usuário,
   avaliar "Ativar criação (inscrição)". Desligar impede que alguém crie conta por fora, mas
   também desliga o login anônimo que o estoque público, o cadastro rápido e o visitante do
   Consultor usam. Enquanto essas páginas precisarem do anônimo, deixe ligado: com as regras
   novas a conta criada por fora não ganha acesso nenhum além do de um parceiro sem cadastro.

## Foto do Agendor

`/api/admin/agendor-foto` só para o dono (mesma trava de `/api/admin/agendor-fotos`), só https de
`agendor.com.br`, `amazonaws.com` ou `cloudfront.net` em cada salto, pelo download protegido
(`baixarExterna`, 8 s e 10 MB) e só imagem.
