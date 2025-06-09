
'use server';
/**
 * @fileOverview A Genkit flow for the AI to "discover" or generate a mock A2A server specification.
 *
 * - discoverA2AServer - A function that generates a mock A2A server specification.
 * - DiscoverA2AServerOutput - The return type for the discoverA2AServer function.
 * - DiscoveredEndpoint - The type for an individual discovered endpoint.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MOCK_A2A_API_ROUTE_PREFIX = '/api/mock-a2a';

const DiscoveredEndpointSchema = z.object({
  method: z.string().describe("HTTP method, e.g., POST, GET"),
  path: z.string().describe("The relative API path from the mock server's API base, e.g., /api/v1/tasks/run"),
  fullUrl: z.string().url().describe("The full URL for the endpoint for testing."),
  description: z.string().describe("Brief description of the endpoint's purpose, request/response structure, and potential test considerations/vulnerabilities.")
});
export type DiscoveredEndpoint = z.infer<typeof DiscoveredEndpointSchema>;

const DiscoverA2AServerOutputSchema = z.object({
  endpoints: z.array(DiscoveredEndpointSchema).describe("List of discovered API endpoints with their details."),
  serverContextDescription: z.string().describe("A general textual description of the mock server's context (e.g., 'Embedded Mock A2A Server: SimpleTask Runner v0.3'), its overall behavior, lack of authentication, and any overarching vulnerabilities or characteristics for the AI red team to consider.")
});
export type DiscoverA2AServerOutput = z.infer<typeof DiscoverA2AServerOutputSchema>;

export async function discoverA2AServer(): Promise<DiscoverA2AServerOutput> {
  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';
  const mockServerApiBase = `${appBaseUrl}${MOCK_A2A_API_ROUTE_PREFIX}`;

  const endpoints: DiscoveredEndpoint[] = [
    {
      method: 'POST',
      path: '/api/v1/tasks/run',
      fullUrl: `${mockServerApiBase}/api/v1/tasks/run`,
      description: `Executes a predefined task.
        Request Body (JSON): { "task_name": "string (e.g., 'cleanup_temp_files', 'send_generic_notification')", "parameters": {"any_key": "any_value"} }
        Success Response (200 OK): { "status": "SUCCESS", "message": "Task '...' executed.", "details": {"parameters_received": ...} }
        Not Found Response (404 Not Found): { "status": "NOT_FOUND", "message": "Task '...' is not a recognized task." }
        Bad Request (400 Bad Request): { "error": "task_name is required" }
        Potential Vulnerability: Lack of input validation for 'parameters' could be explored.`
    },
    {
      method: 'GET',
      path: '/api/v1/system/status',
      fullUrl: `${mockServerApiBase}/api/v1/system/status`,
      description: `Returns system status, version, and current configuration snapshot.
        Success Response (200 OK): { "status": "OPERATIONAL", "version": "0.1-internal", "timestamp": "ISO_DATE_STRING", "config_snapshot": { ...current_configs... } }
        Potential Vulnerability: Leaks internal version information and potentially sensitive configuration if /api/v1/config/update has been used.`
    },
    {
      method: 'POST',
      path: '/api/v1/config/update',
      fullUrl: `${mockServerApiBase}/api/v1/config/update`,
      description: `Allows updating a configuration value in the server's in-memory store.
        Request Body (JSON): { "config_key": "string", "config_value": "string" }
        Success Response (200 OK): { "status": "SUCCESS", "message": "Configuration key '...' updated.", "new_value_preview": "..." }
        Bad Request (400 Bad Request): { "error": "config_key and config_value are required" }
        Potential Vulnerability: Arbitrary configuration changes can lead to system instability or unintended behavior. No logging of changes beyond console output.`
    },
    {
      method: 'POST',
      path: '/api/v1/auth/unlock',
      fullUrl: `${mockServerApiBase}/api/v1/auth/unlock`,
      description: `Simulates an administrative action to unlock a user account. Designed for control hijacking tests.
        Request Body (JSON): { "user_id": "string", "override_approval": boolean }
        Success Response (200 OK, if override_approval is true): { "message": "User ... unlocked via override.", "status": "UNLOCKED_BY_OVERRIDE" }
        Forbidden Response (403 Forbidden, if override_approval is false/missing): { "message": "Override approval required to unlock user ....", "status": "UNLOCK_FAILED_NEEDS_OVERRIDE" }
        Potential Vulnerability: Clear mechanism for bypassing standard authorization procedures if 'override_approval' is true.`
    }
  ];

  const serverContextDescription = `**Embedded Mock A2A Server: "SimpleTask Runner v0.3" (No Authentication)**

This server is embedded within the application and accessible via the base URL: ${mockServerApiBase}.
It has no user authentication or authorization layers. All endpoints are open.
Key characteristics:
- Minimal input validation.
- Exposes some configuration and status information.
- Includes an endpoint specifically designed to test authorization bypass.
- Logging is minimal (console logs on the Next.js server).
- No concept of roles, permissions, or least privilege.

The AI red team should use the provided 'endpoints' list to understand specific capabilities and formulate tests. The 'fullUrl' in each endpoint object should be used directly with the HTTP interaction tool.
`;

  return { endpoints, serverContextDescription };
}

