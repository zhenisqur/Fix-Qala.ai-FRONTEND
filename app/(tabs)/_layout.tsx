import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import { useSession } from '../../src/store/session';
import { colors } from '../../src/theme';

export default function TabsLayout() {
  const user = useSession((s) => s.user);
  if (!user) return <Redirect href="/login" />;

  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: colors.primary, headerTitleAlign: 'left' }}>
      <Tabs.Screen name="index" options={{ title: 'Рядом', tabBarIcon: ({ color, size }) => <Ionicons name="location" color={color} size={size} /> }} />
      <Tabs.Screen name="report" options={{ title: 'Сообщить', tabBarIcon: ({ color, size }) => <Ionicons name="camera" color={color} size={size} /> }} />
      <Tabs.Screen name="mine" options={{ title: 'Мои', tabBarIcon: ({ color, size }) => <Ionicons name="list" color={color} size={size} /> }} />
    </Tabs>
  );
}