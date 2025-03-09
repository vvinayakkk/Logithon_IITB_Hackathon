import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Check, AlertTriangle, X } from 'lucide-react-native';

const ComplianceResultView = ({ results }) => {
  const getRiskIcon = (risk_level) => {
    switch (risk_level.toLowerCase()) {
      case 'low':
        return <Check color="#22C55E" size={20} />;
      case 'medium':
        return <AlertTriangle color="#F59E0B" size={20} />;
      case 'high':
        return <X color="#EF4444" size={20} />;
      default:
        return null;
    }
  };

  const formatKey = (key) => {
    return key.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const renderValue = (value) => {
    if (typeof value === 'boolean') {
      return value ? 
        <View style={styles.badge}><Text style={[styles.badgeText, styles.successText]}>Yes</Text></View> : 
        <View style={styles.badge}><Text style={[styles.badgeText, styles.failureText]}>No</Text></View>;
    }
    if (typeof value === 'number') {
      return <Text style={styles.value}>{value}</Text>;
    }
    if (typeof value === 'string') {
      return <Text style={styles.value}>{value}</Text>;
    }
    return null;
  };

  const renderNestedObject = (obj, level = 0) => {
    if (!obj || typeof obj !== 'object') return null;

    return Object.entries(obj).map(([key, value], index) => {
      if (key === 'test_results') {
        return renderTestResults(value, level + 1, index);
      }

      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        return (
          <View key={index} style={[styles.section, { marginLeft: level * 16 }]}>
            <Text style={styles.sectionTitle}>{formatKey(key)}</Text>
            {renderNestedObject(value, level + 1)}
          </View>
        );
      }

      if (Array.isArray(value)) {
        return (
          <View key={index} style={[styles.section, { marginLeft: level * 16 }]}>
            <Text style={styles.sectionTitle}>{formatKey(key)}</Text>
            {value.map((item, i) => (
              <View key={i} style={styles.arrayItem}>
                {renderNestedObject(item, level + 1)}
              </View>
            ))}
          </View>
        );
      }

      return (
        <View key={index} style={[styles.row, { marginLeft: level * 16 }]}>
          <Text style={styles.label}>{formatKey(key)}</Text>
          {renderValue(value)}
        </View>
      );
    });
  };

  const renderTestResults = (results, level, key) => {
    if (!Array.isArray(results)) return null;

    return (
      <View key={key} style={[styles.testResults, { marginLeft: level * 16 }]}>
        <Text style={styles.sectionTitle}>Test Results</Text>
        {results.map((test, index) => (
          <View key={index} style={styles.testItem}>
            <View style={styles.testHeader}>
              <Text style={styles.testName}>{test.test_name}</Text>
              {renderValue(test.result)}
            </View>
            {test.details && <Text style={styles.testDetails}>{test.details}</Text>}
            {test.sub_tests && renderTestResults(test.sub_tests, level + 1, `sub-${index}`)}
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {results && renderNestedObject(results)}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1E293B',
    borderRadius: 8,
    padding: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  label: {
    color: '#94A3B8',
    fontSize: 14,
    flex: 1,
  },
  value: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '500',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#334155',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  successText: {
    color: '#22C55E',
  },
  failureText: {
    color: '#EF4444',
  },
  testResults: {
    marginBottom: 16,
  },
  testItem: {
    backgroundColor: '#0F172A',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  testHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  testName: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  testDetails: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 4,
  },
  arrayItem: {
    borderLeftWidth: 2,
    borderLeftColor: '#334155',
    paddingLeft: 12,
    marginBottom: 8,
  },
});

export default ComplianceResultView;
