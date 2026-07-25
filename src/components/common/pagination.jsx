import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Pagination component
 * Props:
 *   currentPage  — 1-based current page number
 *   totalPages   — total number of pages
 *   onPageChange — callback(pageNumber)
 */
export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  // Build the page numbers to display (max 5 visible)
  function getPages() {
    const pages = [];
    const delta = 2;
    const left  = Math.max(1, currentPage - delta);
    const right = Math.min(totalPages, currentPage + delta);

    if (left > 1) {
      pages.push(1);
      if (left > 2) pages.push("…");
    }
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages) {
      if (right < totalPages - 1) pages.push("…");
      pages.push(totalPages);
    }
    return pages;
  }

  const pages = getPages();

  return (
    <div className="flex items-center justify-center gap-1.5 mt-10 select-none">
      {/* Prev */}
      <button
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className={`
          flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all
          ${currentPage === 1
            ? "text-gray-300 cursor-not-allowed"
            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 cursor-pointer"
          }
        `}
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Prev</span>
      </button>

      {/* Page numbers */}
      {pages.map((page, i) =>
        page === "…" ? (
          <span key={`ellipsis-${i}`} className="px-2 py-2 text-sm text-gray-400">
            …
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`
              min-w-[38px] h-9 px-2 rounded-lg text-sm font-medium transition-all cursor-pointer
              ${page === currentPage
                ? "bg-gray-900 text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }
            `}
          >
            {page}
          </button>
        )
      )}

      {/* Next */}
      <button
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className={`
          flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all
          ${currentPage === totalPages
            ? "text-gray-300 cursor-not-allowed"
            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 cursor-pointer"
          }
        `}
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
