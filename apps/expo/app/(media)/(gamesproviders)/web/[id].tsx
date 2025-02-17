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
import { H1, Paragraph, YStack, Button, Text, Spacer, Dialog } from 'tamagui';
import { ChevronLeft, X } from '@tamagui/lucide-icons';
import { WebView } from 'react-native-webview';
import * as ScreenOrientation from 'expo-screen-orientation';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LONG_PRESS_DURATION = 500;
const DRAG_THRESHOLD = 5;

const getOrientation = () => {
	const { width, height } = Dimensions.get('window');
	return width > height ? 'landscape' : 'portrait';
};

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
		top: 40,
		left: 10,
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

export default function WebGame() {
	const params = useLocalSearchParams();
	const [orientation, setOrientation] = useState(getOrientation());
	const [url, setUrl] = useState('');
	const [dimensions, setDimensions] = useState(Dimensions.get('window'));
	const [backDialogOpen, setBackDialogOpen] = useState(false);
	const [isButtonPressed, setIsButtonPressed] = useState(false);
	const router = useRouter();
	const webViewRef = useRef(null);

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

				if (distance < DRAG_THRESHOLD && pressDuration < LONG_PRESS_DURATION) {
					setBackDialogOpen(true);
				}

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
		const updateLayout = () => {
			setOrientation(getOrientation());
			setDimensions(Dimensions.get('window'));
		};

		Dimensions.addEventListener('change', updateLayout);
		fetchGameUrl();
	}, []);

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
				setUrl(gameData.url);
			} else {
				throw new Error('Game not found in any source');
			}
		} catch (error) {
			console.error('Error fetching game URL:', error);
			Alert.alert('Error', 'Failed to load game data. Please try again later.');
			router.navigate('/apps/games');
		}
	};

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
					src={url}
					title="Game iframe"
					allowFullScreen
					style={styles.iframe}
				/>
			);
		}

		return (
			<WebView
				ref={webViewRef}
				source={{ uri: url }}
				style={styles.iframe}
				allowsFullscreenVideo
				javaScriptEnabled
				domStorageEnabled
				scalesPageToFit={true}
				onLoad={() => {
					webViewRef.current.injectJavaScript(`
            const meta = document.createElement('meta');
            meta.setAttribute('name', 'viewport');
            meta.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1');
            document.head.appendChild(meta);
            window.alert = ""; 
            const style = document.createElement('style');
            style.type = 'text/css';
            style.appendChild(document.createTextNode('body {
              -webkit-touch-callout: none;
              -webkit-user-select: none;
              -khtml-user-select: none;
              -moz-user-select: none;
              -ms-user-select: none;
              user-select: none;
            }'));
            document.head.appendChild(style);
          `);
				}}
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
