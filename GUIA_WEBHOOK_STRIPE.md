# Configurar Webhook do Stripe — Passo a Passo

## O que é e por que precisa?

O webhook é o canal pelo qual o Stripe avisa seu app sobre eventos importantes:
pagamento aprovado, assinatura cancelada, fatura vencida, etc.
Sem ele, o banco de dados nunca saberá que o usuário assinou ou cancelou.

---

## Opção A — Ambiente de desenvolvimento local

### 1. Instalar o Stripe CLI

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Windows (Scoop)
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe

# Linux
curl -s https://packages.stripe.dev/api/security/keypair/stripe-cli-gpg/public | \
  gpg --dearmor | sudo tee /usr/share/keyrings/stripe.gpg
echo "deb [signed-by=/usr/share/keyrings/stripe.gpg] https://packages.stripe.dev/stripe-cli-debian-local stable main" | \
  sudo tee -a /etc/apt/sources.list.d/stripe.list
sudo apt update && sudo apt install stripe
```

### 2. Fazer login no CLI

```bash
stripe login
# Abre o navegador — autorize com sua conta Stripe
```

### 3. Iniciar o listener local

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

O terminal vai exibir algo assim:
```
> Ready! You are using Stripe API Version [2024-12-18.acacia]
> Your webhook signing secret is whsec_xxxxxxxxxxxxxxxxxxxxxxxx (^C to quit)
```

### 4. Copiar o secret para o .env.local

Abra `apps/web/.env.local` e substitua:
```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxx
```

### 5. Testar

Com o app rodando (`pnpm dev`) e o listener ativo, faça um checkout de teste.
O terminal do CLI mostrará os eventos recebidos em tempo real.

---

## Opção B — Ambiente de produção (Vercel / servidor)

### 1. Acessar o Dashboard do Stripe

Vá para: https://dashboard.stripe.com/webhooks

### 2. Criar endpoint

Clique em **"+ Add endpoint"** e preencha:

| Campo | Valor |
|---|---|
| Endpoint URL | `https://SEU-DOMINIO.com/api/webhooks/stripe` |
| Listen to | Events on your account |
| Version | 2024-12-18.acacia |

### 3. Selecionar os eventos

Marque exatamente estes 5 eventos:

- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

Clique em **"Add endpoint"**.

### 4. Copiar o Signing Secret

Na página do endpoint criado, clique em **"Reveal"** abaixo de **"Signing secret"**.

Você verá algo como: `whsec_xxxxxxxxxxxxxxxxxxxxxxxx`

### 5. Adicionar às variáveis de ambiente

**Na Vercel** (ou seu hosting):
- Vá em Project → Settings → Environment Variables
- Adicione: `STRIPE_WEBHOOK_SECRET` = `whsec_xxx...`

**No .env.local** (para rodar localmente contra prod — não recomendado):
```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxx
```

### 6. Verificar

No Dashboard do Stripe → Webhooks → clique no endpoint → aba "Recent deliveries".
Após o próximo evento, você verá o status `200 OK`.

---

## Checklist final

- [ ] `STRIPE_SECRET_KEY` preenchido no `.env.local` (e na Vercel em prod)
- [ ] `STRIPE_WEBHOOK_SECRET` preenchido após criar o endpoint
- [ ] Listener ativo em dev (`stripe listen ...`) antes de testar checkout
- [ ] 5 eventos selecionados no endpoint de produção
- [ ] Endpoint URL usa HTTPS em produção

---

## Prompt para usar em outra IA

Cole o texto abaixo em qualquer LLM (ChatGPT, Gemini, etc.) para obter ajuda adicional:

---

```
Contexto do projeto:
- Next.js 15 App Router, Supabase, Stripe (livemode, BRL)
- Webhook handler já implementado em: /app/api/webhooks/stripe/route.ts
- O handler usa: stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET)
- Eventos tratados: checkout.session.completed, customer.subscription.updated,
  customer.subscription.deleted, invoice.payment_succeeded, invoice.payment_failed
- Deploy: Vercel (produção) / localhost:3000 (dev)

Tarefa:
1. Me explique como configurar o endpoint de webhook no Dashboard do Stripe
   para apontar para https://MEU-DOMINIO.com/api/webhooks/stripe
2. Quais são os 5 eventos que preciso selecionar?
3. Onde encontro o "Signing Secret" (STRIPE_WEBHOOK_SECRET) após criar o endpoint?
4. Como faço para testar localmente com o Stripe CLI antes de ir para produção?
5. Como adiciono a variável STRIPE_WEBHOOK_SECRET na Vercel?

Por favor, dê respostas diretas e com os passos exatos do Dashboard atual do Stripe.
```
