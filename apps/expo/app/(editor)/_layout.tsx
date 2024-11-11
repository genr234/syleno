import { Redirect, Stack } from 'expo-router';

export default function AuthRoutesLayout() {
	return (
		<Stack>
			<Stack.Screen name="note" options={{ headerShown: false }} />
		</Stack>
	);
}
