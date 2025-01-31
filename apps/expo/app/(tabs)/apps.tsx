import React, { useState, useEffect } from 'react';
import {
	Card,
	Input,
	Button,
	YStack,
	XStack,
	Text,
	Spinner,
	Dialog,
	Sheet,
	Spacer,
} from 'tamagui';
import {
	Search,
	Plus,
	Settings,
	RefreshCw,
	Trash2,
} from '@tamagui/lucide-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import { useRouter } from 'expo-router';
import * as Crypto from 'expo-crypto';

type AppSource = {
	id: string;
	name: string;
	url: string;
};

type App = {
	id: string;
	name: string;
	icon: string;
	color: string;
	action: 'builtin' | 'web' | 'native';
	url: string;
	source: string;
};

const DEFAULT_SOURCE: AppSource = {
	id: 'default',
	name: 'Built-in Apps',
	url: 'builtin://default',
};

const DEFAULT_APPS: App[] = [
	{
		id: 'games',
		name: 'Games',
		icon: '🎮',
		color: '#3B82F6',
		action: 'builtin',
		url: '/apps/games',
		source: 'default',
	},
];

const AppCard = ({ app, onPress }) => (
	<Card
		elevate
		bordered
		pressStyle={{ scale: 0.95 }}
		onPress={onPress}
		width="48%"
		height={120}
		marginBottom="$3">
		<YStack
			flex={1}
			backgroundColor={app.color}
			borderRadius="$4"
			alignItems="center"
			justifyContent="center"
			padding="$2">
			<Text fontSize={32} marginBottom="$2">
				{app.icon}
			</Text>
			<Text color="white" fontSize="$3" fontWeight="600" textAlign="center">
				{app.name}
			</Text>
		</YStack>
	</Card>
);

const SourceCard = ({ source, onRefresh, onDelete }) => (
	<Card bordered marginBottom="$2">
		<XStack padding="$4" justifyContent="space-between" alignItems="center">
			<YStack>
				<Text fontSize="$4" fontWeight="600">
					{source.name}
				</Text>
				<Text fontSize="$2" color="$gray11">
					{source.id === 'default' ? 'Built-in source' : source.url}
				</Text>
			</YStack>
			<XStack space="$2">
				<Button
					icon={RefreshCw}
					size="$2"
					circular
					disabled={source.id === 'default'}
					onPress={() => onRefresh(source)}
				/>
				{source.id !== 'default' && (
					<Button
						icon={Trash2}
						size="$2"
						circular
						theme="red"
						onPress={() => onDelete(source)}
					/>
				)}
			</XStack>
		</XStack>
	</Card>
);

