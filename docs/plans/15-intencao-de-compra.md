# Plano de Implementação: Intenção de Compra de Carros

**Data:** Maio 2026  
**Versão:** 1.0  
**Status:** Proposta para análise  

---

## 1. Visão Geral

### Objetivo
Implementar um sistema de "intenção de compra" que inverta a dinâmica do marketplace: compradores publicam seus critérios de busca como um anúncio, e vendedores podem entrar em contato diretamente para oferecer carros que atendem àqueles critérios.

### Impacto Esperado
- **Aumentar conversão**: Vendedores ganham leads qualificados (não anunciar "no escuro")
- **Retenção de compradores**: Permanecer no app enquanto procura o carro ideal
- **Monetização**: Premium para destaque de intenção de compra
- **Network effect**: Mais intenções atraem vendedores; mais vendedores atraem compradores
- **Diferenciação**: Competidores (OLX, CustoJusto) ainda não têm esta feature

### Casos de Uso
1. Comprador: "Quero Fiat Punto 2015+ até 15.000€, diesel, até 150.000km"
   → Vendedores vêem e contatam com suas ofertas
2. Vendedor: Faz busca de intenções + descobre que tem um Punto exatamente assim em estoque
3. Comprador volta ao app uma vez por semana para ver quem o contactou

---

## 2. Arquitetura de Dados (Firestore)

### 2.1 Collection: `intencoes_compra`

```typescript
interface IntencaoCompra {
  // Identificadores
  id: string;                          // UUID, gerado automaticamente
  userId: string;                      // FK → users.uid (comprador)
  
  // Identificação
  titulo: string;                      // "Procuro: Fiat Punto até 15k€"
  descricao?: string;                  // contexto extra (até 500 chars)
  
  // Critérios Obrigatórios
  criterios: {
    marca: string;                     // "Fiat" ou "Qualquer" se não especificado
    modelo: string;                    // "Punto" ou null se qualquer
    anoMinimo: number;                 // ex: 2015
    anoMaximo?: number;                // ex: 2024 (atual por padrão)
    
    precoMinimo?: number;              // em €, null = sem limite inferior
    precoMaximo: number;               // em €, obrigatório
    
    combustivel: Array<               // múltipla escolha
      'gasolina' |
      'diesel' |
      'hibrido' |
      'eletrico' |
      'GPL' |
      'qualquer'
    >;
    
    tipoTransmissao: Array<
      'manual' |
      'automatico' |
      'qualquer'
    >;
    
    quilometragemMaxima: number;       // em km, ex: 150000
    
    localizacao: {
      distrito: string;               // "Porto"
      raio: number;                   // km de busca (0 = apenas esta área, 200 = nacional)
      latitude?: number;
      longitude?: number;             // coords do distrito
    };
  };
  
  // Critérios Opcionais
  preferencias?: {
    cores?: string[];                 // ["branco", "preto", "prata"]
    tipoCarroceria?: Array<
      'sedan' |
      'suv' |
      'hatchback' |
      'coupe' |
      'camionieta' |
      'monovolume'
    >;
    itensDesejados?: string[];        // ["GPS", "Teto panorâmico", "Couro"]
    aceitaFinanciamento?: boolean;
    aceitaTroca?: boolean;
    aceitaVeiculo23Registros?: boolean; // 2ª mão
  };
  
  // Contactabilidade
  contatoPreferido: 'chat' | 'whatsapp' | 'ambos';
  mostrarTelefone: boolean;            // se true, vendedor vê número
  
  // Status & Prioridade
  status: 'ativa' | 'pausada' | 'expirada' | 'deletada';
  prioritária: boolean;                // destaque pago
  
  // Destaque Pago (similar a lojas/profissionais)
  destaque?: {
    ativo: boolean;
    tipo?: 'destacada' | 'superdestacar';
    dataInicio?: Timestamp;
    dataFim?: Timestamp;
    posicao?: number;                 // ordem na busca
    recorrente?: boolean;
  };
  
  // Estatísticas
  stats: {
    visualizacoes: number;
    visualizacoes7Dias: number;
    contatos: number;
    contatos7Dias: number;
  };
  
  // Timestamps & Gestão
  criadaEm: Timestamp;
  atualizadaEm: Timestamp;
  expiradoEm?: Timestamp;              // se pausada temporariamente
  deletadaEm?: Timestamp;              // soft delete
}
```

### 2.2 Collection: `contatos_intencao`

Registro de cada contato de vendedor para intenção:

```typescript
interface ContatoIntencao {
  id: string;
  intencaoId: string;                  // FK → intencoes_compra.id
  vendedorId: string;                  // FK → users.uid (profissional)
  carroId?: string;                    // FK → cars.id (opcional, se vende um carro específico)
  
  titulo: string;                      // ex: "Tenho um Fiat Punto 2018"
  descricao?: string;                  // msg inicial do vendedor
  precoOferido?: number;               // se tiver um carro específico
  
  status: 'aberto' | 'respondido' | 'aceito' | 'rejeitado' | 'finalizado';
  
  // Chat integrado
  chatId: string;                      // FK → chats.id
  ultimaMensagemEm?: Timestamp;
  
  // Marcadores
  marcadoComoRelevante: boolean;       // comprador favorita este contato
  
  criadoEm: Timestamp;
  atualizadoEm: Timestamp;
}
```

### 2.3 Collection: `notificacoes_intencao`

Para notificar vendedores sobre novas intenções matching:

```typescript
interface NotificacaoIntencao {
  id: string;
  vendedorId: string;                  // FK → users.uid
  intencaoId: string;                  // FK → intencoes_compra.id
  
  tipo: 'nova_intencao_match' | 'intenção_recebeu_contato';
  titulo: string;
  descricao: string;
  
  lida: boolean;
  
  criadaEm: Timestamp;
}
```

### 2.4 Collection: `denuncias_intencao`

Para moderação (intenções falsas, spam, etc):

```typescript
interface DenunciaIntencao {
  id: string;
  intencaoId: string;
  denunciantId: string;                // FK → users.uid (quem denunciou)
  
  motivo: 'falsa' | 'spam' | 'golpe' | 'outra';
  descricao: string;
  
  status: 'aberta' | 'investigando' | 'resolvida';
  acaoTomada?: 'aviso' | 'suspensao' | 'remocao';
  
  investigadorId?: string;             // admin
  notas?: string;
  
  criadaEm: Timestamp;
  resolvidaEm?: Timestamp;
}
```

