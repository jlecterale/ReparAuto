# Painel de Administração — Plano de Implementação

## Objetivo

Criar uma área restrita a utilizadores com `role === 'admin'` para gestão da plataforma.

## Funcionalidades

### 1. Página `/admin`

Protegida por verificação de role. Se o utilizador não for admin, redirecionar para `/`.

**Painel com:**

- **Visão Geral:** cards com estatísticas (total users, total anúncios, total peças)
- **Gestão de Utilizadores:** tabela com todos os utilizadores registados (uid, nome, email, role, data de criação)
- **Gestão de Roles:** dropdown para alterar role entre `user` e `admin`
- **Gestão de Anúncios:** listagem de todos os carros e peças com opção de eliminar
- **Logs de Atividade** (opcional, fase 2)

### 2. Componentes a Criar

| Ficheiro | Descrição |
|---|---|
| `src/pages/Admin.tsx` | Página principal do admin com tabs |
| `src/components/admin/AdminStats.tsx` | Cards de estatísticas |
| `src/components/admin/UserTable.tsx` | Tabela de utilizadores com gestão de roles |
| `src/components/admin/ListingsTable.tsx` | Tabela de anúncios com ação de eliminar |

### 3. Alterações Necessárias

#### `src/lib/db.ts`

Adicionar funções:
```typescript
export async function getAllUsers(): Promise<Usuario[]>
export async function setUserRole(uid: string, role: Role): Promise<void>
export async function getAllCarrosAdmin(): Promise<Carro[]>
export async function getAllPecasAdmin(): Promise<Peca[]>
```

#### `src/App.tsx`

Adicionar rota protegida:
```tsx
<Route path="/admin" element={<Admin />} />
```

#### `src/components/layout/Header.tsx`

Adicionar link para `/admin` quando `isAdmin`:
```tsx
{isAdmin && (
  <a href="#/admin" className="...">
    <i className="fa-solid fa-shield"></i> Admin
  </a>
)}
```

### 4. Regras de Segurança Firestore

```
match /users/{userId} {
  // Admin pode ler todos os utilizadores
  allow read: if request.auth != null && (
    request.auth.uid == userId || 
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
  );
  
  // Apenas admin pode alterar role
  allow write: if request.auth != null && (
    request.auth.uid == userId ||
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
  );
}
```

### 5. Fluxo UX

1. Utilizador admin faz login normalmente
2. Header mostra link "Admin" (só visível se `isAdmin`)
3. Ao clicar, navega para `/admin`
4. Se utilizador não-admin tentar aceder `/admin` diretamente, redireciona para `/`
5. Dentro do admin, tabs ou secções separadas para Users / Anúncios / Estatísticas

### 6. Escalabilidade e Performance

- **Firestore reads:** `getAllUsers()` lê toda a coleção `users`. Com <1000 users, é aceitável. Para escala maior, implementar paginação.
- **Cache:** Dados de admin podem ser cacheados com `useMemo` e refresh manual.
- **Rate limiting:** Alterações de role devem ser confirmadas com modal de confirmação para evitar enganos.

### 7. Prioridade

Baixa prioridade. Implementar após:
- [ ] Perfil de utilizador completo (já implementado)
- [ ] Sistema de notificações
- [ ] Mensagens entre utilizadores
