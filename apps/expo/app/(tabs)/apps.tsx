// app/index.tsx
import React, { useState, useEffect } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
	YStack,
	XStack,
	Text,
	Button,
	Input,
	Card,
	Dialog,
	Adapt,
	Sheet,
	Spinner,
	Separator,
	ScrollView,
	Label,
	Spacer,
} from 'tamagui';
import {
	Search,
	Settings,
	Plus,
	Trash2,
	RefreshCw,
	AlertTriangle,
} from '@tamagui/lucide-icons';
import * as WebBrowser from 'expo-web-browser';

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
	action: string;
	url?: string;
	source: string;
};

const DEFAULT_SOURCE: AppSource = {
	id: 'default',
	name: 'Built-in Apps',
	url: 'builtin://default',
};

const DEFAULT_APPS: App[] = [
	{
		id: 'default_games',
		name: 'Games',
		icon: '🎮',
		color: '$blue10',
		action: 'builtin',
		url: '/apps/games',
		source: 'default',
	},
];

const STORAGE_KEYS = {
	SOURCES: 'app_sources',
	APPS: 'app_list',
};

const AppCard = ({ app, onPress }) => {
	return (
		<Card
			elevate
			bordered
			animation="bouncy"
			pressStyle={{ scale: 0.95 }}
			onPress={onPress}
			width="48%"
			height={120}
			mb="$3">
			<Card.Background>
				<YStack
					f={1}
					backgroundColor={app.color}
					br="$4"
					ai="center"
					jc="center"
					p="$2">
					<Text fontSize={32} mb="$2">
						{app.icon}
					</Text>
					<Text color="white" fontSize="$3" fontWeight="600" textAlign="center">
						{app.name}
					</Text>
				</YStack>
			</Card.Background>
		</Card>
	);
};

const SourceCard = ({ source, onRefresh, onDelete, isRefreshing }) => {
	const isDefault = source.id === 'default';

	return (
		<Card bordered mb="$2">
			<Card.Header padded>
				<XStack jc="space-between" ai="center">
					<YStack>
						<Text fontSize="$4" fontWeight="600">
							{source.name}
						</Text>
						<Text fontSize="$2" color="$gray11">
							{isDefault ? 'Built-in source' : source.url}
						</Text>
					</YStack>
					<XStack space="$2">
						<Button
							icon={RefreshCw}
							size="$2"
							circular
							disabled={isDefault || isRefreshing}
							onPress={() => onRefresh(source)}
						/>
						{!isDefault && (
							<Button
								icon={Trash2}
								size="$2"
								circular
								theme="red"
								disabled={isRefreshing}
								onPress={() => onDelete(source)}
							/>
						)}
					</XStack>
				</XStack>
			</Card.Header>
		</Card>
	);
};

