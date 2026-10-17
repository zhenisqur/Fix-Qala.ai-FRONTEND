import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { api, type MyIssue } from '../../src/api/client';
import { IssueCard } from '../../src/components/IssueCard';
import { useSession } from '../../src/store/session';
import { colors } from '../../src/theme';

export default function Mine() {
  const router = useRouter();
  const user = useSession((s) => s.user);
  const phone = user?.phone ?? '';

  const [items, setItems] = useState<MyIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  const load = useCallback(async () => {
    if (!phone) return;
    setLoading(true);
    try {
      setItems(await api.myIssues(phone));
      setError(null);
    } catch {
      setError('Не удалось загрузить обращения');
    } finally {
      setLoading(false);
    }
  }, [phone]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const startEdit = (id: string, comment: string | null) => {
    setEditId(id);
    setDraft(comment ?? '');
  };

  const saveEdit = async () => {
    if (!editId) return;
    try {
      await api.editMyReport(editId, phone, draft);
      setEditId(null);
      await load();
    } catch {
      Alert.alert('Не удалось сохранить', 'Проверьте соединение и попробуйте ещё раз.');
    }
  };

  const confirmRemove = (id: string) => {
    Alert.alert('Удалить обращение?', 'Это действие нельзя отменить.', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.deleteMyReport(id, phone);
            await load();
          } catch {
            Alert.alert('Не удалось удалить', 'Проверьте соединение и попробуйте ещё раз.');
          }
        },
      },
    ]);
  };

  const logout = () => {
    Alert.alert('Выйти из аккаунта?', undefined, [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Выйти', style: 'destructive', onPress: () => useSession.setState({ user: null, myIds: [] }) },
    ]);
  };

  const initial = user?.name?.trim()?.[0]?.toUpperCase() ?? '?';

  return (
    <FlatList
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 16, gap: 16 }}
      data={items}
      keyExtractor={(i) => i.id}
      refreshing={loading}
      onRefresh={load}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <View style={s.profile}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{initial}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.name}>{user?.name}</Text>
            <Text style={s.phone}>{user?.phone}</Text>
            <Text style={s.count}>Обращений: {items.length}</Text>
          </View>
          <Pressable onPress={logout} hitSlop={8}>
            <Text style={s.logout}>Выйти</Text>
          </Pressable>
        </View>
      }
      ListEmptyComponent={
        !loading ? (
          <Text style={s.empty}>{error ?? 'Вы пока ничего не отправляли.\nСфотографируйте проблему во вкладке «Сообщить».'}</Text>
        ) : null
      }
      renderItem={({ item }) => (
        <View style={{ gap: 8 }}>
          <IssueCard issue={item} showStatus onPress={() => router.push(`/issue/${item.id}`)} />

          {item.reports.map((r) => (
            <View key={r.id} style={s.mine}>
              {editId === r.id ? (
                <>
                  <TextInput
                    style={s.input}
                    value={draft}
                    onChangeText={setDraft}
                    placeholder="Ваш комментарий"
                    placeholderTextColor={colors.muted}
                    multiline
                    autoFocus
                  />
                  <View style={s.actions}>
                    <Pressable onPress={saveEdit}>
                      <Text style={s.save}>Сохранить</Text>
                    </Pressable>
                    <Pressable onPress={() => setEditId(null)}>
                      <Text style={s.cancel}>Отмена</Text>
                    </Pressable>
                  </View>
                </>
              ) : (
                <>
                  <Text style={s.label}>Ваш комментарий</Text>
                  <Text style={s.comment}>{r.comment || 'Без комментария'}</Text>
                  <View style={s.actions}>
                    <Pressable onPress={() => startEdit(r.id, r.comment)}>
                      <Text style={s.save}>Изменить</Text>
                    </Pressable>
                    <Pressable onPress={() => confirmRemove(r.id)}>
                      <Text style={s.remove}>Удалить</Text>
                    </Pressable>
                  </View>
                </>
              )}
            </View>
          ))}
        </View>
      )}
    />
  );
}

const s = StyleSheet.create({
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 22, fontWeight: '800' },
  name: { fontSize: 18, fontWeight: '800', color: colors.text },
  phone: { fontSize: 14, color: colors.muted, marginTop: 2 },
  count: { fontSize: 13, color: colors.primary, fontWeight: '600', marginTop: 4 },
  logout: { color: colors.primary, fontWeight: '700', fontSize: 14 },
  empty: { color: colors.muted, fontSize: 15, textAlign: 'center', paddingVertical: 40, lineHeight: 22 },
  mine: {
    backgroundColor: colors.primarySoft,
    borderRadius: 14,
    padding: 12,
    gap: 6,
  },
  label: { fontSize: 11, color: colors.muted, letterSpacing: 0.5 },
  comment: { fontSize: 15, color: colors.text },
  input: {
    backgroundColor: colors.card,
    borderRadius: 10,
    padding: 10,
    fontSize: 15,
    color: colors.text,
    minHeight: 60,
  },
  actions: { flexDirection: 'row', gap: 20, marginTop: 4 },
  save: { color: colors.primary, fontWeight: '700', fontSize: 14 },
  cancel: { color: colors.muted, fontWeight: '600', fontSize: 14 },
  remove: { color: colors.critical, fontWeight: '700', fontSize: 14 },
});