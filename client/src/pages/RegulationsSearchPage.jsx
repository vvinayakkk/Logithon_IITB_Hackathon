
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronDown, Search } from 'lucide-react';

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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-lg w-full">
        <p>{error}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-50">
      {/* Header */}
      <header className="bg-blue-800 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-center">Country or Territory Regulations</h1>
          <p className="text-center mt-2 text-blue-100">
            Use this tool to find country or territory-specific facts and regulations that may affect your international shipment.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <form onSubmit={handleSubmit}>
            {/* Country Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Origin Country or Territory <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <button
                    type="button"
                    className="w-full bg-white border border-gray-300 rounded py-2 px-3 text-gray-700 flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onClick={() => setSourceDropdownOpen(!sourceDropdownOpen)}
                  >
                    {sourceCountry || 'Select country'}
                    <ChevronDown size={16} />
                  </button>
                  
                  {sourceDropdownOpen && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-y-auto">
                      <input
                        type="text"
                        className="w-full p-2 border-b border-gray-300 focus:outline-none"
                        placeholder="Search countries..."
                        onChange={(e) => {
                          // Implement search filter
                        }}
                      />
                      {countries.map((country, index) => (
                        <div
                          key={index}
                          className="p-2 hover:bg-blue-50 cursor-pointer"
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
              
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Destination Country or Territory <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <button
                    type="button"
                    className="w-full bg-white border border-gray-300 rounded py-2 px-3 text-gray-700 flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onClick={() => setDestDropdownOpen(!destDropdownOpen)}
                  >
                    {destinationCountry || 'Select country'}
                    <ChevronDown size={16} />
                  </button>
                  
                  {destDropdownOpen && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-y-auto">
                      <input
                        type="text"
                        className="w-full p-2 border-b border-gray-300 focus:outline-none"
                        placeholder="Search countries..."
                        onChange={(e) => {
                          // Implement search filter
                        }}
                      />
                      {countries.map((country, index) => (
                        <div
                          key={index}
                          className="p-2 hover:bg-blue-50 cursor-pointer"
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
              <label className="block text-gray-700 font-medium mb-2">
                Country or Territory Regulation Topics <span className="text-red-500">*</span>
              </label>
              
              <div className="flex mb-2 space-x-4">
                <button
                  type="button"
                  onClick={selectAllTopics}
                  className="text-blue-600 hover:text-blue-800 flex items-center"
                >
                  <Check size={16} className="mr-1" />
                  Select All
                </button>
                
                <button
                  type="button"
                  onClick={clearAllTopics}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Clear All
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {topics.map((topic, index) => (
                  <div key={index} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`topic-${index}`}
                      checked={selectedTopics.includes(topic)}
                      onChange={() => handleTopicToggle(topic)}
                      className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <label htmlFor={`topic-${index}`} className="ml-2 text-gray-700">
                      {topic}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="text-center">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg shadow-md transition-colors duration-300 flex items-center justify-center mx-auto"
              >
                <Search size={18} className="mr-2" />
                Show Regulations
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-blue-900 text-blue-100 py-4 mt-8">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2025 International Shipping Regulations</p>
        </div>
      </footer>
    </div>
  );
};

export default RegulationsSearch;
