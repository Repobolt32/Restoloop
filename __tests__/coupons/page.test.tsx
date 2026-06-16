import { render, screen, waitFor, cleanup, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import CouponsContent from '~/home/coupons/coupons-content';
import { CouponType } from '~/lib/restoloop.types';

const mockCoupons = [
  {
    id: '1',
    code: 'WELCOME10',
    type: 'welcome' as CouponType,
    discount: 10,
    status: 'sent',
    sentDate: '2026-05-20',
    customerName: 'Amit Sharma',
  },
  {
    id: '2',
    code: 'BDAY20',
    type: 'bday' as CouponType,
    discount: 20,
    status: 'redeemed',
    sentDate: '2026-05-21',
    customerName: 'Priya Patel',
  },
  {
    id: '3',
    code: 'WINBACK15',
    type: 'winback' as CouponType,
    discount: 15,
    status: 'expired',
    sentDate: '2026-05-22',
    customerName: 'Rahul Verma',
  },
];

function renderWithProviders(props: any) {
  return render(<CouponsContent {...props} />);
}

describe('CouponsContent', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders loading skeleton state while fetching', async () => {
    renderWithProviders({
      isLoading: true,
      data: undefined,
      isError: false,
      error: null,
      onRetry: vi.fn(),
    });

    expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
  });

  it('renders all coupon columns correctly on success', async () => {
    renderWithProviders({
      isLoading: false,
      data: mockCoupons,
      isError: false,
      error: null,
      onRetry: vi.fn(),
    });

    await waitFor(() => {
      expect(screen.getByText('WELCOME10')).toBeInTheDocument();
    });

    expect(screen.getByRole('cell', { name: /^Welcome$/i })).toBeInTheDocument();
    expect(screen.getByText('10%')).toBeInTheDocument(); // Assuming discount is shown as percentage
    expect(screen.getByText('sent')).toBeInTheDocument();
    expect(screen.getByText('2026-05-20')).toBeInTheDocument();
    expect(screen.getByText('Amit Sharma')).toBeInTheDocument();
  });

  it('maps coupon types to display labels correctly', async () => {
    renderWithProviders({
      isLoading: false,
      data: mockCoupons,
      isError: false,
      error: null,
      onRetry: vi.fn(),
    });

    expect(screen.getByRole('cell', { name: /^Welcome$/i })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: /^Birthday$/i })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: /^Winback$/i })).toBeInTheDocument();
  });

  it('filters coupons by type', async () => {
    renderWithProviders({
      isLoading: false,
      data: mockCoupons,
      isError: false,
      error: null,
      onRetry: vi.fn(),
    });

    // Initial state: all should be present
    expect(screen.getByText('WELCOME10')).toBeInTheDocument();
    expect(screen.getByText('BDAY20')).toBeInTheDocument();
    expect(screen.getByText('WINBACK15')).toBeInTheDocument();

    // Filter by Welcome
    const welcomeFilter = screen.getByRole('button', { name: /Welcome/i });
    fireEvent.click(welcomeFilter);

    expect(screen.getByText('WELCOME10')).toBeInTheDocument();
    expect(screen.queryByText('BDAY20')).not.toBeInTheDocument();
    expect(screen.queryByText('WINBACK15')).not.toBeInTheDocument();

    // Filter by Birthday
    const bdayFilter = screen.getByRole('button', { name: /Birthday/i });
    fireEvent.click(bdayFilter);

    expect(screen.queryByText('WELCOME10')).not.toBeInTheDocument();
    expect(screen.getByText('BDAY20')).toBeInTheDocument();
    expect(screen.queryByText('WINBACK15')).not.toBeInTheDocument();

    // Filter by Winback
    const winbackFilter = screen.getByRole('button', { name: /Winback/i });
    fireEvent.click(winbackFilter);

    expect(screen.queryByText('WELCOME10')).not.toBeInTheDocument();
    expect(screen.queryByText('BDAY20')).not.toBeInTheDocument();
    expect(screen.getByText('WINBACK15')).toBeInTheDocument();

    // Filter by All
    const allFilter = screen.getByRole('button', { name: /All/i });
    fireEvent.click(allFilter);

    expect(screen.getByText('WELCOME10')).toBeInTheDocument();
    expect(screen.getByText('BDAY20')).toBeInTheDocument();
    expect(screen.getByText('WINBACK15')).toBeInTheDocument();
  });

  it('shows empty state when no coupons are present', async () => {
    renderWithProviders({
      isLoading: false,
      data: [],
      isError: false,
      error: null,
      onRetry: vi.fn(),
    });

    expect(screen.getByText('No coupons sent yet')).toBeInTheDocument();
  });

  it('shows no-results state when filter returns no matches', async () => {
    const singleCoupon = [mockCoupons[0]]; // Only welcome
    renderWithProviders({
      isLoading: false,
      data: singleCoupon,
      isError: false,
      error: null,
      onRetry: vi.fn(),
    });

    const bdayFilter = screen.getByRole('button', { name: /Birthday/i });
    fireEvent.click(bdayFilter);

    expect(screen.getByText('No coupons match filter')).toBeInTheDocument();
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
      expect(screen.getByRole('heading', { name: /Error/i })).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
  });

  it('is read-only and has no create or edit controls', async () => {
    renderWithProviders({
      isLoading: false,
      data: mockCoupons,
      isError: false,
      error: null,
      onRetry: vi.fn(),
    });

    expect(screen.queryByRole('button', { name: /Create/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Edit/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Add/i })).not.toBeInTheDocument();
  });
});
