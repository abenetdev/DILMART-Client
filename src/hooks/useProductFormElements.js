import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllActiveCategories } from "@/store/shop/category-slice";
import { addProductFormElements } from "@/config";

/**
 * Returns `addProductFormElements` with the `category` field's options
 * replaced by the live categories from the database.
 *
 * Falls back to the hard-coded config options if the API hasn't loaded yet.
 */
export function useProductFormElements() {
  const dispatch = useDispatch();
  const { all: dbCategories, isLoading } = useSelector((s) => s.shopCategory);

  useEffect(() => {
    if (dbCategories.length === 0) {
      dispatch(fetchAllActiveCategories());
    }
  }, [dispatch, dbCategories.length]);

  const formElements = useMemo(() => {
    if (!dbCategories.length) return addProductFormElements; // fallback to static

    return addProductFormElements.map((el) => {
      if (el.name !== "category") return el;
      return {
        ...el,
        options: dbCategories.map((c) => ({ id: c.slug, label: c.name })),
      };
    });
  }, [dbCategories]);

  return { formElements, isCategoryLoading: isLoading };
}
