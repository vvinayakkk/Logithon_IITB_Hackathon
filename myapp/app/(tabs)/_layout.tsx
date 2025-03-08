import { Tabs } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

const DB_STATUS_KEY = '@db_status';

const CustomHeader = () => (
  <View style={styles.header}>
    <Text style={styles.headerText}>UPS Regulations</Text>
  </View>
);

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [isLoading, setIsLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState({ exists: false, initialized: false });
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkDatabase = async () => {
      try {
        // First check if we have stored status
        const storedStatus = await AsyncStorage.getItem(DB_STATUS_KEY);
        if (storedStatus) {
          const parsedStatus = JSON.parse(storedStatus);
          setDbStatus(parsedStatus);
          setIsLoading(false);
          return;
        }

        // Run both fetch calls simultaneously
        const [checkResponse, initResponse] = await Promise.all([
          fetch('http://192.168.112.55:5000/api/check-database'),
          fetch('http://192.168.112.55:5000/api/process-pdf', { method: 'POST' })
        ]);

        const checkData = await checkResponse.json();
        const initData = await initResponse.json();

        if (checkData.exists && initData.success) {
          const newStatus = { exists: true, initialized: true };
          setDbStatus(newStatus);
          await AsyncStorage.setItem(DB_STATUS_KEY, JSON.stringify(newStatus));
        } else {
          setError('Failed to initialize database');
        }
      } catch (err) {
        setError(`Error with database operations: ${err.message}`);
      }
      setIsLoading(false);
    };

    checkDatabase();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
        <Text style={styles.loadingText}>Loading regulations database...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        header: () => <CustomHeader />,
      }}>
      <Tabs.Screen
        name="RegulationsSearchPageNative"
        options={{
          title: 'Search',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="magnifyingglass" color={color} />,
        }}
      />
      <Tabs.Screen
        name="Chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="message.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="Country"
        options={{
          title: 'Country',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="globe" color={color} />,
        }}
      />
      <Tabs.Screen
        name="Items"
        options={{
          title: 'Items',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="shippingbox.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#1E40AF',
    padding: 16,
    paddingTop: 48, // Extra padding for status bar
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#333',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
  },
});