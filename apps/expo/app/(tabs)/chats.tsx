import React from 'react';
import { View, StyleSheet } from 'react-native';
import { H1, Paragraph, Spacer, YStack } from 'tamagui';

export default function Chats() {
	return (
		<View style={styles.container}>
			<Spacer />
			<YStack alignItems="center" gap="$0">
				<Spacer />
				<H1>Chats</H1>
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
