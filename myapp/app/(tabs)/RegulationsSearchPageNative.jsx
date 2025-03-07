import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { router } from 'expo-router';

const RegulationsSearch = () => {
  const [sourceOpen, setSourceOpen] = useState(false);
  const [destOpen, setDestOpen] = useState(false);
  const [sourceCountry, setSourceCountry] = useState(null);
  const [destinationCountry, setDestinationCountry] = useState(null);

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

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text h3 style={styles.title}>
          Search Regulations
        </Text>
        
        <Text style={styles.label}>Source Country</Text>
        <DropDownPicker
          open={sourceOpen}
          value={sourceCountry}
          items={countries}
          setOpen={setSourceOpen}
          setValue={setSourceCountry}
          style={styles.dropdown}
          dropDownContainerStyle={styles.dropdownContainer}
          placeholder="Select source country"
          onOpen={() => setDestOpen(false)}
          zIndex={2000}
        />

        <View style={styles.spacer} />

        <Text style={styles.label}>Destination Country</Text>
        <DropDownPicker
          open={destOpen}
          value={destinationCountry}
          items={countries}
          setOpen={setDestOpen}
          setValue={setDestinationCountry}
          style={styles.dropdown}
          dropDownContainerStyle={styles.dropdownContainer}
          placeholder="Select destination country"
          onOpen={() => setSourceOpen(false)}
          zIndex={1000}
        />

        <TouchableOpacity
          style={[
            styles.button,
            (!sourceCountry || !destinationCountry) && styles.buttonDisabled
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
  content: {
    padding: 20,
    paddingTop: 40,
  },
  title: {
    marginBottom: 30,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#4B5563',
  },
  dropdown: {
    borderColor: '#E5E7EB',
    borderRadius: 8,
  },
  dropdownContainer: {
    borderColor: '#E5E7EB',
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
  buttonDisabled: {
    backgroundColor: '#93C5FD',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
});

export default RegulationsSearch;
