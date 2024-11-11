import React from 'react';
import { View, StyleSheet } from 'react-native';
import { H1, Paragraph, Separator, Spacer, YStack } from 'tamagui';

export default function Home() {
	const notifications = 0;

	return (
		<View style={styles.container}>
			<Spacer />
			<YStack alignItems="center" gap="$0">
				<Spacer />
				<H1>Home</H1>
				<Paragraph fontWeight={200}>
					You have {notifications} notifications.
				</Paragraph>
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