### 2.5 Atualizar Collection: `users`

Adicionar campos:

```typescript
interface Usuario {
  // ... campos existentes ...
  
  // Estatísticas de intenção de compra
  intencoes: {
    total: number;
    ativas: number;
    recebeuContatosUltimos7Dias: number;
  };
  
  preferenciasNotificacao: {
    novasIntencoes?: boolean;         // notificar sobre novas intenções matching
    contatosRecebidos?: boolean;      // notificar ao receber contato
  };
}
```

### 2.6 Firestore Indexes

```json
{
  "indexes": [
    {
      "collectionGroup": "intencoes_compra",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "userId", "order": "ASCENDING"},
        {"fieldPath": "status", "order": "ASCENDING"},
        {"fieldPath": "atualizadaEm", "order": "DESCENDING"}
      ]
    },
    {
      "collectionGroup": "intencoes_compra",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "status", "order": "ASCENDING"},
        {"fieldPath": "prioritária", "order": "DESCENDING"},
        {"fieldPath": "destaque.ativo", "order": "DESCENDING"},
        {"fieldPath": "atualizadaEm", "order": "DESCENDING"}
      ]
    },
    {
      "collectionGroup": "intencoes_compra",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "criterios.marca", "order": "ASCENDING"},
        {"fieldPath": "criterios.anoMinimo", "order": "ASCENDING"},
        {"fieldPath": "status", "order": "ASCENDING"},
        {"fieldPath": "atualizadaEm", "order": "DESCENDING"}
      ]
    },
    {
      "collectionGroup": "contatos_intencao",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "intencaoId", "order": "ASCENDING"},
        {"fieldPath": "criadoEm", "order": "DESCENDING"}
      ]
    },
    {
      "collectionGroup": "contatos_intencao",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "vendedorId", "order": "ASCENDING"},
        {"fieldPath": "status", "order": "ASCENDING"},
        {"fieldPath": "criadoEm", "order": "DESCENDING"}
      ]
    }
  ]
}
```

---

## 3. Fluxo de Frontend

### 3.1 Integração com Aba "Vender" (Existing)

**Atual**: `app/anunciar/page.tsx`

**Novo**: Adicionar toggle no início da página

```tsx
// app/anunciar/page.tsx (modificar)

export default function AnunciarPage() {
  const [modo, setModo] = useState<'vender' | 'comprar'>('vender');

  return (
    <div className="anunciar-container">
      {/* Toggle Modo */}
      <div className="modo-toggle">
        <Button
          variant={modo === 'vender' ? 'primary' : 'ghost'}
          onClick={() => setModo('vender')}
        >
          📢 Vender Carro
        </Button>
        <Button
          variant={modo === 'comprar' ? 'primary' : 'ghost'}
          onClick={() => setModo('comprar')}
        >
          🔍 Procurar Carro
        </Button>
      </div>

      {/* Conteúdo Dinâmico */}
      {modo === 'vender' ? (
        <AnunciarCarro />                // componente existente
      ) : (
        <CriarIntencaoCompra />          // novo componente
      )}
    </div>
  );
}
```

### 3.2 Componente: `CriarIntencaoCompra` (novo)

**Fluxo multi-step** (similar ao fluxo de anunciar):

#### Passo 1: Básico (Marca, Modelo, Ano)

```tsx
<FormStep title="O que você procura?">
  <Select
    label="Marca *"
    options={marcas}
    value={form.criterios.marca}
    onChange={(v) => updateForm('criterios.marca', v)}
    placeholder="Selecione a marca"
  />
  
  <Select
    label="Modelo *"
    options={modelosPorMarca[form.criterios.marca] || []}
    value={form.criterios.modelo}
    onChange={(v) => updateForm('criterios.modelo', v)}
    placeholder="Selecione o modelo"
  />
  
  <RangeInput
    label="Ano *"
    min={1990}
    max={new Date().getFullYear()}
    minValue={form.criterios.anoMinimo}
    maxValue={form.criterios.anoMaximo}
    onChange={(min, max) => {
      updateForm('criterios.anoMinimo', min);
      updateForm('criterios.anoMaximo', max);
    }}
  />
  
  <NextButton />
</FormStep>
```

#### Passo 2: Preço & Combustível

```tsx
<FormStep title="Orçamento">
  <RangeInput
    label="Faixa de preço (€) *"
    min={0}
    max={100000}
    step={500}
    minValue={form.criterios.precoMinimo}
    maxValue={form.criterios.precoMaximo}
    onChange={(min, max) => {
      updateForm('criterios.precoMinimo', min);
      updateForm('criterios.precoMaximo', max);
    }}
  />
  
  <MultiCheckbox
    label="Combustível *"
    options={COMBUSTIVEIS}
    selected={form.criterios.combustivel}
    onChange={(v) => updateForm('criterios.combustivel', v)}
  />
  
  <MultiCheckbox
    label="Transmissão *"
    options={TRANSMISSOES}
    selected={form.criterios.tipoTransmissao}
    onChange={(v) => updateForm('criterios.tipoTransmissao', v)}
  />
  
  <NextButton />
</FormStep>
```

#### Passo 3: Localização & Quilometragem

```tsx
<FormStep title="Onde e quando?">
  <Select
    label="Distrito *"
    options={DISTRITOS}
    value={form.criterios.localizacao.distrito}
    onChange={(v) => updateForm('criterios.localizacao.distrito', v)}
  />
  
  <RangeInput
    label="Raio de busca (km) *"
    min={0}
    max={200}
    step={10}
    value={form.criterios.localizacao.raio}
    onChange={(v) => updateForm('criterios.localizacao.raio', v)}
    hint="0 = apenas este distrito | 200 = em todo o país"
  />
  
  <NumberInput
    label="Quilometragem máxima (km) *"
    value={form.criterios.quilometragemMaxima}
    onChange={(v) => updateForm('criterios.quilometragemMaxima', v)}
    placeholder="Ex: 150000"
  />
  
  <NextButton />
</FormStep>
```

#### Passo 4: Preferências (Opcional)

