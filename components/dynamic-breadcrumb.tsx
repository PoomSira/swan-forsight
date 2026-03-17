"use client";

import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export function DynamicBreadcrumb() {
  const pathname = usePathname();

  // Map routes to readable labels
  const routeLabels: Record<string, string> = {
    "/": "Dashboard",
    "/dashboard": "Dashboard",
    "/asset-manager": "Asset Manager",
    "/energy-monitoring": "Energy Monitoring",
    "/security-ops-monitoring": "Security Ops Monitoring",
    "/vulnerability-scan": "Vulnerability Scan",
    "/settings": "Settings",
  };

  // Generate breadcrumb items
  const generateBreadcrumbs = () => {
    if (pathname === "/") {
      return [{ label: "Dashboard", href: "/" }];
    }

    const items = [{ label: "Dashboard", href: "/" }];
    const label =
      routeLabels[pathname] ||
      pathname
        .split("/")
        .filter(Boolean)
        .map(
          (segment) =>
            segment.charAt(0).toUpperCase() +
            segment.slice(1).replace(/-/g, " "),
        )
        .join(" > ");

    items.push({ label, href: pathname });
    return items;
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbs.map((crumb, index) => (
          <div key={crumb.href} className="flex items-center gap-1">
            {index > 0 && <BreadcrumbSeparator className="hidden md:block" />}
            <BreadcrumbItem className={index === 0 ? "hidden md:block" : ""}>
              {index === breadcrumbs.length - 1 ? (
                <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </div>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
