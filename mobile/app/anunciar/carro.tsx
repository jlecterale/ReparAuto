import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { KeyboardAvoider } from '@/components/ui/KeyboardAvoider';
import { DraftSavedNote } from '@/components/ui/DraftSavedNote';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ChipSelect } from '@/components/ui/ChipSelect';
import { MultiChipSelect } from '@/components/ui/MultiChipSelect';
import { SelectField } from '@/components/ui/SelectField';
import { LocationSelect } from '@/components/ui/LocationSelect';
import { PhotoPicker } from '@/components/anunciar/PhotoPicker';
import { useAuth } from '@/context/AuthContext';
import { useCountry } from '@/context/CountryContext';
import { term } from '@/lib/terms';
import { useToast } from '@/context/ToastContext';
import { useMarcasModelos } from '@/hooks/useMarcasModelos';
import { getCoordenadas, getDistritoForConcelho } from '@/lib/geo';
import { getCurrencySymbol } from '@/lib/country';
import { addCarro, getCarroById, updateCarro, uploadFotoIfLocal } from '@/lib/db';
import { trackPositiveAction } from '@/lib/appReview';
import { clearAdDraft, type CarDraftData } from '@/lib/draft';
import { useAdDraft } from '@/hooks/useAdDraft';
import { isValidYoutubeUrl } from '@/lib/youtube';
import { buildPhotoAngles, toAngleByPhoto, type SpinAngle } from '@/lib/spin360';
import {
  CAMBIOS,
  CAR_AIRBAGS_MAX,
  CAR_CO2_MAX,
  CAR_CONSUMPTION_MAX,
  CAR_DISPLACEMENT_MAX,
  CAR_DOORS_MAX,
  CAR_DOORS_MIN,
  CAR_GEARS_MAX,
  CAR_KM_MAX,
  CAR_POWER_MAX,
  CAR_PREVIOUS_OWNERS_MAX,
  CAR_PRICE_MAX,
  CAR_RANGE_MAX,
  CAR_SEATS_MIN,
  CAR_VERSION_MAX,
  CAR_WARRANTY_MONTHS_MAX,
  CAR_YEAR_MIN,
  carYearMax,
  maxSeatsForBodyType,
  parseDecimalPt,
  COMBUSTIVEIS,
  CONDICOES_VEICULO,
  EQUIPAMENTOS_CARRO,
  ESTADOS_VEICULO,
  MAX_FOTOS_CARRO,
  MESES,
  ORIGENS_VEICULO,
  TIPOS_CARROCERIA,
  TIPOS_ESTOFO,
  TIPOS_TRACAO,
} from '@/lib/constants';
import { colors } from '@/theme/colors';
import type { BodyType, Cambio, Combustivel, Condition, EstadoVeiculo, Traction, Upholstery, VehicleOrigin } from '@/types';

type CommercialKey = 'acceptsFinancing' | 'vatDeductible' | 'acceptsExchange';
const COMERCIAL_OPTIONS: { value: CommercialKey; label: string }[] = [
  { value: 'acceptsFinancing', label: 'Aceita financiamento' },
  { value: 'vatDeductible', label: 'IVA dedutível' },
  { value: 'acceptsExchange', label: 'Aceita retoma' },
];

