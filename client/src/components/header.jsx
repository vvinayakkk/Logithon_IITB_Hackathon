import { useState } from 'react';
import { motion } from 'framer-motion';
import { Package, Info, X, Check, Database, PenTool , Shield } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

function Header() {
  const [showInfoModal, setShowInfoModal] = useState(false);
  const location = useLocation();

  const navItems = [
    { path: '/regulations', icon: Database, label: 'Database' },
    { path: '/restrictions', icon: PenTool , label: 'Utilities' },
    { path: '/admin', icon: Shield, label: 'Admin' },
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 bg-gray-950 shadow-lg text-white p-4 border-b border-blue-800">
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

          <div className="flex items-center gap-6">
            <nav className="flex items-center gap-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors
                      ${location.pathname === item.path 
                        ? 'bg-blue-700 text-white' 
                        : 'text-blue-300 hover:bg-blue-800/50'}`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowInfoModal(true)}
              className="p-2 rounded-full bg-blue-700 hover:bg-blue-600 transition-colors"
            >
              <Info className="h-5 w-5" />
            </motion.button>
          </div>
        </div>
      </header>

      <div className="h-[72px]"></div>
      
      {showInfoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900/90 backdrop-blur-md rounded-xl max-w-lg w-full p-6 relative border border-blue-800"
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
    </>
  );
}

export default Header;
