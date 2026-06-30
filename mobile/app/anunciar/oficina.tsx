import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { KeyboardAvoider } from '@/components/ui/KeyboardAvoider';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { MultiChipSelect } from '@/components/ui/MultiChipSelect';
import { PhotoPicker } from '@/components/anunciar/PhotoPicker';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { addOficina, getOficinaById, updateOficina, uploadFotoIfLocal } from '@/lib/db';
import { isValidYoutubeUrl } from '@/lib/youtube';
import { colors } from '@/theme/colors';
import { ESPECIALIDADES_LABELS, type EspecialidadeOficina } from '@/types';

const ESPECIALIDADES = (Object.keys(ESPECIALIDADES_LABELS) as EspecialidadeOficina[]).map(
  (e) => ({ value: e, label: ESPECIALIDADES_LABELS[e] }),
);

export default function RegistarOficinaScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editId = typeof id === 'string' && id ? id : null;
  const { user } = useAuth();
  const { showToast } = useToast();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();

  const [logo, setLogo] = useState<string[]>([]);
  const [nome, setNome] = useState('');
  const [responsavel, setResponsavel] = useState(user?.nome ?? '');
  const [telefone, setTelefone] = useState(user?.telefone ?? '');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState(user?.email ?? '');
  const [website, setWebsite] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [distrito, setDistrito] = useState('');
  const [localidade, setLocalidade] = useState('');
  const [morada, setMorada] = useState('');
  const [descricao, setDescricao] = useState('');
  const [especialidades, setEspecialidades] = useState<EspecialidadeOficina[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [carregando, setCarregando] = useState(!!editId);

  useEffect(() => {
    if (!editId) return;
    let cancelled = false;
    getOficinaById(editId)
      .then((o) => {
        if (cancelled || !o) return;
        setLogo(o.logoUrl ? [o.logoUrl] : []);
        setNome(o.nome ?? '');
        setResponsavel(o.responsavel ?? '');
        setTelefone(o.telefone ?? '');
        setWhatsapp(o.whatsapp ?? '');
        setEmail(o.email ?? '');
        setWebsite(o.website ?? '');
        setVideoUrl(o.videoUrl ?? '');
        setDistrito(o.distrito ?? '');
        setLocalidade(o.localidade ?? '');
        setMorada(o.morada ?? '');
        setDescricao(o.descricao ?? '');
        setEspecialidades(o.especialidades ?? []);
      })
      .finally(() => {
        if (!cancelled) setCarregando(false);
      });
    return () => {
      cancelled = true;
    };
  }, [editId]);

  function toggleEspecialidade(e: EspecialidadeOficina) {
    setEspecialidades((atual) =>
      atual.includes(e) ? atual.filter((x) => x !== e) : [...atual, e],
    );
  }

  function validar(): string | null {
    if (!nome.trim()) return 'Indique o nome da oficina.';
    if (!responsavel.trim()) return 'Indique o responsável.';
    if (!telefone.trim()) return 'Indique um telefone.';
    if (!email.trim()) return 'Indique um email.';
    if (!distrito.trim() || !localidade.trim()) return 'Indique distrito e localidade.';
    if (especialidades.length === 0) return 'Selecione pelo menos uma especialidade.';
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
      const logoUrl = logo[0] ? await uploadFotoIfLocal(user.uid, logo[0], 0) : undefined;

      const dados = {
        nome: nome.trim(),
        descricao: descricao.trim(),
        responsavel: responsavel.trim(),
        telefone: telefone.trim(),
        whatsapp: whatsapp.trim() || undefined,
        email: email.trim(),
        website: website.trim() || undefined,
        videoUrl: videoUrl.trim() || undefined,
        distrito: distrito.trim(),
        localidade: localidade.trim(),
        morada: morada.trim(),
        especialidades,
        logoUrl,
      };

      if (editId) {
        await updateOficina(editId, { ...dados, status: 'pendente' });
      } else {
        await addOficina({ ...dados, criador: user.email });
      }

      Alert.alert(
        editId ? 'Oficina atualizada' : 'Oficina enviada',
        'O registo foi submetido e ficará visível após aprovação.',
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
      <Stack.Screen options={{ title: editId ? 'Editar oficina' : 'Registar oficina' }} />
      <ScrollView
        contentContainerClassName="p-4 gap-4"
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <PhotoPicker fotos={logo} onChange={setLogo} max={1} />

        <Input label="Nome da oficina *" value={nome} onChangeText={setNome} placeholder="Auto Reparações Silva" />
        <Input label="Responsável *" value={responsavel} onChangeText={setResponsavel} placeholder="Nome do responsável" />

        <MultiChipSelect
          label="Especialidades *"
          options={ESPECIALIDADES}
          values={especialidades}
          onToggle={toggleEspecialidade}
        />

        <Input
          label="Descrição"
          value={descricao}
          onChangeText={setDescricao}
          placeholder="Serviços, experiência, horário…"
          multiline
          numberOfLines={4}
          className="h-28"
          style={{ textAlignVertical: 'top' }}
        />

        <Text className="mt-2 text-base font-bold text-fg-heading">Localização</Text>
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Input label="Distrito *" value={distrito} onChangeText={setDistrito} placeholder="Lisboa" />
          </View>
          <View className="flex-1">
            <Input label="Localidade *" value={localidade} onChangeText={setLocalidade} placeholder="Amadora" />
          </View>
        </View>
        <Input label="Morada" value={morada} onChangeText={setMorada} placeholder="Rua, nº" />

        <Text className="mt-2 text-base font-bold text-fg-heading">Contacto</Text>
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Input label="Telefone *" value={telefone} onChangeText={setTelefone} placeholder="912345678" keyboardType="phone-pad" />
          </View>
          <View className="flex-1">
            <Input label="WhatsApp" value={whatsapp} onChangeText={setWhatsapp} placeholder="912345678" keyboardType="phone-pad" />
          </View>
        </View>
        <Input label="Email *" value={email} onChangeText={setEmail} placeholder="geral@oficina.pt" autoCapitalize="none" keyboardType="email-address" />
        <Input label="Website" value={website} onChangeText={setWebsite} placeholder="https://…" autoCapitalize="none" keyboardType="url" />
        <Input label="Vídeo do YouTube" value={videoUrl} onChangeText={setVideoUrl} placeholder="https://www.youtube.com/watch?v=…" autoCapitalize="none" keyboardType="url" />

        <Button
          label={enviando ? 'A guardar…' : editId ? 'Guardar alterações' : 'Registar oficina'}
          onPress={publicar}
          loading={enviando}
          className="mt-2"
        />
        <Text className="text-center text-xs text-fg-subtle">
          O registo fica visível após aprovação da equipa.
        </Text>
      </ScrollView>
    </KeyboardAvoider>
  );
}
