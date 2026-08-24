import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllActiveCategories } from "@/store/shop/category-slice";
import { fetchAllActiveBrands } from "@/store/shop/brand-slice";
import { addProductFormElements } from "@/config";

/**
 * Returns `addProductFormElements` with the `category` and `brand` fields' options
 * replaced by the live data from the database.
 *
 * Falls back to the hard-coded config options if the API hasn't loaded yet.
 */
export function useProductFormElements() {
  const dispatch = useDispatch();
  const { all: dbCategories, isLoading: isCategoryLoading } = useSelector((s) => s.shopCategory);
  const { all: dbBrands, isLoading: isBrandLoading } = useSelector((s) => s.shopBrand);

  useEffect(() => {
    if (dbCategories.length === 0) {
      dispatch(fetchAllActiveCategories());
    }
    if (dbBrands.length === 0) {
      dispatch(fetchAllActiveBrands());
    }
  }, [dispatch, dbCategories.length, dbBrands.length]);

  const formElements = useMemo(() => {
    let elements = addProductFormElements;

    // Replace category options with live DB data
    if (dbCategories.length) {
      elements = elements.map((el) => {
        if (el.name !== "category") return el;
        return {
          ...el,
          options: dbCategories.map((c) => ({ id: c.slug, label: c.name })),
        };
      });
    }

    // Replace brand options with live DB data
    if (dbBrands.length) {
      elements = elements.map((el) => {
        if (el.name !== "brand") return el;
        return {
          ...el,
          options: dbBrands.map((b) => ({ id: b.slug, label: b.name })),
        };
      });
    }

    return elements;
  }, [dbCategories, dbBrands]);

  return {
    formElements,
    isCategoryLoading,
    isBrandLoading,
  };
}
