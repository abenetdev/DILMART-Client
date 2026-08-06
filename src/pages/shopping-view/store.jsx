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
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  MapPin, ArrowLeft, Search, Package, Store, AlertCircle,
  ChevronRight, ShoppingBag, CheckCircle2, Truck, RefreshCw,
  Shield, Zap, Clock, ShoppingCart,
} from "lucide-react";
import { currencyFormatter } from "@/utils";

const STORE_PAGE_SIZE = 12;

// ── Countdown timer ────────────────────────────────────────────────────────
function CountdownTimer({ expiresAt }) {
  const calc = useCallback(() => {
    const diff = new Date(expiresAt) - new Date();
    if (diff <= 0) return { h: "00", m: "00", s: "00", expired: true };
    const t = Math.floor(diff / 1000);
    return {
      h: String(Math.floor(t / 3600)).padStart(2, "0"),
      m: String(Math.floor((t % 3600) / 60)).padStart(2, "0"),
      s: String(t % 60).padStart(2, "0"),
      expired: false,
    };
  }, [expiresAt]);

  const [time, setTime] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(id);
  }, [calc]);

  if (time.expired)
    return <span className="text-red-500 font-bold text-xs">Expired</span>;

  return (
    <div className="flex items-center gap-0.5">
      {[time.h, time.m, time.s].map((u, i) => (
        <span key={i} className="flex items-center gap-0.5">
          <span className="bg-orange-500 text-white font-mono font-bold text-[10px] sm:text-xs px-1 py-0.5 rounded min-w-[20px] text-center">
            {u}
          </span>
          {i < 2 && <span className="text-orange-400 font-bold text-xs">:</span>}
        </span>
      ))}
    </div>
  );
}

