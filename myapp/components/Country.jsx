import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, useColorScheme, Alert, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Animated, { FadeInUp } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Menu, Divider, Provider } from 'react-native-paper';
import * as FileSystem from 'expo-file-system';
import { shareAsync } from 'expo-sharing';

const CountryTab = () => {
  const [countries, setCountries] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const BACKEND_URL="http://192.168.80.60"
  // Theme colors
  const theme = {
    bg: isDark ? '#121212' : '#F5F7FA',
    card: isDark ? '#1E1E1E' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#1A1A1A',
    subtext: isDark ? '#AAAAAA' : '#6E7179',
    placeholder: isDark ? '#666666' : '#9CA3AF',
    primary: '#3B82F6',
    primaryDark: '#2563EB',
    accent: '#F59E0B',
    danger: '#EF4444',
    success: '#10B981',
    pickerBg: isDark ? '#2A2A2A' : '#FFFFFF',
    itemBg: isDark ? '#2A2A2A' : '#FFFFFF',
    border: isDark ? '#333333' : '#E5E7EB',
    divider: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
  };

  useEffect(() => {
    fetchCountries();
  }, []);

  const fetchCountries = async () => {
    setError('');
    try {
      const response = await fetch(`${BACKEND_URL}:5000/api/countries`);
      const data = await response.json();
      setCountries(data.countries);
    } catch (error) {
      console.error('Error fetching countries:', error);
      setError('Unable to load countries. Please check your connection and try again.');
    }
  };

  const fetchProhibitedItems = async () => {
    if (!selectedCountry) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${BACKEND_URL}:5000/api/country/${selectedCountry}`);
      const data = await response.json();
      setResults(data.items);
      if (data.items.length === 0) {
        setError('No prohibited items found for this country.');
      }
    } catch (error) {
      console.error('Error fetching prohibited items:', error);
      setError('Unable to load prohibited items. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const save = async (uri, filename, mimetype) => {
    if (Platform.OS === "android") {
      const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
      if (permissions.granted) {
        const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
        await FileSystem.StorageAccessFramework.createFileAsync(permissions.directoryUri, filename, mimetype)
          .then(async (uri) => {
            await FileSystem.writeAsStringAsync(uri, base64, { encoding: FileSystem.EncodingType.Base64 });
            Alert.alert('Success', `${filename} saved successfully!`);
          })
          .catch(e => {
            console.log(e);
            Alert.alert('Error', 'Failed to save file.');
          });
      } else {
        shareAsync(uri);
      }
    } else {
      shareAsync(uri);
    }
  };

  const exportToCSV = async () => {
    if (results.length === 0) {
      Alert.alert('No Data', 'There are no items to export.');
      return;
    }

    let csvContent = "Country,Prohibited Item\n";
    
    results.forEach(item => {
      csvContent += `${selectedCountry},"${item}"\n`;
    });

    const filename = `${selectedCountry}_prohibited_items_${Date.now()}.csv`;
    const fileUri = FileSystem.documentDirectory + filename;
    
    try {
      await FileSystem.writeAsStringAsync(fileUri, csvContent);
      save(fileUri, filename, 'text/csv');
    } catch (err) {
      console.error('Error writing CSV file:', err);
      Alert.alert('Error', 'Failed to create CSV file.');
    }
  };

  const downloadPdf = async () => {
    if (results.length === 0) {
      Alert.alert('No Data', 'There are no items to export.');
      return;
    }

    try {
      const filename = `${selectedCountry}_prohibited_items_${Date.now()}.pdf`;
      
      // Create a query parameter with country and items data
      const exportData = encodeURIComponent(JSON.stringify({
        country: selectedCountry,
        items: results
      }));
      
      const result = await FileSystem.downloadAsync(
        `${BACKEND_URL}:5000/generate-pdf?data=${exportData}`,
        FileSystem.documentDirectory + filename
      );
      
      save(result.uri, filename, 'application/pdf');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      Alert.alert('Error', 'Failed to download PDF report.');
    }
  };

  const sendPdfViaWhatsApp = async () => {
    if (results.length === 0) {
      Alert.alert('No Data', 'There are no items to send.');
      return;
    }

    try {
      const filename = `${selectedCountry}_prohibited_items_${Date.now()}.pdf`;
      
      // Create a query parameter with country and items data
      const exportData = encodeURIComponent(JSON.stringify({
        country: selectedCountry,
        items: results
      }));
      
      const result = await FileSystem.downloadAsync(
        `${BACKEND_URL}:5000/generate-pdf?data=${exportData}`,
        FileSystem.documentDirectory + filename
      );

      // Send the PDF via WhatsApp
      const response = await fetch(`${BACKEND_URL}:5000/send_message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'whatsapp',
          message: `Here is the PDF for prohibited items in ${selectedCountry}: ${result.uri}`,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        Alert.alert('Success', 'PDF sent via WhatsApp!');
      } else {
        Alert.alert('Error', data.error || 'Failed to send PDF via WhatsApp.');
      }
    } catch (error) {
      console.error('Error sending PDF via WhatsApp:', error);
      Alert.alert('Error', 'Failed to send PDF via WhatsApp.');
    }
  };

  const sendPdfViaSms = async () => {
    if (results.length === 0) {
      Alert.alert('No Data', 'There are no items to send.');
      return;
    }

    try {
      const filename = `${selectedCountry}_prohibited_items_${Date.now()}.pdf`;
      
      // Create a query parameter with country and items data
      const exportData = encodeURIComponent(JSON.stringify({
        country: selectedCountry,
        items: results
      }));
      
      const result = await FileSystem.downloadAsync(
        `${BACKEND_URL}:5000/generate-country-pdf?data=${exportData}`,
        FileSystem.documentDirectory + filename
      );

      // Send the PDF via SMS
      const response = await fetch(`${BACKEND_URL}:5000/send_message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'sms',
          message: `Here is the PDF for prohibited items in ${selectedCountry}: ${result.uri}`,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        Alert.alert('Success', 'PDF sent via SMS!');
      } else {
        Alert.alert('Error', data.error || 'Failed to send PDF via SMS.');
      }
    } catch (error) {
      console.error('Error sending PDF via SMS:', error);
      Alert.alert('Error', 'Failed to send PDF via SMS.');
    }
  };

  const renderEmptyState = () => {
    if (loading) return null;
    
    return (
      <View style={{ 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: 24, 
        opacity: 0.7 
      }}>
        <Icon 
          name="package-variant-closed-remove" 
          size={60} 
          color={theme.subtext} 
        />
        <Text style={{ 
          color: theme.text, 
          fontSize: 16, 
          fontWeight: '500', 
          marginTop: 16, 
          textAlign: 'center' 
        }}>
          {selectedCountry 
            ? 'Select a country and click "Show Prohibited Items"'
            : 'Select a country to view its prohibited shipping items'}
        </Text>
      </View>
    );
  };

  return (
    <Provider>
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
        <View style={{ flex: 1, padding: 16 }}>
          {/* Header */}
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            marginBottom: 20,
            paddingBottom: 12,
            borderBottomWidth: 1,
            borderBottomColor: theme.border
          }}>
            <View style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: theme.accent,
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 12
            }}>
              <Icon name="earth" size={22} color="#FFFFFF" />
            </View>
            <View>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.text }}>
                Country Regulations
              </Text>
              <Text style={{ fontSize: 12, color: theme.subtext }}>
                Prohibited shipping items by destination
              </Text>
            </View>
          </View>

          {/* Country Selector */}
          <View style={{
            backgroundColor: theme.pickerBg,
            borderRadius: 12,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: theme.border,
            overflow: 'hidden',
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isDark ? 0.2 : 0.1,
            shadowRadius: 3,
            elevation: 3,
          }}>
            <View style={{ 
              paddingHorizontal: 16, 
              paddingTop: 8,
              borderBottomWidth: 1,
              borderBottomColor: theme.divider
            }}>
              <Text style={{ 
                fontSize: 14, 
                color: theme.subtext, 
                marginBottom: 4,
                fontWeight: '500'
              }}>
                SELECT DESTINATION
              </Text>
            </View>
            <Picker
              selectedValue={selectedCountry}
              onValueChange={(itemValue) => setSelectedCountry(itemValue)}
              style={{
                color: '#000000',  // Force black color
                backgroundColor: 'transparent',
              }}
              dropdownIconColor={theme.text}
            >
              <Picker.Item label="Select a country" value="" color={theme.placeholder} />
              {countries.map((country, index) => (
                <Picker.Item 
                  key={index} 
                  label={country} 
                  value={country}
                  color="#000000"  // Force black color
                />
              ))}
            </Picker>
          </View>

          {/* Action Button */}
          <TouchableOpacity
            style={{
              backgroundColor: selectedCountry ? theme.primary : theme.subtext,
              borderRadius: 12,
              padding: 16,
              alignItems: 'center',
              marginBottom: 20,
              flexDirection: 'row',
              justifyContent: 'center',
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 3,
              elevation: 3,
            }}
            onPress={fetchProhibitedItems}
            disabled={loading || !selectedCountry}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Icon name="clipboard-list" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
                  Show Prohibited Items
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Error Message */}
          {error ? (
            <View style={{
              backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)',
              borderRadius: 8,
              padding: 12,
              marginBottom: 16,
              borderLeftWidth: 4,
              borderLeftColor: theme.danger,
            }}>
              <Text style={{ color: isDark ? '#FCA5A5' : theme.danger }}>{error}</Text>
            </View>
          ) : null}

          {/* Results List */}
          {results.length > 0 ? (
            <>
              <View style={{ 
                flexDirection: 'row', 
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 8,
                paddingHorizontal: 4
              }}>
                <Text style={{ color: theme.text, fontWeight: '600' }}>
                  {results.length} Prohibited Items
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ color: theme.primary, fontWeight: '600', marginRight: 8 }}>
                    {selectedCountry}
                  </Text>
                  <Menu
                    visible={menuVisible}
                    onDismiss={() => setMenuVisible(false)}
                    anchor={
                      <TouchableOpacity onPress={() => setMenuVisible(true)}>
                        <Icon name="download" size={24} color={theme.primary} />
                      </TouchableOpacity>
                    }
                  >
                    <Menu.Item onPress={() => { setMenuVisible(false); exportToCSV(); }} title="Export as CSV" />
                    <Divider />
                    <Menu.Item onPress={() => { setMenuVisible(false); downloadPdf(); }} title="Export as PDF" />
                    <Divider />
                    <Menu.Item onPress={() => { setMenuVisible(false); sendPdfViaWhatsApp(); }} title="Send PDF via WhatsApp" />
                    <Divider />
                    <Menu.Item onPress={() => { setMenuVisible(false); sendPdfViaSms(); }} title="Send PDF via SMS" />
                  </Menu>
                </View>
              </View>
              <FlatList
                data={results}
                keyExtractor={(item, index) => index.toString()}
                showsVerticalScrollIndicator={false}
                renderItem={({ item, index }) => (
                  <Animated.View 
                    entering={FadeInUp.delay(index * 50).duration(300)}
                    style={{
                      backgroundColor: theme.itemBg,
                      borderRadius: 10,
                      padding: 16,
                      marginBottom: 8,
                      borderLeftWidth: 4,
                      borderLeftColor: theme.danger,
                      flexDirection: 'row',
                      alignItems: 'center',
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: isDark ? 0.2 : 0.1,
                      shadowRadius: 2,
                      elevation: 2,
                    }}
                  >
                    <Icon 
                      name="close-circle" 
                      size={20} 
                      color={theme.danger} 
                      style={{ marginRight: 12 }}
                    />
                    <Text style={{ color: theme.text, flex: 1, fontSize: 15 }}>{item}</Text>
                  </Animated.View>
                )}
                ListEmptyComponent={renderEmptyState}
              />
            </>
          ) : (
            renderEmptyState()
          )}
        </View>
      </SafeAreaView>
    </Provider>
  );
};

export default CountryTab;