```tsx
<FormStep title="Preferências adicionais" subtitle="(Opcional)">
  <MultiCheckbox
    label="Cores preferidas"
    options={CORES}
    selected={form.preferencias?.cores || []}
    onChange={(v) => updateForm('preferencias.cores', v)}
  />
  
  <MultiCheckbox
    label="Tipo de carroceria"
    options={CARROCERIAS}
    selected={form.preferencias?.tipoCarroceria || []}
    onChange={(v) => updateForm('preferencias.tipoCarroceria', v)}
  />
  
  <MultiCheckbox
    label="Itens desejados"
    options={ITENS_SERIE}
    selected={form.preferencias?.itensDesejados || []}
    onChange={(v) => updateForm('preferencias.itensDesejados', v)}
  />
  
  <Toggle
    label="Aceita financiamento?"
    checked={form.preferencias?.aceitaFinanciamento}
    onChange={(v) => updateForm('preferencias.aceitaFinanciamento', v)}
  />
  
  <Toggle
    label="Aceita troca?"
    checked={form.preferencias?.aceitaTroca}
    onChange={(v) => updateForm('preferencias.aceitaTroca', v)}
  />
  
  <NextButton />
</FormStep>
```

#### Passo 5: Contactabilidade

```tsx
<FormStep title="Como você prefere ser contactado?">
  <RadioGroup
    label="Forma de contacto preferida *"
    options={[
      { value: 'chat', label: '💬 Chat do app' },
      { value: 'whatsapp', label: '🟢 WhatsApp' },
      { value: 'ambos', label: '🔄 Ambos' },
    ]}
    selected={form.contatoPreferido}
    onChange={(v) => updateForm('contatoPreferido', v)}
  />
  
  <Toggle
    label="Mostrar meu telefone para vendedores"
    checked={form.mostrarTelefone}
    onChange={(v) => updateForm('mostrarTelefone', v)}
    hint="Vendedores poderão ligar ou enviar SMS"
  />
  
  <TextArea
    label="Descrição adicional (opcional)"
    placeholder="Ex: Compro para uso pessoal, urgente, etc"
    maxLength={500}
    value={form.descricao}
    onChange={(v) => updateForm('descricao', v)}
  />
  
  <NextButton />
</FormStep>
```

#### Passo 6: Resumo & Publicar

```tsx
<FormStep title="Confirmar intenção">
  <div className="resumo">
    <h3>📋 Seu anúncio</h3>
    
    <div className="resumo-item">
      <label>Procura:</label>
      <span>{form.criterios.marca} {form.criterios.modelo}</span>
    </div>
    
    <div className="resumo-item">
      <label>Ano:</label>
      <span>{form.criterios.anoMinimo} – {form.criterios.anoMaximo}</span>
    </div>
    
    <div className="resumo-item">
      <label>Orçamento:</label>
      <span>€{form.criterios.precoMinimo} – €{form.criterios.precoMaximo}</span>
    </div>
    
    <div className="resumo-item">
      <label>Localização:</label>
      <span>{form.criterios.localizacao.distrito} ({form.criterios.localizacao.raio}km)</span>
    </div>

    <div className="resumo-item">
      <label>Combustível:</label>
      <span>{form.criterios.combustivel.join(', ')}</span>
    </div>

    <div className="resumo-item">
      <label>Transmissão:</label>
      <span>{form.criterios.tipoTransmissao.join(', ')}</span>
    </div>

    <div className="resumo-item">
      <label>Km máximo:</label>
      <span>{form.criterios.quilometragemMaxima}km</span>
    </div>

    {form.descricao && (
      <div className="resumo-item">
        <label>Observações:</label>
        <span>{form.descricao}</span>
      </div>
    )}
  </div>

  <Checkbox
    label="Concordo com os Termos de Serviço *"
    required
  />

  <Button
    type="primary"
    onClick={handlePublicar}
    disabled={!formValido()}
  >
    ✅ Publicar Intenção de Compra
  </Button>
</FormStep>
```

### 3.3 Página: `/minhas-intencoes` (Novo)

Dashboard do comprador com suas intenções:

```tsx
// app/minhas-intencoes/page.tsx

export default function MinhasIntencoes() {
  const [intencoes, setIntencoes] = useState<IntencaoCompra[]>([]);
  const [tab, setTab] = useState<'ativas' | 'pausadas' | 'expiradas'>('ativas');

  return (
    <div className="minhas-intencoes">
      <Header title="Minhas Intenções de Compra" />

      <Tabs value={tab} onChange={setTab}>
        <Tab value="ativas" label={`Ativas (${intencoes.filter(i => i.status === 'ativa').length})`}>
          {intencoes
            .filter(i => i.status === 'ativa')
            .map(intencao => (
              <IntencaoCard
                key={intencao.id}
                intencao={intencao}
                onEdit={() => navigateTo(`/intencao/${intencao.id}/editar`)}
                onViewContatos={() => navigateTo(`/intencao/${intencao.id}/contatos`)}
                onPause={() => pausarIntencao(intencao.id)}
                onDelete={() => deletarIntencao(intencao.id)}
              />
            ))}
        </Tab>

        <Tab value="pausadas" label={`Pausadas (${intencoes.filter(i => i.status === 'pausada').length})`}>
          {/* ... similar ... */}
        </Tab>

        <Tab value="expiradas" label={`Expiradas (${intencoes.filter(i => i.status === 'expirada').length})`}>
          {/* ... similar ... */}
        </Tab>
      </Tabs>
    </div>
  );
}
```

**Card da Intenção:**

