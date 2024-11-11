import { Link, Stack } from 'expo-router';
import { View } from 'react-native';
import { H1, Paragraph } from 'tamagui';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View>
        <H1>This screen doesn't exist.</H1>
        <Link href="/">
          <Paragraph>Go to home screen!</Paragraph>
        </Link>
      </View>
    </>
  );
}
