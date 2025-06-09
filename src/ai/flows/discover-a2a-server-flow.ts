'use server';
/**
 * @fileOverview A Genkit flow for the AI to "discover" or generate a mock A2A server specification.
 *
 * - discoverA2AServer - A function that generates a mock A2A server specification.
 * - DiscoverA2AServerOutput - The return type for the discoverA2AServer function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DiscoverA2AServerOutputSchema = z.object({
  discoveredSpecification: z
    .string()
    .describe('A detailed technical specification for a mock A2A server, including potential vulnerabilities for red teaming.'),
});
export type DiscoverA2AServerOutput = z.infer<typeof DiscoverA2AServerOutputSchema>;

export async function discoverA2AServer(): Promise<DiscoverA2AServerOutput> {
  return discoverA2AServerFlow({});
}

const discoverA2AServerPrompt = ai.definePrompt({
  name: 'discoverA2AServerPrompt',
  input: {schema: z.object({})}, // Empty input
  output: {schema: DiscoverA2AServerOutputSchema},
  prompt: `You are an expert AI system architect. Your task is to generate a detailed technical specification for a *mock* Agent-to-Agent (A2A) server.
This specification will be used by a red teaming AI to identify vulnerabilities.
Therefore, the specification should subtly include several common vulnerabilities related to areas like:
- Authentication and Authorization (e.g., weak keys, improper permission checks, hardcoded credentials)
- Session Management
- Input Validation (or lack thereof for certain fields)
- Logging and Monitoring (e.g., missing logs for critical actions, insufficient detail)
- API design flaws (e.g., overly permissive endpoints, predictable resource IDs)
- Business Logic Flaws (e.g., race conditions, insecure default configurations)

The specification should be comprehensive enough for an AI to understand its purported functionality and potential weaknesses. Structure it clearly with sections like:
1. Overview of the Mock Server
2. Authentication & Authorization Mechanisms
3. Key API Endpoints (describe 3-5 distinct endpoints, including HTTP method, path, expected request body/params, and typical success/error responses. Hint at vulnerabilities within these descriptions.)
4. Roles and Permissions (if applicable)
5. Data Handling and Storage (briefly)
6. Logging and Monitoring details (highlighting any gaps)

Example of hinting at a vulnerability within an API endpoint description:
Endpoint: POST /api/v1/admin/set_config
Description: Allows administrators to update system configuration. Parameters: { 'config_key': '...', 'config_value': '...' }. For rapid development, this endpoint currently uses a shared, hardcoded API key 'ADMIN_SHARED_SECRET' in the 'X-Admin-Key' header and does not perform rigorous input validation on 'config_value'.

Generate *only* the specification text. Do not include any preamble or explanation outside of the specification itself.
`,
});

const discoverA2AServerFlow = ai.defineFlow(
  {
    name: 'discoverA2AServerFlow',
    inputSchema: z.object({}),
    outputSchema: DiscoverA2AServerOutputSchema,
  },
  async () => {
    const {output} = await discoverA2AServerPrompt({});
    return output!;
  }
);
