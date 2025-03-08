import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronDown, Search, Info, BookOpen, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import Header from '../components/header';

const RegulationsSearch = () => {
  const navigate = useNavigate();
  const [sourceCountry, setSourceCountry] = useState('');
  const [destinationCountry, setDestinationCountry] = useState('');
  const [topics, setTopics] = useState([]);
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sourceDropdownOpen, setSourceDropdownOpen] = useState(false);
  const [destDropdownOpen, setDestDropdownOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // In a real app, you would fetch this from your API
        const countriesData = [
          'India', 'United States', 'United Kingdom', 'Canada', 'Australia', 
          'Germany', 'France', 'China', 'Japan', 'Switzerland', 'Brazil', 
          'Mexico', 'South Africa', 'Singapore', 'United Arab Emirates'
        ];
        
        const topicsData = [
          'Import Documentation', 'Export Documentation', 'Clearance Information',
          'Areas Served', 'Billing Options', 'Commodity Specific Stipulations',
          'Gift Exemptions', 'Invoice Requirements', 'Items Classified as Documents',
          'Prohibited or Restricted Commodities', 'Saturday Delivery',
          'Service Options', 'Special Clearance Requirements', 'Value Limits',
          'Weight and Size Limits'
        ];
        
        setCountries(countriesData);
        setTopics(topicsData);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleTopicToggle = (topic) => {
    if (selectedTopics.includes(topic)) {
      setSelectedTopics(selectedTopics.filter(t => t !== topic));
    } else {
      setSelectedTopics([...selectedTopics, topic]);
    }
  };

  const selectAllTopics = () => {
    setSelectedTopics([...topics]);
  };

  const clearAllTopics = () => {
    setSelectedTopics([]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!sourceCountry || !destinationCountry) {
      alert('Please select both source and destination countries');
      return;
    }
    
    // Navigate to regulations page with selected parameters
    navigate(`/regulations/${sourceCountry}/${destinationCountry}`);
  };

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-blue-950 to-gray-900 flex items-center justify-center">
      <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-blue-950 to-gray-900 flex items-center justify-center p-4">
      <div className="bg-red-900/50 border border-red-800 text-red-200 px-4 py-3 rounded max-w-lg w-full">
        <p>{error}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-blue-950 to-gray-900">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          {/* Title Section */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-blue-300 mb-4">Country or Territory Regulations</h1>
            <p className="text-blue-200">
              Find country or territory-specific regulations that may affect your international shipment.
            </p>
          </div>

          {/* Main Form Card */}
          <div className="bg-gray-900 rounded-xl shadow-xl border border-blue-800 p-6">
            <form onSubmit={handleSubmit}>
              {/* Country Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-blue-300 font-medium mb-2">
                    Origin Country or Territory <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      className="w-full bg-gray-800 border border-blue-800 rounded-lg py-3 px-4 text-blue-100 flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onClick={() => setSourceDropdownOpen(!sourceDropdownOpen)}
                    >
                      {sourceCountry || 'Select country'}
                      <ChevronDown size={16} className="text-blue-400" />
                    </button>
                    
                    {sourceDropdownOpen && (
                      <div className="absolute z-10 mt-1 w-full bg-gray-800 border border-blue-800 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                        <input
                          type="text"
                          className="w-full p-3 bg-gray-900 border-b border-blue-800 text-blue-100 focus:outline-none rounded-t-lg"
                          placeholder="Search countries..."
                        />
                        {countries.map((country, index) => (
                          <div
                            key={index}
                            className="p-3 hover:bg-blue-900/30 cursor-pointer text-blue-100"
                            onClick={() => {
                              setSourceCountry(country);
                              setSourceDropdownOpen(false);
                            }}
                          >
                            {country}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Destination Country (similar styling to Origin) */}
                <div>
                  <label className="block text-blue-300 font-medium mb-2">
                    Destination Country or Territory <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      className="w-full bg-gray-800 border border-blue-800 rounded-lg py-3 px-4 text-blue-100 flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onClick={() => setDestDropdownOpen(!destDropdownOpen)}
                    >
                      {destinationCountry || 'Select country'}
                      <ChevronDown size={16} className="text-blue-400" />
                    </button>
                    
                    {/* Destination Dropdown (similar to Origin) */}
                    {destDropdownOpen && (
                      <div className="absolute z-10 mt-1 w-full bg-gray-800 border border-blue-800 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                        <input
                          type="text"
                          className="w-full p-3 bg-gray-900 border-b border-blue-800 text-blue-100 focus:outline-none rounded-t-lg"
                          placeholder="Search countries..."
                        />
                        {countries.map((country, index) => (
                          <div
                            key={index}
                            className="p-3 hover:bg-blue-900/30 cursor-pointer text-blue-100"
                            onClick={() => {
                              setDestinationCountry(country);
                              setDestDropdownOpen(false);
                            }}
                          >
                            {country}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Topics Selection */}
              <div className="mb-6">
                <label className="block text-blue-300 font-medium mb-2">
                  Country or Territory Regulation Topics <span className="text-red-400">*</span>
                </label>
                
                <div className="flex mb-4 space-x-4">
                  <button
                    type="button"
                    onClick={selectAllTopics}
                    className="text-blue-400 hover:text-blue-300 flex items-center transition-colors"
                  >
                    <Check size={16} className="mr-1" />
                    Select All
                  </button>
                  
                  <button
                    type="button"
                    onClick={clearAllTopics}
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Clear All
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-gray-800 p-4 rounded-lg border border-blue-800">
                  {topics.map((topic, index) => (
                    <div key={index} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`topic-${index}`}
                        checked={selectedTopics.includes(topic)}
                        onChange={() => handleTopicToggle(topic)}
                        className="h-5 w-5 text-blue-600 rounded border-gray-600 focus:ring-blue-500 bg-gray-700"
                      />
                      <label htmlFor={`topic-${index}`} className="ml-2 text-blue-100">
                        {topic}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <div className="text-center">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  type="submit"
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-all flex items-center justify-center mx-auto"
                >
                  <Search size={18} className="mr-2" />
                  Show Regulations
                </motion.button>
              </div>
            </form>
          </div>

          {/* Additional Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gray-900 rounded-xl p-6 border border-blue-800"
            >
              <Globe className="h-8 w-8 text-blue-500 mb-4" />
              <h3 className="text-lg font-semibold text-blue-300 mb-2">Global Coverage</h3>
              <p className="text-blue-200">Access regulations for over 200+ countries and territories worldwide.</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gray-900 rounded-xl p-6 border border-blue-800"
            >
              <BookOpen className="h-8 w-8 text-blue-500 mb-4" />
              <h3 className="text-lg font-semibold text-blue-300 mb-2">Detailed Information</h3>
              <p className="text-blue-200">Comprehensive guides on import/export regulations and requirements.</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gray-900 rounded-xl p-6 border border-blue-800"
            >
              <Info className="h-8 w-8 text-blue-500 mb-4" />
              <h3 className="text-lg font-semibold text-blue-300 mb-2">Regular Updates</h3>
              <p className="text-blue-200">Stay informed with the latest changes in international shipping regulations.</p>
            </motion.div>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-950 border-t border-blue-900 text-blue-400 py-6 mt-8">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2025 International Shipping Regulations</p>
        </div>
      </footer>
    </div>
  );
};

export default RegulationsSearch;
