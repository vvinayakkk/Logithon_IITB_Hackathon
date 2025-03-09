import React, { useState, useEffect } from 'react';
import { Package, Search, AlertTriangle, Check, X, Globe, Map, Truck, HelpCircle, RefreshCw, Layers, MessageSquare, ShieldAlert, Clock, Plus, Download, Share2 } from 'lucide-react';
import { CSVLink } from 'react-csv';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

import Header from '../components/header';
import axios from 'axios';

const Restrictions = () => {
  const [countries, setCountries] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [itemName, setItemName] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('country');
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [sharing, setSharing] = useState(false);

  // Chat-related states
  const [chatHistory, setChatHistory] = useState([
    {
      id: 1,
      title: 'Previous Chat - March 5',
      messages: [
        { role: 'system', content: 'Hello! How can I help with shipping compliance today?' },
        { role: 'user', content: 'Can I ship electronics to Japan?' },
        {
          role: 'system',
          content:
            'Electronics are generally allowed to be shipped to Japan, but certain electronic devices might require certification or have restrictions. Specifically, wireless devices and communications equipment might need technical conformity certification.',
        },
      ],
    },
    {
      id: 2,
      title: 'Previous Chat - March 7',
      messages: [
        { role: 'system', content: 'Welcome back! How can I assist with shipping regulations?' },
        { role: 'user', content: 'What items are prohibited in Australia?' },
        {
          role: 'system',
          content:
            'Australia prohibits several items including: firearms and ammunition, narcotics and illegal drugs, counterfeit credit cards, pornographic material, hazardous waste, protected wildlife species, certain agricultural products, and tobacco in excess of allowance.',
        },
      ],
    },
  ]);

  const [activeChatId, setActiveChatId] = useState(0);
  const [chatMessages, setChatMessages] = useState([
    { role: 'system', content: "Hello! I'm your shipping compliance assistant. How can I help you today?", color: 'text-white' },
  ]);
  const [currentMessage, setCurrentMessage] = useState('');

  // Model initialization states
  const [modelInitialized, setModelInitialized] = useState(false);
  const [initializing, setInitializing] = useState(false);

  // Fetch countries on component mount
  useEffect(() => {
    const checkAndInitializeModel = async () => {
      const isInitialized = localStorage.getItem('modelInitialized');
      if (!isInitialized && !initializing) {
        try {
          setInitializing(true);
          const statusResponse = await axios.get('http://localhost:5000/api/check-database');
          if (statusResponse.data.status !== 'ready') {
            await axios.get('http://localhost:5000/api/process_pdf');
          }
          localStorage.setItem('modelInitialized', 'true');
          setModelInitialized(true);
        } catch (error) {
          console.error('Error initializing model:', error);
        } finally {
          setInitializing(false);
        }
      } else {
        setModelInitialized(true);
      }
    };

    const getCountries = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/countries');
        setCountries(response.data.countries);
      } catch (error) {
        console.error('Error fetching countries:', error);
      }
    };

    checkAndInitializeModel();
    getCountries();
  }, []);

  // Fetch prohibited items by country
  const getProhibitedItemsByCountry = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:5000/api/country/${selectedCountry}`);
      if (response.data) {
        const transformedResults = response.data.items.map((item) => ({
          country: response.data.country,
          item: item,
          status: 'Prohibited',
          score: 1.0,
        }));
        setResults(transformedResults);
      } else {
        setResults([]);
        console.error('Error:', response.data.message);
      }
    } catch (error) {
      console.error('API Error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Search for item restrictions
  const searchItemRestrictions = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:5000/api/search-item`, {
        params: {
          query: itemName,
          top_k: 100,
        },
      });

      if (response.data.results) {
        const transformedResults = response.data.results.flatMap((result) =>
          result.items.map((item, index) => ({
            country: result.country,
            item: item,
            status: 'Prohibited',
            score: result.scores[index],
          }))
        );
        setResults(transformedResults);
      } else {
        setResults([]);
        console.error('Error:', response.data.message);
      }
    } catch (error) {
      console.error('API Error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Reset search
  const resetSearch = () => {
    setSelectedCountry('');
    setItemName('');
    setResults(null);
  };

  // Handle chatbot interactions
  const handleChatSubmit = async (e) => {
    e.preventDefault();

    if (!currentMessage.trim()) return;

    const newMessages = [
      ...chatMessages,
      { role: 'user', content: currentMessage },
    ];
    setChatMessages(newMessages);
    setCurrentMessage('');

    try {
      const response = await axios.post('http://localhost:5000/api/chat', {
        query: currentMessage,
        chat_history: chatMessages,
      });

      const botResponse = response.data.response;
      setChatMessages([
        ...newMessages,
        { role: 'system', content: botResponse },
      ]);
    } catch (error) {
      console.error('Chat API Error:', error);
      setChatMessages([
        ...newMessages,
        {
          role: 'system',
          content: "Sorry, I'm having trouble connecting to the server. Please try again later.",
        },
      ]);
    }
  };

  const formatChatResponse = (content) => {
    // Check if the response starts with "IMPORT COMPLIANCE BULLETIN"
    if (content.includes("IMPORT COMPLIANCE BULLETIN")) {
      const formattedContent = content.split("\n").map((line) => {
        // Format headers with bold text
        if (line.startsWith("**")) {
          const boldText = line.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>');
          return `<h3 class="text-lg font-bold text-blue-300 mt-4 mb-2">${boldText}</h3>`;
        }
        // Format bullet points
        if (line.trim().startsWith("*")) {
          // Handle any bold text within bullet points
          const bulletText = line.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>').replace(/^\*/, '•');
          return `<li class="ml-4 mb-2 text-blue-100">${bulletText}</li>`;
        }
        // Format regular paragraphs with potential bold text
        if (line.trim()) {
          const formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>');
          return `<p class="mb-2 text-blue-100">${formattedLine}</p>`;
        }
        return "";
      }).join("");

      return <div dangerouslySetInnerHTML={{ __html: formattedContent }} className="chat-bulletin" />;
    }
    
    // Return regular messages without formatting
    return content;
  };

  // Create a new chat conversation
  const createNewChat = () => {
    const newChatId = Math.max(0, ...chatHistory.map((chat) => chat.id)) + 1;
    const newChat = {
      id: newChatId,
      title: `New Chat - ${new Date().toLocaleDateString()}`,
      messages: [{ role: 'system', content: "Hello! I'm your shipping compliance assistant. How can I help you today?" }],
    };

    setChatHistory([...chatHistory, newChat]);
    setActiveChatId(newChatId);
    setChatMessages(newChat.messages);
  };

  // Load a previous chat
  const loadPreviousChat = (chatId) => {
    const chat = chatHistory.find((c) => c.id === chatId);
    if (chat) {
      setActiveChatId(chatId);
      setChatMessages(chat.messages);
    }
  };

  // Save current chat to history
  useEffect(() => {
    if (activeChatId !== 0 && chatMessages.length > 1) {
      setChatHistory((prevHistory) =>
        prevHistory.map((chat) =>
          chat.id === activeChatId ? { ...chat, messages: chatMessages } : chat
        )
      );
    }
  }, [chatMessages, activeChatId]);

  // Add these new functions for export functionality
  const exportToPDF = async () => {
    try {
      // Set loading state if needed
      // setExporting(true);
      
      // Prepare data for PDF generation
      const pdfData = {
        title: activeTab === 'country' 
          ? `Prohibited Items for ${selectedCountry}`
          : `Countries Restricting "${itemName}"`,
        results: results,
        // Add country_info for country-specific reports
        country_info: activeTab === 'country' ? {
          country: selectedCountry,
          items: results.map(result => result.item)
        } : null
      };
  
      // Get PDF from backend
      const pdfResponse = await axios.post('http://localhost:5000/generate-pdf', pdfData, {
        responseType: 'blob'
      });
      
      // Create a blob URL and trigger download
      const blob = new Blob([pdfResponse.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      // Create temporary link element to trigger download
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `shipping-restrictions-${new Date().getTime()}.pdf`);
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      
      // Reset loading state if needed
      // setExporting(false);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
      // Reset loading state if needed
      // setExporting(false);
    }
  };

  const prepareCSVData = () => {
    const csvData = [
      ['Item', 'Country', 'Status', 'Match Score'],
      ...results.map(result => [
        result.item,
        result.country,
        result.status,
        `${(result.score * 100).toFixed(1)}%`
      ])
    ];
    return csvData;
  };

  const shareOnWhatsApp = async () => {
    setSharing(true);
    try {
      const text = `This is your report`;

      // Prepare data for PDF generation
      const pdfData = {
        title: activeTab === 'country' 
          ? `Prohibited Items for ${selectedCountry}`
          : `Countries Restricting "${itemName}"`,
        results: results,
        type: activeTab,
        searchTerm: activeTab === 'country' ? selectedCountry : itemName
      };

      // Get PDF from backend
      const pdfResponse = await axios.post('http://localhost:5000/generate-pdf', pdfData, {
        responseType: 'blob'
      });
      
      // Create FormData
      const formData = new FormData();
      formData.append('to', '+919930679651'); // Replace with phone number input
      formData.append('message', text);
      formData.append('file', new Blob([pdfResponse.data], { type: 'application/pdf' }), 'shipping-restrictions.pdf');

      // Send to WhatsApp
      const response = await axios.post('http://localhost:5000/send_message', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.message_sid) {
        alert('Report shared successfully via WhatsApp!');
      } else {
        throw new Error('Failed to send message');
      }

    } catch (error) {
      console.error('Error sharing via WhatsApp:', error);
      alert('Failed to share report via WhatsApp. Please try again.');
    } finally {
      setSharing(false);
      setIsExportOpen(false);
    }
  };

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'country':
        return (
          <div className="mt-6">
            {/* Country dropdown */}
            <div className="max-w-md mx-auto mb-6">
              <label className="block text-blue-300 mb-2 font-medium">Select Destination Country</label>
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="w-full bg-gray-900/80 text-left border border-blue-800/60 rounded-lg p-3 text-white flex justify-between items-center hover:bg-gray-800/80 transition-colors"
                >
                  <div className="flex items-center">
                    <Globe className="h-5 w-5 text-blue-400 mr-2" />
                    {selectedCountry || 'Select a country'}
                  </div>
                  <span className="text-blue-400">{dropdownOpen ? '▲' : '▼'}</span>
                </button>

                {dropdownOpen && (
                  <div className="absolute w-full mt-1 bg-gray-900/95 backdrop-blur-md border border-blue-800/60 rounded-lg z-10 max-h-64 overflow-y-auto shadow-xl">
                    <input
                      type="text"
                      placeholder="Filter countries..."
                      className="w-full p-3 bg-gray-800/50 border-b border-blue-800/30 text-white placeholder-blue-400/70 rounded-t-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    {countries.map((country) => (
                      <div
                        key={country}
                        className="p-3 hover:bg-blue-800/20 cursor-pointer text-blue-100 border-b border-blue-900/30 flex items-center"
                        onClick={() => {
                          setSelectedCountry(country);
                          setDropdownOpen(false);
                        }}
                      >
                        <Map className="h-4 w-4 text-blue-400 mr-2" />
                        {country}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Button container */}
            <div className="flex justify-center space-x-4 mb-6">
              <button
                onClick={getProhibitedItemsByCountry}
                disabled={loading || !selectedCountry}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center min-w-40 transition-all transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                ) : (
                  <Search className="h-5 w-5 mr-2" />
                )}
                {loading ? 'Loading...' : 'Show Prohibited Items'}
              </button>

              {results && (
                <button
                  onClick={resetSearch}
                  className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium flex items-center transition-all"
                >
                  <X className="h-5 w-5 mr-2" />
                  Reset
                </button>
              )}
            </div>
          </div>
        );

      case 'item':
        return (
          <div className="mt-6">
            {/* Item input */}
            <div className="max-w-md mx-auto mb-6">
              <label className="block text-blue-300 mb-2 font-medium">Item Description</label>
              <div className="relative">
                <input
                  type="text"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="Enter item name (e.g., electronics, alcohol)"
                  className="w-full bg-gray-900/80 border border-blue-800/60 rounded-lg p-3 pl-10 text-white placeholder-blue-400/70 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <Search className="absolute left-3 top-3 h-5 w-5 text-blue-400" />
              </div>
            </div>

            {/* Button container */}
            <div className="flex justify-center space-x-4 mb-6">
              <button
                onClick={searchItemRestrictions}
                disabled={loading || !itemName}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center min-w-40 transition-all transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                ) : (
                  <Search className="h-5 w-5 mr-2" />
                )}
                {loading ? 'Searching...' : 'Check Restrictions'}
              </button>

              {results && (
                <button
                  onClick={resetSearch}
                  className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium flex items-center transition-all"
                >
                  <X className="h-5 w-5 mr-2" />
                  Reset
                </button>
              )}
            </div>
          </div>
        );

      case 'chat':
        return (
          <div className="mt-6 flex gap-4">
            {/* Chat history sidebar - update height */}
            <div className="w-64 bg-gray-900/60 rounded-lg border border-blue-800/40 h-[400px] overflow-y-auto">
              <div className="p-3 border-b border-blue-800/40">
                <button
                  onClick={createNewChat}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-lg flex items-center justify-center text-sm font-medium transition-colors"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  New Chat
                </button>
              </div>

              <div className="p-2">
                <h3 className="text-blue-300 text-xs uppercase font-medium mb-2 px-2">Chat History</h3>
                <div className="space-y-1">
                  {chatHistory.map((chat) => (
                    <button
                      key={chat.id}
                      onClick={() => loadPreviousChat(chat.id)}
                      className={`w-full text-left p-2 rounded-lg text-sm truncate flex items-center ${
                        activeChatId === chat.id
                          ? 'bg-blue-700/30 text-blue-100'
                          : 'hover:bg-blue-800/20 text-blue-300'
                      }`}
                    >
                      <Clock className="h-3 w-3 mr-2 flex-shrink-0" />
                      <span className="truncate">{chat.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Chat interface - update height and text color */}
            <div className="flex-1">
              <div className="bg-gray-900/60 rounded-lg border border-blue-800/40 h-[400px] overflow-y-auto mb-4 p-4">
                {chatMessages.map((msg, index) => (
                  <div
                    key={index}
                    className={`mb-4 ${msg.role === 'user' ? 'text-right' : ''}`}
                  >
                    <div
                      className={`inline-block max-w-xs sm:max-w-md rounded-lg p-3 ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-800 text-white' // Updated to ensure white text
                      }`}
                    >
                      {formatChatResponse(msg.content)}
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleChatSubmit} className="flex items-center gap-2">
                <input
                  type="text"
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  placeholder="Ask about shipping compliance..."
                  className="flex-1 bg-gray-900/80 border border-blue-800/60 rounded-lg p-3 text-white placeholder-blue-400/70 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-lg flex items-center justify-center transition-colors"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 12h14M12 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </form>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      <Header />

      {/* Show loading state while initializing */}
      {!modelInitialized && initializing ? (
        <div className="container mx-auto px-4 py-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-blue-300">Initializing compliance database...</p>
        </div>
      ) : (
        /* Main content */
        <main className="container mt-auto px-4 py-8">
          {/* Fancy title with animation */}
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-cyan-300 to-blue-400 mb-2">
              International Shipping Compliance
            </h2>
            <p className="text-blue-200 max-w-2xl mx-auto">
              Verify shipping compliance instantly by checking item restrictions and customs regulations for international shipments.
            </p>
          </div>

          {/* Tab container with glass effect */}
          <div className="max-w-6xl mx-auto rounded-xl bg-blue-950/30 backdrop-blur-md p-6 border border-blue-800/50 shadow-lg">
            {/* Tabs navigation */}
            <div className="flex border-b border-blue-800/30">
              <button
                onClick={() => {
                  setActiveTab('country');
                  setResults(null);
                }}
                className={`px-4 py-3 flex items-center ${
                  activeTab === 'country'
                    ? 'text-blue-300 border-b-2 border-blue-400 -mb-px font-medium'
                    : 'text-blue-400/70 hover:text-blue-300'
                }`}
              >
                <Globe className="h-5 w-5 mr-2" />
                Prohibited Items by Country
              </button>

              <button
                onClick={() => {
                  setActiveTab('item');
                  setResults(null);
                }}
                className={`px-4 py-3 flex items-center ${
                  activeTab === 'item'
                    ? 'text-blue-300 border-b-2 border-blue-400 -mb-px font-medium'
                    : 'text-blue-400/70 hover:text-blue-300'
                }`}
              >
                <ShieldAlert className="h-5 w-5 mr-2" />
                Check Item Restrictions
              </button>

              <button
                onClick={() => {
                  setActiveTab('chat');
                  setResults(null);
                }}
                className={`px-4 py-3 flex items-center ${
                  activeTab === 'chat'
                    ? 'text-blue-300 border-b-2 border-blue-400 -mb-px font-medium'
                    : 'text-blue-400/70 hover:text-blue-300'
                }`}
              >
                <MessageSquare className="h-5 w-5 mr-2" />
                Compliance Chatbot
              </button>
            </div>

            {/* Tab content */}
            {renderTabContent()}

            {/* Results area - shared between first two tabs */}
            {(activeTab === 'country' || activeTab === 'item') && results && (
              <div className="rounded-lg bg-gray-900/60 backdrop-blur-md border border-blue-800/40 p-4 mt-6 animate-fade-in">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-blue-300 flex items-center">
                    <div className="flex items-center">
                      {activeTab === 'country' ? (
                        <>
                          <Layers className="h-5 w-5 mr-2 text-yellow-400" />
                          Prohibited Items for {selectedCountry}
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="h-5 w-5 mr-2 text-yellow-400" />
                          Countries Restricting "{itemName}"
                        </>
                      )}
                    </div>
                    {results.length > 0 && (
                      <span className="text-sm font-normal bg-yellow-400/10 text-yellow-300 px-3 py-1 rounded-full">
                        {results.length} items found
                      </span>
                    )}
                  </h3>
                  
                  {results.length > 0 && (
                    <div className="relative">
                      <button
                        onClick={() => setIsExportOpen(!isExportOpen)}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                      >
                        <Download className="h-4 w-4" />
                        <span>Export</span>
                      </button>

                      {isExportOpen && (
                        <div className="absolute right-0 mt-2 w-48 rounded-lg bg-gray-800 shadow-lg border border-blue-800/40 z-10">
                          <button
                            onClick={exportToPDF}
                            className="w-full text-left px-4 py-2 hover:bg-blue-700/30 text-blue-100 flex items-center space-x-2"
                          >
                            <Download className="h-4 w-4" />
                            <span>Export as PDF</span>
                          </button>

                          <CSVLink
                            data={prepareCSVData()}
                            filename="shipping-restrictions.csv"
                            className="w-full text-left px-4 py-2 hover:bg-blue-700/30 text-blue-100 flex items-center space-x-2"
                          >
                            <Download className="h-4 w-4" />
                            <span>Export as CSV</span>
                          </CSVLink>

                          <button
                            onClick={shareOnWhatsApp}
                            disabled={sharing}
                            className="w-full text-left px-4 py-2 hover:bg-blue-700/30 text-blue-100 flex items-center space-x-2 disabled:opacity-50"
                          >
                            <Share2 className="h-4 w-4" />
                            <span>{sharing ? 'Sharing...' : 'Share via WhatsApp'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {results.length === 0 ? (
                  <div className="flex items-center bg-green-900/30 text-green-300 p-4 rounded-lg border border-green-800/40">
                    <Check className="h-6 w-6 mr-3 text-green-400" />
                    <div>
                      <p className="font-medium">No specific restrictions found</p>
                      <p className="text-sm opacity-80">
                        {activeTab === 'country'
                          ? `No specific prohibited items listed for ${selectedCountry} in our database.`
                          : `The item "${itemName}" appears to be compliant for shipping to the destinations in our database.`}
                      </p>
                      <p className="text-sm opacity-80 mt-1">Always verify with local customs authorities before shipping.</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Grid layout for better organization */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {results.map((result, index) => (
                        <div
                          key={index}
                          className="bg-gradient-to-r from-red-900/20 to-red-800/20 border border-red-800/40 rounded-lg p-4 flex items-start hover:scale-105 transition-transform duration-300 hover:shadow-lg"
                        >
                          <AlertTriangle className="h-5 w-5 mr-3 text-red-400 flex-shrink-0 mt-1" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center mb-1">
                              <h4 className="font-medium text-red-300 truncate">{result.item}</h4>
                              <span className="ml-2 px-2 py-0.5 bg-red-900/50 text-red-300 text-xs rounded-full flex-shrink-0">
                                {result.status}
                              </span>
                              {activeTab === 'item' && (
                                <span className="ml-2 px-2 py-0.5 bg-blue-900/50 text-blue-300 text-xs rounded-full flex-shrink-0">
                                  Match: {(result.score * 100).toFixed(1)}%
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-red-200/80">
                              Prohibited in <span className="font-medium">{result.country}</span>
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Additional information box */}
                    <div className="bg-blue-900/30 border border-blue-800/40 rounded-lg p-4 mt-4">
                      <h4 className="font-medium text-blue-300 mb-2 flex items-center">
                        <HelpCircle className="h-4 w-4 mr-2" />
                        Important Information
                      </h4>
                      <p className="text-sm text-blue-200/80">
                        These items are strictly prohibited for import into {selectedCountry}. 
                        Attempting to ship these items may result in delays, fines, or confiscation. 
                        Always verify current regulations with customs authorities.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      )}

      {/* Footer */}
      <footer className="mt-12 border-t border-blue-900/30 pt-6 text-center text-blue-400/60 text-sm">
        <p>International Shipping Compliance Tool • Version 1.1.0 • Last Updated: March 2025</p>
      </footer>
    </div>
  );
};

export default Restrictions;

