import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, StyleSheet, Dimensions, Modal } from 'react-native';
import { Check, AlertTriangle, X, ChevronDown, ChevronUp, Upload, Download, FileText, MapPin } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { BarChart, LineChart } from 'react-native-chart-kit';
import Papa from 'papaparse';
import { Picker } from '@react-native-picker/picker';
import ComplianceResultView from '../../components/ComplianceResultView';

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
  const [fileUri, setFileUri] = useState(null);
  const [activeTab, setActiveTab] = useState('check');
  const [complianceResults, setComplianceResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [csvData, setCsvData] = useState([]);
  const [complianceResultsCsv, setComplianceResultsCsv] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedShipmentDetails, setSelectedShipmentDetails] = useState(null);
  const [complianceStats, setComplianceStats] = useState(null);
  const [csvStats, setCsvStats] = useState(null);
  const [countries, setCountries] = useState(null);
  const [selectedRowData, setSelectedRowData] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    // Mock data for shipments
    setShipments([
      { id: 'PKG-1234', source: 'India', destination: 'Germany', contents: 'Electronics', weight: '2.5', value: '450', status: 'compliant', documents: ['invoice', 'packing-list'] },
      { id: 'PKG-2345', source: 'United States', destination: 'Japan', contents: 'Cosmetics', weight: '1.2', value: '230', status: 'warning', documents: ['invoice'] },
      { id: 'PKG-3456', source: 'China', destination: 'Brazil', contents: 'Books', weight: '4.0', value: '120', status: 'non-compliant', documents: [] },
    ]);

    // Fetch countries from API
    const getCountries = async () => {
      try {
        const response = await fetch('https://free-horribly-perch.ngrok-free.app/api/countries');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setCountries(data.countries);
      } catch (error) {
        console.error('Error fetching countries:', error);
        Alert.alert('Error', 'Failed to fetch countries. Please try again later.');
      }
    };
    getCountries();
  }, []);

  const checkCompliance = async (shipment) => {
    setLoading(true);
    try {
      const response = await fetch('https://sensible-emu-highly.ngrok-free.app/api/check_financial_all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source: shipment.source,
          destination: shipment.destination,
          shipment_details: {
            item_name: shipment.contents,
            weight: shipment.weight,
            shipment_value_usd: shipment.value,
            documents: shipment.documents
          },
        }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setComplianceResults(data);
      processComplianceData(data);
    } catch (error) {
      console.error('Error checking compliance:', error);
      Alert.alert('Error', 'Failed to check compliance. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleCsvUpload = async () => {
    try {
        const result = await DocumentPicker.getDocumentAsync({
            type: '*/*',
            copyToCacheDirectory: true,
        });

        if (!result || result.canceled || !result.assets || result.assets.length === 0) {
            console.log('User cancelled file picker');
            return;
        }

        const fileUri = result.assets[0].uri;
        setFileUri(fileUri); // Save file URI for later use

        const fileContent = await FileSystem.readAsStringAsync(fileUri, {
            encoding: FileSystem.EncodingType.UTF8,
        });

        const parsedData = Papa.parse(fileContent, { header: true }).data;
        setCsvData(parsedData);
    } catch (error) {
        console.error('Error uploading CSV:', error);
    }
};

const checkComplianceCsv = async () => {
    if (!fileUri) {
        Alert.alert('Error', 'No CSV file selected');
        return;
    }

    setLoading(true);
    try {
        const formData = new FormData();
        formData.append('file', {
            uri: fileUri,
            name: 'uploaded_file.csv',
            type: 'text/csv',
        });

        const response = await fetch('https://sensible-emu-highly.ngrok-free.app/api/check_bulk', {
            method: 'POST',
            body: formData,
            headers: {
                'Content-Type': 'multipart/form-data',
                "ngrok-skip-browser-warning": "true",
            },
        });

        const data = await response.json();
        setComplianceResultsCsv(data);
        processCsvStats(data);
    } catch (error) {
        console.error('Error checking compliance:', error);
    } finally {
        setLoading(false);
    }
};

  const processComplianceData = (results) => {
    const stats = {
      riskLevels: [0, 0, 0], // Low, Medium, High
      complianceScore: [],
    };

    if (results?.overall_compliance) {
      const riskLevel = results.overall_compliance.overall_risk_level.toLowerCase();
      const riskIndex = riskLevel === 'low' ? 0 : riskLevel === 'medium' ? 1 : 2;
      stats.riskLevels[riskIndex]++;
      stats.complianceScore.push(results.overall_compliance.compliance_score || 0);
    }

    setComplianceStats(stats);
  };

  const processCsvStats = (results) => {
    const stats = {
      riskDistribution: [0, 0, 0], // Low, Medium, High
      complianceByCountry: {},
    };

    results.results.forEach(result => {
      const riskLevel = result?.compliance_result?.overall_compliance?.overall_risk_level?.toLowerCase() || 'low';
      const isCompliant = result?.compliance_result?.overall_compliance?.compliant || false;
      
      stats.riskDistribution[riskLevel === 'low' ? 0 : riskLevel === 'medium' ? 1 : 2]++;

      const country = result.destination || 'Unknown';
      if (!stats.complianceByCountry[country]) {
        stats.complianceByCountry[country] = { total: 0, compliant: 0 };
      }
      stats.complianceByCountry[country].total++;
      if (isCompliant) {
        stats.complianceByCountry[country].compliant++;
      }
    });

    setCsvStats(stats);
  };

  const showRowDetails = (row) => {
    setSelectedRowData(row);
    setShowDetailsModal(true);
  };

  const renderComplianceGraphs = (data, type) => {
    if (!data) return null;

    return (
      <View style={styles.graphContainer}>
        {type === 'single' ? (
          <>
            <Text style={styles.graphTitle}>Risk Level Distribution</Text>
            <BarChart
              data={{
                labels: ['Low', 'Medium', 'High'],
                datasets: [{ data: data.riskLevels }],
              }}
              width={Dimensions.get('window').width - 32}
              height={220}
              yAxisLabel=""
              chartConfig={{
                backgroundColor: '#1E293B',
                backgroundGradientFrom: '#1E293B',
                backgroundGradientTo: '#1E293B',
                color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              }}
            />
          </>
        ) : (
          <>
            <Text style={styles.graphTitle}>Compliance Rate by Country</Text>
            <BarChart
              data={{
                labels: Object.keys(data.complianceByCountry),
                datasets: [{ data: Object.values(data.complianceByCountry).map(c => (c.compliant / c.total) * 100) }],
              }}
              width={Dimensions.get('window').width - 32}
              height={220}
              yAxisLabel="%"
              chartConfig={{
                backgroundColor: '#1E293B',
                backgroundGradientFrom: '#1E293B',
                backgroundGradientTo: '#1E293B',
                color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              }}
            />
          </>
        )}
      </View>
    );
  };

  const formatJson = (json) => {
    return JSON.stringify(json, null, 2);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Compliance Checker</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'check' && styles.activeTab]}
          onPress={() => setActiveTab('check')}
        >
          <Text style={styles.tabText}>Check</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'csv' && styles.activeTab]}
          onPress={() => setActiveTab('csv')}
        >
          <Text style={styles.tabText}>CSV</Text>
        </TouchableOpacity>
      </View>

      {/* Check Compliance Form */}
      {activeTab === 'check' && (
        <View style={styles.formContainer}>
          <TextInput
            style={styles.input}
            placeholder="Shipment ID"
            placeholderTextColor="#666"
            value={newShipment.id}
            onChangeText={(text) => setNewShipment({ ...newShipment, id: text })}
          />
          <Picker
            selectedValue={newShipment.source}
            style={styles.picker}
            onValueChange={(itemValue) => setNewShipment({ ...newShipment, source: itemValue })}
          >
            <Picker.Item label="Select Source Country" value="" />
            {countries && countries.map((country) => (
              <Picker.Item key={country} label={country} value={country} />
            ))}
          </Picker>
          <Picker
            selectedValue={newShipment.destination}
            style={styles.picker}
            onValueChange={(itemValue) => setNewShipment({ ...newShipment, destination: itemValue })}
          >
            <Picker.Item label="Select Destination Country" value="" />
            {countries && countries.map((country) => (
              <Picker.Item key={country} label={country} value={country} />
            ))}
          </Picker>
          <TextInput
            style={styles.input}
            placeholder="Contents"
            placeholderTextColor="#666"
            value={newShipment.contents}
            onChangeText={(text) => setNewShipment({ ...newShipment, contents: text })}
          />
          <TextInput
            style={styles.input}
            placeholder="Weight (kg)"
            placeholderTextColor="#666"
            value={newShipment.weight}
            onChangeText={(text) => setNewShipment({ ...newShipment, weight: text })}
          />
          <TextInput
            style={styles.input}
            placeholder="Value (USD)"
            placeholderTextColor="#666"
            value={newShipment.value}
            onChangeText={(text) => setNewShipment({ ...newShipment, value: text })}
          />

          <TouchableOpacity
            style={styles.button}
            onPress={() => checkCompliance(newShipment)}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Check Compliance</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* CSV Upload Section */}
      {activeTab === 'csv' && (
        <View style={styles.formContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={handleCsvUpload}
          >
            <Text style={styles.buttonText}>Upload CSV</Text>
          </TouchableOpacity>

          {csvData.length > 0 && (
            <TouchableOpacity
              style={styles.button}
              onPress={checkComplianceCsv}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Check Compliance</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Compliance Results */}
      {complianceResults && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>Compliance Results</Text>
          <ComplianceResultView results={complianceResults} />
        </View>
      )}

      {/* CSV Results Table */}
      {complianceResultsCsv?.results && (
        <View style={styles.tableContainer}>
          <Text style={styles.tableTitle}>CSV Results</Text>
          {complianceResultsCsv.results.map((row, index) => (
            <View key={index} style={styles.tableRow}>
              <View style={styles.rowInfo}>
                <Text style={styles.rowText}>ID: {row.shipment_id || 'N/A'}</Text>
                <Text style={styles.rowText}>{row.source || 'Unknown'} → {row.destination || 'Unknown'}</Text>
                <Text style={styles.rowStatus}>
                  {row.compliance_result?.overall_compliance?.overall_risk_level || 'Unknown'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.viewButton}
                onPress={() => showRowDetails(row)}
              >
                <Text style={styles.viewButtonText}>View</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Details Modal */}
      <Modal
        visible={showDetailsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDetailsModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowDetailsModal(false)}
            >
              <X size={24} color="#000" />
            </TouchableOpacity>
            <ScrollView>
              {selectedRowData && (
                <View>
                  <Text style={styles.modalTitle}>Shipment Details</Text>
                  <Text style={styles.modalText}>ID: {selectedRowData.shipment_id || 'N/A'}</Text>
                  <Text style={styles.modalText}>Source: {selectedRowData.source || 'Unknown'}</Text>
                  <Text style={styles.modalText}>Destination: {selectedRowData.destination || 'Unknown'}</Text>
                  {selectedRowData.compliance_result && (
                    <Text style={styles.modalText}>
                      {formatJson(selectedRowData.compliance_result)}
                    </Text>
                  )}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Analytics */}
      {activeTab === 'stats' && (
        <View style={styles.analyticsContainer}>
          <Text style={styles.analyticsTitle}>Analytics</Text>
          {complianceStats && renderComplianceGraphs(complianceStats, 'single')}
          {csvStats && renderComplianceGraphs(csvStats, 'bulk')}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    paddingBottom: 8,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    backgroundColor: '#1A1A1A',
    padding: 8,
    borderRadius: 12,
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#333',
  },
  activeTab: {
    backgroundColor: '#0066CC',
  },
  tabText: {
    color: '#fff',
    fontWeight: '500',
  },
  formContainer: {
    backgroundColor: '#1A1A1A',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#262626',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#404040',
    marginBottom: 12,
    color: '#fff',
  },
  picker: {
    height: 50,
    backgroundColor: '#262626',
    borderColor: '#404040',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 12,
    color: '#fff',
  },
  button: {
    backgroundColor: '#0066CC',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 0,
    marginBottom: 12,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  resultsContainer: {
    marginTop: 24,
    backgroundColor: '#1A1A1A',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  resultsContent: {
    backgroundColor: '#262626',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#404040',
  },
  resultsText: {
    color: '#fff',
  },
  tableContainer: {
    marginTop: 20,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
  },
  tableTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  rowInfo: {
    flex: 1,
  },
  rowText: {
    fontSize: 14,
    color: '#fff',
  },
  rowStatus: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  viewButton: {
    backgroundColor: '#0066CC',
    padding: 8,
    borderRadius: 6,
  },
  viewButtonText: {
    color: '#fff',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 20,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: '#333',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  modalText: {
    fontSize: 14,
    color: '#fff',
  },
  closeButton: {
    padding: 8,
    alignSelf: 'flex-end',
  },
  graphContainer: {
    marginBottom: 24,
    backgroundColor: '#1A1A1A',
    padding: 16,
    borderRadius: 12,
  },
  graphTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 12,
  },
});

export default ComplianceChecker;
