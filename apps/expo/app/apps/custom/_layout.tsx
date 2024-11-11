import React, { useEffect, useState } from 'react';
import { ArrowLeft } from '@tamagui/lucide-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'app_list';

export default function GamesProviderLayout() {
	const [appTitle, setAppTitle] = useState('Custom App');
	const { id } = useLocalSearchParams();

	useEffect(() => {
		const fetchAppTitle = async () => {
			try {
				const storedApps = await AsyncStorage.getItem(STORAGE_KEY);
				if (storedApps) {
					const apps = JSON.parse(storedApps);
					const app = apps.find((app) => app.id === id);
					if (app) {
						setAppTitle(app.name);
					}
				}
			} catch (error) {
				console.error('Error fetching app title:', error);
			}
		};

		if (id) {
			fetchAppTitle();
		}
	}, [id]);

	return (
		<Stack>
			<Stack.Screen
				name="[id]"
				options={{
					headerTitle: appTitle,
					headerLeft: () => (
						<TouchableOpacity
							onPress={() => router.navigate('/apps')}
							style={{ paddingLeft: 15 }}>
							<ArrowLeft size={24} color="#333333" />
						</TouchableOpacity>
					),
				}}
			/>
		</Stack>
	);
}
