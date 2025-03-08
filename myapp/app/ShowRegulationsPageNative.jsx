import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet, Modal, TextInput, Platform } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import WebView from 'react-native-webview';
// Import all JSON files explicitly
import australia_to_india from '../assets/regulations/australia_to_india.json';
import brazil_to_india from '../assets/regulations/brazil_to_india.json';
import canada_to_india from '../assets/regulations/canada_to_india.json';
import china_to_india from '../assets/regulations/china_to_india.json';
import france_to_india from '../assets/regulations/france_to_india.json';
import germany_to_india from '../assets/regulations/germany_to_india.json';
import india_to_australia from '../assets/regulations/india_to_australia.json';
import india_to_brazil from '../assets/regulations/india_to_brazil.json';
import india_to_canada from '../assets/regulations/india_to_canada.json';
import india_to_china from '../assets/regulations/india_to_china.json';
import india_to_france from '../assets/regulations/india_to_france.json';
import india_to_germany from '../assets/regulations/india_to_germany.json';
import india_to_italy from '../assets/regulations/india_to_italy.json';
import india_to_japan from '../assets/regulations/india_to_japan.json';
import india_to_malaysia from '../assets/regulations/india_to_malaysia.json';
import india_to_mexico from '../assets/regulations/india_to_mexico.json';
import india_to_netherlands from '../assets/regulations/india_to_netherlands.json';
import india_to_saudi_arabia from '../assets/regulations/india_to_saudi_arabia.json';
import india_to_singapore from '../assets/regulations/india_to_singapore.json';
import india_to_south_africa from '../assets/regulations/india_to_south_africa.json';
import india_to_south_korea from '../assets/regulations/india_to_south_korea.json';
import india_to_thailand from '../assets/regulations/india_to_thailand.json';
import india_to_united_arab_emirates from '../assets/regulations/india_to_united_arab_emirates.json';
import india_to_united_kingdom from '../assets/regulations/india_to_united_kingdom.json';
import india_to_united_states from '../assets/regulations/india_to_united_states.json';
import italy_to_india from '../assets/regulations/italy_to_india.json';
import japan_to_india from '../assets/regulations/japan_to_india.json';
import malaysia_to_india from '../assets/regulations/malaysia_to_india.json'; 
import mexico_to_india from '../assets/regulations/mexico_to_india.json'
import netherlands_to_india from '../assets/regulations/netherlands_to_india.json'
import saudi_arabia_to_india from '../assets/regulations/saudi_arabia_to_india.json'
import singapore_to_india from '../assets/regulations/singapore_to_india.json'
import south_africa_to_india from '../assets/regulations/south_africa_to_india.json'
import south_korea_to_india from '../assets/regulations/south_korea_to_india.json'
import thailand_to_india from '../assets/regulations/thailand_to_india.json'
import united_arab_emirates_to_india from '../assets/regulations/united_arab_emirates_to_india.json'
import united_kingdom_to_india from '../assets/regulations/united_kingdom_to_india.json'
import united_states_to_india from '../assets/regulations/united_states_to_india.json'

// Add any other JSON files here

// Create a regulations map with all JSON files
const regulationsMap = {
  'australia_to_india': australia_to_india,
  'brazil_to_india': brazil_to_india,
  'canada_to_india': canada_to_india,
  'china_to_india': china_to_india,
  'france_to_india': france_to_india,
  'germany_to_india': germany_to_india,
  'india_to_australia': india_to_australia,
  'india_to_brazil': india_to_brazil,
  'india_to_canada': india_to_canada,
  'india_to_china': india_to_china,
  'india_to_france': india_to_france,
  'india_to_germany': india_to_germany,
  'india_to_italy': india_to_italy,
  'india_to_japan': india_to_japan,
  'india_to_malaysia': india_to_malaysia,
  'india_to_mexico': india_to_mexico,
  'india_to_netherlands': india_to_netherlands,
  'india_to_saudi_arabia': india_to_saudi_arabia,
  'india_to_singapore': india_to_singapore,
  'india_to_south_africa': india_to_south_africa,
  'india_to_south_korea': india_to_south_korea,
  'india_to_thailand': india_to_thailand,
  'india_to_united_arab_emirates': india_to_united_arab_emirates,
  'india_to_united_kingdom': india_to_united_kingdom,
  'india_to_united_states': india_to_united_states,
  'italy_to_india': italy_to_india,
  'japan_to_india': japan_to_india,
  'malaysia_to_india': malaysia_to_india,
  'mexico_to_india': mexico_to_india,
  'netherlands_to_india': netherlands_to_india,
  'saudi_arabia_to_india': saudi_arabia_to_india,
  'singapore_to_india': singapore_to_india,
  'south_africa_to_india': south_africa_to_india,
  'south_korea_to_india': south_korea_to_india,
  'thailand_to_india': thailand_to_india,
  'united_arab_emirates_to_india': united_arab_emirates_to_india,
  'united_kingdom_to_india': united_kingdom_to_india,
  'united_states_to_india': united_states_to_india
};

