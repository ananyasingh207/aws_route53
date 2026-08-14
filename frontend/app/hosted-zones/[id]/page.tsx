"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ConsoleShell from "@/components/ConsoleShell";
import ContentLayout from "@cloudscape-design/components/content-layout";
import Header from "@cloudscape-design/components/header";
import Container from "@cloudscape-design/components/container";
import Table from "@cloudscape-design/components/table";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";
import TextFilter from "@cloudscape-design/components/text-filter";
import Select, { SelectProps } from "@cloudscape-design/components/select";
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
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import ColumnLayout from "@cloudscape-design/components/column-layout";
import KeyValuePairs from "@cloudscape-design/components/key-value-pairs";

import {
  DNSRecord,
  HostedZone,
  createDNSRecordApi,
  deleteDNSRecordApi,
  getHostedZoneApi,
  listDNSRecordsApi,
  updateDNSRecordApi,
} from "@/lib/api";
import { parseApiError } from "@/lib/errors";

const RECORD_TYPE_OPTIONS: SelectProps.Option[] = [
  { label: "All types", value: "" },
  { label: "A - IPv4 address", value: "A" },
  { label: "AAAA - IPv6 address", value: "AAAA" },
  { label: "CNAME - Canonical name", value: "CNAME" },
  { label: "TXT - Text", value: "TXT" },
  { label: "MX - Mail exchange", value: "MX" },
  { label: "NS - Name server", value: "NS" },
  { label: "PTR - Pointer", value: "PTR" },
  { label: "SRV - Service locator", value: "SRV" },
  { label: "CAA - Certification authority authorization", value: "CAA" },
];

const RECORD_TYPE_FORM_OPTIONS: SelectProps.Option[] = RECORD_TYPE_OPTIONS.slice(1);

const TYPE_PLACEHOLDERS: Record<string, { placeholder: string; description: string }> = {
  A: { placeholder: "192.0.2.1", description: "Enter a valid IPv4 address (e.g. 192.0.2.1)." },
  AAAA: { placeholder: "2001:db8::1", description: "Enter a valid IPv6 address (e.g. 2001:db8::1)." },
  CNAME: { placeholder: "www.example.com", description: "Enter the target canonical domain name (e.g. www.example.com)." },
  TXT: { placeholder: "v=spf1 include:_spf.example.com ~all", description: "Enter text string value (e.g. v=spf1 include:_spf.example.com ~all)." },
  MX: { placeholder: "10 mail.example.com", description: "Format: <priority> <hostname> (e.g. 10 mail.example.com)." },
  NS: { placeholder: "ns1.example.com", description: "Enter the name server domain (e.g. ns1.example.com)." },
  PTR: { placeholder: "host.example.com", description: "Enter pointer domain (e.g. host.example.com)." },
  SRV: { placeholder: "10 5 5060 sip.example.com", description: "Format: <priority> <weight> <port> <target> (e.g. 10 5 5060 sip.example.com)." },
  CAA: { placeholder: "0 issue letsencrypt.org", description: "Format: <flags> <tag> <value> (e.g. 0 issue letsencrypt.org)." },
};

