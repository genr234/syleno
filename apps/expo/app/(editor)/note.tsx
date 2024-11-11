import { ArrowLeft, Plus, Save } from '@tamagui/lucide-icons';
import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import {
	Button,
	H1,
	H2,
	H3,
	Input,
	Paragraph,
	Spacer,
	TextArea,
	YStack,
} from 'tamagui';
import { router } from 'expo-router';

export default function Games() {
	const [title, setTitle] = React.useState('');
	const [content, setContent] = React.useState('');

	return (
		<View style={styles.container}>
			<Button
				icon={<ArrowLeft />}
				onPress={() => router.navigate('/notes')}
				style={{ position: 'absolute', top: 40, left: 10, zIndex: 1 }}
			/>
			<H1>{}</H1>
			<YStack alignItems="center" gap={'$4'}>
				<Spacer />
				<H3>Title</H3>
				<Input width="100%" value={title} onChangeText={setTitle} />
				<H3>Content</H3>
				<TextArea
					width="100%"
					rows={15}
					value={content}
					onChangeText={setContent}
				/>
				<Button themeInverse onPress={() => {}} icon={Save} width="100%">
					Save
				</Button>
			</YStack>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 16,
	},
	fullScreen: {
		flex: 1,
	},
});
