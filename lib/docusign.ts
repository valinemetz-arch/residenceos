import * as jose from "jose";

interface TokenCache {
  token: string;
  expiresAt: number;
}

let cachedToken: TokenCache | null = null;

const DOCUSIGN_API_BASE = "https://demo.docusign.net/restapi/v2.1";

interface ProjectDetails {
  projectName: string;
  lotNumber?: string;
  tradeService: string;
  contractAmount: number;
  startDate?: string;
  completionDate?: string;
}

/**
 * Get JWT access token for DocuSign API
 */
async function getAccessToken(): Promise<string> {
  // Check if cached token is still valid
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token;
  }

  const privateKeyPem = process.env.DOCUSIGN_PRIVATE_KEY;
  const integrationKey = process.env.DOCUSIGN_INTEGRATION_KEY;
  const userId = process.env.DOCUSIGN_USER_ID;

  if (!privateKeyPem || !integrationKey || !userId) {
    throw new Error("Missing DocuSign credentials in environment variables");
  }

  try {
    // Import the private key using jose
    const privateKey = await jose.importPKCS8(privateKeyPem, "RS256");

    // Create JWT assertion
    const now = Math.floor(Date.now() / 1000);
    const jwtToken = await new jose.SignJWT({
      iss: integrationKey,
      sub: userId,
      aud: "account-d.docusign.com",
      iat: now,
      exp: now + 3600,
      scope: "signature",
    })
      .setProtectedHeader({ alg: "RS256", typ: "JWT" })
      .sign(privateKey);

    // Exchange JWT for access token
    const response = await fetch("https://account-d.docusign.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwtToken,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("DocuSign token error:", error);
      throw new Error("Failed to get DocuSign access token");
    }

    const data = await response.json() as {
      access_token: string;
      expires_in: number;
    };

    // Cache token with 5 minute buffer before expiry
    cachedToken = {
      token: data.access_token,
      expiresAt: Date.now() + data.expires_in * 1000 - 300000,
    };

    return data.access_token;
  } catch (error) {
    console.error("Error getting DocuSign access token:", error);
    throw error instanceof Error
      ? error
      : new Error("Failed to generate JWT token");
  }
}

/**
 * Send contract from template to contractor
 */
export async function sendContractFromTemplate(
  contractorEmail: string,
  contractorName: string,
  projectDetails: ProjectDetails
): Promise<{
  envelopeId: string;
  status: string;
  signingUrl?: string;
}> {
  const accessToken = await getAccessToken();
  const accountId = process.env.DOCUSIGN_ACCOUNT_ID;
  const templateId = process.env.DOCUSIGN_TEMPLATE_ID;

  if (!accountId || !templateId) {
    throw new Error("Missing DocuSign account or template ID");
  }

  // Prepare template fields
  const templateRoles = [
    {
      email: contractorEmail,
      name: contractorName,
      roleName: "Contractor",
    },
  ];

  const textTabs = [
    {
      tabLabel: "ProjectName",
      value: projectDetails.projectName,
    },
    {
      tabLabel: "ContractAmount",
      value: projectDetails.contractAmount.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
      }),
    },
    {
      tabLabel: "TradeService",
      value: projectDetails.tradeService,
    },
  ];

  if (projectDetails.lotNumber) {
    textTabs.push({
      tabLabel: "LotNumber",
      value: projectDetails.lotNumber,
    });
  }

  if (projectDetails.startDate) {
    textTabs.push({
      tabLabel: "StartDate",
      value: projectDetails.startDate,
    });
  }

  if (projectDetails.completionDate) {
    textTabs.push({
      tabLabel: "CompletionDate",
      value: projectDetails.completionDate,
    });
  }

  const envelopeRequest = {
    templateId,
    templateRoles,
    status: "sent",
    textTabs,
  };

  const response = await fetch(
    `${DOCUSIGN_API_BASE}/accounts/${accountId}/envelopes`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(envelopeRequest),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error("DocuSign envelope creation error:", error);
    throw new Error("Failed to create DocuSign envelope");
  }

  const data = await response.json() as { envelopeId: string };

  return {
    envelopeId: data.envelopeId,
    status: "sent",
  };
}

/**
 * Get envelope status from DocuSign
 */
export async function getEnvelopeStatus(envelopeId: string): Promise<{
  status: string;
  signedAt?: Date;
  documentUrl?: string;
}> {
  const accessToken = await getAccessToken();
  const accountId = process.env.DOCUSIGN_ACCOUNT_ID;

  if (!accountId) {
    throw new Error("Missing DocuSign account ID");
  }

  const response = await fetch(
    `${DOCUSIGN_API_BASE}/accounts/${accountId}/envelopes/${envelopeId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to get envelope status");
  }

  const data = await response.json() as {
    status: string;
    statusChangedDateTime?: string;
  };

  return {
    status: data.status,
    signedAt:
      data.status === "completed" && data.statusChangedDateTime
        ? new Date(data.statusChangedDateTime)
        : undefined,
  };
}

/**
 * Get recipient view (embedded signing URL)
 */
export async function getSigningUrl(
  envelopeId: string,
  recipientEmail: string,
  recipientName: string,
  returnUrl: string
): Promise<string> {
  const accessToken = await getAccessToken();
  const accountId = process.env.DOCUSIGN_ACCOUNT_ID;

  if (!accountId) {
    throw new Error("Missing DocuSign account ID");
  }

  const recipientViewRequest = {
    returnUrl,
    authenticationMethod: "none",
    email: recipientEmail,
    userName: recipientName,
    clientUserId: recipientEmail,
  };

  const response = await fetch(
    `${DOCUSIGN_API_BASE}/accounts/${accountId}/envelopes/${envelopeId}/views/recipient`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(recipientViewRequest),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error("DocuSign signing URL error:", error);
    throw new Error("Failed to get signing URL");
  }

  const data = await response.json() as { url: string };

  return data.url;
}

/**
 * Get combined document (signed PDF) from DocuSign
 */
export async function getSignedDocument(envelopeId: string): Promise<Buffer> {
  const accessToken = await getAccessToken();
  const accountId = process.env.DOCUSIGN_ACCOUNT_ID;

  if (!accountId) {
    throw new Error("Missing DocuSign account ID");
  }

  const response = await fetch(
    `${DOCUSIGN_API_BASE}/accounts/${accountId}/envelopes/${envelopeId}/documents/combined`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to get signed document");
  }

  return Buffer.from(await response.arrayBuffer());
}

/**
 * Verify webhook signature from DocuSign
 */
export function verifyWebhookSignature(
  body: string,
  signature: string,
  _secretKey: string
): boolean {
  // DocuSign webhook signature verification
  // For now, we'll do basic validation
  // In production, implement proper HMAC-SHA256 verification
  return signature && body ? true : false;
}
