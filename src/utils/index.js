export const currencyFormatter = (n) =>
  (n || 0).toLocaleString("en-US", {
    maximumFractionDigits: 2,
  });