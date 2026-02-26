/**
 * StatCard Component - Displays a single statistic
 */

import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

interface StatCardProps {
  icon: string;
  label: string;
  value: string;
  color?: string;
  subtitle?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  icon,
  label,
  value,
  color = '#6366f1',
  subtitle,
}) => {
  return (
    <View style={[styles.card, { width: CARD_WIDTH }]}>
      <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
        <Icon name={icon} size={20} color={color} />
      </View>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 4,
  },
  value: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  subtitle: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 4,
  },
});

export default StatCard;
