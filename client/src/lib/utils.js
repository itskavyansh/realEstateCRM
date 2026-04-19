import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);
};

export const formatDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

export const formatDateTime = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const getStatusColor = (status) => {
  const map = {
    NEW: 'status-new',
    CONTACTED: 'status-contacted',
    QUALIFIED: 'status-qualified',
    NEGOTIATION: 'status-negotiation',
    CLOSED: 'status-closed',
    LOST: 'status-lost',
    CANCELLED: 'status-cancelled',
    AVAILABLE: 'status-available',
    UNDER_NEGOTIATION: 'status-under_negotiation',
    SOLD: 'status-sold',
    BUYER: 'status-buyer',
    SELLER: 'status-seller',
    BOTH: 'status-both',
    INQUIRY: 'status-new',
    SITE_VISIT: 'status-contacted',
    AGREEMENT: 'status-qualified',
  };
  return map[status] || 'status-new';
};

export const getInitials = (name) => {
  if (!name) return '??';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};
