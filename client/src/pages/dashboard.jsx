import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Globe, AlertTriangle, Check, Package, MapPin, AlertCircle, FileText, Activity, X, ChevronDown, ChevronUp, Upload, Download, FileDown } from 'lucide-react';
import Papa from 'papaparse'; // For parsing CSV files
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

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
  const [complianceStats, setComplianceStats] = useState(null);
  const [csvStats, setCsvStats] = useState(null);
  const [syntheticLoading, setSyntheticLoading] = useState(false); // Add a new loading state for synthetic check

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
        const response = await axios.get(' https://free-horribly-perch.ngrok-free.app/api/countries');
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
      const response = await axios.post('https://sensible-emu-highly.ngrok-free.app/api/check_financial_all', {
        source: shipment.source,
        destination: shipment.destination,
        shipment_details: {
          item_name: shipment.contents,
          weight: shipment.weight,
          shipment_value_usd: shipment.value,
          documents: shipment.documents
        },
      });

      setComplianceResults(response.data);
      processComplianceData(response.data);
    } catch (error) {
      console.error('Error checking compliance:', error);
    } finally {
      setLoading(false);
    }
  };
  const SyntheticCheckCsv = async () => {
    setSyntheticLoading(true);
    try {
      const fileInput = document.querySelector('input[type="file"]');
      const file = fileInput.files[0];
      if (!file) {
        console.error('No file selected');
        return;
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post('http://localhost:6002/api/check_bulk_custom', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setComplianceResultsCsv(response.data);
      processCsvStats(response.data);

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
      setSyntheticLoading(false);
    }
  }
  const SyntheticCheck = async (shipment) => {
    setSyntheticLoading(true);
    try {
      const response = await axios.post('http://localhost:6002/api/check_compliance', {
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
      processComplianceData(response.data);
    } catch (error) {
      console.error('Error checking compliance:', error);
    } finally {
      setSyntheticLoading(false);
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

      const response = await axios.post('https://sensible-emu-highly.ngrok-free.app/api/check_bulk', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setComplianceResultsCsv(response.data);
      processCsvStats(response.data);

      // Update CSV data with compliance results
      const updatedCsvData = csvData.map((row, index) => ({
        ...row,
        compliance_status: response.data.results[index].compliance_result.overall_compliance.compliant ? 'Compliant' : 'Non-Compliant',
        risk_level: response.data.results[index].compliance_result.overall_compliance.overall_risk_level,
        suggestions: response.data.results[index].compliance_result.overall_compliance.summary,
        additional_info: JSON.stringify(response.data.results[index].compliance_result) // Store additional info for pop-up
      }));
      setCsvData(updatedCsvData);

      const user = JSON.parse(localStorage.getItem('signup')); 
      axios.post('https://likely-key-donkey.ngrok-free.app/api/ai_agent', { results: csvData, email: user?.email })
      .catch(err => console.error("Error calling AI agent:", err));
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

  // Function to generate a color based on the value
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'high': return 'bg-red-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      case 'low': return 'bg-green-500 text-white';
      case 'compliant': return 'bg-green-500 text-white';
      case 'non-compliant': return 'bg-red-500 text-white';
      case 'warning': return 'bg-yellow-500 text-black';
      default: return 'bg-blue-500 text-white';
    }
  };

  // Improved pop-up component to display compliance details in a sequential manner
  const CompliancePopup = ({ details, onClose }) => {
    if (!details) return null;
    
    // Parse the details if it's a string
    const parsedDetails = typeof details === 'string' ? JSON.parse(details) : details;
    
    // Function to render each section 
    const renderSection = (title, data, level = 0) => {
      if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
        return null;
      }
      
      const paddingLeft = level * 16;
      
      return (
        <div 
          key={title} 
          className="border border-gray-700 rounded-lg p-4 mb-4"
          style={{ marginLeft: `${paddingLeft}px` }}
        >
          <h4 className="text-blue-300 font-medium mb-3 capitalize">
            {title.replace(/_/g, ' ')}
          </h4>
          <div className="space-y-3">
            {typeof data === 'object' && !Array.isArray(data) ? (
              Object.entries(data).map(([key, value]) => (
                <div key={key}>
                  {Array.isArray(value) || (typeof value === 'object' && value !== null) ? (
                    renderSection(key, value, level + 1)
                  ) : (
                    <div className="grid grid-cols-2 gap-4 border-b border-gray-700 pb-2">
                      <span className="text-gray-400 capitalize">{key.replace(/_/g, ' ')}:</span>
                      <span className={`text-white ${key.includes('compliant') || key.includes('risk') || key.includes('status') ? 'font-bold' : ''}`}>
                        {key.includes('compliant') ? 
                          (value ? 'Yes ✓' : 'No ✗') : 
                          (key.includes('risk_level') || key.includes('status') ? 
                            <span className={`px-2 py-1 rounded ${getStatusColor(value)}`}>{value}</span> : 
                            String(value)
                          )
                        }
                      </span>
                    </div>
                  )}
                </div>
              ))
            ) : Array.isArray(data) ? (
              <div className="pl-4 border-l-2 border-gray-700">
                <ul className="list-disc pl-4 space-y-2">
                  {data.map((item, index) => (
                    <li key={index} className="text-gray-300">
                      {typeof item === 'object' ? JSON.stringify(item) : String(item)}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <span className="text-white">{String(data)}</span>
            )}
          </div>
        </div>
      );
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-70 z-[9999] flex items-center justify-center p-4" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
        <div className="bg-gray-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-xl border border-gray-700 relative">
          <div className="sticky top-0 p-4 border-b border-gray-700 flex justify-between items-center bg-gray-800 z-10">
            <h3 className="text-xl font-medium text-blue-300">Compliance Report</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-200 p-2 rounded-lg hover:bg-gray-700"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Summary section first */}
            {parsedDetails.overall_compliance && (
              <div className="bg-gray-700 bg-opacity-30 rounded-lg p-4 mb-6 border-l-4 border-blue-500">
                <h3 className="text-lg font-bold text-blue-300 mb-3">Compliance Summary</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="flex flex-col items-center justify-center p-4 bg-gray-800 rounded-lg">
                    <span className="text-gray-400 mb-2">Overall Status</span>
                    <span className={`text-lg font-bold px-3 py-1 rounded ${parsedDetails.overall_compliance.compliant ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                      {parsedDetails.overall_compliance.compliant ? 'Compliant' : 'Non-Compliant'}
                    </span>
                  </div>
                  <div className="flex flex-col items-center justify-center p-4 bg-gray-800 rounded-lg">
                    <span className="text-gray-400 mb-2">Risk Level</span>
                    <span className={`text-lg font-bold px-3 py-1 rounded ${getStatusColor(parsedDetails.overall_compliance.overall_risk_level)}`}>
                      {parsedDetails.overall_compliance.overall_risk_level}
                    </span>
                  </div>
                </div>
                {parsedDetails.overall_compliance.summary && (
                  <div className="mt-4 p-3 bg-blue-900 bg-opacity-20 rounded border border-blue-800">
                    <p className="text-gray-300">{parsedDetails.overall_compliance.summary}</p>
                  </div>
                )}
              </div>
            )}
            
            {/* Render each main section sequentially */}
            {Object.entries(parsedDetails).map(([section, data]) => 
              renderSection(section, data)
            )}
          </div>
        </div>
      </div>
    );
  };

  // Add this function to process compliance data for graphs
  const processComplianceData = (results) => {
    const stats = {
      riskLevels: {
        labels: ['Low', 'Medium', 'High'],
        datasets: [{
          label: 'Risk Level Distribution',
          data: [0, 0, 0],
          backgroundColor: ['#10B981', '#F59E0B', '#EF4444'],
        }]
      },
      complianceScore: {
        labels: [],
        datasets: [{
          label: 'Compliance Score Trend',
          data: [],
          borderColor: '#3B82F6',
          tension: 0.1,
        }]
      }
    };

    if (results?.overall_compliance) {
      // Update risk level count
      const riskLevel = results.overall_compliance.overall_risk_level.toLowerCase();
      const riskIndex = riskLevel === 'low' ? 0 : riskLevel === 'medium' ? 1 : 2;
      stats.riskLevels.datasets[0].data[riskIndex]++;

      // Add compliance score
      stats.complianceScore.labels.push(new Date().toLocaleTimeString());
      stats.complianceScore.datasets[0].data.push(
        results.overall_compliance.compliance_score || 0
      );
    }

    setComplianceStats(stats);
  };

  // Add this function to process CSV data for graphs
  const processCsvStats = (results) => {
    const stats = {
      riskDistribution: {
        labels: ['Low', 'Medium', 'High'],
        datasets: [{
          label: 'Risk Level Distribution',
          data: [0, 0, 0],
          backgroundColor: ['#10B981', '#F59E0B', '#EF4444'],
        }]
      },
      complianceByCountry: {
        labels: [],
        datasets: [{
          label: 'Compliance Rate by Country',
          data: [],
          backgroundColor: '#3B82F6',
        }]
      }
    };

    // Process results
    const countryStats = {};
    let riskCounts = { low: 0, medium: 0, high: 0 };

    results.results.forEach(result => {
      // Count risk levels
      const riskLevel = result.compliance_result.overall_compliance.overall_risk_level.toLowerCase();
      riskCounts[riskLevel]++;

      // Calculate compliance by country
      const country = result.compliance_result.destination_country;
      if (!countryStats[country]) {
        countryStats[country] = { total: 0, compliant: 0 };
      }
      countryStats[country].total++;
      if (result.compliance_result.overall_compliance.compliant) {
        countryStats[country].compliant++;
      }
    });

    // Update risk distribution
    stats.riskDistribution.datasets[0].data = [
      riskCounts.low,
      riskCounts.medium,
      riskCounts.high
    ];

    // Update country compliance rates
    Object.entries(countryStats).forEach(([country, data]) => {
      stats.complianceByCountry.labels.push(country);
      stats.complianceByCountry.datasets[0].data.push(
        (data.compliant / data.total) * 100
      );
    });

    setCsvStats(stats);
  };

  // Update the ComplianceGraphs component styling
  const ComplianceGraphs = ({ data, type }) => {
    if (!data) return null;

    const graphOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: '#94A3B8' // text-slate-400
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: '#1E293B' // border-slate-800
          },
          ticks: { 
            color: '#94A3B8' // text-slate-400
          }
        },
        x: {
          grid: {
            color: '#1E293B' // border-slate-800
          },
          ticks: { 
            color: '#94A3B8' // text-slate-400
          }
        }
      }
    };

    return (
      <div className="space-y-6">
        {type === 'single' ? (
          <>
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
              <h3 className="text-lg font-medium text-slate-200 mb-4">Risk Level Distribution</h3>
              <div className="h-64">
                <Bar 
                  data={data.riskLevels} 
                  options={{
                    ...graphOptions,
                    plugins: {
                      ...graphOptions.plugins,
                      title: {
                        display: true,
                        color: '#E2E8F0' // text-slate-200
                      }
                    }
                  }} 
                />
              </div>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
              <h3 className="text-lg font-medium text-slate-200 mb-4">Compliance Score Trend</h3>
              <div className="h-64">
                <Line 
                  data={data.complianceScore} 
                  options={{
                    ...graphOptions,
                    plugins: {
                      ...graphOptions.plugins,
                      title: {
                        display: true,
                        color: '#E2E8F0' // text-slate-200
                      }
                    }
                  }}
                />
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
              <h3 className="text-lg font-medium text-slate-200 mb-4">Risk Distribution (Bulk)</h3>
              <div className="h-64">
                <Bar 
                  data={data.riskDistribution} 
                  options={{
                    ...graphOptions,
                    plugins: {
                      ...graphOptions.plugins,
                      title: {
                        display: true,
                        color: '#E2E8F0' // text-slate-200
                      }
                    }
                  }}
                />
              </div>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
              <h3 className="text-lg font-medium text-slate-200 mb-4">Compliance Rate by Country</h3>
              <div className="h-64">
                <Bar 
                  data={data.complianceByCountry} 
                  options={{
                    ...graphOptions,
                    plugins: {
                      ...graphOptions.plugins,
                      title: {
                        display: true,
                        color: '#E2E8F0' // text-slate-200
                      }
                    },
                    scales: {
                      ...graphOptions.scales,
                      y: {
                        ...graphOptions.scales.y,
                        max: 100,
                        ticks: {
                          color: '#94A3B8',
                          callback: (value) => `${value}%`
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  // Update the stats tab section styling
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-blue-950 to-gray-900 text-slate-200">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-2">
            <Globe className="text-cyan-400" size={28} />
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
            <div className="bg-gray-900/30 backdrop-blur-sm rounded-xl shadow-xl overflow-hidden border border-blue-800">
              <div className="flex border-b border-blue-800">
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
                    <div className="flex justify-center space-x-4">
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
                      
                      <button
                        onClick={() => SyntheticCheck(newShipment)}
                        className="px-6 py-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold transform transition hover:scale-105 flex items-center"
                        disabled={syntheticLoading}
                      >
                        {syntheticLoading ? (
                          <div className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                          </div>
                        ) : (
                          <>
                            <AlertTriangle size={20} className="mr-2" />
                            Synthetic Check
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
                            <div className="flex space-x-2">
                              <button
                                onClick={checkComplianceCsv}
                                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm flex items-center"
                                disabled={loading}
                              >
                                {loading ? (
                                  <div className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Processing...
                                  </div>
                                ) : (
                                  <>
                                    <AlertTriangle size={16} className="mr-1" />
                                    Check Compliance
                                  </>
                                )}
                              </button>

                              <button
                                onClick={SyntheticCheckCsv}
                                className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm flex items-center"
                                disabled={syntheticLoading}
                              >
                                {syntheticLoading ? (
                                  <div className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Processing...
                                  </div>
                                ) : (
                                  <>
                                    <AlertTriangle size={16} className="mr-1" />
                                    Synthetic Check
                                  </>
                                )}
                              </button>

                              {complianceResultsCsv && (
                                <button
                                  onClick={downloadUpdatedCsv}
                                  className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white text-sm flex items-center"
                                >
                                  <FileDown size={16} className="mr-1" />
                                  Download Results
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="overflow-x-auto">
                            <table className="w-full text-sm border-collapse">
                              <thead>
                                <tr className="bg-gray-700 bg-opacity-50">
                                  {Object.keys(csvData[0]).slice(0, 6).map((header) => (
                                    <th key={header} className="px-3 py-2 text-left text-xs uppercase">
                                      {header}
                                    </th>
                                  ))}
                                  {complianceResultsCsv && (
                                    <>
                                      <th className="px-3 py-2 text-center text-xs uppercase">Status</th>
                                      <th className="px-3 py-2 text-center text-xs uppercase">Risk Level</th>
                                      <th className="px-3 py-2 text-center text-xs uppercase">Details</th>
                                    </>
                                  )}
                                </tr>
                              </thead>
                              <tbody>
                                {csvData.slice(0, 10).map((row, index) => (
                                  <tr 
                                    key={index} 
                                    className={`${index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-800'} bg-opacity-40 hover:bg-gray-700 ${selectedRow === index ? 'bg-gray-700' : ''}`}
                                    onClick={() => setSelectedRow(selectedRow === index ? null : index)}
                                  >
                                    {Object.keys(row).slice(0, 6).map((key) => (
                                      <td key={key} className="px-3 py-2 text-sm">
                                        {row[key]}
                                      </td>
                                    ))}
                                    {complianceResultsCsv && (
                                      <>
                                        <td className="px-3 py-2 text-center">
                                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            row.compliance_status === 'Compliant' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                          }`}>
                                            {row.compliance_status === 'Compliant' ? <Check size={12} className="mr-1" /> : <X size={12} className="mr-1" />}
                                            {row.compliance_status}
                                          </span>
                                        </td>
                                        <td className="px-3 py-2 text-center">
                                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            row.risk_level === 'Low' ? 'bg-green-100 text-green-800' :
                                            row.risk_level === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-red-100 text-red-800'
                                          }`}>
                                            {row.risk_level}
                                          </span>
                                        </td>
                                        <td className="px-3 py-2 text-center">
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              try {
                                                // Get the compliance result for this specific row from complianceResultsCsv
                                                const rowResult = complianceResultsCsv.results[index].compliance_result;
                                                if (rowResult) {
                                                  setSelectedShipmentDetails(rowResult);
                                                  setShowPopup(true);
                                                } else {
                                                  console.error('No compliance data found for this row');
                                                }
                                              } catch (error) {
                                                console.error('Error displaying compliance details:', error);
                                              }
                                            }}
                                            className="text-blue-400 hover:text-blue-300 px-2 py-1 rounded hover:bg-gray-600"
                                          >
                                            View
                                          </button>
                                        </td>
                                      </>
                                    )}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          
                          {csvData.length > 10 && (
                            <div className="text-center text-gray-400 text-sm mt-2">
                              Showing 10 of {csvData.length} rows
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Compliance Results */}
            {complianceResults?.results && (
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

            {/* Item compliance - Add null check */}
            {complianceResults?.item_compliance && (
              <div className="bg-gray-700 bg-opacity-30 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-md font-medium text-blue-300">Item Compliance</h3>
                  <button 
                    onClick={() => setExpandedResult(expandedResult === 'item' ? null : 'item')}
                    className="text-blue-300 hover:text-blue-200"
                  >
                    {expandedResult === 'item' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>
                
                <div className={`${expandedResult === 'item' ? 'block' : 'hidden'}`}>
                  {complianceResults.item_compliance.restricted_items?.length > 0 && (
                    <div className="mb-3">
                      <h4 className="text-sm font-medium text-yellow-300 mb-2">Restricted Items:</h4>
                      <ul className="list-disc pl-5 text-sm text-yellow-200 space-y-1">
                        {complianceResults.item_compliance.restricted_items.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {complianceResults.compliance.prohibited_items?.length > 0 && (
                    <div className="mb-3">
                      <h4 className="text-sm font-medium text-red-300 mb-2">Prohibited Items:</h4>
                      <ul className="list-disc pl-5 text-sm text-red-200 space-y-1">
                        {complianceResults.item_compliance.prohibited_items.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
        
                </div>
              </div>
            )}

            {/* Officer notes - Add null check */}
            {complianceResults?.compliance?.officer_notes && (
              <div className="bg-blue-900 bg-opacity-30 rounded-lg p-4 border border-blue-800">
                <h4 className="text-sm font-medium text-blue-300 mb-2">Officer Notes:</h4>
                <p className="text-sm text-gray-300">{complianceResults.overall_compliance.officer_notes}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Notifications */}
            <div className="bg-gray-900/30 backdrop-blur-sm rounded-xl shadow-xl overflow-hidden border border-blue-800">
              <div className="px-4 py-3 border-b border-gray-700">
                <h2 className="text-md font-medium text-blue-300">Notifications</h2>
              </div>
              <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-lg flex items-start ${
                      notification.type === 'success' ? 'bg-green-900 bg-opacity-20 border border-green-800' :
                      notification.type === 'warning' ? 'bg-yellow-900 bg-opacity-20 border border-yellow-800' :
                      'bg-red-900 bg-opacity-20 border border-red-800'
                    }`}
                  >
                    <span className="flex-shrink-0 mt-0.5">
                      {notification.type === 'success' ? (
                        <Check size={16} className="text-green-400" />
                      ) : notification.type === 'warning' ? (
                        <AlertTriangle size={16} className="text-yellow-400" />
                      ) : (
                        <AlertCircle size={16} className="text-red-400" />
                      )}
                    </span>
                    <p className="ml-3 text-sm text-gray-300">{notification.message}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Country Restrictions */}
            <div className="bg-gray-900/30 backdrop-blur-sm rounded-xl shadow-xl overflow-hidden border border-blue-800">
              <div className="px-4 py-3 border-b border-gray-700">
                <h2 className="text-md font-medium text-blue-300">Country Restrictions</h2>
              </div>
              <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                {Object.entries(countryRestrictions).map(([country, restrictions]) => (
                  <div key={country} className="rounded-lg bg-gray-700 bg-opacity-30 overflow-hidden">
                    <div className="px-4 py-2 bg-gray-700 flex items-center">
                      <MapPin size={14} className="text-gray-400 mr-2" />
                      <h3 className="text-sm font-medium text-white">{country}</h3>
                    </div>
                    <div className="p-3">
                      <ul className="list-disc pl-5 text-sm text-gray-300 space-y-1">
                        {restrictions.map((restriction, idx) => (
                          <li key={idx}>{restriction}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Popup for detailed information */}
        {showPopup && selectedShipmentDetails && (
          <CompliancePopup
            details={selectedShipmentDetails}
            onClose={() => {
              setShowPopup(false);
              setSelectedShipmentDetails(null);
            }}
          />
        )}

        {activeTab === 'stats' && (
          <div className="container mx-auto px-4 py-8 space-y-8">
            <div className="bg-gray-900/30 backdrop-blur-sm border border-blue-800 rounded-xl p-6">
              <h2 className="text-2xl font-semibold text-slate-200 mb-8">Compliance Analytics</h2>
              
              {/* Single Shipment Analysis */}
              {complianceStats && (
                <div className="mb-12">
                  <h3 className="text-xl font-medium text-slate-300 mb-6 flex items-center">
                    <Activity className="mr-2 text-blue-400" size={24} />
                    Single Shipment Analysis
                  </h3>
                  <ComplianceGraphs data={complianceStats} type="single" />
                </div>
              )}

              {/* Bulk Analysis */}
              {csvStats && (
                <div>
                  <h3 className="text-xl font-medium text-slate-300 mb-6 flex items-center">
                    <Package className="mr-2 text-blue-400" size={24} />
                    Bulk Analysis
                  </h3>
                  <ComplianceGraphs data={csvStats} type="bulk" />
                </div>
              )}

              {!complianceStats && !csvStats && (
                <div className="text-center py-12">
                  <div className="bg-slate-800/80 rounded-lg p-8 max-w-lg mx-auto">
                    <Activity className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                    <p className="text-slate-400 text-lg">
                      No analysis data available. Check compliance for shipments to see analytics.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComplianceChecker;