"use client";

import { pieChartColors } from "@/app/constants";
import { memo, useState } from "react";
import { useQueryListWallets } from "@/utils/generated/hooks";
import { DonutChartSVG, ChartWrapper } from "@/components/charts";
import { formatCurrency } from "@/utils/currency-formatter";
import { useCurrency } from "@/contexts/CurrencyContext";

interface DominanceProps {
  availableYears: number[];
}

export const Dominance = memo(function Dominance({
  availableYears,
}: DominanceProps) {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const { currency } = useCurrency();

  // Fetch wallets for the dropdown
  const { data: walletsData, isLoading: walletsLoading } = useQueryListWallets(
    {
      pagination: { page: 1, pageSize: 100, orderBy: "", order: "" },
    },
    { refetchOnMount: "always" },
  );

  // Prepare chart data - use display balances in user's preferred currency
  const chartData =
    walletsData?.wallets?.map((wallet) => ({
      name: wallet.walletName,
      value: wallet.displayBalance?.amount ?? wallet.balance?.amount ?? 0,
    })) ?? [];

  return (
    <ChartWrapper
      isLoading={walletsLoading}
      yearSelector={{
        value: selectedYear,
        options: availableYears,
        onChange: setSelectedYear,
      }}
    >
      <DonutChartSVG
        data={chartData}
        colors={pieChartColors}
        showPercentageLabels={true}
        labelPosition="inside"
        showLegend={true}
        legendPosition="right"
        tooltipFormatter={(value) => formatCurrency(value, currency)}
        height={300}
      />
    </ChartWrapper>
  );
});
