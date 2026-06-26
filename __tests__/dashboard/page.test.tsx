import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import DashboardContent from '~/home/dashboard/dashboard-content';

const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockData: DashboardStats = {
  revenue: 15000,
  customers: 128,
  redeemed: 45,
  couponsSent: 230,
  credits_balance: 100,
  revenueData: [
    { month: 'Jan', revenue: 0 },
    { month: 'Feb', revenue: 0 },
    { month: 'Mar', revenue: 0 },
    { month: 'Apr', revenue: 0 },
    { month: 'May', revenue: 0 },
    { month: 'Jun', revenue: 0 },
  ],
  couponStats: {
    welcome: { sent: 100, redeemed: 20 },
    birthday: { sent: 80, redeemed: 15 },
    winback: { sent: 50, redeemed: 10 },
  },
  recentActivity: [
    { id: '1', name: 'John Doe', action: 'joined via form', timeAgo: '5 mins ago' },
    { id: '2', name: 'Jane Smith', action: 'redeemed coupon', timeAgo: '1 hr ago' },
  ],
  tenantSlug: 'test-restaurant',
};

import type { DashboardStats } from '~/home/dashboard/dashboard-content';

interface DashboardContentProps {
  data: DashboardStats | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  onRetry: () => void;
}

function renderWithProviders(props: DashboardContentProps) {
  return render(<DashboardContent {...props} />);
}

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders loading skeleton cards while fetching', async () => {
    renderWithProviders({
      isLoading: true,
      data: undefined,
      isError: false,
      error: null,
      onRetry: vi.fn(),
    });

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders three KPI cards with correct values on success', async () => {
    const dataWithCredits = {
      ...mockData,
      credits_balance: 42,
    };

    renderWithProviders({
      isLoading: false,
      data: dataWithCredits,
      isError: false,
      error: null,
      onRetry: vi.fn(),
    });

    await waitFor(() => {
      expect(screen.getByText('Total Customers')).toBeInTheDocument();
    });

    expect(screen.getByText('128')).toBeInTheDocument();
    expect(screen.getByText('230')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('Credits Remaining')).toBeInTheDocument();
  });

  it('renders error message and retry button on fetch failure', async () => {
    renderWithProviders({
      isLoading: false,
      data: undefined,
      isError: true,
      error: new Error('Network error'),
      onRetry: vi.fn(),
    });

    await waitFor(() => {
      expect(screen.getByText(/Error/i)).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
  });

  it('renders activity feed with items', async () => {
    renderWithProviders({
      isLoading: false,
      data: mockData,
      isError: false,
      error: null,
      onRetry: vi.fn(),
    });

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('renders coupon stats breakdown', async () => {
    renderWithProviders({
      isLoading: false,
      data: mockData,
      isError: false,
      error: null,
      onRetry: vi.fn(),
    });

    await waitFor(() => {
      expect(screen.getByText('Coupon Performance')).toBeInTheDocument();
    });

    expect(screen.getByText('welcome')).toBeInTheDocument();
    expect(screen.getByText('birthday')).toBeInTheDocument();
    expect(screen.getByText('winback')).toBeInTheDocument();
  });
});
