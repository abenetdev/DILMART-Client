import { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ShoppingBasket,
  Search,
  ArrowRight,
  Store,
  Mail,
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

// -- Main Component ------------------------------------------------------------

export default function ShoppingHome() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

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

  // -- Fetch all data ---------------------------------------------------------
  useEffect(() => {
    dispatch(getFeatureImages());
    dispatch(getHomeData());
    dispatch(
      fetchAllFilteredProducts({
        filterParams: {},
        sortParams: "price-lowtohigh",
      }),
    );
  }, [dispatch]);

  // -- Banner auto-advance ---------------------------------------------------
  useEffect(() => {
    if (!featureImageList?.length) return;
    const t = setInterval(
      () => setCurrentSlide((p) => (p + 1) % featureImageList.length),
      5000,
    );
    return () => clearInterval(t);
  }, [featureImageList]);

  // -- Handlers --------------------------------------------------------------
  function goToCategory(catId) {
    sessionStorage.setItem("filters", JSON.stringify({ category: [catId] }));
    navigate("/listing");
  }

  function handleSearch(e) {
    e.preventDefault();
    if (!searchInput.trim()) return;
    navigate(`/search?keyword=${encodeURIComponent(searchInput.trim())}`);
  }

  async function handleAddtoCart(productId, totalStock) {
    await handleAddToCart(productId, totalStock);
  }

  function handleSubscribe(e) {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail("");
    }
  }

  const { isOnline } = useNetworkStatus();

  const slidePrev = () =>
    setCurrentSlide(
      (p) =>
        (p - 1 + (featureImageList?.length || 1)) %
        (featureImageList?.length || 1),
    );
  const slideNext = () =>
    setCurrentSlide((p) => (p + 1) % (featureImageList?.length || 1));

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
      {/* ???????????????????????????????????????
          1. HERO SECTION
      ??????????????????????????????????????? */}
      <section className="relative w-full min-h-[500px] md:h-[600px] overflow-hidden bg-slate-900">
        {/* Slides */}
        {featureImageList?.length > 0 ? (
          featureImageList.map((slide, i) => (
            <img
              key={i}
              src={slide?.image}
              alt={`Banner ${i + 1}`}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
                i === currentSlide ? "opacity-100" : "opacity-0"
              }`}
            />
          ))
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900" />
        )}

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/50" />

        <div className="relative z-10 h-full flex flex-col items-center justify-center px-4 text-center text-white">
          <Badge className="mb-4 bg-white/20 text-white border-white/30 backdrop-blur-sm">
            ??? Multi-Vendor Marketplace
          </Badge>
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight max-w-3xl">
            Discover Amazing <span className="text-blue-400">Products</span>{" "}
            from Top Stores
          </h1>
          <p className="mt-4 text-lg max-w-xl text-green-500">
            Shop from thousands of verified vendors. Best prices, fast delivery.
          </p>

          <form
            onSubmit={handleSearch}
            className="mt-8 flex w-full max-w-lg gap-2"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search products, stores..."
                className="pl-10 h-12 bg-white text-black border-0 rounded-xl"
              />
            </div>
            <Button type="submit" size="lg" className="h-12 px-6 rounded-xl">
              Search
            </Button>
          </form>

          <div className="mt-6 flex gap-3">
            <Button
              size="lg"
              onClick={() => navigate("/listing")}
              className="rounded-xl"
            >
              Shop Now
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="rounded-xl border-white/50 text-white hover:bg-white/10"
              onClick={() => navigate("/listing")}
            >
              Browse Stores
            </Button>
          </div>
        </div>

        {/* Arrows */}
        {featureImageList?.length > 1 && (
          <>
            <button
              onClick={slidePrev}
              className="absolute top-1/2 left-4 -translate-y-1/2 z-20 p-2 rounded-full bg-white/20 hover:bg-white/40 text-white transition"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <button
              onClick={slideNext}
              className="absolute top-1/2 right-4 -translate-y-1/2 z-20 p-2 rounded-full bg-white/20 hover:bg-white/40 text-white transition"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>

            {/* Dots */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
              {featureImageList.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  className={`h-2 rounded-full transition-all ${
                    i === currentSlide ? "w-8 bg-white" : "w-2 bg-white/40"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </section>

      {/* ???????????????????????????????????????
          2. CATEGORIES
      ??????????????????????????????????????? */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <SectionTitle
            title="Shop by Category"
            subtitle="Find exactly what you're looking for"
          />
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-9 gap-3">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => goToCategory(cat.id)}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white border hover:shadow-md hover:-translate-y-1 transition-all duration-200 group"
              >
                <div className={`p-3 rounded-xl ${cat.color}`}>
                  <cat.icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-semibold text-center leading-tight">
                  {cat.label}
                </span>
              </button>
            ))}
          </div>
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
