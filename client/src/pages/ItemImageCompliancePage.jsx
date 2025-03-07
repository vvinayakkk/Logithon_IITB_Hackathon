import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import * as THREE from 'three';
import { CloudUpload, Send, Info, Check, X, MessageCircle, FileText, Globe as GlobeIcon, Package, AlertTriangle, Calendar, Weight, DollarSign, Truck, BoxSelect, FileCheck } from 'lucide-react';
import GlobeVisualization from '../components/Globe';
// Note: GlobeVisualization component has been removed from this file
// You can use it separately elsewhere as needed

function ItemImageCompliancePage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [sourceCountry, setSourceCountry] = useState('');
  const [destinationCountry, setDestinationCountry] = useState('');
  const [validationResults, setValidationResults] = useState(null);
  const [showChatbot, setShowChatbot] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { sender: 'bot', message: 'Hello! I can help answer questions about shipping compliance. What would you like to know?' }
  ]);
  const [message, setMessage] = useState('');
  const chatContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [arcsData, setArcsData] = useState([]);

  // List of countries for the dropdown
  const countries = [
    'United States', 'Canada', 'Mexico', 'United Kingdom', 'France', 
    'Germany', 'Japan', 'China', 'Australia', 'Brazil', 'India'
  ];

  // Restricted items database (simplified for example)
  const restrictedItemsDB = {
    'United States': ['weapons', 'drugs', 'live animals', 'ivory'],
    'Canada': ['weapons', 'drugs', 'certain foods'],
    'Mexico': ['weapons', 'drugs', 'certain electronics'],
    'United Kingdom': ['weapons', 'drugs', 'certain food products'],
    'France': ['weapons', 'drugs', 'counterfeit goods'],
    'Germany': ['weapons', 'drugs', 'nazi memorabilia'],
    'Japan': ['weapons', 'drugs', 'certain foods', 'pornography'],
    'China': ['weapons', 'drugs', 'political materials', 'certain electronics'],
    'Australia': ['weapons', 'drugs', 'biological materials', 'certain foods'],
    'Brazil': ['weapons', 'drugs', 'certain electronics', 'used goods'],
    'India': ['weapons', 'drugs', 'gold above limits', 'certain electronics']
  };

  // Country coordinates for the globe (simplified)
  const countryCoordinates = {
    'United States': { lat: 37.0902, lng: -95.7129 },
    'Canada': { lat: 56.1304, lng: -106.3468 },
    'Mexico': { lat: 23.6345, lng: -102.5528 },
    'United Kingdom': { lat: 55.3781, lng: -3.4360 },
    'France': { lat: 46.2276, lng: 2.2137 },
    'Germany': { lat: 51.1657, lng: 10.4515 },
    'Japan': { lat: 36.2048, lng: 138.2529 },
    'China': { lat: 35.8617, lng: 104.1954 },
    'Australia': { lat: -25.2744, lng: 133.7751 },
    'Brazil': { lat: -14.2350, lng: -51.9253 },
    'India': { lat: 20.5937, lng: 78.9629 }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      
      // Create a preview
      const reader = new FileReader();
      reader.onload = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedFile || !sourceCountry || !destinationCountry) {
      alert('Please fill in all required fields');
      return;
    }
    
    setLoading(true);
    
    // Simulate API call with timeout
    setTimeout(() => {
      // Simulate item detection from backend
      const itemDescription = "Electronics - Smartphone"; // This would come from backend in real app
      
      // Mock checking if the item is prohibited
      const isProhibited = restrictedItemsDB[destinationCountry]?.some(item => 
        itemDescription.toLowerCase().includes(item)
      );
      
      // Check document requirements
      const missingDocuments = ['Commercial Invoice', 'Certificate of Origin'];
      
      // Set validation results
      setValidationResults({
        isCompliant: !isProhibited && missingDocuments.length === 0,
        sourceCountry,
        destinationCountry,
        itemName: itemDescription,
        issues: [
          ...(isProhibited ? [`Item may be restricted in ${destinationCountry}`] : []),
          ...(missingDocuments.length > 0 ? [`Missing required documents: ${missingDocuments.join(', ')}`] : [])
        ],
        recommendations: isProhibited || missingDocuments.length > 0 ? 
          ['Check with local customs', 'Consider special permits', 'Complete all required documentation'] : 
          ['Ready for shipment', 'All compliance checks passed']
      });
      
      // Create arc data for visualization (kept for future reference)
      if (sourceCountry && destinationCountry) {
        const srcCoords = countryCoordinates[sourceCountry];
        const destCoords = countryCoordinates[destinationCountry];
        
        if (srcCoords && destCoords) {
          setArcsData([{
            startLat: srcCoords.lat,
            startLng: srcCoords.lng,
            endLat: destCoords.lat,
            endLng: destCoords.lng,
            color: isProhibited || missingDocuments.length > 0 ? '#FF4560' : '#00E396'
          }]);
        }
      }
      
      setLoading(false);
    }, 2000);
  };

  const handleChatSubmit = (e) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    
    // Add user message
    const userMessage = { sender: 'user', message };
    setChatMessages([...chatMessages, userMessage]);
    setMessage('');
    
    // Simulate bot response
    setTimeout(() => {
      let botResponse = '';
      
      // Simple rule-based responses
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
      
      // Scroll to bottom of chat
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-blue-950 to-gray-900 relative">
      {/* Header */}
      <header className="bg-gray-950 shadow-lg text-white p-4 border-b border-blue-800">
        <div className="container mx-auto flex justify-between items-center">
          <motion.div 
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-2"
          >
            <Package className="h-8 w-8 text-blue-400" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Rapid Compliance Checker
            </h1>
          </motion.div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowInfoModal(true)}
            className="p-2 rounded-full bg-blue-700 hover:bg-blue-600 transition-colors"
          >
            <Info className="h-5 w-5" />
          </motion.button>
        </div>
      </header>
      <div>
        <GlobeVisualization arcsData={arcsData}/>
      </div>
      
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left Column - Form (3 columns) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-3 space-y-6"
          >
            {/* Simplified Form */}
            <div className="bg-gray-900 rounded-xl shadow-lg border border-blue-900 p-6 text-white">
              <h2 className="text-xl font-bold mb-6 text-center text-blue-300">Check Shipment Compliance</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Image Upload */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-blue-300">Upload Item Image</label>
                  <div 
                    onClick={() => fileInputRef.current.click()}
                    className="border-2 border-dashed border-blue-700 rounded-lg p-6 text-center cursor-pointer hover:bg-blue-900/20 transition-colors"
                  >
                    {preview ? (
                      <div className="relative">
                        <img src={preview} alt="Preview" className="mx-auto max-h-40 rounded" />
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFile(null);
                            setPreview(null);
                          }}
                          className="absolute top-2 right-2 bg-red-500 rounded-full p-1 text-white"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <CloudUpload className="h-12 w-12 text-blue-500 mb-3" />
                        <p className="text-sm text-blue-200">Click to upload or drag and drop</p>
                        <p className="text-xs text-blue-400 mt-1">PNG, JPG or WEBP (max 5MB)</p>
                      </div>
                    )}
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                </div>
                
                {/* Country Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-blue-300">Source Country</label>
                    <select 
                      value={sourceCountry}
                      onChange={(e) => setSourceCountry(e.target.value)}
                      className="w-full bg-gray-800 border border-blue-800 rounded-lg p-3 text-blue-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select Source Country</option>
                      {countries.map(country => (
                        <option key={`source-${country}`} value={country}>{country}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-blue-300">Destination Country</label>
                    <select 
                      value={destinationCountry}
                      onChange={(e) => setDestinationCountry(e.target.value)}
                      className="w-full bg-gray-800 border border-blue-800 rounded-lg p-3 text-blue-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select Destination Country</option>
                      {countries.map(country => (
                        <option key={`dest-${country}`} value={country}>{country}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {/* Submit Button */}
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                      <span>Processing...</span>
                    </div>
                  ) : (
                    <>
                      <Check className="mr-2 h-5 w-5" />
                      <span>Check Compliance</span>
                    </>
                  )}
                </motion.button>
              </form>
            </div>
            
            {/* Helpful Tips */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-gradient-to-br from-blue-900 to-gray-900 rounded-xl p-6 text-white shadow-xl border border-blue-800"
            >
              <h3 className="font-semibold mb-4 flex items-center text-blue-300">
                <Info className="h-5 w-5 text-blue-400 mr-2" />
                Shipping Tips
              </h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start">
                  <Check className="h-4 w-4 text-cyan-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-blue-100">Always declare accurate item values to avoid customs penalties</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-4 w-4 text-cyan-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-blue-100">Include all required documentation to prevent shipment delays</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-4 w-4 text-cyan-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-blue-100">Check destination country restrictions before shipping</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-4 w-4 text-cyan-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-blue-100">Use proper packaging materials for fragile items</span>
                </li>
              </ul>
            </motion.div>
            
            {/* Recent Updates (moved from right to left column) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-gradient-to-br from-gray-900 to-blue-900 rounded-xl p-6 text-white shadow-xl border border-blue-800"
            >
              <h3 className="font-semibold mb-4 text-blue-300">Recent Regulation Updates</h3>
              <div className="space-y-4">
                <div className="border-l-2 border-cyan-600 pl-4">
                  <div className="text-xs text-cyan-400">FEB 28, 2025</div>
                  <h4 className="text-sm font-medium my-1 text-blue-200">European Union Updates Customs Requirements</h4>
                  <p className="text-xs text-blue-300">New documentation required for electronic devices shipped to EU countries starting April 2025.</p>
                </div>
                
                <div className="border-l-2 border-cyan-600 pl-4">
                  <div className="text-xs text-cyan-400">FEB 15, 2025</div>
                  <h4 className="text-sm font-medium my-1 text-blue-200">APAC Restricted Items List Updated</h4>
                  <p className="text-xs text-blue-300">China, Japan and Australia have added new categories to their restricted items lists.</p>
                </div>
                
                <div className="border-l-2 border-cyan-600 pl-4">
                  <div className="text-xs text-cyan-400">JAN 30, 2025</div>
                  <h4 className="text-sm font-medium my-1 text-blue-200">US Customs Duty Changes</h4>
                  <p className="text-xs text-blue-300">Changes to import duties for certain product categories shipping to United States.</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
          
          {/* Right Column - Results (2 columns) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="lg:col-span-2"
          >
            {/* Results Section */}
            {validationResults ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-900 rounded-xl p-6 text-white shadow-xl mb-6 border border-blue-800"
              >
                <h3 className="text-lg font-semibold mb-4 text-blue-300">Compliance Results</h3>
                
                <div className="flex items-center mb-5">
                  <div className={`flex-shrink-0 h-12 w-12 rounded-full flex items-center justify-center ${validationResults.isCompliant ? 'bg-emerald-500/20' : 'bg-rose-500/20'} border ${validationResults.isCompliant ? 'border-emerald-500' : 'border-rose-500'}`}>
                    {validationResults.isCompliant ? (
                      <Check className="h-6 w-6 text-emerald-500" />
                    ) : (
                      <AlertTriangle className="h-6 w-6 text-rose-500" />
                    )}
                  </div>
                  <div className="ml-4">
                    <h4 className={`font-medium text-lg ${validationResults.isCompliant ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {validationResults.isCompliant ? 'Shipment Compliant' : 'Compliance Issues Detected'}
                    </h4>
                    <p className="text-sm text-blue-300">
                      {validationResults.sourceCountry} to {validationResults.destinationCountry}
                    </p>
                  </div>
                </div>
                
                <div className="border-t border-blue-800 pt-4 space-y-4">
                  {validationResults.issues.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-rose-400 mb-2">Issues</h5>
                      <ul className="text-sm space-y-2 bg-rose-950/20 p-3 rounded-lg border border-rose-900">
                        {validationResults.issues.map((issue, index) => (
                          <li key={index} className="flex items-start">
                            <X className="h-4 w-4 text-rose-500 mr-2 mt-0.5 flex-shrink-0" />
                            <span className="text-rose-200">{issue}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <div>
                    <h5 className="text-sm font-medium text-cyan-400 mb-2">Recommendations</h5>
                    <ul className="text-sm space-y-2 bg-blue-950/20 p-3 rounded-lg border border-blue-900">
                      {validationResults.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start">
                          <Info className="h-4 w-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-blue-200">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                {/* Item Details (detected by backend) */}
                <div className="mt-5 bg-gray-950 rounded-lg p-4 border border-blue-900">
                  <h5 className="text-sm font-medium text-blue-400 mb-3">Detected Item Details</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center">
                      <span className="text-blue-400 mr-2">Item Type:</span>
                      <span className="text-blue-100">{validationResults.itemName.split('-')[0].trim()}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-blue-400 mr-2">Description:</span>
                      <span className="text-blue-100">{validationResults.itemName.split('-')[1]?.trim() || validationResults.itemName}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-blue-400 mr-2">Requires License:</span>
                      <span className="text-blue-100">No</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-blue-400 mr-2">Estimated Duties:</span>
                      <span className="text-blue-100">$45.00 USD</span>
                    </div>
                  </div>
                </div>
                
                {/* AI Assistant Button */}
                <div className="mt-5 text-center">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowChatbot(true)}
                    className="inline-flex items-center text-sm font-medium text-cyan-400 hover:text-cyan-300 bg-blue-950/50 py-2 px-4 rounded-lg border border-blue-800"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Ask questions about this shipment
                  </motion.button>
                </div>
                
                {/* Shipment Route Information */}
                <div className="mt-5">
                  <h5 className="text-sm font-medium text-blue-400 mb-3">Shipment Details</h5>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-800 rounded-lg p-3 border border-blue-900">
                      <span className="text-xs text-blue-400 block mb-1">Distance</span>
                      <span className="font-medium text-blue-100">{Math.floor(Math.random() * 5000 + 3000)} km</span>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-3 border border-blue-900">
                      <span className="text-xs text-blue-400 block mb-1">Est. Transit Time</span>
                      <span className="font-medium text-blue-100">{Math.floor(Math.random() * 10 + 3)} days</span>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-3 border border-blue-900">
                      <span className="text-xs text-blue-400 block mb-1">Required Documents</span>
                      <span className="font-medium text-blue-100">3</span>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-3 border border-blue-900">
                      <span className="text-xs text-blue-400 block mb-1">Status</span>
                      <span className="font-medium text-blue-100">Pending Approval</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="bg-gray-900 rounded-xl p-8 text-white shadow-xl mb-6 border border-blue-800 flex items-center justify-center h-full min-h-96">
                <div className="text-center py-16">
                  <FileCheck className="h-16 w-16 text-blue-500 mx-auto mb-4 opacity-70" />
                  <h3 className="text-lg font-medium text-blue-300">No Compliance Check Yet</h3>
                  <p className="text-sm text-blue-400 mt-3 max-w-xs mx-auto">
                    Upload an image and select countries to check your shipment's compliance status
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </main>
      
      {/* Chatbot */}
      {showChatbot && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-5 right-5 w-80 md:w-96 bg-gray-900 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col border border-blue-800"
          style={{ maxHeight: '500px' }}
        >
          <div className="bg-gradient-to-r from-blue-800 to-cyan-800 px-4 py-3 flex justify-between items-center">
            <div className="flex items-center">
              <MessageCircle className="h-5 w-5 text-white mr-2" />
              <h3 className="font-medium text-white">Compliance Assistant</h3>
            </div>
            <button 
              onClick={() => setShowChatbot(false)}
              className="text-white hover:text-gray-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div 
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-3"
            style={{ maxHeight: '320px' }}
          >
            {chatMessages.map((chat, index) => (
              <div 
                key={index} 
                className={`flex ${chat.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-3/4 p-3 rounded-lg ${
                    chat.sender === 'user' 
                      ? 'bg-blue-700 text-white rounded-br-none' 
                      : 'bg-gray-800 text-blue-100 rounded-bl-none border border-blue-900'
                  }`}
                >
                  {chat.message}
                </div>
              </div>
            ))}
          </div>
          
          <form onSubmit={handleChatSubmit} className="border-t border-blue-900 p-3 flex">
            <input 
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask a question about shipping..."
              className="flex-1 bg-gray-800 text-blue-100 placeholder-blue-500 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 border border-blue-900"
            />
            <button 
              type="submit"
              className="ml-2 bg-blue-700 text-white p-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Send className="h-5 w-5" />
            </button>
          </form>
        </motion.div>
      )}
      
      {/* Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 rounded-xl max-w-lg w-full p-6 relative border border-blue-800"
          >
            <button 
              onClick={() => setShowInfoModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
            
            <h3 className="text-xl font-bold text-blue-300 mb-4">About Rapid Compliance Checker</h3>
            
            <div className="space-y-4 text-blue-100">
              <p>
                This tool helps verify international shipping compliance by checking item restrictions, documentation requirements, and customs regulations.
              </p>
              
              <div className="bg-blue-950/30 p-4 rounded-lg border border-blue-900">
                <h4 className="font-medium text-blue-300 mb-2">Key Features</h4>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-cyan-500 mr-2 mt-1 flex-shrink-0" />
                    <span>Instant compliance verification for international shipments</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-cyan-500 mr-2 mt-1 flex-shrink-0" />
                    <span>Item restrictions database for multiple countries</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-cyan-500 mr-2 mt-1 flex-shrink-0" />
                    <span>Documentation requirements checklist</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-cyan-500 mr-2 mt-1 flex-shrink-0" />
                    <span>AI assistant for shipping compliance questions</span>
                  </li>
                </ul>
              </div>
              
              <p className="text-sm text-blue-400">
                Version 1.0.3 | Last Updated: February 2025
              </p>
              
              <p className="text-sm text-blue-400">
                This is a demonstration application. In a production environment, it would connect to real customs databases and shipping APIs.
              </p>
            </div>
            
            <div className="mt-6 text-center">
              <button
                onClick={() => setShowInfoModal(false)}
                className="bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
      
      {/* Floating Chatbot Button */}
      {!showChatbot && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowChatbot(true)}
          className="fixed bottom-5 right-5 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full p-4 shadow-lg z-40"
        >
          <MessageCircle className="h-6 w-6 text-white" />
        </motion.button>
      )}
      
      {/* Footer */}
      <footer className="bg-gray-950 border-t border-blue-900 text-blue-400 py-6">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h4 className="font-medium text-blue-300 mb-4">Rapid Compliance Checker</h4>
              <p className="text-sm">
                Simplifying international shipping compliance checks with advanced AI technology.
              </p>
              <div className="flex items-center space-x-4 mt-4">
                <GlobeIcon className="h-5 w-5 text-blue-500" />
                <FileText className="h-5 w-5 text-blue-500" />
                <Info className="h-5 w-5 text-blue-500" />
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-blue-300 mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-blue-300 transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-blue-300 transition-colors">Country Regulations</a></li>
                <li><a href="#" className="hover:text-blue-300 transition-colors">Shipping Guidelines</a></li>
                <li><a href="#" className="hover:text-blue-300 transition-colors">API Integration</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-blue-300 mb-4">Contact</h4>
              <p className="text-sm mb-2">
                Need assistance with shipping compliance?
              </p>
              <a href="#" className="text-cyan-400 hover:text-cyan-300 text-sm">
                support@rapidcompliance.example
              </a>
            </div>
          </div>
          
          <div className="border-t border-blue-900 mt-8 pt-6 text-center text-sm">
            <p>© 2025 Rapid Compliance Checker. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default ItemImageCompliancePage;