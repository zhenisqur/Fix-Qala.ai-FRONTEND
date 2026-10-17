import * as Location from 'expo-location';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text } from 'react-native';
import { IssueCard } from '../../src/components/IssueCard';
import { useSession } from '../../src/store/session';
import { colors } from '../../src/theme';

export default function Feed() {
  const router = useRouter();
  const { issues, loading, error, loadIssues } = useSession();
  const [pulling, setPulling] = useState(false);

  const refresh = useCallback(async () => {
    let lat: number | undefined;
    let lng: number | undefined;
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.granted) {
        const p = (await Location.getLastKnownPositionAsync()) ?? (await Location.getCurrentPositionAsync({}));
        lat = p.coords.latitude;
        lng = p.coords.longitude;
      }
    } catch {
      // без геопозиции просто покажем список без расстояний
    }
    await loadIssues(lat, lng);
  }, [loadIssues]);

  // крутилка только при ручном свайпе вниз, фоновое обновление идёт тихо
  const onPull = async () => {
    setPulling(true);
    await refresh();
    setPulling(false);
  };

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return (
    <FlatList
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 16, gap: 12 }}
      data={issues}
      keyExtractor={(i) => i.id}
      refreshing={pulling}
      onRefresh={onPull}
      ListHeaderComponent={error ? <Text style={s.error}>{error}. Потяните вниз, чтобы повторить.</Text> : null}
      ListEmptyComponent={!loading && !error ? <Text style={s.empty}>Рядом пока нет обращений</Text> : null}
      renderItem={({ item }) => (
        <IssueCard
          issue={item}
          onPress={() => router.push(`/issue/${item.id}`)}
          onConfirm={() => router.navigate({ pathname: '/(tabs)/report', params: { confirmId: item.id } })}
        />
      )}
    />
  );
}

const s = StyleSheet.create({
  error: { color: colors.critical, fontSize: 14, textAlign: 'center', paddingVertical: 8 },
  empty: { color: colors.muted, fontSize: 15, textAlign: 'center', paddingVertical: 40 },
});