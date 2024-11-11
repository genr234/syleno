import { Plus } from '@tamagui/lucide-icons';
import { router } from 'expo-router';
import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Button, H1, Paragraph, Spacer, YStack } from 'tamagui';

export default function Games() {
	return (
		<View style={styles.container}>
			<Spacer />
			<YStack alignItems="center" gap="$0">
				<Spacer />
				<H1>Notes</H1>
				<Spacer />
				<Button
					width={'95%'}
					height={'$7'}
					fontSize={'$5'}
					themeInverse
					icon={Plus}
					onPress={() => router.navigate('/(editor)/note')}>
					Create New Note
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
});
