import {
  LayoutDashboard, Store, ClipboardList,
  Wallet, UserCheck, ShieldCheck, ChevronRight, Users, Package, Tag, Image, Settings,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { Sheet, SheetContent } from "../ui/sheet";

const NAV_ITEMS = [
  { id: "dashboard",           label: "Dashboard",           path: "/admin/dashboard",            icon: LayoutDashboard },
  { id: "vendors",             label: "Vendors",             path: "/admin/vendors",              icon: Store           },
  { id: "products",            label: "Products",            path: "/admin/products",             icon: Package         },
  { id: "categories",          label: "Categories",          path: "/admin/categories",           icon: Tag             },
  { id: "banners",             label: "Banners",             path: "/admin/banners",              icon: Image           },
  { id: "customers",           label: "Customers",           path: "/admin/customers",            icon: Users           },
  { id: "seller-applications", label: "Seller Applications", path: "/admin/seller-applications",  icon: UserCheck       },
  { id: "orders",              label: "Orders",              path: "/admin/orders",               icon: ClipboardList   },
  { id: "withdrawals",         label: "Withdrawals",         path: "/admin/withdrawals",          icon: Wallet          },
  { id: "settings",            label: "Settings",            path: "/admin/settings",             icon: Settings        },
];

function Logo({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 px-2 py-1 rounded-xl hover:bg-white/5 transition-colors w-full text-left"
    >
      <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30 shrink-0">
        <ShieldCheck className="h-5 w-5 text-white" />
      </div>
      <div>
        <p className="text-white font-bold text-sm leading-tight">MarketPlace</p>
        <p className="text-slate-500 text-[11px] leading-tight">Admin Panel</p>
      </div>
    </button>
  );
}

function NavItems({ onNavigate }) {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="flex flex-col gap-1 mt-2">
      {NAV_ITEMS.map(({ id, label, path, icon: Icon }) => {
        const active = location.pathname.startsWith(path);
        return (
          <button
            key={id}
            onClick={() => { navigate(path); onNavigate?.(); }}
            className={`
              group flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium
              transition-all duration-150 w-full text-left
              ${active
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
              }
            `}
          >
            <div className="flex items-center gap-3">
              <Icon className={`h-4 w-4 shrink-0 ${active ? "text-white" : "text-slate-500 group-hover:text-slate-300"}`} />
              <span>{label}</span>
            </div>
            {active && <ChevronRight className="h-3.5 w-3.5 opacity-70" />}
          </button>
        );
      })}
    </nav>
  );
}

function SidebarContent({ onNavigate }) {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col h-full bg-slate-950 px-4 py-5">
      {/* Logo */}
      <Logo onClick={() => navigate("/admin/dashboard")} />

      {/* Divider */}
      <div className="mt-5 mb-3 px-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">
          Navigation
        </p>
      </div>

      {/* Nav */}
      <NavItems onNavigate={onNavigate} />

      {/* Bottom badge */}
      <div className="mt-auto pt-6 border-t border-slate-800">
        <div className="flex items-center gap-2.5 px-2 py-2">
          <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse shrink-0" />
          <p className="text-xs text-slate-500">All systems operational</p>
        </div>
      </div>
    </div>
  );
}

export default function AdminSideBar({ open, setOpen }) {
  return (
    <>
      {/* Mobile sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="p-0 w-64 border-0">
          <SidebarContent onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 shrink-0 flex-col bg-slate-950">
        <SidebarContent />
      </aside>
    </>
  );
}
