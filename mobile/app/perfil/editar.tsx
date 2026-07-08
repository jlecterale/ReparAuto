import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { KeyboardAvoider } from '@/components/ui/KeyboardAvoider';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ChipSelect } from '@/components/ui/ChipSelect';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { colors } from '@/theme/colors';
import type { TipoConta } from '@/types';

const TIPOS_CONTA = [
  { value: 'particular' as TipoConta, label: 'Particular' },
  { value: 'profissional' as TipoConta, label: 'Profissional' },
];

export default function EditarPerfilScreen() {
  const { user, updateProfile } = useAuth();
  const { showToast } = useToast();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();

  const [nome, setNome] = useState(user?.nome ?? '');
  const [telefone, setTelefone] = useState(user?.telefone ?? '');
  const [localidade, setLocalidade] = useState(user?.localidade ?? '');
  const [distrito, setDistrito] = useState(user?.distrito ?? '');
  const [codigoPostal, setCodigoPostal] = useState(user?.codigoPostal ?? '');
  const [morada, setMorada] = useState(user?.morada ?? '');
  const [nif, setNif] = useState(user?.nif ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [tipoConta, setTipoConta] = useState<TipoConta>(user?.tipoConta ?? 'particular');
  const [guardando, setGuardando] = useState(false);

  // The account type is chosen once, while completing the profile, and is locked
  // afterwards (also enforced by firestore.rules). Only send it before completion.
  const contaBloqueada = user?.profileCompleted ?? false;

  async function guardar() {
    if (!nome.trim()) {
      showToast('O nome é obrigatório.', 'error');
      return;
    }
    setGuardando(true);
    try {
      await updateProfile({
        nome: nome.trim(),
        telefone: telefone.trim(),
        localidade: localidade.trim(),
        distrito: distrito.trim(),
        codigoPostal: codigoPostal.trim(),
        morada: morada.trim(),
        nif: nif.trim(),
        bio: bio.trim(),
        ...(contaBloqueada ? {} : { tipoConta }),
        profileCompleted: true,
      });
      showToast('Perfil atualizado.', 'success');
      router.back();
    } catch {
      showToast('Não foi possível guardar.', 'error');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <KeyboardAvoider offset={headerHeight} className="flex-1 bg-neutral-50">
      <ScrollView
        contentContainerClassName="p-4 gap-4"
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <Input label="Nome *" value={nome} onChangeText={setNome} placeholder="O seu nome" />
        {contaBloqueada ? (
          <View>
            <Text className="mb-1.5 text-sm font-semibold text-fg-muted">Tipo de conta</Text>
            <View className="flex-row items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-100 px-4 py-3.5">
              <Ionicons
                name={user?.tipoConta === 'profissional' ? 'briefcase-outline' : 'person-outline'}
                size={18}
                color={colors.neutral[500]}
              />
              <Text className="flex-1 text-base font-semibold text-fg-muted">
                {user?.tipoConta === 'profissional' ? 'Profissional' : 'Particular'}
              </Text>
              <Ionicons name="lock-closed" size={16} color={colors.neutral[400]} />
            </View>
            <Text className="mt-1 text-xs text-fg-subtle">
              O tipo de conta é definido no registo e não pode ser alterado.
            </Text>
          </View>
        ) : (
          <ChipSelect label="Tipo de conta" options={TIPOS_CONTA} value={tipoConta} onChange={setTipoConta} />
        )}
        <Input label="Telefone" value={telefone} onChangeText={setTelefone} placeholder="912345678" keyboardType="phone-pad" />

        <View className="flex-row gap-3">
          <View className="flex-1">
            <Input label="Localidade" value={localidade} onChangeText={setLocalidade} placeholder="Lisboa" />
          </View>
          <View className="flex-1">
            <Input label="Distrito" value={distrito} onChangeText={setDistrito} placeholder="Lisboa" />
          </View>
        </View>

        <View className="flex-row gap-3">
          <View className="flex-1">
            <Input label="Código postal" value={codigoPostal} onChangeText={setCodigoPostal} placeholder="1000-001" />
          </View>
          <View className="flex-1">
            <Input label="NIF" value={nif} onChangeText={setNif} placeholder="123456789" keyboardType="number-pad" />
          </View>
        </View>

        <Input label="Morada" value={morada} onChangeText={setMorada} placeholder="Rua, nº" />
        <Input
          label="Sobre si"
          value={bio}
          onChangeText={setBio}
          placeholder="Uma breve descrição…"
          multiline
          numberOfLines={3}
          className="h-24"
          style={{ textAlignVertical: 'top' }}
        />

        <Button
          label={guardando ? 'A guardar…' : 'Guardar alterações'}
          onPress={guardar}
          loading={guardando}
          className="mt-2"
        />
      </ScrollView>
    </KeyboardAvoider>
  );
}
