import React from 'react';
import { View, Text, Button } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const TestTailwind = () => {
  const navigation = useNavigation();

  return (
    <View className="flex-1 justify-center items-center bg-white">
      <Text className="text-2xl font-bold text-blue-500 mb-4 mt-10">Hello, Tailwind CSS!</Text>
      <Text className="text-xl text-white mb-4 mt-10">This is a test page to check if Tailwind CSS is working.</Text>
      <Button
        title="Go Back"
        onPress={() => navigation.goBack()}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      />
    </View>
  );
};

export default TestTailwind;