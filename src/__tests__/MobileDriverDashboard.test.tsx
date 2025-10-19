import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MobileDriverDashboard } from '../components/mobile/MobileDriverDashboard';
import { mockSupabase, mockNavigator, renderWithProviders } from '../utils/testHelpers';

// Mock Supabase
jest.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase
}));

// Mock navigator
Object.defineProperty(window, 'navigator', {
  value: mockNavigator,
  writable: true
});

// Mock geolocation
const mockGeolocation = {
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
  clearWatch: jest.fn()
};

Object.defineProperty(window.navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true
});

// Mock Capacitor
jest.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: () => false
  }
}));

describe('MobileDriverDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'test-driver-123', email: 'driver@test.com' } }
    });
  });

  it('renders without crashing', () => {
    renderWithProviders(<MobileDriverDashboard />);
    expect(screen.getByText('CRAVE NOW')).toBeInTheDocument();
  });

  it('shows offline state by default', () => {
    renderWithProviders(<MobileDriverDashboard />);
    expect(screen.getByText('CRAVE NOW')).toBeInTheDocument();
    expect(screen.queryByText('Still searching...')).not.toBeInTheDocument();
  });

  it('goes online when CRAVE NOW is clicked', async () => {
    mockSupabase.from().upsert.mockResolvedValue({ data: null, error: null });
    mockGeolocation.getCurrentPosition.mockImplementation((callback) => {
      callback({
        coords: {
          latitude: 40.7128,
          longitude: -74.0060,
          accuracy: 10
        }
      });
    });

    renderWithProviders(<MobileDriverDashboard />);
    
    const craveNowButton = screen.getByText('CRAVE NOW');
    fireEvent.click(craveNowButton);

    await waitFor(() => {
      expect(mockSupabase.from().upsert).toHaveBeenCalled();
    });
  });

  it('shows loading state during online transition', async () => {
    mockSupabase.from().upsert.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ data: null, error: null }), 100))
    );

    renderWithProviders(<MobileDriverDashboard />);
    
    const craveNowButton = screen.getByText('CRAVE NOW');
    fireEvent.click(craveNowButton);

    // Should show loading state
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('handles geolocation errors gracefully', async () => {
    mockGeolocation.getCurrentPosition.mockImplementation((callback, errorCallback) => {
      errorCallback(new Error('Geolocation error'));
    });

    renderWithProviders(<MobileDriverDashboard />);
    
    const craveNowButton = screen.getByText('CRAVE NOW');
    fireEvent.click(craveNowButton);

    await waitFor(() => {
      // Should still attempt to go online even with geolocation error
      expect(mockSupabase.from().upsert).toHaveBeenCalled();
    });
  });

  it('opens hamburger menu when clicked', () => {
    renderWithProviders(<MobileDriverDashboard />);
    
    const menuButton = screen.getByRole('button', { name: /menu/i });
    fireEvent.click(menuButton);

    expect(screen.getByText('Torrance S')).toBeInTheDocument();
    expect(screen.getByText('Platinum')).toBeInTheDocument();
  });

  it('navigates to schedule when menu item is clicked', () => {
    renderWithProviders(<MobileDriverDashboard />);
    
    const menuButton = screen.getByRole('button', { name: /menu/i });
    fireEvent.click(menuButton);

    const scheduleItem = screen.getByText('Schedule');
    fireEvent.click(scheduleItem);

    // Should navigate to schedule (this would be tested with router)
    expect(scheduleItem).toBeInTheDocument();
  });

  it('shows offline indicator when network is offline', () => {
    // Mock offline state
    Object.defineProperty(window.navigator, 'onLine', {
      value: false,
      writable: true
    });

    renderWithProviders(<MobileDriverDashboard />);
    
    // Should show offline indicator
    expect(screen.getByText("You're offline")).toBeInTheDocument();
  });

  it('handles authentication errors', async () => {
    mockSupabase.auth.getUser.mockRejectedValue(new Error('Auth error'));

    renderWithProviders(<MobileDriverDashboard />);
    
    const craveNowButton = screen.getByText('CRAVE NOW');
    fireEvent.click(craveNowButton);

    await waitFor(() => {
      // Should handle error gracefully
      expect(screen.getByText('CRAVE NOW')).toBeInTheDocument();
    });
  });

  it('shows popular times chart in offline state', () => {
    renderWithProviders(<MobileDriverDashboard />);
    
    // Should show popular times chart
    expect(screen.getByText('Popular Times')).toBeInTheDocument();
  });

  it('updates time selector when end time is set', () => {
    renderWithProviders(<MobileDriverDashboard />);
    
    // This would test the time selector functionality
    // Implementation depends on the specific time selector component
  });
});
