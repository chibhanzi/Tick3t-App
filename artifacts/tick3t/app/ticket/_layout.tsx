import { Stack } from 'expo-router';

export default function TicketLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_bottom' }}>
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
