import { Navigate } from "react-router-dom";

// The full cart lives at /shop/cart — redirect there directly.
export default function AccountCartPage() {
  return <Navigate to="/shop/cart" replace />;
}
