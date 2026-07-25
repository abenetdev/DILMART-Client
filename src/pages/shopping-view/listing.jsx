import ProductFilter from "@/components/shopping-view/filter";
import ShoppingProductTile from "@/components/shopping-view/product-tile";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { sortOptions } from "@/config";
import {
  fetchAllFilteredProducts,
  fetchMoreProducts,
  fetchProductDetails,
} from "@/store/shop/products-slice";
import { ArrowUpDownIcon, Package, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { useCart } from "@/hooks/useCart";

const PAGE_LIMIT = 12;

function createSearchParamsHelper(filterParams) {
  const queryParams = [];
  for (const [key, value] of Object.entries(filterParams)) {
    if (Array.isArray(value) && value.length > 0) {
      queryParams.push(`${key}=${encodeURIComponent(value.join(","))}`);
    }
  }
  return queryParams.join("&");
}

function ProductSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4 p-2 sm:p-4">
      {Array.from({ length: PAGE_LIMIT }).map((_, i) => (
        <div key={i} className="rounded-lg overflow-hidden border shadow-sm">
          <Skeleton className="aspect-square sm:aspect-[3/4] w-full" />
          <div className="p-2 sm:p-3 space-y-1.5">
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-2.5 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <div className="p-2 sm:p-3 pt-0">
            <Skeleton className="h-7 sm:h-9 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ShoppingListing() {
  const dispatch = useDispatch();
  const {
    productList,
    productDetails,
    isLoading,
    isLoadingMore,
    hasMore,
    currentPage,
  } = useSelector((s) => s.shopProducts);

  const [filters, setFilters]           = useState({});
  const [sort, setSort]                 = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [filterOpen, setFilterOpen]     = useState(false);
  const { handleAddToCart }             = useCart();

  const sentinelRef    = useRef(null);
  const isFetchingRef  = useRef(false);
  const filterPanelRef = useRef(null);

  const categorySearchParam = searchParams.get("category");

  const activeFilterCount = Object.values(filters).reduce(
    (sum, arr) => sum + (arr?.length || 0),
    0
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (filterPanelRef.current && !filterPanelRef.current.contains(e.target)) {
        setFilterOpen(false);
      }
    }
    if (filterOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [filterOpen]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  function handleFilter(sectionId, option) {
    const cpyFilters = { ...filters };
    if (!cpyFilters[sectionId]) {
      cpyFilters[sectionId] = [option];
    } else {
      const idx = cpyFilters[sectionId].indexOf(option);
      if (idx === -1) cpyFilters[sectionId].push(option);
      else cpyFilters[sectionId].splice(idx, 1);
    }
    setFilters(cpyFilters);
    sessionStorage.setItem("filters", JSON.stringify(cpyFilters));

    // Close the dropdown as soon as any filter is toggled
    setFilterOpen(false);
  }

  async function handleAddtoCart(productId, totalStock) {
    await handleAddToCart(productId, totalStock);
  }

  // ── On category URL param change ─────────────────────────────────────────
  useEffect(() => {
    setSort("price-lowtohigh");
    setFilters(JSON.parse(sessionStorage.getItem("filters")) || {});
  }, [categorySearchParam]);

  // ── Sync filters → URL ────────────────────────────────────────────────────
  useEffect(() => {
    if (Object.keys(filters).length > 0) {
      setSearchParams(new URLSearchParams(createSearchParamsHelper(filters)));
    }
  }, [filters]);

  // ── Fetch first page on filter/sort change ────────────────────────────────
  useEffect(() => {
    if (filters !== null && sort !== null) {
      isFetchingRef.current = false;
      dispatch(
        fetchAllFilteredProducts({
          filterParams: filters,
          sortParams: sort,
          page: 1,
          limit: PAGE_LIMIT,
        })
      );
    }
  }, [dispatch, sort, filters]);

  // ── Infinite scroll load more ─────────────────────────────────────────────
  const loadMore = useCallback(() => {
    if (isFetchingRef.current || isLoadingMore || !hasMore || isLoading) return;
    isFetchingRef.current = true;
    dispatch(
      fetchMoreProducts({
        filterParams: filters,
        sortParams: sort,
        page: currentPage + 1,
        limit: PAGE_LIMIT,
      })
    ).finally(() => { isFetchingRef.current = false; });
  }, [dispatch, filters, sort, currentPage, isLoadingMore, hasMore, isLoading]);

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
    <div className="p-2 sm:p-4 md:p-6">
      <div className="bg-background w-full rounded-lg shadow-sm border">

        {/* ── Toolbar ── */}
        <div className="p-3 border-b flex items-center justify-between gap-2">

          {/* Left — filter button + active filter chips */}
          <div className="flex items-center gap-2 flex-wrap">

            {/* Filter dropdown trigger */}
            <div className="relative" ref={filterPanelRef}>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 relative"
                onClick={() => setFilterOpen((p) => !p)}
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {activeFilterCount}
                  </span>
                )}
              </Button>

              {/* ── Dropdown panel ── */}
              {filterOpen && (
                <div className="absolute top-full left-0 mt-2 z-50 w-[320px] max-h-[70vh] overflow-y-auto rounded-xl border bg-background shadow-xl">
                  <ProductFilter
                    filters={filters}
                    handleFilter={handleFilter}
                  />
                </div>
              )}
            </div>

            {/* Active filter chips */}
            {Object.entries(filters).map(([key, values]) =>
              (values || []).map((val) => (
                <span
                  key={`${key}-${val}`}
                  className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary border border-primary/20 rounded-full px-2.5 py-1 font-medium"
                >
                  {val}
                  <button
                    type="button"
                    onClick={() => handleFilter(key, val)}
                    className="ml-0.5 hover:text-destructive transition-colors cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))
            )}

            {/* Clear all chips */}
            {activeFilterCount > 0 && (
              <button
                type="button"
                className="text-xs text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                onClick={() => {
                  setFilters({});
                  sessionStorage.removeItem("filters");
                }}
              >
                Clear all
              </button>
            )}
          </div>

          {/* Right — sort */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1 shrink-0">
                <ArrowUpDownIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Sort by</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuRadioGroup value={sort} onValueChange={setSort}>
                {sortOptions.map((opt) => (
                  <DropdownMenuRadioItem key={opt.id} value={opt.id}>
                    {opt.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* ── Skeleton ── */}
        {isLoading && <ProductSkeleton />}

        {/* ── Grid ── */}
        {!isLoading && productList.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4 p-2 sm:p-4">
            {productList.map((product) => (
              <ShoppingProductTile
                key={product._id}
                product={product}
                handleGetProductDetails={(id) => dispatch(fetchProductDetails(id))}
                handleAddtoCart={handleAddtoCart}
              />
            ))}
          </div>
        )}

        {/* ── Empty ── */}
        {!isLoading && productList.length === 0 && (
          <div className="flex flex-col items-center py-20 gap-3">
            <Package className="h-16 w-16 text-muted-foreground" />
            <p className="text-muted-foreground">No products match your filters</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFilters({});
                sessionStorage.removeItem("filters");
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}

        {/* ── Loading more ── */}
        {isLoadingMore && (
          <div className="flex justify-center items-center py-8 gap-3">
            <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <span className="text-sm text-muted-foreground">Loading more…</span>
          </div>
        )}

        {/* ── End of list ── */}
        {!isLoading && !isLoadingMore && !hasMore && productList.length > 0 && (
          <div className="flex justify-center py-8">
            <p className="text-sm text-muted-foreground">You've reached the end</p>
          </div>
        )}

        <div ref={sentinelRef} className="h-1" aria-hidden="true" />
      </div>
    </div>
  );
}

export default ShoppingListing;
