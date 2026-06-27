import { useState, useMemo } from "react";
import { ArrowRight, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Claim, Category, ClaimStatus } from "../types";

interface ExploreClaimsPageProps {
  claims: Claim[];
  onNavigate: (path: string) => void;
  isLoading: boolean;
}

// Keep search filters capitalized to match your UI layout selection arrays
const CATEGORIES: (Category | "All")[] = ["All", "Politics", "Finance", "Health", "Science", "Tech", "Other"];
const STATUSES: (ClaimStatus | "All")[] = ["All", "Pending", "Investigating", "Verified", "False", "Misleading", "Unverified"];

export default function ExploreClaimsPage({ claims, onNavigate, isLoading }: ExploreClaimsPageProps) {
  const [selectedCategory, setSelectedCategory] = useState<Category | "All">("All");
  const [selectedStatus, setSelectedStatus] = useState<ClaimStatus | "All">("All");
  const [sortBy, setSortBy] = useState<"Most Recent" | "Oldest" | "Category">("Most Recent");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Safe Guard: Ensure claims defaults to an array if it's missing or undefined
  const safeClaims = Array.isArray(claims) ? claims : [];

  // Filter & Sort Logic done on client-side for dynamic responsive feedback
  const filteredClaims = useMemo(() => {
    let result = [...safeClaims];

    // Search query
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.title?.toLowerCase().includes(q) ||
          (c.claim_text || c.text || "").toLowerCase().includes(q)
      );
    }

    // Category (Handles lowercase matching for "tech", "finance" from API)
    if (selectedCategory !== "All") {
      result = result.filter((c) => c.category?.toLowerCase() === selectedCategory.toLowerCase());
    }

    // Status (Handles lowercase matching for "pending", etc. from API)
    if (selectedStatus !== "All") {
      result = result.filter((c) => c.status?.toLowerCase() === selectedStatus.toLowerCase());
    }

    // Sorting
    if (sortBy === "Oldest") {
      result.sort((a, b) => new Date(a.submitted_at || a.createdAt).getTime() - new Date(b.submitted_at || b.createdAt).getTime());
    } else if (sortBy === "Category") {
      result.sort((a, b) => (a.category || "").localeCompare(b.category || ""));
    } else {
      // Most Recent
      result.sort((a, b) => new Date(b.submitted_at || b.createdAt).getTime() - new Date(a.submitted_at || a.createdAt).getTime());
    }

    return result;
  }, [safeClaims, selectedCategory, selectedStatus, sortBy, searchQuery]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredClaims.length / itemsPerPage));
  const paginatedClaims = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredClaims.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredClaims, currentPage]);

  const getVerdictStyle = (status: string) => {
    const s = status?.toLowerCase();
    if (s === "pending" || s === "investigating") {
      return "bg-[#f3f3f3] text-[#6b7280]";
    }

    switch (s) {
      case "verified":
        return "bg-[#16a34a] text-white";
      case "false":
        return "bg-[#dc2626] text-white";
      case "misleading":
        return "bg-[#d97706] text-white";
      case "unverified":
        return "bg-[#6b7280] text-white";
      default:
        return "bg-[#6b7280] text-white";
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    if (!dateStr) return "unknown";
    const elapsed = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(elapsed / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (mins > 0) return `${mins}m ago`;
    return "just now";
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div id="explore-claims-container" className="py-8 sm:py-12 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto space-y-8">
      {/* Title */}
      <h2 id="claims-page-title" className="text-3xl font-extrabold tracking-tight text-[#0a0a0a]">
        Claims
      </h2>

      {/* Filters & Search Row */}
      <div id="filters-container" className="space-y-4">
        {/* Category Filters */}
        <div id="category-filter-row" className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono text-[#6b7280] mr-2 uppercase tracking-wider">Category:</span>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              id={`cat-pill-${cat}`}
              onClick={() => {
                setSelectedCategory(cat);
                setCurrentPage(1);
              }}
              className={`px-3 py-1 text-xs font-mono tracking-tight border transition-colors ${selectedCategory === cat
                  ? "bg-[#0a0a0a] text-white border-black"
                  : "bg-white text-[#0a0a0a] border-[#e5e5e5] hover:bg-[#f3f3f3]"
                }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Status Filters & Sort */}
        <div id="status-filter-row" className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono text-[#6b7280] mr-2 uppercase tracking-wider">Status:</span>
            {STATUSES.map((status) => (
              <button
                key={status}
                id={`status-pill-${status}`}
                onClick={() => {
                  setSelectedStatus(status);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 text-xs font-mono tracking-tight border transition-colors ${selectedStatus === status
                    ? "bg-[#0a0a0a] text-white border-black"
                    : "bg-white text-[#0a0a0a] border-[#e5e5e5] hover:bg-[#f3f3f3]"
                  }`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div id="sort-dropdown-container" className="flex items-center gap-2 self-start md:self-auto">
            <span className="text-xs font-mono text-[#6b7280] uppercase tracking-wider">Sort:</span>
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1.5 text-xs font-mono border border-[#e5e5e5] bg-white text-[#0a0a0a] rounded-none focus:outline-none focus:border-black cursor-pointer"
            >
              <option value="Most Recent">Most Recent</option>
              <option value="Oldest">Oldest</option>
              <option value="Category">Category</option>
            </select>
          </div>
        </div>

        {/* Search Input */}
        <div id="search-input-container" className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4.5 h-4.5 text-[#6b7280]" />
          <input
            id="search-claims"
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search claims..."
            className="w-full pl-10 pr-4 py-3 border border-[#e5e5e5] text-sm text-[#0a0a0a] bg-white placeholder-[#6b7280] rounded-none focus:outline-none focus:border-black font-sans"
          />
        </div>
      </div>

      {/* Claims List */}
      {isLoading ? (
        <div id="claims-loading-skeleton" className="space-y-4">
          {[...Array(4)].map((_, index) => (
            <div
              key={index}
              className="h-16 bg-[#f3f3f3] border border-[#e5e5e5] w-full"
            />
          ))}
        </div>
      ) : paginatedClaims.length > 0 ? (
        <div id="claims-rows-list" className="flex flex-col border border-[#e5e5e5] bg-white divide-y divide-[#e5e5e5]">
          {paginatedClaims.map((claim) => {
            const displayId = claim.claim_id || claim.id;
            const displayStatus = claim.status || "pending";
            const displaySubmitter = claim.submitter || claim.submittedBy || "";
            
            return (
              <button
                key={displayId}
                id={`claim-row-${displayId}`}
                onClick={() => onNavigate(`claims/${displayId}`)}
                className="w-full flex flex-col md:flex-row md:items-center text-left py-4 px-4 sm:px-6 hover:bg-[#f3f3f3] transition-colors gap-3 md:gap-6"
              >
                {/* Badge Column */}
                <div className="md:w-36 flex-shrink-0">
                  <span
                    id={`claim-badge-${displayId}`}
                    className={`inline-block px-3 py-1 font-mono text-xs font-bold uppercase text-center w-full md:w-auto tracking-tight ${getVerdictStyle(displayStatus)}`}
                  >
                    {displayStatus.toLowerCase() === "pending" || displayStatus.toLowerCase() === "investigating"
                      ? "Awaiting Verdict"
                      : displayStatus}
                  </span>
                </div>

                {/* Title and Category */}
                <div className="flex-grow space-y-1">
                  <h3 className="text-sm sm:text-base font-bold text-[#0a0a0a] line-clamp-1">
                    {claim.title}
                  </h3>
                  <div className="flex items-center gap-3 text-xs font-mono text-[#6b7280]">
                    <span className="capitalize">{claim.category}</span>
                    <span>•</span>
                    {displaySubmitter && (
                      <span>Submitted by {displaySubmitter.slice(0, 6)}...{displaySubmitter.slice(-4)}</span>
                    )}
                  </div>
                </div>

                {/* View Arrow Link */}
                <div className="md:w-32 flex-shrink-0 flex items-center justify-between md:justify-end gap-3 text-xs font-mono text-[#6b7280]">
                  <span>{formatTimeAgo(claim.submitted_at || claim.createdAt)}</span>
                  <ArrowRight className="w-4 h-4 text-[#0a0a0a]" />
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div id="empty-claims-state" className="text-center py-16 border border-dashed border-[#e5e5e5] bg-[#f9f9f9]">
          <p className="text-sm font-mono text-[#6b7280]">No claims found matching your filter criteria.</p>
        </div>
      )}

      {/* Pagination Controls */}
      {filteredClaims.length > itemsPerPage && (
        <div id="pagination-controls" className="flex items-center justify-between border-t border-[#e5e5e5] pt-6 text-sm font-mono">
          <button
            id="prev-page-btn"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-[#e5e5e5] bg-white text-[#0a0a0a] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#f3f3f3]"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <span id="page-indicator" className="text-[#6b7280]">
            Page {currentPage} of {totalPages}
          </span>

          <button
            id="next-page-btn"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-[#e5e5e5] bg-white text-[#0a0a0a] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#f3f3f3]"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}