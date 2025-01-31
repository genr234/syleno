import { Construction } from '@tamagui/lucide-icons';
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
				<Spacer paddingBottom="$20" />
				<YStack alignItems="center" justifyContent="center" gap="$2">
					<Construction size={64} fontWeight={600} color={'$gray10Light'} />
					<Paragraph fontWeight={600} color={'$gray10Light'}>
						Work in progress
					</Paragraph>
				</YStack>
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
