/**
 * RecentJobsList Component - Displays recent job history
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { Job } from '../types';
import {
  formatMyai,
  formatRelativeTime,
  formatDuration,
  getStatusColor,
  getJobTypeName,
} from '../utils/format';

interface RecentJobsListProps {
  jobs: Job[];
  limit?: number;
  showViewAll?: boolean;
}

interface JobItemProps {
  job: Job;
  onPress: () => void;
}

const JobItem: React.FC<JobItemProps> = ({ job, onPress }) => {
  const statusColor = getStatusColor(job.status);

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'completed':
        return 'check-circle';
      case 'running':
        return 'play-circle';
      case 'pending':
        return 'clock-outline';
      case 'failed':
        return 'close-circle';
      case 'cancelled':
        return 'cancel';
      default:
        return 'help-circle';
    }
  };

  return (
    <TouchableOpacity style={styles.jobItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.jobLeft}>
        <Icon name={getStatusIcon(job.status)} size={24} color={statusColor} />
        <View style={styles.jobInfo}>
          <Text style={styles.jobType}>{getJobTypeName(job.job_type)}</Text>
          <Text style={styles.jobId} numberOfLines={1}>
            {job.job_id.slice(0, 12)}...
          </Text>
        </View>
      </View>

      <View style={styles.jobRight}>
        {job.status === 'completed' && job.reward_myai && (
          <Text style={styles.reward}>+{formatMyai(job.reward_myai)}</Text>
        )}
        {job.duration_seconds && (
          <Text style={styles.duration}>{formatDuration(job.duration_seconds)}</Text>
        )}
        {job.completed_at && (
          <Text style={styles.time}>{formatRelativeTime(job.completed_at)}</Text>
        )}
        {job.status === 'running' && job.started_at && (
          <Text style={[styles.time, { color: '#f59e0b' }]}>Running...</Text>
        )}
        {job.status === 'pending' && (
          <Text style={[styles.time, { color: '#94a3b8' }]}>Queued</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

export const RecentJobsList: React.FC<RecentJobsListProps> = ({
  jobs,
  limit = 10,
  showViewAll = false,
}) => {
  const navigation = useNavigation();
  const displayJobs = limit > 0 ? jobs.slice(0, limit) : jobs;

  if (jobs.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Icon name="briefcase-outline" size={48} color="#475569" />
        <Text style={styles.emptyText}>No jobs yet</Text>
        <Text style={styles.emptySubtext}>
          Jobs will appear here once your agents start processing
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {displayJobs.map((job) => (
        <JobItem
          key={job.job_id}
          job={job}
          onPress={() =>
            navigation.navigate('JobDetails' as never, { jobId: job.job_id } as never)
          }
        />
      ))}

      {showViewAll && jobs.length > limit && (
        <TouchableOpacity
          style={styles.viewAllButton}
          onPress={() => navigation.navigate('Earnings' as never)}
        >
          <Text style={styles.viewAllText}>View All Jobs</Text>
          <Icon name="chevron-right" size={16} color="#6366f1" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
  },
  jobItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  jobLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  jobInfo: {
    marginLeft: 12,
    flex: 1,
  },
  jobType: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  jobId: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 2,
  },
  jobRight: {
    alignItems: 'flex-end',
  },
  reward: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: '600',
  },
  duration: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  time: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 2,
  },
  emptyContainer: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 16,
    fontWeight: '500',
    marginTop: 16,
  },
  emptySubtext: {
    color: '#64748b',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 4,
  },
  viewAllText: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default RecentJobsList;
