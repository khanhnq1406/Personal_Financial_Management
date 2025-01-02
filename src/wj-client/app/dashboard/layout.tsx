import ActiveLink from "@/components/activeLink";
import Link from "next/link";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="bg-bg h-full p-3">
      <div className="block sm:grid grid-cols-[250px_auto] h-full">
        <div className="hidden sm:flex flex-wrap justify-center h-fit">
          <div className="flex h-fit items-center gap-2 my-8">
            <img alt="logo" src="/logo.png" className="w-[50px] h-[50px]" />
            <div className="text-fg font-bold h-fit text-lg">
              Wealth Journey
            </div>
          </div>
          <div className="flex flex-wrap gap-3 mx-4">
            <ActiveLink href="/dashboard/home">
              <img className="w-[20px] h-[20px]" src="/home.png" />
              <div>Home</div>
            </ActiveLink>
            <ActiveLink href="/dashboard/transaction">
              <img className="w-[20px] h-[20px]" src="/transaction.png" />
              <div>Transaction</div>
            </ActiveLink>
            <ActiveLink href="/dashboard/report">
              <img className="w-[20px] h-[20px]" src="/report.png" />
              <div>Report</div>
            </ActiveLink>
            <ActiveLink href="/dashboard/budget">
              <img className="w-[20px] h-[20px]" src="/budget.png" />
              <div>Budget</div>
            </ActiveLink>
            <ActiveLink href="/dashboard/wallets">
              <img className="w-[20px] h-[20px]" src="/wallet-white.png" />
              <div>Wallets</div>
            </ActiveLink>
            <button className="text-fg w-full flex flex-nowrap gap-2 items-center font-medium p-2 rounded-md hover:shadow-md hover:bg-[rgba(255,255,255,0.35)]">
              <img className="w-[20px] h-[20px]" src="/logout(white).png" />
              <div>Logout</div>
            </button>
          </div>
        </div>
        <div className="bg-fg h-full rounded-md">{children}</div>
      </div>
    </div>
  );
}
