import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getAllStores } from "@/store/shop/store-slice";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Store, Package, MapPin, ArrowLeft, X } from "lucide-react";

// ── Store card (same style as home page) ─────────────────────────────────

function StoreCard({ store, onVisit }) {
  return (
    <Card
      className="hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer group border"
      onClick={() => onVisit(store.slug)}
    >
      {/* Mini banner */}
      <div
        className="h-20 w-full"
        style={{
          background: store.banner
            ? `url(${store.banner}) center/cover`
            : `linear-gradient(135deg, ${store.primaryColor || "#2563EB"}, ${store.secondaryColor || "#1E40AF"})`,
        }}
      />
      <CardContent className="p-4 -mt-8 text-center">
        {/* Logo */}
        <div
          className="h-14 w-14 rounded-full border-4 border-white shadow-sm mx-auto overflow-hidden flex items-center justify-center mb-2"
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

        <h3 className="font-bold text-sm leading-tight line-clamp-1 group-hover:text-primary transition-colors">
          {store.storeName}
        </h3>

        {store.businessCategory && (
          <p className="text-xs text-muted-foreground mt-0.5 capitalize">
            {store.businessCategory.replace(/-/g, " ")}
          </p>
        )}

        {store.city && (
          <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
            <MapPin className="h-3 w-3" />
            {store.city}
          </p>
        )}

        <div className="flex items-center justify-center gap-1 mt-2">
          <Package className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            {store.productCount} product{store.productCount !== 1 ? "s" : ""}
          </span>
        </div>

        <Button
          size="sm"
          variant="outline"
          className="w-full mt-3 gap-1 text-xs h-8 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors"
          onClick={(e) => { e.stopPropagation(); onVisit(store.slug); }}
        >
          <Store className="h-3 w-3" />
          Visit Store
        </Button>
      </CardContent>
    </Card>
  );
}

function StoreCardSkeleton() {
  return (
    <div className="border rounded-xl overflow-hidden">
      <Skeleton className="h-20 w-full" />
      <div className="p-4 -mt-7 flex flex-col items-center gap-2">
        <Skeleton className="h-14 w-14 rounded-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-8 w-full rounded-lg mt-1" />
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────

export default function AllStoresPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { allStores, isLoading } = useSelector((s) => s.shopStore);

  const [search, setSearch]       = useState("");
  const [category, setCategory]   = useState("all");
  const [sortBy, setSortBy]       = useState("newest");

  useEffect(() => {
    dispatch(getAllStores());
  }, [dispatch]);

  // Derive unique categories from stores
  const categories = [
    ...new Set(
      allStores
        .map((s) => s.businessCategory)
        .filter(Boolean)
    ),
  ].sort();

  // Filter + sort
  const filtered = allStores
    .filter((s) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        s.storeName?.toLowerCase().includes(q) ||
        s.city?.toLowerCase().includes(q) ||
        s.businessCategory?.toLowerCase().includes(q);
      const matchCategory =
        category === "all" || s.businessCategory === category;
      return matchSearch && matchCategory;
    })
    .sort((a, b) => {
      if (sortBy === "products") return b.productCount - a.productCount;
      if (sortBy === "name") return a.storeName?.localeCompare(b.storeName);
      // newest
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

  const hasFilters = search || category !== "all";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header ── */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center gap-3 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="gap-1.5 text-muted-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
                <Store className="h-5 w-5 text-primary" />
                All Stores
              </h1>
              {!isLoading && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {filtered.length} of {allStores.length} store{allStores.length !== 1 ? "s" : ""}
                </p>
              )}
            </div>
          </div>

          {/* Filters row */}
          <div className="flex flex-wrap gap-3 items-center">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search stores..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 rounded-full"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Category filter */}
            {categories.length > 0 && (
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-[160px] h-9 rounded-full text-xs">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c} className="capitalize">
                      {c.replace(/-/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[150px] h-9 rounded-full text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="products">Most Products</SelectItem>
                <SelectItem value="name">Name: A → Z</SelectItem>
              </SelectContent>
            </Select>

            {/* Clear filters */}
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9 text-xs rounded-full gap-1"
                onClick={() => { setSearch(""); setCategory("all"); }}
              >
                <X className="h-3 w-3" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ── Grid ── */}
      <div className="container mx-auto px-4 md:px-6 py-8">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {[...Array(12)].map((_, i) => <StoreCardSkeleton key={i} />)}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filtered.map((store) => (
              <StoreCard
                key={store._id}
                store={store}
                onVisit={(slug) => navigate(`/store/${slug}`)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center py-24 gap-4">
            <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center">
              <Store className="h-9 w-9 text-muted-foreground" />
            </div>
            <p className="text-lg font-semibold">No stores found</p>
            <p className="text-sm text-muted-foreground">
              {hasFilters ? "Try different search terms or filters" : "No stores available yet"}
            </p>
            {hasFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setSearch(""); setCategory("all"); }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
