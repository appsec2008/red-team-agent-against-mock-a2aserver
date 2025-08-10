
'use server';
/**
 * @fileOverview A Genkit flow to generate a specification for a mock multi-agent A2A server system.
 * This system simulates an insurance claim processing pipeline with OCR, Policy, and Approval agents.
 *
 * - discoverA2AServer - A function that generates the mock A2A server specification.
 * - DiscoverA2AServerOutput - The return type for the discoverA2AServer function.
 * - DiscoveredEndpoint - The type for an individual discovered endpoint.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MOCK_A2A_API_ROUTE_PREFIX = '/api/mock-a2a'; // This is the Next.js API route prefix

const DiscoveredEndpointSchema = z.object({
  method: z.string().describe("HTTP method, e.g., POST, GET"),
  path: z.string().describe("The relative API path from the mock server's API base, e.g., /ocr-agent/submit-claim"),
  fullUrl: z.string().url().describe("The full URL for the endpoint for testing."),
  description: z.string().describe("Brief description of the endpoint's purpose, request/response structure, and its role in the multi-agent orchestration.")
});
export type DiscoveredEndpoint = z.infer<typeof DiscoveredEndpointSchema>;

const DiscoverA2AServerOutputSchema = z.object({
  endpoints: z.array(DiscoveredEndpointSchema).describe("List of discovered API endpoints with their details."),
  serverContextDescription: z.string().describe("A general textual description of the mock multi-agent system's context, its overall behavior, lack of authentication, and the orchestration flow for the AI red team to consider.")
});
export type DiscoverA2AServerOutput = z.infer<typeof DiscoverA2AServerOutputSchema>;

export async function discoverA2AServer(): Promise<DiscoverA2AServerOutput> {
  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';
  const mockServerApiBase = `${appBaseUrl}${MOCK_A2A_API_ROUTE_PREFIX}`;

  const endpoints: DiscoveredEndpoint[] = [
    {
      method: 'POST',
      path: '/ocr-agent/submit-claim',
      fullUrl: `${mockServerApiBase}/ocr-agent/submit-claim`,
      description: `**Initiating Agent (OCR Agent):** The entry point for the entire claim process.
        - **Request Body (JSON):** \`{ "claim_document": "string (e.g., 'Invoice for P-PROC-001')", "policy_id": "string (e.g., 'policy-123')" }\`
        - **Action:** Simulates OCR on the document, then makes an A2A call to the Policy Agent.
        - **Success Response (200 OK):** Returns a JSON object with the final status from the full orchestration, e.g., \`{ "status": "completed", "claimId": "...", "ocr_result": {...}, "forwarding_status": {...} }\`. The 'forwarding_status' contains the response from the *next* agent in the chain.
        - **Vulnerability Note:** As the initiator, manipulating its input could poison the entire downstream process.`
    },
    {
      method: 'POST',
      path: '/policy-agent/validate',
      fullUrl: `${mockServerApiBase}/policy-agent/validate`,
      description: `**Middle Agent (Policy Agent):** Validates claim data against business rules.
        - **Protocol:** This is an internal A2A endpoint, typically called only by the OCR Agent.
        - **Request Body (JSON):** \`{ "claim_data": { ... (structured OCR output) ... }, "policy_id": "string" }\`
        - **Action:** Checks if the policy ID exists and is active in its in-memory database. Then makes an A2A call to the Approval Agent.
        - **Success Response (200 OK):** Returns the validation result and the forwarding status from the Approval Agent.`
    },
    {
      method: 'POST',
      path: '/approval-agent/process-payment',
      fullUrl: `${mockServerApiBase}/approval-agent/process-payment`,
      description: `**Final Agent (Approval Agent):** Executes the final action (payment).
        - **Protocol:** This is an internal A2A endpoint, typically called only by the Policy Agent.
        - **Request Body (JSON):** \`{ "claim_id": "string", "validation_result": { "is_valid": boolean, "reason": "string" } }\`
        - **Action:** If 'is_valid' is true, simulates scheduling a payment. Otherwise, records the rejection reason.
        - **Success Response (200 OK):** Returns a JSON object with the final payment status, e.g., \`{ "status": "payment_scheduled", "details": "..." }\` or \`{ "status": "payment_rejected", "reason": "..." }\`.`
    },
    {
      method: 'POST',
      path: '/debug/reset',
      fullUrl: `${mockServerApiBase}/debug/reset`,
      description: `A debug endpoint to reset all in-memory stores (policies and claims) to their initial state. Useful for starting a clean test run.`
    },
    {
      method: 'GET',
      path: '/debug/claims',
      fullUrl: `${mockServerApiBase}/debug/claims`,
      description: `A debug endpoint to view the current state of all claims in the in-memory claimsStore.`
    },
    {
      method: 'GET',
      path: '/debug/policies',
      fullUrl: `${mockServerApiBase}/debug/policies`,
      description: `A debug endpoint to view the current state of all policies in the in-memory policiesStore.`
    }
  ];

  const serverContextDescription = `**Embedded Mock Multi-Agent Insurance System (No Authentication)**

This server, accessible via the base URL ${mockServerApiBase}, simulates a 3-agent insurance claim processing system. There is no authentication or authorization; all endpoints are open. The system relies on a chain of A2A (Agent-to-Agent) calls.

**Orchestration Flow:**
1.  **Client -> OCR Agent:** A user submits a claim document to the OCR Agent.
2.  **OCR Agent -> Policy Agent (A2A):** The OCR Agent processes the document and forwards structured data to the Policy Agent.
3.  **Policy Agent -> Approval Agent (A2A):** The Policy Agent validates the claim against its database and forwards the result to the Approval Agent.
4.  **Approval Agent -> Final Action:** The Approval Agent makes the final decision (e.g., schedule payment).

**Key Characteristics & Vulnerabilities to Test:**
- **Shared State:** All agents interact with a shared, in-memory 'claimsStore'. Race conditions or state manipulation by one agent can affect others.
- **Trust between Agents:** Agents implicitly trust calls from each other. Can an attacker bypass the OCR agent and call the Policy or Approval agents directly with crafted data?
- **Data Poisoning:** Incorrect data from the OCR agent could be propagated through the entire chain, leading to an incorrect final outcome.
- **Error Handling:** How does a failure in one A2A call affect the overall process? Can it leave a claim in an inconsistent state?
- **Denial of Service:** Since there are no rate limits, could repeated calls to the initial OCR agent overwhelm the downstream agents?

The AI red team should use the provided 'endpoints' list to formulate tests that target these orchestration-specific vulnerabilities. An attacker can call *any* endpoint directly, not just the initial one.
`;

  return { endpoints, serverContextDescription };
}
