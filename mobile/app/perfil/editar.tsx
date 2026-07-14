import { useEffect, useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { KeyboardAvoider } from '@/components/ui/KeyboardAvoider';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ChipSelect } from '@/components/ui/ChipSelect';
import { SelectField } from '@/components/ui/SelectField';
import { useAuth } from '@/context/AuthContext';
import { useCountry } from '@/context/CountryContext';
import { useToast } from '@/context/ToastContext';
import { useConcelhos } from '@/hooks/useConcelhos';
import { useCepBr } from '@/hooks/useCepBr';
import { getDistritoForConcelho, getDistritos } from '@/lib/geo';
import { formatarCodigoPostal } from '@/lib/format';
import { term } from '@/lib/terms';
import { colors } from '@/theme/colors';
import type { TipoConta } from '@/types';

const TIPOS_CONTA = [
  { value: 'particular' as TipoConta, label: 'Particular' },
  { value: 'profissional' as TipoConta, label: 'Profissional' },
];

export default function EditarPerfilScreen() {
  const { user, updateProfile } = useAuth();
  const { country } = useCountry();
  const { showToast } = useToast();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();

  const [nome, setNome] = useState(user?.nome ?? '');
  const [telefone, setTelefone] = useState(user?.telefone ?? '');
  const [localidade, setLocalidade] = useState(user?.localidade ?? '');
  const [distrito, setDistrito] = useState(
    user?.distrito || (user?.localidade ? getDistritoForConcelho(user.localidade) ?? '' : ''),
  );
  const [codigoPostal, setCodigoPostal] = useState(user?.codigoPostal ?? '');
  const [morada, setMorada] = useState(user?.morada ?? '');
  const [nif, setNif] = useState(user?.nif ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [tipoConta, setTipoConta] = useState<TipoConta>(user?.tipoConta ?? 'particular');
  const [guardando, setGuardando] = useState(false);

  // The account type is chosen once, while completing the profile, and is locked
  // afterwards (also enforced by firestore.rules). Only send it before completion.
  const accountTypeLocked = user?.profileCompleted ?? false;

  const distritos = getDistritos(country);
  const { concelhos, loading: cidadesLoading } = useConcelhos(distrito);

  // BR fills the state/city/street from the CEP (BrasilAPI). PT has no CEP
  // lookup on mobile, so the pickers are the only path there.
  const cep = useCepBr();
  const lookupTriggered = useRef(false);

  useEffect(() => {
    if (country !== 'BR' || !cep.localidade || lookupTriggered.current) return;
    lookupTriggered.current = true;
    setLocalidade(cep.localidade);
    if (cep.distrito) setDistrito(cep.distrito);
    if (cep.ruas.length > 0) setMorada((prev) => prev || cep.ruas[0]);
  }, [country, cep.localidade, cep.distrito, cep.ruas]);

  const cepPreenchido = country === 'BR' && !!cep.localidade && localidade === cep.localidade;

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
        ...(accountTypeLocked ? {} : { tipoConta }),
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
        {accountTypeLocked ? (
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
        <Input
          label={term('phoneLabel', country)}
          value={telefone}
          onChangeText={(t) => setTelefone(t.replace(/\D/g, ''))}
          placeholder={term('phonePlaceholder', country)}
          keyboardType="phone-pad"
          maxLength={country === 'BR' ? 11 : 9}
        />

        <View className="flex-row gap-3">
          <View className="flex-1">
            <SelectField
              label={term('districtLabel', country)}
              value={distrito}
              onChange={(d) => {
                setDistrito(d);
                setLocalidade('');
                lookupTriggered.current = true;
              }}
              options={distritos}
              placeholder={term('districtSelectOption', country)}
            />
          </View>
          <View className="flex-1">
            <SelectField
              label={term('municipalityLabel', country)}
              value={localidade}
              onChange={(c) => {
                setLocalidade(c);
                lookupTriggered.current = true;
              }}
              options={concelhos}
              loading={cidadesLoading}
              disabled={!distrito}
              allowCustom
            />
          </View>
        </View>
        {cepPreenchido && (
          <Text className="-mt-2 text-xs text-success-600">
            ✓ Preenchido automaticamente pelo {term('postalCodeLabel', country)}
          </Text>
        )}

        <View className="flex-row gap-3">
          <View className="flex-1">
            <Input
              label={term('postalCodeLabel', country)}
              value={codigoPostal}
              onChangeText={(t) => {
                const formatted = formatarCodigoPostal(t, country);
                setCodigoPostal(formatted);
                lookupTriggered.current = false;
                if (country === 'BR' && formatted.replace(/\D/g, '').length === 8) {
                  cep.buscar(formatted);
                }
              }}
              placeholder={term('postalCodePlaceholder', country)}
              keyboardType="number-pad"
              maxLength={country === 'BR' ? 9 : 8}
            />
          </View>
          <View className="flex-1">
            <Input
              label={term('taxIdLabel', country)}
              value={nif}
              onChangeText={(t) => setNif(t.replace(/\D/g, ''))}
              placeholder={term('taxIdPlaceholder', country)}
              keyboardType="number-pad"
              maxLength={country === 'BR' ? 14 : 9}
            />
          </View>
        </View>
        {country === 'BR' && cep.loading && (
          <Text className="-mt-2 text-xs text-fg-subtle">A procurar endereço…</Text>
        )}
        {country === 'BR' && !!cep.erro && (
          <Text className="-mt-2 text-xs text-danger-600">{cep.erro}</Text>
        )}

        <Input
          label={term('addressLabel', country)}
          value={morada}
          onChangeText={setMorada}
          placeholder={term('addressPlaceholder', country)}
        />
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
