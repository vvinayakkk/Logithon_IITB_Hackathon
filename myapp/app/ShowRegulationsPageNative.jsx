import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet, Modal, TextInput, Platform, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import WebView from 'react-native-webview';
import * as FileSystem from 'expo-file-system';
import { shareAsync } from 'expo-sharing';

// Add these utility functions
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

const ExportMenu = ({ visible, onClose, onExportCSV, onExportPDF }) => (
  <Modal
    visible={visible}
    transparent={true}
    animationType="fade"
    onRequestClose={onClose}
  >
    <TouchableOpacity 
      style={styles.menuOverlay} 
      activeOpacity={1} 
      onPress={onClose}
    >
      <View style={styles.menuContainer}>
        <TouchableOpacity 
          style={styles.menuItem} 
          onPress={() => {
            onClose();
            onExportCSV();
          }}
        >
          <Ionicons name="document-text-outline" size={24} color="#f8fafc" />
          <Text style={styles.menuItemText}>Export as CSV</Text>
        </TouchableOpacity>
        <View style={styles.menuDivider} />
        <TouchableOpacity 
          style={styles.menuItem} 
          onPress={() => {
            onClose();
            onExportPDF();
          }}
        >
          <Ionicons name="document-outline" size={24} color="#f8fafc" />
          <Text style={styles.menuItemText}>Export as PDF</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  </Modal>
);

