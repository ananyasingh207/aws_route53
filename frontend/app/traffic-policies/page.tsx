"use client";

import React from "react";
import ConsoleShell from "@/components/ConsoleShell";
import ContentLayout from "@cloudscape-design/components/content-layout";
import Header from "@cloudscape-design/components/header";
import Container from "@cloudscape-design/components/container";
import Alert from "@cloudscape-design/components/alert";

export default function TrafficPoliciesPage() {
  return (
    <ConsoleShell
      activeHref="/traffic-policies"
      breadcrumbs={[
        { text: "Route 53", href: "/dashboard" },
        { text: "Traffic policies", href: "/traffic-policies" },
      ]}
    >
      <ContentLayout
        header={<Header variant="h1">Traffic policies</Header>}
      >
        <Container>
          <Alert type="info">Coming soon</Alert>
        </Container>
      </ContentLayout>
    </ConsoleShell>
  );
}
