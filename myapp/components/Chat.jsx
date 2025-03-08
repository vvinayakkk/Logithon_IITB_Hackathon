import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, useColorScheme } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { FadeInRight, FadeInLeft } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const ChatTab = () => {
  const [messages, setMessages] = useState([
    { role: 'system', content: "Hello! I'm your shipping compliance assistant. How can I help you today?" },
  ]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef();
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
    userBubble: isDark ? '#3B82F6' : '#2563EB',
    systemBubble: isDark ? '#2A2A2A' : '#F0F2F5',
    inputBg: isDark ? '#2A2A2A' : '#FFFFFF',
    border: isDark ? '#333333' : '#E5E7EB',
  };

  useEffect(() => {
    if (messages.length > 1) {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!currentMessage.trim()) return;
    setLoading(true);
    const newMessages = [...messages, { role: 'user', content: currentMessage }];
    setMessages(newMessages);
    setCurrentMessage('');

    try {
      const response = await fetch(`${BACKEND_URL}:5000/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: currentMessage,
          chat_history: newMessages,
        }),
      });
      const data = await response.json();
      setMessages([...newMessages, { role: 'system', content: data.response }]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages([
        ...newMessages,
        { role: 'system', content: "Sorry, I couldn't connect to the server. Please try again later." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1, padding: 16 }}>
          {/* Header */}
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            marginBottom: 16,
            paddingBottom: 12,
            borderBottomWidth: 1,
            borderBottomColor: theme.border
          }}>
            <View style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: theme.primary,
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 12
            }}>
              <Icon name="truck-delivery" size={20} color="#FFFFFF" />
            </View>
            <View>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.text }}>
                Shipping Assistant
              </Text>
              <Text style={{ fontSize: 12, color: theme.subtext }}>
                {loading ? 'Typing...' : 'Online'}
              </Text>
            </View>
          </View>

          {/* Messages */}
          <ScrollView
            ref={scrollViewRef}
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 8 }}
            showsVerticalScrollIndicator={false}
          >
            {messages.map((msg, index) => {
              const isUser = msg.role === 'user';
              return (
                <Animated.View
                  key={index}
                  entering={isUser ? FadeInRight : FadeInLeft}
                  style={{
                    alignSelf: isUser ? 'flex-end' : 'flex-start',
                    marginBottom: 12,
                    maxWidth: '80%',
                  }}
                >
                  <View
                    style={{
                      backgroundColor: isUser ? theme.userBubble : theme.systemBubble,
                      borderRadius: 18,
                      padding: 12,
                      borderTopLeftRadius: !isUser ? 4 : 18,
                      borderTopRightRadius: isUser ? 4 : 18,
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: isDark ? 0.2 : 0.1,
                      shadowRadius: 2,
                      elevation: 2,
                    }}
                  >
                    <Text style={{ 
                      color: isUser ? '#FFFFFF' : theme.text,
                      fontSize: 15,
                      lineHeight: 22,
                    }}>
                      {msg.content}
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontSize: 10,
                      color: theme.subtext,
                      marginTop: 4,
                      alignSelf: isUser ? 'flex-end' : 'flex-start',
                      marginHorizontal: 4,
                    }}
                  >
                    {formatTime()}
                  </Text>
                </Animated.View>
              );
            })}
            {loading && (
              <View style={{
                alignSelf: 'flex-start',
                backgroundColor: theme.systemBubble,
                borderRadius: 18,
                padding: 12,
                borderTopLeftRadius: 4,
                marginBottom: 12,
              }}>
                <ActivityIndicator size="small" color={theme.primary} />
              </View>
            )}
          </ScrollView>

          {/* Input Area */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 8,
            backgroundColor: theme.inputBg,
            borderRadius: 24,
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderWidth: 1,
            borderColor: theme.border,
          }}>
            <TextInput
              style={{
                flex: 1,
                color: theme.text,
                fontSize: 16,
                paddingVertical: 8,
              }}
              placeholder="Ask about shipping compliance..."
              placeholderTextColor={theme.placeholder}
              value={currentMessage}
              onChangeText={setCurrentMessage}
              multiline
              maxHeight={100}
            />
            <TouchableOpacity
              style={{
                backgroundColor: currentMessage.trim() ? theme.primary : theme.subtext,
                borderRadius: 20,
                width: 40,
                height: 40,
                alignItems: 'center',
                justifyContent: 'center',
                marginLeft: 8,
              }}
              onPress={handleSendMessage}
              disabled={loading || !currentMessage.trim()}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Icon name="send" size={18} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatTab;