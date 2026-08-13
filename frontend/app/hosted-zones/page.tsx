"use client";

import React, { useCallback, useEffect, useState } from "react";
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
import Flashbar, { FlashbarProps } from "@cloudscape-design/components/flashbar";
import Modal from "@cloudscape-design/components/modal";
import Form from "@cloudscape-design/components/form";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";
import Textarea from "@cloudscape-design/components/textarea";
import RadioGroup from "@cloudscape-design/components/radio-group";

import {
  HostedZone,
  createHostedZoneApi,
  deleteHostedZoneApi,
  listHostedZonesApi,
  updateHostedZoneApi,
} from "@/lib/api";

export default function HostedZonesPage() {
  const [items, setItems] = useState<HostedZone[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedItems, setSelectedItems] = useState<HostedZone[]>([]);
  const [flashMessages, setFlashMessages] = useState<FlashbarProps.MessageDefinition[]>([]);

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createZoneType, setCreateZoneType] = useState<"Public" | "Private">("Public");
  const [createError, setCreateError] = useState("");
  const [createSubmitting, setCreateSubmitting] = useState(false);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editZoneType, setEditZoneType] = useState<"Public" | "Private">("Public");
  const [editError, setEditError] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  // Debounce search input (~300ms) and reset page to 1
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch hosted zones from backend API
  const fetchHostedZones = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listHostedZonesApi(debouncedSearch, page, limit);
      setItems(res.items);
      setTotal(res.total);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || "Unable to load hosted zones. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page, limit]);

  useEffect(() => {
    fetchHostedZones();
  }, [fetchHostedZones]);

  // Handle open Edit Modal
  const handleOpenEdit = () => {
    if (selectedItems.length !== 1) return;
    const item = selectedItems[0];
    setEditName(item.name);
    setEditDescription(item.description || "");
    setEditZoneType(item.zone_type as "Public" | "Private");
    setEditError("");
    setEditModalOpen(true);
  };

  // Create Form Submit
  const handleCreateSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!createName.trim()) {
      setCreateError("Domain name is required.");
      return;
    }
    setCreateSubmitting(true);
    setCreateError("");
    try {
      await createHostedZoneApi({
        name: createName.trim(),
        description: createDescription.trim(),
        zone_type: createZoneType,
        private_zone: createZoneType === "Private",
      });
      setCreateModalOpen(false);
      setCreateName("");
      setCreateDescription("");
      setCreateZoneType("Public");
      setFlashMessages([
        {
          type: "success",
          content: `Hosted zone "${createName.trim()}" created successfully.`,
          dismissible: true,
          id: Date.now().toString(),
          onDismiss: () => setFlashMessages([]),
        },
      ]);
      fetchHostedZones();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("409") || msg.toLowerCase().includes("already exists")) {
        setCreateError("A hosted zone with this name already exists.");
      } else {
        setCreateError(msg || "Failed to create hosted zone.");
      }
    } finally {
      setCreateSubmitting(false);
    }
  };

  // Edit Form Submit
  const handleEditSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (selectedItems.length !== 1) return;
    const target = selectedItems[0];
    if (!editName.trim()) {
      setEditError("Domain name is required.");
      return;
    }
    setEditSubmitting(true);
    setEditError("");
    try {
      await updateHostedZoneApi(target.id, {
        name: editName.trim(),
        description: editDescription.trim(),
        zone_type: editZoneType,
        private_zone: editZoneType === "Private",
      });
      setEditModalOpen(false);
      setSelectedItems([]);
      setFlashMessages([
        {
          type: "success",
          content: `Hosted zone "${editName.trim()}" updated successfully.`,
          dismissible: true,
          id: Date.now().toString(),
          onDismiss: () => setFlashMessages([]),
        },
      ]);
      fetchHostedZones();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("409") || msg.toLowerCase().includes("already exists")) {
        setEditError("Another hosted zone with this name already exists.");
      } else {
        setEditError(msg || "Failed to update hosted zone.");
      }
    } finally {
      setEditSubmitting(false);
    }
  };

  // Delete Form Submit
  const handleDeleteSubmit = async () => {
    if (selectedItems.length !== 1) return;
    const target = selectedItems[0];
    setDeleteSubmitting(true);
    try {
      await deleteHostedZoneApi(target.id);
      setDeleteModalOpen(false);
      setSelectedItems([]);
      setFlashMessages([
        {
          type: "success",
          content: `Hosted zone "${target.name}" deleted successfully.`,
          dismissible: true,
          id: Date.now().toString(),
          onDismiss: () => setFlashMessages([]),
        },
      ]);
      fetchHostedZones();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setFlashMessages([
        {
          type: "error",
          content: msg || "Failed to delete hosted zone.",
          dismissible: true,
          id: Date.now().toString(),
          onDismiss: () => setFlashMessages([]),
        },
      ]);
      setDeleteModalOpen(false);
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const pagesCount = Math.ceil(total / limit) || 1;
  const isOneItemSelected = selectedItems.length === 1;

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
                <Button
                  iconName="refresh"
                  ariaLabel="Refresh hosted zones"
                  onClick={fetchHostedZones}
                  loading={loading}
                >
                  Refresh
                </Button>
                <Button disabled={!isOneItemSelected} onClick={handleOpenEdit}>
                  Edit
                </Button>
                <Button
                  disabled={!isOneItemSelected}
                  onClick={() => setDeleteModalOpen(true)}
                >
                  Delete
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    setCreateName("");
                    setCreateDescription("");
                    setCreateZoneType("Public");
                    setCreateError("");
                    setCreateModalOpen(true);
                  }}
                >
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
          {flashMessages.length > 0 && <Flashbar items={flashMessages} />}

          {error && (
            <Alert
              type="error"
              action={
                <Button iconName="refresh" onClick={fetchHostedZones}>
                  Retry
                </Button>
              }
              header="Unable to load hosted zones"
            >
              {error}
            </Alert>
          )}

          <Table
            wrapLines
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
              {
                id: "created_at",
                header: "Created",
                cell: (item) =>
                  item.created_at
                    ? new Date(item.created_at).toLocaleDateString()
                    : "-",
              },
            ]}
            items={items}
            loading={loading}
            loadingText="Loading hosted zones..."
            selectionType="single"
            selectedItems={selectedItems}
            onSelectionChange={({ detail }) =>
              setSelectedItems(detail.selectedItems as HostedZone[])
            }
            trackBy="id"
            empty={
              <Box margin={{ vertical: "xs" }} textAlign="center" color="inherit">
                <SpaceBetween size="m">
                  <b>No hosted zones</b>
                  <Box variant="p" color="inherit">
                    No hosted zones found. Create a hosted zone to start routing traffic for your domain.
                  </Box>
                  <Button
                    variant="primary"
                    onClick={() => {
                      setCreateName("");
                      setCreateDescription("");
                      setCreateZoneType("Public");
                      setCreateError("");
                      setCreateModalOpen(true);
                    }}
                  >
                    Create hosted zone
                  </Button>
                </SpaceBetween>
              </Box>
            }
            filter={
              <TextFilter
                filteringText={search}
                filteringPlaceholder="Find hosted zones by name"
                onChange={({ detail }) => setSearch(detail.filteringText)}
              />
            }
            pagination={
              <Pagination
                currentPageIndex={page}
                onChange={({ detail }) => setPage(detail.currentPageIndex)}
                pagesCount={pagesCount}
              />
            }
            preferences={
              <CollectionPreferences
                title="Preferences"
                confirmLabel="Confirm"
                cancelLabel="Cancel"
                preferences={{
                  pageSize: limit,
                }}
                onConfirm={({ detail }) => {
                  if (detail.pageSize) {
                    setLimit(detail.pageSize);
                    setPage(1);
                  }
                }}
                pageSizePreference={{
                  title: "Select page size",
                  options: [
                    { value: 10, label: "10 hosted zones" },
                    { value: 20, label: "20 hosted zones" },
                    { value: 50, label: "50 hosted zones" },
                    { value: 100, label: "100 hosted zones" },
                  ],
                }}
              />
            }
          />
        </SpaceBetween>
      </ContentLayout>

      {/* CREATE HOSTED ZONE MODAL */}
      <Modal
        visible={createModalOpen}
        onDismiss={() => setCreateModalOpen(false)}
        header="Create hosted zone"
        closeAriaLabel="Close modal"
      >
        <form onSubmit={handleCreateSubmit}>
          <Form
            actions={
              <SpaceBetween direction="horizontal" size="xs">
                <Button
                  variant="link"
                  onClick={() => setCreateModalOpen(false)}
                  disabled={createSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  formAction="submit"
                  loading={createSubmitting}
                  disabled={createSubmitting}
                >
                  Create hosted zone
                </Button>
              </SpaceBetween>
            }
          >
            <SpaceBetween size="m">
              {createError && (
                <Alert type="error" header="Creation failed">
                  {createError}
                </Alert>
              )}

              <FormField
                label="Domain name"
                description="Specify the name of the domain that you want to route traffic for."
                errorText={!createName.trim() && createError ? "Domain name is required." : undefined}
              >
                <Input
                  value={createName}
                  onChange={({ detail }) => setCreateName(detail.value)}
                  placeholder="example.com"
                  disabled={createSubmitting}
                />
              </FormField>

              <FormField
                label="Description - optional"
                description="Enter a comment or description for this hosted zone."
              >
                <Textarea
                  value={createDescription}
                  onChange={({ detail }) => setCreateDescription(detail.value)}
                  placeholder="Primary public hosted zone"
                  disabled={createSubmitting}
                />
              </FormField>

              <FormField label="Type" description="Choose the type of hosted zone.">
                <RadioGroup
                  value={createZoneType}
                  onChange={({ detail }) =>
                    setCreateZoneType(detail.value as "Public" | "Private")
                  }
                  items={[
                    {
                      value: "Public",
                      label: "Public hosted zone",
                      description:
                        "Routes traffic on the internet for your domain.",
                    },
                    {
                      value: "Private",
                      label: "Private hosted zone",
                      description:
                        "Routes traffic within an Amazon VPC.",
                    },
                  ]}
                />
              </FormField>
            </SpaceBetween>
          </Form>
        </form>
      </Modal>

      {/* EDIT HOSTED ZONE MODAL */}
      <Modal
        visible={editModalOpen}
        onDismiss={() => setEditModalOpen(false)}
        header="Edit hosted zone"
        closeAriaLabel="Close modal"
      >
        <form onSubmit={handleEditSubmit}>
          <Form
            actions={
              <SpaceBetween direction="horizontal" size="xs">
                <Button
                  variant="link"
                  onClick={() => setEditModalOpen(false)}
                  disabled={editSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  formAction="submit"
                  loading={editSubmitting}
                  disabled={editSubmitting}
                >
                  Save changes
                </Button>
              </SpaceBetween>
            }
          >
            <SpaceBetween size="m">
              {editError && (
                <Alert type="error" header="Update failed">
                  {editError}
                </Alert>
              )}

              <FormField label="Domain name">
                <Input
                  value={editName}
                  onChange={({ detail }) => setEditName(detail.value)}
                  disabled={editSubmitting}
                />
              </FormField>

              <FormField label="Description - optional">
                <Textarea
                  value={editDescription}
                  onChange={({ detail }) => setEditDescription(detail.value)}
                  disabled={editSubmitting}
                />
              </FormField>

              <FormField label="Type">
                <RadioGroup
                  value={editZoneType}
                  onChange={({ detail }) =>
                    setEditZoneType(detail.value as "Public" | "Private")
                  }
                  items={[
                    { value: "Public", label: "Public hosted zone" },
                    { value: "Private", label: "Private hosted zone" },
                  ]}
                />
              </FormField>
            </SpaceBetween>
          </Form>
        </form>
      </Modal>

      {/* DELETE HOSTED ZONE CONFIRMATION MODAL */}
      <Modal
        visible={deleteModalOpen}
        onDismiss={() => setDeleteModalOpen(false)}
        header="Delete hosted zone"
        closeAriaLabel="Close modal"
      >
        <SpaceBetween size="m">
          <Alert type="warning" header="Cascade Deletion Warning">
            Deleting a hosted zone also deletes all of its associated DNS records. This action cannot be undone.
          </Alert>

          <Box variant="p">
            Are you sure you want to delete the hosted zone{" "}
            <b>{selectedItems[0]?.name}</b>?
          </Box>

          <SpaceBetween direction="horizontal" size="xs">
            <Button
              variant="link"
              onClick={() => setDeleteModalOpen(false)}
              disabled={deleteSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleDeleteSubmit}
              loading={deleteSubmitting}
              disabled={deleteSubmitting}
            >
              Delete
            </Button>
          </SpaceBetween>
        </SpaceBetween>
      </Modal>
    </ConsoleShell>
  );
}
