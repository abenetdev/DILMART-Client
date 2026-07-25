import { Outlet } from "react-router-dom";
import VendorSideBar from "./sidebar";
import VendorHeader from "./header";
import { useState } from "react";

function VendorLayout() {
  const [openSidebar, setOpenSidebar] = useState(false);

  return (
    <div className="flex min-h-screen w-full">
      {/* vendor sidebar */}
      <VendorSideBar open={openSidebar} setOpen={setOpenSidebar} />
      <div className="flex flex-1 flex-col">
        {/* vendor header */}
        <VendorHeader setOpen={setOpenSidebar} />
        <main className="flex-1 flex-col flex bg-muted/40 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default VendorLayout;
