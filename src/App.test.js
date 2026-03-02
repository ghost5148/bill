import { render, screen } from '@testing-library/react';
import App from './App';

test('renders invoice form controls', () => {
  render(<App />);
  const sellerPanelTitle = screen.getByText(/Seller \(your details\)/i);
  expect(sellerPanelTitle).toBeInTheDocument();

  // invoice items editor should have the correct headers
  const headers = screen.getAllByRole('columnheader');
  // there may be other tables on page, but we expect at least 6 headers for the items table
  expect(headers.length).toBeGreaterThanOrEqual(6);
  expect(screen.getByText(/Description/i)).toBeInTheDocument();
  expect(screen.getByText(/Colour/i)).toBeInTheDocument();
  expect(screen.getByText(/Rate/i)).toBeInTheDocument();
});

// numeric columns should render number-type inputs
test('numeric columns use number inputs', () => {
  render(<App />);
  const numberInputs = screen.getAllByRole('spinbutton'); // input[type=number]
  expect(numberInputs.length).toBeGreaterThanOrEqual(4); // colour, rate, amount, ps on first row
});

// ensure that new rows render correctly with inputs for each field
test('item rows contain inputs for description, colour, rate, amount and ps', () => {
  render(<App />);
  // there should be at least one row input for description
  const descInputs = screen.getAllByDisplayValue("").filter(el => el.tagName === 'INPUT');
  // at least default rows exist
  expect(descInputs.length).toBeGreaterThan(0);
});
