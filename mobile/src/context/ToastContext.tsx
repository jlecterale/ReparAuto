import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Animated, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ToastTipo = 'success' | 'error' | 'info';
interface Toast {
  id: number;
  tipo: ToastTipo;
  mensagem: string;
}

interface ToastContextValue {
  showToast: (mensagem: string, tipo?: ToastTipo) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const BG: Record<ToastTipo, string> = {
  success: 'bg-success-600',
  error: 'bg-danger-600',
  info: 'bg-primary-600',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const counter = useRef(0);

  const showToast = useCallback(
    (mensagem: string, tipo: ToastTipo = 'info') => {
      counter.current += 1;
      setToast({ id: counter.current, tipo, mensagem });
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.delay(2600),
        Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]).start(() => setToast(null));
    },
    [opacity],
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast && (
        <Animated.View
          pointerEvents="none"
          style={{ opacity, top: insets.top + 8 }}
          className="absolute left-4 right-4 z-50"
        >
          <View className={`rounded-xl px-4 py-3 shadow-lg ${BG[toast.tipo]}`}>
            <Text className="text-center font-semibold text-white">{toast.mensagem}</Text>
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast deve ser usado dentro de <ToastProvider>.');
  return ctx;
}
