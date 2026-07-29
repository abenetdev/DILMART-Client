import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getStoreBySlug, clearStoreData } from "@/store/shop/store-slice";
import ShoppingProductTile from "@/components/shopping-view/product-tile";
import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MapPin,
  ArrowLeft,
  Search,
  Package,
  Store,
  AlertCircle,
  ChevronRight,
  ShoppingBag,
  CheckCircle2,
  Truck,
  RefreshCw,
  Shield,
} from "lucide-react";

const STORE_PAGE_SIZE = 12;

// ── URL normalizer ─────────────────────────────────────────────────────────
function normalizeUrl(raw) {
  if (!raw) return null;
  const t = raw.trim();
  if (!t) return null;
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
}

// ── Social pill link ───────────────────────────────────────────────────────
function SocialPill({ href, label, color }) {
  const url = normalizeUrl(href);
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      style={{ cursor: "pointer", backgroundColor: color + "15", color }}
      className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all hover:opacity-80"
    >
      {label}
    </a>
  );
}

// ── Collapsible policy section ─────────────────────────────────────────────
function PolicySection({ icon: Icon, title, content }) {
  const [open, setOpen] = useState(false);
  if (!content) return null;
  return (
    <div className="border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-100 rounded-lg">
            <Icon className="h-4 w-4 text-gray-600" />
          </div>
          <span className="font-medium text-sm">{title}</span>
        </div>
        <ChevronRight
          className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${open ? "rotate-90" : ""}`}
        />
      </button>
      {open && (
        <div className="px-5 pb-5 pt-2 border-t bg-gray-50">
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
            {content}
          </p>
        </div>
      )}
    </div>
  );
}

// ── Loading skeleton ───────────────────────────────────────────────────────
function StoreSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Skeleton className="h-44 w-full" />
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex gap-5 py-5">
          <Skeleton className="h-24 w-24 rounded-2xl flex-shrink-0" />
          <div className="flex-1 space-y-3 pt-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-square rounded-xl" />
              <Skeleton className="h-3.5 w-3/4" />
              <Skeleton className="h-3.5 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Inline skeleton tiles shown while "loading more" ──────────────────────
function LoadMoreSkeleton() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-lg overflow-hidden border shadow-sm">
          <Skeleton className="h-[200px] w-full" />
          <div className="p-3 space-y-2">
            <Skeleton className="h-3.5 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
          </div>
          <div className="p-3 pt-0">
            <Skeleton className="h-8 w-full" />
          </div>
        </div>
      ))}
    </>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function StoreFront() {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { handleAddToCart } = useCart();

  const { storeData, isLoading, error } = useSelector((s) => s.shopStore);

  const [search, setSearch]       = useState("");
  const [sort, setSort]           = useState("newest");
  const [activeTab, setActiveTab] = useState("products");

  // Infinite scroll state — how many products are currently visible
  const [visibleCount, setVisibleCount] = useState(STORE_PAGE_SIZE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Sentinel ref for Intersection Observer
  const sentinelRef  = useRef(null);
  const isFetchingRef = useRef(false);

  useEffect(() => {
    if (slug) dispatch(getStoreBySlug(slug));
    return () => { dispatch(clearStoreData()); };
  }, [dispatch, slug]);

  // Reset visible count when search/sort/tab changes
  useEffect(() => {
    setVisibleCount(STORE_PAGE_SIZE);
    isFetchingRef.current = false;
  }, [search, sort, activeTab]);

  async function handleAddtoCart(productId, totalStock) {
    await handleAddToCart(productId, totalStock);
  }

  // Filtered + sorted full list
  const products = storeData?.products || [];
  const filtered = products
    .filter((p) => {
      const q = search.toLowerCase();
      return (
        !q ||
        (p.name || p.title || "").toLowerCase().includes(q) ||
        (p.description || "").toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      switch (sort) {
        case "price-asc":  return a.price - b.price;
        case "price-desc": return b.price - a.price;
        case "name":       return (a.name || a.title || "").localeCompare(b.name || b.title || "");
        default:           return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

  const hasMore   = visibleCount < filtered.length;
  const displayed = filtered.slice(0, visibleCount);

  // Load next batch
  const loadMore = useCallback(() => {
    if (isFetchingRef.current || !hasMore) return;
    isFetchingRef.current = true;
    setIsLoadingMore(true);

    // Slight delay so the skeleton has a chance to render before we bump the count
    setTimeout(() => {
      setVisibleCount((prev) => prev + STORE_PAGE_SIZE);
      setIsLoadingMore(false);
      isFetchingRef.current = false;
    }, 400);
  }, [hasMore]);

  // Intersection Observer watching the sentinel
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  if (isLoading) return <StoreSkeleton />;

  if (error || !storeData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-5 px-4 bg-gray-50">
        <div className="p-8 bg-white rounded-2xl shadow-sm border text-center max-w-sm w-full">
          <AlertCircle className="h-14 w-14 text-gray-300 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900">Store not found</h1>
          <p className="text-gray-500 mt-2 text-sm">
            <span className="font-mono font-semibold">{slug}</span> doesn't
            exist or is unavailable.
          </p>
          <Button
            onClick={() => navigate("/")}
            className="mt-5 gap-2 w-full"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Marketplace
          </Button>
        </div>
      </div>
    );
  }

  const { store } = storeData;
  const closed    = store.status === "temporarily-closed";
  const primary   = store.primaryColor   || "#2563EB";
  const secondary = store.secondaryColor || "#1E40AF";

  const socialLinks = [
    { href: store.facebook,  label: "Facebook",  color: "#1877F2" },
    { href: store.instagram, label: "Instagram", color: "#E1306C" },
    { href: store.youtube,   label: "YouTube",   color: "#FF0000" },
    { href: store.tiktok,    label: "TikTok",    color: "#000000" },
    { href: store.telegram,  label: "Telegram",  color: "#0088CC" },
    { href: store.website,   label: "Website",   color: "#6366F1" },
  ].filter((s) => s.href);

  const trustBadges = [
    store.returnPolicy  && { icon: RefreshCw,     text: "Easy Returns"    },
    store.shippingPolicy && { icon: Truck,         text: "Shipping Info"   },
    store.privacyPolicy  && { icon: Shield,        text: "Privacy Policy"  },
    store.email          && { icon: CheckCircle2,  text: "Verified Seller" },
  ].filter(Boolean);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ════════════════════════════════════════
          1. BANNER
      ════════════════════════════════════════ */}
      <div
        className="relative w-[95%] h-full mx-10 my-5 overflow-hidden"
        style={{
          height: "clamp(160px, 22vw, 220px)",
          background: store.banner
            ? undefined
            : `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`,
        }}
      >
        {store.banner && (
          <img
            src={store.banner}
            alt="Store banner"
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-black/20 pointer-events-none" />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 z-10 flex items-center gap-1.5 text-white text-sm bg-black/35 hover:bg-black/55 px-3 py-1.5 rounded-full backdrop-blur-sm transition-all cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </button>
        {closed && (
          <span className="absolute top-4 right-4 z-10 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1.5 rounded-full">
            Temporarily Closed
          </span>
        )}
      </div>

      {/* ════════════════════════════════════════
          2. PROFILE SECTION
      ════════════════════════════════════════ */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 pt-20 pb-5">
            {/* Logo */}
            <div
              className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl shadow-lg overflow-hidden flex-shrink-0 border-4 border-white sm:-mt-16 ring-1 ring-black/10 flex items-center justify-center"
              style={{ backgroundColor: primary }}
            >
              {store.logo ? (
                <img
                  src={store.logo}
                  alt={store.storeName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span
                  style={{ fontFamily: "'Playfair Display', serif" }}
                  className="text-white font-bold text-4xl"
                >
                  {store.storeName?.[0]?.toUpperCase() || "S"}
                </span>
              )}
            </div>

            {/* Info block */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex flex-col gap-1">
                  <h1
                    style={{ fontFamily: "'Playfair Display', serif" }}
                    className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight"
                  >
                    {store.storeName}
                  </h1>
                  <span className="text-[10px] font-semibold text-gray-600">
                    Since:{" "}
                    {new Date(store?.createdAt).toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
                {closed ? (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-800">
                    Closed
                  </span>
                ) : (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500 inline-block" />
                    Active
                  </span>
                )}
                {store.businessCategory && (
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 capitalize">
                    {store.businessCategory.replace(/-/g, " ")}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-gray-500">
                {store.city && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-gray-400" />
                    {[store.city, store.region, store.country]
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                )}
              </div>

              {trustBadges.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {trustBadges.map(({ icon: Icon, text }) => (
                    <span
                      key={text}
                      className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-200"
                    >
                      <Icon className="h-3 w-3" style={{ color: primary }} />
                      {text}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* CTA */}
            {!closed && (
              <div className="flex-shrink-0 sm:pt-2">
                <button
                  onClick={() => setActiveTab("products")}
                  style={{ backgroundColor: primary }}
                  className="flex items-center gap-2 text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:opacity-90 transition-all cursor-pointer shadow-sm"
                >
                  <ShoppingBag className="h-4 w-4" />
                  Shop Now
                </button>
              </div>
            )}
          </div>

          {/* Tab bar */}
          <div className="flex gap-0 -mb-px">
            {[
              { id: "products", label: `Products (${storeData.productCount})` },
              { id: "about",    label: "About & Policies" },
            ].map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === id
                    ? "border-gray-900 text-gray-900"
                    : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════
          3. CONTENT
      ════════════════════════════════════════ */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        {/* ── Products tab ──────────────────────────────────────────── */}
        {activeTab === "products" && (
          <div>
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between mb-6">
              <div className="relative w-full max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search products…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9 rounded-full border-gray-200 text-sm bg-white"
                />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400">
                  {displayed.length} of {filtered.length} product{filtered.length !== 1 ? "s" : ""}
                  {hasMore ? "…" : " — all loaded"}
                </span>
                <Select value={sort} onValueChange={setSort}>
                  <SelectTrigger className="w-[160px] h-9 rounded-full text-xs border-gray-200 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="price-asc">Price: Low → High</SelectItem>
                    <SelectItem value="price-desc">Price: High → Low</SelectItem>
                    <SelectItem value="name">Name: A → Z</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {filtered.length > 0 ? (
              <>
                {/* Product grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                  {displayed.map((p) => (
                    <ShoppingProductTile
                      key={p._id}
                      product={p}
                      handleAddtoCart={handleAddtoCart}
                    />
                  ))}

                  {/* Loading more skeleton tiles inline in the grid */}
                  {isLoadingMore && <LoadMoreSkeleton />}
                </div>

                {/* Spinner below grid while loading more */}
                {isLoadingMore && (
                  <div className="flex justify-center items-center py-6 gap-3">
                    <div className="h-5 w-5 rounded-full border-2 border-gray-400 border-t-transparent animate-spin" />
                    <span className="text-sm text-gray-400">Loading more products…</span>
                  </div>
                )}

                {/* "All loaded" message */}
                {!isLoadingMore && !hasMore && filtered.length > STORE_PAGE_SIZE && (
                  <div className="flex justify-center py-8">
                    <p className="text-sm text-gray-400">
                      You've seen all {filtered.length} products.
                    </p>
                  </div>
                )}

                {/* Sentinel — watched by Intersection Observer */}
                <div ref={sentinelRef} className="h-1" aria-hidden="true" />
              </>
            ) : (
              <div className="flex flex-col items-center py-24 gap-4">
                <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center">
                  <Package className="h-9 w-9 text-gray-400" />
                </div>
                <p className="font-semibold text-gray-800">
                  {search ? "No products found" : "No products yet"}
                </p>
                <p className="text-sm text-gray-500">
                  {search ? "Try a different keyword" : "Check back soon!"}
                </p>
                {search && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSearch("")}
                    className="rounded-full"
                  >
                    Clear search
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── About tab ─────────────────────────────────────────────── */}
        {activeTab === "about" && (
          <div className="max-w-2xl space-y-8">
            {store.aboutUs && (
              <div>
                <h2
                  style={{ fontFamily: "'Playfair Display', serif" }}
                  className="text-xl font-bold text-gray-900 mb-3"
                >
                  About {store.storeName}
                </h2>
                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                  {store.aboutUs}
                </p>
              </div>
            )}

            {(store.returnPolicy || store.shippingPolicy || store.privacyPolicy) && (
              <div>
                <h2
                  style={{ fontFamily: "'Playfair Display', serif" }}
                  className="text-xl font-bold text-gray-900 mb-4"
                >
                  Store Policies
                </h2>
                <div className="space-y-2">
                  <PolicySection
                    icon={RefreshCw}
                    title="Return Policy"
                    content={store.returnPolicy}
                  />
                  <PolicySection
                    icon={Truck}
                    title="Shipping Policy"
                    content={store.shippingPolicy}
                  />
                  <PolicySection
                    icon={Shield}
                    title="Privacy Policy"
                    content={store.privacyPolicy}
                  />
                </div>
              </div>
            )}

            {!store.aboutUs &&
              !store.phone &&
              !store.email &&
              !store.returnPolicy &&
              !store.shippingPolicy &&
              !store.privacyPolicy &&
              !socialLinks.length && (
                <div className="flex flex-col items-center py-16 gap-3">
                  <Store className="h-12 w-12 text-gray-300" />
                  <p className="text-gray-400 text-sm">
                    No information available yet
                  </p>
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  );
}
