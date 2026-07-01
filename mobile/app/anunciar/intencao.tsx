import { useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';
import { router } from 'expo-router';
import { KeyboardAvoider } from '@/components/ui/KeyboardAvoider';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ChipSelect } from '@/components/ui/ChipSelect';
import { MultiChipSelect } from '@/components/ui/MultiChipSelect';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { criarIntencao } from '@/lib/trust';
import { COMBUSTIVEIS } from '@/lib/constants';
import {
  CATEGORIA_INTENCAO_LABELS,
  type CategoriaIntencao,
  type Combustivel,
  type ContatoPreferido,
} from '@/types';

const CATEGORIAS = (Object.keys(CATEGORIA_INTENCAO_LABELS) as CategoriaIntencao[]).map((c) => ({
  value: c,
  label: CATEGORIA_INTENCAO_LABELS[c],
}));

const CONTACTO: { value: ContatoPreferido; label: string }[] = [
  { value: 'chat', label: 'Chat' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'ambos', label: 'Ambos' },
];

export default function CriarIntencaoScreen() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();

  const [categoria, setCategoria] = useState<CategoriaIntencao>('carro');
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [anoMin, setAnoMin] = useState('');
  const [precoMax, setPrecoMax] = useState('');
  const [kmMax, setKmMax] = useState('');
  const [distrito, setDistrito] = useState('');
  const [combustivel, setCombustivel] = useState<Combustivel[]>([]);
  const [contato, setContato] = useState<ContatoPreferido>('chat');
  const [telefone, setTelefone] = useState(user?.telefone ?? '');
  const [enviando, setEnviando] = useState(false);

  function validar(): string | null {
    if (!titulo.trim()) return 'Indique um título (ex.: Procuro Golf diesel).';
    if (!precoMax.trim() || Number.isNaN(Number(precoMax))) return 'Indique o preço máximo.';
    if (!distrito.trim()) return 'Indique o distrito.';
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
      await criarIntencao({
        userId: user.uid,
        categoria,
        titulo: titulo.trim(),
        descricao: descricao.trim() || undefined,
        criterios: {
          marca: marca.trim(),
          modelo: modelo.trim(),
          anoMinimo: Number(anoMin) || 0,
          precoMaximo: Number(precoMax),
          combustivel,
          tipoTransmissao: [],
          quilometragemMaxima: Number(kmMax) || 0,
          localizacao: { distrito: distrito.trim(), raio: 50 },
        },
        contatoPreferido: contato,
        mostrarTelefone: !!telefone.trim() && contato !== 'chat',
        vendedorNome: user.nome,
        vendedorTelefone: telefone.trim() || undefined,
        vendedorWhatsApp: telefone.trim() || undefined,
        vendedorEmail: user.email,
      });
      Alert.alert(
        'Procura enviada',
        'A sua procura foi submetida e ficará visível após aprovação.',
        [{ text: 'OK', onPress: () => router.dismissAll() }],
      );
    } catch {
      showToast('Não foi possível publicar. Tente novamente.', 'error');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <KeyboardAvoider offset={headerHeight} className="flex-1 bg-neutral-50">
      <ScrollView
        contentContainerClassName="p-4 gap-4"
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <ChipSelect label="Categoria" options={CATEGORIAS} value={categoria} onChange={setCategoria} />
        <Input label="Título *" value={titulo} onChangeText={setTitulo} placeholder="Procuro Golf diesel até 2018" />
        <Input
          label="Descrição"
          value={descricao}
          onChangeText={setDescricao}
          placeholder="O que procura, estado, extras…"
          multiline
          numberOfLines={3}
          className="h-24"
          style={{ textAlignVertical: 'top' }}
        />

        <View className="flex-row gap-3">
          <View className="flex-1">
            <Input label="Marca" value={marca} onChangeText={setMarca} placeholder="Volkswagen" />
          </View>
          <View className="flex-1">
            <Input label="Modelo" value={modelo} onChangeText={setModelo} placeholder="Golf" />
          </View>
        </View>

        <View className="flex-row gap-3">
          <View className="flex-1">
            <Input label="Ano mínimo" value={anoMin} onChangeText={setAnoMin} placeholder="2015" keyboardType="number-pad" maxLength={4} />
          </View>
          <View className="flex-1">
            <Input label="Km máximo" value={kmMax} onChangeText={setKmMax} placeholder="150000" keyboardType="number-pad" />
          </View>
        </View>

        <View className="flex-row gap-3">
          <View className="flex-1">
            <Input label="Preço máx. (€) *" value={precoMax} onChangeText={setPrecoMax} placeholder="15000" keyboardType="number-pad" />
          </View>
          <View className="flex-1">
            <Input label="Distrito *" value={distrito} onChangeText={setDistrito} placeholder="Porto" />
          </View>
        </View>

        <MultiChipSelect
          label="Combustível"
          options={COMBUSTIVEIS.map((f) => ({ value: f, label: f }))}
          values={combustivel}
          onToggle={(f) =>
            setCombustivel((atual) =>
              atual.includes(f) ? atual.filter((x) => x !== f) : [...atual, f],
            )
          }
        />

        <ChipSelect label="Como prefere ser contactado" options={CONTACTO} value={contato} onChange={setContato} />
        {contato !== 'chat' && (
          <Input label="Telefone / WhatsApp" value={telefone} onChangeText={setTelefone} placeholder="912345678" keyboardType="phone-pad" />
        )}

        <Button
          label={enviando ? 'A publicar…' : 'Publicar procura'}
          onPress={publicar}
          loading={enviando}
          className="mt-2"
        />
        <Text className="text-center text-xs text-fg-subtle">
          A procura fica visível após aprovação da equipa.
        </Text>
      </ScrollView>
    </KeyboardAvoider>
  );
}
