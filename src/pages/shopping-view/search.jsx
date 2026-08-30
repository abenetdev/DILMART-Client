import ShoppingProductTile from "@/components/shopping-view/product-tile";
import { useCart } from "@/hooks/useCart";
import { getSearchResults } from "@/store/shop/search-slice";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";

function SearchProducts() {
  const [searchParams] = useSearchParams();
  const keyword        = searchParams.get("keyword") || "";
  const dispatch       = useDispatch();
  const { searchResults } = useSelector((state) => state.shopSearch);
  const { handleAddToCart } = useCart();

  // Fetch whenever the URL keyword changes
  useEffect(() => {
    if (keyword.trim()) {
      dispatch(getSearchResults(keyword.trim()));
    }
    // Intentionally do nothing when keyword is cleared — keep showing last results
  }, [keyword, dispatch]);

  return (
    <div className="container mx-auto px-4 md:px-6 py-8">
      {/* Results header */}
      {/* <div className="mb-6">
        {keyword ? (
          <div>
            <p className="text-sm text-muted-foreground">
              {searchResults.length > 0
                ? `${searchResults.length} result${searchResults.length !== 1 ? "s" : ""} for`
                : "No results for"}
            </p>
            <h1 className="text-2xl font-bold mt-0.5">
              &ldquo;{keyword}&rdquo;
            </h1>
          </div>
        ) : (
          <div className="flex flex-col items-center py-20 gap-3 text-muted-foreground">
            <Search className="h-16 w-16" />
            <p className="text-lg font-medium">Start typing to search products</p>
            <p className="text-sm">Use the search bar above to find what you&apos;re looking for</p>
          </div>
        )}
      </div> */}

      {/* Results grid */}
      {keyword && searchResults.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-3 text-muted-foreground">
          <Search className="h-12 w-12" />
          <p className="text-xl font-semibold">No results found</p>
          <p className="text-sm">Try different keywords or check for typos</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {searchResults.map((item) => (
            <ShoppingProductTile
              key={item._id}
              handleAddtoCart={handleAddToCart}
              product={item}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default SearchProducts;
