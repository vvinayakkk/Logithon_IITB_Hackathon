import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal,
  SafeAreaView,
  Platform,
  KeyboardAvoidingView,
  StyleSheet,
  Alert
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { BarChart, PieChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import Camera from '../../components/CameraComponent';
import PhotoPreviewSection from '@/components/PhotoPreviewSection';

const screenWidth = Dimensions.get('window').width;

export default function ItemImageCompliancePage({ initialPhoto = null }) {
  // Main state variables
  const [selectedFile, setSelectedFile] = useState(initialPhoto ? {
    uri: initialPhoto.uri,
    type: 'image/jpeg',
    name: 'capture.jpg'
  } : null);
  const [preview, setPreview] = useState(initialPhoto ? initialPhoto.uri : null);
  const [sourceCountry, setSourceCountry] = useState('');
  const [destinationCountry, setDestinationCountry] = useState('');
  const [validationResults, setValidationResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [detected, setDetected] = useState([]);
  const [res, setRes] = useState([]);
  
  // UI state variables
  const [showCamera, setShowCamera] = useState(false);
  const [showImageSelector, setShowImageSelector] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const [pickerType, setPickerType] = useState('');
  
  // Chatbot state
  const [chatMessages, setChatMessages] = useState([
    { sender: 'bot', message: 'Hello! I can help answer questions about shipping compliance. What would you like to know?' }
  ]);
  const [message, setMessage] = useState('');
  const chatContainerRef = useRef(null);

  // List of countries
  const countries = [
    'United States', 'Canada', 'Mexico', 'United Kingdom', 'France', 
    'Germany', 'Japan', 'China', 'Australia', 'Brazil', 'India', 'Kuwait'
  ];

  // Handle captured photo from camera
  const handlePhotoCapture = (capturedPhoto) => {
    setSelectedFile({
      uri: capturedPhoto.uri,
      type: 'image/jpeg',
      name: 'capture.jpg'
    });
    setPreview(capturedPhoto.uri);
    setShowCamera(false);
  };

  // Handle photo from gallery
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });
      
      if (!result.canceled) {
        setSelectedFile({
          uri: result.assets[0].uri,
          type: 'image/jpeg',
          name: 'gallery.jpg'
        });
        setPreview(result.assets[0].uri);
        setShowImageSelector(false);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  // Reset photo
  const handleRetakePhoto = () => {
    setSelectedFile(null);
    setPreview(null);
  };

  // Submit form for compliance check
  const handleSubmit = async () => {
    if (!selectedFile || !sourceCountry || !destinationCountry) {
      Alert.alert('Missing Information', 'Please provide an image, source country and destination country.');
      return;
    }
    
    setLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: Platform.OS === 'ios' ? selectedFile.uri.replace('file://', '') : selectedFile.uri,
        type: 'image/jpeg',
        name: 'image.jpg'
      });
  
      const response = await fetch('https://sensible-emu-highly.ngrok-free.app/api/search_items', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
  
      if (!response.ok) throw new Error('API request failed');
    // console.log(response);
      const data = await response.json();
    //   console.log(data);
      setDetected(data.detected_items || []);
      setRes(data.results || []);
  
      const validationResults = {
        isCompliant: data.results.length === 0,
        sourceCountry,
        destinationCountry,
        issues: data.results.map(item => `${item["Search Item"]} is prohibited in ${item.Country}`),
        recommendations: [
          "Check the destination country's customs regulations.",
          "Ensure all required documentation is complete.",
          "Contact the shipping carrier for further assistance."
        ],
        itemDetails: data.results.map(item => ({
          item: item["Search Item"],
          relevance: parseFloat(item.Relevance),
          prohibitedItem: item["Prohibited Item"],
          distance: Math.floor(Math.random() * 5000 + 3000), // Simulated distance
          transitTime: Math.floor(Math.random() * 10 + 3),   // Simulated transit time
          requiredDocs: 3                                    // Simulated document count
        }))
      };
  
      setValidationResults(validationResults);
      
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Failed to process image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Demo data for testing
  const loadDemoData = () => {
    setRes([
      {
        "Country": "Kuwait",
        "Prohibited Item": "Liquor",
        "Relevance": "0.647",
        "Search Item": "Whiskey bottle"
      },
      {
        "Country": "Kuwait",
        "Prohibited Item": "Pork Products",
        "Relevance": "0.587",
        "Search Item": "Canned ham"
      }
    ]);
    
    setDetected(["Whiskey bottle", "Glass container", "Canned ham"]);
    
    setValidationResults({
      isCompliant: false,
      sourceCountry: sourceCountry || "United States",
      destinationCountry: destinationCountry || "Kuwait",
      issues: ["Whiskey bottle is prohibited in Kuwait", "Canned ham is prohibited in Kuwait"],
      recommendations: [
        "Check the destination country's customs regulations.",
        "Ensure all required documentation is complete.",
        "Contact the shipping carrier for further assistance."
      ],
      itemDetails: [
        {
          item: "Whiskey bottle",
          relevance: 0.647,
          prohibitedItem: "Liquor",
          distance: 4567,
          transitTime: 7,
          requiredDocs: 3
        },
        {
          item: "Canned ham",
          relevance: 0.587,
          prohibitedItem: "Pork Products",
          distance: 4567,
          transitTime: 7,
          requiredDocs: 3
        }
      ]
    });
  };

  // Handle chatbot message submission
  const handleChatSubmit = () => {
    if (!message.trim()) return;
    
    const userMessage = { sender: 'user', message };
    setChatMessages([...chatMessages, userMessage]);
    setMessage('');
    
    setTimeout(() => {
      let botResponse = '';
      if (message.toLowerCase().includes('prohibited') || message.toLowerCase().includes('banned')) {
        botResponse = `Each country has specific prohibited items. For ${destinationCountry || 'most countries'}, typically weapons, drugs, and certain food products are restricted. Would you like specific details about a country?`;
      } else if (message.toLowerCase().includes('document') || message.toLowerCase().includes('paperwork')) {
        botResponse = 'For international shipments, you typically need: a commercial invoice, packing list, and shipping declaration. Some countries may require additional certificates or permits for specific items.';
      } else if (message.toLowerCase().includes('time') || message.toLowerCase().includes('long')) {
        botResponse = 'Shipping times vary by destination. Express services take 2-5 days internationally, while standard shipping can take 1-3 weeks. Customs clearance can add additional delays.';
      } else if (validationResults && message.toLowerCase().includes('why')) {
        botResponse = validationResults.isCompliant ? 
          'Your item appears to comply with destination country regulations based on our initial check. However, we always recommend verifying with the shipping carrier.' : 
          `Your item may be restricted because ${destinationCountry} has regulations against items similar to what you're shipping. We recommend checking with customs or obtaining special permits.`;
      } else {
        botResponse = 'I can help with questions about shipping compliance, prohibited items, required documentation, or shipping timeframes. What specific information do you need?';
      }
      
      const newBotMessage = { sender: 'bot', message: botResponse };
      setChatMessages(prevMessages => [...prevMessages, newBotMessage]);
    }, 1000);
  };

  // Prepare chart data from results
  const prepareChartData = () => {
    if (!res.length) return { relevanceData: [], riskData: [] };
    
    const relevanceData = res.map(item => ({
      name: `${item["Search Item"]} (${item.Country})`,
      relevance: parseFloat(item.Relevance) * 100,
      country: item.Country,
      item: item["Search Item"],
      color: parseFloat(item.Relevance) > 0.6 ? '#ef4444' : parseFloat(item.Relevance) > 0.4 ? '#f59e0b' : '#22c55e'
    }));
  
    const riskData = [
      { name: 'High Risk', value: res.filter(item => parseFloat(item.Relevance) > 0.6).length, color: '#ef4444' },
      { name: 'Medium Risk', value: res.filter(item => parseFloat(item.Relevance) <= 0.6 && parseFloat(item.Relevance) > 0.4).length, color: '#f59e0b' },
      { name: 'Low Risk', value: res.filter(item => parseFloat(item.Relevance) <= 0.4).length, color: '#22c55e' },
    ];
  
    return { relevanceData, riskData };
  };

  const { relevanceData, riskData } = prepareChartData();

  useEffect(() => {
    if (initialPhoto) {
      setSelectedFile({
        uri: initialPhoto.uri,
        type: 'image/jpeg',
        name: 'capture.jpg'
      });
      setPreview(initialPhoto.uri);
    }
  }, [initialPhoto]);

  if (showCamera) {
    return <Camera onPhotoCapture={handlePhotoCapture} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Compliance Checker</Text>
        <Text style={styles.headerSubtitle}>Ship with confidence</Text>
      </View>
      
      <ScrollView style={styles.scrollView}>
        {/* Main Form Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Check Shipment Compliance</Text>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Upload Item Image</Text>
            <TouchableOpacity 
              onPress={() => setShowImageSelector(true)}
              style={styles.uploadContainer}
            >
              {preview ? (
                <View style={styles.previewContainer}>
                  <Image 
                    source={{ uri: preview }} 
                    style={styles.previewImage} 
                    resizeMode="cover"
                  />
                  <TouchableOpacity 
                    onPress={handleRetakePhoto}
                    style={styles.removeButton}
                  >
                    <Text style={styles.removeButtonText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.placeholderContainer}>
                  <Feather name="image" color="#3b82f6" size={48} />
                  <Text style={styles.uploadText}>
                    Tap to upload or take a photo
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Source Country</Text>
            <TouchableOpacity 
              onPress={() => {
                setPickerType('source');
                setShowCountryPicker(true);
              }}
              style={styles.pickerButton}
            >
              <Text style={styles.pickerButtonText}>
                {sourceCountry || "Select Source Country"}
              </Text>
              <Feather name="chevron-down" color="#3b82f6" size={20} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Destination Country</Text>
            <TouchableOpacity 
              onPress={() => {
                setPickerType('destination');
                setShowCountryPicker(true);
              }}
              style={styles.pickerButton}
            >
              <Text style={styles.pickerButtonText}>
                {destinationCountry || "Select Destination Country"}
              </Text>
              <Feather name="chevron-down" color="#3b82f6" size={20} />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading || !selectedFile || !sourceCountry || !destinationCountry}
            style={[
              styles.submitButton,
              (!selectedFile || !sourceCountry || !destinationCountry) && styles.disabledButton
            ]}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.submitButtonText}>
                Check Compliance
              </Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={loadDemoData}
            style={styles.demoButton}
          >
            <Text style={styles.demoButtonText}>
              Load demo data
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Shipping Tips Section */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Shipping Tips</Text>
          <View style={styles.tipsList}>
            <View style={styles.tipItem}>
              <Feather name="check" color="#10b981" size={16} style={styles.tipIcon} />
              <Text style={styles.tipText}>Always declare accurate item values to avoid customs penalties</Text>
            </View>
            <View style={styles.tipItem}>
              <Feather name="check" color="#10b981" size={16} style={styles.tipIcon} />
              <Text style={styles.tipText}>Include all required documentation to prevent shipment delays</Text>
            </View>
            <View style={styles.tipItem}>
              <Feather name="check" color="#10b981" size={16} style={styles.tipIcon} />
              <Text style={styles.tipText}>Check destination country restrictions before shipping</Text>
            </View>
            <View style={styles.tipItem}>
              <Feather name="check" color="#10b981" size={16} style={styles.tipIcon} />
              <Text style={styles.tipText}>Use proper packaging materials for fragile items</Text>
            </View>
          </View>
        </View>

        {/* Detected Items Section */}
        {detected.length > 0 && (
          <View style={styles.resultsCard}>
            <Text style={styles.resultsTitle}>Detected Items</Text>
            <View style={styles.detectedItemsContainer}>
              {detected.map((item, index) => (
                <View key={index} style={styles.detectedItem}>
                  <Feather name="package" color="#60a5fa" size={20} />
                  <Text style={styles.detectedItemText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
        
        {/* Compliance Results Section */}
        {validationResults && (
          <View style={styles.resultsCard}>
            <Text style={styles.resultsTitle}>Compliance Results</Text>
            
            <View style={styles.complianceStatusContainer}>
              <View style={[
                styles.statusIcon,
                validationResults.isCompliant ? styles.compliantIcon : styles.nonCompliantIcon
              ]}>
                <Feather 
                  name={validationResults.isCompliant ? "check" : "alert-triangle"} 
                  color={validationResults.isCompliant ? "#10b981" : "#f43f5e"} 
                  size={24} 
                />
              </View>
              
              <View style={styles.statusTextContainer}>
                <Text style={[
                  styles.statusText,
                  validationResults.isCompliant ? styles.compliantText : styles.nonCompliantText
                ]}>
                  {validationResults.isCompliant ? 'Shipment Compliant' : 'Compliance Issues Detected'}
                </Text>
                <Text style={styles.routeText}>
                  {validationResults.sourceCountry} to {validationResults.destinationCountry}
                </Text>
              </View>
            </View>
            
            {validationResults.issues.length > 0 && (
              <View style={styles.issuesContainer}>
                <Text style={styles.issuesTitle}>Issues</Text>
                <View style={styles.issuesList}>
                  {validationResults.issues.map((issue, index) => (
                    <View key={index} style={styles.issueItem}>
                      <Feather name="x" color="#f43f5e" size={16} style={styles.issueIcon} />
                      <Text style={styles.issueText}>{issue}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
            
            <View style={styles.recommendationsContainer}>
              <Text style={styles.recommendationsTitle}>Recommendations</Text>
              <View style={styles.recommendationsList}>
                {validationResults.recommendations.map((rec, index) => (
                  <View key={index} style={styles.recommendationItem}>
                    <Feather name="info" color="#3b82f6" size={16} style={styles.recommendationIcon} />
                    <Text style={styles.recommendationText}>{rec}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Shipment Details */}
            {validationResults.itemDetails && validationResults.itemDetails.length > 0 && (
              <View style={styles.shipmentDetailsContainer}>
                <Text style={styles.shipmentDetailsTitle}>Shipment Details</Text>
                <View style={styles.detailsGrid}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Distance</Text>
                    <Text style={styles.detailValue}>{validationResults.itemDetails[0].distance} km</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Est. Transit Time</Text>
                    <Text style={styles.detailValue}>{validationResults.itemDetails[0].transitTime} days</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Required Documents</Text>
                    <Text style={styles.detailValue}>{validationResults.itemDetails[0].requiredDocs}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Status</Text>
                    <Text style={styles.detailValue}>Pending Approval</Text>
                  </View>
                </View>
              </View>
            )}
            
            <TouchableOpacity
              onPress={() => setShowChatbot(true)}
              style={styles.chatButton}
            >
              <Feather name="message-circle" color="#22d3ee" size={16} style={styles.chatButtonIcon} />
              <Text style={styles.chatButtonText}>Ask questions about this shipment</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {!validationResults && (
          <View style={styles.emptyStateCard}>
            <View style={styles.emptyStateContainer}>
              <View style={styles.emptyStateIcon}>
                <Feather name="file-text" color="#3b82f6" size={28} />
              </View>
              <Text style={styles.emptyStateTitle}>Submit an image to check compliance</Text>
              <Text style={styles.emptyStateText}>
                Your shipment will be analyzed for regulatory compliance
              </Text>
            </View>
          </View>
        )}
        
        {/* Recent Regulation Updates Section */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recent Regulation Updates</Text>
          <View style={styles.updatesList}>
            <View style={styles.updateItem}>
              <Text style={styles.updateDate}>FEB 28, 2025</Text>
              <Text style={styles.updateTitle}>EU Customs Updates</Text>
              <Text style={styles.updateText}>New documentation required for electronics starting April 2025.</Text>
            </View>
            <View style={styles.updateItem}>
              <Text style={styles.updateDate}>FEB 15, 2025</Text>
              <Text style={styles.updateTitle}>APAC Restrictions</Text>
              <Text style={styles.updateText}>China, Japan, and Australia updated restricted items lists.</Text>
            </View>
            <View style={styles.updateItem}>
              <Text style={styles.updateDate}>JAN 30, 2025</Text>
              <Text style={styles.updateTitle}>US Duty Changes</Text>
              <Text style={styles.updateText}>New import duties for certain products shipping to the US.</Text>
            </View>
          </View>
        </View>
        
        {res.length > 0 && (
          <View style={styles.chartsCard}>
            <Text style={styles.chartsTitle}>Risk Analysis</Text>
            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>Risk Distribution</Text>
              <PieChart
                data={riskData}
                width={screenWidth - 60}
                height={160}
                chartConfig={{
                  backgroundColor: '#1e293b',
                  backgroundGradientFrom: '#1e293b',
                  backgroundGradientTo: '#0f172a',
                  color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                }}
                accessor="value"
                backgroundColor="transparent"
                paddingLeft="0"
                absolute
              />
              <View style={styles.chartLegend}>
                {riskData.map((item, index) => (
                  <View key={index} style={styles.legendItem}>
                    <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                    <Text style={styles.legendText}>{item.name} ({item.value})</Text>
                  </View>
                ))}
              </View>
            </View>
            
            <Text style={styles.chartTitle}>Item Relevance Scores</Text>
            {relevanceData.length > 0 && (
              <BarChart
                data={{
                  labels: relevanceData.map(d => d.item),
                  datasets: [{ data: relevanceData.map(d => d.relevance), colors: relevanceData.map(d => () => d.color) }]
                }}
                width={screenWidth - 60}
                height={220}
                chartConfig={{
                  backgroundColor: '#1e293b',
                  backgroundGradientFrom: '#1e293b',
                  backgroundGradientTo: '#0f172a',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                  style: { borderRadius: 16 },
                  propsForLabels: { fontSize: 10 },
                }}
                style={styles.barChart}
                fromZero
                showValuesOnTopOfBars
                withInnerLines={false}
              />
            )}
          </View>
        )}
        
        <TouchableOpacity
          onPress={() => setShowInfoModal(true)}
          style={styles.aboutButton}
        >
          <Feather name="info" color="#93c5fd" size={16} style={styles.aboutButtonIcon} />
          <Text style={styles.aboutButtonText}>About Compliance Checker</Text>
        </TouchableOpacity>
      </ScrollView>
      
      <TouchableOpacity 
        onPress={() => setShowChatbot(true)}
        style={styles.floatingButton}
      >
        <Feather name="message-circle" color="white" size={24} />
      </TouchableOpacity>
      
      {/* Modals remain unchanged for brevity */}
      <Modal visible={showImageSelector} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Image</Text>
            <View style={styles.imageOptionsContainer}>
              <TouchableOpacity style={styles.imageOption} onPress={() => { setShowImageSelector(false); setShowCamera(true); }}>
                <View style={styles.imageOptionIcon}><Feather name="camera" color="white" size={30} /></View>
                <Text style={styles.imageOptionText}>Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.imageOption} onPress={pickImage}>
                <View style={styles.imageOptionIcon}><Feather name="image" color="white" size={30} /></View>
                <Text style={styles.imageOptionText}>Gallery</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.modalCancelButton} onPress={() => setShowImageSelector(false)}>
              <Text style={styles.modalCancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      <Modal visible={showCountryPicker} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select {pickerType === 'source' ? 'Source' : 'Destination'} Country</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={pickerType === 'source' ? sourceCountry : destinationCountry}
                onValueChange={(itemValue) => pickerType === 'source' ? setSourceCountry(itemValue) : setDestinationCountry(itemValue)}
                style={styles.picker}
                itemStyle={styles.pickerItem}
              >
                <Picker.Item label="Select Country" value="" />
                {countries.map((country) => <Picker.Item key={country} label={country} value={country} />)}
              </Picker>
            </View>
            <TouchableOpacity style={styles.modalConfirmButton} onPress={() => setShowCountryPicker(false)}>
              <Text style={styles.modalConfirmButtonText}>Confirm</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalCancelButton} onPress={() => setShowCountryPicker(false)}>
              <Text style={styles.modalCancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      <Modal visible={showChatbot} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.chatModalContent}>
            <View style={styles.chatHeader}>
              <View style={styles.chatHeaderTitle}>
                <Feather name="message-circle" color="white" size={20} />
                <Text style={styles.chatHeaderText}>Compliance Assistant</Text>
              </View>
              <TouchableOpacity onPress={() => setShowChatbot(false)}>
                <Feather name="x" color="white" size={20} />
              </TouchableOpacity>
            </View>
            <ScrollView ref={chatContainerRef} style={styles.chatMessageContainer} contentContainerStyle={styles.chatMessageContent}>
              {chatMessages.map((chat, index) => (
                <View key={index} style={[styles.chatBubbleRow, chat.sender === 'user' ? styles.chatBubbleRowUser : styles.chatBubbleRowBot]}>
                  <View style={[styles.chatBubble, chat.sender === 'user' ? styles.chatBubbleUser : styles.chatBubbleBot]}>
                    <Text style={chat.sender === 'user' ? styles.chatTextUser : styles.chatTextBot}>{chat.message}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0} style={styles.chatInputContainer}>
              <TextInput 
                value={message}
                onChangeText={setMessage}
                placeholder="Ask a question about shipping..."
                placeholderTextColor="#3b82f6"
                style={styles.chatInput}
              />
              <TouchableOpacity onPress={handleChatSubmit} style={[styles.chatSendButton, !message.trim() && styles.chatSendButtonDisabled]} disabled={!message.trim()}>
                <Feather name="send" color="white" size={20} />
              </TouchableOpacity>
            </KeyboardAvoidingView>
          </View>
        </View>
      </Modal>
      
      <Modal visible={showInfoModal} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.infoModalContent}>
            <Text style={styles.infoModalTitle}>About Compliance Checker</Text>
            <ScrollView style={styles.infoScrollView}>
              <Text style={styles.infoText}>
                Rapid Compliance Checker simplifies international shipping compliance checks with advanced AI technology.
              </Text>
              <Text style={styles.infoText}>Key features:</Text>
              <View style={styles.featureList}>
                <View style={styles.featureItem}><Text style={styles.featureBullet}>•</Text><Text style={styles.featureText}>Item identification from images</Text></View>
                <View style={styles.featureItem}><Text style={styles.featureBullet}>•</Text><Text style={styles.featureText}>Country-specific prohibited item detection</Text></View>
                <View style={styles.featureItem}><Text style={styles.featureBullet}>•</Text><Text style={styles.featureText}>AI assistant for shipping questions</Text></View>
                <View style={styles.featureItem}><Text style={styles.featureBullet}>•</Text><Text style={styles.featureText}>Risk analysis visualization</Text></View>
              </View>
              <Text style={styles.infoText}>
                Contact us at: support@rapidcompliance.example
              </Text>
              <Text style={styles.infoText}>
                © 2025 Rapid Compliance Checker. All rights reserved.
              </Text>
            </ScrollView>
            <TouchableOpacity style={styles.infoCloseButton} onPress={() => setShowInfoModal(false)}>
              <Text style={styles.infoCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { backgroundColor: '#172554', paddingVertical: 16, paddingHorizontal: 20, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#1e3a8a' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: 'white' },
  headerSubtitle: { fontSize: 14, color: '#93c5fd', marginTop: 4 },
  scrollView: { flex: 1 },
  card: { backgroundColor: '#1e293b', borderRadius: 12, padding: 16, margin: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: 'white', marginBottom: 16 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#e2e8f0', marginBottom: 8 },
  uploadContainer: { borderWidth: 2, borderColor: '#3b82f6', borderStyle: 'dashed', borderRadius: 8, overflow: 'hidden' },
  placeholderContainer: { alignItems: 'center', justifyContent: 'center', padding: 32 },
  uploadText: { color: '#3b82f6', fontSize: 16, marginTop: 12, textAlign: 'center' },
  previewContainer: { position: 'relative' },
  previewImage: { width: '100%', height: 200, borderRadius: 6 },
  removeButton: { position: 'absolute', bottom: 8, right: 8, backgroundColor: 'rgba(15, 23, 42, 0.7)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4 },
  removeButtonText: { color: 'white', fontSize: 12, fontWeight: '600' },
  pickerButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1e3a8a', paddingHorizontal: 12, paddingVertical: 12, borderRadius: 6 },
  pickerButtonText: { color: 'white', fontSize: 16 },
  submitButton: { backgroundColor: '#3b82f6', borderRadius: 6, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  disabledButton: { backgroundColor: '#475569', opacity: 0.6 },
  submitButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  demoButton: { backgroundColor: 'transparent', borderRadius: 6, paddingVertical: 12, alignItems: 'center', marginTop: 8, borderWidth: 1, borderColor: '#3b82f6' },
  demoButtonText: { color: '#3b82f6', fontSize: 14 },
  tipsList: { paddingHorizontal: 8 },
  tipItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  tipIcon: { marginTop: 2, marginRight: 8 },
  tipText: { color: '#e2e8f0', fontSize: 14, flex: 1 },
  resultsCard: { backgroundColor: '#1e293b', borderRadius: 12, padding: 16, margin: 16, marginTop: 0, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  resultsTitle: { fontSize: 18, fontWeight: 'bold', color: 'white', marginBottom: 16 },
  detectedItemsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  detectedItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#334155', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, marginRight: 8, marginBottom: 8 },
  detectedItemText: { color: 'white', marginLeft: 6, fontSize: 14 },
  complianceStatusContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', padding: 16, borderRadius: 8, marginBottom: 16 },
  statusIcon: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  compliantIcon: { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.3)' },
  nonCompliantIcon: { backgroundColor: 'rgba(244, 63, 94, 0.1)', borderWidth: 1, borderColor: 'rgba(244, 63, 94, 0.3)' },
  statusTextContainer: { flex: 1 },
  statusText: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  compliantText: { color: '#10b981' },
  nonCompliantText: { color: '#f43f5e' },
  routeText: { color: '#94a3b8', fontSize: 14 },
  issuesContainer: { marginBottom: 16 },
  issuesTitle: { fontSize: 16, fontWeight: '600', color: '#e2e8f0', marginBottom: 8 },
  issuesList: { backgroundColor: '#0f172a', borderRadius: 8, padding: 12 },
  issueItem: { flexDirection: 'row', marginBottom: 8, alignItems: 'flex-start' },
  issueIcon: { marginTop: 2, marginRight: 8 },
  issueText: { color: '#e2e8f0', flex: 1, lineHeight: 20 },
  recommendationsContainer: { marginBottom: 16 },
  recommendationsTitle: { fontSize: 16, fontWeight: '600', color: '#e2e8f0', marginBottom: 8 },
  recommendationsList: { backgroundColor: '#0f172a', borderRadius: 8, padding: 12 },
  recommendationItem: { flexDirection: 'row', marginBottom: 8, alignItems: 'flex-start' },
  recommendationIcon: { marginTop: 2, marginRight: 8 },
  recommendationText: { color: '#e2e8f0', flex: 1, lineHeight: 20 },
  shipmentDetailsContainer: { marginBottom: 16 },
  shipmentDetailsTitle: { fontSize: 16, fontWeight: '600', color: '#e2e8f0', marginBottom: 12 },
  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  detailItem: { width: '48%', backgroundColor: '#334155', padding: 12, borderRadius: 8, marginBottom: 8 },
  detailLabel: { fontSize: 12, color: '#94a3b8', marginBottom: 4 },
  detailValue: { fontSize: 14, color: 'white', fontWeight: '600' },
  chatButton: { flexDirection: 'row', backgroundColor: 'rgba(34, 211, 238, 0.1)', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 6, marginTop: 8 },
  chatButtonIcon: { marginRight: 8 },
  chatButtonText: { color: '#22d3ee', fontWeight: '600' },
  emptyStateCard: { backgroundColor: '#1e293b', borderRadius: 12, padding: 16, margin: 16, marginTop: 0, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  emptyStateContainer: { alignItems: 'center', padding: 24 },
  emptyStateIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(59, 130, 246, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  emptyStateTitle: { fontSize: 18, fontWeight: 'bold', color: 'white', marginBottom: 8, textAlign: 'center' },
  emptyStateText: { fontSize: 14, color: '#94a3b8', textAlign: 'center', lineHeight: 20 },
  updatesList: { paddingHorizontal: 8 },
  updateItem: { marginBottom: 16 },
  updateDate: { fontSize: 12, color: '#60a5fa', marginBottom: 4 },
  updateTitle: { fontSize: 14, fontWeight: '600', color: '#e2e8f0', marginBottom: 4 },
  updateText: { fontSize: 13, color: '#94a3b8', lineHeight: 18 },
  chartsCard: { backgroundColor: '#1e293b', borderRadius: 12, padding: 16, margin: 16, marginTop: 0, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  chartsTitle: { fontSize: 18, fontWeight: 'bold', color: 'white', marginBottom: 16 },
  chartContainer: { marginBottom: 24 },
  chartTitle: { fontSize: 16, fontWeight: '600', color: '#e2e8f0', marginBottom: 16, textAlign: 'center' },
  chartLegend: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', marginTop: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginRight: 16, marginBottom: 8 },
  legendColor: { width: 12, height: 12, borderRadius: 6, marginRight: 4 },
  legendText: { color: '#e2e8f0', fontSize: 12 },
  barChart: { marginVertical: 8, borderRadius: 16 },
  aboutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, margin: 16, marginTop: 0, borderRadius: 6 },
  aboutButtonIcon: { marginRight: 8 },
  aboutButtonText: { color: '#93c5fd', fontWeight: '600' },
  floatingButton: { position: 'absolute', right: 20, bottom: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3, elevation: 5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1e293b', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: 'white', marginBottom: 20, textAlign: 'center' },
  imageOptionsContainer: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 24 },
  imageOption: { alignItems: 'center' },
  imageOptionIcon: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  imageOptionText: { color: 'white', fontSize: 16 },
  modalCancelButton: { padding: 14, borderRadius: 6, backgroundColor: '#475569', alignItems: 'center' },
  modalCancelButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  pickerContainer: { backgroundColor: '#0f172a', borderRadius: 8, marginBottom: 20, paddingVertical: 4 },
  picker: { color: 'white' },
  pickerItem: { color: 'white' },
  modalConfirmButton: { padding: 14, borderRadius: 6, backgroundColor: '#3b82f6', alignItems: 'center', marginBottom: 12 },
  modalConfirmButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  chatModalContent: { backgroundColor: '#1e293b', borderTopLeftRadius: 16, borderTopRightRadius: 16, height: '80%', flex: 1 },
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#334155' },
  chatHeaderTitle: { flexDirection: 'row', alignItems: 'center' },
  chatHeaderText: { color: 'white', fontSize: 18, fontWeight: 'bold', marginLeft: 8 },
  chatMessageContainer: { flex: 1, padding: 16 },
  chatMessageContent: { paddingBottom: 16 },
  chatBubbleRow: { marginBottom: 12, flexDirection: 'row' },
  chatBubbleRowUser: { justifyContent: 'flex-end' },
  chatBubbleRowBot: { justifyContent: 'flex-start' },
  chatBubble: { maxWidth: '75%', padding: 12, borderRadius: 16 },
  chatBubbleUser: { backgroundColor: '#3b82f6', borderTopRightRadius: 4 },
  chatBubbleBot: { backgroundColor: '#334155', borderTopLeftRadius: 4 },
  chatTextUser: { color: 'white' },
  chatTextBot: { color: 'white' },
  chatInputContainer: { flexDirection: 'row', padding: 12, borderTopWidth: 1, borderTopColor: '#334155' },
  chatInput: { flex: 1, backgroundColor: '#0f172a', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, color: 'white', marginRight: 8 },
  chatSendButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center' },
  chatSendButtonDisabled: { backgroundColor: '#475569' },
  infoModalContent: { backgroundColor: '#1e293b', borderRadius: 16, padding: 20, margin: 20, maxHeight: '80%' },
  infoModalTitle: { fontSize: 20, fontWeight: 'bold', color: 'white', marginBottom: 16, textAlign: 'center' },
  infoScrollView: { marginBottom: 16 },
  infoText: { color: '#e2e8f0', fontSize: 15, lineHeight: 22, marginBottom: 16 },
  featureList: { marginBottom: 16 },
  featureItem: { flexDirection: 'row', marginBottom: 8 },
  featureBullet: { color: '#3b82f6', fontSize: 16, marginRight: 8, fontWeight: 'bold' },
  featureText: { color: '#e2e8f0', fontSize: 15, flex: 1, lineHeight: 22 },
  infoCloseButton: { backgroundColor: '#3b82f6', borderRadius: 6, padding: 14, alignItems: 'center' },
  infoCloseButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
});