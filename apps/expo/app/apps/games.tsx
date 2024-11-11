import React, { useState, useEffect, useRef } from 'react';
import {
	View,
	StyleSheet,
	Image,
	TouchableOpacity,
	Dimensions,
	FlatList,
	RefreshControl,
	TextInput,
	Alert,
	Platform,
	Animated,
	Modal,
	PanResponder,
} from 'react-native';
import {
	H1,
	H2,
	H3,
	H4,
	Paragraph,
	YStack,
	XStack,
	Button,
	Input,
	ScrollView,
	Spacer,
	Dialog,
	Sheet,
	ListItem,
	H5,
} from 'tamagui';
import {
	Search,
	Star,
	Flame,
	Zap,
	Award,
	Settings,
	Play,
	Verified,
	Plus,
	X,
	Trash2,
	AlertOctagon,
	ArrowLeft,
	XCircle,
	Gamepad2,
	GalleryHorizontalEnd,
	Heart,
	LibraryBig,
} from '@tamagui/lucide-icons';
import { router } from 'expo-router';
import {
	useSharedValue,
	useAnimatedStyle,
	withTiming,
	Easing,
	runOnJS,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as configcat from 'configcat-js';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = 120;
const CARD_ASPECT_RATIO = 1.5;

const NonSwipableGameCard = ({ game, onPress }) => (
	<TouchableOpacity style={styles.gameCard} onPress={() => onPress(game)}>
		<Image source={{ uri: game.image }} style={styles.gameCardImage} />
		<View style={styles.gameCardContent}>
			<H4 numberOfLines={1} style={styles.gameTitle}>
				{game.title}
			</H4>
			<XStack gap="$2" marginTop="$2">
				<Star size={16} color="#FFD700" />
				<Paragraph size="$2" style={styles.gameRating}>
					{game.rating}
				</Paragraph>
			</XStack>
		</View>
	</TouchableOpacity>
);

const FeaturedGameCard = ({ game, onPress }) => (
	<TouchableOpacity
		style={styles.featuredGameCard}
		onPress={() => onPress(game)}>
		<Image source={{ uri: game.image }} style={styles.featuredGameImage} />
		<View style={styles.featuredGameOverlay}>
			<View style={styles.featuredGameContent}>
				<H2 style={styles.featuredGameTitle}>{game.title}</H2>
				<Paragraph style={styles.featuredGameDescription} numberOfLines={2}>
					{game.description}
				</Paragraph>
				<XStack gap="$4" marginTop="$2">
					<XStack alignItems="center" gap="$2">
						<Star size={20} color="#FFD700" />
						<Paragraph style={styles.featuredGameRating}>
							{game.rating}
						</Paragraph>
					</XStack>
					<XStack alignItems="center" gap="$2">
						<Flame size={20} color="#FF4500" />
						<Paragraph style={styles.featuredGamePopular}>Popular</Paragraph>
					</XStack>
				</XStack>
				<Button
					icon={<Play size={20} color="#FFFFFF" />}
					style={styles.featuredGameButton}
					onPress={() => onPress(game)}>
					Play Now
				</Button>
			</View>
		</View>
	</TouchableOpacity>
);

const SwipableGameCard = ({
	game,
	pan,
	panResponders,
	index,
	totalCards,
	cardDimensions,
}) => {
	const rotate = pan.x.interpolate({
		inputRange: [-cardDimensions.width / 2, 0, cardDimensions.width / 2],
		outputRange: ['-10deg', '0deg', '10deg'],
		extrapolate: 'clamp',
	});

	const opacity = pan.x.interpolate({
		inputRange: [-cardDimensions.width / 2, 0, cardDimensions.width / 2],
		outputRange: [0.5, 1, 0.5],
		extrapolate: 'clamp',
	});

	const scale = pan.x.interpolate({
		inputRange: [-cardDimensions.width / 2, 0, cardDimensions.width / 2],
		outputRange: [0.8, 1, 0.8],
		extrapolate: 'clamp',
	});

	const backgroundColor = pan.x.interpolate({
		inputRange: [-cardDimensions.width / 2, 0, cardDimensions.width / 2],
		outputRange: [
			'rgba(255,0,0,0.2)',
			'rgba(255,255,255,1)',
			'rgba(0,255,0,0.2)',
		],
		extrapolate: 'clamp',
	});

	const cardStyle = {
		...styles.card,
		width: cardDimensions.width,
		height: cardDimensions.height,
		transform: [{ rotate }, { scale }],
		opacity,
		backgroundColor,
		zIndex: totalCards - index,
	};

	return (
		<Animated.View style={[cardStyle, pan.getLayout()]} {...panResponders}>
			<Image source={{ uri: game.image }} style={styles.cardImage} />
			<View style={styles.cardContent}>
				<H4 style={styles.cardTitle}>{game.title}</H4>
				<Paragraph style={styles.cardGenre}>{game.genre}</Paragraph>
			</View>
		</Animated.View>
	);
};

const CategoryButton = ({ icon, label, isSelected, onPress }) => (
	<TouchableOpacity
		style={[styles.categoryButton, isSelected && styles.categoryButtonSelected]}
		onPress={onPress}>
		{icon}
		<Paragraph style={[{ color: isSelected ? 'white' : '#6D6D6D' }]}>
			{label}
		</Paragraph>
	</TouchableOpacity>
);

const SwipeableGamesLibrary = (toggleSwipeable) => {
	const [games, setGames] = useState([]);
	const [filteredGames, setFilteredGames] = useState([]);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [gameUrls, setGameUrls] = useState([]);
	const [newGameUrl, setNewGameUrl] = useState('');
	const [isAddUrlModalOpen, setIsAddUrlModalOpen] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');

	const pan = useRef(new Animated.ValueXY()).current;
	const cardContainerRef = useRef(null);
	const [cardDimensions, setCardDimensions] = useState({ width: 0, height: 0 });

	useEffect(() => {
		loadGameUrls();
	}, []);

	useEffect(() => {
		fetchGames();
	}, [gameUrls]);

	useEffect(() => {
		setFilteredGames(games);
	}, [games]);

	const panResponders = PanResponder.create({
		onMoveShouldSetPanResponder: () => true,
		onPanResponderMove: (_, gesture) => {
			if (Platform.OS === 'web') {
				// Prevent card from expanding the page on web
				gesture.dx = Math.max(
					Math.min(gesture.dx, cardDimensions.width / 2),
					-cardDimensions.width / 2,
				);
			}
			Animated.event([null, { dx: pan.x, dy: pan.y }], {
				useNativeDriver: false,
			})(_, gesture);
		},
		onPanResponderRelease: (_, gesture) => {
			if (gesture.dx > SWIPE_THRESHOLD) {
				swipeRight();
			} else if (gesture.dx < -SWIPE_THRESHOLD) {
				swipeLeft();
			} else {
				Animated.spring(pan, {
					toValue: { x: 0, y: 0 },
					useNativeDriver: false,
				}).start();
			}
		},
	});

	const swipeLeft = () => {
		Animated.timing(pan, {
			toValue: { x: -cardDimensions.width, y: 0 },
			duration: 250,
			useNativeDriver: false,
		}).start(() => {
			pan.setValue({ x: 0, y: 0 });
			setCurrentIndex((prevIndex) => (prevIndex + 1) % filteredGames.length);
		});
	};

	const swipeRight = () => {
		Animated.timing(pan, {
			toValue: { x: cardDimensions.width, y: 0 },
			duration: 250,
			useNativeDriver: false,
		}).start(() => {
			pan.setValue({ x: 0, y: 0 });
			handlePlayGame(filteredGames[currentIndex]);
			setCurrentIndex((prevIndex) => (prevIndex + 1) % filteredGames.length);
		});
	};

	const loadGameUrls = async () => {
		try {
			const storedUrls = await AsyncStorage.getItem('gameUrls');
			if (storedUrls !== null) {
				setGameUrls(JSON.parse(storedUrls));
			}
		} catch (error) {
			console.error('Error loading game URLs:', error);
		}
	};

	const saveGameUrls = async (urls) => {
		try {
			await AsyncStorage.setItem('gameUrls', JSON.stringify(urls));
		} catch (error) {
			console.error('Error saving game URLs:', error);
		}
	};

	const fetchGames = async () => {
		try {
			let allGames = [];
			for (const url of gameUrls) {
				const response = await fetch(url);
				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}
				const data = await response.json();
				allGames = [...allGames, ...data];
			}
			setGames(allGames);
		} catch (error) {
			console.error('Error fetching games:', error);
			Alert.alert('Error', 'Failed to fetch games. Please try again later.');
		}
	};

	const handleAddGameUrl = async () => {
		if (newGameUrl) {
			setIsSubmitting(true);
			try {
				const response = await fetch(newGameUrl);
				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}
				await response.json();
				const updatedUrls = [...gameUrls, newGameUrl];
				setGameUrls(updatedUrls);
				await saveGameUrls(updatedUrls);
				setNewGameUrl('');
				Alert.alert('Success', 'New game URL added successfully!');
			} catch (error) {
				console.error('Error adding game URL:', error);
				Alert.alert(
					'Error',
					'Invalid URL or unable to fetch game data. Please check the URL and try again.',
				);
			} finally {
				setIsSubmitting(false);
			}
		}
	};

	const handleRemoveGameUrl = async (urlToRemove) => {
		const updatedUrls = gameUrls.filter((url) => url !== urlToRemove);
		setGameUrls(updatedUrls);
		await saveGameUrls(updatedUrls);
	};

	const handlePlayGame = (game) => {
		if (game.platform === 'coolmathgames') {
			router.navigate(`/(media)/(gamesproviders)/coolmathgames/${game.id}`);
		} else if (game.platform === 'web') {
			router.navigate(`/(media)/(gamesproviders)/web/${game.id}`);
		}
	};

	const handleSearch = (query) => {
		setSearchQuery(query);
		const filtered = games.filter((game) =>
			game.title.toLowerCase().includes(query.toLowerCase()),
		);
		setFilteredGames(filtered);
		setCurrentIndex(0);
	};

	const onCardContainerLayout = (event) => {
		const { width, height } = event.nativeEvent.layout;
		const cardWidth = Math.min(width * 0.9, 400);
		const cardHeight = cardWidth * CARD_ASPECT_RATIO;
		setCardDimensions({ width: cardWidth, height: cardHeight });
	};

	return (
		<View style={styles.container}>
			<YStack gap="$4" padding="$4">
				<XStack justifyContent="space-between" alignItems="center">
					<H1 style={styles.title}>Games</H1>
					<XStack gap="$4">
						<TouchableOpacity onPress={() => toggleSwipeable.toggleSwipeable()}>
							<LibraryBig size={24} color="#333333" />
						</TouchableOpacity>
					</XStack>
				</XStack>
			</YStack>

			<View
				style={styles.cardContainer}
				ref={cardContainerRef}
				onLayout={onCardContainerLayout}>
				{filteredGames
					.slice(currentIndex, currentIndex + 3)
					.map((game, index) => (
						<SwipableGameCard
							key={game.id}
							game={game}
							pan={index === 0 ? pan : new Animated.ValueXY()}
							panResponders={index === 0 ? panResponders.panHandlers : {}}
							index={index}
							totalCards={3}
							cardDimensions={cardDimensions}
						/>
					))}
			</View>

			<XStack justifyContent="space-around" padding="$4">
				<Button
					icon={<XCircle size={24} color="#FF4500" />}
					variant="outlined"
					circular
					onPress={swipeLeft}
				/>
				<Button
					icon={<Gamepad2 size={24} color="#4CAF50" />}
					variant="outlined"
					circular
					onPress={swipeRight}
				/>
			</XStack>

			<Sheet
				forceRemoveScrollEnabled={isAddUrlModalOpen}
				snapPointsMode={'percent'}
				modal={true}
				open={isAddUrlModalOpen}
				onOpenChange={setIsAddUrlModalOpen}
				snapPoints={[40]}
				dismissOnSnapToBottom
				position={0}
				animation="medium">
				<Sheet.Overlay
					animation="lazy"
					enterStyle={{ opacity: 0 }}
					exitStyle={{ opacity: 0 }}
				/>
				<Sheet.Frame padding="$4" space>
					<YStack space>
						<XStack justifyContent="space-between" alignItems="center">
							<H3>Manage Sources</H3>
							<TouchableOpacity onPress={() => setIsAddUrlModalOpen(false)}>
								<X size={24} color="#333333" />
							</TouchableOpacity>
						</XStack>
						<Paragraph theme="alt2">Current sources:</Paragraph>
						{gameUrls.map((url, index) => (
							<ListItem key={index} pressTheme>
								<ListItem.Text>{url}</ListItem.Text>
								<TouchableOpacity onPress={() => handleRemoveGameUrl(url)}>
									<Trash2 size={20} color="red" />
								</TouchableOpacity>
							</ListItem>
						))}
						<Paragraph theme="alt2">Add a new source URL:</Paragraph>
						<Input
							size="$4"
							borderWidth={2}
							placeholder="https://example.com/games.json"
							value={newGameUrl}
							onChangeText={setNewGameUrl}
						/>
						<XStack justifyContent="flex-end" space="$3">
							<Button theme="alt2" onPress={() => setIsAddUrlModalOpen(false)}>
								Close
							</Button>
							<Button
								theme="active"
								themeInverse
								onPress={handleAddGameUrl}
								disabled={isSubmitting}>
								{isSubmitting ? 'Adding...' : 'Add'}
							</Button>
						</XStack>
					</YStack>
				</Sheet.Frame>
			</Sheet>

			<Modal
				visible={isSearchModalOpen}
				animationType="slide"
				transparent={false}
				onRequestClose={() => setIsSearchModalOpen(false)}>
				<View style={styles.searchModalContainer}>
					<XStack
						alignItems="center"
						padding="$4"
						backgroundColor="white"
						borderBottomWidth={1}
						borderBottomColor="#CCCCCC">
						<TextInput
							style={styles.searchInput}
							placeholder="Search games..."
							value={searchQuery}
							onChangeText={handleSearch}
							autoFocus
						/>
					</XStack>
				</View>
			</Modal>
		</View>
	);
};

