import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState, useEffect, useRef } from 'react';
import {
	View,
	StyleSheet,
	Platform,
	Dimensions,
	TouchableOpacity,
	Alert,
	Animated,
	PanResponder,
} from 'react-native';
import {
	H1,
	Paragraph,
	YStack,
	Button,
	Text,
	Spacer,
	Dialog,
	Unspaced,
} from 'tamagui';
import { ChevronLeft, X } from '@tamagui/lucide-icons';
import { WebView } from 'react-native-webview';
import * as ScreenOrientation from 'expo-screen-orientation';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LONG_PRESS_DURATION = 500; // Duration in ms to trigger long press
const DRAG_THRESHOLD = 5; // Minimum distance to consider as drag

const styles = StyleSheet.create({
	container: {
		flex: 1,
		width: '100%',
		height: '100%',
	},
	iframe: {
		width: '100%',
		height: '100%',
		border: 'none',
	},
	orientationMessage: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: 'rgba(0,0,0,0.7)',
		padding: 20,
		alignItems: 'center',
		justifyContent: 'center',
	},
	backButton: {
		position: 'absolute',
		backgroundColor: 'rgba(0,0,0,0.5)',
		borderRadius: 25,
		padding: 12,
		zIndex: 10,
		elevation: 5,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
	},
	backButtonPressed: {
		backgroundColor: 'rgba(0,0,0,0.7)',
		transform: [{ scale: 0.95 }],
	},
});

const getOrientation = () => {
	const { width, height } = Dimensions.get('window');
	return width > height ? 'landscape' : 'portrait';
};