```tsx
function IntencaoCard({ intencao, onEdit, onViewContatos, onPause, onDelete }) {
  return (
    <div className="intencao-card">
      <div className="intencao-header">
        <h3>
          {intencao.criterios.marca} {intencao.criterios.modelo}
          {intencao.destaque?.ativo && <Badge>⭐ Destacada</Badge>}
        </h3>
        <span className={`status ${intencao.status}`}>{intencao.status}</span>
      </div>

      <div className="intencao-details">
        <Detail icon="📅" label="Ano" value={`${intencao.criterios.anoMinimo}–${intencao.criterios.anoMaximo}`} />
        <Detail icon="💰" label="Preço" value={`€${intencao.criterios.precoMinimo}–€${intencao.criterios.precoMaximo}`} />
        <Detail icon="⛽" label="Combustível" value={intencao.criterios.combustivel.join(', ')} />
        <Detail icon="📍" label="Região" value={`${intencao.criterios.localizacao.distrito} (${intencao.criterios.localizacao.raio}km)`} />
      </div>

      <div className="intencao-stats">
        <Stat icon="👁" label="Visualizações" value={intencao.stats.visualizacoes} />
        <Stat icon="💬" label="Contatos" value={intencao.stats.contatos} />
      </div>

      <div className="intencao-actions">
        <Button variant="primary" onClick={onViewContatos}>
          👥 Ver {intencao.stats.contatos} Contatos
        </Button>
        <Button variant="secondary" onClick={onEdit}>
          ✏️ Editar
        </Button>
        <Button variant="ghost" onClick={onPause}>
          ⏸️ Pausar
        </Button>
        <Button variant="danger" onClick={onDelete}>
          🗑️ Deletar
        </Button>
      </div>

      <div className="intencao-dates">
        <small>Criada em: {formatDate(intencao.criadaEm)}</small>
        <small>Última atualização: {formatDate(intencao.atualizadaEm)}</small>
      </div>
    </div>
  );
}
```

### 3.4 Página: `/intencao/[id]/contatos` (Novo)

CRM para comprador gerenciar contatos de vendedores:

```tsx
// app/intencao/[id]/contatos/page.tsx

export default function ContatosIntencao({ params }) {
  const [contatos, setContatos] = useState<ContatoIntencao[]>([]);
  const [filtro, setFiltro] = useState<'todos' | 'novos' | 'respondidos'>('todos');

  return (
    <div className="contatos-intencao">
      <Header title={`Quem se interessou em sua intenção`} backButton />

      <Tabs value={filtro} onChange={setFiltro}>
        <Tab value="todos" label={`Todos (${contatos.length})`}>
          {contatos.map(contato => (
            <ContatoCard
              key={contato.id}
              contato={contato}
              onMarcarRelevante={() => marcarComoRelevante(contato.id)}
              onAbrir={() => navigateTo(`/chat/${contato.chatId}`)}
              onRejeitar={() => rejeitarContato(contato.id)}
            />
          ))}
        </Tab>

        <Tab value="novos" label={`Novos (${contatos.filter(c => c.status === 'aberto').length})`}>
          {/* ... similar ... */}
        </Tab>

        <Tab value="respondidos" label={`Respondidos (${contatos.filter(c => c.status === 'respondido').length})`}>
          {/* ... similar ... */}
        </Tab>
      </Tabs>
    </div>
  );
}
```

**Card de Contato:**

```tsx
function ContatoCard({ contato, onMarcarRelevante, onAbrir, onRejeitar }) {
  return (
    <div className="contato-card">
      <div className="contato-header">
        <Avatar src={contato.vendedorAvatar} />
        <div className="contato-info">
          <h4>{contato.vendedorNome}</h4>
          <p className="contato-titulo">{contato.titulo}</p>
          <small className="contato-data">
            {formatRelative(contato.criadoEm)}
          </small>
        </div>
        <Badge className={`status ${contato.status}`}>{contato.status}</Badge>
      </div>

      <p className="contato-mensagem">{contato.descricao}</p>

      {contato.carroId && (
        <div className="contato-carro">
          <strong>Carro: </strong>
          {contato.carroMarca} {contato.carroModelo} ({contato.carroAno})
          {contato.precoOferido && <span>• €{contato.precoOferido}</span>}
        </div>
      )}

      <div className="contato-actions">
        <Button
          variant="primary"
          onClick={onAbrir}
        >
          💬 Abrir Chat
        </Button>

        <Button
          variant="secondary"
          onClick={onMarcarRelevante}
          disabled={contato.marcadoComoRelevante}
        >
          ⭐ Marcar Relevante
        </Button>

        <Button
          variant="ghost"
          onClick={onRejeitar}
        >
          ❌ Rejeitar
        </Button>
      </div>
    </div>
  );
}
```

### 3.5 Integração com Busca Existente

**Adicionar seção em `/` (home) e `/busca`:**

```tsx
// src/components/home/CarGrid.tsx (modificar)

export function CarGrid() {
  const [tipoResultado, setTipoResultado] = useState<'carros' | 'intencoes'>('carros');

  return (
    <div>
      <Tabs value={tipoResultado} onChange={setTipoResultado}>
        <Tab value="carros" label="🚗 Carros à Venda">
          {/* Grid de carros existente */}
        </Tab>

        <Tab value="intencoes" label="🔍 Intenções de Compra">
          {/* Grid de intenções */}
          <IntencoesList
            filtros={filtros}
            onContactar={handleContactarComprador}
          />
        </Tab>
      </Tabs>
    </div>
  );
}
```

**Componente: `IntencoesList`**

```tsx
function IntencoesList({ filtros, onContactar }) {
  const [intencoes, setIntencoes] = useState<IntencaoCompra[]>([]);
  const [loading, setLoading] = useState(false);

  // Buscar com filtros
  useEffect(() => {
    buscarIntencoes({
      marca: filtros.marca,
      precoMax: filtros.precoMax,
      distrito: filtros.distrito,
      raio: filtros.raio,
    }).then(setIntencoes);
  }, [filtros]);

  return (
    <div className="intencoes-grid">
      {intencoes.map(intencao => (
        <IntencaoSearchCard
          key={intencao.id}
          intencao={intencao}
          onContactar={() => onContactar(intencao.id)}
        />
      ))}
    </div>
  );
}

function IntencaoSearchCard({ intencao, onContactar }) {
  return (
    <div className="intencao-search-card">
      <div className="card-header">
        <h3>
          {intencao.criterios.marca} {intencao.criterios.modelo}
          {intencao.destaque?.ativo && <Badge className="destaque">⭐ Destacada</Badge>}
        </h3>
      </div>

      <div className="card-body">
        <Detail label="Ano" value={`${intencao.criterios.anoMinimo}–${intencao.criterios.anoMaximo}`} />
        <Detail label="Orçamento" value={`€${intencao.criterios.precoMinimo}–€${intencao.criterios.precoMaximo}`} />
        <Detail label="Combustível" value={intencao.criterios.combustivel.join(', ')} />
        <Detail label="Localização" value={intencao.criterios.localizacao.distrito} />
        <Detail label="Raio" value={`${intencao.criterios.localizacao.raio}km`} />
        <Detail label="Km máx." value={`${intencao.criterios.quilometragemMaxima}km`} />

        {intencao.preferencias?.cores && (
          <Detail label="Cores preferidas" value={intencao.preferencias.cores.join(', ')} />
        )}

        {intencao.descricao && (
          <Detail label="Observações" value={intencao.descricao} />
        )}
      </div>

      <div className="card-footer">
        <Button variant="primary" onClick={onContactar}>
          💬 Tenho um que se adequa
        </Button>
      </div>
    </div>
  );
}
```

