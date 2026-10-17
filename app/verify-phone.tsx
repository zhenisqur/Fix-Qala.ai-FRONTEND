import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { api } from '../src/api/client';
import { useSession } from '../src/store/session';
import { colors } from '../src/theme';

const LENGTH = 4;

export default function VerifyPhone() {
  const router = useRouter();
  const { name, phone } = useLocalSearchParams<{ name: string; phone: string }>();
  const login = useSession((s) => s.login);

  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [left, setLeft] = useState(30);
  const [checking, setChecking] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const sentRef = useRef(false);

  const send = async () => {
    try {
      const r = await api.requestCode(phone ?? '');
      setDevCode(r.devCode ?? null);
      setError(null);
    } catch (e) {
      // 429: код уже отправлен недавно, прежний ещё действует
      if (!String((e as Error).message).includes('429')) setError('Не удалось отправить код. Проверьте соединение.');
    }
  };

  useEffect(() => {
    if (sentRef.current) return;
    sentRef.current = true;
    send();
  }, []);

  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);

  const onChange = async (text: string) => {
    const v = text.replace(/\D/g, '').slice(0, LENGTH);
    setCode(v);
    setError(null);
    if (v.length < LENGTH || checking) return;

    setChecking(true);
    try {
      await api.verifyCode(phone ?? '', v);
      Keyboard.dismiss();
      login({ name: name ?? '', phone: phone ?? '' });
      router.replace('/(tabs)');
    } catch (e) {
      const msg = String((e as Error).message);
      setError(msg.includes('400') ? 'Неверный код или срок истёк.' : 'Нет связи с сервером.');
      setCode('');
    } finally {
      setChecking(false);
    }
  };

  const resend = async () => {
    setCode('');
    setLeft(30);
    await send();
  };

  return (
    <LinearGradient colors={colors.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.fill}>
      <View style={s.wrap}>
        <Pressable onPress={() => router.back()}>
          <Text style={s.back}>Изменить номер</Text>
        </Pressable>

        <Text style={s.title}>Введите код</Text>
        <Text style={s.sub}>Мы отправили код подтверждения на номер {phone}</Text>

        <Pressable onPress={() => inputRef.current?.focus()}>
          <View style={s.boxes}>
            {Array.from({ length: LENGTH }).map((_, i) => (
              <View key={i} style={[s.box, code.length === i && s.boxActive, !!error && s.boxError]}>
                <Text style={s.digit}>{code[i] ?? ''}</Text>
              </View>
            ))}
          </View>
        </Pressable>
        <TextInput
          ref={inputRef}
          value={code}
          onChangeText={onChange}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          maxLength={LENGTH}
          autoFocus
          style={s.hidden}
        />

        {error ? <Text style={s.errorText}>{error}</Text> : null}

        <Pressable disabled={left > 0} onPress={resend}>
          <Text style={[s.resend, left > 0 && s.resendOff]}>
            {left > 0 ? `Отправить код ещё раз через ${left} с` : 'Отправить код ещё раз'}
          </Text>
        </Pressable>

        {devCode ? (
          <View style={s.demo}>
            <Text style={s.demoText}>Демо-режим: SMS не отправляется. Ваш код: {devCode}</Text>
          </View>
        ) : null}
      </View>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  fill: { flex: 1 },
  wrap: { flex: 1, padding: 24, paddingTop: 72, gap: 14 },
  back: { color: colors.primary, fontSize: 15, fontWeight: '600' },
  title: { fontSize: 30, fontWeight: '800', color: colors.text, marginTop: 8 },
  sub: { fontSize: 15, color: colors.muted },
  boxes: { flexDirection: 'row', gap: 12, marginTop: 12 },
  box: {
    width: 64,
    height: 72,
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxActive: { borderColor: colors.primary, borderWidth: 2 },
  boxError: { borderColor: colors.critical },
  digit: { fontSize: 30, fontWeight: '800', color: colors.text },
  hidden: { position: 'absolute', width: 1, height: 1, opacity: 0 },
  errorText: { color: colors.critical, fontSize: 14 },
  resend: { color: colors.primary, fontSize: 15, fontWeight: '600', marginTop: 4 },
  resendOff: { color: colors.muted },
  demo: { backgroundColor: colors.primarySoft, borderRadius: 12, padding: 12, marginTop: 8 },
  demoText: { color: colors.primary, fontSize: 13, fontWeight: '600' },
});