export default function CoolMathGame() {
	const params = useLocalSearchParams();
	const [orientation, setOrientation] = useState(getOrientation());
	const [id, setId] = useState();
	const [backDialogOpen, setBackDialogOpen] = useState(false);
	const [isButtonPressed, setIsButtonPressed] = useState(false);
	const router = useRouter();

	// Animation and gesture state
	const pan = useRef(new Animated.ValueXY()).current;
	const pressStartTime = useRef(0);
	const pressStartLocation = useRef({ x: 0, y: 0 });
	const isDragging = useRef(false);

	const panResponder = useRef(
		PanResponder.create({
			onStartShouldSetPanResponder: () => true,
			onMoveShouldSetPanResponder: (_, gestureState) => {
				const distance = Math.sqrt(
					Math.pow(gestureState.dx, 2) + Math.pow(gestureState.dy, 2),
				);
				return distance > DRAG_THRESHOLD;
			},
			onPanResponderGrant: (event) => {
				pressStartTime.current = Date.now();
				pressStartLocation.current = {
					x: event.nativeEvent.locationX,
					y: event.nativeEvent.locationY,
				};
				pan.setOffset({
					x: pan.x._value,
					y: pan.y._value,
				});
				setIsButtonPressed(true);
			},
			onPanResponderMove: (_, gestureState) => {
				isDragging.current = true;
				Animated.event([null, { dx: pan.x, dy: pan.y }], {
					useNativeDriver: false,
				})(_, gestureState);
			},
			onPanResponderRelease: (_, gestureState) => {
				pan.flattenOffset();
				setIsButtonPressed(false);

				const pressDuration = Date.now() - pressStartTime.current;
				const distance = Math.sqrt(
					Math.pow(gestureState.dx, 2) + Math.pow(gestureState.dy, 2),
				);

				// Only trigger dialog if it was a tap (not a drag)
				if (distance < DRAG_THRESHOLD && pressDuration < LONG_PRESS_DURATION) {
					setBackDialogOpen(true);
				}

				// Reset dragging state after a short delay
				setTimeout(() => {
					isDragging.current = false;
				}, 100);
			},
			onPanResponderTerminate: () => {
				setIsButtonPressed(false);
				isDragging.current = false;
			},
		}),
	).current;

	useEffect(() => {
		const updateOrientation = () => {
			setOrientation(getOrientation());
		};

		Dimensions.addEventListener('change', updateOrientation);
		fetchGameUrl();
	}, []);

	const handleBack = () => {
		router.navigate('/apps/games');
	};

	const rotateScreen = async () => {
		if (Platform.OS !== 'web') {
			try {
				if (orientation === 'portrait') {
					await ScreenOrientation.lockAsync(
						ScreenOrientation.OrientationLock.LANDSCAPE,
					);
				} else {
					await ScreenOrientation.lockAsync(
						ScreenOrientation.OrientationLock.PORTRAIT,
					);
				}
			} catch (error) {
				console.error('Failed to rotate screen:', error);
				alert(
					'Unable to rotate screen automatically. Please rotate your device manually.',
				);
			}
		} else {
			alert(
				'Screen rotation is not supported in web browsers. Please rotate your device manually.',
			);
		}
	};

	const fetchGameUrl = async () => {
		try {
			const storedUrls = await AsyncStorage.getItem('gameUrls');
			if (storedUrls === null) {
				throw new Error('No game sources found');
			}

			const gameUrls = JSON.parse(storedUrls);
			let gameData = null;

			for (const sourceUrl of gameUrls) {
				try {
					const response = await fetch(sourceUrl);
					if (!response.ok) {
						throw new Error(`HTTP error! status: ${response.status}`);
					}
					const data = await response.json();
					gameData = data.find((game) => game.id === parseInt(params.id));
					if (gameData) break;
				} catch (error) {
					console.error(`Error fetching from ${sourceUrl}:`, error);
				}
			}

			if (gameData) {
				setId(gameData.id);
			} else {
				throw new Error('Game not found in any source');
			}
		} catch (error) {
			console.error('Error fetching game URL:', error);
			Alert.alert('Error', 'Failed to load game data. Please try again later.');
			router.navigate('/apps/games');
		}
	};

	const renderContent = () => {
		if (orientation === 'portrait') {
			return (
				<YStack style={styles.orientationMessage} alignItems="center">
					<Spacer size="$6" />
					<H1 color="white">Please rotate your device</H1>
					<Spacer />
					<Paragraph color="white">
						This content is best viewed in landscape mode.
					</Paragraph>
					<Spacer />
					<Button onPress={rotateScreen}>Rotate Screen</Button>
				</YStack>
			);
		}

		if (Platform.OS === 'web') {
			return (
				<iframe
					src={`https://www.coolmathgames.com/sites/default/files/public_games/${id}/`}
					title="Game iframe"
					allowFullScreen
					style={styles.iframe}
				/>
			);
		}

		return (
			<WebView
				source={{
					uri: `https://www.coolmathgames.com/sites/default/files/public_games/${id}/`,
				}}
				style={styles.iframe}
				cacheMode="LOAD_CACHE_ELSE_NETWORK"
				cacheEnabled
				allowsFullscreenVideo
				javaScriptEnabled
				domStorageEnabled
			/>
		);
	};
	return (
		<View style={styles.container}>
			<Dialog modal open={backDialogOpen}>
				<Dialog.Portal>
					<Dialog.Content
						bordered
						elevate
						key="content"
						animateOnly={['transform', 'opacity']}
						animation={[
							'quicker',
							{
								opacity: {
									overshootClamping: true,
								},
							},
						]}
						enterStyle={{ x: 0, y: -20, opacity: 0, scale: 0.9 }}
						exitStyle={{ x: 0, y: 10, opacity: 0, scale: 0.95 }}
						gap="$4">
						<Dialog.Title>Exit Game</Dialog.Title>
						<Dialog.Description>
							Are you sure you want to exit?
						</Dialog.Description>
						<Button
							onPress={() => {
								handleBack();
								setBackDialogOpen(false);
							}}>
							Exit
						</Button>
						<Dialog.Close displayWhenAdapted asChild>
							<Button
								theme="active"
								themeInverse
								aria-label="Close"
								onPress={() => setBackDialogOpen(false)}>
								Cancel
							</Button>
						</Dialog.Close>
						<Unspaced>
							<Dialog.Close asChild>
								<Button
									position="absolute"
									top="$3"
									right="$3"
									size="$2"
									circular
									icon={X}
									onPress={() => setBackDialogOpen(false)}
								/>
							</Dialog.Close>
						</Unspaced>
					</Dialog.Content>
				</Dialog.Portal>
			</Dialog>

			<Animated.View
				style={[
					styles.backButton,
					isButtonPressed && styles.backButtonPressed,
					{
						transform: [{ translateX: pan.x }, { translateY: pan.y }],
					},
				]}
				{...panResponder.panHandlers}>
				<ChevronLeft size={24} color="white" />
			</Animated.View>
			{renderContent()}
		</View>
	);
}
