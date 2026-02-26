/**
 * Formatting Utilities
 */

/**
 * Format MYAI token amount
 */
export function formatMyai(amount: number, decimals: number = 2): string {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(decimals)}M MYAI`;
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(decimals)}K MYAI`;
  }
  return `${amount.toFixed(decimals)} MYAI`;
}

/**
 * Format USD amount
 */
export function formatUsd(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return 'just now';
  }
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }
  return date.toLocaleDateString();
}

/**
 * Format duration in seconds to human readable
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    const secs = seconds % 60;
    return secs > 0 ? `${minutes}m ${secs}s` : `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours < 24) {
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  const days = Math.floor(hours / 24);
  const hrs = hours % 24;
  return hrs > 0 ? `${days}d ${hrs}h` : `${days}d`;
}

/**
 * Format bytes to human readable
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }
  const mb = kb / 1024;
  if (mb < 1024) {
    return `${mb.toFixed(1)} MB`;
  }
  const gb = mb / 1024;
  return `${gb.toFixed(2)} GB`;
}

/**
 * Format VRAM in MB to human readable
 */
export function formatVram(mb: number): string {
  if (mb < 1024) {
    return `${mb} MB`;
  }
  return `${(mb / 1024).toFixed(1)} GB`;
}

/**
 * Format percentage
 */
export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

/**
 * Format temperature
 */
export function formatTemperature(celsius: number): string {
  return `${celsius}°C`;
}

/**
 * Format power consumption
 */
export function formatPower(watts: number): string {
  return `${watts}W`;
}

/**
 * Shorten wallet address for display
 */
export function shortenAddress(address: string, chars: number = 6): string {
  if (address.length <= chars * 2 + 3) {
    return address;
  }
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

/**
 * Format date to locale string
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format datetime to locale string
 */
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format number with commas
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

/**
 * Get status color
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case 'online':
    case 'completed':
    case 'confirmed':
      return '#10b981';
    case 'busy':
    case 'running':
    case 'pending':
      return '#f59e0b';
    case 'offline':
    case 'failed':
    case 'cancelled':
      return '#ef4444';
    case 'error':
      return '#ef4444';
    default:
      return '#94a3b8';
  }
}

/**
 * Get job type display name
 */
export function getJobTypeName(type: string): string {
  switch (type) {
    case 'inference':
      return 'Inference';
    case 'training':
      return 'Training';
    case 'fine-tune':
      return 'Fine-Tuning';
    case 'benchmark':
      return 'Benchmark';
    default:
      return type;
  }
}
