import { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ShoppingBasket,
  ArrowRight,
  Store,
  Zap,
  Clock,
  Flame,
} from "lucide-react";
import { fetchAllFilteredProducts } from "@/store/shop/products-slice";
import { getHomeData } from "@/store/shop/home-slice";
import { getFeatureImages } from "@/store/common-slice";
import ShoppingProductTile from "@/components/shopping-view/product-tile";
import { useCart } from "@/hooks/useCart";
import { CATEGORIES } from "@/config";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import OfflineBlock from "@/components/common/offline-block";
import { fetchFeaturedCategories } from "@/store/shop/category-slice";
import BannerCarousel from "@/components/shopping-view/home-banner/BannerCarousel";

// -- Data --------------------------------------------------------------------



// -- Skeleton Components ------------------------------------------------------

function ProductCardSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-[240px] w-full rounded-xl" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-10 w-full rounded-lg" />
    </div>
  );
}

function StoreCardSkeleton() {
  return (
    <div className="border rounded-xl p-5 space-y-3">
      <Skeleton className="h-16 w-16 rounded-full mx-auto" />
      <Skeleton className="h-4 w-2/3 mx-auto" />
      <Skeleton className="h-3 w-1/2 mx-auto" />
      <Skeleton className="h-9 w-full rounded-lg" />
    </div>
  );
}

// -- Countdown Timer ----------------------------------------------------------

function CountdownTimer({ expiresAt }) {
  const calc = useCallback(() => {
    const diff = new Date(expiresAt) - new Date();
    if (diff <= 0) return { h: "00", m: "00", s: "00", expired: true };
    const totalSec = Math.floor(diff / 1000);
    const h = String(Math.floor(totalSec / 3600)).padStart(2, "0");
    const m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, "0");
    const s = String(totalSec % 60).padStart(2, "0");
    return { h, m, s, expired: false };
  }, [expiresAt]);

  const [time, setTime] = useState(calc);

  useEffect(() => {
    const id = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(id);
  }, [calc]);

  if (time.expired) {
    return <span className="text-xs text-red-400 font-bold">Expired</span>;
  }

  return (
    <div className="flex items-center gap-0.5 sm:gap-1">
      {[time.h, time.m, time.s].map((unit, i) => (
        <span key={i} className="flex items-center gap-0.5 sm:gap-1">
          <span className="bg-black/30 text-white font-mono font-bold text-[10px] sm:text-sm px-1 sm:px-1.5 py-0.5 rounded min-w-[20px] sm:min-w-[28px] text-center">
            {unit}
          </span>
          {i < 2 && <span className="text-white/70 font-bold text-[10px] sm:text-sm">:</span>}
        </span>
      ))}
    </div>
  );
}

// -- Super Deal Card -----------------------------------------------------------

function SuperDealCard({ product, onAddToCart }) {
  const navigate = useNavigate();
  const deal = product.superDeal;
  const discount = deal?.dealPrice
    ? Math.round((1 - deal.dealPrice / product.price) * 100)
    : 0;

  return (
    <div
      className="group relative bg-white rounded-2xl overflow-hidden border border-orange-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer"
      onClick={() => navigate(`/product/${product._id}`)}
    >
      {/* Discount badge */}
      <div className="absolute top-3 left-3 z-10">
        <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-black px-2.5 py-1 rounded-full shadow-md">
          -{discount}%
        </span>
      </div>

      {/* Image */}
      <div className="relative h-48 overflow-hidden bg-orange-50">
        {product.image || product.images?.[0] ? (
          <img
            src={product.image || product.images?.[0]}
            alt={product.name || product.title}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <ShoppingBasket className="h-16 w-16 text-orange-200" />
          </div>
        )}
        {/* Flame overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-orange-900/40 to-transparent" />
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="text-xs font-semibold text-orange-600 mb-1 flex items-center gap-1">
          <Zap className="h-3 w-3" />
          {deal?.dealTitle || "? Super Deal"}
        </p>
        <h3 className="font-semibold text-sm text-gray-900 line-clamp-2 leading-snug mb-2">
          {product.name || product.title}
        </h3>

        {/* Prices */}
        <div className="flex flex-col md:flex-row md:gap-5 items-baseline">
          <span className="text-lg font-black text-orange-600">
            ETB {deal?.dealPrice?.toLocaleString()}
          </span>
          <span className="text-sm text-gray-400 mb-3 line-through">
            ETB {product.price?.toLocaleString()}
          </span>
        </div>

        {/* Countdown */}
        {deal?.expiresAt && (
          <div className="flex items-center gap-1.5 mb-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg px-2 py-1 sm:px-3 sm:py-1.5 overflow-hidden">
            <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white/80 shrink-0" />
            <CountdownTimer expiresAt={deal.expiresAt} />
          </div>
        )}

        {/* Add to cart */}
        <Button
          size="sm"
          className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold shadow-sm gap-1.5"
          onClick={(e) => {
            e.stopPropagation();
            onAddToCart(product._id, product.totalStock || product.stock);
          }}
        >
          <ShoppingBasket className="h-4 w-4" />
          Add to Cart
        </Button>
      </div>
    </div>
  );
}

