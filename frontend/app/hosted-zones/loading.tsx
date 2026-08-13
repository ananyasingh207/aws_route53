"use client";

import Box from "@cloudscape-design/components/box";
import Spinner from "@cloudscape-design/components/spinner";

export default function HostedZonesLoading() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "80vh",
        backgroundColor: "#ffffff",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <Box textAlign="center">
        <Spinner size="large" />
      </Box>
    </div>
  );
}
