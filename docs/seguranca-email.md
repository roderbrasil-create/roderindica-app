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

## Ordem para publicar

1. Publicar o servidor (Hostinger).
2. Esperar no log a linha `[EMAIL-CONFIRMADO] Contas lidas: ...` (uns 15 segundos depois de
   subir). Ela diz quantas contas foram confirmadas e quantas ficaram de fora.
3. Só então publicar as regras pelo botão "Publicar regras" dentro do app.
4. Recomendado: no console do Firebase, em Authentication > Configurações > Ações do usuário,
   avaliar "Ativar criação (inscrição)". Desligar impede que alguém crie conta por fora, mas
   também desliga o login anônimo que o estoque público, o cadastro rápido e o visitante do
   Consultor usam. Enquanto essas páginas precisarem do anônimo, deixe ligado: com as regras
   novas a conta criada por fora não ganha acesso nenhum além do de um parceiro sem cadastro.
