import { Redirect, Stack } from 'expo-router';

export default function GamesProviderLayout() {
	return (
		<Stack>
			<Stack.Screen name="coolmathgames" options={{ headerShown: false }} />
			<Stack.Screen name="web" options={{ headerShown: false }} />
		</Stack>
	);
}
