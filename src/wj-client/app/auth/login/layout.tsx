import Image from "next/image";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="bg-bg h-screen">
      <div className="block sm:grid grid-cols-[40%_60%]">
        <div className="hidden sm:flex justify-center content-center flex-wrap gap-[20px]">
          <div className="flex gap-2">
            <img className="w-[80px] h-[80px]" src="/logo.png" />
            <div className="text-fg">
              <p className="font-extrabold text-[30px]">WealthJourney</p>
              <p>Your Trusted Guide to Financial Freedom</p>
            </div>
          </div>
          <img src="/login-stock.png" className="w-3/5" />
        </div>
        <div className="bg-fg h-screen">{children}</div>
      </div>
    </div>
  );
}
