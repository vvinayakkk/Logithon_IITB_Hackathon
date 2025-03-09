import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Header from '../components/header';

function AdminPanel() {
  const [rules, setRules] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [newRule, setNewRule] = useState({
    source: '',
    destination: '',
    rule: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedRoute, setSelectedRoute] = useState(null);

  useEffect(() => {
    // Load all routes and rules when component mounts
    fetchRoutes();
    fetchAllRules();
  }, []);

  const fetchRoutes = async () => {
    try {
      const response = await fetch('https://meerkat-welcome-remotely.ngrok-free.app/api/admin/routes' , {
        headers:{
          'ngrok-skip-browser-warning': 'true',
        }
      });
      const data = await response.json();
      setRoutes(data);
    } catch (error) {
      console.error('Error fetching routes:', error);
      setMessage('Failed to load routes');
    }
  };

  const fetchAllRules = async () => {
    try {
      const response = await fetch('https://meerkat-welcome-remotely.ngrok-free.app/api/admin/rules' , {
        headers:{
          'ngrok-skip-browser-warning': 'true',
        }
      });
      const data = await response.json();
      setRules(data);
    } catch (error) {
      console.error('Error fetching rules:', error);
      setMessage('Failed to load rules');
    }
  };

  const fetchRulesForRoute = async (source, destination) => {
    try {
      const response = await fetch(`https://meerkat-welcome-remotely.ngrok-free.app/api/rules/${source}/${destination}` , {
        headers:{
          'ngrok-skip-browser-warning': 'true',
        }
      });
      const data = await response.json();
      setSelectedRoute({ source, destination, rules: data.rules });
    } catch (error) {
      console.error('Error fetching rules for route:', error);
      setMessage('Failed to load rules for this route');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewRule({ ...newRule, [name]: value });
  };

  const handleAddRule = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch('https://meerkat-welcome-remotely.ngrok-free.app/api/rules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify(newRule),
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage('Rule added successfully');
        setNewRule({ ...newRule, rule: '' }); // Clear just the rule field
        fetchAllRules();
        fetchRoutes();
        
        // Update selected route if it matches the new rule
        if (selectedRoute && 
            selectedRoute.source === newRule.source && 
            selectedRoute.destination === newRule.destination) {
          fetchRulesForRoute(newRule.source, newRule.destination);
        }
      } else {
        setMessage(data.error || 'Failed to add rule');
      }
    } catch (error) {
      console.error('Error adding rule:', error);
      setMessage('Failed to add rule');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRule = async (source, destination, rule) => {
    setIsLoading(true);
    
    try {
      const response = await fetch(`https://meerkat-welcome-remotely.ngrok-free.app/api/rules/${source}/${destination}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({ rule }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage('Rule deleted successfully');
        fetchAllRules();
        fetchRoutes();
        
        // Update selected route if it matches the deleted rule
        if (selectedRoute && 
            selectedRoute.source === source && 
            selectedRoute.destination === destination) {
          fetchRulesForRoute(source, destination);
        }
      } else {
        setMessage(data.error || 'Failed to delete rule');
      }
    } catch (error) {
      console.error('Error deleting rule:', error);
      setMessage('Failed to delete rule');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRouteSelect = (source, destination) => {
    fetchRulesForRoute(source, destination);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-blue-950 to-gray-900">
      {/* Header */}
      <Header />
      <div className="bg-gradient-to-r from-blue-900 to-gray-900 shadow-lg border-b border-blue-800">
        <div className="container mx-auto px-4 py-6 flex items-center">
          <div className="mr-4">
            <svg className="w-8 h-8 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21,16.5C21,16.88 20.79,17.21 20.47,17.38L12.57,21.82C12.41,21.94 12.21,22 12,22C11.79,22 11.59,21.94 11.43,21.82L3.53,17.38C3.21,17.21 3,16.88 3,16.5V7.5C3,7.12 3.21,6.79 3.53,6.62L11.43,2.18C11.59,2.06 11.79,2 12,2C12.21,2 12.41,2.06 12.57,2.18L20.47,6.62C20.79,6.79 21,7.12 21,7.5V16.5Z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-blue-300">Admin Panel</h1>
            <p className="text-blue-400 text-sm">Add Custom Rules for Cross Border Shipment</p>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto py-8 px-4">
        {message && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 mb-6 rounded ${
              message.includes('success') 
                ? 'bg-blue-900/30 text-blue-200 border border-blue-700' 
                : 'bg-red-900/30 text-red-200 border border-red-700'
            }`}
          >
            {message}
          </motion.div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Add New Rule Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-900 rounded-lg shadow-lg border border-blue-800 p-6 mb-6"
          >
            <h2 className="text-xl font-semibold mb-6 text-blue-300 border-b border-blue-800 pb-2 flex items-center">
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" />
              </svg>
              Add New Compliance Rule
            </h2>
            
            <form onSubmit={handleAddRule}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-blue-300 mb-1">Source Country</label>
                <select
                  name="source"
                  value={newRule.source}
                  onChange={handleInputChange}
                  className="w-full p-2 bg-gray-800 border border-blue-800 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-blue-100"
                  required
                >
                  <option value="">Select Source Country</option>
                  <option value="US">United States</option>
                  <option value="CA">Canada</option>
                  <option value="MX">Mexico</option>
                  <option value="UK">United Kingdom</option>
                  <option value="DE">Germany</option>
                  <option value="FR">France</option>
                  <option value="CN">China</option>
                  <option value="JP">Japan</option>
                  <option value="IN">India</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-blue-300 mb-1">Destination Country</label>
                <select
                  name="destination"
                  value={newRule.destination}
                  onChange={handleInputChange}
                  className="w-full p-2 bg-gray-800 border border-blue-800 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-blue-100"
                  required
                >
                  <option value="">Select Destination Country</option>
                  <option value="US">United States</option>
                  <option value="CA">Canada</option>
                  <option value="MX">Mexico</option>
                  <option value="UK">United Kingdom</option>
                  <option value="DE">Germany</option>
                  <option value="FR">France</option>
                  <option value="CN">China</option>
                  <option value="JP">Japan</option>
                  <option value="IN">India</option>
                  <option value="IR">Iran</option>
                  <option value="CU">Cuba</option>
                  <option value="NK">North Korea</option>
                  <option value="SY">Syria</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-blue-300 mb-1">Compliance Rule</label>
                <textarea
                  name="rule"
                  value={newRule.rule}
                  onChange={handleInputChange}
                  className="w-full p-2 bg-gray-800 border border-blue-800 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-blue-100"
                  rows="3"
                  placeholder="Enter compliance rule (e.g., 'All electronics require detailed component lists')"
                  required
                ></textarea>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded hover:from-blue-700 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 flex items-center"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Adding...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" />
                    </svg>
                    Add Rule
                  </>
                )}
              </motion.button>
            </form>
          </motion.div>
          
          {/* Routes List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gray-900 rounded-lg shadow-lg border border-blue-800 p-6 mb-6"
          >
            <h2 className="text-xl font-semibold mb-6 text-blue-300 border-b border-blue-800 pb-2 flex items-center">
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15,19L9,16.89V5L15,7.11V19M20.5,3C20.78,3 21,3.22 21,3.5V20.5C21,20.78 20.78,21 20.5,21H3.5C3.22,21 3,20.78 3,20.5V3.5C3,3.22 3.22,3 3.5,3H20.5Z" />
              </svg>
              Defined Routes
            </h2>
            
            {routes.length === 0 ? (
              <div className="flex items-center justify-center p-8 bg-gray-800 rounded border border-blue-800 text-gray-400">
                <svg className="w-5 h-5 mr-2 opacity-70" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
                </svg>
                No routes defined yet. Add your first rule to create a route.
              </div>
            ) : (
              <ul className="divide-y divide-blue-800">
                {routes.map((route, index) => (
                  <li key={index} className="py-2">
                    <button
                      onClick={() => handleRouteSelect(route.source, route.destination)}
                      className={`w-full text-left flex justify-between items-center hover:bg-blue-900 hover:bg-opacity-30 p-3 rounded transition-colors duration-200 ${
                        selectedRoute && selectedRoute.source === route.source && selectedRoute.destination === route.destination
                          ? 'bg-blue-900 bg-opacity-40 border-l-4 border-blue-500'
                          : ''
                      }`}
                    >
                      <span className="font-medium flex items-center">
                        <svg className="w-4 h-4 mr-2 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M21,16.5C21,16.88 20.79,17.21 20.47,17.38L12.57,21.82C12.41,21.94 12.21,22 12,22C11.79,22 11.59,21.94 11.43,21.82L3.53,17.38C3.21,17.21 3,16.88 3,16.5V7.5C3,7.12 3.21,6.79 3.53,6.62L11.43,2.18C11.59,2.06 11.79,2 12,2C12.21,2 12.41,2.06 12.57,2.18L20.47,6.62C20.79,6.79 21,7.12 21,7.5V16.5M12,4.15L5,8.09V15.91L12,19.85L19,15.91V8.09L12,4.15Z" />
                        </svg>
                        {route.source.toUpperCase()} 
                        <svg className="w-4 h-4 mx-2 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M4,11V13H16L10.5,18.5L11.92,19.92L19.84,12L11.92,4.08L10.5,5.5L16,11H4Z" />
                        </svg> 
                        {route.destination.toUpperCase()}
                      </span>
                      <span className="bg-blue-900 text-blue-300 px-2 py-1 rounded-full text-xs flex items-center">
                        <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M14,10H2V12H14V10M14,6H2V8H14V6M2,16H10V14H2V16M21.5,11.5L23,13L16,20L11.5,15.5L13,14L16,17L21.5,11.5Z" />
                        </svg>
                        {route.rule_count} rules
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        </div>
        
        {/* Selected Route Rules */}
        {selectedRoute && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-900 rounded-lg shadow-lg border border-blue-800 p-6 mt-4"
          >
            <h2 className="text-xl font-semibold mb-6 text-blue-300 border-b border-blue-800 pb-2 flex items-center">
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3,4H21V8H3V4M3,10H21V14H3V10M3,16H21V20H3V16Z" />
              </svg>
              Rules for {selectedRoute.source.toUpperCase()} → {selectedRoute.destination.toUpperCase()}
            </h2>
            
            {selectedRoute.rules.length === 0 ? (
              <div className="flex items-center justify-center p-8 bg-gray-800 rounded border border-blue-800 text-gray-400">
                <svg className="w-5 h-5 mr-2 opacity-70" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
                </svg>
                No rules for this route.
              </div>
            ) : (
              <ul className="divide-y divide-blue-800">
                {selectedRoute.rules.map((rule, index) => (
                  <li key={index} className="py-3 flex justify-between items-center hover:bg-gray-800 rounded px-3">
                    <span className="text-gray-300 flex items-center">
                      <svg className="w-4 h-4 mr-2 text-blue-400 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M10,17L5,12L6.41,10.58L10,14.17L17.59,6.58L19,8M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
                      </svg>
                      {rule}
                    </span>
                    <button
                      onClick={() => handleDeleteRule(selectedRoute.source, selectedRoute.destination, rule)}
                      className="ml-2 text-red-400 hover:text-red-300 bg-red-900 bg-opacity-30 hover:bg-opacity-50 p-1 rounded transition-colors duration-200"
                      disabled={isLoading}
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        )}
        
        {/* All Rules Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-900 rounded-lg shadow-lg border border-blue-800 p-6 mt-6"
        >
          <h2 className="text-xl font-semibold mb-6 text-blue-300 border-b border-blue-800 pb-2 flex items-center">
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3,5H21V7H3V5M3,9H21V11H3V9M3,13H21V15H3V13M3,17H21V19H3V17Z" />
            </svg>
            All Compliance Rules
          </h2>
          
          {rules.length === 0 ? (
            <div className="flex items-center justify-center p-8 bg-gray-800 rounded border border-blue-800 text-gray-400">
              <svg className="w-5 h-5 mr-2 opacity-70" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
              </svg>
              No compliance rules defined yet.
            </div>
          ) : (
            <div className="overflow-x-auto rounded border border-blue-800">
              <table className="min-w-full divide-y divide-blue-800">
                <thead className="bg-blue-900 bg-opacity-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-blue-300 uppercase tracking-wider">
                      Source
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-blue-300 uppercase tracking-wider">
                      Destination
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-blue-300 uppercase tracking-wider">
                      Rule
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-blue-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-900 divide-y divide-blue-800">
                  {rules.map((rule, index) => (
                    <tr key={index} className="hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-300">
                        {rule.source.toUpperCase()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {rule.destination.toUpperCase()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        {rule.rule}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleDeleteRule(rule.source, rule.destination, rule.rule)}
                          className="text-red-400 hover:text-red-300 bg-red-900 bg-opacity-30 hover:bg-opacity-50 p-1 rounded transition-colors duration-200"
                          disabled={isLoading}
                        >
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
      
      {/* Footer */}
      <footer className="mt-8 py-4 border-t border-blue-800 text-center text-blue-400 text-sm bg-gray-900">
        <p>International Shipping Compliance Tool • Version 1.1.0 • Last Updated: March 2025</p>
      </footer>
    </div>
  );
}

export default AdminPanel;