const GameLibrary = (toggleSwipeable) => {
	const [games, setGames] = useState([]);
	const [expandedGame, setExpandedGame] = useState(null);
	const [featuredGame, setFeaturedGame] = useState(null);
	const [selectedCategory, setSelectedCategory] = useState('All');
	const [searchQuery, setSearchQuery] = useState('');
	const [refreshing, setRefreshing] = useState(false);
	const [gameUrls, setGameUrls] = useState([]);
	const [newGameUrl, setNewGameUrl] = useState('');
	const [isAddUrlModalOpen, setIsAddUrlModalOpen] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [swipeableModeEnabled, setSwipeableModeEnabled] = useState(false);

	const overlayOpacity = useSharedValue(0);
	const modalScale = useSharedValue(0.8);

	useEffect(() => {
		loadGameUrls();
	}, []);

	useEffect(() => {
		fetchGames();
	}, [gameUrls]);

	useEffect(() => {
		const configCatClient = configcat.getClient(
			'configcat-sdk-1/euzcCOphQUSKP4ID-gCerg/BIOmoFyyb0WVscoS8T_ubw',
			configcat.PollingMode.AutoPoll,
			{
				pollIntervalSeconds: 10,
			},
		);

		configCatClient.getValueAsync('swipeableMode', false).then((value) => {
			setSwipeableModeEnabled(value);
		});
	}, []);
	const loadGameUrls = async () => {
		try {
			const storedUrls = await AsyncStorage.getItem('gameUrls');
			if (storedUrls !== null) {
				setGameUrls(JSON.parse(storedUrls));
			}
		} catch (error) {
			console.error('Error loading game URLs:', error);
		}
	};

	const saveGameUrls = async (urls) => {
		try {
			await AsyncStorage.setItem('gameUrls', JSON.stringify(urls));
		} catch (error) {
			console.error('Error saving game URLs:', error);
		}
	};

	const fetchGames = async () => {
		try {
			let allGames = [];
			for (const url of gameUrls) {
				const response = await fetch(url);
				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}
				const data = await response.json();
				allGames = [...allGames, ...data];
			}
			setGames(allGames);
			setFeaturedGame(allGames[Math.floor(Math.random() * allGames.length)]);
		} catch (error) {
			console.error('Error fetching games:', error);
			Alert.alert('Error', 'Failed to fetch games. Please try again later.');
		}
	};

	const handleAddGameUrl = async () => {
		if (newGameUrl) {
			setIsSubmitting(true);
			try {
				const response = await fetch(newGameUrl);
				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}
				await response.json(); // Check if it's a valid JSON
				const updatedUrls = [...gameUrls, newGameUrl];
				setGameUrls(updatedUrls);
				await saveGameUrls(updatedUrls);
				setNewGameUrl('');
				Alert.alert('Success', 'New game URL added successfully!');
			} catch (error) {
				console.error('Error adding game URL:', error);
				Alert.alert(
					'Error',
					'Invalid URL or unable to fetch game data. Please check the URL and try again.',
				);
			} finally {
				setIsSubmitting(false);
			}
		}
	};

	const handleRemoveGameUrl = async (urlToRemove) => {
		const updatedUrls = gameUrls.filter((url) => url !== urlToRemove);
		setGameUrls(updatedUrls);
		await saveGameUrls(updatedUrls);
	};

	const handleGamePress = (game) => {
		setExpandedGame(game);
		overlayOpacity.value = withTiming(1, {
			duration: 300,
			easing: Easing.out(Easing.exp),
		});
		modalScale.value = withTiming(1, {
			duration: 300,
			easing: Easing.out(Easing.back(1.5)),
		});
	};

	const handleCloseExpanded = () => {
		overlayOpacity.value = withTiming(0, {
			duration: 300,
			easing: Easing.in(Easing.exp),
		});
		modalScale.value = withTiming(
			0.8,
			{ duration: 300, easing: Easing.in(Easing.back(1.5)) },
			() => {
				runOnJS(setExpandedGame)(null);
			},
		);
	};

	const handlePlayGame = (game) => {
		if (game.platform === 'coolmathgames') {
			router.navigate(`/(media)/(gamesproviders)/coolmathgames/${game.id}`);
		} else if (game.platform === 'web') {
			router.navigate(`/(media)/(gamesproviders)/web/${game.id}`);
		}
	};

	const overlayStyle = useAnimatedStyle(() => ({
		opacity: overlayOpacity.value,
	}));

	const modalStyle = useAnimatedStyle(() => ({
		transform: [{ scale: modalScale.value }],
	}));

	const filteredGames = games
		.filter(
			(game) => selectedCategory === 'All' || game.genre === selectedCategory,
		)
		.filter((game) =>
			game.title.toLowerCase().includes(searchQuery.toLowerCase()),
		);

	return (
		<View style={styles.container}>
			<ScrollView
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}>
				<YStack gap="$4">
					<Spacer />
					<XStack justifyContent="space-between" alignItems="center">
						<TouchableOpacity onPress={() => router.navigate('/apps')}>
							<ArrowLeft size={24} color="#333333" />
						</TouchableOpacity>
						<H1 style={[styles.title, { flex: 1, textAlign: 'center' }]}>
							Games
						</H1>
						<XStack gap="$4">
							<TouchableOpacity onPress={() => setIsAddUrlModalOpen(true)}>
								<Plus size={24} color="#333333" />
							</TouchableOpacity>
							{swipeableModeEnabled ? (
								<TouchableOpacity
									onPress={() => toggleSwipeable.toggleSwipeable()}>
									<GalleryHorizontalEnd size={24} color="#333333" />
								</TouchableOpacity>
							) : (
								<></>
							)}
						</XStack>
					</XStack>
					<TextInput
						style={styles.searchInput}
						placeholder="Search games..."
						value={searchQuery}
						onChangeText={setSearchQuery}
					/>
					<ScrollView horizontal showsHorizontalScrollIndicator={false}>
						<XStack
							justifyContent="space-between"
							gap="$4"
							style={styles.categoryContainer}>
							<CategoryButton
								icon={
									<Flame
										size={20}
										color={selectedCategory === 'All' ? 'white' : '#FF4500'}
									/>
								}
								label="Hot"
								isSelected={selectedCategory === 'All'}
								onPress={() => setSelectedCategory('All')}
							/>
							<CategoryButton
								icon={
									<Zap
										size={20}
										color={selectedCategory === 'Action' ? 'white' : '#FFD700'}
									/>
								}
								label="Action"
								isSelected={selectedCategory === 'Action'}
								onPress={() => setSelectedCategory('Action')}
							/>
							<CategoryButton
								icon={
									<Award
										size={20}
										color={
											selectedCategory === 'Adventure' ? 'white' : '#4169E1'
										}
									/>
								}
								label="Adventure"
								isSelected={selectedCategory === 'Adventure'}
								onPress={() => setSelectedCategory('Adventure')}
							/>
							<CategoryButton
								icon={
									<Settings
										size={20}
										color={
											selectedCategory === 'Simulation' ? 'white' : '#32CD32'
										}
									/>
								}
								label="Simulation"
								isSelected={selectedCategory === 'Simulation'}
								onPress={() => setSelectedCategory('Simulation')}
							/>
						</XStack>
					</ScrollView>
					<H3 style={styles.sectionTitle}>Featured Game</H3>
					{featuredGame && (
						<FeaturedGameCard game={featuredGame} onPress={handleGamePress} />
					)}
					<H3 style={styles.sectionTitle}>All Games</H3>
					<FlatList
						data={filteredGames}
						renderItem={({ item }) => (
							<NonSwipableGameCard game={item} onPress={handleGamePress} />
						)}
						keyExtractor={(item) => item.id.toString()}
						numColumns={3}
						scrollEnabled={false}
					/>
				</YStack>
			</ScrollView>
			<Sheet
				forceRemoveScrollEnabled={isAddUrlModalOpen}
				snapPointsMode={'percent'}
				modal={true}
				open={isAddUrlModalOpen}
				onOpenChange={setIsAddUrlModalOpen}
				snapPoints={Platform.OS === 'web' ? [80] : [40]}
				dismissOnSnapToBottom
				position={0}
				animation="medium">
				<Sheet.Overlay
					animation="lazy"
					enterStyle={{ opacity: 0 }}
					exitStyle={{ opacity: 0 }}
				/>
				<Sheet.Frame padding="$4" space>
					<YStack space>
						<XStack justifyContent="space-between" alignItems="center">
							<H3>Manage Sources</H3>
							<TouchableOpacity onPress={() => setIsAddUrlModalOpen(false)}>
								<X size={24} color="#333333" />
							</TouchableOpacity>
						</XStack>
						<Paragraph theme="alt2">Current sources:</Paragraph>
						<ScrollView style={{ maxHeight: 200 }}>
							{gameUrls.map((url, index) => (
								<ListItem key={index} pressTheme>
									<ListItem.Text>{url}</ListItem.Text>
									<TouchableOpacity onPress={() => handleRemoveGameUrl(url)}>
										<Trash2 size={20} color="red" />
									</TouchableOpacity>
								</ListItem>
							))}
						</ScrollView>
						<Paragraph theme="alt2">Add a new source URL:</Paragraph>
						<Input
							size="$4"
							borderWidth={2}
							placeholder="https://example.com/games.json"
							value={newGameUrl}
							onChangeText={setNewGameUrl}
						/>
						<XStack justifyContent="flex-end" space="$3">
							<Button theme="alt2" onPress={() => setIsAddUrlModalOpen(false)}>
								Close
							</Button>
							<Button
								theme="active"
								themeInverse
								onPress={handleAddGameUrl}
								disabled={isSubmitting}>
								{isSubmitting ? 'Adding...' : 'Add'}
							</Button>
						</XStack>
					</YStack>
				</Sheet.Frame>
			</Sheet>

			{expandedGame && (
				<Animated.View style={[styles.expandedOverlay, overlayStyle]}>
					<Animated.View style={[styles.expandedContent, modalStyle]}>
						<ScrollView>
							<Image
								source={{ uri: expandedGame.image }}
								style={styles.expandedImage}
							/>
							<YStack gap="$4" padding="$4">
								<H3>{expandedGame.title}</H3>
								<Paragraph>{expandedGame.description}</Paragraph>
								<XStack gap="$4">
									<XStack alignItems="center" gap="$2">
										<Star size={16} color="#FFD700" />
										<Paragraph>{expandedGame.rating}</Paragraph>
									</XStack>
									{expandedGame.nsfw === 'true' && (
										<XStack alignItems="center" gap="$2">
											<AlertOctagon size={16} color="#c41700" />
											<Paragraph>18+</Paragraph>
										</XStack>
									)}
								</XStack>
								<XStack gap="$4">
									<Button
										onPress={() => handlePlayGame(expandedGame)}
										style={styles.playButton}>
										Play Now
									</Button>
									<Button onPress={handleCloseExpanded} variant="outlined">
										Close
									</Button>
								</XStack>
							</YStack>
						</ScrollView>
					</Animated.View>
				</Animated.View>
			)}
		</View>
	);
};

