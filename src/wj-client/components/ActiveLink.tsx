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
    // Allow Cmd/Ctrl+click and middle-click to open in new tab
    if (e.metaKey || e.ctrlKey || e.button === 1) {
      return;
    }
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
      aria-current={pathname === href ? "page" : undefined}
    >
      {children}
    </a>
  );
}

export default ActiveLink;
