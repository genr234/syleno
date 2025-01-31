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
	const [orientation, setOrientation] = useState(getOrientation());
	const [dimensions, setDimensions] = useState(Dimensions.get('window'));
	const [backDialogOpen, setBackDialogOpen] = useState(false);
	const [isButtonPressed, setIsButtonPressed] = useState(false);
	const router = useRouter();
	const webViewRef = useRef(null);
	const { core, url } = useLocalSearchParams();

	// Animation and gesture state
	const pan = useRef(new Animated.ValueXY()).current;
	const pressStartTime = useRef(0);
	const pressStartLocation = useRef({ x: 0, y: 0 });
	const isDragging = useRef(false);

	const panResponder = useRef(
		PanResponder.create({
			onStartShouldSetPanResponder: () => true,
			onMoveShouldSetPanResponder: (_, gestureState) => {
				const distance = Math.sqrt(gestureState.dx ** 2 + gestureState.dy ** 2);
				return distance > DRAG_THRESHOLD;
			},
			onPanResponderGrant: (event) => {
				pressStartTime.current = Date.now();
				pressStartLocation.current = {
					x: event.nativeEvent.locationX,
					y: event.nativeEvent.locationY,
				};
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
				const distance = Math.sqrt(gestureState.dx ** 2 + gestureState.dy ** 2);

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

	const generateHtmlTemplate = (url: string, core: string) => `<!DOCTYPE html>
<html>

<head>
    <title>Syleno EmuJS Provider</title>
    <link rel=icon href=docs/favicon.ico sizes="16x16 32x32 48x48 64x64" type=image/vnd.microsoft.icon>
    <meta name=viewport content="width = device-width, initial-scale = 1">
    <style>
        body,
        html {
            height: 100%;
            background-color: black;
            color: white;
        }

        body {
            margin: 0;
            overflow: hidden;
        }

        body,
        #box,
        #top {
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
        }

        #box {
            color: #aaa;
            height: 20em;
            width: 30em;
            max-width: 80%;
            max-height: 80%;
            background-color: #333;
            border-radius: 0.4em;
            border: 2px solid #555;
            position: relative;
            flex-direction: column;
            transition-duration: 0.2s;
            overflow: hidden;
            font-family: monospace;
            font-weight: bold;
            font-size: 20px;
            margin: 5px;
        }

        #box:hover,
        #box[drag] {
            border-color: #38f;
            color: #ddd
        }

        #display {
            width: 100%;
            height: 100%
        }

        select,
        button {
            padding: 0.6em 0.4em;
            margin: 0.5em;
            width: 15em;
            max-width: 100%;
            font-family: monospace;
            font-weight: bold;
            font-size: 16px;
            background-color: #444;
            color: #aaa;
            border-radius: 0.4em;
            border: 1px solid #555;
            cursor: pointer;
            transition-duration: 0.2s
        }

        select:hover,
        button:hover {
            background-color: #666;
            color: #ddd
        }


        #top {
            margin: 5px;
        }
    </style>
</head>

<body>
    <script>
        let enableDebug = true;
        let enableThreads = false;

            const div = document.createElement("div")
            const sub = document.createElement("div")
            const script = document.createElement("script")

            sub.id = "game"
            div.id = "display"

            div.appendChild(sub)
            document.body.appendChild(div)

            window.EJS_player = "#game";
            window.EJS_gameName = "";
            window.EJS_biosUrl = "";
            window.EJS_gameUrl = "${url}";
            window.EJS_core = "${core}";
            window.EJS_pathtodata = "https://cdn.emulatorjs.org/stable/data/";
            window.EJS_startOnLoaded = true;
            window.EJS_DEBUG_XX = enableDebug;
            window.EJS_disableDatabases = true;
            window.EJS_threads = enableThreads;
			EJS_cacheLimit = 2147483648;
        EJS_Buttons = {
            playPause: false,
            restart: false,
            mute: false,
            settings: false,
            fullscreen: true,
            saveState: false,
            loadState: false,
            screenRecord: false,
            gamepad: false,
            cheat: false,
            volume: false,
            saveSavFiles: false,
            loadSavFiles: false,
            quickSave: true,
            quickLoad: true,
            screenshot: false,
            cacheManager: false,
            exitEmulation: false
        };

            script.src = "https://cdn.emulatorjs.org/stable/data/loader.js";
            document.body.appendChild(script);

    </script>
</body>

</html>`;

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
					srcDoc={generateHtmlTemplate(url, core)}
					title="Game iframe"
					allowFullScreen
					style={styles.iframe}
				/>
			);
		}

		return (
			<WebView
				ref={webViewRef}
				source={{
					html: generateHtmlTemplate(url, core),
				}}
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
