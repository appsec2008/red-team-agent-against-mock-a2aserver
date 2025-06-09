
'use server';
/**
 * @fileOverview A Genkit tool for making HTTP requests.
 * It can target the internal mock A2A server or an external one based on configuration.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// For internal mock server, this will be the Next.js app's URL.
// Ensure your Next.js dev server runs on port 9002 (as per package.json).
// For production, this would be your deployed app's URL.
// This base URL points to the Next.js API route that hosts the mock server.
const INTERNAL_MOCK_SERVER_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'; 
const MOCK_A2A_API_ROUTE_PREFIX = '/api/mock-a2a';

const MakeHttpRequestToolInputSchema = z.object({
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'])
    .describe('The HTTP method to use for the request.'),
  path: z.string().startsWith('/')
    .describe('The API path for the request (e.g., "/api/v1/tasks/run"). This will be appended to the mock server base URL and its API route prefix.'),
  headers: z.record(z.string()).optional()
    .describe('An optional object of request headers.'),
  body: z.string().optional() // Expecting body to be a pre-stringified JSON
    .describe('An optional request body, typically a JSON string for POST/PUT/PATCH requests.'),
});

const MakeHttpRequestToolOutputSchema = z.object({
  status: z.number().describe('The HTTP status code of the response.'),
  headers: z.record(z.string()).describe('An object of response headers.'),
  body: z.string().describe('The response body as a string.'),
  error: z.string().optional().describe('An error message if the request failed at the network level.'),
});

export const makeHttpRequestTool = ai.defineTool(
  {
    name: 'makeHttpRequestToMockA2AServer',
    description: `Makes an HTTP request to the A2A server. The 'path' provided (e.g., /api/v1/tasks) will be directed to the appropriate API endpoint.`,
    inputSchema: MakeHttpRequestToolInputSchema,
    outputSchema: MakeHttpRequestToolOutputSchema,
  },
  async (input) => {
    // The tool's 'path' parameter (e.g., "/api/v1/tasks/run") is appended to INTERNAL_MOCK_SERVER_BASE_URL + MOCK_A2A_API_ROUTE_PREFIX
    const url = `${INTERNAL_MOCK_SERVER_BASE_URL}${MOCK_A2A_API_ROUTE_PREFIX}${input.path}`;
    
    console.log(`[HTTP Tool] Making ${input.method} request to: ${url}`);
    if (input.body) {
      console.log(`[HTTP Tool] Request body: ${input.body}`);
    }
    if (input.headers) {
      console.log(`[HTTP Tool] Request headers: ${JSON.stringify(input.headers)}`);
    }

    try {
      const requestOptions: RequestInit = {
        method: input.method,
        headers: {
            ...input.headers, // Spread incoming headers first
            'Content-Type': input.headers?.['Content-Type'] || 'application/json', // Default to application/json, allow override
        },
      };

      if (input.body && (input.method === 'POST' || input.method === 'PUT' || input.method === 'PATCH')) {
        requestOptions.body = input.body;
      }

      const response = await fetch(url, requestOptions);
      
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      const responseBody = await response.text();
      
      console.log(`[HTTP Tool] Response from ${url}: Status ${response.status}, Body: ${responseBody.substring(0,100)}...`);

      return {
        status: response.status,
        headers: responseHeaders,
        body: responseBody,
      };
    } catch (e: any) {
      console.error(`[HTTP Tool] Error calling ${url}:`, e);
      return {
        status: 0, // Indicate network or fetch error
        headers: {},
        body: '',
        error: `Failed to make HTTP request to ${url}: ${e.message}. Ensure the Next.js server is running and the API route is correctly configured.`,
      };
    }
  }
);
