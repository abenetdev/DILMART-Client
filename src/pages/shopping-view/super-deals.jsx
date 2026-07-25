import { useEffect, useState, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchSuperDeals, fetchMoreSuperDeals } from "@/store/shop/super-deals-slice";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Flame, Zap, Clock, ShoppingBasket, ArrowLeft, Tag, Frown,
} from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { CATEGORIES } from "@/config";

// ── Countdown Timer ───────────────────────────────────────────────────────────

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
    return <span className="text-red-400 font-bold text-[10px] sm:text-xs">Expired</span>;
  }

  return (
    <div className="flex items-center gap-0.5 sm:gap-1">
      {[time.h, time.m, time.s].map((unit, i) => (
        <span key={i} className="flex items-center gap-0.5 sm:gap-1">
          <span className="bg-black/30 text-white font-mono font-bold text-[10px] sm:text-sm px-1 sm:px-1.5 py-0.5 rounded min-w-[20px] sm:min-w-[28px] text-center leading-none">
            {unit}
          </span>
          {i < 2 && (
            <span className="text-white/70 font-bold text-[10px] sm:text-sm leading-none">:</span>
          )}
        </span>
      ))}
    </div>
  );
}

// ── Deal Card ─────────────────────────────────────────────────────────────────

function DealCard({ product, onAddToCart }) {
  const navigate = useNavigate();
  const deal     = product.superDeal;
  const discount = deal?.dealPrice
    ? Math.round((1 - deal.dealPrice / product.price) * 100)
    : 0;
  const savings  = product.price - (deal?.dealPrice || 0);

  return (
    <div
      className="group relative bg-white rounded-xl sm:rounded-2xl overflow-hidden border border-orange-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 cursor-pointer flex flex-col"
      onClick={() => navigate(`/shop/product/${product._id}`)}
    >
      {/* Discount ribbon */}
      <div className="absolute top-0 right-0 z-10">
        <div className="bg-gradient-to-br from-orange-500 to-red-600 text-white text-[9px] sm:text-xs font-black px-2 sm:px-3 py-1 sm:py-1.5 rounded-bl-xl sm:rounded-bl-2xl shadow-md leading-none">
          -{discount}%
        </div>
      </div>

      {/* Image — aspect-based so it fits any column width */}
      <div className="relative aspect-square sm:aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-orange-50 to-amber-50 shrink-0">
        {product.image || product.images?.[0] ? (
          <img
            src={product.image || product.images?.[0]}
            alt={product.name || product.title}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <ShoppingBasket className="h-10 w-10 sm:h-16 sm:w-16 text-orange-200" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        {/* Category chip on image */}
        <div className="absolute bottom-1.5 left-1.5 sm:bottom-3 sm:left-3">
          <span className="bg-white/90 text-gray-700 text-[9px] sm:text-xs font-semibold px-1.5 sm:px-2 py-0.5 rounded-full capitalize">
            {product.category}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-2 sm:p-4 flex flex-col flex-1 gap-1 sm:gap-0">

        {/* Deal label */}
        <p className="text-[9px] sm:text-xs font-bold text-orange-500 flex items-center gap-0.5 uppercase tracking-wide">
          <Zap className="h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0" />
          <span className="truncate">{deal?.dealTitle || "Super Deal"}</span>
        </p>

        {/* Title */}
        <h3 className="font-bold text-gray-900 text-[11px] sm:text-sm line-clamp-2 leading-snug flex-1">
          {product.name || product.title}
        </h3>

        {/* Brand — hidden on mobile */}
        {product.brand && (
          <p className="hidden sm:block text-xs text-gray-400">{product.brand}</p>
        )}

        {/* Prices */}
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2 mt-1">
          <span className="text-sm sm:text-xl font-black text-orange-600 leading-tight">
            ETB {deal?.dealPrice?.toLocaleString()}
          </span>
          <span className="text-[10px] sm:text-sm text-gray-400 line-through leading-tight">
            ETB {product.price?.toLocaleString()}
          </span>
        </div>

        {/* Savings badge — hide on very small */}
        <p className="hidden sm:block text-xs text-green-600 font-semibold">
          Save ETB {savings.toLocaleString()}
        </p>

        {/* Countdown */}
        {deal?.expiresAt && (
          <div className="flex items-center gap-1 sm:gap-2 mt-1.5 sm:mt-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg px-2 py-1 sm:px-3 sm:py-2 overflow-hidden">
            <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white/80 shrink-0" />
            <span className="text-white/80 text-[9px] sm:text-xs font-medium hidden sm:inline shrink-0">
              Ends in
            </span>
            <CountdownTimer expiresAt={deal.expiresAt} />
          </div>
        )}

        {/* Add to cart */}
        <Button
          size="sm"
          className="w-full mt-2 h-7 sm:h-9 text-[10px] sm:text-sm bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold shadow-sm gap-1 sm:gap-1.5 px-2"
          onClick={(e) => {
            e.stopPropagation();
            onAddToCart(product._id, product.totalStock || product.stock);
          }}
        >
          <ShoppingBasket className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
          <span className="truncate">Add to Cart</span>
        </Button>
      </div>
    </div>
  );
}

// ── Skeleton Card ─────────────────────────────────────────────────────────────

function DealCardSkeleton() {
  return (
    <div className="rounded-xl sm:rounded-2xl overflow-hidden border border-orange-100 bg-white">
      <Skeleton className="aspect-square sm:aspect-[4/3] w-full" />
      <div className="p-2 sm:p-4 space-y-2">
        <Skeleton className="h-2.5 sm:h-3 w-1/3" />
        <Skeleton className="h-3 sm:h-4 w-full" />
        <Skeleton className="h-3 sm:h-4 w-2/3" />
        <Skeleton className="h-6 sm:h-8 w-full rounded-lg" />
        <Skeleton className="h-7 sm:h-9 w-full rounded-lg" />
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SuperDealsPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { handleAddToCart } = useCart();

  const [sort,     setSort]     = useState("expiry");
  const [category, setCategory] = useState("all");

  const {
    deals, isLoading, isLoadingMore, hasMore, currentPage, total, error,
  } = useSelector((s) => s.shopSuperDeals);

  const sentinelRef   = useRef(null);
  const isFetchingRef = useRef(false);

  useEffect(() => {
    isFetchingRef.current = false;
    dispatch(fetchSuperDeals({ sort, category, page: 1 }));
  }, [dispatch, sort, category]);

  async function handleAddtoCart(productId, totalStock) {
    await handleAddToCart(productId, totalStock);
  }

  const loadMore = useCallback(() => {
    if (isFetchingRef.current || isLoadingMore || !hasMore || isLoading) return;
    isFetchingRef.current = true;
    dispatch(
      fetchMoreSuperDeals({ sort, category, page: currentPage + 1 })
    ).finally(() => { isFetchingRef.current = false; });
  }, [dispatch, sort, category, currentPage, isLoadingMore, hasMore, isLoading]);

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

  return (
    <main className="min-h-screen bg-gray-50">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-orange-950 via-red-900 to-amber-900 py-10 sm:py-16">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-red-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="flex justify-center mb-3 sm:mb-4">
            <div className="p-3 sm:p-4 bg-orange-500 rounded-xl sm:rounded-2xl shadow-2xl shadow-orange-500/40">
              <Flame className="h-7 w-7 sm:h-10 sm:w-10 text-white" />
            </div>
          </div>
          <Badge className="mb-3 sm:mb-4 bg-white/20 text-white border-white/30 backdrop-blur-sm text-xs sm:text-sm px-3 sm:px-4 py-0.5 sm:py-1">
            ⚡ Limited Time Only
          </Badge>
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-black text-white leading-tight mb-2 sm:mb-3">
            Super Deals
          </h1>
        </div>
      </section>

      {/* ── Controls bar ── */}
      <section className="sticky top-0 z-20 bg-white border-b shadow-sm">
        <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between gap-2">

          {/* Back button — icon-only on mobile */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/shop/home")}
            className="gap-1 text-muted-foreground hover:text-gray-900 px-2 sm:px-3"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Back to Home</span>
          </Button>

          {/* Filters — compact on mobile */}
          <div className="flex items-center gap-2">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-[130px] sm:w-[160px] h-8 sm:h-9 text-xs sm:text-sm">
                <Tag className="h-3 w-3 mr-1 text-muted-foreground shrink-0" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-[120px] sm:w-[160px] h-8 sm:h-9 text-xs sm:text-sm">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expiry">Ending Soonest</SelectItem>
                <SelectItem value="discount">Lowest Price</SelectItem>
                <SelectItem value="newest">Newest First</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* ── Grid ── */}
      <section className="container mx-auto px-2 sm:px-4 py-6 sm:py-10">

        {/* Initial skeleton */}
        {isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-6">
            {[...Array(8)].map((_, i) => <DealCardSkeleton key={i} />)}
          </div>
        )}

        {/* Error */}
        {!isLoading && error && (
          <div className="flex flex-col items-center py-24 gap-4 text-center">
            <Frown className="h-16 w-16 text-muted-foreground/40" />
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={() => dispatch(fetchSuperDeals({ sort, category, page: 1 }))}>
              Retry
            </Button>
          </div>
        )}

        {/* Empty */}
        {!isLoading && !error && deals.length === 0 && (
          <div className="flex flex-col items-center py-24 gap-4 text-center px-4">
            <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-orange-50 flex items-center justify-center">
              <Flame className="h-10 w-10 sm:h-12 sm:w-12 text-orange-200" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">No Active Deals Right Now</h2>
            <p className="text-muted-foreground text-sm max-w-sm">
              Check back soon for new super deals!
            </p>
            <Button variant="outline" onClick={() => navigate("/shop/listing")} className="mt-2">
              Browse All Products
            </Button>
          </div>
        )}

        {/* Deals */}
        {!isLoading && deals.length > 0 && (
          <>
            {/* Count info */}
            <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-6">
              <span className="font-semibold text-gray-900">{deals.length}</span> of{" "}
              <span className="font-semibold text-gray-900">{total}</span> deal{total !== 1 ? "s" : ""}
              {category !== "all" && (
                <span> in <span className="font-semibold capitalize text-orange-600">{category}</span></span>
              )}
              {hasMore ? "…" : " — all loaded"}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-6">
              {deals.map((product) => (
                <DealCard
                  key={product._id}
                  product={product}
                  onAddToCart={handleAddtoCart}
                />
              ))}
              {isLoadingMore &&
                [...Array(4)].map((_, i) => <DealCardSkeleton key={`skel-${i}`} />)
              }
            </div>

            {/* Spinner */}
            {isLoadingMore && (
              <div className="flex justify-center items-center py-8 gap-3">
                <div className="h-5 w-5 rounded-full border-2 border-orange-400 border-t-transparent animate-spin" />
                <span className="text-sm text-muted-foreground">Loading more deals…</span>
              </div>
            )}

            {/* End message */}
            {!isLoadingMore && !hasMore && deals.length > 0 && (
              <div className="flex justify-center py-8 sm:py-10">
                <p className="text-sm text-muted-foreground">
                  You've seen all {deals.length} deal{deals.length !== 1 ? "s" : ""}.
                </p>
              </div>
            )}

            <div ref={sentinelRef} className="h-1" aria-hidden="true" />
          </>
        )}
      </section>
    </main>
  );
}
