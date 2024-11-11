import { useRouter } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import React, { useState, useCallback } from 'react';
import {
	Input,
	Button,
	YStack,
	H1,
	Spacer,
	Paragraph,
	XStack,
	Text,
} from 'tamagui';
import { useSignIn } from '@clerk/clerk-expo';
import { ArrowLeft } from '@tamagui/lucide-icons';

export default function SignInPage() {
	const { signIn, setActive, isLoaded } = useSignIn();
	const router = useRouter();

	const [emailAddress, setEmailAddress] = useState('');
	const [pendingVerification, setPendingVerification] = useState(false);
	const [code, setCode] = useState('');
	const [error, setError] = useState('');
	const [isLoading, setIsLoading] = useState(false);

	const onSignInPress = React.useCallback(async () => {
		if (!isLoaded) {
			return;
		}

		try {
			const signInAttempt = await signIn.create({
				strategy: 'email_code',
				identifier: emailAddress,
			});

			setPendingVerification(true);
		} catch (err: any) {
			console.error(JSON.stringify(err, null, 2));
		}
	}, [isLoaded, emailAddress, signIn]);

	const onVerifyPress = React.useCallback(async () => {
		if (!isLoaded) {
			return;
		}

		try {
			const completeSignIn = await signIn.attemptFirstFactor({
				strategy: 'email_code',
				code,
			});

			await setActive({ session: completeSignIn.createdSessionId });
			router.replace('/');
		} catch (err: any) {
			console.error(JSON.stringify(err, null, 2));
		}
	}, [isLoaded, code, signIn, setActive, router]);

	if (!isLoaded) {
		return (
			<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
				<ActivityIndicator size="large" />
			</View>
		);
	}

	return (
		<View style={{ flex: 1 }}>
			<Button
				icon={<ArrowLeft />}
				onPress={() => router.navigate('/')}
				style={{ position: 'absolute', top: 40, left: 10, zIndex: 1 }}
			/>
			<YStack
				space="$4"
				maxWidth={600}
				width="100%"
				padding="$4"
				margin="auto"
				alignItems="center"
				justifyContent="center"
				flex={1}>
				<H1>{pendingVerification ? 'Verify Email' : 'Sign In'}</H1>
				<Spacer size="$4" />
				{!pendingVerification ? (
					<>
						<Input
							width="100%"
							size="$4"
							keyboardType="email-address"
							autoCapitalize="none"
							value={emailAddress}
							placeholder="Email..."
							onChangeText={setEmailAddress}
						/>
						<Button
							width="100%"
							size="$4"
							onPress={onSignInPress}
							disabled={isLoading}
							themeInverse>
							{isLoading ? 'Signing In...' : 'Sign In'}
						</Button>
					</>
				) : (
					<>
						<Text>Please check your email for the verification code.</Text>
						<Input
							width="100%"
							size="$4"
							keyboardType="number-pad"
							value={code}
							placeholder="Verification Code..."
							onChangeText={setCode}
						/>
						<Button
							width="100%"
							size="$4"
							onPress={onVerifyPress}
							disabled={isLoading}
							themeInverse>
							{isLoading ? 'Verifying...' : 'Verify Email'}
						</Button>
					</>
				)}
				{error ? (
					<Paragraph color="$red10" textAlign="center">
						{error}
					</Paragraph>
				) : null}
				<Spacer size="$4" />
				<XStack space="$2" justifyContent="center">
					<Paragraph>New around here?</Paragraph>
					<Paragraph color="$blue10" onPress={() => router.push('/sign-up')}>
						Sign Up
					</Paragraph>
				</XStack>
			</YStack>
		</View>
	);
}
