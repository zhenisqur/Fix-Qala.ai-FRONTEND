import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors } from '../src/theme';
import { formatPhone, isValidPhone } from '../src/utils/phone';

export default function Login() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+7');
  const valid = name.trim().length > 1 && isValidPhone(phone);

  const onPhoneChange = (t: string) => {
    const prevDigits = phone.replace(/\D/g, '');
    const nextDigits = t.replace(/\D/g, '');
    // стёрли пробел, скобку: удаляем предыдущую цифру, иначе маска вернёт всё обратно
    if (t.length < phone.length && nextDigits === prevDigits) {
      setPhone(formatPhone(prevDigits.slice(0, -1)));
      return;
    }
    setPhone(formatPhone(t));
  };

  const submit = () => {
    if (!valid) return;
    Keyboard.dismiss();
    router.push({ pathname: '/verify-phone', params: { name: name.trim(), phone } });
  };

  return (
    <LinearGradient colors={colors.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.fill}>
      <KeyboardAvoidingView style={s.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          showsVerticalScrollIndicator={false}
        >
          <Pressable style={s.wrap} onPress={Keyboard.dismiss} accessible={false}>
            <View style={s.brandRow}>
              <Image source={require('../assets/images/fix-qala.png.png')} style={s.logo} />
              <Text style={s.brand}>Fix Qala.ai</Text>
            </View>

            <Text style={s.title}>
              Проблема во дворе?{'\n'}
              <Text style={s.accent}>Покажите её акимату</Text>
            </Text>
            <Text style={s.sub}>Фото и геопозиция. Остальное ии будет группирировать проблемы для акимата сама.</Text>

            <View style={s.card}>
              <Text style={s.cardTitle}>Регистрация</Text>

              <Text style={s.label}>ИМЯ</Text>
              <TextInput
                style={s.input}
                value={name}
                onChangeText={setName}
                placeholder="Как к вам обращаться"
                placeholderTextColor={colors.muted}
                returnKeyType="next"
              />

              <Text style={s.label}>ТЕЛЕФОН</Text>
              <TextInput
                style={s.input}
                value={phone}
                onChangeText={onPhoneChange}
                keyboardType="phone-pad"
                placeholder="+7 (___) ___ __ __"
                placeholderTextColor={colors.muted}
                maxLength={18}
              />

              <Pressable style={[s.btn, !valid && s.btnOff]} onPress={submit} disabled={!valid}>
                <Text style={s.btnText}>Получить код</Text>
              </Pressable>
            </View>

            <Text style={s.note}>ЭЦП не нужна. Обращение уйдёт в службу без вашей подписи.</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  fill: { flex: 1 },
  scroll: { flexGrow: 1 },
  wrap: { flexGrow: 1, padding: 24, justifyContent: 'center', gap: 10 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  logo: { width: 40, height: 40, borderRadius: 10 },
  brand: { fontSize: 22, fontWeight: '800', color: colors.text },
  title: { fontSize: 32, fontWeight: '800', color: colors.text, lineHeight: 38, marginTop: 4 },
  accent: { color: colors.primary },
  sub: { fontSize: 15, color: colors.muted, marginBottom: 12 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 22,
    gap: 6,
    shadowColor: colors.primary,
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  cardTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 6 },
  label: { fontSize: 11, color: colors.muted, letterSpacing: 1, marginTop: 8 },
  input: { backgroundColor: colors.bg, borderRadius: 12, padding: 14, fontSize: 16, color: colors.text },
  btn: { backgroundColor: colors.primary, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 18 },
  btnOff: { opacity: 0.4 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  note: { fontSize: 12, color: colors.muted, textAlign: 'center', marginTop: 6 },
});