const ShowRegulations = () => {
  // Update API URL with explicit protocol and port
  const API_URL ='http://192.168.80.60:6001/api/chat'  // For Android

  const { source, destination } = useLocalSearchParams();
  const [regulations, setRegulations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openSections, setOpenSections] = useState({});
  const [showSimplified, setShowSimplified] = useState({});
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [currentSection, setCurrentSection] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [chatId, setChatId] = useState(null);

  useEffect(() => {
    try {
      // Normalize the source and destination to lowercase and remove spaces
      const normalizedSource = source?.toLowerCase().replace(/\s+/g, '_') || '';
      const normalizedDestination = destination?.toLowerCase().replace(/\s+/g, '_') || '';
      
      // Create the lookup key in the format source_to_destination
      const lookupKey = `${normalizedSource}_to_${normalizedDestination}`;
      
      // Try to get the matching JSON data
      const data = regulationsMap[lookupKey];
      
      if (data) {
        setRegulations(data);
        setLoading(false);
      } else {
        // If no match is found, try alternative keys or throw an error
        const alternativeKeys = Object.keys(regulationsMap).filter(key => 
          key.startsWith(normalizedSource) && key.includes(normalizedDestination)
        );
        
        if (alternativeKeys.length > 0) {
          // Use the first alternative match
          setRegulations(regulationsMap[alternativeKeys[0]]);
          setLoading(false);
        } else {
          throw new Error(`Could not find regulations for ${source} to ${destination}`);
        }
      }
    } catch (err) {
      console.error('Error loading regulations:', err);
      setError(`Could not load regulations data for ${source} to ${destination}. ${err.message}`);
      setLoading(false);
    }
  }, [source, destination]);


  const toggleSection = (index) => {
    setOpenSections(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const toggleSimplifiedView = (index) => {
    setShowSimplified(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Function to convert markdown to plain text
  const markdownToPlainText = (markdown) => {
    // Remove markdown symbols for bold
    let text = markdown.replace(/\*\*/g, '');
    // Remove markdown symbols for links
    text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
    return text;
  };

  const renderContent = (content, isSimplified) => {
    if (isSimplified) {
      return (
        <View style={styles.contentContainer}>
          <ScrollView 
            style={styles.scrollContent}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
          >
            {content.map((item, index) => {
              // Split the text into parts (main text and colon-separated parts)
              const parts = item
                .replace(/^\s*-\s*/, '') // Remove bullet points
                .split(/(?=:)/) // Split before colons but keep them

              return (
                <View key={index} style={styles.bulletItem}>
                  <Text style={styles.bulletPoint}>•</Text>
                  <View style={styles.textContent}>
                    {parts.map((part, partIndex) => (
                      <View key={partIndex} style={styles.textPart}>
                        {part.split(/(\*\*.*?\*\*|\[.*?\]\(.*?\))/).map((segment, i) => {
                          if (segment.startsWith('**') && segment.endsWith('**')) {
                            // Bold text
                            return (
                              <Text key={i} style={styles.boldText}>
                                {segment.replace(/\*\*/g, '')}
                              </Text>
                            );
                          } else if (segment.match(/\[(.*?)\]\((.*?)\)/)) {
                            // Link text
                            const [_, text] = segment.match(/\[(.*?)\]/);
                            return (
                              <Text key={i} style={styles.linkText}>
                                {text}
                              </Text>
                            );
                          } else if (segment.startsWith(':')) {
                            // Format colon segments
                            return (
                              <Text key={i} style={styles.regularText}>
                                {segment.trim()}
                              </Text>
                            );
                          }
                          // Regular text
                          return segment ? (
                            <Text key={i} style={styles.regularText}>
                              {segment}
                            </Text>
                          ) : null;
                        })}
                      </View>
                    ))}
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>
      );
    }

    // Regular content with improved formatting
    return (
      <View style={styles.contentContainer}>
        <ScrollView 
          style={styles.scrollContent}
          showsVerticalScrollIndicator={true}
          nestedScrollEnabled={true}
        >
          {content.split('\n').map((line, index) => (
            <Text key={index} style={[
              styles.regularText,
              line.trim().length === 0 && styles.lineBreak
            ]}>
              {line}
            </Text>
          ))}
        </ScrollView>
      </View>
    );
  };

  const handleChatSubmit = async () => {
    if (!userInput.trim()) return;

    const newUserMessage = { sender: 'user', text: userInput };
    setChatMessages(prev => [...prev, newUserMessage]);
    
    try {
      console.log('Sending request to:', API_URL); // Debug log

      const response = await fetch('http://192.168.80.60:6001/api/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          query: userInput,
          context: regulations[currentSection]?.['Simplified Form']?.join('\n') || regulations[currentSection]?.Content,
          section: regulations[currentSection]?.Section,
          chat_id: chatId // Send existing chat_id if any
        }),
        // Add timeout and credentials
        timeout: 10000,
        credentials: 'omit'
      });

      console.log('Response status:', response.status); // Debug log

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Response data:', data); // Debug log
      
      if (data.success) {
        // Store chat_id for subsequent messages
        if (!chatId && data.chat_id) {
          setChatId(data.chat_id);
        }

        setChatMessages(prev => [...prev, { 
          sender: 'bot', 
          text: data.message 
        }]);
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (err) {
      console.error('Chat error details:', err); // Detailed error log
      const errorMessage = err.message || 'Network error. Please check your connection.';
      setChatMessages(prev => [...prev, { 
        sender: 'bot', 
        text: `Error: ${errorMessage}. Please try again.`
      }]);
    }
    
    setUserInput('');
  };

  // Add openChatbot function
  const openChatbot = (index) => {
    setCurrentSection(index);
    setChatbotOpen(true);
    setChatId(null); // Reset chat_id for new conversation
    // Add initial message
    setChatMessages([
      { sender: 'bot', text: 'Hello! How can I help you understand these regulations?' }
    ]);
  };

  // Add Chatbot component
  const renderChatbot = () => (
    <Modal
      visible={chatbotOpen}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setChatbotOpen(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.chatContainer}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatTitle}>Regulation Assistant</Text>
            <TouchableOpacity onPress={() => setChatbotOpen(false)}>
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.chatMessages}>
            {chatMessages.map((msg, i) => (
              <View
                key={i}
                style={[
                  styles.messageContainer,
                  msg.sender === 'user' ? styles.userMessage : styles.botMessage
                ]}
              >
                <Text style={msg.sender === 'user' ? styles.userText : styles.botText}>
                  {msg.text}
                </Text>
              </View>
            ))}
          </ScrollView>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={userInput}
              onChangeText={setUserInput}
              placeholder="Ask about these regulations..."
              placeholderTextColor="#9CA3AF"
            />
            <TouchableOpacity
              style={styles.sendButton}
              onPress={handleChatSubmit}
            >
              <Ionicons name="send" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => router.back()}
        >
          <Text style={styles.buttonText}>Back to Search</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Country Regulations</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.routeText}>
          {source} to {destination}
        </Text>
      </View>

      {/* Main Content */}
      <ScrollView style={styles.content}>
        {regulations.map((regulation, index) => (
          <View key={index} style={styles.section}>
            <TouchableOpacity
              style={[
                styles.sectionHeader,
                openSections[index] && styles.sectionHeaderOpen
              ]}
              onPress={() => toggleSection(index)}
            >
              <View style={styles.sectionHeaderContent}>
                <Text style={styles.sectionTitle}>{regulation.Section}</Text>
                {regulation['Info About Section Header'] && (
                  <TouchableOpacity>
                    <Ionicons name="information-circle" size={24} color="white" />
                  </TouchableOpacity>
                )}
              </View>
              <Ionicons 
                name={openSections[index] ? "chevron-up" : "chevron-down"} 
                size={24} 
                color="white" 
              />
            </TouchableOpacity>

            {openSections[index] && (
              <View style={styles.sectionContent}>
                {showSimplified[index] && regulation['Simplified Form'] ? (
                  <View style={styles.simplifiedContent}>
                    <Text style={styles.simplifiedTitle}>Simplified Explanation</Text>
                    {renderContent(regulation['Simplified Form'], true)}
                  </View>
                ) : (
                  renderContent(regulation.Content, false)
                )}

                <View style={styles.buttonContainer}>
                  {regulation['Simplified Form'] && (
                    <TouchableOpacity
                      style={styles.toggleButton}
                      onPress={() => toggleSimplifiedView(index)}
                    >
                      <Ionicons name="document-text" size={20} color="#4B5563" />
                      <Text style={styles.toggleButtonText}>
                        {showSimplified[index] ? 'Show Original' : 'Show Simplified'}
                      </Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.chatButton}
                    onPress={() => openChatbot(index)}
                  >
                    <Ionicons name="chatbubble-ellipses" size={20} color="white" />
                    <Text style={styles.chatButtonText}>Ask Questions</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
      {renderChatbot()}
    </View>
  );
};

const existingStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    backgroundColor: '#1E40AF',
    padding: 16,
    paddingTop: 48,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  routeText: {
    color: 'white',
    fontSize: 18,
    marginTop: 8,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    color: 'white',
    marginLeft: 8,
    fontSize: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    padding: 16,
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionHeaderOpen: {
    backgroundColor: '#1E40AF',
  },
  sectionHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  sectionContent: {
    padding: 16,
  },
  simplifiedContent: {
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 8,
  },
  simplifiedTitle: {
    color: '#1E40AF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 8,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5E7EB',
    padding: 8,
    borderRadius: 6,
  },
  toggleButtonText: {
    color: '#4B5563',
    marginLeft: 8,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#EF4444',
    marginBottom: 16,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#3B82F6',
    padding: 12,
    borderRadius: 6,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
  contentText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1F2937',
    marginBottom: 12,
  },
});

const additionalStyles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  chatContainer: {
    height: '75%',
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  chatHeader: {
    backgroundColor: '#1E40AF',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  chatMessages: {
    flex: 1,
    padding: 16,
  },
  messageContainer: {
    marginBottom: 12,
    maxWidth: '80%',
  },
  userMessage: {
    alignSelf: 'flex-end',
  },
  botMessage: {
    alignSelf: 'flex-start',
  },
  userText: {
    backgroundColor: '#1E40AF',
    color: 'white',
    padding: 12,
    borderRadius: 16,
    borderBottomRightRadius: 4,
  },
  botText: {
    backgroundColor: '#F3F4F6',
    color: '#1F2937',
    padding: 12,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  input: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 24,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: '#1E40AF',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E40AF',
    padding: 8,
    borderRadius: 6,
    marginLeft: 8,
  },
  chatButtonText: {
    color: 'white',
    marginLeft: 8,
  },
  webviewContainer: {
    height: 400,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  webviewInner: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
  },
  contentContainer: {
    height: 400,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    overflow: 'hidden',
  },
  scrollContent: {
    flex: 1,
    padding: 16,
  },
  bulletItem: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingRight: 16,
  },
  bulletPoint: {
    color: '#3B82F6',
    marginRight: 8,
    fontSize: 16,
    lineHeight: 24,
  },
  contentText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: '#1F2937',
  },
  textContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  boldText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1E40AF',
    fontWeight: 'bold',
  },
  textContent: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  regularText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1F2937',
  },
  linkText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#3B82F6',
    textDecorationLine: 'underline',
  },
  textPart: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 4,
  },
  lineBreak: {
    marginVertical: 8,
  },
  regularText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1F2937',
  },
  boldText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1E40AF',
    fontWeight: '700',
  },
  linkText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#3B82F6',
    textDecorationLine: 'underline',
  }
});

// Merge the new styles with existing ones
const styles = StyleSheet.create({
  ...existingStyles,
  ...additionalStyles,
});

export default ShowRegulations;
