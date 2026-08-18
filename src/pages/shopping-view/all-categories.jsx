import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchAllActiveCategories } from "@/store/shop/category-slice";
import { Skeleton } from "@/components/ui/skeleton";
import { Tag, ChevronRight } from "lucide-react";

// ── Single category card ──────────────────────────────────────────────────
function CategoryCard({ cat, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group flex flex-col items-center gap-3 p-5 rounded-2xl bg-white border hover:shadow-md hover:-translate-y-1 transition-all duration-200 text-center w-full"
    >
      <div
        className="h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110"
        style={{ backgroundColor: cat.color || "#f3f4f6" }}
      >
        {cat.image ? (
          <img src={cat.image} alt={cat.name} className="h-9 w-9 object-contain" />
        ) : (
          <Tag className="h-6 w-6 text-gray-500" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-gray-900 leading-tight line-clamp-2">
          {cat.name}
        </p>
        {cat.description && (
          <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{cat.description}</p>
        )}
      </div>
    </button>
  );
}

// ── Subcategory row inside a parent section ───────────────────────────────
function SubCategoryRow({ cat, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors text-sm text-gray-700 hover:text-primary w-full text-left group"
    >
      <ChevronRight className="h-3.5 w-3.5 text-gray-400 group-hover:text-primary shrink-0" />
      {cat.name}
    </button>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────
function CategorySkeleton() {
  return (
    <div className="space-y-8">
      {[...Array(3)].map((_, i) => (
        <div key={i}>
          <Skeleton className="h-5 w-40 mb-4" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[...Array(6)].map((_, j) => (
              <div key={j} className="rounded-2xl border p-5 space-y-3">
                <Skeleton className="h-14 w-14 rounded-2xl mx-auto" />
                <Skeleton className="h-3 w-3/4 mx-auto" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────
export default function AllCategoriesPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { all: categories, isLoading } = useSelector((s) => s.shopCategory);

  useEffect(() => {
    if (categories.length === 0) dispatch(fetchAllActiveCategories());
  }, [dispatch, categories.length]);

  // Build tree: root categories + their children
  const tree = useMemo(() => {
    const roots = categories.filter((c) => !c.parentCategory);
    return roots.map((root) => ({
      ...root,
      children: categories.filter(
        (c) => c.parentCategory?._id === root._id || c.parentCategory === root._id
      ),
    }));
  }, [categories]);

  const goToCategory = (slug) => {
    sessionStorage.setItem("filters", JSON.stringify({ category: [slug] }));
    navigate("/listing");
  };

  return (
    <div className="container mx-auto px-4 py-10 md:py-14">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          All Categories
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Browse everything available on DilMart
        </p>
      </div>

      {isLoading ? (
        <CategorySkeleton />
      ) : tree.length === 0 ? (
        <div className="flex flex-col items-center py-20 gap-4 text-center">
          <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center">
            <Tag className="h-9 w-9 text-gray-400" />
          </div>
          <p className="text-gray-500 font-medium">No categories available yet</p>
        </div>
      ) : (
        <div className="space-y-12">
          {tree.map((root) => (
            <section key={root._id}>
              {/* Root category header — clickable */}
              <button
                onClick={() => goToCategory(root.slug)}
                className="group flex items-center gap-3 mb-5 hover:opacity-80 transition-opacity"
              >
                <div
                  className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: root.color || "#f3f4f6" }}
                >
                  {root.image ? (
                    <img src={root.image} alt={root.name} className="h-6 w-6 object-contain" />
                  ) : (
                    <Tag className="h-5 w-5 text-gray-500" />
                  )}
                </div>
                <h2 className="text-lg font-bold text-gray-900 group-hover:text-primary transition-colors">
                  {root.name}
                </h2>
                <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-primary transition-colors" />
              </button>

              {/* Subcategories grid */}
              {root.children.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 pl-0 sm:pl-4">
                  {root.children.map((child) => (
                    <CategoryCard
                      key={child._id}
                      cat={child}
                      onClick={() => goToCategory(child.slug)}
                    />
                  ))}
                </div>
              ) : (
                /* No subcategories — show the root itself as a single card */
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 pl-0 sm:pl-4">
                  <CategoryCard
                    cat={root}
                    onClick={() => goToCategory(root.slug)}
                  />
                </div>
              )}

              <div className="border-b border-gray-100 mt-8" />
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
