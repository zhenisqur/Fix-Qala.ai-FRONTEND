import { Ionicons } from '@expo/vector-icons';
import { useState, type ComponentProps } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { API_URL } from '../api/client';
import { colors } from '../theme';
import { formatDistance, STATUS_LABEL, type Issue } from '../types';

type IconName = ComponentProps<typeof Ionicons>['name'];

const CATEGORY_ICON: Record<string, IconName> = {
  road: 'warning-outline',
  light: 'bulb-outline',
  trash: 'trash-outline',
  water: 'water-outline',
  yard: 'leaf-outline',
};

const PRIORITY: Record<string, { label: string; color: string }> = {
  critical: { label: 'Критическое', color: colors.critical },
  medium: { label: 'Среднее', color: colors.medium },
  normal: { label: 'Обычное', color: colors.normal },
};

type Props = {
  issue: Issue;
  onPress: () => void;
  onConfirm?: () => void; // нет обработчика: кнопка показывает счётчик без нажатия
  showStatus?: boolean; // для вкладки "Мои": вместо расстояния показываем статус
};

export function IssueCard({ issue, onPress, onConfirm, showStatus }: Props) {
  const [photoFailed, setPhotoFailed] = useState(false);
  const p = PRIORITY[issue.priority] ?? PRIORITY.normal;
  const right = showStatus
    ? STATUS_LABEL[issue.status]
    : issue.distanceM != null
      ? formatDistance(issue.distanceM)
      : '';

  return (
    <Pressable style={s.card} onPress={onPress}>
      <View style={s.body}>
        <View style={s.meta}>
          <View style={[s.dot, { backgroundColor: p.color }]} />
          <Text style={s.metaText}>{p.label}</Text>
          {right ? <Text style={s.right}>{right}</Text> : null}
        </View>

        <Text style={s.title} numberOfLines={2}>
          {issue.title}
        </Text>
        <Text style={s.address} numberOfLines={1}>
          {issue.address}
        </Text>

        {onConfirm ? (
          <Pressable style={s.btn} onPress={onConfirm} hitSlop={6}>
            <Text style={s.btnText}>Подтверждаю · {issue.confirms}</Text>
          </Pressable>
        ) : (
          <View style={s.btn}>
            <Text style={s.btnText}>Подтвердили · {issue.confirms}</Text>
          </View>
        )}
      </View>

      <View style={s.photoWrap}>
        {photoFailed ? (
          <Ionicons name={CATEGORY_ICON[issue.category] ?? 'image-outline'} size={34} color={colors.primary} />
        ) : (
          <Image
            source={{ uri: `${API_URL}/issues/${issue.id}/photo` }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
            onError={() => setPhotoFailed(true)}
          />
        )}
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
  },
  body: { flex: 1, gap: 4, minWidth: 0 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  metaText: { fontSize: 13, color: colors.muted },
  right: { marginLeft: 'auto', fontSize: 13, color: colors.muted },
  title: { fontSize: 17, fontWeight: '800', color: colors.text, marginTop: 2 },
  address: { fontSize: 14, color: colors.muted },
  btn: {
    alignSelf: 'flex-start',
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 14,
    marginTop: 10,
  },
  btnText: { color: colors.primary, fontSize: 14, fontWeight: '700' },
  photoWrap: {
    width: 108,
    height: 124,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});