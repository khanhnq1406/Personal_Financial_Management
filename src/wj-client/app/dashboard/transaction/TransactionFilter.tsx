"use client";

type TransactionFilterProps = {
  filterType: "all" | "income" | "expense";
  onFilterChange: (type: "all" | "income" | "expense") => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
};

export const TransactionFilter = ({
  filterType,
  onFilterChange,
  searchQuery,
  onSearchChange,
}: TransactionFilterProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
      {/* Filter Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => onFilterChange("all")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filterType === "all"
              ? "bg-hgreen text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          All
        </button>
        <button
          onClick={() => onFilterChange("income")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filterType === "income"
              ? "bg-green-500 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Income
        </button>
        <button
          onClick={() => onFilterChange("expense")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filterType === "expense"
              ? "bg-red-500 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Expense
        </button>
      </div>

      {/* Search Input */}
      <div className="relative w-full sm:w-64">
        <input
          type="text"
          placeholder="Search transactions..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full px-4 py-2 pl-10 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-hgreen"
        />
        <svg
          className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
    </div>
  );
};
