import { Redirect, Stack } from 'expo-router';

export default function MediaRoutesLayout() {
	return (
		<Stack>
			<Stack.Screen name="(gamesproviders)" options={{ headerShown: false }} />
		</Stack>
	);
}
