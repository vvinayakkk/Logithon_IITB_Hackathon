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
  const [complianceResultsCsv, setComplianceResultsCsv] = useState(null); // To store compliance results for CSV
  const [selectedRow, setSelectedRow] = useState(null); // To track the selected row
  const [showPopup, setShowPopup] = useState(false); // To control pop-up visibility
  const [selectedShipmentDetails, setSelectedShipmentDetails] = useState(null); // To store selected shipment details

  useEffect(() => {
    // Mock data for shipments, country restrictions, and notifications
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

    // Fetch countries from API
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

  // Check compliance for a single shipment
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

  // Check compliance for CSV data
  const checkComplianceCsv = async () => {
    setLoading(true);
    try {
      const fileInput = document.querySelector('input[type="file"]');
      const file = fileInput.files[0];
      if (!file) {
        console.error('No file selected');
        return;
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post('http://localhost:3000/api/check_bulk', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setComplianceResultsCsv(response.data);

      // Update CSV data with compliance results
      const updatedCsvData = csvData.map((row, index) => ({
        ...row,
        compliance_status: response.data.results[index].compliance_result.overall_compliance.compliant ? 'Compliant' : 'Non-Compliant',
        risk_level: response.data.results[index].compliance_result.overall_compliance.overall_risk_level,
        suggestions: response.data.results[index].compliance_result.overall_compliance.summary,
        additional_info: JSON.stringify(response.data.results[index].compliance_result) // Store additional info for pop-up
      }));
      setCsvData(updatedCsvData);
    } catch (error) {
      console.error('Error checking compliance:', error);
    } finally {
      setLoading(false);
    }
  };

  // Download updated CSV with compliance results
  const downloadUpdatedCsv = () => {
    const enhancedData = csvData.map((row, index) => {
      const complianceInfo = complianceResultsCsv?.results[index]?.compliance_result || {};

      // Flatten compliance data into the CSV row
      return {
        ...row,
        additional_info: undefined, // Remove raw additional_info
        'overall_compliant': complianceInfo.overall_compliance?.compliant || false,
        'overall_risk_level': complianceInfo.overall_compliance?.overall_risk_level || 'Unknown',
        'compliance_score': complianceInfo.overall_compliance?.compliance_score || 0,
        'required_documents': complianceInfo.document_compliance?.required_documents?.join(', ') || '',
        'missing_documents': complianceInfo.document_compliance?.missing_documents?.join(', ') || '',
        'restricted_items': complianceInfo.item_compliance?.restricted_items?.join(', ') || '',
        'prohibited_items': complianceInfo.item_compliance?.prohibited_items?.join(', ') || '',
        'compliance_violations': complianceInfo.overall_compliance?.violations?.join(', ') || '',
        'compliance_suggestions': complianceInfo.overall_compliance?.suggestions?.join(', ') || '',
        'officer_notes': complianceInfo.overall_compliance?.officer_notes || ''
      };
    });

    // Convert to CSV and trigger download
    const csv = Papa.unparse(enhancedData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'compliance_results.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle input changes for new shipment form
  const handleInputChange = (e) => {
    setNewShipment({
      ...newShipment,
      [e.target.name]: e.target.value
    });
  };

  // Handle document toggling for new shipment form
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

  // Handle CSV file upload
  const handleCsvUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        complete: (results) => {
          setCsvData(results.data);
        },
        error: (error) => {
          console.error('Error parsing CSV:', error);
        }
      });
    }
  };

  // Pop-up component to display compliance details
  const CompliancePopup = ({ details, onClose }) => {
    if (!details) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
        <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl border border-gray-700 relative">
          <div className="sticky top-0 p-4 border-b border-gray-700 flex justify-between items-center bg-gray-800">
            <h3 className="text-lg font-medium text-blue-300">Compliance Details</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-200 p-2 rounded-lg hover:bg-gray-700"
            >
              <X size={20} />
            </button>
          </div>
          <div className="p-4 space-y-4">
            {Object.entries(JSON.parse(details)).map(([section, data]) => (
              <div key={section} className="border border-gray-700 rounded-lg p-4">
                <h4 className="text-blue-300 font-medium mb-2 capitalize">
                  {section.replace(/_/g, ' ')}
                </h4>
                <div className="space-y-2">
                  {typeof data === 'object' ? (
                    Object.entries(data).map(([key, value]) => (
                      <div key={key} className="grid grid-cols-2 gap-4">
                        <span className="text-gray-400 capitalize">{key.replace(/_/g, ' ')}:</span>
                        <span className="text-white">
                          {Array.isArray(value) ? value.join(', ') : 
                           typeof value === 'object' ? JSON.stringify(value, null, 2) : 
                           String(value)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <span className="text-white">{String(data)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
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

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Compliance Check, Shipments, and CSV Upload Tabs */}
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

              {/* Tab Content */}
              <div className="p-4">
                {activeTab === 'check' && (
                  <div className="space-y-6">
                    {/* New Shipment Form */}
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

                    {/* Document Selection */}
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

                    {/* Check Compliance Button */}
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

                    {/* Shipments Table */}
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
                        <div className="mt-4 space-y-4">
                          <div className="flex justify-between items-center">
                            <h3 className="text-sm font-medium text-gray-300">Uploaded CSV Data</h3>
                            <div className="space-x-2">
                              <button
                                onClick={checkComplianceCsv}
                                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center disabled:opacity-50"
                                disabled={loading}
                              >
                                {loading ? (
                                  <div className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Checking...
                                  </div>
                                ) : (
                                  <>
                                    <AlertTriangle size={16} className="mr-2" />
                                    Check Compliance
                                  </>
                                )}
                              </button>
                              {complianceResultsCsv && (
                                <button
                                  onClick={downloadUpdatedCsv}
                                  className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white font-bold flex items-center"
                                >
                                  <Upload size={16} className="mr-2" />
                                  Download Updated CSV
                                </button>
                              )}
                            </div>
                          </div>

                          {/* CSV Data Table */}
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="bg-gray-700 bg-opacity-50">
                                  {csvData.length > 0 && Object.keys(csvData[0]).map((key) => (
                                    <th key={key} className="px-4 py-2 text-left">{key}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {csvData.map((row, index) => (
                                  <tr
                                    key={index}
                                    className={`${index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-800'} bg-opacity-40 hover:bg-gray-700 cursor-pointer`}
                                    onClick={() => {
                                      setSelectedShipmentDetails(row.additional_info);
                                      setShowPopup(true);
                                    }}
                                  >
                                    {Object.entries(row).map(([key, value], i) => (
                                      key !== 'additional_info' && (
                                        <td key={i} className="px-4 py-3">
                                          {key === 'compliance_status' ? (
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                              value === 'Compliant' ? 'bg-green-100 text-green-800' :
                                              'bg-red-100 text-red-800'
                                            }`}>
                                              {value}
                                            </span>
                                          ) : key === 'risk_level' ? (
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                              value === 'Low' ? 'bg-green-100 text-green-800' :
                                              value === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                              'bg-red-100 text-red-800'
                                            }`}>
                                              {value}
                                            </span>
                                          ) : (
                                            value
                                          )}
                                        </td>
                                      )
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Compliance Results */}
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

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Global Shipment Activity */}
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

            {/* Recent Notifications */}
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

      {/* Compliance Pop-up */}
      {showPopup && (
        <CompliancePopup
          details={selectedShipmentDetails}
          onClose={() => {
            setShowPopup(false);
            setSelectedShipmentDetails(null);
          }}
        />
      )}
    </div>
  );
};

export default ComplianceChecker;