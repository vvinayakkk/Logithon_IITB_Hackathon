import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator, useColorScheme, Keyboard, Platform, Alert } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Menu, Divider, Provider } from 'react-native-paper';
import * as FileSystem from 'expo-file-system';
import { shareAsync } from 'expo-sharing';

const ItemTab = () => {
  const [itemName, setItemName] = useState('');
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
    accent: '#8B5CF6',
    warning: '#F59E0B',
    danger: '#EF4444',
    inputBg: isDark ? '#2A2A2A' : '#FFFFFF',
    resultItemBg: isDark ? '#2A2A2A' : '#FFFFFF',
    border: isDark ? '#333333' : '#E5E7EB',
    divider: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
  };

  const searchItemRestrictions = async () => {
    if (!itemName) return;
    setLoading(true);
    setError('');
    setResults([]);
    Keyboard.dismiss();
    
    try {
      const response = await fetch(`${BACKEND_URL}:5000/api/search-item?query=${encodeURIComponent(itemName)}&top_k=100`);
      const data = await response.json();
      setResults(data.results);
      console.log(data.results);
      
      if (data.results.length === 0) {
        setError(`No restrictions found for "${itemName}".`);
      }
    } catch (error) {
      console.error('Error searching item restrictions:', error);
      setError('Unable to check restrictions. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const groupResultsByCountry = () => {
    const grouped = {};
    results.forEach(item => {
      if (!grouped[item.country]) {
        grouped[item.country] = [];
      }
      grouped[item.country].push({
        item: item.item,
        score: (item.scores[0]).toFixed(2) || 0  // Get first score from scores array
      });
    });
    
    return Object.keys(grouped).map(country => ({
      country,
      items: grouped[country]
    }));
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
    const groupedResults = groupResultsByCountry();
    let csvContent = "Country,Item,Score\n";
    
    groupedResults.forEach(group => {
      group.items.forEach(item => {
        csvContent += `${group.country},${item.item},${item.score}\n`;
      });
    });

    const filename = `item_restrictions_${Date.now()}.csv`;
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
    try {
      const filename = `item_restrictions_${Date.now()}.pdf`;
      // Replace with your actual backend API endpoint for PDF generation
    //   const localhost = Platform.OS === "192.168.112.55";
    //   const port = "5000"; // Replace with your actual backend port
      
      // Create a query parameter string from the search results
      const searchData = encodeURIComponent(JSON.stringify({
        itemName,
        results: groupResultsByCountry()
      }));
      
      const result = await FileSystem.downloadAsync(
        `${BACKEND_URL}:5000/generate-pdf?data=${searchData}`,
        FileSystem.documentDirectory + filename
      );
      
      save(result.uri, filename, 'application/pdf');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      Alert.alert('Error', 'Failed to download PDF report.');
    }
  };

  const renderEmptyState = () => {
    if (loading) return null;
    
    return (
      <View style={{ alignItems: 'center', justifyContent: 'center', padding: 24, opacity: 0.7 }}>
        <Icon name="magnify" size={60} color={theme.subtext} />
        <Text style={{ 
          color: theme.text, 
          fontSize: 16, 
          fontWeight: '500', 
          marginTop: 16, 
          textAlign: 'center' 
        }}>
          Enter an item name to check international shipping restrictions
        </Text>
      </View>
    );
  };

  const groupedResults = groupResultsByCountry();

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
              <Icon name="magnify-scan" size={20} color="#FFFFFF" />
            </View>
            <View>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.text }}>
                Item Restrictions
              </Text>
              <Text style={{ fontSize: 12, color: theme.subtext }}>
                Check shipping regulations by product
              </Text>
            </View>
          </View>

          {/* Search Form */}
          <View style={{
            backgroundColor: theme.card,
            borderRadius: 12,
            padding: 16,
            marginBottom: 20,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isDark ? 0.2 : 0.1,
            shadowRadius: 3,
            elevation: 3,
          }}>
            <Text style={{ 
              fontSize: 14, 
              fontWeight: '500', 
              color: theme.subtext, 
              marginBottom: 8,
              paddingLeft: 4
            }}>
              PRODUCT SEARCH
            </Text>
            
            <TextInput
              style={{
                backgroundColor: theme.inputBg,
                color: theme.text,
                borderRadius: 8,
                padding: 12,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: theme.border,
                fontSize: 16,
              }}
              placeholder="Enter item name (e.g., electronics, alcohol)"
              placeholderTextColor={theme.placeholder}
              value={itemName}
              onChangeText={setItemName}
            />
            
            <TouchableOpacity
              style={{
                backgroundColor: itemName ? theme.primary : theme.subtext,
                borderRadius: 8,
                padding: 16,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
              }}
              onPress={searchItemRestrictions}
              disabled={loading || !itemName}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Icon name="shield-alert" size={18} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
                    Check Restrictions
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

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
          {results.length > 0 && (
            <View style={{ 
              flexDirection: 'row', 
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12,
              paddingHorizontal: 4
            }}>
              <Text style={{ color: theme.text, fontWeight: '600', fontSize: 16 }}>
                {results.length} Restrictions Found
              </Text>
              <Menu
                visible={menuVisible}
                onDismiss={() => setMenuVisible(false)}
                anchor={
                  <TouchableOpacity 
                    onPress={() => setMenuVisible(true)}
                    //style={{ padding: 8 }} // Add padding for better touch target
                  >
                    <Icon name="download" size={24} color={theme.primary} />
                  </TouchableOpacity>
                }
                contentStyle={{
                  backgroundColor: theme.card,
                }}
                anchorPosition="bottom"
              >
                <Menu.Item 
                  onPress={() => { setMenuVisible(false); exportToCSV(); }} 
                  title="Export as CSV"
                  titleStyle={{ color: theme.text }}
                />
                <Divider style={{ backgroundColor: theme.border }} />
                <Menu.Item 
                  onPress={() => { setMenuVisible(false); downloadPdf(); }} 
                  title="Export as PDF" 
                  titleStyle={{ color: theme.text }}
                />
              </Menu>
            </View>
          )}

          <FlatList
            data={groupedResults}
            keyExtractor={(item) => item.country}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={results.length === 0 ? { flex: 1 } : {}}
            renderItem={({ item, index }) => (
              <Animated.View 
                entering={FadeInDown.delay(index * 50).duration(300)}
                style={{
                  backgroundColor: theme.resultItemBg,
                  borderRadius: 12,
                  marginBottom: 12,
                  overflow: 'hidden',
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: isDark ? 0.2 : 0.1,
                  shadowRadius: 2,
                  elevation: 2,
                }}
              >
                <View style={{
                  backgroundColor: theme.warning,
                  paddingVertical: 8,
                  paddingHorizontal: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}>
                  <Icon 
                    name="flag" 
                    size={18} 
                    color="#FFFFFF" 
                    style={{ marginRight: 8 }} 
                  />
                  <Text style={{ 
                    color: '#FFFFFF', 
                    fontWeight: 'bold', 
                    fontSize: 15 
                  }}>
                    {item.country}
                  </Text>
                </View>
                
                <View style={{ padding: 12 }}>
                  {item.items.map((restriction, i) => (
                    <View 
                      key={i} 
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingVertical: 8,
                        borderBottomWidth: i < item.items.length - 1 ? 1 : 0,
                        borderBottomColor: theme.divider,
                      }}
                    >
                      <Icon 
                        name="close-circle-outline" 
                        size={16} 
                        color={theme.danger} 
                        style={{ marginRight: 8 }} 
                      />
                      <Text style={{ color: theme.text, flex: 1 }}>
                        {restriction.item}
                      </Text>
                      <View style={{
                        backgroundColor: theme.accent + '20',
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 12,
                      }}>
                        <Text style={{ 
                          color: theme.accent,
                          fontWeight: '600',
                          fontSize: 12
                        }}>
                          Score: {(restriction.score * 100).toFixed(1)}%
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </Animated.View>
            )}
            ListEmptyComponent={renderEmptyState}
          />
        </View>
      </SafeAreaView>
    </Provider>
  );
};

export default ItemTab;