import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import * as THREE from 'three';
import { CloudUpload, Send, Info, Check, X, MessageCircle, FileText, Globe as GlobeIcon, Package, AlertTriangle, Calendar, Weight, DollarSign, Truck, BoxSelect, FileCheck } from 'lucide-react';
import GlobeVisualization from '../components/Globe';
import Header from '../components/header';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';

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
  const [detected, setDetected] = useState([]);
  const [res, setRes] = useState([]);
  const [syntheticLoading, setSyntheticLoading] = useState(false);

  // List of countries for the dropdown
  const countries = [
    'United States', 'Canada', 'Mexico', 'United Kingdom', 'France', 
  ];
  const prepareChartData = () => {
    const relevanceData = res.map(item => ({
      name: `${item["Search Item"]} (${item.Country})`,  // Changed to include country
      relevance: parseFloat(item.Relevance) * 100,
      country: item.Country,  // Added country information
      item: item["Search Item"]  // Added item information
    }));
  
    const riskData = [
      { name: 'High Risk', value: res.filter(item => parseFloat(item.Relevance) > 0.6).length },
      { name: 'Medium Risk', value: res.filter(item => parseFloat(item.Relevance) <= 0.6 && parseFloat(item.Relevance) > 0.4).length },
      { name: 'Low Risk', value: res.filter(item => parseFloat(item.Relevance) <= 0.4).length },
    ];
  
    return { relevanceData, riskData };
  };
  
  const { relevanceData, riskData } = prepareChartData();

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
    'India': ['weapons', 'drugs', 'gold above limits', 'certain electronics'],
    'Kuwait': ['liquor', 'pork products', 'drugs', 'weapons']
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
    'India': { lat: 20.5937, lng: 78.9629 },
    'Kuwait': { lat: 29.3759, lng: 47.9774 }
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
    
    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', selectedFile);
  
      // Call API endpoint
      const response = await fetch('https://sensible-emu-highly.ngrok-free.app/api/search_items', {
        method: 'POST',
        body: formData
      });
  
      if (!response.ok) {
        throw new Error('API request failed');
      }
  
      const data = await response.json();
      console.log("API Response:", data); // Debug log
      
      // Set detected items and results
      setDetected(data.detected_items || []);
      setRes(data.results || []);
  
      // Update arc data for globe visualization
      if (sourceCountry && destinationCountry && countryCoordinates[sourceCountry] && countryCoordinates[destinationCountry]) {
        setArcsData([{
          startLat: countryCoordinates[sourceCountry].lat,
          startLng: countryCoordinates[sourceCountry].lng,
          endLat: countryCoordinates[destinationCountry].lat,
          endLng: countryCoordinates[destinationCountry].lng,
          color: data.results.length === 0 ? 'rgba(0, 255, 0, 0.6)' : 'rgba(255, 0, 0, 0.6)'
        }]);
      }
  
      // Process the response to set validationResults
      const validationResults = {
        isCompliant: data.results.length === 0, // If no results, it's compliant
        sourceCountry: sourceCountry,
        destinationCountry: destinationCountry,
        issues: data.results.map(item => `${item["Search Item"]} is prohibited in ${item.Country}`),
        recommendations: [
          "Check the destination country's customs regulations.",
          "Ensure all required documentation is complete.",
          "Contact the shipping carrier for further assistance."
        ],
        itemDetails: data.results.map(item => ({
          item: item["Search Item"],
          relevance: parseFloat(item.Relevance),
          prohibitedItem: item["Prohibited Item"]
        }))
      };
  
      setValidationResults(validationResults);
      
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to process image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    
    // Add user message
    const userMessage = { sender: 'user', message };
    setChatMessages([...chatMessages, userMessage]);
    setMessage('');
    
    try {
      // Prepare context for the AI
      const context = `
        Context:
        - Source Country: ${sourceCountry}
        - Destination Country: ${destinationCountry}
        - Detected Items: ${detected.join(', ')}
        - Compliance Status: ${validationResults ? (validationResults.isCompliant ? 'Compliant' : 'Non-compliant') : 'Unknown'}
        
        User Question: ${message}
      `;

      // Call Gemini API
      const response = await fetch('https://free-horribly-perch.ngrok-free.app/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: context }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from AI');
      }

      const data = await response.json();
      const botMessage = { sender: 'bot', message: data.response };
      setChatMessages(prevMessages => [...prevMessages, botMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = { 
        sender: 'bot', 
        message: 'Sorry, I encountered an error. Please try again later.' 
      };
      setChatMessages(prevMessages => [...prevMessages, errorMessage]);
    }

    // Scroll to bottom of chat
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  // For demo purposes - example detection results if no data is present
  const demoData = () => {
    if (!res.length) {
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
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-blue-950 to-gray-900 relative">
      {/* Header */}
      <Header />
      <div style={{ height: '400px', width: '100%', position: 'relative', marginBottom: '2rem' }}>
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
              
              {/* Demo button */}
              <div className="mt-3 text-center">
                <button 
                  onClick={demoData}
                  className="text-sm text-blue-400 hover:text-blue-300 underline"
                >
                  Load demo data
                </button>
              </div>
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

            {/* Relevance Chart Section */}
            {res.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="bg-gradient-to-br from-gray-900 to-blue-900 rounded-xl p-6 text-white shadow-xl border border-blue-800"
              >
                <h3 className="font-semibold mb-4 text-blue-300">Item-Country Relevance Analysis</h3>
                <div className="w-full overflow-x-auto">
                  <BarChart
                    width={500}
                    height={300}
                    data={relevanceData}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 100, // Increased bottom margin for rotated labels
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e3a8a" />
                    <XAxis 
                      dataKey="name" 
                      stroke="#93c5fd"
                      tick={{ fill: '#93c5fd' }}
                      angle={-45}  // Rotate labels
                      textAnchor="end"  // Align rotated text
                      height={100}  // Increase height for rotated labels
                    />
                    <YAxis 
                      stroke="#93c5fd"
                      tick={{ fill: '#93c5fd' }}
                      label={{ 
                        value: 'Relevance Score (%)', 
                        angle: -90, 
                        position: 'insideLeft',
                        fill: '#93c5fd'
                      }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1e3a8a', 
                        border: '1px solid #3b82f6',
                        borderRadius: '8px',
                        color: '#93c5fd'
                      }}
                      formatter={(value, name, props) => [
                        `${value.toFixed(1)}%`,
                        `${props.payload.item} in ${props.payload.country}`
                      ]}
                    />
                    <Bar
                      dataKey="relevance"
                      fill="#3b82f6"
                      radius={[4, 4, 0, 0]}
                    >
                      {relevanceData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.relevance > 60 ? '#ef4444' : entry.relevance > 40 ? '#f59e0b' : '#22c55e'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </div>
                <div className="mt-4 flex justify-center space-x-4">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-500 rounded mr-2"></div>
                    <span className="text-sm text-blue-200">High Risk (&gt;60%)</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-amber-500 rounded mr-2"></div>
                    <span className="text-sm text-blue-200">Medium Risk (40-60%)</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
                    <span className="text-sm text-blue-200">Low Risk (&lt;40%)</span>
                  </div>
                </div>
              </motion.div>
            )}

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
            {/* Detected Items Section - Always show if there are items */}
            {detected.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-blue-900/30 rounded-xl p-6 text-white shadow-xl mb-6 border border-blue-800"
              >
                <h3 className="text-lg font-semibold mb-4 text-blue-300">Detected Items</h3>
                <div className="bg-gray-900/70 rounded-lg p-4 border border-blue-800">
                  <ul className="space-y-3">
                    {detected.map((item, index) => (
                      <li key={index} className="flex items-center">
                        <Package className="h-5 w-5 text-blue-400 mr-3 flex-shrink-0" />
                        <span className="text-blue-100 font-medium">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )}

            {/* Compliance Results Section */}
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
              </motion.div>
            ) : (
              <div className="bg-gray-900 rounded-xl p-8 text-white shadow-xl mb-6 border border-blue-800 flex items-center justify-center h-64">
                <div className="text-center">
                  <FileCheck className="h-16 w-16 text-blue-500 mx-auto mb-4 opacity-70" />
                  <h3 className="text-lg font-medium text-blue-300">No Compliance Check Yet</h3>
                  <p className="text-sm text-blue-400 mt-3 max-w-xs mx-auto">
                    Upload an image and select countries to check your shipment's compliance status
                  </p>
                </div>
              </div>
            )}

            {/* Detailed Results Section - Always show if results exist */}
            {res.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-900 rounded-xl p-6 text-white shadow-xl mb-6 border border-blue-800"
              >
                <h3 className="text-lg font-semibold mb-4 text-blue-300">Prohibited Items Matched</h3>
                
                <div className="space-y-4">
                  {res.map((item, index) => (
                    <div key={index} className="bg-gray-800 p-4 rounded-lg border border-blue-900">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-blue-400 text-sm">Country</span>
                          <p className="text-white font-medium">{item.Country}</p>
                        </div>
                        <div>
                          <span className="text-blue-400 text-sm">Prohibited Item</span>
                          <p className="text-rose-400 font-medium">{item["Prohibited Item"]}</p>
                        </div>
                        <div>
                          <span className="text-blue-400 text-sm">Search Item</span>
                          <p className="text-white">{item["Search Item"]}</p>
                        </div>
                        <div>
                          <span className="text-blue-400 text-sm">Relevance</span>
                          <div className="flex items-center mt-1">
                            <div className="h-2 rounded-full bg-gray-700 w-full">
                              <div 
                                className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500" 
                                style={{ width: `${parseFloat(item.Relevance) * 100}%` }}
                              ></div>
                            </div>
                            <span className="ml-2 text-cyan-400 font-medium">
                              {(parseFloat(item.Relevance) * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Risk assessment card */}
            {res.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-gray-900 to-blue-900 rounded-xl p-6 text-white shadow-xl mb-6 border border-blue-800"
              >
                <h3 className="text-lg font-semibold mb-4 text-blue-300">Risk Assessment</h3>
                
                <div className="space-y-4">
                  <div className="bg-gray-900/50 p-4 rounded-lg border border-red-800">
                    <h4 className="text-rose-400 font-medium mb-2">High Risk Items</h4>
                    <ul className="space-y-2">
                      {res.filter(item => parseFloat(item.Relevance) > 0.6).map((item, idx) => (
                        <li key={idx} className="flex items-start">
                          <AlertTriangle className="h-4 w-4 text-rose-400 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-rose-200">
                            {item["Search Item"]} - matched with {item["Prohibited Item"]} ({(parseFloat(item.Relevance) * 100).toFixed(0)}% confidence)
                          </span>
                        </li>
                      ))}
                      {res.filter(item => parseFloat(item.Relevance) > 0.6).length === 0 && (
                        <li className="text-blue-300">No high risk items detected</li>
                      )}
                    </ul>
                  </div>
                  
                  <div className="bg-gray-900/50 p-4 rounded-lg border border-yellow-800">
                    <h4 className="text-yellow-400 font-medium mb-2">Medium Risk Items</h4>
                    <ul className="space-y-2">
                      {res.filter(item => parseFloat(item.Relevance) <= 0.6 && parseFloat(item.Relevance) > 0.4).map((item, idx) => (                        <li key={idx} className="flex items-start">
                          <AlertTriangle className="h-4 w-4 text-yellow-400 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-yellow-200">
                            {item["Search Item"]} - matched with {item["Prohibited Item"]} ({(parseFloat(item.Relevance) * 100).toFixed(0)}% confidence)
                          </span>
                        </li>
                      ))}
                      {res.filter(item => parseFloat(item.Relevance) <= 0.6 && parseFloat(item.Relevance) > 0.4).length === 0 && (
                        <li className="text-blue-300">No medium risk items detected</li>
                      )}
                    </ul>
                  </div>
                  
                  <div className="bg-gray-900/50 p-4 rounded-lg border border-green-800">
                    <h4 className="text-emerald-400 font-medium mb-2">Low Risk Items</h4>
                    <ul className="space-y-2">
                      {res.filter(item => parseFloat(item.Relevance) <= 0.4).map((item, idx) => (
                        <li key={idx} className="flex items-start">
                          <Check className="h-4 w-4 text-emerald-400 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-emerald-200">
                            {item["Search Item"]} - matched with {item["Prohibited Item"]} ({(parseFloat(item.Relevance) * 100).toFixed(0)}% confidence)
                          </span>
                        </li>
                      ))}
                      {res.filter(item => parseFloat(item.Relevance) <= 0.4).length === 0 && (
                        <li className="text-blue-300">No low risk items detected</li>
                      )}
                    </ul>
                  </div>
                </div>
              </motion.div>
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