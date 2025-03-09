import { Tabs } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, KeyboardAvoidingView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';  // Add this import at the top

const DB_STATUS_KEY = '@db_status';

const CustomHeader = () => (
  <View style={styles.header}>
    <Text style={styles.headerText}>Rapid Compliance Checker</Text>
  </View>
);

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [isLoading, setIsLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState({ exists: false, initialized: false });
  const [error, setError] = useState(null);
  const BACKEND_URL = "https://free-horribly-perch.ngrok-free.app";
  
  useEffect(() => {
    const checkDatabase = async () => {
      try {
        const storedStatus = await AsyncStorage.getItem(DB_STATUS_KEY);
        if (storedStatus) {
          const parsedStatus = JSON.parse(storedStatus);
          setDbStatus(parsedStatus);
          setIsLoading(false);
          return;
        }

        const [checkResponse, initResponse] = await Promise.all([
          fetch(`${BACKEND_URL}/api/check-database`,
            // "headers":
          ),
          fetch(`${BACKEND_URL}/api/process-pdf`, { method: 'POST' })
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
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#3B82F6', // Bright blue
        tabBarInactiveTintColor: '#94A3B8', // Slate gray
        tabBarStyle: {
          backgroundColor: '#0F172A', // Dark blue/black background
          borderTopWidth: 1,
          borderTopColor: '#1E293B', // Dark border
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        header: () => <CustomHeader />,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Search',
          tabBarIcon: ({ color }) => <Ionicons name="search-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="ItemImageCompliance"
        options={{
          title: 'Regulations',
          tabBarIcon: ({ color }) => <Ionicons name="list-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="Dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <Ionicons name="stats-chart" size={24} color={color} />,
        }}
      />
    </Tabs>
    </KeyboardAvoidingView>
);
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#1E3A8A', // Darker blue for header
    padding: 16,
    paddingTop: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    color: '#F8FAFC', // Light text
    fontSize: 20,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A', // Dark background
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#F8FAFC', // Light text
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A', // Dark background
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444', // Red error text
    textAlign: 'center',
  },
});