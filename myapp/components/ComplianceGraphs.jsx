import React from 'react';
import { View, Text } from 'react-native';
import { BarChart, LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

const screenWidth = Dimensions.get('window').width;

const ComplianceGraphs = ({ data, type }) => {
  if (!data) return null;

  const chartConfig = {
    backgroundGradientFrom: '#1E293B',
    backgroundGradientTo: '#1E293B',
    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    strokeWidth: 2,
  };

  return (
    <View className="mb-6">
      {type === 'single' ? (
        <>
          <Text className="text-white mb-2">Risk Level Distribution</Text>
          <BarChart
            data={{
              labels: data.riskLevels.labels,
              datasets: [{ data: data.riskLevels.data }],
            }}
            width={screenWidth - 40}
            height={220}
            chartConfig={chartConfig}
          />
          <Text className="text-white mb-2 mt-4">Compliance Score Trend</Text>
          <LineChart
            data={{
              labels: data.complianceScore.labels,
              datasets: [{ data: data.complianceScore.data }],
            }}
            width={screenWidth - 40}
            height={220}
            chartConfig={chartConfig}
          />
        </>
      ) : (
        <>
          <Text className="text-white mb-2">Risk Distribution (Bulk)</Text>
          <BarChart
            data={{
              labels: data.riskDistribution.labels,
              datasets: [{ data: data.riskDistribution.data }],
            }}
            width={screenWidth - 40}
            height={220}
            chartConfig={chartConfig}
          />
          <Text className="text-white mb-2 mt-4">Compliance Rate by Country</Text>
          <BarChart
            data={{
              labels: data.complianceByCountry.labels,
              datasets: [{ data: data.complianceByCountry.data }],
            }}
            width={screenWidth - 40}
            height={220}
            chartConfig={chartConfig}
          />
        </>
      )}
    </View>
  );
};

export default ComplianceGraphs;