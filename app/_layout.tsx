import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="issue/[id]" options={{ headerShown: true, title: 'Обращение' }} />
    </Stack>
  );
}