---

## 4. API Endpoints

### 4.1 CRUD de Intenção de Compra

**Backend**: `src/lib/db.ts` + Cloud Functions

```typescript
// CREATE
async function criarIntencaoCompra(
  userId: string,
  dados: IntencaoCompraFormData
): Promise<string> {
  // 1. Validar dados
  const validacao = validarIntencaoCompra(dados);
  if (!validacao.valido) throw new Error(validacao.erros.join(', '));

  // 2. Gerar title automático
  const titulo = gerarTitulo(dados.criterios);

  // 3. Criar documento
  const intencaoId = generateId();
  await setDoc(doc(db, 'intencoes_compra', intencaoId), {
    id: intencaoId,
    userId,
    titulo,
    ...dados,
    status: 'ativa',
    prioritária: false,
    stats: {
      visualizacoes: 0,
      visualizacoes7Dias: 0,
      contatos: 0,
      contatos7Dias: 0,
    },
    criadaEm: Timestamp.now(),
    atualizadaEm: Timestamp.now(),
  });

  // 4. Notificar vendedores (opcional, via Cloud Task)
  // encontrar carros que matchers com critérios...
  // enviar notificação "Nova intenção de compra!"

  return intencaoId;
}

// READ
async function getIntencaoCompra(intencaoId: string): Promise<IntencaoCompra> {
  const doc = await getDoc(doc(db, 'intencoes_compra', intencaoId));
  if (!doc.exists()) throw new Error('Intenção não encontrada');
  
  // Increment visualizações
  await updateDoc(doc.ref, {
    'stats.visualizacoes': increment(1),
    'stats.visualizacoes7Dias': increment(1),
  });
  
  return doc.data() as IntencaoCompra;
}

// UPDATE
async function atualizarIntencaoCompra(
  intencaoId: string,
  userId: string,
  updates: Partial<IntencaoCompra>
) {
  const intencao = await getIntencaoCompra(intencaoId);
  if (intencao.userId !== userId) throw new Error('Não autorizado');

  const validacao = validarIntencaoCompra({ ...intencao, ...updates });
  if (!validacao.valido) throw new Error(validacao.erros.join(', '));

  await updateDoc(doc(db, 'intencoes_compra', intencaoId), {
    ...updates,
    atualizadaEm: Timestamp.now(),
  });
}

// DELETE (soft delete)
async function deletarIntencaoCompra(intencaoId: string, userId: string) {
  const intencao = await getIntencaoCompra(intencaoId);
  if (intencao.userId !== userId) throw new Error('Não autorizado');

  await updateDoc(doc(db, 'intencoes_compra', intencaoId), {
    deletadaEm: Timestamp.now(),
    status: 'deletada',
  });
}

// PAUSE
async function pausarIntencaoCompra(intencaoId: string, userId: string) {
  const intencao = await getIntencaoCompra(intencaoId);
  if (intencao.userId !== userId) throw new Error('Não autorizado');

  await updateDoc(doc(db, 'intencoes_compra', intencaoId), {
    status: 'pausada',
    expiradoEm: Timestamp.now(),
    atualizadaEm: Timestamp.now(),
  });
}

// RESUME
async function reativarIntencaoCompra(intencaoId: string, userId: string) {
  const intencao = await getIntencaoCompra(intencaoId);
  if (intencao.userId !== userId) throw new Error('Não autorizado');

  await updateDoc(doc(db, 'intencoes_compra', intencaoId), {
    status: 'ativa',
    expiradoEm: null,
    atualizadaEm: Timestamp.now(),
  });
}
```

### 4.2 Busca de Intenções

```typescript
// Buscar intenções que "matcham" com um carro do vendedor
async function buscarIntencoesPorCarro(
  carro: Carro,
  usuarioId: string
): Promise<IntencaoCompra[]> {
  const queries: Query[] = [];

  // Matcher básico: marca, modelo, ano, preço, combustível, localização
  queries.push(
    query(
      collection(db, 'intencoes_compra'),
      where('status', '==', 'ativa'),
      where('criterios.marca', '==', carro.marca),
      where('criterios.anoMinimo', '<=', carro.ano),
      where('criterios.anoMaximo', '>=', carro.ano),
      where('criterios.precoMinimo', '<=', carro.preco),
      where('criterios.precoMaximo', '>=', carro.preco)
    )
  );

  let resultados: IntencaoCompra[] = [];
  for (const q of queries) {
    const snap = await getDocs(q);
    resultados.push(...snap.docs.map(d => d.data() as IntencaoCompra));
  }

  // Filtrar por filtros adicionais
  resultados = resultados.filter(intencao => {
    // Combustível
    if (!intencao.criterios.combustivel.includes(carro.combustivel)) return false;

    // Transmissão
    if (!intencao.criterios.tipoTransmissao.includes(carro.tipoTransmissao)) return false;

    // Quilometragem
    if (carro.quilometragem > intencao.criterios.quilometragemMaxima) return false;

    // Localização (raio)
    const distancia = getDistance(
      [carro.endereco.latitude, carro.endereco.longitude],
      [
        intencao.criterios.localizacao.latitude || 41,
        intencao.criterios.localizacao.longitude || -8
      ]
    );
    if (distancia > intencao.criterios.localizacao.raio) return false;

    // Preferências opcionais
    if (intencao.preferencias?.cores?.length > 0 && !intencao.preferencias.cores.includes(carro.cor)) return false;

    // Não retornar intenções do próprio usuário
    if (intencao.userId === usuarioId) return false;

    return true;
  });

  // Ordenar por destaque, depois por visualizações recentes
  return resultados.sort((a, b) => {
    if (a.destaque?.ativo && !b.destaque?.ativo) return -1;
    if (!a.destaque?.ativo && b.destaque?.ativo) return 1;
    return b.stats.visualizacoes7Dias - a.stats.visualizacoes7Dias;
  });
}

// Busca por filtros (para página /busca)
async function buscarIntencoesComFiltros(filtros: {
  marca?: string;
  modelo?: string;
  precoMin?: number;
  precoMax?: number;
  combustivel?: string[];
  distrito?: string;
  raio?: number;
}): Promise<IntencaoCompra[]> {
  let q = query(
    collection(db, 'intencoes_compra'),
    where('status', '==', 'ativa')
  );

  // Aplicar filtros (simplificado; em produção usar índices compostos)
  if (filtros.marca) {
    q = query(q, where('criterios.marca', '==', filtros.marca));
  }

  const snap = await getDocs(q);
  let resultados = snap.docs.map(d => d.data() as IntencaoCompra);

  // Pós-filtrar
  if (filtros.precoMax) {
    resultados = resultados.filter(i => i.criterios.precoMinimo <= filtros.precoMax);
  }

  return resultados;
}
```

