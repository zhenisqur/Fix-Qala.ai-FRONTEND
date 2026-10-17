import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { api } from '../../src/api/client';
import { useSession } from '../../src/store/session';
import { colors } from '../../src/theme';
import { CATEGORIES, Category, Issue } from '../../src/types';

function describe(issue: Issue): string {
  if (issue.escalations > 0) {
    return 'Проблему считали решённой, но она осталась. Агент открыл обращение повторно и поднял приоритет.';
  }
  if (issue.confirms > 1) {
    return `Такая проблема рядом уже есть. Ваша жалоба объединена с ней, подтверждений: ${issue.confirms}.`;
  }
  return `Заявка сформирована и отправлена: ${issue.department ?? 'в профильную службу'}.`;
}

// Уменьшает фото до ~100-200 КБ, чтобы не раздувать базу и не грузить сеть
async function compress(uri: string): Promise<string | null> {
  try {
    const ctx = ImageManipulator.manipulate(uri);
    ctx.resize({ width: 900 });
    const img = await ctx.renderAsync();
    const out = await img.saveAsync({ compress: 0.6, format: SaveFormat.JPEG, base64: true });
    return out.base64 ? `data:image/jpeg;base64,${out.base64}` : null;
  } catch {
    return null;
  }
}

export default function Report() {
  const router = useRouter();
  const { confirmId } = useLocalSearchParams<{ confirmId?: string }>();
  const { issues, loadIssues, addMine, user } = useSession();
  const target = confirmId ? issues.find((i) => i.id === confirmId) : undefined;

  const [photo, setPhoto] = useState<string | null>(null);
  const [photoData, setPhotoData] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [category, setCategory] = useState<Category>('road');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setPhoto(null);
    setPhotoData(null);
    setCoords(null);
    setAddress(null);
    setText('');
  };

  const takePhoto = async () => {
    const cam = await ImagePicker.requestCameraPermissionsAsync();
    if (!cam.granted) {
      Alert.alert('Нужен доступ к камере', 'Разрешите камеру в настройках телефона.');
      return;
    }
    const res = await ImagePicker.launchCameraAsync({ quality: 0.6 });
    if (res.canceled) return;
    const uri = res.assets[0].uri;
    setPhoto(uri);
    compress(uri).then(setPhotoData);

    setLocating(true);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Нужна геопозиция', 'Разрешите геопозицию, чтобы привязать обращение к месту.');
        return;
      }
      const p = await Location.getCurrentPositionAsync({});
      const c = { lat: p.coords.latitude, lng: p.coords.longitude };
      setCoords(c);
      try {
        const [a] = await Location.reverseGeocodeAsync({ latitude: c.lat, longitude: c.lng });
        const street = [a?.street, a?.streetNumber].filter(Boolean).join(' ');
        setAddress(street || a?.name || null);
      } catch {
        setAddress(null);
      }
    } finally {
      setLocating(false);
    }
  };

  const cancelConfirm = () => {
    router.setParams({ confirmId: '' });
    reset();
  };

  const submit = async () => {
    if (!photo || !coords || busy) return;
    setBusy(true);
    try {
      const comment = text.trim() || undefined;
      let issue: Issue;
      if (target) {
        issue = await api.confirmIssue(target.id, { lat: coords.lat, lng: coords.lng, comment });
        router.setParams({ confirmId: '' });
      } else {
        issue = await api.createIssue({
          category,
          lat: coords.lat,
          lng: coords.lng,
          address: address ?? undefined,
          title: comment,
          comment,
        });
      }
      addMine(issue.id);

      // привязка к номеру телефона, чтобы обращение появилось во вкладке "Мои"
      const phone = user?.phone ?? '';
      if (phone) {
        try {
          await api.claim(issue.id, { phone, lat: coords.lat, lng: coords.lng, comment });
        } catch {
          // обращение уже создано, привязку можно потерять без последствий для заявки
        }
      }
      // фото: если не загрузилось, заявка всё равно отправлена
      if (photoData) {
        try {
          await api.uploadPhoto(issue.id, photoData);
        } catch {
          // без фото тоже работает
        }
      }

      await loadIssues();
      reset();
      router.navigate('/(tabs)');
      Alert.alert('Готово', describe(issue));
    } catch {
      Alert.alert('Не удалось отправить', 'Проверьте соединение с сервером и попробуйте ещё раз.');
    } finally {
      setBusy(false);
    }
  };

  const canSubmit = !!photo && !!coords && !busy;

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={s.wrap} keyboardShouldPersistTaps="handled">
      {target && (
        <View style={s.banner}>
          <View style={{ flex: 1 }}>
            <Text style={s.bannerLabel}>Вы подтверждаете проблему</Text>
            <Text style={s.bannerTitle}>{target.title}</Text>
            <Text style={s.bannerAddr}>{target.address}</Text>
          </View>
          <Pressable onPress={cancelConfirm}>
            <Text style={s.bannerCancel}>Отмена</Text>
          </Pressable>
        </View>
      )}

      <Pressable style={s.photo} onPress={takePhoto}>
        {photo ? (
          <Image source={{ uri: photo }} style={s.img} />
        ) : (
          <Text style={s.photoText}>{target ? 'Сфотографируйте то же место' : 'Сфотографировать проблему'}</Text>
        )}
      </Pressable>
      <Text style={s.geo}>
        {locating
          ? 'Определяем геопозицию...'
          : coords
            ? `Место: ${address ?? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`}`
            : 'Геопозиция определится после фото'}
      </Text>

      {!target && (
        <>
          <Text style={s.label}>Категория</Text>
          <View style={s.chips}>
            {CATEGORIES.map((c) => (
              <Pressable key={c.key} onPress={() => setCategory(c.key)} style={[s.chip, category === c.key && s.chipOn]}>
                <Text style={[s.chipText, category === c.key && s.chipTextOn]}>{c.label}</Text>
              </Pressable>
            ))}
          </View>
        </>
      )}

      <Text style={s.label}>Комментарий (необязательно)</Text>
      <TextInput
        style={s.input}
        value={text}
        onChangeText={setText}
        placeholder="Что случилось"
        placeholderTextColor={colors.muted}
        multiline
      />

      <Pressable style={[s.btn, !canSubmit && s.btnOff]} onPress={submit} disabled={!canSubmit}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>{target ? 'Подтвердить' : 'Отправить'}</Text>}
      </Pressable>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 16, gap: 10 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.primarySoft,
    borderRadius: 14,
    padding: 14,
  },
  bannerLabel: { fontSize: 12, color: colors.primary, fontWeight: '700' },
  bannerTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: 2 },
  bannerAddr: { fontSize: 13, color: colors.muted, marginTop: 2 },
  bannerCancel: { color: colors.primary, fontWeight: '700', fontSize: 14 },
  photo: {
    height: 200,
    borderRadius: 14,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photoText: { color: colors.primary, fontSize: 16, fontWeight: '600' },
  img: { width: '100%', height: '100%' },
  geo: { fontSize: 13, color: colors.muted },
  label: { fontSize: 13, color: colors.muted, marginTop: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontSize: 14 },
  chipTextOn: { color: '#fff' },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    minHeight: 80,
    fontSize: 16,
    color: colors.text,
  },
  btn: { backgroundColor: colors.primary, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 12 },
  btnOff: { opacity: 0.4 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});