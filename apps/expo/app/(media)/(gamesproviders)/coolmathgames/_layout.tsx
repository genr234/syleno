import { Redirect, Stack } from 'expo-router';

export default function CoolmathGamesRoutesLayout() {
	return (
		<Stack>
			<Stack.Screen name="[id]" options={{ headerShown: false }} />
		</Stack>
	);
}
