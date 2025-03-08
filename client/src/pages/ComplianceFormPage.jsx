import React, { useState } from 'react';
import { useForm } from 'react-hook-form';

function ComplianceFormPage() {
  const [complianceResult, setComplianceResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm();
  const [shipmentItems, setShipmentItems] = useState([{ 
    description: '', 
    hsCode: '', 
    quantity: 1, 
    unitValue: 0, 
    totalValue: 0, 
    weight: 0, 
    restricted: false, 
    clearanceRequired: false, 
    originCountry: '', 
    destinationCountry: '' 
  }]);
  
  const shipmentMethod = watch('shipmentMethod');
  
  const addShipmentItem = () => {
    setShipmentItems([...shipmentItems, { 
      description: '', 
      hsCode: '', 
      quantity: 1, 
      unitValue: 0, 
      totalValue: 0, 
      weight: 0, 
      restricted: false, 
      clearanceRequired: false, 
      originCountry: '', 
      destinationCountry: '' 
    }]);
  };
  
  const removeShipmentItem = (index) => {
    const newShipmentItems = [...shipmentItems];
    newShipmentItems.splice(index, 1);
    setShipmentItems(newShipmentItems);
  };
  
  const updateShipmentItem = (index, field, value) => {
    const newShipmentItems = [...shipmentItems];
    newShipmentItems[index][field] = value;
    
    // Auto-calculate total value if quantity or unit value changes
    if (field === 'quantity' || field === 'unitValue') {
      const quantity = field === 'quantity' ? value : newShipmentItems[index].quantity;
      const unitValue = field === 'unitValue' ? value : newShipmentItems[index].unitValue;
      newShipmentItems[index].totalValue = quantity * unitValue;
    }
    
    setShipmentItems(newShipmentItems);
  };
  
  const onSubmit = (data) => {
    setLoading(true);
    
    // Combine form data with shipment items
    const completeData = {
      ...data,
      shipmentItems
    };
    
    // Mock API call to validate compliance
    setTimeout(() => {
      // Example compliance check logic (this would be on your server in reality)
      let isCompliant = true;
      let notes = [];
      
      // Check total value thresholds (example)
      const totalValue = shipmentItems.reduce((sum, item) => sum + item.totalValue, 0);
      if (totalValue > 5000) {
        notes.push("High-value shipment requires additional documentation");
      }
      
      // Check for restricted items
      const hasRestrictedItems = shipmentItems.some(item => item.restricted);
      if (hasRestrictedItems) {
        isCompliant = false;
        notes.push("Shipment contains restricted items");
      }
      
      // Check for countries with special requirements (example)
      const restrictedCountries = ['NK', 'IR', 'CU', 'SY'];
      if (restrictedCountries.includes(data.recipientCountry)) {
        isCompliant = false;
        notes.push(`Shipments to ${data.recipientCountry} are subject to strict regulations`);
      }
      
      // Set the result
      setComplianceResult({
        status: isCompliant ? "Compliant" : "Rejected",
        message: isCompliant ? "Shipment is compliant with regulations" : "Shipment does not comply with regulations",
        notes: notes
      });
      
      setLoading(false);
    }, 1500);
  };
  
  const resetForm = () => {
    reset();
    setShipmentItems([{ 
      description: '', 
      hsCode: '', 
      quantity: 1, 
      unitValue: 0, 
      totalValue: 0, 
      weight: 0, 
      restricted: false, 
      clearanceRequired: false, 
      originCountry: '', 
      destinationCountry: '' 
    }]);
    setComplianceResult(null);
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-blue-900 text-white py-4">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-bold">Cross-Border Shipment Compliance Checker</h1>
        </div>
      </div>
      
      <div className="container mx-auto py-8 px-4">
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6 text-blue-900 border-b pb-2">Shipment Information</h2>
          
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Sender Information */}
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-4 text-gray-700">Sender Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sender Name</label>
                  <input
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    {...register("senderName", { required: "Sender name is required" })}
                  />
                  {errors.senderName && <p className="text-red-500 text-xs mt-1">{errors.senderName.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sender Country</label>
                  <select
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    {...register("senderCountry", { required: "Sender country is required" })}
                  >
                    <option value="">Select Country</option>
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
                  {errors.senderCountry && <p className="text-red-500 text-xs mt-1">{errors.senderCountry.message}</p>}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sender Address</label>
                  <textarea
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="2"
                    {...register("senderAddress", { required: "Sender address is required" })}
                  ></textarea>
                  {errors.senderAddress && <p className="text-red-500 text-xs mt-1">{errors.senderAddress.message}</p>}
                </div>
              </div>
            </div>
            
            {/* Recipient Information */}
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-4 text-gray-700">Recipient Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Name</label>
                  <input
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    {...register("recipientName", { required: "Recipient name is required" })}
                  />
                  {errors.recipientName && <p className="text-red-500 text-xs mt-1">{errors.recipientName.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Country</label>
                  <select
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    {...register("recipientCountry", { required: "Recipient country is required" })}
                  >
                    <option value="">Select Country</option>
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
                  {errors.recipientCountry && <p className="text-red-500 text-xs mt-1">{errors.recipientCountry.message}</p>}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Address</label>
                  <textarea
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="2"
                    {...register("recipientAddress", { required: "Recipient address is required" })}
                  ></textarea>
                  {errors.recipientAddress && <p className="text-red-500 text-xs mt-1">{errors.recipientAddress.message}</p>}
                </div>
              </div>
            </div>
            
            {/* Shipment Details */}
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-4 text-gray-700">Shipment Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Shipment Date</label>
                  <input
                    type="date"
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    {...register("shipmentDate", { required: "Shipment date is required" })}
                  />
                  {errors.shipmentDate && <p className="text-red-500 text-xs mt-1">{errors.shipmentDate.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Shipment Method</label>
                  <select
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    {...register("shipmentMethod", { required: "Shipment method is required" })}
                  >
                    <option value="">Select Method</option>
                    <option value="Air">Air</option>
                    <option value="Sea">Sea</option>
                    <option value="Land">Land</option>
                  </select>
                  {errors.shipmentMethod && <p className="text-red-500 text-xs mt-1">{errors.shipmentMethod.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                  <select
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    {...register("currency", { required: "Currency is required" })}
                  >
                    <option value="">Select Currency</option>
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="CAD">CAD - Canadian Dollar</option>
                    <option value="JPY">JPY - Japanese Yen</option>
                    <option value="CNY">CNY - Chinese Yuan</option>
                  </select>
                  {errors.currency && <p className="text-red-500 text-xs mt-1">{errors.currency.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Carrier</label>
                  <input
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    {...register("carrier", { required: "Carrier is required" })}
                  />
                  {errors.carrier && <p className="text-red-500 text-xs mt-1">{errors.carrier.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tracking Number</label>
                  <input
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    {...register("trackingNumber")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Weight (kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    {...register("totalWeight", { 
                      required: "Total weight is required",
                      min: { value: 0.01, message: "Weight must be greater than 0" }
                    })}
                  />
                  {errors.totalWeight && <p className="text-red-500 text-xs mt-1">{errors.totalWeight.message}</p>}
                </div>
              </div>
            </div>
            
            {/* Shipment Items */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-700">Shipment Items</h3>
                <button
                  type="button"
                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onClick={addShipmentItem}
                >
                  Add Item
                </button>
              </div>
              
              {shipmentItems.map((item, index) => (
                <div key={index} className="border border-gray-200 rounded p-4 mb-4">
                  <div className="flex justify-between mb-2">
                    <h4 className="font-medium">Item #{index + 1}</h4>
                    {shipmentItems.length > 1 && (
                      <button
                        type="button"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => removeShipmentItem(index)}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <input
                        type="text"
                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={item.description}
                        onChange={(e) => updateShipmentItem(index, 'description', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">HS Code</label>
                      <input
                        type="text"
                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={item.hsCode}
                        onChange={(e) => updateShipmentItem(index, 'hsCode', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                      <input
                        type="number"
                        min="1"
                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={item.quantity}
                        onChange={(e) => updateShipmentItem(index, 'quantity', parseInt(e.target.value))}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Unit Value</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={item.unitValue}
                        onChange={(e) => updateShipmentItem(index, 'unitValue', parseFloat(e.target.value))}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Total Value</label>
                      <input
                        type="number"
                        step="0.01"
                        className="w-full p-2 border border-gray-300 rounded bg-gray-100 focus:outline-none"
                        value={item.quantity * item.unitValue}
                        readOnly
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={item.weight}
                        onChange={(e) => updateShipmentItem(index, 'weight', parseFloat(e.target.value))}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Origin Country</label>
                      <select
                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={item.originCountry}
                        onChange={(e) => updateShipmentItem(index, 'originCountry', e.target.value)}
                        required
                      >
                        <option value="">Select Country</option>
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
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Destination Country</label>
                      <select
                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={item.destinationCountry}
                        onChange={(e) => updateShipmentItem(index, 'destinationCountry', e.target.value)}
                        required
                      >
                        <option value="">Select Country</option>
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
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        checked={item.restricted}
                        onChange={(e) => updateShipmentItem(index, 'restricted', e.target.checked)}
                        id={`restricted-${index}`}
                      />
                      <label htmlFor={`restricted-${index}`} className="ml-2 block text-sm text-gray-700">
                        Restricted Item
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        checked={item.clearanceRequired}
                        onChange={(e) => updateShipmentItem(index, 'clearanceRequired', e.target.checked)}
                        id={`clearance-${index}`}
                      />
                      <label htmlFor={`clearance-${index}`} className="ml-2 block text-sm text-gray-700">
                        Special Clearance Required
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Required Documents */}
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-4 text-gray-700">Required Documents</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    id="invoice"
                    {...register("documents.invoice")}
                  />
                  <label htmlFor="invoice" className="ml-2 block text-sm text-gray-700">
                    Commercial Invoice
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    id="packingList"
                    {...register("documents.packingList")}
                  />
                  <label htmlFor="packingList" className="ml-2 block text-sm text-gray-700">
                    Packing List
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    id="originCert"
                    {...register("documents.originCert")}
                  />
                  <label htmlFor="originCert" className="ml-2 block text-sm text-gray-700">
                    Certificate of Origin
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    id="customsDeclaration"
                    {...register("documents.customsDeclaration")}
                  />
                  <label htmlFor="customsDeclaration" className="ml-2 block text-sm text-gray-700">
                    Customs Declaration
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    id="billLading"
                    {...register("documents.billLading")}
                  />
                  <label htmlFor="billLading" className="ml-2 block text-sm text-gray-700">
                    Bill of Lading
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    id="exportLicense"
                    {...register("documents.exportLicense")}
                  />
                  <label htmlFor="exportLicense" className="ml-2 block text-sm text-gray-700">
                    Export License
                  </label>
                </div>
              </div>
            </div>
            
            {/* Additional Notes */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
              <textarea
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
                {...register("complianceNotes")}
              ></textarea>
            </div>
            
            {/* Submit Buttons */}
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Reset Form
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              >
                {loading ? (
                  <span>Checking Compliance...</span>
                ) : (
                  <span>Check Compliance</span>
                )}
              </button>
            </div>
          </form>
        </div>
        
        {/* Compliance Result */}
        {complianceResult && (
          <div className={`bg-white rounded-lg shadow-md p-6 ${
            complianceResult.status === "Compliant" ? "border-l-4 border-green-500" : "border-l-4 border-red-500"
          }`}>
            <h2 className="text-xl font-semibold mb-4 text-blue-900 border-b pb-2">Compliance Result</h2>
            
            <div className="mb-4">
              <div className="flex items-center mb-2">
                <div className={`w-3 h-3 rounded-full mr-2 ${
                  complianceResult.status === "Compliant" ? "bg-green-500" : "bg-red-500"
                }`}></div>
                <span className="font-medium">Status: {complianceResult.status}</span>
              </div>
              <p className="text-gray-700">{complianceResult.message}</p>
            </div>
            
            {complianceResult.notes.length > 0 && (
              <div>
                <h3 className="font-medium mb-2">Notes:</h3>
                <ul className="list-disc list-inside text-gray-700">
                  {complianceResult.notes.map((note, index) => (
                    <li key={index}>{note}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="mt-6">
              {complianceResult.status === "Compliant" ? (
                <div className="p-3 bg-green-100 text-green-800 rounded">
                  Your shipment is ready to proceed. All compliance checks have passed.
                </div>
              ) : (
                <div className="p-3 bg-red-100 text-red-800 rounded">
                  Your shipment cannot proceed. Please review the compliance issues noted above.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ComplianceFormPage;