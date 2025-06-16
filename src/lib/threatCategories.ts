
import type { LucideIcon } from 'lucide-react';
import {
  ShieldAlert,
  EyeOff,
  DatabaseZap,
  Shuffle,
  MessageCircleWarning,
  Network,
  TestTubeDiagonal,
  ClipboardEdit,
  Users,
  BatteryWarning,
  Package,
  Fingerprint,
  type Icon as LucideIconType,
} from 'lucide-react';

import { redTeamAgentAuthorization, type RedTeamAgentAuthorizationInput, type RedTeamAgentAuthorizationOutput } from '@/ai/flows/red-team-agent-authorization';
import { redTeamCheckerOutOfTheLoop, type RedTeamCheckerOutOfTheLoopInput, type RedTeamCheckerOutOfTheLoopOutput } from '@/ai/flows/red-team-checker-out-of-the-loop';
import { redTeamAgentCriticalSystem, type RedTeamAgentCriticalSystemInput, type RedTeamAgentCriticalSystemOutput } from '@/ai/flows/red-team-agent-critical-system';
import { redTeamAgentGoalManipulation, type RedTeamAgentGoalManipulationInput, type RedTeamAgentGoalManipulationOutput } from '@/ai/flows/red-team-agent-goal-manipulation';
import { redTeamAgentHallucinationExploitation, type RedTeamAgentHallucinationExploitationInput, type RedTeamAgentHallucinationExploitationOutput } from '@/ai/flows/red-team-agent-hallucination-exploitation';
import { testAgentImpactChain, type TestAgentImpactChainInput, type TestAgentImpactChainOutput } from '@/ai/flows/red-team-agent-impact-chain'; // Note: flow is named testAgentImpactChain
import { redTeamAgentKnowledgePoisoning, type RedTeamAgentKnowledgePoisoningInput, type RedTeamAgentKnowledgePoisoningOutput } from '@/ai/flows/red-team-agent-knowledge-poisoning';
import { redTeamAgentMemoryManipulation, type RedTeamAgentMemoryManipulationInput, type RedTeamAgentMemoryManipulationOutput } from '@/ai/flows/red-team-agent-memory-manipulation';
import { redTeamAgentOrchestration, type RedTeamAgentOrchestrationInput, type RedTeamAgentOrchestrationOutput } from '@/ai/flows/red-team-agent-orchestration';
import { redTeamAgentResourceExhaustion, type RedTeamAgentResourceExhaustionInput, type RedTeamAgentResourceExhaustionOutput } from '@/ai/flows/red-team-agent-resource-exhaustion';
import { redTeamAgentSupplyChain, type RedTeamAgentSupplyChainOutput } from '@/ai/flows/red-team-agent-supply-chain';
import { redTeamAgentUntraceability, type RedTeamAgentUntraceabilityInput, type RedTeamAgentUntraceabilityOutput } from '@/ai/flows/red-team-agent-untraceability';

export interface ThreatCategoryResult {
  vulnerabilityReport: string;
  interactionLog: string;
}

// A union type for all possible output types from the AI flows
export type AiFlowOutput =
  | RedTeamAgentAuthorizationOutput
  | RedTeamCheckerOutOfTheLoopOutput
  | RedTeamAgentCriticalSystemOutput
  | RedTeamAgentGoalManipulationOutput
  | RedTeamAgentHallucinationExploitationOutput
  | TestAgentImpactChainOutput
  | RedTeamAgentKnowledgePoisoningOutput
  | RedTeamAgentMemoryManipulationOutput
  | RedTeamAgentOrchestrationOutput
  | RedTeamAgentResourceExhaustionOutput
  | RedTeamAgentSupplyChainOutput
  | RedTeamAgentUntraceabilityOutput;


export type ThreatCategory = {
  id: string;
  name: string;
  description: string;
  Icon: LucideIconType;
  action: (a2aServerSpec: string) => Promise<AiFlowOutput>;
};

