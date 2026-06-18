import { Pressable, ScrollView, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';

interface Opcao {
  href: Href;
  icon: keyof typeof Ionicons.glyphMap;
  titulo: string;
  texto: string;
}

const OPCOES: Opcao[] = [
  {
    href: '/anunciar/carro',
    icon: 'car-sport',
    titulo: 'Vender um carro',
    texto: 'Publique a sua viatura com fotos, preço e detalhes.',
  },
  {
    href: '/anunciar/peca',
    icon: 'construct',
    titulo: 'Anunciar uma peça',
    texto: 'Venda, desmonte ou procure peças usadas.',
  },
  {
    href: '/anunciar/oficina',
    icon: 'business',
    titulo: 'Registar a sua oficina',
    texto: 'Apareça no diretório de oficinas e receba clientes.',
  },
  {
    href: '/anunciar/intencao',
    icon: 'search',
    titulo: 'Procuro um carro',
    texto: 'Diga o que procura e deixe os vendedores virem ter consigo.',
  },
];

export default function AnunciarHome() {
  return (
    <ScrollView className="flex-1 bg-neutral-50" contentContainerClassName="p-4 gap-3">
      <Text className="mb-1 text-base text-fg-muted">O que quer anunciar?</Text>
      {OPCOES.map((o) => (
        <Pressable
          key={o.titulo}
          onPress={() => router.push(o.href)}
          accessibilityRole="button"
          className="flex-row items-center rounded-2xl bg-white p-4 shadow-sm active:opacity-90"
        >
          <View className="h-12 w-12 items-center justify-center rounded-xl bg-primary-50">
            <Ionicons name={o.icon} size={24} color={colors.primary[600]} />
          </View>
          <View className="ml-3 flex-1">
            <Text className="text-base font-bold text-fg-heading">{o.titulo}</Text>
            <Text className="text-sm text-fg-muted">{o.texto}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.neutral[400]} />
        </Pressable>
      ))}
    </ScrollView>
  );
}
