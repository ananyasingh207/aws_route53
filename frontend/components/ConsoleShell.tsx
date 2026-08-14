"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@cloudscape-design/components/app-layout";
import SideNavigation from "@cloudscape-design/components/side-navigation";
import BreadcrumbGroup, { BreadcrumbGroupProps } from "@cloudscape-design/components/breadcrumb-group";
import TopNavigation from "@cloudscape-design/components/top-navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";

interface ConsoleShellProps {
  children: React.ReactNode;
  activeHref: string;
  breadcrumbs?: BreadcrumbGroupProps.Item[];
}

export default function ConsoleShell({
  children,
  activeHref,
  breadcrumbs = [{ text: "Route 53", href: "/dashboard" }],
}: ConsoleShellProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [navigationOpen, setNavigationOpen] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Collapse navigation on narrow viewports initially (< 768px)
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setNavigationOpen(false);
    }
  }, []);

  // Clear navigation loading indicator when destination page mounts and activeHref updates
  useEffect(() => {
    setIsNavigating(false);
  }, [activeHref]);

  if (!mounted) {
    return <div style={{ minHeight: "100vh" }} />;
  }

  const handleNavigate = (href: string) => {
    if (href !== activeHref) {
      setIsNavigating(true);
    }
    router.push(href);
  };

  const handleTopNavClick = async (event: CustomEvent<{ id: string }>) => {
    if (event.detail.id === "signout") {
      setIsNavigating(true);
      await logout();
      router.push("/login");
    }
  };

  return (
    <ProtectedRoute>
      <div>
        <TopNavigation
          identity={{
            href: "/dashboard",
            title: "Amazon Route 53",
            onFollow: (event) => {
              event.preventDefault();
              handleNavigate("/dashboard");
            },
          }}
          utilities={[
            {
              type: "menu-dropdown",
              iconName: "settings",
              ariaLabel: "Settings",
              items: [
                { id: "settings-coming-soon", text: "Coming soon" },
              ],
            },
            {
              type: "menu-dropdown",
              text: user?.name || "Route53 Administrator",
              description: user?.email || "admin@example.com",
              iconName: "user-profile",
              onItemClick: handleTopNavClick,
              items: [
                { id: "signout", text: "Sign Out" },
              ],
            },
          ]}
        />
        <AppLayout
          headerSelector="#awsui-top-navigation"
          breadcrumbs={
            <BreadcrumbGroup
              items={breadcrumbs}
              ariaLabel="Breadcrumbs"
              onFollow={(event) => {
                event.preventDefault();
                handleNavigate(event.detail.href);
              }}
            />
          }
          navigation={
            <SideNavigation
              activeHref={activeHref}
              header={{
                text: "Route 53",
                href: "/dashboard",
              }}
              onFollow={(event) => {
                event.preventDefault();
                handleNavigate(event.detail.href);
              }}
              items={[
                { type: "link", text: "Dashboard", href: "/dashboard" },
                { type: "link", text: "Hosted zones", href: "/hosted-zones" },
                { type: "divider" },
                { type: "link", text: "Traffic policies", href: "/traffic-policies" },
                { type: "link", text: "Health checks", href: "/health-checks" },
                { type: "link", text: "Resolver", href: "/resolver" },
                { type: "link", text: "Profiles", href: "/profiles" },
              ]}
            />
          }
          navigationOpen={navigationOpen}
          onNavigationChange={({ detail }) => setNavigationOpen(detail.open)}
          content={children}
          toolsHide={true}
        />
      </div>
    </ProtectedRoute>
  );
}