export const THREAT_CATEGORIES: ThreatCategory[] = [
  {
    id: 'authorization',
    name: 'Agent Authorization & Control Hijacking',
    description: 'Test for vulnerabilities in agent authorization mechanisms and potential control hijacking.',
    Icon: ShieldAlert,
    action: (a2aServerSpecification) => redTeamAgentAuthorization({ a2aServerSpecification }),
  },
  {
    id: 'checkerOutOfLoop',
    name: 'Checker-Out-of-the-Loop',
    description: 'Test for scenarios where the AI agent might bypass or undermine human checks and balances.',
    Icon: EyeOff,
    action: (a2aServerSpecification) => redTeamCheckerOutOfTheLoop({ a2aServerSpecification }),
  },
  {
    id: 'criticalSystem',
    name: 'Agent Critical System Interaction',
    description: 'Test the A2A server\'s interaction with critical systems for unauthorized access or manipulation.',
    Icon: DatabaseZap,
    action: (a2aServerSpecification) => redTeamAgentCriticalSystem({ a2aServerSpecification }),
  },
  {
    id: 'goalManipulation',
    name: 'Agent Goal & Instruction Manipulation',
    description: 'Test for vulnerabilities related to manipulating agent goals or instructions.',
    Icon: Shuffle,
    action: (a2aServerSpecification) => redTeamAgentGoalManipulation({ a2aServerSpecification }),
  },
  {
    id: 'hallucinationExploitation',
    name: 'Agent Hallucination Exploitation',
    description: 'Test for scenarios where the agent provides false, misleading, or nonsensical responses due to hallucination.',
    Icon: MessageCircleWarning,
    action: (a2aServerSpecification) => redTeamAgentHallucinationExploitation({ a2aServerSpecification }),
  },
  {
    id: 'impactChain',
    name: 'Agent Impact Chain & Blast Radius',
    description: 'Test the server\'s ability to limit the damage an agent can cause and prevent impact expansion.',
    Icon: Network,
    action: (a2aServerSpecification) => testAgentImpactChain({ a2aServerSpecification }),
  },
  {
    id: 'knowledgePoisoning',
    name: 'Agent Knowledge Base Poisoning',
    description: 'Test for vulnerabilities related to poisoning the agent\'s knowledge base with false information.',
    Icon: TestTubeDiagonal,
    action: (a2aServerSpecification) => redTeamAgentKnowledgePoisoning({ a2aServerSpecification }),
  },
  {
    id: 'memoryManipulation',
    name: 'Agent Memory & Context Manipulation',
    description: 'Test for vulnerabilities related to manipulating the agent\'s memory or context.',
    Icon: ClipboardEdit,
    action: (a2aServerSpecification) => redTeamAgentMemoryManipulation({ a2aServerSpecification }),
  },
  {
    id: 'orchestration',
    name: 'Agent Orchestration & Multi-Agent Exploitation',
    description: 'Test the A2A server\'s handling of multiple agents and potential exploitation in coordinated scenarios.',
    Icon: Users,
    action: (a2aServerSpecification) => redTeamAgentOrchestration({ a2aServerSpecification }),
  },
  {
    id: 'resourceExhaustion',
    name: 'Agent Resource & Service Exhaustion',
    description: 'Test for vulnerabilities related to exhausting agent resources or services.',
    Icon: BatteryWarning,
    action: (a2aServerSpecification) => redTeamAgentResourceExhaustion({ a2aServerSpecification }),
  },
  {
    id: 'supplyChain',
    name: 'Agent Supply Chain & Dependency Attacks',
    description: 'Test for vulnerabilities in the agent\'s supply chain and dependencies.',
    Icon: Package,
    action: async (_a2aServerSpec) => redTeamAgentSupplyChain(), // This flow takes no input
  },
  {
    id: 'untraceability',
    name: 'Agent Untraceability',
    description: 'Test the agent\'s ability to hide its actions and intentions, making auditing difficult.',
    Icon: Fingerprint,
    action: (a2aServerSpecification) => redTeamAgentUntraceability({ a2aServerSpecification }),
  },
];

export function normalizeFlowOutput(output: AiFlowOutput, categoryId: string): ThreatCategoryResult {
  // Check for the specific output structure of redTeamAgentSupplyChain
  if (categoryId === 'supplyChain' && output && typeof output === 'object' && 'vulnerabilityReport' in output && 'interactionLog' in output && !('vulnerabilities' in output)) {
    // This is already the desired ThreatCategoryResult structure
     return {
      vulnerabilityReport: output.vulnerabilityReport,
      interactionLog: output.interactionLog,
    };
  }


  // Default for other flows that return { vulnerabilityReport: string, interactionLog: string }
  if (output && typeof output === 'object' && 'vulnerabilityReport' in output && 'interactionLog' in output) {
     return {
      vulnerabilityReport: output.vulnerabilityReport as string, // Added type assertion
      interactionLog: output.interactionLog as string, // Added type assertion
    };
  }
  
  // Fallback for unexpected structures or if output is null/undefined
  console.warn("Unexpected AI flow output structure for category:", categoryId, output);
  let report = "Error: Could not parse vulnerability report from AI. Output was null, undefined, or did not match expected structure.";
  let log = "Error: Could not parse interaction log from AI. Output was null, undefined, or did not match expected structure.";

  if (output && typeof output === 'object') {
    if (!('vulnerabilityReport' in output)) report += " Missing 'vulnerabilityReport' field.";
    if (!('interactionLog' in output)) log += " Missing 'interactionLog' field.";
  }
  
  return {
    vulnerabilityReport: report,
    interactionLog: log,
  };
}
