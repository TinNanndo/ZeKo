import { Stack } from "expo-router";
import { StatsProvider } from './context/StatsContext';

export default function RootLayout() {
  return (
    <StatsProvider>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
        <Stack.Screen name="login" options={{ headerShown: false }} />
      </Stack>
    </StatsProvider>
  );
}