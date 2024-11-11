import { SignedIn, SignedOut, useAuth, useUser } from '@clerk/clerk-expo';
import { Gift, LogOut, SmilePlus, Verified } from '@tamagui/lucide-icons';
import { Redirect, useRouter } from 'expo-router';
import React from 'react';
import { View, StyleSheet } from 'react-native';
import {
	Avatar,
	Card,
	H1,
	H2,
	Paragraph,
	Spacer,
	YStack,
	XStack,
	Button,
	AlertDialog,
	Theme,
} from 'tamagui';

export default function Account() {
	const { isSignedIn, signOut, isLoaded } = useAuth();
	const { user } = useUser();
	const router = useRouter();

	const emailAddress = user?.primaryEmailAddress?.emailAddress ?? '';
	const username = user?.username ?? '';
	const imageUrl = user?.imageUrl ?? '';
	const verified = user?.publicMetadata.verified;
	const plus = user?.publicMetadata.plus;

	const onSignOutPress = React.useCallback(() => {
		if (!isLoaded) {
			return;
		}

		signOut()
			.then(() => {
				router.replace('/');
			})
			.catch((err) => {
				console.error(JSON.stringify(err, null, 2));
			});
	}, [isLoaded, signOut, router]);

	if (!isLoaded) {
		return (
			<YStack flex={1} justifyContent="center" alignItems="center">
				<Paragraph>Loading...</Paragraph>
			</YStack>
		);
	}

	if (isSignedIn) {
		return (
			<Theme name="light">
				<View style={styles.container}>
					<YStack space="$4">
						<Spacer />
						<H1 textAlign="center">Account</H1>
						<Card elevate size="$4" bordered>
							<Card.Header padded>
								<XStack space="$3" alignItems="center">
									<Avatar circular size="$6">
										<Avatar.Image src={imageUrl} />
									</Avatar>
									<YStack>
										<XStack alignItems="center" space="$2">
											<H2>{username}</H2>
											{verified && <Verified color="$blue10" />}
											{plus && <SmilePlus color="$yellow10" />}
										</XStack>
										<Paragraph theme="alt2">{emailAddress}</Paragraph>
									</YStack>
								</XStack>
							</Card.Header>
							<Card.Footer padded>
								<XStack space="$2" justifyContent="flex-end">
									<Button theme="active" onPress={() => {}} icon={Gift}>
										Redeem Code
									</Button>
									<AlertDialog native>
										<AlertDialog.Trigger asChild>
											<Button icon={LogOut} themeInverse>
												Log Out
											</Button>
										</AlertDialog.Trigger>

										<AlertDialog.Portal>
											<AlertDialog.Overlay
												key="overlay"
												animation="quick"
												opacity={0.5}
												enterStyle={{ opacity: 0 }}
												exitStyle={{ opacity: 0 }}
											/>
											<AlertDialog.Content
												bordered
												elevate
												key="content"
												animation={[
													'quick',
													{
														opacity: {
															overshootClamping: true,
														},
													},
												]}
												enterStyle={{ x: 0, y: -20, opacity: 0, scale: 0.9 }}
												exitStyle={{ x: 0, y: 10, opacity: 0, scale: 0.95 }}
												x={0}
												scale={1}
												opacity={1}
												y={0}>
												<YStack space>
													<AlertDialog.Title>Log Out</AlertDialog.Title>
													<AlertDialog.Description>
														Are you sure you want to log out?
													</AlertDialog.Description>

													<XStack space="$3" justifyContent="flex-end">
														<AlertDialog.Cancel asChild>
															<Button theme="alt2">Cancel</Button>
														</AlertDialog.Cancel>
														<AlertDialog.Action asChild>
															<Button theme="active" onPress={onSignOutPress}>
																Log Out
															</Button>
														</AlertDialog.Action>
													</XStack>
												</YStack>
											</AlertDialog.Content>
										</AlertDialog.Portal>
									</AlertDialog>
								</XStack>
							</Card.Footer>
						</Card>
					</YStack>
				</View>
			</Theme>
		);
	}
	return <Redirect href="/sign-in" />;
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 16,
	},
});