const GameLibraries = () => {
	const [swipeable, setSwipeable] = useState(false);

	const toggleSwipeable = () => {
		setSwipeable((prev) => !prev);
	};

	return (
		<>
			{swipeable ? (
				<SwipeableGamesLibrary toggleSwipeable={toggleSwipeable} />
			) : (
				<GameLibrary toggleSwipeable={toggleSwipeable} />
			)}
		</>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#FAFAFA',
		paddingHorizontal: 16,
	},
	scrollContent: {
		paddingBottom: 16,
	},
	title: {
		color: '#333333',
		fontSize: 28,
		fontWeight: '700',
	},
	sectionTitle: {
		color: '#333333',
		marginVertical: 10,
		fontSize: 22,
		fontWeight: '600',
	},
	categoryContainer: {
		marginVertical: 10,
	},
	categoryButton: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 20,
		paddingVertical: 8,
		borderRadius: 20,
		backgroundColor: '#EAEAEA',
	},
	categoryButtonSelected: {
		backgroundColor: '#4CAF50',
	},
	gameCard: {
		width: SCREEN_WIDTH * 0.28,
		backgroundColor: '#FFFFFF',
		borderRadius: 10,
		marginRight: 10,
		marginBottom: 10,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 6,
		elevation: 4,
	},
	gameCardImage: {
		width: '100%',
		height: 120,
		borderTopLeftRadius: 10,
		borderTopRightRadius: 10,
		resizeMode: 'cover',
	},
	gameCardContent: {
		padding: 8,
	},
	gameTitle: {
		color: '#333333',
		fontWeight: '500',
	},
	gameRating: {
		color: '#666666',
	},
	featuredGameCard: {
		width: '100%',
		height: 250,
		borderRadius: 15,
		overflow: 'hidden',
		marginBottom: 20,
	},
	featuredGameImage: {
		width: '100%',
		height: '100%',
		resizeMode: 'cover',
	},
	featuredGameOverlay: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		justifyContent: 'flex-end',
	},
	featuredGameContent: {
		padding: 20,
	},
	featuredGameTitle: {
		color: '#FFFFFF',
		fontSize: 24,
		fontWeight: '700',
		marginBottom: 8,
	},
	featuredGameDescription: {
		color: '#FFFFFF',
		fontSize: 14,
		marginBottom: 12,
	},
	featuredGameRating: {
		color: '#FFFFFF',
		fontSize: 14,
	},
	featuredGamePopular: {
		color: '#FFFFFF',
		fontSize: 14,
	},
	featuredGameButton: {
		backgroundColor: '#4CAF50',
		paddingHorizontal: 20,
		paddingVertical: 10,
		borderRadius: 25,
		marginTop: 15,
	},
	expandedOverlay: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: 'rgba(0, 0, 0, 0.6)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	expandedContent: {
		backgroundColor: '#FFFFFF',
		borderRadius: 20,
		width: '90%',
		maxHeight: '80%',
		overflow: 'hidden',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.2,
		shadowRadius: 8,
		elevation: 8,
	},
	expandedImage: {
		width: '100%',
		height: 200,
		resizeMode: 'cover',
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20,
	},
	playButton: {
		backgroundColor: '#4CAF50',
		borderRadius: 20,
	},
	urlInput: {
		borderWidth: 1,
		borderColor: '#CCCCCC',
		borderRadius: 8,
		padding: 10,
		marginVertical: 10,
	},
	card: {
		width: SCREEN_WIDTH * 0.9,
		height: SCREEN_HEIGHT * 0.6,
		borderRadius: 20,
		backgroundColor: '#FFFFFF',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 6,
		elevation: 4,
		position: 'absolute',
	},
	cardImage: {
		width: '100%',
		height: '70%',
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20,
		resizeMode: 'cover',
	},
	cardContent: {
		padding: 20,
	},
	cardTitle: {
		fontSize: 24,
		fontWeight: '700',
		marginBottom: 8,
	},
	cardGenre: {
		fontSize: 16,
		color: '#666666',
		marginBottom: 12,
	},
	searchModalContainer: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
	},
	searchInput: {
		flex: 1,
		height: 40,
		backgroundColor: '#F0F0F0',
		borderRadius: 20,
		paddingHorizontal: 15,
		fontSize: 16,
	},
	cardContainer: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
	},
});

export default GameLibraries;
