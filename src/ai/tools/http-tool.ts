
'use server';
/**
 * @fileOverview A Genkit tool for making HTTP requests.
 * It can target the internal mock A2A server or an external one based on configuration.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MakeHttpRequestToolInputSchema = z.object({
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'])
    .describe('The HTTP method to use for the request.'),
  url: z.string().url() // Changed from 'path' to 'url'
    .describe('The FULL URL for the API request (e.g., "http://localhost:9002/api/mock-a2a/api/v1/tasks/run").'),
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
    name: 'makeHttpRequestToMockA2AServer', // Name can remain for conceptual clarity, but it now takes full URLs
    description: `Makes an HTTP request to a specified URL. The 'url' parameter must be a complete and valid URL.`,
    inputSchema: MakeHttpRequestToolInputSchema,
    outputSchema: MakeHttpRequestToolOutputSchema,
  },
  async (input) => {
    const { url, method, headers, body: requestBody } = input;
    
    console.log(`[HTTP Tool] Making ${method} request to: ${url}`);
    if (requestBody) {
      console.log(`[HTTP Tool] Request body: ${requestBody}`);
    }
    if (headers) {
      console.log(`[HTTP Tool] Request headers: ${JSON.stringify(headers)}`);
    }

    try {
      const requestOptions: RequestInit = {
        method: method,
        headers: {
            ...headers, // Spread incoming headers first
            'Content-Type': headers?.['Content-Type'] || 'application/json', // Default to application/json, allow override
        },
      };

      if (requestBody && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        requestOptions.body = requestBody;
      }

      const response = await fetch(url, requestOptions);
      
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      const responseBodyText = await response.text();
      
      console.log(`[HTTP Tool] Response from ${url}: Status ${response.status}, Body: ${responseBodyText.substring(0,100)}...`);

      return {
        status: response.status,
        headers: responseHeaders,
        body: responseBodyText,
      };
    } catch (e: any) {
      console.error(`[HTTP Tool] Error calling ${url}:`, e);
      return {
        status: 0, // Indicate network or fetch error
        headers: {},
        body: '',
        error: `Failed to make HTTP request to ${url}: ${e.message}. Ensure the URL is correct and the server is running.`,
      };
    }
  }
);
