import { Redirect, Stack } from 'expo-router';

export default function EmuJsRoutesLayout() {
	return (
		<Stack>
			<Stack.Screen name="[id]" options={{ headerShown: false }} />
		</Stack>
	);
}
