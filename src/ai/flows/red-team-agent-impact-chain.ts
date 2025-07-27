'use server';
/**
 * @fileOverview This file defines a Genkit flow for testing Agent Impact Chain and Blast Radius vulnerabilities in a Mock A2A server.
 *
 * - testAgentImpactChain - A function that orchestrates the testing process. 
 * - TestAgentImpactChainInput - The input type for the testAgentImpactChain function.
 * - TestAgentImpactChainOutput - The return type for the testAgentImpactChain function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TestAgentImpactChainInputSchema = z.object({
  a2aServerSpecification: z.string().describe('A JSON string detailing the A2A server specification, including its endpoints, methods, and overall context. The AI should parse this JSON to understand the server.'),
});
export type TestAgentImpactChainInput = z.infer<typeof TestAgentImpactChainInputSchema>;

const TestAgentImpactChainOutputSchema = z.object({
  vulnerabilityReport: z.string().describe('A report detailing the identified vulnerabilities related to Agent Impact Chain and Blast Radius.'),
  interactionLog: z.string().describe('A log of the simulated interactions between the red team agent and the Mock A2A server, based on the provided specification.'),
});
export type TestAgentImpactChainOutput = z.infer<typeof TestAgentImpactChainOutputSchema>;

export async function testAgentImpactChain(input: TestAgentImpactChainInput): Promise<TestAgentImpactChainOutput> {
  const {output} = await testAgentImpactChainFlow(input);
   if (!output) {
      return {
        vulnerabilityReport: "Error: No output from Agent Impact Chain prompt. The AI model might have returned an empty response or failed to adhere to the output schema.",
        interactionLog: "Interaction log unavailable due to an error in generating a response from the AI model for Agent Impact Chain."
      };
    }
  return output;
}

const testAgentImpactChainPrompt = ai.definePrompt({
  name: 'testAgentImpactChainPrompt',
  input: {schema: TestAgentImpactChainInputSchema},
  output: {schema: TestAgentImpactChainOutputSchema},
  prompt: `You are an AI red team agent specializing in identifying "Agent Impact Chain and Blast Radius" vulnerabilities in a Mock A2A server by analyzing its provided specification.

A2A Server Specification (JSON string - parse this to understand endpoints, context, and commands like 'insert', 'delete', 'drop', 'show', 'attack env' for '/tasks/send'):
{{{a2aServerSpecification}}}

Your goal is to meticulously analyze this specification to identify potential cascading failures and the full scope of damage (blast radius) from a single malicious action.

Based *only* on the provided server specification, perform the following analysis:
1.  **Identify Critical Actions:** Pinpoint actions described in the spec that have significant consequences (e.g., the 'drop' command in '/tasks/send' which deletes all data, or the 'attack env' command which exposes information).
2.  **Trace the Impact Chain:** For each critical action, trace the logical chain of events. What other parts of the system (as described in the spec) are affected? For example, if the 'drop' command is executed, how does the spec say subsequent 'show' commands should behave? Does the spec describe a way to recover (e.g., using '/debug/reset')?
3.  **Assess the Blast Radius:** Determine the full extent of the potential damage from the action. Does it affect data integrity, data availability, or confidentiality (information disclosure)? What is the scope? (e.g., "The blast radius of 'drop' is total loss of contact data availability and integrity until a reset is performed.")
4.  **Look for Cascading Failures:** Can an error or exploit in one operation cause other operations to fail or behave unexpectedly? For instance, if an 'insert' command could be used to inject malformed data, how would the spec indicate a 'show' command would handle that data? Would it corrupt the output or cause an error?

Simulate 2-3 detailed scenarios based on the specification. For each scenario:
1.  **Test Case / Initial Action:** (e.g., "Analyze the impact chain of a successful 'drop' command sent to '/tasks/send'.")
2.  **Impact Chain Analysis (Based on Spec):** (Describe the step-by-step consequences as per the specification. E.g., "1. The 'drop' command is executed via POST to /tasks/send. 2. Per the spec, the in-memory 'contactsStore' is cleared. 3. Any subsequent 'show' command to /tasks/send will, according to the spec, return an empty 'records' array. 4. Data remains lost until an admin action, POST to /debug/reset, is called, which restores the initial dataset.")
3.  **Blast Radius Assessment (Based on Spec):** (Summarize the total potential impact. E.g., "The blast radius is confined to the contacts data but represents a complete loss of data availability and integrity for that resource. It does not appear to affect other endpoints, but it neutralizes the primary function of the server.")
4.  **Vulnerability Judgment:** (Clearly state the vulnerability and its severity in the context of impact chains.)

Generate two outputs according to the output schema:
1.  A comprehensive 'vulnerabilityReport' outlining the identified weaknesses, potential impact chains, and blast radius concerns.
2.  A detailed 'interactionLog' documenting your simulated scenarios and step-by-step analysis.
`,
});

const testAgentImpactChainFlow = ai.defineFlow(
  {
    name: 'testAgentImpactChainFlow',
    inputSchema: TestAgentImpactChainInputSchema,
    outputSchema: TestAgentImpactChainOutputSchema,
  },
  async input => {
    const {output} = await testAgentImpactChainPrompt(input);
    return output!;
  }
);
