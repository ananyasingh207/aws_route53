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
import Link from "@cloudscape-design/components/link";

import {
  HostedZone,
  createHostedZoneApi,
  deleteHostedZoneApi,
  listHostedZonesApi,
  updateHostedZoneApi,
} from "@/lib/api";
import { parseApiError } from "@/lib/errors";

export default function HostedZonesPage() {
  const [hostedZones, setHostedZones] = useState<HostedZone[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedItems, setSelectedItems] = useState<HostedZone[]>([]);
  const [flashMessages, setFlashMessages] = useState<FlashbarProps.MessageDefinition[]>([]);

  // Search & Pagination state
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createType, setCreateType] = useState("Public");
  const [createDescription, setCreateDescription] = useState("");
  const [createError, setCreateError] = useState("");
  const [createFieldErrors, setCreateFieldErrors] = useState<Record<string, string>>({});
  const [createSubmitting, setCreateSubmitting] = useState(false);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState("Public");
  const [editDescription, setEditDescription] = useState("");
  const [editError, setEditError] = useState("");
  const [editFieldErrors, setEditFieldErrors] = useState<Record<string, string>>({});
  const [editSubmitting, setEditSubmitting] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  // Debounce search input (~300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch hosted zones from API
  const fetchHostedZones = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listHostedZonesApi(debouncedSearch, page, limit);
      setHostedZones(res.items);
      setTotalItems(res.total);
    } catch (err: unknown) {
      const parsed = parseApiError(err, "zone", "load");
      setError(parsed.message);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page, limit]);

  useEffect(() => {
    fetchHostedZones();
  }, [fetchHostedZones]);

  // Create Hosted Zone submit handler
  const handleCreateSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setCreateError("");
    setCreateFieldErrors({});

    if (!createName.trim()) {
      setCreateError("Enter a domain name.");
      setCreateFieldErrors({ name: "Enter a domain name." });
      return;
    }

    setCreateSubmitting(true);
    try {
      const isPrivate = createType === "Private";
      await createHostedZoneApi({
        name: createName.trim(),
        zone_type: createType,
        description: createDescription.trim(),
        private_zone: isPrivate,
      });

      setCreateModalOpen(false);
      setCreateName("");
      setCreateDescription("");
      setCreateType("Public");

      setFlashMessages([
        {
          type: "success",
          content: "Hosted zone created successfully.",
          dismissible: true,
          id: Date.now().toString(),
          onDismiss: () => setFlashMessages([]),
        },
      ]);
      fetchHostedZones();
    } catch (err: unknown) {
      const parsed = parseApiError(err, "zone", "create");
      setCreateError(parsed.message);
      setCreateFieldErrors(parsed.fieldErrors);
    } finally {
      setCreateSubmitting(false);
    }
  };

  // Edit Hosted Zone modal opener
  const handleOpenEdit = () => {
    if (selectedItems.length !== 1) return;
    const target = selectedItems[0];
    setEditName(target.name);
    setEditType(target.zone_type);
    setEditDescription(target.description || "");
    setEditError("");
    setEditFieldErrors({});
    setEditModalOpen(true);
  };

  // Edit Hosted Zone submit handler
  const handleEditSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (selectedItems.length !== 1) return;
    const target = selectedItems[0];
    setEditError("");
    setEditFieldErrors({});

    if (!editName.trim()) {
      setEditError("Enter a domain name.");
      setEditFieldErrors({ name: "Enter a domain name." });
      return;
    }

    setEditSubmitting(true);
    try {
      const isPrivate = editType === "Private";
      await updateHostedZoneApi(target.id, {
        name: editName.trim(),
        zone_type: editType,
        description: editDescription.trim(),
        private_zone: isPrivate,
      });

      setEditModalOpen(false);
      setSelectedItems([]);

      setFlashMessages([
        {
          type: "success",
          content: "Hosted zone updated successfully.",
          dismissible: true,
          id: Date.now().toString(),
          onDismiss: () => setFlashMessages([]),
        },
      ]);
      fetchHostedZones();
    } catch (err: unknown) {
      const parsed = parseApiError(err, "zone", "update");
      setEditError(parsed.message);
      setEditFieldErrors(parsed.fieldErrors);
    } finally {
      setEditSubmitting(false);
    }
  };

  // Delete Hosted Zone submit handler
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
          content: "Hosted zone deleted successfully.",
          dismissible: true,
          id: Date.now().toString(),
          onDismiss: () => setFlashMessages([]),
        },
      ]);
      fetchHostedZones();
    } catch (err: unknown) {
      const parsed = parseApiError(err, "zone", "delete");
      setDeleteModalOpen(false);
      setFlashMessages([
        {
          type: "error",
          content: parsed.message,
          dismissible: true,
          id: Date.now().toString(),
          onDismiss: () => setFlashMessages([]),
        },
      ]);
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const pagesCount = Math.ceil(totalItems / limit) || 1;
  const isOneSelected = selectedItems.length === 1;

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
            description="A hosted zone tells Route 53 how to respond to DNS queries for a domain."
            actions={
              <Button
                variant="primary"
                onClick={() => {
                  setCreateName("");
                  setCreateDescription("");
                  setCreateType("Public");
                  setCreateError("");
                  setCreateFieldErrors({});
                  setCreateModalOpen(true);
                }}
              >
                Create hosted zone
              </Button>
            }
          >
            Hosted zones ({totalItems})
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
              header="Couldn't load hosted zones"
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
                cell: (item) => (
                  <Link href={`/hosted-zones/${item.id}`}>{item.name}</Link>
                ),
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
            items={hostedZones}
            loading={loading}
            loadingText="Loading hosted zones..."
            selectionType="single"
            selectedItems={selectedItems}
            onSelectionChange={({ detail }) =>
              setSelectedItems(detail.selectedItems as HostedZone[])
            }
            trackBy="id"
            header={
              <Header
                variant="h2"
                actions={
                  <SpaceBetween direction="horizontal" size="xs">
                    <Button
                      iconName="refresh"
                      ariaLabel="Refresh"
                      onClick={fetchHostedZones}
                      loading={loading}
                    >
                      Refresh
                    </Button>
                    <Button disabled={!isOneSelected} onClick={handleOpenEdit}>
                      Edit
                    </Button>
                    <Button
                      disabled={!isOneSelected}
                      onClick={() => setDeleteModalOpen(true)}
                    >
                      Delete
                    </Button>
                  </SpaceBetween>
                }
              >
                Hosted zones list
              </Header>
            }
            empty={
              <Box
                margin={{ vertical: "xs" }}
                textAlign="center"
                color="inherit"
              >
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
                      setCreateType("Public");
                      setCreateError("");
                      setCreateFieldErrors({});
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
                <Alert type="error" header="Couldn't create hosted zone">
                  {createError}
                </Alert>
              )}

              <FormField
                label="Domain name"
                description="Specify the domain name that you want to route traffic for."
                errorText={createFieldErrors.name}
              >
                <Input
                  value={createName}
                  onChange={({ detail }) => setCreateName(detail.value)}
                  placeholder="example.com"
                  disabled={createSubmitting}
                />
              </FormField>

              <FormField label="Zone type" description="Choose the type of hosted zone.">
                <RadioGroup
                  value={createType}
                  onChange={({ detail }) => setCreateType(detail.value)}
                  items={[
                    {
                      value: "Public",
                      label: "Public hosted zone",
                      description: "Routes traffic on the internet.",
                    },
                    {
                      value: "Private",
                      label: "Private hosted zone",
                      description: "Routes traffic within Amazon VPCs.",
                    },
                  ]}
                />
              </FormField>

              <FormField
                label="Description"
                description="Optional description for this hosted zone."
              >
                <Textarea
                  value={createDescription}
                  onChange={({ detail }) => setCreateDescription(detail.value)}
                  placeholder="Production web server domain"
                  disabled={createSubmitting}
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
                <Alert type="error" header="Couldn't update hosted zone">
                  {editError}
                </Alert>
              )}

              <FormField label="Domain name" errorText={editFieldErrors.name}>
                <Input
                  value={editName}
                  onChange={({ detail }) => setEditName(detail.value)}
                  disabled={editSubmitting}
                />
              </FormField>

              <FormField label="Zone type">
                <RadioGroup
                  value={editType}
                  onChange={({ detail }) => setEditType(detail.value)}
                  items={[
                    { value: "Public", label: "Public hosted zone" },
                    { value: "Private", label: "Private hosted zone" },
                  ]}
                />
              </FormField>

              <FormField label="Description">
                <Textarea
                  value={editDescription}
                  onChange={({ detail }) => setEditDescription(detail.value)}
                  disabled={editSubmitting}
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
          <Alert type="warning">
            Deleting a hosted zone also deletes all of its associated DNS records. This action cannot be undone.
          </Alert>

          <Box variant="p">
            Are you sure you want to delete the hosted zone <b>{selectedItems[0]?.name}</b>?
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
