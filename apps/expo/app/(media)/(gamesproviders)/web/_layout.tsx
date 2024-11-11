import { Redirect, Stack } from 'expo-router';

export default function WebGamesRoutesLayout() {
	return (
		<Stack>
			<Stack.Screen name="[id]" options={{ headerShown: false }} />
		</Stack>
	);
}
