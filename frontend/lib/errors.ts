export interface ParsedApiError {
  title: string;
  message: string;
  fieldErrors: Record<string, string>;
  status?: number;
  isNetworkError?: boolean;
  isAuthError?: boolean;
}

export class ApiError extends Error {
  status: number;
  rawJson: any;

  constructor(status: number, message: string, rawJson?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.rawJson = rawJson;
  }
}

export function parseApiError(
  error: unknown,
  context: "record" | "zone" | "auth" | "general" = "general",
  action: "create" | "update" | "delete" | "load" = "create"
): ParsedApiError {
  if (process.env.NODE_ENV !== "production") {
    console.error(`[API Error Captured - Context: ${context}, Action: ${action}]:`, error);
  }

  if (
    error instanceof TypeError ||
    (error instanceof Error &&
      (error.message.includes("Failed to fetch") ||
        error.message.includes("NetworkError") ||
        error.message.includes("ECONNREFUSED") ||
        error.message.includes("ERR_NETWORK")))
  ) {
    return {
      title: "Connection error",
      message: "Couldn't connect to the server. The server may be waking up, please wait a moment and try again.",
      fieldErrors: {},
      isNetworkError: true,
    };
  }

  let status: number | undefined;
  let rawDetail: any;

  if (error instanceof ApiError) {
    status = error.status;
    rawDetail = error.rawJson?.detail || error.message;
  } else if (typeof error === "object" && error !== null) {
    status = (error as any).status;
    rawDetail = (error as any).detail || (error as any).message;
  } else if (typeof error === "string") {
    rawDetail = error;
  }

  if (status === 401) {
    // Distinguish login credential failure from expired session
    if (
      context === "auth" ||
      (typeof rawDetail === "string" && rawDetail.includes("Invalid email or password"))
    ) {
      return {
        title: "Sign-in error",
        message: "Incorrect email or password.",
        fieldErrors: { password: "Incorrect email or password." },
        status: 401,
        isAuthError: true,
      };
    }
    return {
      title: "Session expired",
      message: "Your session has expired. Please sign in again.",
      fieldErrors: {},
      status: 401,
      isAuthError: true,
    };
  }

  if (status === 403) {
    return {
      title: "Access denied",
      message: "You don't have permission to perform this action.",
      fieldErrors: {},
      status: 403,
    };
  }

  if (status === 404) {
    const itemLabel = context === "zone" ? "Hosted zone" : context === "record" ? "DNS record" : "Item";
    return {
      title: `${itemLabel} not found`,
      message: `The requested ${itemLabel.toLowerCase()} could not be found.`,
      fieldErrors: {},
      status: 404,
    };
  }

  if (status === 409) {
    const conflictMsg = context === "zone"
      ? "A hosted zone with this name already exists."
      : "A resource with this name already exists.";
    return {
      title: context === "zone" ? "Couldn't create hosted zone" : "Conflict",
      message: conflictMsg,
      fieldErrors: { name: conflictMsg },
      status: 409,
    };
  }

  if (status === 500) {
    return {
      title: "Server error",
      message: "Something went wrong on our side. Please try again.",
      fieldErrors: {},
      status: 500,
    };
  }

  // Parse Pydantic validation structures (422 or array detail)
  const fieldErrors: Record<string, string> = {};
  let mainMessage = "";

  if (Array.isArray(rawDetail)) {
    for (const item of rawDetail) {
      if (typeof item === "object" && item !== null) {
        const locArray = item.loc || [];
        const fieldName = String(locArray[locArray.length - 1] || "");
        const rawMsg = String(item.msg || "");

        let friendlyMsg = "";

        if (fieldName === "ttl" || rawMsg.includes("ttl") || rawMsg.includes("greater than 0")) {
          friendlyMsg = "TTL must be a positive number.";
          fieldErrors["ttl"] = friendlyMsg;
        } else if (fieldName === "name" || rawMsg.includes("name")) {
          friendlyMsg = context === "zone" ? "Enter a domain name." : "Enter a record name.";
          fieldErrors["name"] = friendlyMsg;
        } else if (fieldName === "type") {
          friendlyMsg = "Select a record type.";
          fieldErrors["type"] = friendlyMsg;
        } else if (fieldName === "value" || rawMsg.includes("IPv") || rawMsg.includes("record")) {
          if (rawMsg.includes("AAAA") || rawMsg.includes("IPv6")) {
            friendlyMsg = "Enter a valid IPv6 address.";
          } else if (rawMsg.includes("A record") || rawMsg.includes("IPv4")) {
            friendlyMsg = "Enter a valid IPv4 address.";
          } else if (rawMsg.includes("CNAME")) {
            friendlyMsg = "Enter a valid domain name for this CNAME record.";
          } else if (rawMsg.includes("TXT")) {
            friendlyMsg = "Enter a valid TXT record value.";
          } else if (rawMsg.includes("MX")) {
            friendlyMsg = "Enter a valid mail server and priority.";
          } else if (rawMsg.includes("NS")) {
            friendlyMsg = "Enter a valid nameserver.";
          } else if (rawMsg.includes("PTR")) {
            friendlyMsg = "Enter a valid domain name for this PTR record.";
          } else if (rawMsg.includes("SRV")) {
            friendlyMsg = "Enter a valid priority, weight, port, and target.";
          } else if (rawMsg.includes("CAA")) {
            friendlyMsg = "Enter a valid CAA record value.";
          } else {
            friendlyMsg = "Enter a valid record value.";
          }
          fieldErrors["value"] = friendlyMsg;
        } else if (fieldName === "email") {
          friendlyMsg = "Enter a valid email address.";
          fieldErrors["email"] = friendlyMsg;
        } else if (fieldName === "password") {
          friendlyMsg = "Enter your password.";
          fieldErrors["password"] = friendlyMsg;
        }

        if (!mainMessage && friendlyMsg) {
          mainMessage = friendlyMsg;
        }
      }
    }
  } else if (typeof rawDetail === "string") {
    if (rawDetail.includes("Invalid email or password")) {
      mainMessage = "Incorrect email or password.";
      fieldErrors["password"] = "Incorrect email or password.";
    } else if (rawDetail.includes("already exists")) {
      mainMessage = "A hosted zone with this name already exists.";
      fieldErrors["name"] = mainMessage;
    } else {
      mainMessage = rawDetail;
    }
  }

  // Construct context-sensitive title and summary
  let title = "Something went wrong";
  if (context === "auth") {
    title = "Sign-in error";
  } else if (context === "zone") {
    title = action === "create" ? "Couldn't create hosted zone" : action === "update" ? "Couldn't update hosted zone" : action === "delete" ? "Couldn't delete hosted zone" : "Couldn't load hosted zones";
  } else if (context === "record") {
    title = action === "create" ? "Couldn't create record" : action === "update" ? "Couldn't update record" : action === "delete" ? "Couldn't delete record" : "Couldn't load records";
  }

  if (!mainMessage) {
    if (Object.keys(fieldErrors).length > 0) {
      mainMessage = Object.values(fieldErrors)[0];
    } else {
      mainMessage = "Please check the values and try again.";
    }
  }

  return {
    title,
    message: mainMessage,
    fieldErrors,
    status,
  };
}
