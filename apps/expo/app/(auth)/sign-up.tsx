import React, { useState, useCallback } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useSignUp } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import {
	Input,
	Paragraph,
	Button,
	YStack,
	H1,
	Spacer,
	XStack,
	Text,
} from 'tamagui';
import { ArrowLeft } from '@tamagui/lucide-icons';

export default function SignUpScreen() {
	const { isLoaded, signUp, setActive } = useSignUp();
	const router = useRouter();

	const [emailAddress, setEmailAddress] = useState('');
	const [username, setUsername] = useState('');
	const [pendingVerification, setPendingVerification] = useState(false);
	const [code, setCode] = useState('');
	const [error, setError] = useState('');
	const [isLoading, setIsLoading] = useState(false);

	const onSignUpPress = useCallback(async () => {
		if (!isLoaded) return;

		setIsLoading(true);
		setError('');

		try {
			await signUp.create({ emailAddress, username });
			await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
			setPendingVerification(true);
		} catch (err) {
			setError(err.message || 'An error occurred during sign up.');
			console.error(JSON.stringify(err, null, 2));
		} finally {
			setIsLoading(false);
		}
	}, [isLoaded, signUp, emailAddress, username]);

	const onVerifyPress = useCallback(async () => {
		if (!isLoaded) return;

		setIsLoading(true);
		setError('');

		try {
			const completeSignUp = await signUp.attemptEmailAddressVerification({
				code,
			});

			if (completeSignUp.status === 'complete') {
				await setActive({ session: completeSignUp.createdSessionId });
				router.replace('/');
			} else {
				setError('Verification failed. Please try again.');
				console.error(JSON.stringify(completeSignUp, null, 2));
			}
		} catch (err) {
			setError(err.message || 'An error occurred during verification.');
			console.error(JSON.stringify(err, null, 2));
		} finally {
			setIsLoading(false);
		}
	}, [isLoaded, signUp, code, setActive, router]);

	if (!isLoaded) {
		return (
			<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
				<ActivityIndicator size="large" />
			</View>
		);
	}

	return (
		<View style={{ flex: 1, justifyContent: 'center' }}>
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
				alignItems="center">
				<H1>{pendingVerification ? 'Verify Email' : 'Sign Up'}</H1>
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
						<Input
							width="100%"
							size="$4"
							autoCapitalize="none"
							value={username}
							placeholder="Username..."
							onChangeText={setUsername}
						/>
						<Button
							width="100%"
							size="$4"
							onPress={onSignUpPress}
							disabled={isLoading}
							themeInverse>
							{isLoading ? 'Signing Up...' : 'Sign Up'}
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
					<Paragraph>Already have an account?</Paragraph>
					<Paragraph color="$blue10" onPress={() => router.push('/sign-in')}>
						Sign In
					</Paragraph>
				</XStack>
			</YStack>
		</View>
	);
}
