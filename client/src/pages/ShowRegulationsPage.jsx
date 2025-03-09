import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Info, MessageSquare, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import {marked} from 'marked';
import axios from 'axios';
import Header from '../components/header';

const ShowRegulations = () => {
  const { source, destination } = useParams();
  const navigate = useNavigate();
  const [regulations, setRegulations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openSections, setOpenSections] = useState({});
  const [showSimplified, setShowSimplified] = useState({});
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [currentSection, setCurrentSection] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [chatId, setChatId] = useState(null); // Add this new state
  
  const formatCountryName = (name) => {
    return name
      .toLowerCase()
      .replace(/%20/g, '_')  // Replace %20 with underscore
      .replace(/\s+/g, '_'); // Replace spaces with underscore
  };

  useEffect(() => {

    const fetchRegulations = async () => {
      try {
        // Format the JSON filename according to source_to_destination.json
        
        const formattedSource = formatCountryName(source);
        const formattedDestination = formatCountryName(destination);

        // Create the filename
        const fileName = `${formattedSource}_to_${formattedDestination}.json`;
        console.log('Fetching file:', fileName);
        const response = await fetch(`/${fileName}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch regulations data');
        }
        
        const data = await response.json();
        setRegulations(data);
        
        // Initialize open sections state
        const sectionsState = {};
        data.forEach((section, index) => {
          sectionsState[index] = false;
        });
        setOpenSections(sectionsState);
        
        // Initialize simplified view state
        const simplifiedState = {};
        data.forEach((section, index) => {
          simplifiedState[index] = false;
        });
        setShowSimplified(simplifiedState);
        
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchRegulations();
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

  const openChatbot = (index) => {
    setCurrentSection(index);
    setChatbotOpen(true);
    setChatId(null); // Reset chat_id for new conversation
    setChatMessages([
      { sender: 'bot', text: 'Hello! How can I help you understand these regulations?' }
    ]);
  };

  const closeChatbot = () => {
    setChatbotOpen(false);
    setCurrentSection(null);
    setChatMessages([]);
    setChatId(null); // Reset chat_id when closing
    setUserInput('');
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    const newUserMessage = { sender: 'user', text: userInput };
    setChatMessages(prev => [...prev, newUserMessage]);

    try {
      const { data } = await axios.post('https://saved-jackal-brief.ngrok-free.app/api/chat', {
        query: userInput,
        context: regulations[currentSection]?.['Simplified Form']?.join('\n') || regulations[currentSection]?.Content,
        section: regulations[currentSection]?.Section,
        chat_id: chatId // Send the chat ID if it exists
      } , {
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      });
      
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
        throw new Error(data.error);
      }
    } catch (err) {
      setChatMessages(prev => [...prev, { 
        sender: 'bot', 
        text: 'Sorry, I encountered an error. Please try again.' 
      }]);
    }
    
    setUserInput('');
  };

  const handleGoBack = () => {
    navigate('/regulations');
  };

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-blue-950 to-gray-900 flex items-center justify-center">
      <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-blue-950 to-gray-900 flex flex-col items-center justify-center p-4">
      <div className="bg-red-900/50 border border-red-800 text-red-200 px-4 py-3 rounded max-w-lg w-full mb-4">
        <p>{error}</p>
      </div>
      <button 
        onClick={handleGoBack}
        className="flex items-center bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
      >
        <ArrowLeft size={16} className="mr-2" />
        Back to Search
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-blue-950 to-gray-900">
      {/* Header */}
      <Header />
      <div className="bg-gradient-to-r from-blue-900 to-gray-900 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-blue-300">Country Regulations</h1>
            <button
              onClick={handleGoBack}
              className="flex items-center bg-blue-700 hover:bg-blue-600 px-3 py-2 rounded transition-colors"
            >
              <ArrowLeft size={16} className="mr-2" />
              Back to Search
            </button>
          </div>
          <div className="mt-2">
            <p className="text-xl text-blue-200">
              <span className="font-medium">{source}</span> to <span className="font-medium">{destination}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {regulations.length === 0 ? (
            <div className="bg-yellow-900/20 border-l-4 border-yellow-600 p-4 mb-4 text-yellow-200">
              <p>No regulations found for this route.</p>
            </div>
          ) : (
            regulations.map((regulation, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="mb-4 bg-gray-900 rounded-lg shadow-md overflow-hidden border border-blue-800 transition-all duration-300"
              >
                {/* Section Header */}
                <div 
                  className={`flex justify-between items-center p-4 cursor-pointer ${
                    openSections[index] 
                      ? 'bg-blue-800 text-white' 
                      : 'bg-gray-800 text-blue-100 hover:bg-blue-900/50'
                  }`}
                  onClick={() => toggleSection(index)}
                >
                  <div className="flex items-center">
                    <h2 className="text-lg font-semibold">{regulation.Section}</h2>
                    {regulation['Info About Section Header'] && (
                      <div className="ml-2 relative group">
                        <Info size={18} className="text-blue-300 cursor-help" />
                        <div className="absolute z-10 hidden group-hover:block bg-gray-900 text-blue-100 text-sm rounded p-2 w-64 top-full left-0 mt-1 border border-blue-800">
                          {regulation['Info About Section Header']}
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <svg 
                      className={`w-6 h-6 transition-transform duration-300 ${openSections[index] ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {/* Section Content */}
                {openSections[index] && (
                  <div className="p-4 border-t border-blue-800">
                    <div className={`${showSimplified[index] ? 'hidden' : 'block'} text-blue-100`}>
                      <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: regulation.Content }} />
                    </div>
                    
                    {showSimplified[index] && regulation['Simplified Form'] && (
                      <div className="bg-blue-900/30 p-4 rounded-md border border-blue-800">
                        <h3 className="text-blue-300 font-medium mb-2">Simplified Explanation</h3>
                        <div className="prose prose-invert max-w-none text-blue-100" 
                          dangerouslySetInnerHTML={{ __html: marked(regulation['Simplified Form'].join('\n')) }} 
                        />
                      </div>
                    )}
                    
                    <div className="flex mt-4 space-x-4">
                      {regulation['Simplified Form'] && (
                        <button
                          onClick={() => toggleSimplifiedView(index)}
                          className="flex items-center px-3 py-2 rounded bg-gray-800 hover:bg-gray-700 text-blue-300 transition-colors border border-blue-800"
                        >
                          <FileText size={16} className="mr-2" />
                          {showSimplified[index] ? 'Show Original' : 'Show Simplified'}
                        </button>
                      )}
                      
                      <button
                        onClick={() => openChatbot(index)}
                        className="flex items-center px-3 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                      >
                        <MessageSquare size={16} className="mr-2" />
                        Ask Questions
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>
      </main>

      {/* Chatbot Modal */}
      {chatbotOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 rounded-lg shadow-xl w-full max-w-md h-3/4 flex flex-col border border-blue-800"
          >
            <div className="bg-gradient-to-r from-blue-800 to-gray-800 text-white py-3 px-4 rounded-t-lg flex justify-between items-center">
              <h3 className="font-medium text-blue-100">Regulation Assistant</h3>
              <button 
                onClick={closeChatbot}
                className="text-blue-200 hover:text-white"
              >
                &times;
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 bg-gray-900">
              {chatMessages.map((msg, i) => (
                <div 
                  key={i} 
                  className={`mb-3 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}
                >
                  <div 
                    className={`inline-block px-4 py-2 rounded-lg ${
                      msg.sender === 'user' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-800 text-blue-100 border border-blue-900'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
            
            <form onSubmit={handleChatSubmit} className="border-t border-blue-800 p-3">
              <div className="flex">
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  className="flex-1 bg-gray-800 border border-blue-900 rounded-l py-2 px-3 text-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ask about these regulations..."
                />
                <button 
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-r"
                >
                  Send
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ShowRegulations;
