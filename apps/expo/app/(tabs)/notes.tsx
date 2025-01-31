import { Construction, Plus } from '@tamagui/lucide-icons';
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
