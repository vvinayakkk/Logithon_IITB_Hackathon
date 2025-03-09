import React from 'react';
import { Modal, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

const CompliancePopup = ({ details, onClose }) => {
  if (!details) return null;

  return (
    <Modal visible={true} transparent={true} animationType="slide">
      <View className="flex-1 bg-black bg-opacity-70 justify-center items-center">
        <View className="bg-gray-800 rounded-lg w-11/12 max-h-[90%] p-4">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-medium text-blue-300">Compliance Report</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="x" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          <ScrollView>
            <Text className="text-white">{JSON.stringify(details, null, 2)}</Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default CompliancePopup;