export default function AnunciarCarroScreen() {
  const { id, retomar } = useLocalSearchParams<{ id?: string; retomar?: string }>();
  const editId = typeof id === 'string' && id ? id : null;
  const { user } = useAuth();
  const { country } = useCountry();
  const { showToast } = useToast();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const { marcas, getModelos, loading: marcasLoading } = useMarcasModelos('carro');
  // Listings are priced in the active market's currency.
  const currencySymbol = getCurrencySymbol(country);

  const [fotos, setFotos] = useState<string[]>([]);
  const [angleByPhoto, setAngleByPhoto] = useState<Record<string, SpinAngle>>({});
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [ano, setAno] = useState('');
  const [km, setKm] = useState('');
  const [preco, setPreco] = useState('');
  const [cor, setCor] = useState('');
  const [portas, setPortas] = useState('5');
  const [combustivel, setCombustivel] = useState<Combustivel | null>(null);
  const [cambio, setCambio] = useState<Cambio | null>(null);
  const [bodyType, setBodyType] = useState<BodyType | null>(null);
  const [seats, setSeats] = useState('');
  const [condition, setCondition] = useState<Condition>('Usado');
  const [power, setPower] = useState('');
  const [displacement, setDisplacement] = useState('');
  const [traction, setTraction] = useState<Traction | null>(null);
  const [features, setFeatures] = useState<string[]>([]);
  const [version, setVersion] = useState('');
  // Month of first registration stored as its label (e.g. "Março"); converted to
  // its 1–12 number only at the DB boundary.
  const [firstRegMonth, setFirstRegMonth] = useState('');
  const [origin, setOrigin] = useState<VehicleOrigin | null>(null);
  const [previousOwners, setPreviousOwners] = useState('');
  const [gears, setGears] = useState('');
  const [co2Emissions, setCo2Emissions] = useState('');
  const [maxFuelRange, setMaxFuelRange] = useState('');
  const [consumptionUrban, setConsumptionUrban] = useState('');
  const [consumptionExtraUrban, setConsumptionExtraUrban] = useState('');
  const [consumptionCombined, setConsumptionCombined] = useState('');
  const [upholstery, setUpholstery] = useState<Upholstery | null>(null);
  const [numberOfAirbags, setNumberOfAirbags] = useState('');
  const [warrantyMonths, setWarrantyMonths] = useState('');
  const [comercial, setComercial] = useState({
    acceptsFinancing: false,
    vatDeductible: false,
    acceptsExchange: false,
  });
  const [estado, setEstado] = useState<EstadoVeiculo>('pronto');
  const [distrito, setDistrito] = useState('');
  const [local, setLocal] = useState('');
  const [descricao, setDescricao] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [telefone, setTelefone] = useState(user?.telefone ?? '');
  // The profile has no separate WhatsApp; the phone is the best default for it.
  const [whatsapp, setWhatsapp] = useState(user?.telefone ?? '');
  const [enviando, setEnviando] = useState(false);
  const [carregando, setCarregando] = useState(!!editId);
  // Set once the listing is submitted, so the leave guard steps aside.
  const [submitted, setSubmitted] = useState(false);
  const modelos = useMemo(() => getModelos(marca), [getModelos, marca]);

  const draftData = useMemo<CarDraftData>(
    () => ({
      fotos, marca, modelo, ano, km, preco, cor, portas, combustivel, cambio, bodyType,
      seats, condition, power, displacement, traction, features, version, firstRegistrationMonth: firstRegMonth,
      origin, previousOwners, gears, co2Emissions, maxFuelRange, consumptionUrban,
      consumptionExtraUrban, consumptionCombined, upholstery, numberOfAirbags, warrantyMonths,
      ...comercial, estado, distrito, local, descricao, videoUrl, telefone, whatsapp,
    }),
    [fotos, marca, modelo, ano, km, preco, cor, portas, combustivel, cambio, bodyType,
     seats, condition, power, displacement, traction, features, version, firstRegMonth,
     origin, previousOwners, gears, co2Emissions, maxFuelRange, consumptionUrban,
     consumptionExtraUrban, consumptionCombined, upholstery, numberOfAirbags, warrantyMonths,
     comercial, estado, distrito, local, descricao, videoUrl, telefone, whatsapp],
  );
  // Prefilled contacts don't count as progress worth drafting/guarding.
  const hasDraftContent = !!(marca || modelo || km || preco || descricao || fotos.length);

  function restoreDraft(d: CarDraftData) {
    setFotos(d.fotos ?? []);
    setMarca(d.marca ?? '');
    setModelo(d.modelo ?? '');
    setAno(d.ano ?? '');
    setKm(d.km ?? '');
    setPreco(d.preco ?? '');
    setCor(d.cor ?? '');
    setPortas(d.portas ?? '5');
    setCombustivel(d.combustivel ?? null);
    setCambio(d.cambio ?? null);
    setBodyType(d.bodyType ?? null);
    setSeats(d.seats ?? '');
    setCondition(d.condition ?? 'Usado');
    setPower(d.power ?? '');
    setDisplacement(d.displacement ?? '');
    setTraction(d.traction ?? null);
    setFeatures(d.features ?? []);
    setVersion(d.version ?? '');
    setFirstRegMonth(d.firstRegistrationMonth ?? '');
    setOrigin(d.origin ?? null);
    setPreviousOwners(d.previousOwners ?? '');
    setGears(d.gears ?? '');
    setCo2Emissions(d.co2Emissions ?? '');
    setMaxFuelRange(d.maxFuelRange ?? '');
    setConsumptionUrban(d.consumptionUrban ?? '');
    setConsumptionExtraUrban(d.consumptionExtraUrban ?? '');
    setConsumptionCombined(d.consumptionCombined ?? '');
    setUpholstery(d.upholstery ?? null);
    setNumberOfAirbags(d.numberOfAirbags ?? '');
    setWarrantyMonths(d.warrantyMonths ?? '');
    setComercial({
      acceptsFinancing: d.acceptsFinancing ?? false,
      vatDeductible: d.vatDeductible ?? false,
      acceptsExchange: d.acceptsExchange ?? false,
    });
    setEstado(d.estado ?? 'pronto');
    setLocal(d.local ?? '');
    // Drafts saved before the picker only carry the city; recover its region.
    setDistrito(d.distrito ?? (d.local ? getDistritoForConcelho(d.local, country) ?? '' : ''));
    setDescricao(d.descricao ?? '');
    setVideoUrl(d.videoUrl ?? '');
    setTelefone(d.telefone ?? user?.telefone ?? '');
    setWhatsapp(d.whatsapp ?? user?.telefone ?? '');
  }

  useAdDraft<CarDraftData>({
    kind: 'carro',
    enabled: !editId,
    data: draftData,
    hasContent: hasDraftContent,
    submitting: enviando,
    submitted,
    resumeImmediately: retomar === '1',
    itemLabel: 'um anúncio de carro',
    onRestore: restoreDraft,
  });

  // Edit mode: load the existing listing and prefill the form.
  useEffect(() => {
    if (!editId) return;
    let cancelled = false;
    getCarroById(editId)
      .then((c) => {
        if (cancelled || !c) return;
        setFotos(c.fotos ?? []);
        setAngleByPhoto(toAngleByPhoto(c.fotos ?? [], c.photoAngles));
        setMarca(c.marca ?? '');
        setModelo(c.modelo ?? '');
        setAno(c.anoFabricacao ? String(c.anoFabricacao) : '');
        setKm(c.km != null ? String(c.km) : '');
        setPreco(c.preco != null ? String(c.preco) : '');
        setCor(c.cor && c.cor !== 'Não especificada' ? c.cor : '');
        setPortas(c.portas ? String(c.portas) : '5');
        setCombustivel(c.combustivel ?? null);
        setCambio(c.cambio ?? null);
        setBodyType(c.bodyType ?? null);
        setSeats(c.seats != null ? String(c.seats) : '');
        setCondition(c.condition ?? 'Usado');
        setPower(c.power != null ? String(c.power) : '');
        setDisplacement(c.displacement != null ? String(c.displacement) : '');
        setTraction(c.traction ?? null);
        setFeatures(c.features ?? []);
        setVersion(c.version ?? '');
        setFirstRegMonth(c.firstRegistrationMonth ? MESES[c.firstRegistrationMonth - 1] ?? '' : '');
        setOrigin(c.origin ?? null);
        setPreviousOwners(c.previousOwners != null ? String(c.previousOwners) : '');
        setGears(c.gears != null ? String(c.gears) : '');
        setCo2Emissions(c.co2Emissions != null ? String(c.co2Emissions) : '');
        setMaxFuelRange(c.maxFuelRange != null ? String(c.maxFuelRange) : '');
        setConsumptionUrban(c.consumptionUrban != null ? String(c.consumptionUrban).replace('.', ',') : '');
        setConsumptionExtraUrban(c.consumptionExtraUrban != null ? String(c.consumptionExtraUrban).replace('.', ',') : '');
        setConsumptionCombined(c.consumptionCombined != null ? String(c.consumptionCombined).replace('.', ',') : '');
        setUpholstery(c.upholstery ?? null);
        setNumberOfAirbags(c.numberOfAirbags != null ? String(c.numberOfAirbags) : '');
        setWarrantyMonths(c.warrantyMonths != null ? String(c.warrantyMonths) : '');
        setComercial({
          acceptsFinancing: c.acceptsFinancing ?? false,
          vatDeductible: c.vatDeductible ?? false,
          acceptsExchange: c.acceptsExchange ?? false,
        });
        setEstado(c.estadoVeiculo ?? 'pronto');
        setLocal(c.local ?? '');
        // Old listings only carry the city; recover its region for the pickers.
        setDistrito(c.distrito ?? (c.local ? getDistritoForConcelho(c.local, country) ?? '' : ''));
        setDescricao(c.descricao ?? '');
        setVideoUrl(c.videoUrl ?? '');
        setTelefone(c.vendedorTelefone ?? user?.telefone ?? '');
        setWhatsapp(c.vendedorWhatsApp ?? '');
      })
      .finally(() => {
        if (!cancelled) setCarregando(false);
      });
    return () => {
      cancelled = true;
    };
  }, [editId, user?.telefone, country]);

  function validar(): string | null {
    if (fotos.length === 0) return 'Adicione pelo menos uma foto.';
    if (!marca.trim() || !modelo.trim()) return 'Indique a marca e o modelo.';
    if (version.trim().length > CAR_VERSION_MAX)
      return `A versão deve ter no máximo ${CAR_VERSION_MAX} caracteres.`;
    const anoMax = carYearMax();
    const anoNum = Number(ano);
    if (!Number.isInteger(anoNum) || anoNum < CAR_YEAR_MIN || anoNum > anoMax)
      return `Indique um ano entre ${CAR_YEAR_MIN} e ${anoMax}.`;
    const kmNum = Number(km);
    if (!km.trim() || !Number.isFinite(kmNum) || kmNum < 0 || kmNum > CAR_KM_MAX)
      return `Indique os quilómetros (0 a ${CAR_KM_MAX.toLocaleString('pt-PT')}).`;
    const precoNum = Number(preco);
    if (!preco.trim() || !Number.isFinite(precoNum) || precoNum <= 0 || precoNum > CAR_PRICE_MAX)
      return `Indique um preço entre 1 ${currencySymbol} e ${CAR_PRICE_MAX.toLocaleString('pt-PT')} ${currencySymbol}.`;
    if (portas.trim()) {
      const portasNum = Number(portas);
      if (!Number.isInteger(portasNum) || portasNum < CAR_DOORS_MIN || portasNum > CAR_DOORS_MAX)
        return `O número de portas deve estar entre ${CAR_DOORS_MIN} e ${CAR_DOORS_MAX}.`;
    }
    if (seats.trim()) {
      const seatsNum = Number(seats);
      const seatsMax = maxSeatsForBodyType(bodyType ?? undefined);
      if (!Number.isInteger(seatsNum) || seatsNum < CAR_SEATS_MIN || seatsNum > seatsMax)
        return `O número de lugares deve estar entre ${CAR_SEATS_MIN} e ${seatsMax}.`;
    }
    if (power.trim()) {
      const powerNum = Number(power);
      if (!Number.isInteger(powerNum) || powerNum < 1 || powerNum > CAR_POWER_MAX)
        return `A potência deve estar entre 1 e ${CAR_POWER_MAX} cv.`;
    }
    if (displacement.trim()) {
      const ccNum = Number(displacement);
      if (!Number.isInteger(ccNum) || ccNum < 1 || ccNum > CAR_DISPLACEMENT_MAX)
        return `A cilindrada deve estar entre 1 e ${CAR_DISPLACEMENT_MAX.toLocaleString('pt-PT')} cc.`;
    }
    // Standvirtual-parity optional specs — only checked once the user fills them.
    const optIntErr = (raw: string, min: number, max: number, label: string): string | null => {
      if (!raw.trim()) return null;
      const n = Number(raw);
      return Number.isInteger(n) && n >= min && n <= max ? null : `${label} deve estar entre ${min} e ${max}.`;
    };
    const specErro =
      optIntErr(gears, 1, CAR_GEARS_MAX, 'O nº de mudanças') ??
      optIntErr(previousOwners, 0, CAR_PREVIOUS_OWNERS_MAX, 'O nº de proprietários') ??
      optIntErr(co2Emissions, 0, CAR_CO2_MAX, 'As emissões de CO₂') ??
      optIntErr(maxFuelRange, 0, CAR_RANGE_MAX, 'A autonomia') ??
      optIntErr(numberOfAirbags, 0, CAR_AIRBAGS_MAX, 'O nº de airbags') ??
      optIntErr(warrantyMonths, 0, CAR_WARRANTY_MONTHS_MAX, 'A garantia');
    if (specErro) return specErro;
    const consErr = (raw: string, label: string): string | null => {
      if (!raw.trim()) return null;
      const n = parseDecimalPt(raw);
      return n != null && n <= CAR_CONSUMPTION_MAX ? null : `${label} deve estar entre 0 e ${CAR_CONSUMPTION_MAX} l/100 km.`;
    };
    const consumoErro =
      consErr(consumptionUrban, 'O consumo urbano') ??
      consErr(consumptionExtraUrban, 'O consumo extra-urbano') ??
      consErr(consumptionCombined, 'O consumo combinado');
    if (consumoErro) return consumoErro;
    if (!combustivel) return 'Selecione o combustível.';
    if (!cambio) return 'Selecione a caixa.';
    if (!distrito.trim() || !local.trim())
      return `Indique ${term('districtAndMunicipality', country).toLowerCase()}.`;
    if (videoUrl.trim() && !isValidYoutubeUrl(videoUrl))
      return 'O link do vídeo do YouTube é inválido.';
    return null;
  }

  async function publicar() {
    if (!user) {
      router.replace('/login');
      return;
    }
    const erro = validar();
    if (erro) {
      showToast(erro, 'error');
      return;
    }

    setEnviando(true);
    try {
      // Keep already-uploaded photos (https URLs); upload only new local files.
      const urls = await Promise.all(fotos.map((uri, i) => uploadFotoIfLocal(user.uid, uri, i)));

      // Angle tags are keyed by the local URI — follow each photo to its
      // uploaded URL (same index) before freezing them into indices.
      const photoAngles = buildPhotoAngles(
        fotos.map((uri, i) => ({ original: uri, final: urls[i] })),
        angleByPhoto,
      );

      // Month label ("Março") → its 1–12 number for storage; 0 when unset/invalid.
      const regMonthNum = firstRegMonth ? MESES.indexOf(firstRegMonth) + 1 : 0;

      const dados = {
        marca: marca.trim(),
        modelo: modelo.trim(),
        anoFabricacao: Number(ano),
        km: Number(km),
        preco: Number(preco),
        portas: Number(portas) || 5,
        cor: cor.trim() || 'Não especificada',
        combustivel,
        cambio,
        bodyType: bodyType ?? undefined,
        seats: seats ? Number(seats) : undefined,
        condition,
        power: power ? Number(power) : undefined,
        displacement: displacement ? Number(displacement) : undefined,
        traction: traction ?? undefined,
        features: features.length ? features : undefined,
        // Standvirtual-parity optional specs (undefined → dropped on create /
        // nulled on update by the db helpers).
        version: version.trim() || undefined,
        firstRegistrationMonth: regMonthNum >= 1 ? regMonthNum : undefined,
        origin: origin ?? undefined,
        previousOwners: previousOwners ? Number(previousOwners) : undefined,
        gears: gears ? Number(gears) : undefined,
        co2Emissions: co2Emissions ? Number(co2Emissions) : undefined,
        maxFuelRange: maxFuelRange ? Number(maxFuelRange) : undefined,
        consumptionUrban: parseDecimalPt(consumptionUrban) ?? undefined,
        consumptionExtraUrban: parseDecimalPt(consumptionExtraUrban) ?? undefined,
        consumptionCombined: parseDecimalPt(consumptionCombined) ?? undefined,
        upholstery: upholstery ?? undefined,
        numberOfAirbags: numberOfAirbags ? Number(numberOfAirbags) : undefined,
        warrantyMonths: warrantyMonths ? Number(warrantyMonths) : undefined,
        acceptsFinancing: comercial.acceptsFinancing || undefined,
        vatDeductible: comercial.vatDeductible || undefined,
        acceptsExchange: comercial.acceptsExchange || undefined,
        estadoVeiculo: estado,
        local: local.trim(),
        distrito: distrito.trim() || undefined,
        // City-derived coordinates power the radius search (mirrors the web).
        coordenadas: getCoordenadas(local.trim(), country),
        descricao: descricao.trim(),
        videoUrl: videoUrl.trim() || undefined,
        fotos: urls,
        // null (not undefined) so an edit that untags all angles clears the field.
        photoAngles,
        vendedorNome: user.nome,
        vendedorTelefone: telefone.trim() || undefined,
        vendedorWhatsApp: whatsapp.trim() || undefined,
      };

      if (editId) {
        // Mirror the web: a user edit resets status to pendente for re-approval.
        await updateCarro(editId, { ...dados, status: 'pendente' });
      } else {
        await addCarro({
          ...dados,
          tiposManutencao: [],
          criador: user.email,
          criadorUid: user.uid,
          vendedorEmail: user.email,
        });
        clearAdDraft('carro');
      }
      setSubmitted(true);

      Alert.alert(
        editId ? 'Anúncio atualizado' : 'Anúncio enviado',
        'O seu anúncio foi submetido e ficará visível após aprovação. Pode acompanhar o estado em Perfil → Os meus anúncios.',
        [
          {
            text: 'OK',
            onPress: () => {
              router.dismissAll();
              if (!editId) trackPositiveAction('publish-listing');
            },
          },
        ],
      );
    } catch {
      showToast('Não foi possível guardar. Tente novamente.', 'error');
    } finally {
      setEnviando(false);
    }
  }

  if (carregando) {
    return (
      <View className="flex-1 items-center justify-center bg-neutral-50">
        <ActivityIndicator size="large" color={colors.primary[600]} />
      </View>
    );
  }

  return (
    <KeyboardAvoider offset={headerHeight} className="flex-1 bg-neutral-50">
      <Stack.Screen options={{ title: editId ? 'Editar carro' : 'Vender carro' }} />
      <ScrollView
        contentContainerClassName="p-4 gap-4"
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <PhotoPicker
          fotos={fotos}
          onChange={setFotos}
          max={MAX_FOTOS_CARRO}
          angleByPhoto={angleByPhoto}
          onAngleByPhotoChange={setAngleByPhoto}
        />

        <SelectField
          label="Marca *"
          value={marca}
          onChange={(v) => {
            setMarca(v);
            setModelo('');
          }}
          options={marcas}
          loading={marcasLoading}
          allowCustom
          placeholder="Selecionar marca"
          title="Marca"
        />
        <SelectField
          label="Modelo *"
          value={modelo}
          onChange={setModelo}
          options={modelos}
          allowCustom
          disabled={!marca}
          placeholder={marca ? 'Selecionar modelo' : 'Escolha a marca primeiro'}
          title="Modelo"
        />

        <Input
          label="Versão"
          value={version}
          onChangeText={setVersion}
          placeholder="CDi Avantgarde"
          maxLength={60}
        />

        <View className="flex-row gap-3">
          <View className="flex-1">
            <Input
              label="Ano *"
              value={ano}
              onChangeText={setAno}
              placeholder="2018"
              keyboardType="number-pad"
              maxLength={4}
            />
          </View>
          <View className="flex-1">
            <Input
              label="Quilómetros *"
              value={km}
              onChangeText={setKm}
              placeholder="120000"
              keyboardType="number-pad"
              maxLength={6}
            />
          </View>
        </View>

        <View className="flex-row gap-3">
          <View className="flex-1">
            <Input
              label={`Preço (${currencySymbol}) *`}
              value={preco}
              onChangeText={setPreco}
              placeholder="15000"
              keyboardType="number-pad"
              maxLength={8}
            />
          </View>
          <View className="flex-1">
            <Input
              label="Portas"
              value={portas}
              onChangeText={setPortas}
              placeholder="5"
              keyboardType="number-pad"
              maxLength={1}
            />
          </View>
        </View>

        <Input label="Cor" value={cor} onChangeText={setCor} placeholder="Preto" />

        <ChipSelect
          label="Combustível *"
          options={COMBUSTIVEIS.map((c) => ({ value: c, label: c }))}
          value={combustivel}
          onChange={setCombustivel}
        />
        <ChipSelect
          label="Caixa *"
          options={CAMBIOS.map((c) => ({ value: c, label: c }))}
          value={cambio}
          onChange={setCambio}
        />
        <ChipSelect
          label="Categoria"
          options={TIPOS_CARROCERIA.map((c) => ({ value: c, label: c }))}
          value={bodyType}
          onChange={setBodyType}
        />
        <ChipSelect
          label="Condição"
          options={CONDICOES_VEICULO.map((c) => ({ value: c, label: c }))}
          value={condition}
          onChange={setCondition}
        />
        <Input
          label="Lugares"
          value={seats}
          onChangeText={setSeats}
          placeholder="5"
          keyboardType="number-pad"
          maxLength={2}
        />
        <ChipSelect label="Estado" options={ESTADOS_VEICULO} value={estado} onChange={setEstado} />

        <Text className="mt-2 text-base font-bold text-fg-heading">Mais detalhes (opcional)</Text>
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Input
              label="Potência (cv)"
              value={power}
              onChangeText={setPower}
              placeholder="90"
              keyboardType="number-pad"
              maxLength={4}
            />
          </View>
          <View className="flex-1">
            <Input
              label="Cilindrada (cc)"
              value={displacement}
              onChangeText={setDisplacement}
              placeholder="1500"
              keyboardType="number-pad"
              maxLength={5}
            />
          </View>
        </View>
        <ChipSelect
          label="Tração"
          options={TIPOS_TRACAO.map((t) => ({ value: t, label: t }))}
          value={traction}
          onChange={setTraction}
        />
        <MultiChipSelect
          label="Equipamento / Extras"
          options={EQUIPAMENTOS_CARRO.map((e) => ({ value: e, label: e }))}
          values={features}
          onToggle={(value) =>
            setFeatures((prev) =>
              prev.includes(value) ? prev.filter((f) => f !== value) : [...prev, value],
            )
          }
        />

        <View className="flex-row gap-3">
          <View className="flex-1">
            <Input
              label="Nº de mudanças"
              value={gears}
              onChangeText={setGears}
              placeholder="6"
              keyboardType="number-pad"
              maxLength={2}
            />
          </View>
          <View className="flex-1">
            <Input
              label="Proprietários anteriores"
              value={previousOwners}
              onChangeText={setPreviousOwners}
              placeholder="1"
              keyboardType="number-pad"
              maxLength={2}
            />
          </View>
        </View>

        <SelectField
          label={term('firstRegistrationLabel', country)}
          value={firstRegMonth}
          onChange={setFirstRegMonth}
          options={MESES}
          emptyOption="Indiferente"
          placeholder="Selecionar mês"
          title={term('firstRegistrationLabel', country)}
        />
        <ChipSelect
          label="Origem"
          options={ORIGENS_VEICULO.map((o) => ({ value: o, label: o }))}
          value={origin}
          onChange={setOrigin}
        />

        <View className="flex-row gap-3">
          <View className="flex-1">
            <Input
              label="Emissões CO₂ (g/km)"
              value={co2Emissions}
              onChangeText={setCo2Emissions}
              placeholder="120"
              keyboardType="number-pad"
              maxLength={3}
            />
          </View>
          <View className="flex-1">
            <Input
              label="Autonomia (km)"
              value={maxFuelRange}
              onChangeText={setMaxFuelRange}
              placeholder="900"
              keyboardType="number-pad"
              maxLength={4}
            />
          </View>
        </View>

        <ChipSelect
          label="Estofos"
          options={TIPOS_ESTOFO.map((u) => ({ value: u, label: u }))}
          value={upholstery}
          onChange={setUpholstery}
        />

        <View className="flex-row gap-3">
          <View className="flex-1">
            <Input
              label="Nº de airbags"
              value={numberOfAirbags}
              onChangeText={setNumberOfAirbags}
              placeholder="8"
              keyboardType="number-pad"
              maxLength={2}
            />
          </View>
          <View className="flex-1">
            <Input
              label="Garantia (meses)"
              value={warrantyMonths}
              onChangeText={setWarrantyMonths}
              placeholder="12"
              keyboardType="number-pad"
              maxLength={3}
            />
          </View>
        </View>

        <View>
          <Text className="mb-1.5 text-sm font-semibold text-fg-muted">Consumo (l/100 km)</Text>
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Input
                label="Urbano"
                value={consumptionUrban}
                onChangeText={setConsumptionUrban}
                placeholder="7,2"
                keyboardType="decimal-pad"
                maxLength={5}
              />
            </View>
            <View className="flex-1">
              <Input
                label="Extra-urbano"
                value={consumptionExtraUrban}
                onChangeText={setConsumptionExtraUrban}
                placeholder="4,8"
                keyboardType="decimal-pad"
                maxLength={5}
              />
            </View>
            <View className="flex-1">
              <Input
                label="Combinado"
                value={consumptionCombined}
                onChangeText={setConsumptionCombined}
                placeholder="5,6"
                keyboardType="decimal-pad"
                maxLength={5}
              />
            </View>
          </View>
        </View>

        <MultiChipSelect
          label="Condições comerciais"
          options={COMERCIAL_OPTIONS}
          values={(Object.keys(comercial) as CommercialKey[]).filter((k) => comercial[k])}
          onToggle={(key) => setComercial((prev) => ({ ...prev, [key]: !prev[key] }))}
        />

        <LocationSelect
          distrito={distrito}
          localidade={local}
          onChange={(d, c) => {
            setDistrito(d);
            setLocal(c);
          }}
          required
        />

        <Input
          label="Descrição"
          value={descricao}
          onChangeText={setDescricao}
          placeholder="Estado, extras, histórico de manutenção…"
          multiline
          numberOfLines={4}
          className="h-28"
          style={{ textAlignVertical: 'top' }}
        />

        <Input
          label="Vídeo do YouTube (opcional)"
          value={videoUrl}
          onChangeText={setVideoUrl}
          placeholder="https://www.youtube.com/watch?v=…"
          autoCapitalize="none"
          keyboardType="url"
        />

        <Text className="mt-2 text-base font-bold text-fg-heading">Contacto</Text>
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Input
              label={term('phoneLabel', country)}
              value={telefone}
              onChangeText={setTelefone}
              placeholder="912345678"
              keyboardType="phone-pad"
            />
          </View>
          <View className="flex-1">
            <Input
              label="WhatsApp"
              value={whatsapp}
              onChangeText={setWhatsapp}
              placeholder="912345678"
              keyboardType="phone-pad"
            />
          </View>
        </View>

        <Button
          label={enviando ? 'A guardar…' : editId ? 'Guardar alterações' : 'Publicar anúncio'}
          onPress={publicar}
          loading={enviando}
          className="mt-2"
        />
        <Text className="text-center text-xs text-fg-subtle">
          O anúncio fica visível após aprovação da equipa.
        </Text>
        {!editId && <DraftSavedNote />}
      </ScrollView>
    </KeyboardAvoider>
  );
}
