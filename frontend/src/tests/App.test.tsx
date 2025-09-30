import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';

vi.mock('../pages/MonitoringPage', () => ({ MonitoringPage: () => <div>monitor</div> }));
vi.mock('../pages/VehiclesPage', () => ({ VehiclesPage: () => <div>vehicles</div> }));
vi.mock('../pages/LoginPage', () => ({ LoginPage: () => <div>login</div> }));
vi.mock('../pages/PlaybackPage', () => ({ PlaybackPage: () => <div>playback</div> }));
vi.mock('../pages/ReportsPage', () => ({ ReportsPage: () => <div>reports</div> }));
vi.mock('../pages/AlarmsPage', () => ({ AlarmsPage: () => <div>alarms</div> }));
vi.mock('../pages/DriversPage', () => ({ DriversPage: () => <div>drivers</div> }));

describe('App routing', () => {
  it('renders monitoring page by default', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByText('monitor')).toBeInTheDocument();
  });
});
