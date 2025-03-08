import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import ChatTab from '../../components/Chat';
import CountryTab from '../../components/Country';
import ItemTab from '../../components/Items';

const CombinedTab = () => {
  const [selectedTab, setSelectedTab] = useState('Chat');
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Theme colors
  const theme = {
    bg: isDark ? '#121212' : '#F5F7FA',
    text: isDark ? '#FFFFFF' : '#1A1A1A',
    primary: '#3B82F6',
    subtext: isDark ? '#AAAAAA' : '#6E7179',
    border: isDark ? '#333333' : '#E5E7EB',
  };

  const renderContent = () => {
    switch (selectedTab) {
      case 'Chat':
        return <ChatTab />;
      case 'Country':
        return <CountryTab />;
      case 'Items':
        return <ItemTab />;
      default:
        return <ChatTab />;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.tabButton, selectedTab === 'Chat' && styles.activeTabButton]}
          onPress={() => setSelectedTab('Chat')}
        >
          <Text style={[styles.tabButtonText, selectedTab === 'Chat' && styles.activeTabButtonText]}>
            Chat
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, selectedTab === 'Country' && styles.activeTabButton]}
          onPress={() => setSelectedTab('Country')}
        >
          <Text style={[styles.tabButtonText, selectedTab === 'Country' && styles.activeTabButtonText]}>
            Country
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, selectedTab === 'Items' && styles.activeTabButton]}
          onPress={() => setSelectedTab('Items')}
        >
          <Text style={[styles.tabButtonText, selectedTab === 'Items' && styles.activeTabButtonText]}>
            Items
          </Text>
        </TouchableOpacity>
      </View>
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: '#3B82F6',
  },
  tabButtonText: {
    fontSize: 16,
    color: '#6E7179',
  },
  activeTabButtonText: {
    color: '#3B82F6',
    fontWeight: 'bold',
  },
});

export default CombinedTab;