export default function AppLauncher() {
	const router = useRouter();
	const [apps, setApps] = useState<App[]>(DEFAULT_APPS);
	const [sources, setSources] = useState<AppSource[]>([DEFAULT_SOURCE]);
	const [searchTerm, setSearchTerm] = useState('');
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [dialogType, setDialogType] = useState<
		'none' | 'addSource' | 'sourceList'
	>('none');
	const [newSourceUrl, setNewSourceUrl] = useState('');

	useEffect(() => {
		loadData();
	}, []);

	const loadData = async () => {
		try {
			const [storedSources, storedApps] = await Promise.all([
				AsyncStorage.getItem('sources'),
				AsyncStorage.getItem('apps'),
			]);

			if (storedSources) {
				setSources([DEFAULT_SOURCE, ...JSON.parse(storedSources)]);
			}
			if (storedApps) {
				setApps([...DEFAULT_APPS, ...JSON.parse(storedApps)]);
			}
		} catch (error) {
			setError('Failed to load data');
		} finally {
			setIsLoading(false);
		}
	};

	const saveData = async (newSources: AppSource[], newApps: App[]) => {
		try {
			await Promise.all([
				AsyncStorage.setItem(
					'sources',
					JSON.stringify(newSources.filter((s) => s.id !== 'default')),
				),
				AsyncStorage.setItem(
					'apps',
					JSON.stringify(newApps.filter((a) => a.source !== 'default')),
				),
			]);
		} catch (error) {
			setError('Failed to save data');
		}
	};

	const addSource = async () => {
		try {
			const url = new URL(newSourceUrl);
			const response = await fetch(url.toString());
			const data = await response.json();

			if (!Array.isArray(data.apps)) {
				throw new Error('Invalid source format');
			}

			const newSourceId = `source_${Date.now()}`;
			const newSource: AppSource = {
				id: newSourceId,
				name: url.hostname,
				url: url.toString(),
			};

			const newApps = data.apps.map((app) => ({
				...app,
				id: `${newSourceId}_${app.id}`,
				source: newSourceId,
			}));

			const updatedSources = [...sources, newSource];
			const updatedApps = [...apps, ...newApps];

			setSources(updatedSources);
			setApps(updatedApps);
			await saveData(updatedSources, updatedApps);
			setDialogType('none');
			setNewSourceUrl('');
		} catch (error) {
			setError('Failed to add source');
		}
	};

	const refreshSource = async (source: AppSource) => {
		try {
			const response = await fetch(source.url);
			const data = await response.json();

			const updatedApps = [
				...apps.filter((app) => app.source !== source.id),
				...data.apps.map((app) => ({
					...app,
					id: `${source.id}_${app.id}`,
					source: source.id,
				})),
			];

			setApps(updatedApps);
			await saveData(sources, updatedApps);
		} catch (error) {
			setError(`Failed to refresh ${source.name}`);
		}
	};

	const deleteSource = async (source: AppSource) => {
		const updatedSources = sources.filter((s) => s.id !== source.id);
		const updatedApps = apps.filter((app) => app.source !== source.id);

		setSources(updatedSources);
		setApps(updatedApps);
		await saveData(updatedSources, updatedApps);
	};

	const handleAppPress = async (app: App) => {
		switch (app.action) {
			case 'builtin':
				router.push(app.url);
				break;
			case 'web':
				await WebBrowser.openBrowserAsync(app.url);
				break;
			case 'native':
				router.push(`/apps/custom/${app.id}`);
				break;
		}
	};

	const filteredApps = apps.filter((app) =>
		app.name.toLowerCase().includes(searchTerm.toLowerCase()),
	);

	const renderDialogContent = () => {
		switch (dialogType) {
			case 'addSource':
				return (
					<YStack space="$4">
						<Dialog.Title>Add App Source</Dialog.Title>
						<Input
							placeholder="Enter source URL"
							value={newSourceUrl}
							onChangeText={setNewSourceUrl}
						/>
						<XStack space="$3" justifyContent="flex-end">
							<Button onPress={() => setDialogType('none')}>Cancel</Button>
							<Button theme="blue" onPress={addSource}>
								Add Source
							</Button>
						</XStack>
					</YStack>
				);
			case 'sourceList':
				return (
					<YStack space="$4">
						<Dialog.Title>App Sources</Dialog.Title>
						<YStack space="$2">
							{sources.map((source) => (
								<SourceCard
									key={source.id}
									source={source}
									onRefresh={refreshSource}
									onDelete={deleteSource}
								/>
							))}
						</YStack>
						<Button alignSelf="flex-end" onPress={() => setDialogType('none')}>
							Close
						</Button>
					</YStack>
				);
			default:
				return null;
		}
	};

	if (isLoading) {
		return (
			<YStack flex={1} alignItems="center" justifyContent="center">
				<Spinner size="large" />
			</YStack>
		);
	}

	return (
		<YStack flex={1} padding="$4">
			<Spacer paddingBottom="$6" />
			<XStack
				justifyContent="space-between"
				alignItems="center"
				marginBottom="$4">
				<Text fontSize="$8" fontWeight="bold">
					Apps
				</Text>
				<XStack space="$2">
					<Button
						size="$3"
						icon={Settings}
						onPress={() => setDialogType('sourceList')}>
						Sources
					</Button>
					<Button
						size="$3"
						theme="blue"
						icon={Plus}
						onPress={() => setDialogType('addSource')}>
						Add
					</Button>
				</XStack>
			</XStack>

			{error && (
				<Card backgroundColor="$red2" padding="$2" marginBottom="$4">
					<Text color="$red10">{error}</Text>
				</Card>
			)}

			<XStack
				marginBottom="$4"
				borderRadius="$4"
				borderWidth={1}
				borderColor="$borderColor"
				alignItems="center"
				paddingHorizontal="$2">
				<Search size={20} />
				<Input
					flex={1}
					marginLeft="$2"
					placeholder="Search apps..."
					borderWidth={0}
					fontSize="$4"
					backgroundColor="transparent"
					value={searchTerm}
					onChangeText={setSearchTerm}
				/>
			</XStack>

			<YStack flex={1}>
				<XStack flexWrap="wrap" justifyContent="space-between">
					{filteredApps.map((app) => (
						<AppCard
							app={app}
							onPress={() => handleAppPress(app)}
							key={Crypto.randomUUID()}
						/>
					))}
					{filteredApps.length === 0 && (
						<Text textAlign="center" color="$gray11" width="100%">
							No apps found
						</Text>
					)}
				</XStack>
			</YStack>

			{dialogType !== 'none' && (
				<Dialog
					modal
					open={true}
					onOpenChange={(open) => !open && setDialogType('none')}>
					<Dialog.Portal>
						<Dialog.Overlay />
						<Dialog.Content>{renderDialogContent()}</Dialog.Content>
					</Dialog.Portal>
				</Dialog>
			)}
		</YStack>
	);
}
