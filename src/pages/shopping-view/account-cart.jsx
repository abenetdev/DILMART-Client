import { Navigate } from "react-router-dom";

// The full cart lives at /cart — redirect there directly.
export default function AccountCartPage() {
  return <Navigate to="/cart" replace />;
}
