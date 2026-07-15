# Plano 22 — Campos e Filtros Adicionais nos Anúncios de Carros (Web + Mobile)

**Estado:** ✅ Implementado
**Esforço:** ~2-3 dias
**Prioridade:** MÉDIA

## Contexto / Problema

O formulário de criação de anúncios de carros cobria apenas os campos básicos
(marca, modelo, ano, preço, km, combustível, câmbio, cor, portas, localização,
descrição, fotos). Faltavam atributos que os compradores procuram e que os
principais marketplaces recolhem — nomeadamente **categoria/carroçaria** e
**número de lugares**, entre outros. Sem estes campos, os anúncios ficam menos
informativos e a pesquisa não permite refinar por eles.

## Benchmark competitivo (PT + BR)

Análise dos formulários de anúncio de: **Standvirtual, AutoScout24, OLX Portugal,
CustoJusto** (PT) e **Webmotors, OLX Brasil, Mercado Livre Veículos, iCarros,
Mobiauto** (BR).

Conclusões:
- **Categoria/carroçaria** é obrigatória em quase todos (Standvirtual, OLX BR,
  Webmotors, iCarros). Um único enum em português serve os dois mercados —
  `Carrinha`/`Perua` e `Pick-up`/`Picape` são a mesma categoria.
- **Condição** (Novo/Usado/Para peças) — presente em todos; "Para peças" liga o
  marketplace de carros ao de peças.
- **Lugares** (lotação) — recolhido por Standvirtual e AutoScout24.
- **Potência, cilindrada, tração** e **equipamento/extras** (multi-seleção) —
  aparecem como filtros avançados, escondidos por defeito atrás de "mais filtros".

## Escopo entregue

### Novos campos do anúncio (`Carro`)
`bodyType` (categoria), `seats` (lugares), `condition` (condição), `power` (cv),
`displacement` (cc), `traction` (tração), `features` (equipamento — `string[]`).
Todos opcionais; `condition` assume `Usado` por defeito.

### Tipos / constantes
- Web: `src/types/carro.ts` (+ tipos `BodyType`/`Condition`/`Traction`),
  `src/lib/constants.ts` (`TIPOS_CARROCERIA`, `CONDICOES_VEICULO`, `TIPOS_TRACAO`,
  `EQUIPAMENTOS_CARRO`).
- Mobile: espelhado em `mobile/src/types/index.ts` e `mobile/src/lib/constants.ts`.

### Formulário de criação
- Web: `StepDados` — categoria/condição/lugares no bloco principal; potência,
  cilindrada, tração e equipamento numa secção "Adicionar mais detalhes (opcional)"
  colapsada por defeito.
- Mobile: `app/anunciar/carro.tsx` — mesmos campos, com secção "Mais detalhes".
- Edição: `EditarCarroModal` (admin + perfil, web) e o modo de edição do
  `app/anunciar/carro.tsx` (mobile) também editam todos os novos campos.

### Filtros (avançados no painel colapsável)
- Web (`useCarros` + `CarGrid`): **Categoria** e **Condição** sempre visíveis;
  combustível, câmbio, lugares (mín.), tração e equipamento no painel avançado —
  visível na sidebar em desktop (`lg:block`), escondido em ecrãs pequenos atrás
  de "Mais filtros". Lógica pura e testada em `src/lib/carSpecFilters.ts`.
- Mobile (`useCarFilters` + `CarFiltersSheet`): Categoria/Condição visíveis;
  lugares, tração e equipamento atrás de um toggle "Mais filtros".

### Detalhe do anúncio
- Web: `TechnicalSheet` mostra os novos campos + lista de equipamento; JSON-LD
  `Vehicle` enriquecido (`bodyType`, `seatingCapacity`, `driveWheelConfiguration`,
  `vehicleEngine`, `itemCondition`).
- Mobile: novas specs + secção "Equipamento & Extras".

## Regras Firestore

Nenhuma alteração necessária — `allow create` em `/cars` não faz whitelist de
campos (`isAuthenticated() && hasValidImageCount(7)`).

## Edge cases

- Campos opcionais só são persistidos quando preenchidos (`cleanUndefined` na web,
  `cleanUndefined`/`nullifyUndefined` no mobile).
- Filtro de lugares é mínimo (`>=`); carros sem `seats` são excluídos quando o
  filtro está ativo. Filtro de equipamento exige **todos** os itens escolhidos.
- Anúncios antigos sem os novos campos continuam válidos (campos condicionais).

## Verificação

- `npm test` (novo `carSpecFilters.test.ts`, escrito test-first) — verde.
- `npx tsc --noEmit` (web e mobile) — limpo.
- `npm run build` — compila (falha pré-existente e não relacionada em `video/`).
