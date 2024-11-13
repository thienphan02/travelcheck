import { render, screen } from '@testing-library/react';
import App from './App';

test('renders TravelCheck logo link', () => {
  render(<App />);
  const logoLink = screen.getByText(/TravelCheck/i);
  expect(logoLink).toBeInTheDocument();
});

