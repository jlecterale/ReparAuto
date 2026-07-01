import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { KeyboardAvoider } from '@/components/ui/KeyboardAvoider';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ChipSelect } from '@/components/ui/ChipSelect';
import { MultiChipSelect } from '@/components/ui/MultiChipSelect';
import { SelectField } from '@/components/ui/SelectField';
import { PhotoPicker } from '@/components/anunciar/PhotoPicker';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useMarcasModelos } from '@/hooks/useMarcasModelos';
import { addCarro, getCarroById, updateCarro, uploadFotoIfLocal } from '@/lib/db';
import { isValidYoutubeUrl } from '@/lib/youtube';
import {
  CAMBIOS,
  COMBUSTIVEIS,
  CONDICOES_VEICULO,
  EQUIPAMENTOS_CARRO,
  ESTADOS_VEICULO,
  MAX_FOTOS_CARRO,
  TIPOS_CARROCERIA,
  TIPOS_TRACAO,
} from '@/lib/constants';
import { colors } from '@/theme/colors';
import type { BodyType, Cambio, Combustivel, Condition, EstadoVeiculo, Traction } from '@/types';

export default function AnunciarCarroScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editId = typeof id === 'string' && id ? id : null;
  const { user } = useAuth();
  const { showToast } = useToast();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const { marcas, getModelos, loading: marcasLoading } = useMarcasModelos('carro');

  const [fotos, setFotos] = useState<string[]>([]);
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
  const [estado, setEstado] = useState<EstadoVeiculo>('pronto');
  const [local, setLocal] = useState('');
  const [descricao, setDescricao] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [telefone, setTelefone] = useState(user?.telefone ?? '');
  const [whatsapp, setWhatsapp] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [carregando, setCarregando] = useState(!!editId);
  const modelos = useMemo(() => getModelos(marca), [getModelos, marca]);

  // Edit mode: load the existing listing and prefill the form.
  useEffect(() => {
    if (!editId) return;
    let cancelled = false;
    getCarroById(editId)
      .then((c) => {
        if (cancelled || !c) return;
        setFotos(c.fotos ?? []);
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
        setEstado(c.estadoVeiculo ?? 'pronto');
        setLocal(c.local ?? '');
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
  }, [editId, user?.telefone]);

  function validar(): string | null {
    if (fotos.length === 0) return 'Adicione pelo menos uma foto.';
    if (!marca.trim() || !modelo.trim()) return 'Indique a marca e o modelo.';
    const anoNum = Number(ano);
    if (!anoNum || anoNum < 1950 || anoNum > new Date().getFullYear() + 1)
      return 'Indique um ano válido.';
    if (!km.trim() || Number.isNaN(Number(km))) return 'Indique os quilómetros.';
    if (!preco.trim() || Number.isNaN(Number(preco))) return 'Indique um preço válido.';
    if (!combustivel) return 'Selecione o combustível.';
    if (!cambio) return 'Selecione a caixa.';
    if (!local.trim()) return 'Indique a localidade.';
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
        estadoVeiculo: estado,
        local: local.trim(),
        descricao: descricao.trim(),
        videoUrl: videoUrl.trim() || undefined,
        fotos: urls,
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
      }

      Alert.alert(
        editId ? 'Anúncio atualizado' : 'Anúncio enviado',
        'O seu anúncio foi submetido e ficará visível após aprovação.',
        [{ text: 'OK', onPress: () => router.dismissAll() }],
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
        <PhotoPicker fotos={fotos} onChange={setFotos} max={MAX_FOTOS_CARRO} />

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
            />
          </View>
        </View>

        <View className="flex-row gap-3">
          <View className="flex-1">
            <Input
              label="Preço (€) *"
              value={preco}
              onChangeText={setPreco}
              placeholder="15000"
              keyboardType="number-pad"
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

        <Input label="Localidade *" value={local} onChangeText={setLocal} placeholder="Lisboa" />

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
              label="Telefone"
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
      </ScrollView>
    </KeyboardAvoider>
  );
}
