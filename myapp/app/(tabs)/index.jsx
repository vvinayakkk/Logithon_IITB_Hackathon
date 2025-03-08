import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { router, useLocalSearchParams } from 'expo-router';
import ItemImageCompliance from './ItemImageCompliance';

const RegulationsSearch = () => {
  const [sourceOpen, setSourceOpen] = useState(false);
  const [destOpen, setDestOpen] = useState(false);
  const [sourceCountry, setSourceCountry] = useState(null);
  const [destinationCountry, setDestinationCountry] = useState(null);
  const colorScheme = useColorScheme();

  const countriesData = [
    'India', 'United States', 'United Kingdom', 'Canada', 'Australia', 
    'Germany', 'France', 'China', 'Japan', 'Switzerland', 'Brazil', 
    'Mexico', 'South Africa', 'Singapore', 'United Arab Emirates'
  ];

  const countries = countriesData.map(country => ({
    label: country,
    value: country
  }));

  const handleSubmit = () => {
    if (sourceCountry && destinationCountry) {
      router.push({
        pathname: '/ShowRegulationsPageNative',
        params: {
          source: sourceCountry,
          destination: destinationCountry
        }
      });
    }
  };

  const params = useLocalSearchParams();
  
  useEffect(() => {
    if (params.fromCamera && params.photoUri && params.photoBase64) {
      router.push({
        pathname: '/ItemImageCompliance',
        params: {
          photoUri: params.photoUri,
          photoBase64: params.photoBase64
        }
      });
    }
  }, [params]);

  return (
    <View style={[styles.container, colorScheme === 'dark' && styles.containerDark]}>
      <View style={styles.content}>
        <Text h3 style={[styles.title, colorScheme === 'dark' && styles.titleDark]}>
          Search Regulations
        </Text>
        
        <Text style={[styles.label, colorScheme === 'dark' && styles.labelDark]}>Source Country</Text>
        <DropDownPicker
          open={sourceOpen}
          value={sourceCountry}
          items={countries}
          setOpen={setSourceOpen}
          setValue={setSourceCountry}
          style={[styles.dropdown, colorScheme === 'dark' && styles.dropdownDark]}
          dropDownContainerStyle={[styles.dropdownContainer, colorScheme === 'dark' && styles.dropdownContainerDark]}
          textStyle={[styles.dropdownText, colorScheme === 'dark' && styles.dropdownTextDark]}
          placeholder="Select source country"
          placeholderStyle={[styles.placeholderText, colorScheme === 'dark' && styles.placeholderTextDark]}
          onOpen={() => setDestOpen(false)}
          zIndex={2000}
        />

        <View style={styles.spacer} />

        <Text style={[styles.label, colorScheme === 'dark' && styles.labelDark]}>Destination Country</Text>
        <DropDownPicker
          open={destOpen}
          value={destinationCountry}
          items={countries}
          setOpen={setDestOpen}
          setValue={setDestinationCountry}
          style={[styles.dropdown, colorScheme === 'dark' && styles.dropdownDark]}
          dropDownContainerStyle={[styles.dropdownContainer, colorScheme === 'dark' && styles.dropdownContainerDark]}
          textStyle={[styles.dropdownText, colorScheme === 'dark' && styles.dropdownTextDark]}
          placeholder="Select destination country"
          placeholderStyle={[styles.placeholderText, colorScheme === 'dark' && styles.placeholderTextDark]}
          onOpen={() => setSourceOpen(false)}
          zIndex={1000}
        />

        <TouchableOpacity
          style={[
            styles.button,
            (!sourceCountry || !destinationCountry) && styles.buttonDisabled,
            colorScheme === 'dark' && styles.buttonDark
          ]}
          onPress={handleSubmit}
          disabled={!sourceCountry || !destinationCountry}
        >
          <Text style={styles.buttonText}>Search</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  containerDark: {
    backgroundColor: '#1a1a2e',
  },
  content: {
    padding: 20,
    paddingTop: 40,
  },
  title: {
    marginBottom: 30,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  titleDark: {
    color: '#ffffff',
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#1a1a2e',
    fontWeight: '600',
  },
  labelDark: {
    color: '#ffffff',
  },
  dropdown: {
    borderColor: '#3B82F6',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    height: 50,
  },
  dropdownDark: {
    borderColor: '#60A5FA',
    backgroundColor: '#1E293B',
    borderWidth: 1.5,
  },
  dropdownContainer: {
    borderColor: '#3B82F6',
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
  },
  dropdownContainerDark: {
    borderColor: '#60A5FA',
    backgroundColor: '#1E293B',
    borderWidth: 1.5,
  },
  dropdownText: {
    color: '#1E293B',
    fontSize: 16,
  },
  dropdownTextDark: {
    color: '#E5E7EB',
  },
  placeholderText: {
    color: '#6B7280',
    fontSize: 16,
  },
  placeholderTextDark: {
    color: '#9CA3AF',
  },
  spacer: {
    height: 20,
  },
  button: {
    marginTop: 30,
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  buttonDark: {
    backgroundColor: '#2563eb',
  },
  buttonDisabled: {
    backgroundColor: '#93C5FD',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RegulationsSearch;
