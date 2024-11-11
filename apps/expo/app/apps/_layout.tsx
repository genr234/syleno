import { ArrowLeft } from '@tamagui/lucide-icons';
import { router, Stack } from 'expo-router';
import { TouchableOpacity } from 'react-native';

export default function AppsLayout() {
	return (
		<Stack>
			<Stack.Screen name="games" options={{ headerShown: false }} />
			<Stack.Screen name="custom" options={{ headerShown: false }} />
		</Stack>
	);
}