const DialogContent = ({
	dialogState,
	newSourceUrl,
	setNewSourceUrl,
	pendingSourceUrl,
	isLoading,
	sources,
	refreshingSource,
	handleAddSourceClick,
	handleConfirmAddSource,
	closeDialog,
	refreshSource,
	deleteSource,
}) => {
	if (dialogState === 'addSource') {
		return (
			<YStack space="$4">
				<Dialog.Title>Add App Source</Dialog.Title>
				<Dialog.Description>
					Enter the URL of a JSON file containing app definitions
				</Dialog.Description>
				<Input
					placeholder="https://example.com/apps.json"
					value={newSourceUrl}
					onChangeText={setNewSourceUrl}
				/>
				<XStack space="$3" justifyContent="flex-end">
					<Dialog.Close asChild>
						<Button disabled={isLoading}>Cancel</Button>
					</Dialog.Close>
					<Button
						themeInverse
						onPress={handleAddSourceClick}
						disabled={isLoading || !newSourceUrl}>
						Continue
					</Button>
				</XStack>
			</YStack>
		);
	}

	if (dialogState === 'warning') {
		return (
			<YStack space="$4">
				<XStack space="$2" ai="center">
					<AlertTriangle color="$yellow10" size={24} />
					<Dialog.Title color="$yellow10">Security Warning</Dialog.Title>
				</XStack>
				<Dialog.Description>
					You are about to add apps from a third-party source. These apps may
					not be verified and could pose security risks. Only add sources that
					you trust.
				</Dialog.Description>
				<Card backgroundColor="$yellow2" p="$3" br="$4">
					<Text fontSize="$3" color="$yellow10">
						Source URL: {pendingSourceUrl}
					</Text>
				</Card>
				<XStack space="$3" justifyContent="flex-end">
					<Dialog.Close asChild>
						<Button bordered theme="gray">
							Cancel
						</Button>
					</Dialog.Close>
					<Button
						theme="yellow"
						onPress={handleConfirmAddSource}
						icon={isLoading ? () => <Spinner /> : undefined}
						disabled={isLoading}>
						I Understand, Add Source
					</Button>
				</XStack>
			</YStack>
		);
	}

	if (dialogState === 'sourceList') {
		return (
			<YStack space="$4">
				<Dialog.Title>App Sources</Dialog.Title>
				<ScrollView showsVerticalScrollIndicator={false}>
					{sources.map((source) => (
						<SourceCard
							key={source.id}
							source={source}
							onRefresh={refreshSource}
							onDelete={deleteSource}
							isRefreshing={refreshingSource === source.id}
						/>
					))}
				</ScrollView>
				<Dialog.Close asChild>
					<Button alignSelf="flex-end">Close</Button>
				</Dialog.Close>
			</YStack>
		);
	}

	return null;
};