### 4.3 Gerenciar Contato

```typescript
// Vendedor inicia contato com comprador
async function iniciarContatoIntencao(
  intencaoId: string,
  vendedorId: string,
  carroId?: string,
  mensagem?: string
): Promise<string> {
  const intencao = await getIntencaoCompra(intencaoId);

  // 1. Criar chat se não existir
  const chatId = await getOrCreateChat(vendedorId, intencao.userId);

  // 2. Registrar contato
  const contatoId = generateId();
  await setDoc(doc(db, 'contatos_intencao', contatoId), {
    id: contatoId,
    intencaoId,
    vendedorId,
    carroId,
    titulo: carroId ? `Tenho um carro para você!` : `Interesse em sua intenção`,
    descricao: mensagem,
    status: 'aberto',
    chatId,
    marcadoComoRelevante: false,
    criadoEm: Timestamp.now(),
    atualizadoEm: Timestamp.now(),
  });

  // 3. Enviar mensagem inicial no chat
  if (mensagem) {
    await addDoc(collection(db, 'messages'), {
      chatId,
      senderUid: vendedorId,
      text: mensagem,
      criadaEm: Timestamp.now(),
      lida: false,
    });
  }

  // 4. Atualizar stats da intenção
  await updateDoc(doc(db, 'intencoes_compra', intencaoId), {
    'stats.contatos': increment(1),
    'stats.contatos7Dias': increment(1),
  });

  // 5. Notificar comprador
  await enviarNotificacao(intencao.userId, {
    titulo: 'Novo interessado!',
    mensagem: `Um vendedor se interessou em sua intenção de compra: ${intencao.titulo}`,
    tipo: 'novoContatoIntencao',
    acao: { texto: 'Ver contato', rota: `/intencao/${intencaoId}/contatos/${contatoId}` },
  });

  return contatoId;
}

// Comprador marca contato como relevante
async function marcarContatoRelevante(contatoId: string, userId: string) {
  const contato = await getDoc(doc(db, 'contatos_intencao', contatoId));
  const intencao = await getIntencaoCompra(contato.data().intencaoId);

  if (intencao.userId !== userId) throw new Error('Não autorizado');

  await updateDoc(contato.ref, {
    marcadoComoRelevante: true,
    atualizadoEm: Timestamp.now(),
  });
}

// Comprador rejeita contato
async function rejeitarContato(contatoId: string, userId: string) {
  const contato = await getDoc(doc(db, 'contatos_intencao', contatoId));
  const intencao = await getIntencaoCompra(contato.data().intencaoId);

  if (intencao.userId !== userId) throw new Error('Não autorizado');

  await updateDoc(contato.ref, {
    status: 'rejeitado',
    atualizadoEm: Timestamp.now(),
  });
}
```

---

## 5. Regras de Negócio & Validações

### 5.1 Validações de Formulário

```typescript
function validarIntencaoCompra(dados: Partial<IntencaoCompra>): ValidationResult {
  const erros: string[] = [];

  // Obrigatórios
  if (!dados.criterios?.marca) erros.push('Marca é obrigatória');
  if (!dados.criterios?.modelo) erros.push('Modelo é obrigatório');
  if (!dados.criterios?.anoMinimo) erros.push('Ano mínimo é obrigatório');
  if (!dados.criterios?.precoMaximo) erros.push('Orçamento máximo é obrigatório');

  // Validações de range
  if (dados.criterios?.anoMinimo && dados.criterios?.anoMaximo) {
    if (dados.criterios.anoMinimo > dados.criterios.anoMaximo) {
      erros.push('Ano mínimo não pode ser maior que o máximo');
    }
    if (dados.criterios.anoMinimo < 1990) {
      erros.push('Ano mínimo deve ser 1990 ou depois');
    }
    if (dados.criterios.anoMaximo > new Date().getFullYear()) {
      erros.push('Ano máximo não pode ser no futuro');
    }
  }

  if (dados.criterios?.precoMinimo && dados.criterios?.precoMaximo) {
    if (dados.criterios.precoMinimo > dados.criterios.precoMaximo) {
      erros.push('Preço mínimo não pode ser maior que o máximo');
    }
    if (dados.criterios.precoMaximo <= 0) {
      erros.push('Orçamento máximo deve ser maior que 0');
    }
  }

  if (dados.criterios?.quilometragemMaxima && dados.criterios.quilometragemMaxima < 0) {
    erros.push('Quilometragem deve ser maior ou igual a 0');
  }

  // Combustível e transmissão
  if (!dados.criterios?.combustivel || dados.criterios.combustivel.length === 0) {
    erros.push('Selecione ao menos um tipo de combustível');
  }
  if (!dados.criterios?.tipoTransmissao || dados.criterios.tipoTransmissao.length === 0) {
    erros.push('Selecione ao menos um tipo de transmissão');
  }

  // Localização
  if (!dados.criterios?.localizacao?.distrito) {
    erros.push('Distrito é obrigatório');
  }
  if (dados.criterios?.localizacao?.raio === undefined) {
    erros.push('Raio de busca é obrigatório');
  }

  // Contactabilidade
  if (!dados.contatoPreferido) {
    erros.push('Selecione forma de contacto preferida');
  }

  // Descrição
  if (dados.descricao && dados.descricao.length > 500) {
    erros.push('Descrição não pode ter mais de 500 caracteres');
  }

  return {
    valido: erros.length === 0,
    erros,
  };
}
```