export default function HostedZoneDetailPage() {
  const params = useParams();
  const router = useRouter();
  const zoneId = Number(params.id);

  // Hosted zone state
  const [zone, setZone] = useState<HostedZone | null>(null);
  const [zoneLoading, setZoneLoading] = useState(true);
  const [zoneError, setZoneError] = useState("");

  // Records state
  const [records, setRecords] = useState<DNSRecord[]>([]);
  const [recordsTotal, setRecordsTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [recordsError, setRecordsError] = useState("");
  const [selectedRecords, setSelectedRecords] = useState<DNSRecord[]>([]);
  const [flashMessages, setFlashMessages] = useState<FlashbarProps.MessageDefinition[]>([]);

  // Create record modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createType, setCreateType] = useState("A");
  const [createTtl, setCreateTtl] = useState("300");
  const [createValue, setCreateValue] = useState("");
  const [createError, setCreateError] = useState("");
  const [createFieldErrors, setCreateFieldErrors] = useState<Record<string, string>>({});
  const [createSubmitting, setCreateSubmitting] = useState(false);

  // Edit record modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState("A");
  const [editTtl, setEditTtl] = useState("300");
  const [editValue, setEditValue] = useState("");
  const [editError, setEditError] = useState("");
  const [editFieldErrors, setEditFieldErrors] = useState<Record<string, string>>({});
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Delete record modal state
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

  // Fetch hosted zone detail
  const fetchZoneDetail = useCallback(async () => {
    if (!zoneId || isNaN(zoneId)) {
      setZoneError("Invalid hosted zone ID.");
      setZoneLoading(false);
      return;
    }
    setZoneLoading(true);
    setZoneError("");
    try {
      const data = await getHostedZoneApi(zoneId);
      setZone(data);
    } catch (err: unknown) {
      const parsed = parseApiError(err, "zone", "load");
      setZoneError(parsed.message);
    } finally {
      setZoneLoading(false);
    }
  }, [zoneId]);

  // Fetch DNS records list
  const fetchRecords = useCallback(async () => {
    if (!zoneId || isNaN(zoneId)) return;
    setRecordsLoading(true);
    setRecordsError("");
    try {
      const res = await listDNSRecordsApi(
        zoneId,
        debouncedSearch,
        typeFilter,
        page,
        limit
      );
      setRecords(res.items);
      setRecordsTotal(res.total);
    } catch (err: unknown) {
      const parsed = parseApiError(err, "record", "load");
      setRecordsError(parsed.message);
    } finally {
      setRecordsLoading(false);
    }
  }, [zoneId, debouncedSearch, typeFilter, page, limit]);

  useEffect(() => {
    fetchZoneDetail();
  }, [fetchZoneDetail]);

  useEffect(() => {
    if (zone) {
      fetchRecords();
    }
  }, [zone, fetchRecords]);

  // Open Edit Modal
  const handleOpenEdit = () => {
    if (selectedRecords.length !== 1) return;
    const target = selectedRecords[0];
    setEditName(target.name);
    setEditType(target.type);
    setEditTtl(target.ttl.toString());
    setEditValue(target.value);
    setEditError("");
    setEditFieldErrors({});
    setEditModalOpen(true);
  };

  // Create Record Form Submit
  const handleCreateSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setCreateError("");
    setCreateFieldErrors({});

    const fieldErrs: Record<string, string> = {};
    if (!createName.trim()) {
      fieldErrs["name"] = "Enter a record name.";
    }
    const ttlNum = parseInt(createTtl, 10);
    if (isNaN(ttlNum) || ttlNum <= 0) {
      fieldErrs["ttl"] = "TTL must be a positive number.";
    }
    if (!createValue.trim()) {
      fieldErrs["value"] = "Enter a record value.";
    }

    if (Object.keys(fieldErrs).length > 0) {
      setCreateError("Please correct the errors in the form before submitting.");
      setCreateFieldErrors(fieldErrs);
      return;
    }

    setCreateSubmitting(true);
    try {
      await createDNSRecordApi(zoneId, {
        name: createName.trim(),
        type: createType,
        ttl: ttlNum,
        value: createValue.trim(),
      });
      setCreateModalOpen(false);
      setCreateName("");
      setCreateValue("");
      setCreateTtl("300");
      setCreateType("A");
      setFlashMessages([
        {
          type: "success",
          content: "Record created successfully.",
          dismissible: true,
          id: Date.now().toString(),
          onDismiss: () => setFlashMessages([]),
        },
      ]);
      fetchRecords();
    } catch (err: unknown) {
      const parsed = parseApiError(err, "record", "create");
      setCreateError(parsed.message);
      setCreateFieldErrors(parsed.fieldErrors);
    } finally {
      setCreateSubmitting(false);
    }
  };

  // Edit Record Form Submit
  const handleEditSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (selectedRecords.length !== 1) return;
    const target = selectedRecords[0];
    setEditError("");
    setEditFieldErrors({});

    const fieldErrs: Record<string, string> = {};
    if (!editName.trim()) {
      fieldErrs["name"] = "Enter a record name.";
    }
    const ttlNum = parseInt(editTtl, 10);
    if (isNaN(ttlNum) || ttlNum <= 0) {
      fieldErrs["ttl"] = "TTL must be a positive number.";
    }
    if (!editValue.trim()) {
      fieldErrs["value"] = "Enter a record value.";
    }

    if (Object.keys(fieldErrs).length > 0) {
      setEditError("Please correct the errors in the form before submitting.");
      setEditFieldErrors(fieldErrs);
      return;
    }

    setEditSubmitting(true);
    try {
      await updateDNSRecordApi(target.id, {
        name: editName.trim(),
        type: editType,
        ttl: ttlNum,
        value: editValue.trim(),
      });
      setEditModalOpen(false);
      setSelectedRecords([]);
      setFlashMessages([
        {
          type: "success",
          content: "Record updated successfully.",
          dismissible: true,
          id: Date.now().toString(),
          onDismiss: () => setFlashMessages([]),
        },
      ]);
      fetchRecords();
    } catch (err: unknown) {
      const parsed = parseApiError(err, "record", "update");
      setEditError(parsed.message);
      setEditFieldErrors(parsed.fieldErrors);
    } finally {
      setEditSubmitting(false);
    }
  };

  // Delete Record Submit
  const handleDeleteSubmit = async () => {
    if (selectedRecords.length !== 1) return;
    const target = selectedRecords[0];
    setDeleteSubmitting(true);
    try {
      await deleteDNSRecordApi(target.id);
      setDeleteModalOpen(false);
      setSelectedRecords([]);
      setFlashMessages([
        {
          type: "success",
          content: "Record deleted successfully.",
          dismissible: true,
          id: Date.now().toString(),
          onDismiss: () => setFlashMessages([]),
        },
      ]);
      fetchRecords();
    } catch (err: unknown) {
      const parsed = parseApiError(err, "record", "delete");
      setFlashMessages([
        {
          type: "error",
          content: parsed.message,
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

  const pagesCount = Math.ceil(recordsTotal / limit) || 1;
  const isOneRecordSelected = selectedRecords.length === 1;

  const currentTypeGuidance =
    TYPE_PLACEHOLDERS[createType] || TYPE_PLACEHOLDERS["A"];
  const editTypeGuidance =
    TYPE_PLACEHOLDERS[editType] || TYPE_PLACEHOLDERS["A"];

  return (
    <ConsoleShell
      activeHref="/hosted-zones"
      breadcrumbs={[
        { text: "Route 53", href: "/dashboard" },
        { text: "Hosted zones", href: "/hosted-zones" },
        {
          text: zone?.name || `Zone #${zoneId}`,
          href: `/hosted-zones/${zoneId}`,
        },
      ]}
    >
      <ContentLayout
        header={
          <Header
            variant="h1"
            description="Hosted zone details and resource record sets."
          >
            {zone?.name || `Hosted Zone #${zoneId}`}
          </Header>
        }
      >
        <SpaceBetween size="l">
          {flashMessages.length > 0 && <Flashbar items={flashMessages} />}

          {zoneError && (
            <Alert
              type="error"
              action={
                <Button onClick={() => router.push("/hosted-zones")}>
                  Return to Hosted zones
                </Button>
              }
              header="Hosted zone error"
            >
              {zoneError}
            </Alert>
          )}

          {zone && (
            <Container
              header={
                <Header
                  variant="h2"
                  actions={
                    <StatusIndicator
                      type={zone.private_zone ? "info" : "success"}
                    >
                      {zone.zone_type} Zone
                    </StatusIndicator>
                  }
                >
                  Hosted zone details
                </Header>
              }
            >
              <ColumnLayout columns={4} variant="default">
                <KeyValuePairs
                  items={[
                    { label: "Domain name", value: zone.name },
                    { label: "Type", value: zone.zone_type },
                    { label: "Description", value: zone.description || "-" },
                    {
                      label: "Created",
                      value: zone.created_at
                        ? new Date(zone.created_at).toLocaleString()
                        : "-",
                    },
                  ]}
                />
              </ColumnLayout>
            </Container>
          )}

          {zone && (
            <Table
              wrapLines
              columnDefinitions={[
                {
                  id: "name",
                  header: "Record name",
                  cell: (item) => item.name,
                },
                {
                  id: "type",
                  header: "Type",
                  cell: (item) => item.type,
                },
                {
                  id: "ttl",
                  header: "TTL (seconds)",
                  cell: (item) => item.ttl,
                },
                {
                  id: "value",
                  header: "Value",
                  cell: (item) => (
                    <span style={{ wordBreak: "break-all" }}>
                      {item.value}
                    </span>
                  ),
                },
              ]}
              items={records}
              loading={recordsLoading}
              loadingText="Loading DNS records..."
              selectionType="single"
              selectedItems={selectedRecords}
              onSelectionChange={({ detail }) =>
                setSelectedRecords(detail.selectedItems as DNSRecord[])
              }
              trackBy="id"
              header={
                <Header
                  variant="h2"
                  description="DNS records contained in this hosted zone."
                  actions={
                    <SpaceBetween direction="horizontal" size="xs">
                      <Button
                        iconName="refresh"
                        ariaLabel="Refresh DNS records"
                        onClick={fetchRecords}
                        loading={recordsLoading}
                      >
                        Refresh
                      </Button>
                      <Button
                        disabled={!isOneRecordSelected}
                        onClick={handleOpenEdit}
                      >
                        Edit
                      </Button>
                      <Button
                        disabled={!isOneRecordSelected}
                        onClick={() => setDeleteModalOpen(true)}
                      >
                        Delete
                      </Button>
                      <Button
                        variant="primary"
                        onClick={() => {
                          setCreateName("");
                          setCreateValue("");
                          setCreateTtl("300");
                          setCreateType("A");
                          setCreateError("");
                          setCreateFieldErrors({});
                          setCreateModalOpen(true);
                        }}
                      >
                        Create record
                      </Button>
                    </SpaceBetween>
                  }
                >
                  Resource record sets ({recordsTotal})
                </Header>
              }
              empty={
                <Box
                  margin={{ vertical: "xs" }}
                  textAlign="center"
                  color="inherit"
                >
                  <SpaceBetween size="m">
                    <b>No resource records</b>
                    <Box variant="p" color="inherit">
                      No DNS records found. Create a record to configure DNS routing for your domain.
                    </Box>
                    <Button
                      variant="primary"
                      onClick={() => {
                        setCreateName("");
                        setCreateValue("");
                        setCreateTtl("300");
                        setCreateType("A");
                        setCreateError("");
                        setCreateFieldErrors({});
                        setCreateModalOpen(true);
                      }}
                    >
                      Create record
                    </Button>
                  </SpaceBetween>
                </Box>
              }
              filter={
                <SpaceBetween direction="horizontal" size="xs">
                  <div style={{ flexGrow: 1, minWidth: "200px" }}>
                    <TextFilter
                      filteringText={search}
                      filteringPlaceholder="Find record by name"
                      onChange={({ detail }) => setSearch(detail.filteringText)}
                    />
                  </div>
                  <div style={{ width: "220px" }}>
                    <Select
                      selectedOption={
                        RECORD_TYPE_OPTIONS.find((o) => o.value === typeFilter) ||
                        RECORD_TYPE_OPTIONS[0]
                      }
                      onChange={({ detail }) => {
                        setTypeFilter(detail.selectedOption.value || "");
                        setPage(1);
                      }}
                      options={RECORD_TYPE_OPTIONS}
                      ariaLabel="Filter record by type"
                    />
                  </div>
                </SpaceBetween>
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
                      { value: 10, label: "10 records" },
                      { value: 20, label: "20 records" },
                      { value: 50, label: "50 records" },
                      { value: 100, label: "100 records" },
                    ],
                  }}
                />
              }
            />
          )}

          {recordsError && (
            <Alert
              type="error"
              action={
                <Button iconName="refresh" onClick={fetchRecords}>
                  Retry
                </Button>
              }
              header="Couldn't load records"
            >
              {recordsError}
            </Alert>
          )}
        </SpaceBetween>
      </ContentLayout>

      {/* CREATE RECORD MODAL */}
      <Modal
        visible={createModalOpen}
        onDismiss={() => setCreateModalOpen(false)}
        header="Create record"
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
                  Create record
                </Button>
              </SpaceBetween>
            }
          >
            <SpaceBetween size="m">
              {createError && (
                <Alert type="error" header="Couldn't create record">
                  {createError}
                </Alert>
              )}

              <FormField
                label="Record name"
                description="Enter host name (e.g. www, @, _sip._tcp)."
                errorText={createFieldErrors.name}
              >
                <Input
                  value={createName}
                  onChange={({ detail }) => setCreateName(detail.value)}
                  placeholder="www"
                  disabled={createSubmitting}
                />
              </FormField>

              <FormField label="Record type" errorText={createFieldErrors.type}>
                <Select
                  selectedOption={
                    RECORD_TYPE_FORM_OPTIONS.find(
                      (o) => o.value === createType
                    ) || RECORD_TYPE_FORM_OPTIONS[0]
                  }
                  onChange={({ detail }) =>
                    setCreateType(detail.selectedOption.value || "A")
                  }
                  options={RECORD_TYPE_FORM_OPTIONS}
                  disabled={createSubmitting}
                />
              </FormField>

              <FormField
                label="TTL (seconds)"
                description="Time To Live in seconds (positive integer)."
                errorText={createFieldErrors.ttl}
              >
                <Input
                  type="number"
                  value={createTtl}
                  onChange={({ detail }) => setCreateTtl(detail.value)}
                  placeholder="300"
                  disabled={createSubmitting}
                />
              </FormField>

              <FormField
                label="Value"
                description={currentTypeGuidance.description}
                errorText={createFieldErrors.value}
              >
                <Textarea
                  value={createValue}
                  onChange={({ detail }) => setCreateValue(detail.value)}
                  placeholder={currentTypeGuidance.placeholder}
                  disabled={createSubmitting}
                />
              </FormField>
            </SpaceBetween>
          </Form>
        </form>
      </Modal>

      {/* EDIT RECORD MODAL */}
      <Modal
        visible={editModalOpen}
        onDismiss={() => setEditModalOpen(false)}
        header="Edit record"
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
                <Alert type="error" header="Couldn't update record">
                  {editError}
                </Alert>
              )}

              <FormField label="Record name" errorText={editFieldErrors.name}>
                <Input
                  value={editName}
                  onChange={({ detail }) => setEditName(detail.value)}
                  disabled={editSubmitting}
                />
              </FormField>

              <FormField label="Record type" errorText={editFieldErrors.type}>
                <Select
                  selectedOption={
                    RECORD_TYPE_FORM_OPTIONS.find(
                      (o) => o.value === editType
                    ) || RECORD_TYPE_FORM_OPTIONS[0]
                  }
                  onChange={({ detail }) =>
                    setEditType(detail.selectedOption.value || "A")
                  }
                  options={RECORD_TYPE_FORM_OPTIONS}
                  disabled={editSubmitting}
                />
              </FormField>

              <FormField label="TTL (seconds)" errorText={editFieldErrors.ttl}>
                <Input
                  type="number"
                  value={editTtl}
                  onChange={({ detail }) => setEditTtl(detail.value)}
                  disabled={editSubmitting}
                />
              </FormField>

              <FormField
                label="Value"
                description={editTypeGuidance.description}
                errorText={editFieldErrors.value}
              >
                <Textarea
                  value={editValue}
                  onChange={({ detail }) => setEditValue(detail.value)}
                  placeholder={editTypeGuidance.placeholder}
                  disabled={editSubmitting}
                />
              </FormField>
            </SpaceBetween>
          </Form>
        </form>
      </Modal>

      {/* DELETE RECORD CONFIRMATION MODAL */}
      <Modal
        visible={deleteModalOpen}
        onDismiss={() => setDeleteModalOpen(false)}
        header="Delete record?"
        closeAriaLabel="Close modal"
      >
        <SpaceBetween size="m">
          <ColumnLayout columns={3} variant="default">
            <KeyValuePairs
              items={[
                { label: "Record name", value: selectedRecords[0]?.name || "-" },
                { label: "Type", value: selectedRecords[0]?.type || "-" },
                { label: "Value", value: selectedRecords[0]?.value || "-" },
              ]}
            />
          </ColumnLayout>

          <Box variant="p">
            Are you sure you want to delete this resource record? This action cannot be undone.
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
