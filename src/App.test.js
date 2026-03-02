import { render, screen } from '@testing-library/react';
import App from './App';

test('renders invoice form controls', () => {
  render(<App />);
  const sellerPanelTitle = screen.getByText(/Seller \(your details\)/i);
  expect(sellerPanelTitle).toBeInTheDocument();
});
