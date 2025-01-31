import { Redirect, Stack } from 'expo-router';

export default function SocialRoutesLayout() {
	return (
		<Stack>
			<Stack.Screen name="addfriend" options={{ headerShown: false }} />
		</Stack>
	);
}
