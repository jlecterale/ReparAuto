# 24 — Campos de anúncio em paridade com a Standvirtual (Web + Mobile)

## Contexto / o que resolve

Comparando o payload de um anúncio da API da Standvirtual com os campos que o
RecarGarage guarda, faltavam vários atributos que compradores portugueses
esperam ver numa ficha técnica completa. Este plano fecha essa lacuna,
adicionando um conjunto curado de campos opcionais ao formulário de anúncio, à
ficha técnica e ao JSON-LD, tanto na Web como na app mobile.

Continua o plano [22](22-campos-filtros-anuncios-carros.md) (categoria, lugares,
condição, potência, cilindrada, tração, equipamento) — aqui o foco é
**completude da ficha**, não novos filtros de pesquisa.

## Benchmark competitivo

Base: painel "Características" de um anúncio real da **Standvirtual** (mercado PT).
Cruzado com OLX Portugal e AutoScout24, que mostram o mesmo núcleo (versão, mês
de matrícula, origem, proprietários, consumos, emissões, garantia).

## Mapeamento API Standvirtual → RecarGarage

| Campo Standvirtual | Situação | Ação |
| --- | --- | --- |
| `make`, `model`, `fuel_type`, `mileage`, `engine_capacity`, `power`, `price`, `section`, `color`, `gearbox_type`, `number_doors`, `capacity`, `traction` | já existiam | — |
| `version` | em falta | **`version`** (Versão/variante) |
| `first_registration_month` | em falta | **`firstRegistrationMonth`** (1–12) |
| `origin` | em falta | **`origin`** (Nacional/Importado) |
| `number_of_registrations` | em falta | **`previousOwners`** |
| `gearbox_shifts` | em falta | **`gears`** (nº de mudanças) |
| `co2_emissions` | em falta | **`co2Emissions`** (g/km) |
| `urban/extra_urban/combined_consumption` | em falta | **`consumptionUrban/ExtraUrban/Combined`** (l/100 km) |
| `max_fuel_range` | em falta | **`maxFuelRange`** (autonomia, km) |
| `vendors_warranty_valid_until_date` | em falta | **`warrantyMonths`** |
| `upholstery` | em falta | **`upholstery`** (estofos) |
| `number_airbags` | em falta | **`numberOfAirbags`** |
| `accept_funding` | em falta | **`acceptsFinancing`** |
| `tax_deductible` | em falta | **`vatDeductible`** (IVA dedutível) |
| `accept_returns` | em falta | **`acceptsExchange`** (aceita retoma) |

### Excluídos deliberadamente

- `registration` (matrícula) — dado sensível (privacidade/fraude); não deve ser
  público.
- `value_without_isv`, `value_without_iuc`, `iuc`, `fixed_value` — detalhes
  fiscais de nicho PT.
- `engine_code`, `vehicle_class` — redundantes com marca/modelo/carroçaria.
- `glasses`, `hood`, `electrict_hood`, `ceiling_open`, `alloy_wheels`,
  `measure`, `airbag_type`, `air_conditioning` — muito granulares; o checklist de
  equipamento já cobre os mais procurados.

## Âmbito

- **Types**: `Carro` + `CarroFormData` (web e mobile) ganham os 16 campos
  opcionais; novos enums `VehicleOrigin` e `Upholstery`.
- **Constantes**: `ORIGENS_VEICULO`, `TIPOS_ESTOFO`, `MESES` (web + mobile) e os
  limites numéricos (`CAR_GEARS_MAX`, `CAR_CO2_MAX`, …).
- **Validação**: `validarDadosVeiculo` (web) e `validar()` (mobile) validam cada
  campo só quando preenchido; consumos aceitam decimal (`5,6`/`5.6`).
- **Formulários**: passo de dados do assistente, edição do admin (web) e
  `anunciar/carro` (mobile) — versão no bloco principal, o resto na secção
  "mais detalhes", e as condições comerciais como chips.
- **Ficha técnica / detalhe**: `TechnicalSheet` (web) e specs de `detalhes/[id]`
  (mobile) mostram os novos campos + secção "Condições comerciais".
- **SEO**: JSON-LD `Vehicle` ganha `numberOfForwardGears`,
  `numberOfPreviousOwners`, `numberOfAirbags`, `emissionsCO2`,
  `vehicleInteriorType`, `fuelConsumption` e `dateVehicleFirstRegistered`.
- **Rules**: sem alterações — os campos são gravados no doc `cars` existente,
  já coberto pelas regras atuais.

## Casos de borda

- `previousOwners` / `co2Emissions` / `numberOfAirbags` = **0** é válido e
  guardado (parser não-negativo, não "positivo").
- Consumo decimal PT (`5,6`) é normalizado para número (`5.6`) na gravação.
- `firstRegistrationMonth` guarda-se como número 1–12; na Web usa um `select`
  com nomes de mês, no mobile um `SelectField` (nome ↔ número no limite da BD).
- Campos vazios não são gravados (Web: `cleanUndefined`; mobile: `cleanUndefined`
  no create e `nullifyUndefined` no update).

## Verificação

- `npm test` (novos casos em `carSpec.test.ts`, TDD) + `npx tsc --noEmit` +
  `npm run build` (web); `npm run typecheck` (mobile).
- Manual: publicar um carro com os novos campos, confirmar ficha técnica,
  editar como admin, e validar o JSON-LD no Rich Results Test.