export default function AppLauncher() {
	const router = useRouter();
	const [searchTerm, setSearchTerm] = useState('');
	const [sources, setSources] = useState<AppSource[]>([DEFAULT_SOURCE]);
	const [apps, setApps] = useState<App[]>(DEFAULT_APPS);
	const [isSourceDialogOpen, setIsSourceDialogOpen] = useState(false);
	const [isSourceListOpen, setIsSourceListOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [refreshingSource, setRefreshingSource] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [showThirdPartyWarning, setShowThirdPartyWarning] = useState(false);
	const [dialogState, setDialogState] = useState<
		'closed' | 'addSource' | 'warning' | 'sourceList'
	>('closed');
	const [newSourceUrl, setNewSourceUrl] = useState('');
	const [pendingSourceUrl, setPendingSourceUrl] = useState('');

	const openAddSourceDialog = () => setDialogState('addSource');
	const openSourceListDialog = () => setDialogState('sourceList');
	const closeDialog = () => {
		setDialogState('closed');
		setNewSourceUrl('');
		setPendingSourceUrl('');
	};
	useEffect(() => {
		loadData();
	}, []);

	const openBuiltinBrowser = async (url: string) => {
		await WebBrowser.openBrowserAsync(url);
	};

	const saveData = async (newSources: AppSource[], newApps: App[]) => {
		try {
			const sourcesToStore = newSources.filter((s) => s.id !== 'default');
			const appsToStore = newApps.filter((a) => a.source !== 'default');

			await AsyncStorage.setItem(
				STORAGE_KEYS.SOURCES,
				JSON.stringify(sourcesToStore),
			);
			await AsyncStorage.setItem(
				STORAGE_KEYS.APPS,
				JSON.stringify(appsToStore),
			);
		} catch (e) {
			setError('Failed to save app data');
		}
	};

	const loadData = async () => {
		try {
			const storedSources = await AsyncStorage.getItem(STORAGE_KEYS.SOURCES);
			const storedApps = await AsyncStorage.getItem(STORAGE_KEYS.APPS);

			if (storedSources) {
				setSources([DEFAULT_SOURCE, ...JSON.parse(storedSources)]);
			}

			if (storedApps) {
				setApps([...DEFAULT_APPS, ...JSON.parse(storedApps)]);
			}
		} catch (e) {
			setError('Failed to load app data');
		} finally {
			setIsLoading(false);
		}
	};

	const validateAndTransformApps = (
		sourceApps: any[],
		sourceId: string,
	): App[] => {
		const existingIds = new Set(apps.map((app) => app.id));
		const existingNames = new Set(apps.map((app) => app.name));

		return sourceApps
			.filter((app) => !existingNames.has(app.name)) // Filter duplicates by name
			.map((app) => {
				let uniqueId = app.id;

				// Ensure ID uniqueness and prevent 'default' prefix
				if (existingIds.has(uniqueId) || uniqueId.startsWith('default_')) {
					uniqueId = `${sourceId}_${app.id}`;
				}
				existingIds.add(uniqueId);

				return {
					...app,
					id: uniqueId,
					source: sourceId, // Override any attempt to claim 'default' source
				};
			});
	};

	const fetchAppsFromSource = async (
		url: string,
		sourceId: string,
	): Promise<App[]> => {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		const data = await response.json();

		if (!Array.isArray(data.apps)) {
			throw new Error('Invalid app source format');
		}

		return validateAndTransformApps(data.apps, sourceId);
	};

	const addSource = async () => {
		if (!pendingSourceUrl) return;

		try {
			setError(null);
			setIsLoading(true);

			const url = new URL(pendingSourceUrl);
			const newSourceId = `source_${Date.now()}`;
			const newApps = await fetchAppsFromSource(url.toString(), newSourceId);

			const newSource: AppSource = {
				id: newSourceId,
				name: url.hostname,
				url: url.toString(),
			};

			const updatedSources = [...sources, newSource];
			const updatedApps = [...apps, ...newApps];

			setSources(updatedSources);
			setApps(updatedApps);
			await saveData(updatedSources, updatedApps);

			setPendingSourceUrl('');
			setNewSourceUrl('');
			setIsSourceDialogOpen(false);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Failed to add source');
		} finally {
			setIsLoading(false);
		}
	};

	const refreshSource = async (source: AppSource) => {
		if (source.id === 'default') return;

		try {
			setRefreshingSource(source.id);
			const refreshedApps = await fetchAppsFromSource(source.url, source.id);

			const updatedApps = [
				...apps.filter((app) => app.source !== source.id),
				...refreshedApps,
			];

			setApps(updatedApps);
			await saveData(sources, updatedApps);
		} catch (e) {
			setError(`Failed to refresh ${source.name}`);
		} finally {
			setRefreshingSource(null);
		}
	};

	const deleteSource = async (source: AppSource) => {
		if (source.id === 'default') return;

		try {
			const updatedSources = sources.filter((s) => s.id !== source.id);
			const updatedApps = apps.filter((app) => app.source !== source.id);

			setSources(updatedSources);
			setApps(updatedApps);
			await saveData(updatedSources, updatedApps);
		} catch (e) {
			setError(`Failed to delete ${source.name}`);
		}
	};

	const handleAddSourceClick = () => {
		if (!newSourceUrl) {
			setError('Please enter a valid URL.');
			return;
		}
		setPendingSourceUrl(newSourceUrl);
		setDialogState('warning');
	};

	const handleConfirmAddSource = async () => {
		try {
			setIsLoading(true);
			await addSource();
			closeDialog();
		} catch (e) {
			setError('Failed to add source.');
		} finally {
			setIsLoading(false);
		}
	};

	const handleCancelAddSource = () => {
		setShowThirdPartyWarning(false);
		setPendingSourceUrl('');
		setNewSourceUrl('');
	};

	const filteredApps = apps.filter((app) =>
		app.name.toLowerCase().includes(searchTerm.toLowerCase()),
	);

	if (isLoading) {
		return (
			<YStack f={1} ai="center" jc="center">
				<Spinner size="large" />
			</YStack>
		);
	}

	const dialogContent = (
		<DialogContent
			dialogState={dialogState}
			newSourceUrl={newSourceUrl}
			setNewSourceUrl={setNewSourceUrl}
			pendingSourceUrl={pendingSourceUrl}
			isLoading={isLoading}
			sources={sources}
			refreshingSource={refreshingSource}
			handleAddSourceClick={handleAddSourceClick}
			handleConfirmAddSource={handleConfirmAddSource}
			closeDialog={closeDialog}
			refreshSource={refreshSource}
			deleteSource={deleteSource}
		/>
	);

	return (
		<YStack f={1} p="$4">
			<Spacer />
			<XStack jc="space-between" ai="center" mb="$4">
				<Text fontSize="$9" fontWeight="bold">
					Apps
				</Text>
				<XStack space="$2">
					<Button size="$3" onPress={openSourceListDialog} icon={Settings}>
						Sources
					</Button>
					<Button
						size="$3"
						theme="blue"
						icon={Plus}
						onPress={openAddSourceDialog}>
						Add
					</Button>
				</XStack>
			</XStack>

			{error && (
				<Card backgroundColor="$red2" p="$2" mb="$4">
					<Text color="$red10">{error}</Text>
				</Card>
			)}

			<XStack
				mb="$4"
				br="$4"
				borderWidth={1}
				borderColor="$borderColor"
				ai="center"
				px="$2">
				<Search size={20} />
				<Input
					f={1}
					ml="$2"
					placeholder="Search apps..."
					borderWidth={0}
					fontSize="$4"
					backgroundColor="transparent"
					value={searchTerm}
					onChangeText={setSearchTerm}
				/>
			</XStack>

			<YStack f={1}>
				<FlatList
					data={filteredApps}
					renderItem={({ item }) => (
						<AppCard
							app={item}
							onPress={() => {
								if (item.action === 'builtin') {
									router.push(item.url);
								} else if (item.action === 'web') {
									openBuiltinBrowser(item.url);
								} else if (item.action === 'native') {
									router.push(`/apps/custom/${item.id}`);
								}
							}}
						/>
					)}
					keyExtractor={(item) => item.id}
					numColumns={2}
					columnWrapperStyle={styles.columnWrapper}
					contentContainerStyle={styles.gridContainer}
					ListEmptyComponent={
						<Text textAlign="center" color="$gray11">
							No apps found
						</Text>
					}
				/>
			</YStack>

			<Dialog
				modal
				open={dialogState !== 'closed'}
				onOpenChange={(open) => !open && closeDialog()}>
				<Adapt when="sm" platform="touch">
					<Sheet animation="medium" zIndex={200000} modal dismissOnSnapToBottom>
						<Sheet.Frame padding="$4">
							<Sheet.ScrollView>{dialogContent}</Sheet.ScrollView>
						</Sheet.Frame>
						<Sheet.Overlay />
					</Sheet>
				</Adapt>

				{/* Default Dialog for desktop web and fallback */}
				<Dialog.Portal>
					<Dialog.Overlay
						key="overlay"
						animation="quick"
						opacity={0.5}
						enterStyle={{ opacity: 0 }}
						exitStyle={{ opacity: 0 }}
					/>
					<Dialog.Content
						bordered
						elevate
						key="content"
						animation={[
							'quick',
							{
								opacity: {
									overshootClamping: true,
								},
							},
						]}
						enterStyle={{ x: 0, y: -20, opacity: 0, scale: 0.9 }}
						exitStyle={{ x: 0, y: 10, opacity: 0, scale: 0.95 }}
						w="100%"
						maw={650}
						p="$4">
						{dialogContent}
					</Dialog.Content>
				</Dialog.Portal>
			</Dialog>
		</YStack>
	);
}
const styles = StyleSheet.create({
	columnWrapper: {
		justifyContent: 'space-between',
	},
	gridContainer: {
		paddingBottom: 16,
	},
});