const ShowRegulations = () => {
  // Update API URL with explicit protocol and port
  const API_URL ='https://saved-jackal-brief.ngrok-free.app/api/chat'  // For Android
  const BACKEND_URL="https://free-horribly-perch.ngrok-free.app"

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
  const [isTyping, setIsTyping] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

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
        console.log(data);
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

  const parseMarkdownText = (text) => {
    // Split by new lines first to handle bullet points
    const lines = text.split('\n');
    
    return lines.map((line, lineIndex) => {
      // Handle bullet points at the start of lines
      if (line.trim().match(/^[*-]\s/)) {
        return (
          <View key={lineIndex} style={styles.bulletItemChat}>
            <Text style={styles.bulletPointChat}>•</Text>
            <View style={styles.bulletTextChat}>
              {parseInlineMarkdown(line.replace(/^[*-]\s/, ''))}
            </View>
          </View>
        );
      }
      
      return (
        <View key={lineIndex} style={styles.lineContainer}>
          {parseInlineMarkdown(line)}
        </View>
      );
    });
  };

  const parseInlineMarkdown = (text) => {
    const parts = text.split(/((?:\*\*|__)[^*_]+(?:\*\*|__)|(?:\*|_)[^*_]+(?:\*|_)|\[[^\]]+\]\([^)]+\)|:\s+)/).filter(Boolean);
    
    return parts.map((part, index) => {
      if (part.match(/^(?:\*\*|__).+(?:\*\*|__)$/)) {
        return (
          <Text key={index} style={styles.boldText}>
            {part.replace(/^(?:\*\*|__)|(?:\*\*|__)$/g, '')}
          </Text>
        );
      }
      if (part.match(/^(?:\*|_).+(?:\*|_)$/)) {
        return (
          <Text key={index} style={styles.italicText}>
            {part.replace(/^(?:\*|_)|(?:\*|_)$/g, '')}
          </Text>
        );
      }
      if (part.match(/^\[.*\]\(.*\)$/)) {
        const [_, text] = part.match(/\[(.*)\]/);
        return (
          <Text key={index} style={styles.linkText}>
            {text}
          </Text>
        );
      }
      return part ? <Text key={index} style={styles.messageText}>{part}</Text> : null;
    });
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
              const cleanText = item.trim().replace(/^[-*•]\s*/, '');
              
              return (
                <View key={index} style={styles.bulletItem}>
                  <Text style={styles.bulletPoint}>•</Text>
                  <View style={styles.textContainer}>
                    {parseMarkdownText(cleanText)}
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
    setUserInput('');
    setIsTyping(true);
    
    try {
      console.log('Sending request to:', API_URL); // Debug log

      const response = await fetch('https://free-horribly-perch.ngrok-free.app/api/chat', {
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
          text: data.message,
          isMarkdown: true
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
    } finally {
      setIsTyping(false);
    }
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

  // Add typing animation component
  const TypingAnimation = () => (
    <View style={styles.typingContainer}>
      <View style={styles.typingDot} />
      <View style={styles.typingDot} />
      <View style={styles.typingDot} />
    </View>
  );

  // Update renderChatbot to include a safe area for bottom devices
  const renderChatbot = () => (
    <Modal
      visible={chatbotOpen}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setChatbotOpen(false)}
    >
      <View style={styles.modalContainer}>
        <TouchableOpacity 
          style={styles.modalOverlay}
          onPress={() => setChatbotOpen(false)}
        />
        <View style={styles.chatContainer}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatTitle}>Regulation Assistant</Text>
            <TouchableOpacity onPress={() => setChatbotOpen(false)}>
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.chatMessages}
            contentContainerStyle={styles.chatMessagesContent}
            ref={scrollViewRef => {
              if (scrollViewRef) {
                scrollViewRef.scrollToEnd({ animated: true });
              }
            }}
          >
            {chatMessages.map((msg, i) => (
              <View
                key={i}
                style={[
                  styles.messageContainer,
                  msg.sender === 'user' ? styles.userMessageContainer : styles.botMessageContainer
                ]}
              >
                <View
                  style={[
                    styles.messageBubble,
                    msg.sender === 'user' ? styles.userBubble : styles.botBubble
                  ]}
                >
                  {msg.isMarkdown ? (
                    <View style={styles.markdownContainer}>
                      <Text style={styles.messageText}>
                        {parseMarkdownText(msg.text)}
                      </Text>
                    </View>
                  ) : (
                    <Text style={[
                      styles.messageText,
                      msg.sender === 'user' ? styles.userText : styles.botText
                    ]}>
                      {msg.text}
                    </Text>
                  )}
                </View>
              </View>
            ))}
            {isTyping && (
              <View style={styles.botMessageContainer}>
                <View style={[styles.messageBubble, styles.botBubble]}>
                  <TypingAnimation />
                </View>
              </View>
            )}
          </ScrollView>

          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={userInput}
                onChangeText={setUserInput}
                placeholder="Ask about these regulations..."
                placeholderTextColor="#9CA3AF"
                multiline={false}
                returnKeyType="send"
                onSubmitEditing={handleChatSubmit}
              />
            </View>
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

  // Add export functions
  const exportToCSV = async () => {
    if (regulations.length === 0) {
      Alert.alert('No Data', 'There are no regulations to export.');
      return;
    }

    let csvContent = "Section,Content,Simplified Form\n";
    
    regulations.forEach(regulation => {
      csvContent += `"${regulation.Section}","${regulation.Content.replace(/"/g, '""')}","${(regulation['Simplified Form'] || []).join('; ').replace(/"/g, '""')}"\n`;
    });

    const filename = `${source}_to_${destination}_regulations_${Date.now()}.csv`;
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
    if (regulations.length === 0) {
      Alert.alert('No Data', 'There are no regulations to export.');
      return;
    }

    try {
      const filename = `${source}_to_${destination}_regulations_${Date.now()}.pdf`;
      
      // Format the data according to the server's expected structure
      const exportData = encodeURIComponent(JSON.stringify({
        title: `Regulations: ${source} to ${destination}`,
        source: source,
        destination: destination,
        sections: regulations.map(reg => ({
          title: reg.Section,
          content: reg.Content,
          simplified: reg['Simplified Form'] || []
        }))
      }));
      
      console.log("Sending data:", decodeURIComponent(exportData)); // Debug log
      
      const result = await FileSystem.downloadAsync(
        `${BACKEND_URL}/generate-pdf?data=${exportData}`,
        FileSystem.documentDirectory + filename
      );
      
      if (result.status !== 200) {
        throw new Error('Failed to download PDF');
      }
      
      save(result.uri, filename, 'application/pdf');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      Alert.alert('Error', 'Failed to download PDF report.');
    }
  };

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
          <TouchableOpacity 
            style={styles.exportButton} 
            onPress={() => setMenuVisible(true)}
          >
            <Ionicons name="download-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <Text style={styles.routeText}>
          {source} to {destination}
        </Text>
      </View>

      <ExportMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onExportCSV={exportToCSV}
        onExportPDF={downloadPdf}
      />

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a', // Darker background
  },
  header: {
    backgroundColor: '#1e3a8a', // Darker blue
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
    color: '#f8fafc', // Light text
  },
  routeText: {
    color: '#cbd5e1', // Slightly dimmed text
    fontSize: 18,
    marginTop: 8,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#f8fafc',
    marginLeft: 8,
    fontSize: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 16,
    backgroundColor: '#1e293b', // Dark blue-gray background
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  sectionHeader: {
    padding: 16,
    backgroundColor: '#2563eb', // Bright blue
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionHeaderOpen: {
    backgroundColor: '#1e40af', // Darker blue when open
  },
  sectionHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  sectionContent: {
    padding: 16,
  },
  simplifiedContent: {
    backgroundColor: '#1e293b', // Dark blue-gray
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  simplifiedTitle: {
    color: '#60a5fa', // Lighter blue
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
    backgroundColor: '#334155', // Dark slate
    padding: 8,
    borderRadius: 6,
  },
  toggleButtonText: {
    color: '#e2e8f0', // Light gray
    marginLeft: 8,
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb', // Bright blue
    padding: 8,
    borderRadius: 6,
    marginLeft: 8,
  },
  chatButtonText: {
    color: '#f8fafc',
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end', // Align to bottom
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
  },
  chatContainer: {
    height: '90%', // Increased from 80%
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    paddingBottom: Platform.OS === 'ios' ? 20 : 0, // Safe area for iOS
  },
  chatHeader: {
    backgroundColor: '#1e40af', // Dark blue
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '600',
  },
  messageContainer: {
    marginVertical: 4,
    paddingHorizontal: 8,
    width: '100%',
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  botMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '85%',
    padding: 12,
    borderRadius: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  markdownContainer: {
    flex: 1,
    flexDirection: 'column',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#f8fafc',
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: '#334155',
    padding: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: '#334155',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 4,
    minHeight: 48,
  },
  input: {
    color: '#f8fafc',
    fontSize: 16,
    paddingVertical: 8,
    paddingRight: 8,
  },
  sendButton: {
    backgroundColor: '#2563eb',
    borderRadius: 24,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userBubble: {
    backgroundColor: '#2563eb',
    borderBottomRightRadius: 4,
    alignSelf: 'flex-end',
  },
  botBubble: {
    backgroundColor: '#334155',
    borderBottomLeftRadius: 4,
    alignSelf: 'flex-start',
  },
  userText: {
    color: '#ffffff',
  },
  botText: {
    color: '#f8fafc',
  },
  typingContainer: {
    flexDirection: 'row',
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#60A5FA',
    marginHorizontal: 2,
    opacity: 0.6,
    transform: [{ scale: 0.9 }],
    animationName: 'typing',
    animationDuration: '1s',
    animationIterationCount: 'infinite',
  },
  chatMessages: {
    flex: 1,
    width: '100%',
  },
  chatMessagesContent: {
    flexGrow: 1,
    paddingVertical: 16,
    width: '100%',
  },
  contentContainer: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 8,
  },
  bulletItem: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingRight: 8,
  },
  bulletPoint: {
    color: '#60a5fa',
    marginRight: 8,
    fontSize: 16,
    lineHeight: 24,
  },
  textContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
  regularText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#f8fafc',
    flexShrink: 1,
  },
  boldText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#60a5fa',
    fontWeight: '700',
  },
  italicText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#f8fafc',
    fontStyle: 'italic',
  },
  linkText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#3b82f6',
    textDecorationLine: 'underline',
  },
  colonText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#94a3b8',
    flexShrink: 1,
  },
  scrollContent: {
    padding: 16,
  },
  lineBreak: {
    marginVertical: 8,
  },
  lineContainer: {
    marginBottom: 8,
  },
  bulletItemChat: {
    flexDirection: 'row',
    marginBottom: 4,
    paddingRight: 8,
    width: '100%',
  },
  bulletPointChat: {
    color: '#60a5fa',
    marginRight: 8,
    fontSize: 16,
    lineHeight: 24,
  },
  bulletTextChat: {
    flex: 1,
    paddingRight: 8,
  },
  exportButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#3b82f6',
    marginLeft: 8,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 8,
    minWidth: 200,
    marginHorizontal: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuItemText: {
    color: '#f8fafc',
    fontSize: 16,
    marginLeft: 12,
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#334155',
    marginHorizontal: 8,
  },
});

export default ShowRegulations;
