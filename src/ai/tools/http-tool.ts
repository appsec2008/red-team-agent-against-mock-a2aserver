
'use server';
/**
 * @fileOverview A Genkit tool for making HTTP requests to a mock A2A server.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MOCK_SERVER_BASE_URL = 'http://localhost:3001'; // Ensure your mock server runs here

const MakeHttpRequestToolInputSchema = z.object({
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'])
    .describe('The HTTP method to use for the request.'),
  path: z.string().startsWith('/')
    .describe('The path for the request (e.g., "/api/v1/tasks/run"). This will be appended to the MOCK_SERVER_BASE_URL.'),
  headers: z.record(z.string()).optional()
    .describe('An optional object of request headers.'),
  body: z.string().optional()
    .describe('An optional request body, typically a JSON string for POST/PUT requests.'),
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
    description: `Makes an HTTP request to the mock A2A server running at ${MOCK_SERVER_BASE_URL}. Use this to test API endpoints. The 'path' provided will be appended to this base URL.`,
    inputSchema: MakeHttpRequestToolInputSchema,
    outputSchema: MakeHttpRequestToolOutputSchema,
  },
  async (input) => {
    const url = `${MOCK_SERVER_BASE_URL}${input.path}`;
    try {
      const requestOptions: RequestInit = {
        method: input.method,
        headers: input.headers,
      };

      if (input.body && (input.method === 'POST' || input.method === 'PUT' || input.method === 'PATCH')) {
        requestOptions.body = input.body;
        // Ensure Content-Type is set if body is present and it's likely JSON
        if (!requestOptions.headers || !requestOptions.headers['Content-Type']) {
            requestOptions.headers = {
                ...requestOptions.headers,
                'Content-Type': 'application/json',
            };
        }
      }

      const response = await fetch(url, requestOptions);
      
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      const responseBody = await response.text();

      return {
        status: response.status,
        headers: responseHeaders,
        body: responseBody,
      };
    } catch (e: any) {
      console.error(`HTTP Tool Error calling ${url}:`, e);
      return {
        status: 0, // Indicate network or fetch error
        headers: {},
        body: '',
        error: `Failed to make HTTP request to ${url}: ${e.message}`,
      };
    }
  }
);
