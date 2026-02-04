/**
 * QuickActions Component Usage Examples
 *
 * This file demonstrates how to use the QuickActions component
 * across different dashboard pages.
 */

import { useState } from "react";
import {
  QuickActions,
  homeQuickActions,
  portfolioQuickActions,
  transactionQuickActions,
  walletsQuickActions,
  type ActionItem,
} from "./QuickActions";

/**
 * Example 1: Basic usage with modal state management
 */
export function BasicExample() {
  const [modalType, setModalType] = useState<string | null>(null);

  const handleOpenModal = (type: string) => {
    setModalType(type);
  };

  const handleCloseModal = () => {
    setModalType(null);
  };

  return (
    <div>
      {/* Quick actions bar */}
      <QuickActions actions={homeQuickActions(handleOpenModal)} />

      {/* Modal rendering based on type */}
      {modalType && (
        <div>
          {/* Your modal component here */}
          <p>Modal open: {modalType}</p>
          <button onClick={handleCloseModal}>Close</button>
        </div>
      )}
    </div>
  );
}

/**
 * Example 2: Custom action items
 */
export function CustomActionsExample() {
  const handleExportData = () => {
    console.log("Exporting data...");
    // Export logic here
  };

  const handleRefresh = () => {
    console.log("Refreshing data...");
    // Refresh logic here
  };

  const customActions: ActionItem[] = [
    {
      id: "export",
      label: "Export",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" x2="12" y1="15" y2="3" />
        </svg>
      ),
      onClick: handleExportData,
      ariaLabel: "Export data as CSV",
    },
    {
      id: "refresh",
      label: "Refresh",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
          <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
          <path d="M16 21h5v-5" />
        </svg>
      ),
      onClick: handleRefresh,
      ariaLabel: "Refresh data",
    },
  ];

  return <QuickActions actions={customActions} />;
}

/**
 * Example 3: Icon-only mode for compact display
 */
export function IconOnlyExample() {
  const actions: ActionItem[] = [
    {
      id: "search",
      label: "Search",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      ),
      onClick: () => console.log("Search"),
      ariaLabel: "Search transactions",
    },
    {
      id: "filter",
      label: "Filter",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>
      ),
      onClick: () => console.log("Filter"),
      ariaLabel: "Filter transactions",
    },
  ];

  return <QuickActions actions={actions} iconOnly />;
}

/**
 * Example 4: Usage in Home Page
 */
export function HomePageExample() {
  const [modalType, setModalType] = useState<string | null>(null);

  const handleOpenModal = (type: string) => {
    setModalType(type);
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Quick Actions Bar - Mobile Only */}
      <QuickActions actions={homeQuickActions(handleOpenModal)} />

      {/* Page Content */}
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
        {/* Rest of your page content */}
      </div>

      {/* Modal handling */}
      {modalType === "add-transaction" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Add Transaction</h2>
            <p className="mb-4">Transaction form goes here...</p>
            <button
              onClick={() => setModalType(null)}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Example 5: Usage in Portfolio Page with Refresh
 */
export function PortfolioPageExample() {
  const [modalType, setModalType] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleOpenModal = (type: string) => {
    setModalType(type);
  };

  const handleRefreshPrices = async () => {
    setIsRefreshing(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      console.log("Prices refreshed!");
    } finally {
      setIsRefreshing(false);
    }
  };

  const actions = portfolioQuickActions(handleOpenModal, handleRefreshPrices);

  // Disable refresh button while loading
  if (isRefreshing) {
    const refreshAction = actions.find((a) => a.id === "refresh");
    if (refreshAction) {
      refreshAction.disabled = true;
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Quick Actions with Refresh */}
      <QuickActions actions={actions} />

      {/* Page Content */}
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Portfolio</h1>
        {/* Portfolio content */}
      </div>
    </div>
  );
}

/**
 * Example 6: With disabled state
 */
export function DisabledActionsExample() {
  const [isOffline, setIsOffline] = useState(false);

  const actions: ActionItem[] = [
    {
      id: "sync",
      label: "Sync",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
          <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
          <path d="M16 21h5v-5" />
        </svg>
      ),
      onClick: () => console.log("Syncing..."),
      ariaLabel: "Sync with server",
      disabled: isOffline, // Disabled when offline
    },
  ];

  return (
    <div>
      <label className="flex items-center gap-2 mb-4">
        <input
          type="checkbox"
          checked={isOffline}
          onChange={(e) => setIsOffline(e.target.checked)}
          className="w-4 h-4"
        />
        Simulate offline mode
      </label>
      <QuickActions actions={actions} />
    </div>
  );
}

/**
 * Example 7: Integration with existing ModalType constants
 */
import { ModalType } from "@/app/constants";

export function WithModalConstantsExample() {
  const [modalType, setModalType] = useState<string | null>(null);

  const handleOpenModal = (type: string) => {
    // Map action IDs to ModalType constants
    const modalMapping: Record<string, string> = {
      "add-transaction": ModalType.ADD_TRANSACTION,
      "transfer": ModalType.TRANSFER_MONEY,
      "new-wallet": ModalType.CREATE_WALLET,
    };

    setModalType(modalMapping[type] || type);
  };

  return (
    <div>
      <QuickActions actions={homeQuickActions(handleOpenModal)} />
      {/* Modal handling based on ModalType */}
    </div>
  );
}
