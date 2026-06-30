import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { KeyboardAvoider } from '@/components/ui/KeyboardAvoider';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ChipSelect } from '@/components/ui/ChipSelect';
import { SelectField } from '@/components/ui/SelectField';
import { PhotoPicker } from '@/components/anunciar/PhotoPicker';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useMarcasModelos } from '@/hooks/useMarcasModelos';
import { addPeca, getPecaById, updatePeca, uploadFotoIfLocal } from '@/lib/db';
import { colors } from '@/theme/colors';
import { TIPO_PECA_LABELS, type TipoPeca } from '@/types';

const TIPOS = (Object.keys(TIPO_PECA_LABELS) as TipoPeca[]).map((t) => ({
  value: t,
  label: TIPO_PECA_LABELS[t],
}));

const ESTADOS = ['Novo', 'Usado', 'Recondicionado'].map((e) => ({ value: e, label: e }));

export default function AnunciarPecaScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editId = typeof id === 'string' && id ? id : null;
  const { user } = useAuth();
  const { showToast } = useToast();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const { marcas, getModelos, loading: marcasLoading } = useMarcasModelos();

  const [foto, setFoto] = useState<string[]>([]);
  const [tipo, setTipo] = useState<TipoPeca>('venda');
  const [titulo, setTitulo] = useState('');
  const [categoria, setCategoria] = useState('');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [preco, setPreco] = useState('');
  const [estado, setEstado] = useState<string>('Usado');
  const [local, setLocal] = useState('');
  const [descricao, setDescricao] = useState('');
  const [telefone, setTelefone] = useState(user?.telefone ?? '');
  const [whatsapp, setWhatsapp] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [carregando, setCarregando] = useState(!!editId);
  const modelos = useMemo(() => getModelos(marca), [getModelos, marca]);

  const precisaPreco = tipo !== 'procura';

  useEffect(() => {
    if (!editId) return;
    let cancelled = false;
    getPecaById(editId)
      .then((p) => {
        if (cancelled || !p) return;
        setFoto(p.foto ? [p.foto] : []);
        setTipo(p.tipo ?? 'venda');
        setTitulo(p.titulo ?? '');
        setCategoria(p.categoria ?? '');
        setMarca(p.marcaCarro ?? '');
        setModelo(p.modeloCarro ?? '');
        setPreco(p.preco != null ? String(p.preco) : '');
        setEstado(p.estado ?? 'Usado');
        setLocal(p.local ?? '');
        setDescricao(p.descricao ?? '');
        setTelefone(p.vendedorTelefone ?? user?.telefone ?? '');
        setWhatsapp(p.vendedorWhatsApp ?? '');
      })
      .finally(() => {
        if (!cancelled) setCarregando(false);
      });
    return () => {
      cancelled = true;
    };
  }, [editId, user?.telefone]);

  function validar(): string | null {
    if (!titulo.trim()) return 'Indique um título.';
    if (!categoria.trim()) return 'Indique a categoria (ex.: Motor, Travões).';
    if (!marca.trim()) return 'Indique a marca do carro.';
    if (precisaPreco && (!preco.trim() || Number.isNaN(Number(preco))))
      return 'Indique um preço válido.';
    if (!local.trim()) return 'Indique a localidade.';
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
      const fotoUrl = foto[0] ? await uploadFotoIfLocal(user.uid, foto[0], 0) : undefined;

      const dados = {
        tipo,
        titulo: titulo.trim(),
        categoria: categoria.trim(),
        marcaCarro: marca.trim(),
        modeloCarro: modelo.trim() || undefined,
        preco: precisaPreco ? Number(preco) : null,
        estado,
        local: local.trim(),
        descricao: descricao.trim(),
        foto: fotoUrl,
        vendedorNome: user.nome,
        vendedorTelefone: telefone.trim() || undefined,
        vendedorWhatsApp: whatsapp.trim() || undefined,
      };

      if (editId) {
        await updatePeca(editId, { ...dados, status: 'pendente' });
      } else {
        await addPeca({
          ...dados,
          criador: user.email,
          criadorUid: user.uid,
          vendedorEmail: user.email,
        });
      }

      Alert.alert(
        editId ? 'Peça atualizada' : 'Anúncio enviado',
        'A sua peça foi submetida e ficará visível após aprovação.',
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
      <Stack.Screen options={{ title: editId ? 'Editar peça' : 'Anunciar peça' }} />
      <ScrollView
        contentContainerClassName="p-4 gap-4"
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <ChipSelect label="Tipo de anúncio" options={TIPOS} value={tipo} onChange={setTipo} />
        <PhotoPicker fotos={foto} onChange={setFoto} max={1} />

        <Input label="Título *" value={titulo} onChangeText={setTitulo} placeholder="Farol dianteiro esquerdo" />
        <Input label="Categoria *" value={categoria} onChangeText={setCategoria} placeholder="Iluminação" />

        <SelectField
          label="Marca do carro *"
          value={marca}
          onChange={(v) => {
            setMarca(v);
            setModelo('');
          }}
          options={marcas}
          loading={marcasLoading}
          allowCustom
          placeholder="Selecionar marca"
          title="Marca do carro"
        />
        <SelectField
          label="Modelo"
          value={modelo}
          onChange={setModelo}
          options={modelos}
          allowCustom
          disabled={!marca}
          placeholder={marca ? 'Selecionar modelo' : 'Escolha a marca primeiro'}
          title="Modelo"
        />

        {precisaPreco && (
          <Input
            label="Preço (€) *"
            value={preco}
            onChangeText={setPreco}
            placeholder="60"
            keyboardType="number-pad"
          />
        )}

        <ChipSelect label="Estado" options={ESTADOS} value={estado} onChange={setEstado} />
        <Input label="Localidade *" value={local} onChangeText={setLocal} placeholder="Porto" />
        <Input
          label="Descrição"
          value={descricao}
          onChangeText={setDescricao}
          placeholder="Compatibilidade, estado, observações…"
          multiline
          numberOfLines={4}
          className="h-28"
          style={{ textAlignVertical: 'top' }}
        />

        <Text className="mt-2 text-base font-bold text-fg-heading">Contacto</Text>
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Input label="Telefone" value={telefone} onChangeText={setTelefone} placeholder="912345678" keyboardType="phone-pad" />
          </View>
          <View className="flex-1">
            <Input label="WhatsApp" value={whatsapp} onChangeText={setWhatsapp} placeholder="912345678" keyboardType="phone-pad" />
          </View>
        </View>

        <Button
          label={enviando ? 'A guardar…' : editId ? 'Guardar alterações' : 'Publicar peça'}
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
