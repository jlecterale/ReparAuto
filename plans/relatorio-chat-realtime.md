# Relatório: Migração do Chat para Tempo Real

## Resumo

Migração do sistema de chat de polling (`getDocs`) para listeners em tempo real (`onSnapshot`), adição do campo `participants`, e criação automática de notificações ao enviar mensagem.

---

## O que foi feito

### 1. `src/hooks/useChat.ts` — Hook principal do chat

**Antes:**
- Unread count via `getDocs` com chamada manual `recarregarMensagensNaoLidas()`
- Conversa carregada via `getDocs` com filtro manual de `fromUid`/`toUid`
- Sem campo `participants`

**Depois:**
- Listener `onSnapshot` para mensagens não lidas (`toUid == uid, lida == false`)
- Listener `onSnapshot` para conversa ativa (`participants array-contains uid, listingId == id`)
- Marcação automática de mensagens como lidas via `writeBatch` quando o chat abre
- Criação automática de notificação (`tipo: 'mensagem'`) ao enviar mensagem para o vendedor
- `recarregarMensagensNaoLidas` removido (já não é necessário)
- Hook aceita `nome: string = ''` para personalizar notificações

### 2. `src/components/chat/ChatInbox.tsx` — Caixa de entrada

**Antes:**
- `getDocs` com carregamento manual
- Clique apenas fechava a inbox

**Depois:**
- `onSnapshot` com tempo real + `limit(50)`
- Clique abre o chat diretamente (`abrirChat` com `listingId`, `listingType`, etc.)

### 3. `src/lib/db.ts` — Migração de dados

- Nova função `migrarMensagens()`: adiciona campo `participants` às mensagens existentes
- Executada durante `initDatabase()`
- Controlada por flag `reparauto_migration_participants` no localStorage (best-effort)

### 4. `src/types/chat.ts` — Tipos

- Adicionado campo `participants: string[]` à interface `Mensagem`
- Removido `recarregarMensagensNaoLidas` de `ChatContextValue`

### 5. `src/types/notificacao.ts` — Tipo de notificação

- Adicionado `'mensagem'` ao union type `TipoNotificacao`

### 6. `src/providers/AppProvider.tsx`

- Passa `auth.user?.nome` ao hook `useChat`

### 7. `firestore.rules` — Regras de segurança

- `messages`: leitura permitida se `request.auth.uid in resource.data.participants` (além do fallback `fromUid`/`toUid`)
- `messages`: criação bloqueada se `fromUid == toUid` (não pode enviar para si próprio)
- `notifications`: criação permitida se `tipo == 'mensagem'` (qualquer autenticado pode criar notificação de mensagem)

### 8. `firebase.json`

- Adicionada referência a `firestore.indexes.json`

### 9. `firestore.indexes.json` — **Novo ficheiro**

4 composite indexes para as queries do chat:

| Collection | Fields | Uso |
|-----------|--------|-----|
| `messages` | `toUid ↑`, `dataCriacao ↓` | ChatInbox — mensagens recebidas |
| `messages` | `toUid ↑`, `lida ↑` | Unread count listener |
| `messages` | `listingId ↑`, `dataCriacao ↑` | Conversa por listingId (fallback) |
| `messages` | `participants ↑`, `listingId ↑`, `dataCriacao ↑` | Conversa por participantes + listing |

---

## Testes efectuados

| Teste | Resultado |
|-------|-----------|
| **TypeScript (`tsc --noEmit`)** | ✅ Sem erros |
| **Vite build (produção)** | ✅ 100 módulos, 867 KB JS, 57 KB CSS |
| **Firestore rules (compilação)** | ✅ Compilado com sucesso (3 warnings pré-existentes: função `isCreatorByEmail` não usada, variáveis `request` inválidas em linhas 19:35/19:68) |
| **Firestore indexes (deploy)** | ✅ 4 indexes deployed |
| **Firestore rules (deploy)** | ✅ Released |
| **Hosting (deploy)** | ✅ 8 ficheiros, URL: https://reparauto-site.web.app |

---

## Commits

```
cc0fb88 feat: migrate chat to real-time listeners, add participants field, auto notifications on message
```

9 ficheiros alterados, 233 inserções, 83 deleções.

---

## Notas

- A migração de `participants` para mensagens existentes é **best-effort** (não bloqueia inicialização)
- Mensagens antigas sem `participants` continuam acessíveis via regras de fallback (`fromUid`/`toUid`)
- O chunk size warning (867 KB) é pré-existente e não relacionado com esta alteração
- Não há testes unitários no projeto (conforme AGENTS.md)