### 5.2 Regras de Negócio

| Regra | Descrição | Implementação |
|-------|-----------|---------------|
| Uma intenção por usuário e período | Usuário não pode ter múltiplas intenções ativas do mesmo carro | Validar no formulário, adicionar warning |
| Expiração automática | Intenção expira após 90 dias se não for renovada | Cloud Scheduler job |
| Limite de contactos | Vendedor não pode contatar mesma intenção 2x sem resposta | Validar no backend |
| Moderação automática | Intenção com 3+ denúncias é suspensa | Cloud Function listener |
| Score de confiabilidade | Novos usuários têm limite de 1 intenção/semana até reputação 4.0⭐ | Validar na criação |

---

## 6. Integração com Chat Existente

### 6.1 Reutilizar `chats` Collection

```typescript
interface Chat {
  // ... campos existentes ...

  // Campo novo
  relacao: 'vendedor_comprador' | 'usuario_profissional' | 'intencao_de_compra';
  intencaoId?: string;                 // se relacao == 'intencao_de_compra'
  carroRelacionado?: {
    carroId: string;
    marca: string;
    modelo: string;
    ano: number;
    preco: number;
  };
}
```

### 6.2 Flow no Chat

Quando vendedor abre chat originado de intenção:
- Mostrar card pequeno acima da conversa: "Intenção: Fiat Punto 2015+ até 15k€"
- Botão para compartilhar anúncio do carro (se tiver)
- Integração com fotos do carro (copiar link)

---

## 7. Sistema de Moderação & Denúncia

### 7.1 Triggers Automáticas

```typescript
// Cloud Function: intencoes_compra.onCreate
async function onNovaIntencao(intencaoId: string) {
  const intencao = await getDoc(doc(db, 'intencoes_compra', intencaoId));

  // 1. Detectar spam (mesmos critérios em múltiplas intenções)
  const outras = await getDocs(
    query(
      collection(db, 'intencoes_compra'),
      where('userId', '==', intencao.userId),
      where('status', '!=', 'deletada')
    )
  );

  const similares = outras.docs.filter(d => {
    const outro = d.data() as IntencaoCompra;
    return (
      outro.criterios.marca === intencao.criterios.marca &&
      outro.criterios.modelo === intencao.criterios.modelo &&
      outro.id !== intencaoId
    );
  });

  if (similares.length > 0) {
    // Avisar moderador
    await criarDenuncia(intencaoId, 'SISTEMA', 'spam', 'Múltiplas intenções idênticas');
  }

  // 2. Validar fotos/comentários (buscar palavras-chave suspeitas)
  if (intencao.descricao) {
    const flagged = detectarPalavrasOfensivas(intencao.descricao);
    if (flagged) {
      await criarDenuncia(intencaoId, 'SISTEMA', 'conteudo_ofensivo', flagged.join(', '));
    }
  }
}
```

### 7.2 Painel de Moderação

**Página: `app/admin/intencoes/denuncias/page.tsx`**

Fila com:
- Status filter (aberta, investigando, resolvida)
- Prioridade (critica, alta, media, baixa)
- Profile da intenção + denúncia lado-a-lado
- Botões: Arquivar / Avisar / Suspender / Remover
- Notas internas
- Log de ações

---

## 8. Estimativa de Esforço por Sprint

### 8.1 Breakdown Detalhado

| Componente | Tarefas | Dev | QA | Design | Total (dias) |
|------------|---------|-----|-----|--------|--------------|
| **Estrutura BD** | Schema Firestore, indexes | 1 | 1 | — | 2 |
| **Form Criação** | Multi-step form, validações | 3 | 1 | 1 | 5 |
| **Painel Dashboard** | Minhas intenções, edição | 2 | 1 | 1 | 4 |
| **Busca Integrada** | Adicionar aba, filtros | 2 | 1 | — | 3 |
| **Página de Contatos** | CRM comprador, card contatos | 2 | 1 | 1 | 4 |
| **API CRUD** | Endpoints, validações backend | 2 | 1 | — | 3 |
| **Chat Integração** | Reutilizar chat, notificações | 1 | 1 | — | 2 |
| **Moderação** | Sistema denúncias, painel admin | 2 | 1 | — | 3 |
| **Notificações** | Push, email, in-app | 1 | 1 | — | 2 |
| **Testes & Polish** | E2E, bug fixes, design review | 1 | 2 | 1 | 4 |

**Total: 6–7 semanas (1 dev full-stack + 1 QA)**

### 8.2 Roadmap de Entrega

```
Semana 1:    Design + Schema BD
Semana 2–3:  Form Criação + Validações
Semana 4:    Dashboard + Busca Integrada
Semana 5:    CRM de Contatos + Chat Integration
Semana 6:    Moderação + Notificações
Semana 7:    Testes + Deploy
```

---

## 9. Firestore Security Rules

```javascript
// firestore.rules (add)
match /intencoes_compra/{intencaoId} {
  // Leitura: apenas ativas/pausadas públicas
  allow read: if resource.data.status in ['ativa', 'pausada'];
  
  // Leitura própria: sempre
  allow read: if request.auth.uid == resource.data.userId;
  
  // Criação: user autenticado
  allow create: if request.auth != null &&
                   request.resource.data.userId == request.auth.uid;
  
  // Update: apenas proprietário
  allow update: if request.auth.uid == resource.data.userId;
  
  // Delete: apenas proprietário (soft delete)
  allow delete: if request.auth.uid == resource.data.userId;
}

match /contatos_intencao/{contatoId} {
  // Leitura: comprador ou vendedor
  allow read: if request.auth.uid == getIntencao(resource.data.intencaoId).userId ||
                 request.auth.uid == resource.data.vendedorId ||
                 isAdmin(request.auth.uid);
  
  // Criação: vendedor autenticado
  allow create: if request.auth != null &&
                   request.resource.data.vendedorId == request.auth.uid;
  
  // Update: comprador ou vendedor
  allow update: if request.auth.uid == getIntencao(resource.data.intencaoId).userId ||
                   request.auth.uid == resource.data.vendedorId;
}

match /denuncias_intencao/{denunciaId} {
  // Leitura: denunciante ou admin
  allow read: if request.auth.uid == resource.data.denunciantId ||
                 isAdmin(request.auth.uid);
  
  // Criação: user autenticado
  allow create: if request.auth != null &&
                   request.resource.data.denunciantId == request.auth.uid;
}

function getIntencao(intencaoId) {
  return get(/databases/$(database)/documents/intencoes_compra/$(intencaoId)).data;
}

function isAdmin(uid) {
  return get(/databases/$(database)/documents/users/$(uid)).data.role == 'admin';
}
```