// ── Super deal card ────────────────────────────────────────────────────────
function DealCard({ product, onAddToCart }) {
  const navigate  = useNavigate();
  const deal      = product.superDeal;
  const dealPrice = deal?.dealPrice ?? product.price;
  const origPrice = product.price;
  const discount  = origPrice > 0 ? Math.round((1 - dealPrice / origPrice) * 100) : 0;
  const savings   = origPrice - dealPrice;
  const image     = product.images?.[0] || product.image;
  const title     = product.name || product.title;

  return (
    <div
      className="group relative bg-white rounded-2xl overflow-hidden border border-orange-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col"
      onClick={() => navigate(`/product/${product._id}`)}
    >
      {/* Discount badge */}
      <div className="absolute top-0 right-0 z-10 bg-gradient-to-br from-orange-500 to-red-500 text-white text-[9px] sm:text-xs font-black px-2 sm:px-3 py-1 rounded-bl-2xl shadow leading-none">
        -{discount}%
      </div>

      {/* Image */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-orange-50 shrink-0">
        {image ? (
          <img src={image} alt={title}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <ShoppingCart className="h-10 w-10 text-orange-200" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      </div>

      {/* Content */}
      <div className="p-3 sm:p-4 flex flex-col flex-1 gap-2">
        <p className="text-[10px] font-bold text-orange-500 flex items-center gap-1 uppercase tracking-wide">
          <Zap className="h-3 w-3 shrink-0" />
          {deal?.dealTitle || "Super Deal"}
        </p>

        <h3 className="font-bold text-gray-900 text-xs sm:text-sm line-clamp-2 leading-snug flex-1">
          {title}
        </h3>

        <div className="flex flex-col gap-0.5">
          <span className="text-base sm:text-lg font-extrabold text-orange-600 leading-tight">
            {currencyFormatter(dealPrice)}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 line-through">{currencyFormatter(origPrice)}</span>
            <span className="text-[10px] text-green-600 font-semibold">Save {currencyFormatter(savings)}</span>
          </div>
        </div>

        {/* Countdown */}
        {deal?.expiresAt && (
          <div className="flex items-center gap-2 bg-orange-50 border border-orange-100 rounded-lg px-2.5 py-1.5">
            <Clock className="h-3 w-3 text-orange-400 shrink-0" />
            <span className="text-[10px] text-orange-500 font-medium shrink-0 hidden sm:inline">Ends in</span>
            <CountdownTimer expiresAt={deal.expiresAt} />
          </div>
        )}

        <Button
          size="sm"
          className="w-full h-8 text-xs bg-orange-500 hover:bg-orange-600 text-white font-bold gap-1.5 mt-auto"
          onClick={(e) => { e.stopPropagation(); onAddToCart(product._id, product.stock ?? product.totalStock); }}
        >
          <ShoppingCart className="h-3.5 w-3.5 shrink-0" />
          Add to Cart
        </Button>
      </div>
    </div>
  );
}

// ── Collapsible policy section ─────────────────────────────────────────────
function PolicySection({ icon: Icon, title, content }) {
  const [open, setOpen] = useState(false);
  if (!content) return null;
  return (
    <div className="border rounded-xl overflow-hidden">
      <button onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors cursor-pointer">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-100 rounded-lg">
            <Icon className="h-4 w-4 text-gray-600" />
          </div>
          <span className="font-medium text-sm">{title}</span>
        </div>
        <ChevronRight className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${open ? "rotate-90" : ""}`} />
      </button>
      {open && (
        <div className="px-5 pb-5 pt-2 border-t bg-gray-50">
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{content}</p>
        </div>
      )}
    </div>
  );
}

// ── Skeletons ──────────────────────────────────────────────────────────────
function StoreSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Skeleton className="h-44 w-full" />
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex gap-5 py-5">
          <Skeleton className="h-24 w-24 rounded-2xl flex-shrink-0" />
          <div className="flex-1 space-y-3 pt-2">
            <Skeleton className="h-6 w-48" /><Skeleton className="h-4 w-72" />
            <div className="flex gap-2"><Skeleton className="h-6 w-20 rounded-full" /><Skeleton className="h-6 w-24 rounded-full" /></div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-square rounded-xl" />
              <Skeleton className="h-3.5 w-3/4" /><Skeleton className="h-3.5 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LoadMoreSkeleton() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-lg overflow-hidden border shadow-sm">
          <Skeleton className="h-[200px] w-full" />
          <div className="p-3 space-y-2">
            <Skeleton className="h-3.5 w-3/4" /><Skeleton className="h-3 w-1/2" /><Skeleton className="h-4 w-1/3" />
          </div>
        </div>
      ))}
    </>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function StoreFront() {
  const { slug }   = useParams();
  const dispatch   = useDispatch();
  const navigate   = useNavigate();
  const { handleAddToCart } = useCart();

  const { storeData, isLoading, error } = useSelector((s) => s.shopStore);

  const [search, setSearch]       = useState("");
  const [sort, setSort]           = useState("newest");
  const [dealSort, setDealSort]   = useState("expiry");
  const [activeTab, setActiveTab] = useState("products");

  const [visibleCount, setVisibleCount] = useState(STORE_PAGE_SIZE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const sentinelRef   = useRef(null);
  const isFetchingRef = useRef(false);

  useEffect(() => {
    if (slug) dispatch(getStoreBySlug(slug));
    return () => { dispatch(clearStoreData()); };
  }, [dispatch, slug]);

  useEffect(() => {
    setVisibleCount(STORE_PAGE_SIZE);
    isFetchingRef.current = false;
  }, [search, sort, activeTab]);

  const products  = storeData?.products || [];
  const now       = new Date();

  // ── Super deals derived from the store's own products ─────────────────
  const allDeals = products.filter(
    (p) => p.superDeal?.isActive && new Date(p.superDeal.expiresAt) > now
  );
  const superDeals = [...allDeals].sort((a, b) => {
    switch (dealSort) {
      case "discount": return a.superDeal.dealPrice - b.superDeal.dealPrice;
      case "newest":   return new Date(b.createdAt) - new Date(a.createdAt);
      default:         return new Date(a.superDeal.expiresAt) - new Date(b.superDeal.expiresAt);
    }
  });

  // ── Regular products list ──────────────────────────────────────────────
  const filtered = products
    .filter((p) => {
      const q = search.toLowerCase();
      return !q || (p.name || p.title || "").toLowerCase().includes(q)
        || (p.description || "").toLowerCase().includes(q);
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

  const loadMore = useCallback(() => {
    if (isFetchingRef.current || !hasMore) return;
    isFetchingRef.current = true;
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((prev) => prev + STORE_PAGE_SIZE);
      setIsLoadingMore(false);
      isFetchingRef.current = false;
    }, 400);
  }, [hasMore]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMore(); },
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
            <span className="font-mono font-semibold">{slug}</span> doesn't exist or is unavailable.
          </p>
          <Button onClick={() => navigate("/")} className="mt-5 gap-2 w-full">
            <ArrowLeft className="h-4 w-4" /> Back to Marketplace
          </Button>
        </div>
      </div>
    );
  }

  const { store } = storeData;
  const closed    = store.status === "temporarily-closed";
  const primary   = store.primaryColor   || "#2563EB";
  const secondary = store.secondaryColor || "#1E40AF";

  // Tab definitions — Super Deals tab only shows when there are active deals
  const tabs = [
    { id: "products",    label: `Products (${storeData.productCount})` },
    ...(allDeals.length > 0
      ? [{ id: "deals", label: `⚡ Super Deals (${allDeals.length})` }]
      : [])
  ];

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Banner ── */}
      <div
        className="relative w-full overflow-hidden mx-auto"
        style={{
          maxWidth: "calc(100% - 1rem)",
          height: "clamp(120px, 20vw, 220px)",
          borderRadius: "0.75rem",
          marginTop: "0.5rem",
          marginBottom: "0.5rem",
          background: store.banner
            ? undefined
            : `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`,
        }}
      >
        {store.banner && (
          <img src={store.banner} alt="Store banner"
            className="absolute inset-0 w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-black/20 pointer-events-none" />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-2 left-2 sm:top-4 sm:left-4 z-10 flex items-center gap-1.5 text-white text-xs sm:text-sm bg-black/35 hover:bg-black/55 px-2.5 py-1.5 sm:px-3 rounded-full backdrop-blur-sm transition-all cursor-pointer"
        >
          <ArrowLeft className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> Back
        </button>
        {closed && (
          <span className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10 bg-yellow-400 text-yellow-900 text-[10px] sm:text-xs font-bold px-2.5 py-1.5 sm:px-3 rounded-full">
            Temporarily Closed
          </span>
        )}
      </div>

      {/* ── Profile + tabs ── */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 pt-5 pb-5">
            {/* Logo */}
            <div
              className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl shadow-md overflow-hidden flex-shrink-0 border-4 border-white ring-1 ring-black/10 flex items-center justify-center"
              style={{ backgroundColor: primary }}
            >
              {store.logo ? (
                <img src={store.logo} alt={store.storeName} className="h-full w-full object-cover" />
              ) : (
                <span className="text-white font-bold text-4xl">
                  {store.storeName?.[0]?.toUpperCase() || "S"}
                </span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex flex-col gap-1">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
                    {store.storeName}
                  </h1>
                  <span className="text-[10px] font-semibold text-gray-500">
                    Since {new Date(store?.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                  </span>
                </div>
                {closed ? (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-800">Closed</span>
                ) : (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500 inline-block" /> Active
                  </span>
                )}
                {store.businessCategory && (
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 capitalize">
                    {store.businessCategory.replace(/-/g, " ")}
                  </span>
                )}
              </div>
              {store.city && (
                <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-500">
                  <MapPin className="h-3.5 w-3.5 text-gray-400" />
                  {[store.city, store.region, store.country].filter(Boolean).join(", ")}
                </div>
              )}
            </div>
          </div>

          {/* Tab bar */}
          <div className="flex gap-3 -mb-px overflow-x-auto">
            {tabs.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`px-1 sm:px-5 py-3 text-[12px] overflow-x-hidden font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === id
                    ? id === "deals"
                      ? "border-orange-500 text-orange-600"
                      : "border-gray-900 text-gray-900"
                    : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tab content ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        {/* Products tab */}
        {activeTab === "products" && (
          <div>
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between mb-6">
              <div className="relative w-full max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input placeholder="Search products…" value={search} onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9 rounded-full border-gray-200 text-sm bg-white" />
              </div>
              <div className="flex items-center gap-3">
               
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
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                  {displayed.map((p) => (
                    <div key={p._id} className="relative">
                      {p.superDeal?.isActive && new Date(p.superDeal.expiresAt) > now && (
                        <div className="absolute top-2 right-2 z-10 flex items-center gap-1 bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full pointer-events-none">
                          <Zap className="h-2.5 w-2.5" /> Deal
                        </div>
                      )}
                      <ShoppingProductTile product={p} handleAddtoCart={(id, s) => handleAddToCart(id, s)} />
                    </div>
                  ))}
                  {isLoadingMore && <LoadMoreSkeleton />}
                </div>
                {isLoadingMore && (
                  <div className="flex justify-center items-center py-6 gap-3">
                    <div className="h-5 w-5 rounded-full border-2 border-gray-400 border-t-transparent animate-spin" />
                    <span className="text-sm text-gray-400">Loading more products…</span>
                  </div>
                )}
                
                <div ref={sentinelRef} className="h-1" aria-hidden="true" />
              </>
            ) : (
              <div className="flex flex-col items-center py-24 gap-4">
                <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center">
                  <Package className="h-9 w-9 text-gray-400" />
                </div>
                <p className="font-semibold text-gray-800">{search ? "No products found" : "No products yet"}</p>
                <p className="text-sm text-gray-500">{search ? "Try a different keyword" : "Check back soon!"}</p>
                {search && (
                  <Button variant="outline" size="sm" onClick={() => setSearch("")} className="rounded-full">
                    Clear search
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Super Deals tab */}
        {activeTab === "deals" && (
          <div>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-orange-500" />
                  Super Deals
                </h2>
               
              </div>
              <Select value={dealSort} onValueChange={setDealSort}>
                <SelectTrigger className="w-[170px] h-9 rounded-full text-xs border-gray-200 bg-white shrink-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expiry">Ending Soonest</SelectItem>
                  <SelectItem value="discount">Lowest Price</SelectItem>
                  <SelectItem value="newest">Newest First</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {superDeals.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
                {superDeals.map((p) => (
                  <DealCard
                    key={p._id}
                    product={p}
                    onAddToCart={(id, stock) => handleAddToCart(id, stock)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center py-24 gap-4">
                <div className="h-20 w-20 rounded-full bg-orange-50 flex items-center justify-center">
                  <Zap className="h-9 w-9 text-orange-200" />
                </div>
                <p className="font-semibold text-gray-800">No active deals right now</p>
                <p className="text-sm text-gray-500">Check back soon for new super deals!</p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
