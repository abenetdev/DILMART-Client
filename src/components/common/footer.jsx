import { CATEGORIES } from "@/config";
import { ShoppingBasket } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Facebook,
  Instagram,
  Youtube,
  Twitter,
} from "lucide-react"

export default function Footer() {
    const navigate = useNavigate();
    function goToCategory(catId) {
    sessionStorage.setItem("filters", JSON.stringify({ category: [catId] }));
    navigate("/shop/listing");
  }
  return (
    <footer className="bg-slate-900 text-white">
        <div className="container mx-auto px-4 py-14">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <ShoppingBasket className="h-7 w-7 text-blue-400" />
                <span className="text-xl font-bold">MarketPlace</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                Your one-stop multivendor marketplace. Shop from thousands of
                verified stores.
              </p>
              <div className="flex gap-3 mt-5">
                {[Facebook, Instagram, Twitter, Youtube].map((Icon, i) => (
                  <a
                    key={i}
                    href="#"
                    className="p-2 rounded-lg bg-slate-800 hover:bg-blue-600 transition-colors"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                {[
                  ["Home", "/shop/home"],
                  ["All Products", "/shop/listing"],
                  ["Search", "/shop/search"],
                  ["My Account", "/shop/account"],
                ].map(([label, path]) => (
                  <li key={label}>
                    <button
                      onClick={() => navigate(path)}
                      className="hover:text-white transition-colors"
                    >
                      {label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Categories */}
            <div>
              <h4 className="font-semibold mb-4">Categories</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                {CATEGORIES.slice(0, 6).map((cat) => (
                  <li key={cat.id}>
                    <button
                      onClick={() => goToCategory(cat.id)}
                      className="hover:text-white transition-colors"
                    >
                      {cat.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                {[
                  "Help Center",
                  "Contact Us",
                  "Return Policy",
                  "Track Order",
                  "Privacy Policy",
                ].map((item) => (
                  <li key={item}>
                    <a href="#" className="hover:text-white transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-slate-800 py-5">
          <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-slate-500">
            <span>
              © {new Date().getFullYear()} MarketPlace. All rights reserved.
            </span>
            <div className="flex gap-4">
              <a href="#" className="hover:text-white transition-colors">
                Terms
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Privacy
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Cookies
              </a>
            </div>
          </div>
        </div>
      </footer>
  )
}