---

## 10. KPIs & Sucesso

### 10.1 Métricas de Adoção

| KPI | Target | Como Medir |
|-----|--------|-----------|
| Intenções criadas (1º mês) | 100+ | `COUNT(intencoes_compra)` |
| Usuários com intenção ativa | 5% de MAU | `COUNT(DISTINCT usuarios_intencao WHERE status='ativa')` |
| Taxa de renovação | 40% | Intenções que não expiraram |
| Conversão intenção → venda | 10% | Contatos que resultam em venda |

### 10.2 Métricas de Engajamento

| KPI | Target | Como Medir |
|-----|--------|-----------|
| Contactos por intenção | 5+ | Média de `intencao.stats.contatos` |
| Taxa de resposta do comprador | 60% | Contatos respondidos / total |
| Tempo resposta médio | < 2h | Diferença de timestamps no chat |

### 10.3 Métricas de Qualidade

| KPI | Target | Como Medir |
|-----|--------|-----------|
| Taxa de moderação | 90%+ | Denúncias resolvidas em 24h |
| Taxa de fake | < 2% | Denúncias confirmadas / total |
| Satisfação do vendedor | 4.0⭐ | Survey (de quem usou feature) |

---

## 11. Riscos Técnicos & Mitigações

### 11.1 Spam & Intenções Falsas

**Risco**: Bots criam centenas de intenções fake para spam.

**Mitigação**:
- ✅ Limite de 1 intenção por usuário/semana (rate limit)
- ✅ Score de confiabilidade para novos usuários
- ✅ Validações automáticas (detectar padrões suspeitos)
- ✅ Análise manual: revisar intenções novas

### 11.2 Fraude: Comprador Fake Coleta Informações

**Risco**: Adversário abre intenção para cooletar contatos de vendedores, depois faz golpe.

**Mitigação**:
- ✅ Email verificado (obrigatório)
- ✅ Score de reputação (usuario novo = limite de 1 intenção)
- ✅ Notificação ao vendedor: "Primeira intenção deste usuário"
- ✅ Denúncia rápida: vendedor pode reportar fraude ao contatar

### 11.3 Performance: Muitas Intenções, Busca Lenta

**Risco**: 10k+ intenções causam queries lentas.

**Mitigação**:
- ✅ Índices compostos (já no schema)
- ✅ Pagination: máx 50 intenções por página
- ✅ Cache Redis para resultados de busca (5min)
- ✅ Eventual: migrar para Meilisearch

### 11.4 Chat Sobrecarga

**Risco**: Vendedor com 50+ contatos de intenções causa congestionamento Firestore.

**Mitigação**:
- ✅ Reutilizar chat existente (já otimizado)
- ✅ Pagination de contatos (máx 20 por página)
- ✅ Cleanup: deletar chats antigos (> 6 meses sem atividade)

### 11.5 Notificação Spam

**Risco**: Vendedor recebe 100 notificações/dia para mesma intenção.

**Mitigação**:
- ✅ Agrupar notificações: "5 novos contatos em suas intenções"
- ✅ Throttle: máx 1 notificação por intenção por hora
- ✅ Preferências de usuário: opt-in/out por tipo

---

## 12. Exemplo de Documento Firestore

```json
{
  "id": "intencao-001",
  "userId": "user-456",
  "titulo": "Procuro: Fiat Punto até 15.000€",
  "descricao": "Carro para uso diário, preferência por automático. Compro rápido se estiver em bom estado.",
  "criterios": {
    "marca": "Fiat",
    "modelo": "Punto",
    "anoMinimo": 2015,
    "anoMaximo": 2024,
    "precoMinimo": 10000,
    "precoMaximo": 15000,
    "combustivel": ["gasolina", "diesel"],
    "tipoTransmissao": ["automatico"],
    "quilometragemMaxima": 150000,
    "localizacao": {
      "distrito": "Porto",
      "raio": 50,
      "latitude": 41.1579,
      "longitude": -8.6291
    }
  },
  "preferencias": {
    "cores": ["branco", "preto", "prata"],
    "tipoCarroceria": ["hatchback"],
    "itensDesejados": ["GPS", "Ar condicionado", "Vidros elétricos"],
    "aceitaFinanciamento": true,
    "aceitaTroca": false,
    "aceitaVeiculo23Registros": true
  },
  "contatoPreferido": "ambos",
  "mostrarTelefone": true,
  "status": "ativa",
  "prioritária": false,
  "destaque": {
    "ativo": false,
    "tipo": null,
    "dataInicio": null,
    "dataFim": null
  },
  "stats": {
    "visualizacoes": 47,
    "visualizacoes7Dias": 23,
    "contatos": 5,
    "contatos7Dias": 3
  },
  "criadaEm": "2026-05-20T10:30:00Z",
  "atualizadaEm": "2026-05-29T08:15:00Z"
}
```

---

## 13. Próximos Passos

1. **Design**: Validar wireframes da feature com PO e design team
2. **Prototipagem**: Figma do fluxo completo (criação → busca → contato)
3. **BD**: Criar branch dev, aplicar schema + indexes
4. **MVP**: Iniciar implementação do form + busca integrada
5. **Beta**: Testar com 50 usuários internos (dia 6)
6. **Docs**: Manter runbooks para moderação

---

## 14. Stack Técnico

| Camada | Tecnologia | Justificativa |
|--------|-----------|---------------|
| Frontend | Next.js 15 App Router | SSR/ISR, já usa |
| Styling | Tailwind CSS v4 | Performance, já usa |
| Form | react-hook-form + zod | Validação client-side |
| BD | Firestore | Real-time, já usa |
| Storage | Firebase Storage | Documentos (fotos upload) |
| Functions | Cloud Functions | Automação, moderação |
| Chat | Firestore Realtime | Reutilizar existente |
| Notificações | Cloud Messaging | Push + email |
| Cache | Redis (opcional) | Performance busca |

---

**Fim do Plano**

*Versão 1.0 — Pronto para apresentação ao time de produto.*
