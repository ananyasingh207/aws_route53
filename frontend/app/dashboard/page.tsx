"use client";

import React from "react";
import ConsoleShell from "@/components/ConsoleShell";
import ContentLayout from "@cloudscape-design/components/content-layout";
import Header from "@cloudscape-design/components/header";
import Container from "@cloudscape-design/components/container";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Alert from "@cloudscape-design/components/alert";
import Box from "@cloudscape-design/components/box";

export default function DashboardPage() {
  return (
    <ConsoleShell
      activeHref="/dashboard"
      breadcrumbs={[
        { text: "Route 53", href: "/dashboard" },
        { text: "Dashboard", href: "/dashboard" },
      ]}
    >
      <ContentLayout
        header={
          <Header
            variant="h1"
            description="Scalable Domain Name System (DNS) web service console."
          >
            Dashboard
          </Header>
        }
      >
        <SpaceBetween size="l">
          <Alert type="info" header="AWS Route 53 Clone Initialized">
            Welcome to the Amazon Route 53 Console Clone. Backend REST API (FastAPI + SQLite + JWT) is fully configured and ready for DNS management.
          </Alert>

          <Container
            header={<Header variant="h2">DNS Management Overview</Header>}
          >
            <SpaceBetween size="m">
              <Box variant="p">
                Amazon Route 53 effectively connects user requests to infrastructure running in AWS or on-premises. Use the navigation on the left to manage your hosted zones and DNS records.
              </Box>
            </SpaceBetween>
          </Container>
        </SpaceBetween>
      </ContentLayout>
    </ConsoleShell>
  );
}
