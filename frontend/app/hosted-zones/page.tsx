"use client";

import React, { useState } from "react";
import ConsoleShell from "@/components/ConsoleShell";
import ContentLayout from "@cloudscape-design/components/content-layout";
import Header from "@cloudscape-design/components/header";
import Table from "@cloudscape-design/components/table";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";
import TextFilter from "@cloudscape-design/components/text-filter";
import Pagination from "@cloudscape-design/components/pagination";
import CollectionPreferences from "@cloudscape-design/components/collection-preferences";
import Box from "@cloudscape-design/components/box";
import Alert from "@cloudscape-design/components/alert";

interface HostedZoneItem {
  id: number;
  name: string;
  zone_type: string;
  description: string;
  private_zone: boolean;
}

export default function HostedZonesPage() {
  const [filteringText, setFilteringText] = useState("");
  const [currentPageIndex, setCurrentPageIndex] = useState(1);
  const [selectedItems, setSelectedItems] = useState<HostedZoneItem[]>([]);

  return (
    <ConsoleShell
      activeHref="/hosted-zones"
      breadcrumbs={[
        { text: "Route 53", href: "/dashboard" },
        { text: "Hosted zones", href: "/hosted-zones" },
      ]}
    >
      <ContentLayout
        header={
          <Header
            variant="h1"
            description="A hosted zone is a container for DNS records for a domain."
            actions={
              <SpaceBetween direction="horizontal" size="xs">
                <Button disabled>View details</Button>
                <Button disabled>Delete</Button>
                <Button variant="primary" disabled>
                  Create hosted zone
                </Button>
              </SpaceBetween>
            }
          >
            Hosted zones
          </Header>
        }
      >
        <SpaceBetween size="l">
          <Alert type="info">
            Hosted Zone management actions are currently disabled for visual verification in Phase 8. API integration will be enabled in subsequent phases.
          </Alert>

          <Table
            columnDefinitions={[
              {
                id: "name",
                header: "Domain name",
                cell: (item) => item.name,
                sortingField: "name",
              },
              {
                id: "zone_type",
                header: "Type",
                cell: (item) => item.zone_type,
                sortingField: "zone_type",
              },
              {
                id: "description",
                header: "Description",
                cell: (item) => item.description || "-",
              },
              {
                id: "private_zone",
                header: "Private zone",
                cell: (item) => (item.private_zone ? "Yes" : "No"),
              },
            ]}
            items={[]}
            loadingText="Loading hosted zones..."
            selectionType="single"
            selectedItems={selectedItems}
            onSelectionChange={({ detail }) =>
              setSelectedItems(detail.selectedItems as HostedZoneItem[])
            }
            trackBy="id"
            empty={
              <Box margin={{ vertical: "xs" }} textAlign="center" color="inherit">
                <SpaceBetween size="m">
                  <b>No hosted zones</b>
                  <Box variant="p" color="inherit">
                    No hosted zones found. Create a hosted zone to start routing traffic for your domain.
                  </Box>
                  <Button disabled>Create hosted zone</Button>
                </SpaceBetween>
              </Box>
            }
            filter={
              <TextFilter
                filteringText={filteringText}
                filteringPlaceholder="Find hosted zones by name"
                onChange={({ detail }) => setFilteringText(detail.filteringText)}
              />
            }
            pagination={
              <Pagination
                currentPageIndex={currentPageIndex}
                onChange={({ detail }) => setCurrentPageIndex(detail.currentPageIndex)}
                pagesCount={1}
              />
            }
            preferences={
              <CollectionPreferences
                title="Preferences"
                confirmLabel="Confirm"
                cancelLabel="Cancel"
                preferences={{
                  pageSize: 10,
                }}
                pageSizePreference={{
                  title: "Select page size",
                  options: [
                    { value: 10, label: "10 hosted zones" },
                    { value: 20, label: "20 hosted zones" },
                    { value: 50, label: "50 hosted zones" },
                  ],
                }}
              />
            }
          />
        </SpaceBetween>
      </ContentLayout>
    </ConsoleShell>
  );
}
