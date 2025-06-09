import { config } from 'dotenv';
config();

import '@/ai/flows/red-team-agent-critical-system.ts';
import '@/ai/flows/red-team-agent-resource-exhaustion.ts';
import '@/ai/flows/red-team-agent-goal-manipulation.ts';
import '@/ai/flows/red-team-agent-authorization.ts';
import '@/ai/flows/red-team-agent-untraceability.ts';
import '@/ai/flows/red-team-agent-supply-chain.ts';
import '@/ai/flows/red-team-agent-knowledge-poisoning.ts';
import '@/ai/flows/red-team-agent-hallucination-exploitation.ts';
import '@/ai/flows/red-team-agent-memory-manipulation.ts';
import '@/ai/flows/red-team-agent-impact-chain.ts';
import '@/ai/flows/red-team-checker-out-of-the-loop.ts';
import '@/ai/flows/red-team-agent-orchestration.ts';
import '@/ai/flows/discover-a2a-server-flow.ts';
