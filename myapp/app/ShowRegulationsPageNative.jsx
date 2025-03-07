import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet, Modal, TextInput, Platform } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import WebView from 'react-native-webview';

// Import your JSON data
import regulationsData from '../assets/regulations/china_to_india.json';

const ShowRegulations = () => {
  // Update API URL to use your computer's IP address when testing on physical device
  const API_URL = "http://192.168.80.60:5000/api/chat"

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

  useEffect(() => {
    try {
      // Set the regulations data directly
      setRegulations(regulationsData);
      setLoading(false);
    } catch (err) {
      setError('Could not load regulations data');
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

  const formatHtmlContent = (content) => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
          <style>
            html, body {
              margin: 0;
              padding: 16px;
              font-family: -apple-system, system-ui;
              font-size: 16px;
              line-height: 1.5;
              color: #1F2937;
              height: auto;
              overflow-y: auto;
              -webkit-overflow-scrolling: touch;
            }
            .bullet-point {
              margin-bottom: 16px;
              padding-left: 24px;
              position: relative;
            }
            .bullet-point:before {
              content: "•";
              position: absolute;
              left: 8px;
              color: #3B82F6;
            }
            strong { color: #1E40AF; }
            a { color: #3B82F6; }
          </style>
        </head>
        <body>
          <div id="content">
            ${content}
          </div>
          <script>
            // Notify parent of content height
            window.ReactNativeWebView.postMessage(document.documentElement.scrollHeight);
          </script>
        </body>
      </html>
    `;
  };

  const renderContent = (content, isSimplified) => {
    if (isSimplified) {
      const formattedContent = content.map(item => {
        // Convert markdown to HTML while preserving bullet points and bold text
        return item
          .replace(/^\s*-\s*/, '<div class="bullet-point">')
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
          + '</div>';
      }).join('');

      return (
        <View style={{ height: 400 }}>
          <WebView
            source={{ html: formatHtmlContent(formattedContent) }}
            style={{ flex: 1, height: '100%' }}
            scrollEnabled={true}
            showsVerticalScrollIndicator={true}
            bounces={false}
            originWhitelist={['*']}
            onMessage={(event) => {
              const height = parseInt(event.nativeEvent.data);
              // Optional: Update WebView height based on content
              console.log('Content height:', height);
            }}
          />
        </View>
      );
    }

    return (
      <View style={{ height: 400 }}>
        <WebView
          source={{ html: formatHtmlContent(content) }}
          style={{ flex: 1, height: '100%' }}
          scrollEnabled={true}
          showsVerticalScrollIndicator={true}
          bounces={false}
        />
      </View>
    );
  };

  const handleChatSubmit = async () => {
    if (!userInput.trim()) return;

    const newUserMessage = { sender: 'user', text: userInput };
    setChatMessages(prev => [...prev, newUserMessage]);
    
    try {
      const currentRegulation = regulations[currentSection];
      const context = currentRegulation?.['Simplified Form']?.join('\n') || currentRegulation?.Content;

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          query: userInput,
          context: context,
          section: currentRegulation?.Section || ''
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setChatMessages(prev => [...prev, { 
          sender: 'bot', 
          text: data.message 
        }]);
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (err) {
      console.error('Chat error:', err);
      setChatMessages(prev => [...prev, { 
        sender: 'bot', 
        text: 'Sorry, I encountered an error. Please try again.' 
      }]);
    }
    
    setUserInput('');
  };

  // Add openChatbot function
  const openChatbot = (index) => {
    setCurrentSection(index);
    setChatbotOpen(true);
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
});

// Merge the new styles with existing ones
const styles = StyleSheet.create({
  ...existingStyles,
  ...additionalStyles,
});

export default ShowRegulations;
