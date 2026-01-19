"use client";

import { useState } from "react";
import { BaseCard } from "@/components/BaseCard";
import { ReportControls } from "./ReportControls";
import { FinancialTable } from "./FinancialTable";
import { useQueryGetFinancialReport } from "@/utils/generated/hooks";
import { exportFinancialReportToCSV } from "@/utils/csv-export";

export default function ReportPage() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedWalletIds, setSelectedWalletIds] = useState<number[]>([]);

  // Fetch financial report data for export
  const { data: reportData } = useQueryGetFinancialReport(
    {
      year: selectedYear,
      walletIds: selectedWalletIds ?? [],
    },
    {
      refetchOnMount: "always",
      enabled: !!selectedYear,
    },
  );

  const handleExport = () => {
    try {
      exportFinancialReportToCSV(reportData, selectedYear);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to export CSV");
    }
  };

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
  };

  const handleWalletsChange = (walletIds: number[]) => {
    setSelectedWalletIds(walletIds);
  };

  return (
    <div className="flex justify-center p-3 sm:p-6">
      <div className="w-full max-w-full ">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="font-semibold text-lg sm:text-xl mb-3 sm:mb-4">
            Report
          </div>
        </div>

        {/* Controls */}
        <ReportControls
          onExport={handleExport}
          onYearChange={handleYearChange}
          onWalletsChange={handleWalletsChange}
        />

        {/* Financial Table */}
        <div className="font-semibold text-sm sm:text-base mt-3 sm:mt-4 mb-2">
          Financial Details
        </div>
        <BaseCard>
          <FinancialTable walletIds={selectedWalletIds} />
        </BaseCard>
      </div>
    </div>
  );
}
