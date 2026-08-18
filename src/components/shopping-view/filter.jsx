import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllActiveCategories } from "@/store/shop/category-slice";
import { filterOptions } from "@/config";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";
import { Separator } from "../ui/separator";
import { ChevronDown } from "lucide-react";

// ── Single collapsible filter section ────────────────────────────────────
function FilterSection({ sectionKey, options, filters, handleFilter }) {
  const [open, setOpen] = useState(true);

  const activeCount = filters?.[sectionKey]?.length || 0;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between py-1 cursor-pointer group"
      >
        <span className="text-sm font-bold flex items-center gap-2 capitalize">
          {sectionKey}
          {activeCount > 0 && (
            <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
              {activeCount}
            </span>
          )}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="grid gap-2 mt-2 pl-1">
          {options.map((option) => (
            <Label
              key={option.id}
              className="flex font-medium items-center gap-2 cursor-pointer"
            >
              <Checkbox
                checked={!!(filters?.[sectionKey]?.indexOf(option.id) > -1)}
                onCheckedChange={() => handleFilter(sectionKey, option.id)}
              />
              {option.label}
            </Label>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main filter panel ─────────────────────────────────────────────────────
function ProductFilter({ filters, handleFilter }) {
  const dispatch = useDispatch();
  const { all: dbCategories } = useSelector((s) => s.shopCategory);

  // Fetch categories on mount if not already loaded
  useEffect(() => {
    if (dbCategories.length === 0) dispatch(fetchAllActiveCategories());
  }, [dispatch, dbCategories.length]);

  // Build the filter options: use DB categories for "category", keep static brand list
  const dynamicFilterOptions = {
    ...filterOptions,
    category: dbCategories.length > 0
      ? dbCategories.map((c) => ({ id: c.slug, label: c.name }))
      : filterOptions.category,   // fallback to static while loading
  };

  const totalActive = Object.values(filters || {}).reduce(
    (sum, arr) => sum + (arr?.length || 0), 0
  );

  return (
    <div className="bg-background rounded-lg shadow-sm">
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="text-base font-extrabold flex items-center gap-2">
          Filters
          {totalActive > 0 && (
            <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
              {totalActive}
            </span>
          )}
        </h2>
        {totalActive > 0 && (
          <button
            type="button"
            onClick={() => {
              Object.keys(filters || {}).forEach((key) =>
                (filters[key] || []).forEach((val) => handleFilter(key, val))
              );
            }}
            className="text-xs text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="p-4 space-y-4">
        {Object.keys(dynamicFilterOptions).map((keyItem, idx) => (
          <div key={keyItem}>
            <FilterSection
              sectionKey={keyItem}
              options={dynamicFilterOptions[keyItem]}
              filters={filters}
              handleFilter={handleFilter}
            />
            {idx < Object.keys(dynamicFilterOptions).length - 1 && (
              <Separator className="mt-4" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProductFilter;
