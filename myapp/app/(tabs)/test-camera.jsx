import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, SafeAreaView } from 'react-native';
import CameraComponent from '../../components/CameraComponent';
import { Feather } from '@expo/vector-icons';

export default function TestCamera() {
  const [showCamera, setShowCamera] = useState(false);
  const [photoUri, setPhotoUri] = useState(null);

  const handlePhotoCapture = (photo) => {
    console.log('Photo captured:', photo);
    setPhotoUri(photo.uri);
    setShowCamera(false);
  };

  if (showCamera) {
    return (
      <View className="flex-1">
        <CameraComponent onPhotoCapture={handlePhotoCapture} />
        <TouchableOpacity
          className="absolute top-12 right-4 bg-black/50 p-2 rounded-full"
          onPress={() => setShowCamera(false)}
        >
          <Feather name="x" color="white" size={24} />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      <View className="p-4">
        <Text className="text-2xl font-bold text-white text-center mb-6">
          Camera Test Page
        </Text>

        {photoUri ? (
          <View className="items-center">
            <Image
              source={{ uri: photoUri }}
              className="w-72 h-72 rounded-lg mb-4"
            />
            <TouchableOpacity
              onPress={() => setPhotoUri(null)}
              className="bg-red-500 px-4 py-2 rounded-lg"
            >
              <Text className="text-white font-medium">Remove Photo</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            onPress={() => setShowCamera(true)}
            className="bg-blue-500 p-4 rounded-lg items-center"
          >
            <Feather name="camera" size={32} color="white" />
            <Text className="text-white font-medium mt-2">
              Open Camera
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}
