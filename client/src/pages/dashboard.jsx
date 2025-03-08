import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Globe, AlertTriangle, Check, Package, MapPin, AlertCircle, FileText, Activity, X, ChevronDown, ChevronUp, Upload } from 'lucide-react';
import Papa from 'papaparse'; // For parsing CSV files

const ComplianceChecker = () => {
  const [shipments, setShipments] = useState([]);
  const [newShipment, setNewShipment] = useState({
    id: '',
    source: '',
    destination: '',
    contents: '',
    weight: '',
    value: '',
    documents: []
  });
  const [activeTab, setActiveTab] = useState('check');
  const [complianceResults, setComplianceResults] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [countryRestrictions, setCountryRestrictions] = useState({});
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [csvData, setCsvData] = useState([]); // To store uploaded CSV data
  const [expandedResult, setExpandedResult] = useState(null); // To track expanded compliance result

  useEffect(() => {
    setShipments([
      { id: 'PKG-1234', source: 'India', destination: 'Germany', contents: 'Electronics', weight: '2.5', value: '450', status: 'compliant', documents: ['invoice', 'packing-list'] },
      { id: 'PKG-2345', source: 'United States', destination: 'Japan', contents: 'Cosmetics', weight: '1.2', value: '230', status: 'warning', documents: ['invoice'] },
      { id: 'PKG-3456', source: 'China', destination: 'Brazil', contents: 'Books', weight: '4.0', value: '120', status: 'non-compliant', documents: [] },
      { id: 'PKG-4567', source: 'United Kingdom', destination: 'Canada', contents: 'Clothing', weight: '3.1', value: '350', status: 'compliant', documents: ['invoice', 'packing-list', 'certificate'] }
    ]);

    setCountryRestrictions({
      'Brazil': ['Electronics without certification', 'Cosmetics without testing'],
      'Japan': ['Food products without labels', 'Used clothing'],
      'Germany': ['Products without CE marking'],
      'Australia': ['Plant materials', 'Animal products without permits']
    });

    setNotifications([
      { id: 1, message: 'Restricted item detected for PKG-2345', type: 'warning' },
      { id: 2, message: 'Missing documents for PKG-3456', type: 'error' },
      { id: 3, message: 'PKG-1234 cleared for shipment', type: 'success' }
    ]);

    const getCountries = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/countries');
        setCountries(response.data.countries);
      } catch (error) {
        console.error('Error fetching countries:', error);
      }
    };
    getCountries();
  }, []);

  const checkCompliance = async (shipment) => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:3000/api/check_all', {
        source: shipment.source,
        destination: shipment.destination,
        shipment_details: {
          item_name: shipment.contents,
          weight: shipment.weight,
          value: shipment.value,
          documents: shipment.documents
        },
      });

      setComplianceResults(response.data);
    } catch (error) {
      console.error('Error checking compliance:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setNewShipment({
      ...newShipment,
      [e.target.name]: e.target.value
    });
  };

  const handleDocumentToggle = (doc) => {
    if (newShipment.documents.includes(doc)) {
      setNewShipment({
        ...newShipment,
        documents: newShipment.documents.filter(d => d !== doc)
      });
    } else {
      setNewShipment({
        ...newShipment,
        documents: [...newShipment.documents, doc]
      });
    }
  };

  const handleCsvUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        complete: (results) => {
          setCsvData(results.data); // Store parsed CSV data
        },
        error: (error) => {
          console.error('Error parsing CSV:', error);
        }
      });
    }
  };

  const gradientStyle = {
    background: 'linear-gradient(45deg, #1a1a2e, #16213e, #0f3460)',
    backgroundSize: '400% 400%',
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white" style={gradientStyle}>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-2">
            <Globe className="text-blue-400" size={28} />
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
              CrossBorder Compliance Hub
            </h1>
          </div>
          <div className="flex space-x-4">
            <button 
              onClick={() => setActiveTab('stats')}
              className={`px-3 py-1 rounded-full text-sm ${activeTab === 'stats' ? 'bg-blue-600 text-white' : 'bg-blue-900 text-blue-200 hover:bg-blue-800'}`}
            >
              <Activity size={16} className="inline mr-1" />
              Analytics
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-xl shadow-xl overflow-hidden border border-gray-700">
              <div className="flex border-b border-gray-700">
                <button 
                  onClick={() => setActiveTab('check')}
                  className={`px-4 py-3 flex-1 font-medium flex items-center justify-center ${activeTab === 'check' ? 'bg-blue-900 bg-opacity-50 text-blue-300' : 'text-gray-300 hover:bg-gray-700'}`}
                >
                  <AlertTriangle size={18} className="mr-2" />
                  Compliance Check
                </button>
                <button 
                  onClick={() => setActiveTab('shipments')}
                  className={`px-4 py-3 flex-1 font-medium flex items-center justify-center ${activeTab === 'shipments' ? 'bg-blue-900 bg-opacity-50 text-blue-300' : 'text-gray-300 hover:bg-gray-700'}`}
                >
                  <Package size={18} className="mr-2" />
                  Shipments
                </button>
                <button 
                  onClick={() => setActiveTab('csv')}
                  className={`px-4 py-3 flex-1 font-medium flex items-center justify-center ${activeTab === 'csv' ? 'bg-blue-900 bg-opacity-50 text-blue-300' : 'text-gray-300 hover:bg-gray-700'}`}
                >
                  <Upload size={18} className="mr-2" />
                  CSV Upload
                </button>
              </div>
              
              <div className="p-4">
                {activeTab === 'check' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Shipment ID</label>
                        <input 
                          type="text" 
                          name="id" 
                          value={newShipment.id} 
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 bg-gray-700 rounded-lg border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="PKG-1234"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Source Country</label>
                        <select 
                          name="source"
                          value={newShipment.source}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 bg-gray-700 rounded-lg border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select source country</option>
                          {countries.map((country) => (
                            <option key={country} value={country}>
                              {country}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Destination Country</label>
                        <select 
                          name="destination" 
                          value={newShipment.destination} 
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 bg-gray-700 rounded-lg border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select destination country</option>
                          {countries.map((country) => (
                            <option key={country} value={country}>
                              {country}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Contents</label>
                        <input 
                          type="text" 
                          name="contents" 
                          value={newShipment.contents} 
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 bg-gray-700 rounded-lg border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Electronics, Books, etc."
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">Weight (kg)</label>
                          <input 
                            type="text" 
                            name="weight" 
                            value={newShipment.weight} 
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 bg-gray-700 rounded-lg border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">Value (USD)</label>
                          <input 
                            type="text" 
                            name="value" 
                            value={newShipment.value} 
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 bg-gray-700 rounded-lg border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Required Documents that You Have?</label>
                      <div className="flex flex-wrap gap-2">
                        {['invoice', 'packing-list', 'certificate', 'license', 'customs-form'].map(doc => (
                          <button
                            key={doc}
                            onClick={() => handleDocumentToggle(doc)}
                            className={`px-3 py-1 rounded-full text-sm ${
                              newShipment.documents.includes(doc) 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                          >
                            <FileText size={14} className="inline mr-1" />
                            {doc.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex justify-center">
                      <button 
                        onClick={() => checkCompliance(newShipment)}
                        className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transform transition hover:scale-105 flex items-center"
                        disabled={loading}
                      >
                        {loading ? (
                          <div className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Checking...
                          </div>
                        ) : (
                          <>
                            <AlertTriangle size={20} className="mr-2" />
                            Check Compliance
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
                
                {activeTab === 'shipments' && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-medium text-blue-300">Recent Shipments</h2>
                      <button
                        onClick={() => setShowAddForm(!showAddForm)}
                        className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm flex items-center"
                      >
                        {showAddForm ? <ChevronUp size={16} className="mr-1" /> : <ChevronDown size={16} className="mr-1" />}
                        {showAddForm ? 'Hide Form' : 'Add Shipment'}
                      </button>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-700 bg-opacity-50">
                            <th className="px-4 py-2 text-left">ID</th>
                            <th className="px-4 py-2 text-left">Source</th>
                            <th className="px-4 py-2 text-left">Destination</th>
                            <th className="px-4 py-2 text-left">Contents</th>
                            <th className="px-4 py-2 text-right">Weight</th>
                            <th className="px-4 py-2 text-right">Value</th>
                            <th className="px-4 py-2 text-center">Status</th>
                            <th className="px-4 py-2 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {shipments.map((shipment, index) => (
                            <tr key={shipment.id} className={`${index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-800'} bg-opacity-40 hover:bg-gray-700`}>
                              <td className="px-4 py-3 font-medium">{shipment.id}</td>
                              <td className="px-4 py-3">{shipment.source}</td>
                              <td className="px-4 py-3">{shipment.destination}</td>
                              <td className="px-4 py-3">{shipment.contents}</td>
                              <td className="px-4 py-3 text-right">{shipment.weight} kg</td>
                              <td className="px-4 py-3 text-right">${shipment.value}</td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  shipment.status === 'compliant' ? 'bg-green-100 text-green-800' : 
                                  shipment.status === 'warning' ? 'bg-yellow-100 text-yellow-800' : 
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {shipment.status === 'compliant' ? <Check size={12} className="mr-1" /> : 
                                   shipment.status === 'warning' ? <AlertTriangle size={12} className="mr-1" /> : 
                                   <X size={12} className="mr-1" />}
                                  {shipment.status.charAt(0).toUpperCase() + shipment.status.slice(1)}
                                </span>
                              </td>
                              <td className="px-4 py-2 text-center">
                                <button 
                                  onClick={() => checkCompliance(shipment)}
                                  className="text-blue-400 hover:text-blue-300"
                                >
                                  <AlertTriangle size={16} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                
                {activeTab === 'csv' && (
                  <div className="space-y-6">
                    <h2 className="text-lg font-medium text-blue-300">CSV Upload</h2>
                    <div className="bg-gray-700 bg-opacity-30 rounded-lg p-4 border border-gray-600">
                      <label className="block text-sm font-medium text-gray-300 mb-2">Upload CSV File</label>
                      <input 
                        type="file" 
                        accept=".csv"
                        onChange={handleCsvUpload}
                        className="w-full px-3 py-2 bg-gray-700 rounded-lg border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {csvData.length > 0 && (
                        <div className="mt-4">
                          <h3 className="text-sm font-medium text-gray-300 mb-2">Uploaded CSV Data</h3>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="bg-gray-700 bg-opacity-50">
                                  {Object.keys(csvData[0]).map((key) => (
                                    <th key={key} className="px-4 py-2 text-left">{key}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {csvData.map((row, index) => (
                                  <tr key={index} className={`${index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-800'} bg-opacity-40 hover:bg-gray-700`}>
                                    {Object.values(row).map((value, i) => (
                                      <td key={i} className="px-4 py-3">{value}</td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          <div className="mt-4 flex justify-center">
                            <button 
                              onClick={() => checkCompliance(csvData[0])} // Check compliance for the first row
                              className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transform transition hover:scale-105 flex items-center"
                              disabled={loading}
                            >
                              {loading ? (
                                <div className="flex items-center">
                                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  Checking...
                                </div>
                              ) : (
                                <>
                                  <AlertTriangle size={20} className="mr-2" />
                                  Check Compliance
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {activeTab === 'stats' && (
                  <div className="space-y-6">
                    <h2 className="text-lg font-medium text-blue-300">Compliance Analytics</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-gray-700 bg-opacity-30 rounded-lg p-4 border border-gray-600">
                        <div className="text-gray-400 text-sm mb-1">Total Shipments</div>
                        <div className="text-2xl font-bold text-white">124</div>
                        <div className="text-green-400 text-sm">+12% this month</div>
                      </div>
                      <div className="bg-gray-700 bg-opacity-30 rounded-lg p-4 border border-gray-600">
                        <div className="text-gray-400 text-sm mb-1">Compliance Rate</div>
                        <div className="text-2xl font-bold text-white">87%</div>
                        <div className="text-green-400 text-sm">+5% improvement</div>
                      </div>
                      <div className="bg-gray-700 bg-opacity-30 rounded-lg p-4 border border-gray-600">
                        <div className="text-gray-400 text-sm mb-1">Avg. Processing Time</div>
                        <div className="text-2xl font-bold text-white">4.2 min</div>
                        <div className="text-red-400 text-sm">+0.8 min delay</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gray-700 bg-opacity-30 rounded-lg p-4 border border-gray-600">
                        <h3 className="font-medium text-gray-300 mb-4">Top Issues</h3>
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-400">Missing Documents</span>
                              <span className="text-white">42%</span>
                            </div>
                            <div className="w-full bg-gray-600 rounded-full h-2">
                              <div className="bg-red-500 h-2 rounded-full" style={{ width: '42%' }}></div>
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-400">Restricted Items</span>
                              <span className="text-white">28%</span>
                            </div>
                            <div className="w-full bg-gray-600 rounded-full h-2">
                              <div className="bg-red-500 h-2 rounded-full" style={{ width: '28%' }}></div>
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-400">Incorrect Value Declaration</span>
                              <span className="text-white">18%</span>
                            </div>
                            <div className="w-full bg-gray-600 rounded-full h-2">
                              <div className="bg-red-500 h-2 rounded-full" style={{ width: '18%' }}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="bg-gray-700 bg-opacity-30 rounded-lg p-4 border border-gray-600">
                        <h3 className="font-medium text-gray-300 mb-4">Top Destinations</h3>
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-400">Germany</span>
                              <span className="text-white">32%</span>
                            </div>
                            <div className="w-full bg-gray-600 rounded-full h-2">
                              <div className="bg-blue-500 h-2 rounded-full" style={{ width: '32%' }}></div>
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-400">Japan</span>
                              <span className="text-white">24%</span>
                            </div>
                            <div className="w-full bg-gray-600 rounded-full h-2">
                              <div className="bg-blue-500 h-2 rounded-full" style={{ width: '24%' }}></div>
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-400">Brazil</span>
                              <span className="text-white">16%</span>
                            </div>
                            <div className="w-full bg-gray-600 rounded-full h-2">
                              <div className="bg-blue-500 h-2 rounded-full" style={{ width: '16%' }}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {complianceResults && (
              <div className="mt-8 space-y-6">
                <h2 className="text-2xl font-bold text-blue-300">Compliance Results</h2>
                <div className="space-y-4">
                  {complianceResults.results.map((result, index) => (
                    <div key={index} className="bg-gray-800 bg-opacity-50 rounded-lg p-4 border border-gray-700">
                      <div 
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => setExpandedResult(expandedResult === index ? null : index)}
                      >
                        <div className="flex items-center">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                            result.compliance.compliant ? 'bg-green-500' : 
                            result.compliance.compliant === false ? 'bg-red-500' : 'bg-yellow-500'
                          }`}>
                            {result.compliance.compliant ? (
                              <Check size={16} className="text-white" />
                            ) : result.compliance.compliant === false ? (
                              <X size={16} className="text-white" />
                            ) : (
                              <AlertTriangle size={16} className="text-white" />
                            )}
                          </div>
                          <span className="ml-2 font-medium">{result.section}</span>
                        </div>
                        <button>
                          {expandedResult === index ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </button>
                      </div>
                      {expandedResult === index && (
                        <div className="mt-4 space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className="text-gray-400">Compliance Score:</span>
                              <span className="ml-2 font-medium">{result.compliance.compliance_score}</span>
                            </div>
                            <div>
                              <span className="text-gray-400">Risk Level:</span>
                              <span className={`ml-2 font-medium ${
                                result.compliance.risk_level === 'High' ? 'text-red-500' :
                                result.compliance.risk_level === 'Medium' ? 'text-yellow-500' : 'text-green-500'
                              }`}>
                                {result.compliance.risk_level}
                              </span>
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-400">Officer Notes:</span>
                            <p className="mt-1 text-gray-300">{result.compliance.officer_notes}</p>
                          </div>
                          <div>
                            <span className="text-gray-400">Reasons:</span>
                            <ul className="mt-1 list-disc list-inside text-gray-300">
                              {result.compliance.reasons.map((reason, i) => (
                                <li key={i}>{reason}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <span className="text-gray-400">Suggestions:</span>
                            <ul className="mt-1 list-disc list-inside text-gray-300">
                              {result.compliance.suggestions.map((suggestion, i) => (
                                <li key={i}>{suggestion}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <span className="text-gray-400">Violations:</span>
                            <ul className="mt-1 list-disc list-inside text-gray-300">
                              {result.compliance.violations.map((violation, i) => (
                                <li key={i}>{violation}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="space-y-6">
            <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-xl shadow-xl overflow-hidden border border-gray-700">
              <div className="px-4 py-3 border-b border-gray-700 flex justify-between items-center">
                <h2 className="font-medium text-blue-300 flex items-center">
                  <Globe size={18} className="mr-2" />
                  Global Shipment Activity
                </h2>
              </div>
              <div className="p-4">
                <div className="relative w-full h-64 flex items-center justify-center overflow-hidden">
                  <div className="absolute w-48 h-48 rounded-full border-4 border-opacity-20 border-blue-500"></div>
                  <div className="absolute w-40 h-40 rounded-full border-2 border-opacity-30 border-cyan-400"></div>
                  <svg viewBox="-10 -10 220 220" className="absolute w-64 h-64">
                    <circle cx="100" cy="100" r="100" fill="#0a192f" stroke="#2a5298" strokeWidth="1" />
                    {[20, 40, 60, 80].map((r, i) => (
                      <circle key={i} cx="100" cy="100" r={r} fill="none" stroke="#2a5298" strokeWidth="0.5" strokeDasharray="1,2" />
                    ))}
                    {Array.from({ length: 12 }).map((_, i) => {
                      const angle = (i * 30) * Math.PI / 180;
                      return (
                        <path
                          key={i}
                          d={`M 100 0 Q 100 100 100 200`}
                          fill="none"
                          stroke="#2a5298"
                          strokeWidth="0.5"
                          strokeDasharray="1,2"
                          transform={`rotate(${i * 30} 100 100)`}
                        />
                      );
                    })}
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-xl shadow-xl overflow-hidden border border-gray-700">
              <div className="px-4 py-3 border-b border-gray-700 flex justify-between items-center">
                <h2 className="font-medium text-blue-300">Recent Notifications</h2>
                <span className="px-2 py-1 bg-blue-900 text-blue-200 rounded-full text-xs">
                  {notifications.length} new
                </span>
              </div>
              <div className="p-4">
                <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                  {notifications.map(notification => (
                    <div 
                      key={notification.id} 
                      className={`p-3 rounded-lg border ${
                        notification.type === 'success' ? 'bg-green-900 bg-opacity-20 border-green-800' : 
                        notification.type === 'warning' ? 'bg-yellow-900 bg-opacity-20 border-yellow-800' : 
                        'bg-red-900 bg-opacity-20 border-red-800'
                      }`}
                    >
                      <div className="flex items-start">
                        <div className="mr-2 mt-0.5">
                          {notification.type === 'success' ? 
                            <Check size={16} className="text-green-400" /> : 
                            notification.type === 'warning' ? 
                            <AlertTriangle size={16} className="text-yellow-400" /> : 
                            <AlertCircle size={16} className="text-red-400" />}
                        </div>
                        <div>
                          <p className="text-sm text-gray-200">{notification.message}</p>
                          <p className="text-xs text-gray-400 mt-1">Just now</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplianceChecker;