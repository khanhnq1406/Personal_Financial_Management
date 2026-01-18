"use client";

import { usePathname, useRouter } from "next/navigation";

function ActiveLink({
  children,
  href,
}: {
  children: React.ReactNode;
  href: string;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push(href);
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      className={`text-fg w-full flex flex-nowrap gap-2 items-center font-medium p-2 rounded-md hover:shadow-md hover:bg-[rgba(255,255,255,0.35)] ${
        pathname === href ? "bg-[rgba(255,255,255,0.3)]" : ""
      }`}
    >
      {children}
    </a>
  );
}

export default ActiveLink;
