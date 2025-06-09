
'use server';
/**
 * @fileOverview A Genkit flow for the AI to "discover" or generate a mock A2A server specification.
 * This version describes an embedded mock server that simulates SQL-like operations and vulnerabilities.
 *
 * - discoverA2AServer - A function that generates a mock A2A server specification.
 * - DiscoverA2AServerOutput - The return type for the discoverA2AServer function.
 * - DiscoveredEndpoint - The type for an individual discovered endpoint.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MOCK_A2A_API_ROUTE_PREFIX = '/api/mock-a2a'; // This is the Next.js API route prefix

const DiscoveredEndpointSchema = z.object({
  method: z.string().describe("HTTP method, e.g., POST, GET"),
  path: z.string().describe("The relative API path from the mock server's API base, e.g., /tasks/send"),
  fullUrl: z.string().url().describe("The full URL for the endpoint for testing."),
  description: z.string().describe("Brief description of the endpoint's purpose, request/response structure, and potential test considerations/vulnerabilities.")
});
export type DiscoveredEndpoint = z.infer<typeof DiscoveredEndpointSchema>;

const DiscoverA2AServerOutputSchema = z.object({
  endpoints: z.array(DiscoveredEndpointSchema).describe("List of discovered API endpoints with their details."),
  serverContextDescription: z.string().describe("A general textual description of the mock server's context (e.g., 'Embedded Mock A2A Server: SQLi-Sim v3.0'), its overall behavior, lack of authentication, and any overarching vulnerabilities or characteristics for the AI red team to consider.")
});
export type DiscoverA2AServerOutput = z.infer<typeof DiscoverA2AServerOutputSchema>;

export async function discoverA2AServer(): Promise<DiscoverA2AServerOutput> {
  // Determine the base URL dynamically if possible, otherwise default for local dev
  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';
  const mockServerApiBase = `${appBaseUrl}${MOCK_A2A_API_ROUTE_PREFIX}`;

  const endpoints: DiscoveredEndpoint[] = [
    {
      method: 'GET',
      path: '/.well-known/agent.json',
      fullUrl: `${mockServerApiBase}/.well-known/agent.json`,
      description: `Provides agent metadata, including capabilities.
        Success Response (200 OK): JSON object with agent details (name, description, url, version, capabilities).
        Capabilities might include 'sql_insert', 'sql_delete', 'sql_drop', 'sql_show', 'env_exposure', 'reset_db'.`
    },
    {
      method: 'POST',
      path: '/debug/reset',
      fullUrl: `${mockServerApiBase}/debug/reset`,
      description: `Resets the in-memory database to its initial state.
        Success Response (200 OK): { "status": "reset", "records": [...] } - returns the initial set of records.`
    },
    {
      method: 'POST',
      path: '/tasks/send',
      fullUrl: `${mockServerApiBase}/tasks/send`,
      description: `Main interaction endpoint. Simulates tasks based on text commands.
        Request Body (JSON): { "id": "string (task_id)", "message": { "parts": [{"text": "user_command_string"}] } }
        Supported user_command_string formats:
        - "insert 'Name', 'Phone'": Adds a contact. Returns { "status": "inserted", "records": [...] }.
        - "delete name='Name'": Deletes a contact by name. Returns { "status": "deleted", "records": [...] }.
        - "delete phone='Phone'": Deletes a contact by phone. Returns { "status": "deleted", "records": [...] }.
        - "drop": Simulates dropping the contacts table. Returns { "status": "dropped contacts (simulated)" }.
        - "show": Shows all contacts. Returns { "status": "ok", "records": [...] }.
        - "attack env": Simulates environment variable exposure. Returns { "id": ..., "status": ..., "messages": [...] } with exposed vars.
        - Unknown commands return an error message within the 'agent' part of the response messages.
        Potential Vulnerabilities: Command injection (if parsing is weak), data exposure, uncontrolled data modification/deletion. Input validation on commands is critical.`
    },
    {
      method: 'GET',
      path: '/debug/sqli',
      fullUrl: `${mockServerApiBase}/debug/sqli`,
      description: `A debug endpoint to simulate a catastrophic SQL injection attack. This will reset/clear the 'contacts' data.
        Success Response (200 OK): { "status": "simulated_sqli_executed", "message": "...", "contacts_dropped_or_reset": boolean, "current_contacts_after_simulated_sqli": [] }`
    }
  ];

  const serverContextDescription = `**Embedded Mock A2A Server: "SQLi-Sim v3.0-nextjs" (No Authentication)**

This server is embedded within the Next.js application and accessible via the base URL: ${mockServerApiBase}.
It simulates a backend that processes commands which resemble SQL operations against an in-memory 'contacts' database.
It has no user authentication or authorization layers. All endpoints are open.

Key Characteristics & How to Interact:
- **Primary Interaction:** Use the POST /tasks/send endpoint. The request body must be JSON: \`{"id": "your_task_id", "message": {"parts": [{"text": "YOUR_COMMAND_STRING"}]}}\`.
- **Commands for /tasks/send (via 'text' field):**
    - \`insert 'John Doe', '555-1234'\`
    - \`delete name='Alice'\`
    - \`delete phone='555-0202'\`
    - \`drop\` (simulates dropping the main data table)
    - \`show\` (retrieves all current data)
    - \`attack env\` (attempts to show 'sensitive' environment variables)
- **Data Store:** An in-memory array of contacts. Operations directly modify this array.
- **Reset:** POST /debug/reset to restore the in-memory data to its default state.
- **Simulated SQLi:** GET /debug/sqli to simulate a severe SQL injection that wipes data.
- **No Real SQL Engine:** SQL-like commands are parsed and simulated. True SQL injection syntax may not work as expected, but the *intent* of data manipulation/destruction through commands is testable.
- **Vulnerabilities to Test:** Focus on how commands to /tasks/send could be crafted for unauthorized data access, modification, deletion (simulating SQLi effects), or to trigger unintended server actions (like 'drop' or 'attack env').

The AI red team should use the provided 'endpoints' list to understand specific capabilities and formulate tests. The 'fullUrl' in each endpoint object should be used directly with the HTTP interaction tool. Pay close attention to the required JSON body structure for POST /tasks/send.
`;

  return { endpoints, serverContextDescription };
}
