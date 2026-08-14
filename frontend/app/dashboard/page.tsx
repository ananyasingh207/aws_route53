"use client";

import React, { useEffect, useState, useCallback } from "react";
import ConsoleShell from "@/components/ConsoleShell";
import ContentLayout from "@cloudscape-design/components/content-layout";
import Header from "@cloudscape-design/components/header";
import Container from "@cloudscape-design/components/container";
import ColumnLayout from "@cloudscape-design/components/column-layout";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Alert from "@cloudscape-design/components/alert";
import Box from "@cloudscape-design/components/box";
import Link from "@cloudscape-design/components/link";
import Spinner from "@cloudscape-design/components/spinner";
import Button from "@cloudscape-design/components/button";
import { listHostedZonesApi, listDNSRecordsApi } from "@/lib/api";
import { parseApiError } from "@/lib/errors";

interface DashboardMetrics {
  totalZones: number;
  totalRecords: number;
  publicZones: number;
  privateZones: number;
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboardMetrics = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const zonesRes = await listHostedZonesApi("", 1, 100);
      const zones = zonesRes.items || [];
      const totalZones = zonesRes.total || zones.length;
      const publicZones = zones.filter((z) => !z.private_zone).length;
      const privateZones = zones.filter((z) => z.private_zone).length;

      let totalRecords = 0;
      if (zones.length > 0) {
        const recordPromises = zones.map((zone) =>
          listDNSRecordsApi(zone.id, "", "", 1, 1)
        );
        const recordResults = await Promise.all(recordPromises);
        totalRecords = recordResults.reduce((acc, curr) => acc + (curr.total || 0), 0);
      }

      setMetrics({
        totalZones,
        totalRecords,
        publicZones,
        privateZones,
      });
    } catch (err: unknown) {
      const parsed = parseApiError(err, "zone", "load");
      setError(parsed.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardMetrics();
  }, [fetchDashboardMetrics]);

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
            description="Domain Name System (DNS) web service console."
          >
            Dashboard
          </Header>
        }
      >
        <SpaceBetween size="m">
          <Alert type="info" header="AWS Route 53 Console">
            Welcome to the Amazon Route 53 Console. Connect user requests to infrastructure running in AWS or on premises.
          </Alert>

          {error && (
            <Alert
              type="error"
              header="Couldn't load dashboard metrics"
              action={
                <Button iconName="refresh" onClick={fetchDashboardMetrics}>
                  Retry
                </Button>
              }
            >
              {error}
            </Alert>
          )}

          <Container
            header={
              <Header
                variant="h2"
                description="Summary of DNS resources in your account."
                actions={
                  <Button
                    iconName="refresh"
                    ariaLabel="Refresh metrics"
                    onClick={fetchDashboardMetrics}
                    loading={loading}
                  />
                }
              >
                DNS resources
              </Header>
            }
          >
            {loading ? (
              <Box textAlign="center" padding={{ vertical: "m" }}>
                <SpaceBetween size="xs" direction="horizontal">
                  <Spinner size="normal" />
                  <Box variant="p" color="inherit">
                    Loading resource metrics...
                  </Box>
                </SpaceBetween>
              </Box>
            ) : metrics ? (
              <ColumnLayout columns={4} variant="default">
                <div>
                  <Box variant="awsui-key-label">Hosted Zones</Box>
                  <Box variant="p" padding={{ top: "n" }}>
                    <Link fontSize="heading-l" href="/hosted-zones">
                      {metrics.totalZones}
                    </Link>
                  </Box>
                </div>

                <div>
                  <Box variant="awsui-key-label">DNS Records</Box>
                  <Box variant="p" padding={{ top: "n" }}>
                    <Box variant="h1" tagOverride="span" fontSize="heading-l">
                      {metrics.totalRecords}
                    </Box>
                  </Box>
                </div>

                <div>
                  <Box variant="awsui-key-label">Public Zones</Box>
                  <Box variant="p" padding={{ top: "n" }}>
                    <Box variant="h1" tagOverride="span" fontSize="heading-l">
                      {metrics.publicZones}
                    </Box>
                  </Box>
                </div>

                <div>
                  <Box variant="awsui-key-label">Private Zones</Box>
                  <Box variant="p" padding={{ top: "n" }}>
                    <Box variant="h1" tagOverride="span" fontSize="heading-l">
                      {metrics.privateZones}
                    </Box>
                  </Box>
                </div>
              </ColumnLayout>
            ) : null}
          </Container>

          <Container
            header={<Header variant="h2">DNS Management Overview</Header>}
          >
            <SpaceBetween size="xs">
              <Box variant="p">
                Amazon Route 53 effectively connects user requests to infrastructure running in AWS or on premises.
              </Box>
              <Box variant="p">
                Use the navigation pane on the left or click on <Link href="/hosted-zones">Hosted zones</Link> to view, create, and manage your domain name records and DNS routing policies.
              </Box>
            </SpaceBetween>
          </Container>
        </SpaceBetween>
      </ContentLayout>
    </ConsoleShell>
  );
}
