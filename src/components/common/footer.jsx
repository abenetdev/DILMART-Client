import { CATEGORIES } from "@/config";
import logo from "@/assets/logo.png";
import { Link, useNavigate } from "react-router-dom";
import { Facebook, Instagram, Youtube, Twitter } from "lucide-react";

export default function Footer() {
  const navigate = useNavigate();

  function goToCategory(catId) {
    sessionStorage.setItem("filters", JSON.stringify({ category: [catId] }));
    navigate("/listing");
  }

  return (
    /*
      Cream background palette:
        bg: #FAF7F2  (warm cream)
        border: #E8E0D4  (warm sand divider)
        heading text: #1C2E2D  (deep charcoal teal)
        body text: #5C6B6A  (muted teal-gray)
        link hover: DilMart primary teal via text-primary
        social bg: #EDE8E1  (slightly deeper cream)
        social hover: primary teal
    */
    <footer style={{ backgroundColor: "#FAF7F2" }}>

      {/* ── Main grid ─────────────────────────────────────────────────── */}
      <div className="container mx-auto px-4 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* ── Brand column ─────────────────────────────────────────── */}
          <div>
            <div className="mb-5">
              <Link to="/">
                <img
                  src={logo}
                  alt="DilMart"
                  className="h-10 w-auto object-contain"
                />
              </Link>
            </div>
            <div className="flex gap-3 mt-5">
              {[Facebook, Instagram, Twitter, Youtube].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="p-2 rounded-lg transition-colors group"
                  style={{ backgroundColor: "#EDE8E1" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "hsl(176 84% 31%)";
                    e.currentTarget.querySelector("svg").style.color = "#ffffff";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#EDE8E1";
                    e.currentTarget.querySelector("svg").style.color = "#5C6B6A";
                  }}
                  aria-label="Social link"
                >
                  <Icon className="h-4 w-4 transition-colors" style={{ color: "#5C6B6A" }} />
                </a>
              ))}
            </div>
          </div>

          {/* ── Quick Links ───────────────────────────────────────────── */}
          <div>
            <h4
              className="font-semibold text-sm uppercase tracking-widest mb-5"
              style={{ color: "#1C2E2D" }}
            >
              Quick Links
            </h4>
            <ul className="space-y-2.5 text-sm">
              {[
                ["Home", "/"],
                ["All Products", "/listing"],
                ["Search", "/search"],
                ["My Account", "/account"],
              ].map(([label, path]) => (
                <li key={label}>
                  <button
                    onClick={() => navigate(path)}
                    className="transition-colors hover:text-primary"
                    style={{ color: "#5C6B6A" }}
                  >
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Categories ───────────────────────────────────────────── */}
          <div>
            <h4
              className="font-semibold text-sm uppercase tracking-widest mb-5"
              style={{ color: "#1C2E2D" }}
            >
              Categories
            </h4>
            <ul className="space-y-2.5 text-sm">
              {CATEGORIES.slice(0, 6).map((cat) => (
                <li key={cat.id}>
                  <button
                    onClick={() => goToCategory(cat.id)}
                    className="transition-colors hover:text-primary"
                    style={{ color: "#5C6B6A" }}
                  >
                    {cat.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Support ───────────────────────────────────────────────── */}
          <div>
            <h4
              className="font-semibold text-sm uppercase tracking-widest mb-5"
              style={{ color: "#1C2E2D" }}
            >
              Support
            </h4>
            <ul className="space-y-2.5 text-sm">
              {["Help Center", "Contact Us", "Track Order"].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="transition-colors hover:text-primary"
                    style={{ color: "#5C6B6A" }}
                  >
                    {item}
                  </a>
                </li>
              ))}
              <li>
                <Link
                  to="/terms"
                  className="transition-colors hover:text-primary"
                  style={{ color: "#5C6B6A" }}
                >
                  Terms &amp; Conditions
                </Link>
              </li>
              <li>
                <Link
                  to="/refund-policy"
                  className="transition-colors hover:text-primary"
                  style={{ color: "#5C6B6A" }}
                >
                  Return &amp; Refund Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy-policy"
                  className="transition-colors hover:text-primary"
                  style={{ color: "#5C6B6A" }}
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

        </div>
      </div>

      {/* ── Bottom bar ────────────────────────────────────────────────── */}
      <div
        className="py-5"
        style={{ borderTop: "1px solid #E8E0D4" }}
      >
        <div
          className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm"
          style={{ color: "#7E8E8D" }}
        >
          <span>© {new Date().getFullYear()} DilMart. All rights reserved.</span>
          <div className="flex gap-5">
            {[
              ["Terms", "/terms"],
              ["Privacy", "/privacy-policy"],
              ["Returns", "/refund-policy"],
            ].map(([label, path]) => (
              <Link
                key={label}
                to={path}
                className="transition-colors hover:text-primary"
                style={{ color: "#7E8E8D" }}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>

    </footer>
  );
}
