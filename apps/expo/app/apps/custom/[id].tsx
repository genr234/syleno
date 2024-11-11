import React, { useState, useEffect } from 'react';
import { useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RenderMdx } from 'rn-mdx';
import {
	Button,
	H1,
	H2,
	H3,
	H4,
	H5,
	Paragraph,
	XStack,
	YStack,
	Input,
	ScrollView,
	Spacer,
	Dialog,
	Sheet,
	ListItem,
	Label,
	Adapt,
	Separator,
	Spinner,
	Text,
} from 'tamagui';

const STORAGE_KEY = 'app_list';

const CustomApp = () => {
	const params = useLocalSearchParams();
	const [mdxContent, setMdxContent] = useState('');
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		const fetchMdxContent = async () => {
			setIsLoading(true);
			setError(null);
			try {
				if (!params.id) {
					throw new Error('No app ID provided');
				}

				// Fetch the app list from AsyncStorage
				const storedApps = await AsyncStorage.getItem(STORAGE_KEY);
				if (!storedApps) {
					throw new Error('No apps found in storage');
				}

				const apps = JSON.parse(storedApps);
				const app = apps.find((app) => app.id === params.id);

				if (!app) {
					throw new Error('App not found');
				}

				if (app.action !== 'native' || !app.url) {
					throw new Error('Invalid app type or missing URL');
				}

				// Fetch the MDX content using the app's URL
				const response = await fetch(app.url);
				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}
				const content = await response.text();
				setMdxContent(content);
			} catch (e) {
				setError(e.message);
			} finally {
				setIsLoading(false);
			}
		};

		fetchMdxContent();
	}, [params.id]);

	const customComponents = {
		H1,
		H2,
		H3,
		H4,
		H5,
		Paragraph,
		XStack,
		YStack,
		Button,
		Input,
		ScrollView,
		Spacer,
		Dialog,
		Sheet,
		ListItem,
		Label,
		Separator,
	};

	if (isLoading) {
		return (
			<YStack f={1} ai="center" jc="center">
				<Spinner size="large" />
			</YStack>
		);
	}

	if (error) {
		return (
			<YStack f={1} ai="center" jc="center" p="$4">
				<Text color="$red10" textAlign="center">
					Error loading content: {error}
				</Text>
			</YStack>
		);
	}

	return (
		<ScrollView>
			<RenderMdx components={customComponents}>{mdxContent}</RenderMdx>
		</ScrollView>
	);
};

export default CustomApp;