// -- Section Title ------------------------------------------------------------

function SectionTitle({ title, subtitle, action, onAction }) {  return (
    <div className="flex items-end justify-between mb-8">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold">{title}</h2>
        {subtitle && (
          <p className="text-muted-foreground mt-1 text-sm">{subtitle}</p>
        )}
      </div>
      {action && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onAction}
          className="gap-1 text-primary"
        >
          {action} <ArrowRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

// -- Store Card ---------------------------------------------------------------

function StoreCard({ store, onVisit }) {
  return (
    <Card className="hover:shadow-md transition-shadow duration-200 overflow-hidden">
      {/* Mini banner */}
      <div
        className="h-16 w-full"
        style={{
          background: store.banner
            ? `url(${store.banner}) center/cover`
            : `linear-gradient(135deg, ${store.primaryColor || "#2563EB"}, ${store.secondaryColor || "#1E40AF"})`,
        }}
      />
      <CardContent className="p-4 text-center -mt-8">
        {/* Logo */}
        <div
          className="h-14 w-14 rounded-full border-4 border-white shadow-sm mx-auto overflow-hidden flex items-center justify-center"
          style={{ backgroundColor: store.primaryColor || "#2563EB" }}
        >
          {store.logo ? (
            <img
              src={store.logo}
              alt={store.storeName}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-white font-bold text-xl">
              {store.storeName?.[0]?.toUpperCase() || "S"}
            </span>
          )}
        </div>

        <h3 className="font-bold mt-3 text-sm">{store.storeName}</h3>
        <p className="text-xs text-muted-foreground mt-0.5 capitalize">
          {store.businessCategory?.replace("-", " ") || "Store"}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {store.productCount} product{store.productCount !== 1 ? "s" : ""}
        </p>

        <Button
          size="sm"
          variant="outline"
          className="w-full mt-3 gap-1 text-xs"
          onClick={() => onVisit(store.slug)}
        >
          <Store className="h-3 w-3" />
          Visit Store
        </Button>
      </CardContent>
    </Card>
  );
}

// -- Become a Seller Banner ---------------------------------------------------

function BecomeSellerBanner({ onAction }) {
  return (
    <section className=" bg-white">
      <div className="container mx-auto px-4">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/5 via-white to-primary/10 border border-primary/10">

          {/* Decorative circles */}
          <div className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-primary/5 pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 h-36 w-36 rounded-full bg-primary/5 pointer-events-none" />
          <div className="absolute top-1/2 right-1/4 h-20 w-20 -translate-y-1/2 rounded-full bg-orange-400/10 pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 md:gap-12 px-8 py-12 md:px-14 md:py-14">

            {/* Left — illustration */}
            {/* <div className="shrink-0 hidden md:block  flex items-center justify-center">
              <div className="relative h-40 w-40 md:h-48 md:w-48">
                <div className="absolute inset-0 rounded-full bg-primary/8 border border-primary/10" />
                <div className="absolute inset-5 rounded-full bg-primary/10 border border-primary/15 flex items-center justify-center">
                  <svg
                    viewBox="0 0 80 80"
                    className="h-20 w-20 text-primary"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <rect x="12" y="34" width="56" height="34" rx="3" fill="currentColor" fillOpacity="0.12" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round"/>
                    <path d="M8 22h64l-6 12H14L8 22z" fill="currentColor" fillOpacity="0.18" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round"/>
                    <rect x="32" y="46" width="16" height="22" rx="2" fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                    <rect x="15" y="46" width="12" height="10" rx="2" fill="currentColor" fillOpacity="0.18" stroke="currentColor" strokeWidth="2"/>
                    <rect x="53" y="46" width="12" height="10" rx="2" fill="currentColor" fillOpacity="0.18" stroke="currentColor" strokeWidth="2"/>
                    <rect x="24" y="14" width="32" height="10" rx="2" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="2"/>
                    <circle cx="62" cy="22" r="9" fill="white" stroke="currentColor" strokeWidth="2"/>
                    <path d="M62 16l1.5 4.5H68l-3.75 2.75 1.4 4.25L62 24.75l-3.65 2.75 1.4-4.25L56 20.5h4.5L62 16z" fill="currentColor" fillOpacity="0.7"/>
                  </svg>
                </div>

                <div className="absolute -top-2 -right-2 bg-white rounded-full shadow-md border border-gray-100 px-3 py-1.5 flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-[10px] font-semibold text-gray-700 whitespace-nowrap">Sellers join daily</span>
                </div>

                <div className="absolute -bottom-2 -left-4 bg-white rounded-xl shadow-md border border-gray-100 px-3 py-1.5">
                  <p className="text-[10px] text-gray-400 leading-none">Avg. monthly</p>
                  <p className="text-sm font-bold text-primary leading-snug">ETB 12,000+</p>
                </div>
              </div>
            </div> */}

            {/* Right — copy */}
            <div className="flex-1 text-center md:text-left">
              <span className="inline-block text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full mb-4 tracking-wide uppercase">
                Become a Seller
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight tracking-tight mb-4">
                Start Selling on DilMart
              </h2>
              <p className="text-gray-500 text-sm sm:text-base leading-relaxed max-w-md mx-auto md:mx-0 mb-8">
                Join thousands of vendors already growing their businesses on DilMart.
                Reach more customers, manage your store with ease, and start earning today.
              </p>

              {/* Stats row */}
             

              <button
                onClick={onAction}
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white text-sm font-semibold px-7 py-3 rounded-xl shadow-md shadow-primary/20 transition-all hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 active:translate-y-0"
              >
                Get Started for Free
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// -- Main Component ------------------------------------------------------------

export default function ShoppingHome() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { handleAddToCart } = useCart();

  const { productList, isLoading: productsLoading } = useSelector(
    (s) => s.shopProducts,
  );
  const { featureImageList } = useSelector((s) => s.commonFeature);
  const {
    newArrivals,
    trendingProducts,
    popularStores,
    superDeals,
    isLoading: homeLoading,
  } = useSelector((s) => s.shopHome);
  const { featured: featuredCategories, isLoading: catsLoading } = useSelector(
    (s) => s.shopCategory,
  );

  // -- Fetch all data ---------------------------------------------------------
  useEffect(() => {
    dispatch(getFeatureImages());
    dispatch(getHomeData());
    dispatch(fetchFeaturedCategories());
    dispatch(
      fetchAllFilteredProducts({
        filterParams: {},
        sortParams: "price-lowtohigh",
      }),
    );
  }, [dispatch]);

  // -- Handlers --------------------------------------------------------------
  function goToCategory(slug) {
    sessionStorage.setItem("filters", JSON.stringify({ category: [slug] }));
    navigate("/listing");
  }

  async function handleAddtoCart(productId, totalStock) {
    await handleAddToCart(productId, totalStock);
  }

  const { isOnline } = useNetworkStatus();

  const retryFetch = () => {
    dispatch(getFeatureImages());
    dispatch(getHomeData());
    dispatch(fetchAllFilteredProducts({ filterParams: {}, sortParams: "price-lowtohigh" }));
  };

  // -- Offline guard ---------------------------------------------------------
  if (!isOnline && !homeLoading && !newArrivals?.length) {
    return <OfflineBlock fullPage onRetry={retryFetch} />;
  }

  // -- Render ----------------------------------------------------------------
  return (
    <main className="flex flex-col min-h-screen">
      {/* ═══════════════════════════════════════
          1. HERO BANNER CAROUSEL
      ═══════════════════════════════════════ */}
      <BannerCarousel banners={featureImageList || []} />

      {/* ═══════════════════════════════════════
          2. CATEGORIES
      ??????????????????????????????????????? */}
      <section className="py-16 bg-gray-50 overflow-hidden">
        <div className="container mx-auto px-4">
          <SectionTitle
            title="Shop by Category"
            subtitle="Find exactly what you're looking for"
          />

          {catsLoading ? (
            /* ── Skeleton ── */
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-9 gap-3">
              {[...Array(9)].map((_, i) => (
                <div
                  key={i}
                  className="aspect-[3/4] rounded-2xl bg-gray-200 animate-pulse overflow-hidden"
                />
              ))}
            </div>

          ) : featuredCategories.length > 0 ? (
            <>
              {/* ── Desktop grid ── */}
              <div className="hidden sm:grid grid-cols-4 md:grid-cols-5 lg:grid-cols-9 gap-3">
                {featuredCategories.map((cat) => (
                  <button
                    key={cat._id}
                    onClick={() => goToCategory(cat.slug)}
                    aria-label={cat.name}
                    className="group flex flex-col items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl p-2 hover:bg-gray-100 transition-colors"
                  >
                    {/* Square image — no shadow, no overlay */}
                    <div className="w-full aspect-square rounded-2xl overflow-hidden">
                      {cat.image ? (
                        <img
                          src={cat.image}
                          alt={cat.name}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div
                          className="h-full w-full"
                          style={{ backgroundColor: cat.color || "#e5e7eb" }}
                        />
                      )}
                    </div>
                    {/* Name below image */}
                    <span className="text-[11px] font-semibold text-gray-800 text-center leading-tight line-clamp-2 w-full">
                      {cat.name}
                    </span>
                  </button>
                ))}
              </div>

              {/* ── Mobile: 3-column wrapping grid, no scrollbar ── */}
              <div className="sm:hidden grid grid-cols-3 gap-2.5">
                {featuredCategories.map((cat) => (
                  <button
                    key={cat._id}
                    onClick={() => goToCategory(cat.slug)}
                    aria-label={cat.name}
                    className="group flex flex-col items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl p-1.5 hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-full aspect-square rounded-xl overflow-hidden">
                      {cat.image ? (
                        <img
                          src={cat.image}
                          alt={cat.name}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div
                          className="h-full w-full"
                          style={{ backgroundColor: cat.color || "#e5e7eb" }}
                        />
                      )}
                    </div>
                    {/* Name below image */}
                    <span className="text-[10px] font-semibold text-gray-800 text-center leading-tight line-clamp-2 w-full">
                      {cat.name}
                    </span>
                  </button>
                ))}
              </div>
            </>

          ) : (
            /* ── Fallback: static config icons while DB is empty ── */
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-9 gap-3">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => goToCategory(cat.id)}
                  className="group flex flex-col items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl p-2 hover:bg-gray-100 transition-colors"
                >
                  <div className={`w-full aspect-square rounded-2xl overflow-hidden ${cat.color} flex items-center justify-center`}>
                    <cat.icon className="h-8 w-8" />
                  </div>
                  <span className="text-[11px] font-semibold text-gray-800 text-center leading-tight line-clamp-2 w-full">
                    {cat.label}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ???????????????????????????????????????
          4.5 SUPER DEALS
      ??????????????????????????????????????? */}

        {(homeLoading || superDeals?.length > 0) && (
        <section className="py-16 relative overflow-hidden">
          {/* Decorative background */}
          <div className="absolute inset-0 bg-gradient-to-br from-orange-950 via-red-900 to-amber-900" />
          <div className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `radial-gradient(circle at 20% 50%, #f97316 0%, transparent 50%),
                                radial-gradient(circle at 80% 20%, #ef4444 0%, transparent 40%)`,
            }}
          />
          <div className="container mx-auto px-4 relative z-10">
            <div className="flex items-end justify-between mb-8">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-orange-500 rounded-xl shadow-lg shadow-orange-500/40">
                    <Flame className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl md:text-3xl font-black text-white leading-tight">
                      ? Super Deals
                    </h2>
                    <p className="text-orange-200 text-sm">Limited time offers grab them before they are gone!</p>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/super-deals")}
                className="gap-1 text-orange-200 hover:text-white hover:bg-white/10"
              >
                View All <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            {homeLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="h-48 w-full rounded-2xl bg-white/10" />
                    <Skeleton className="h-4 w-3/4 bg-white/10" />
                    <Skeleton className="h-4 w-1/2 bg-white/10" />
                    <Skeleton className="h-10 w-full rounded-lg bg-white/10" />
                  </div>
                ))}
              </div>
            ) : superDeals?.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {superDeals.slice(0, 4).map((p) => (
                  <SuperDealCard key={p._id} product={p} onAddToCart={handleAddtoCart} />
                ))}
              </div>
            ) : null}
          </div>
        </section>
      )}

      {/* ???????????????????????????????????????
          3. FEATURED PRODUCTS
      ??????????????????????????????????????? */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <SectionTitle
            title="Featured Products"
            subtitle="Handpicked for you"
            action="View All"
            onAction={() => navigate("/listing")}
          />
          {productsLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {[...Array(8)].map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : productList?.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {productList.slice(0, 8).map((p) => (
                <ShoppingProductTile
                  key={p._id}
                  product={p}
                  handleAddtoCart={handleAddtoCart}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-16 gap-3">
              <ShoppingBasket className="h-14 w-14 text-muted-foreground" />
              <p className="text-muted-foreground">No products available yet</p>
            </div>
          )}
        </div>
      </section>

      {/* ── Become a Seller Banner ───────────────────────────────────────── */}
      <BecomeSellerBanner onAction={() => navigate("/become-seller")} />

      {/* ???????????????????????????????????????
          4. NEW ARRIVALS
      ??????????????????????????????????????? */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <SectionTitle
            title="New Arrivals"
            subtitle="Fresh products just added"
            action="See All"
            onAction={() => navigate("/listing")}
          />
          {homeLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {[...Array(4)].map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : newArrivals?.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {newArrivals.map((p) => (
                <ShoppingProductTile
                  key={p._id}
                  product={p}
                  handleAddtoCart={handleAddtoCart}
                />
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {/* become a seller */}
      
      {/* ???????????????????????????????????????
          5. POPULAR STORES
      ??????????????????????????????????????? */}
      {(homeLoading || popularStores?.length > 0) && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <SectionTitle
              title="Popular Stores"
              subtitle="Explore top vendors on our platform"
              action="View All Stores"
              onAction={() => navigate("/stores")}
            />
            {homeLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {[...Array(6)].map((_, i) => (
                  <StoreCardSkeleton key={i} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {popularStores.slice(0, 6).map((store) => (
                  <StoreCard
                    key={store._id}
                    store={store}
                    onVisit={(slug) => navigate(`/store/${slug}`)}
                  />
                ))}
              </div>
            )}
            {/* View all button below grid */}
            {/* {!homeLoading && popularStores?.length > 0 && (
              <div className="flex justify-center mt-8">
                <Button
                  variant="outline"
                  onClick={() => navigate("/stores")}
                  className="gap-2 px-8"
                >
                  <Store className="h-4 w-4" />
                  View All Stores
                </Button>
              </div>
            )} */}
          </div>
        </section>
      )}

      {/* ???????????????????????????????????????
          6. TRENDING PRODUCTS
      ??????????????????????????????????????? */}
      {(homeLoading || trendingProducts?.length > 0) && (
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <SectionTitle
              title="Trending Now"
              subtitle="Most loved by our customers"
              action="View All"
              onAction={() => navigate("/listing")}
            />
            {homeLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {[...Array(5)].map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {trendingProducts.map((p) => (
                  <ShoppingProductTile
                    key={p._id}
                    product={p}
                    handleAddtoCart={handleAddtoCart}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ???????????????????????????????????????
          8. FOOTER (now rendered globally in App.jsx)
      ??????????????????????????????????????? */}
    </main>
  );
}
