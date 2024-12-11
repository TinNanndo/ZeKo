import { View, Text } from 'react-native';
import { Link, Stack } from 'expo-router';

import '../assets/global.css';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className='flex-1 bg-[#2E4834] justify-center items-center'>
        <View className='bg-[#1E3123] p-5 rounded-2xl shadow'>
          <Text className='text-white text-2xl mb-5'>
            Ooops! Not Found
          </Text>
          <Link href="/" className='max-w-fit text-white text-center bg-[#2E4834] rounded-2xl p-5'>
            <Text>Return</Text>
          </Link>
        </View>
      </View>
    </>
  );
}