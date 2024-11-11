import React, { useEffect } from 'react';
import {
	View,
	TouchableOpacity,
	StyleSheet,
	Dimensions,
	useColorScheme,
	Platform,
} from 'react-native';
import { Tabs } from 'expo-router';
import Animated, {
	useSharedValue,
	useAnimatedStyle,
	withSpring,
	interpolateColor,
} from 'react-native-reanimated';
import { Colors } from '@/constants/styles/Colors';
import {
	Home,
	MessagesSquare,
	NotebookPen,
	CircleUser,
	Tv2,
	Gamepad,
	Gamepad2,
	LayoutGrid,
} from '@tamagui/lucide-icons';

const { width } = Dimensions.get('window');
const TAB_WIDTH = width / 5;
const IS_IOS = Platform.OS === 'ios';
const TAB_BAR_HEIGHT = IS_IOS ? 80 : 60; // Increased height for iOS
const BOTTOM_INSET = IS_IOS ? 20 : 0; // Additional padding for iOS gesture bar

const AnimatedTouchableOpacity =
	Animated.createAnimatedComponent(TouchableOpacity);

const TabBar = ({ state, descriptors, navigation }) => {
	const colorScheme = useColorScheme();
	const isDarkMode = colorScheme === 'dark';

	const activeColor = Colors[colorScheme].tint;
	const inactiveColor = isDarkMode ? '#666' : '#999';
	const backgroundColor = isDarkMode ? '#1c1c1e' : 'white';
	const borderColor = isDarkMode ? '#2c2c2e' : '#e0e0e0';

	const translateX = useSharedValue(0);

	useEffect(() => {
		translateX.value = withSpring(state.index * TAB_WIDTH, { damping: 15 });
	}, [state.index]);

	const animatedStyles = useAnimatedStyle(() => {
		return {
			transform: [{ translateX: translateX.value }],
		};
	});

	return (
		<View
			style={[
				styles.container,
				{ backgroundColor, borderTopColor: borderColor },
			]}>
			<Animated.View
				style={[
					styles.indicator,
					animatedStyles,
					{ backgroundColor: activeColor },
				]}
			/>
			{state.routes.map((route, index) => {
				const { options } = descriptors[route.key];
				const isFocused = state.index === index;

				const onPress = () => {
					const event = navigation.emit({
						type: 'tabPress',
						target: route.key,
						canPreventDefault: true,
					});

					if (!isFocused && !event.defaultPrevented) {
						navigation.navigate(route.name);
					}
				};

				const scale = useSharedValue(isFocused ? 1 : 0.8);

				useEffect(() => {
					scale.value = withSpring(isFocused ? 1 : 0.8, { damping: 15 });
				}, [isFocused]);

				const animatedIconStyle = useAnimatedStyle(() => {
					const color = interpolateColor(
						scale.value,
						[0.8, 1],
						[inactiveColor, activeColor],
					);

					return {
						transform: [{ scale: scale.value }],
						color,
					};
				});

				const getIcon = (color, focused) => {
					const iconProps = {
						strokeWidth: focused ? 2 : 1.5,
						color: color,
						stroke: color,
					};

					switch (route.name) {
						case 'chats':
							return <MessagesSquare {...iconProps} />;
						case 'apps':
							return <LayoutGrid {...iconProps} />;
						case 'index':
							return <Home {...iconProps} />;
						case 'notes':
							return <NotebookPen {...iconProps} />;
						case 'account':
							return <CircleUser {...iconProps} />;
						default:
							return null;
					}
				};

				return (
					<AnimatedTouchableOpacity
						key={index}
						onPress={onPress}
						style={[styles.tabItem, animatedIconStyle]}>
						{getIcon(isFocused ? activeColor : inactiveColor, isFocused)}
					</AnimatedTouchableOpacity>
				);
			})}
		</View>
	);
};

export default function TabLayout() {
	const colorScheme = useColorScheme();

	return (
		<View
			style={{
				flex: 1,
				backgroundColor: colorScheme === 'dark' ? '#000' : '#fff',
			}}>
			<Tabs
				tabBar={(props) => <TabBar {...props} />}
				screenOptions={{
					headerShown: false,
				}}>
				<Tabs.Screen name="chats" />
				<Tabs.Screen name="apps" />
				<Tabs.Screen name="index" />
				<Tabs.Screen name="notes" />
				<Tabs.Screen name="account" />
			</Tabs>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		height: TAB_BAR_HEIGHT,
		borderTopWidth: 1,
		paddingBottom: BOTTOM_INSET,
	},
	tabItem: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingTop: IS_IOS ? 10 : 0,
	},
	indicator: {
		position: 'absolute',
		width: TAB_WIDTH,
		height: 3,
		bottom: BOTTOM_INSET,
	},
});
