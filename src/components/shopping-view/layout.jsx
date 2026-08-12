import { Outlet } from "react-router-dom";

function ShoppingLayout() {
  return (
    <div className="flex flex-col bg-white overflow-hidden">
      {/* Add bottom padding on mobile to account for the fixed bottom nav (h-16) */}
      <main className="flex flex-col w-full pb-16 lg:pb-0">
        <Outlet />
      </main>
    </div>
  );
}

export default ShoppingLayout;
