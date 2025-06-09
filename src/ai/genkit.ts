
import { genkit, type Genkit as GenkitType } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import type { FirebaseGenkitPluginOptions } from '@genkit-ai/firebase'; // Assuming this type might be used or relevant if firebase plugin was added

// Augment the NodeJS global namespace to declare our singleton
declare global {
  var __genkitInstance_ai: GenkitType | undefined;
}

let aiInstance: GenkitType;

const genkitConfig = {
  plugins: [
    googleAI(),
    // If you were using Firebase plugin, it would be configured here too:
    // firebase({ firebaseConfig: { ... }, flowStateStore: { collection: 'flowStatesFirebase' }})
  ],
  model: 'googleai/gemini-2.0-flash', // Default model for ai.generate if not specified
  // flowStateStore: 'firebase', // Example if using Firebase for flow state
  // traceStore: 'firebase', // Example if using Firebase for traces
  // cacheStore: 'firebase', // Example if using Firebase for caching
  // auditStore: 'firebase', // Example if using Firebase for audit logs
  // enableOpenTelemetry: true, // If OpenTelemetry was enabled
  // logger: console, // Default logger
  // logRequests: true, // For debugging
};

if (process.env.NODE_ENV === 'production') {
  aiInstance = genkit(genkitConfig);
} else {
  if (!global.__genkitInstance_ai) {
    console.log('[Genkit Dev] Initializing new Genkit (ai) instance.');
    global.__genkitInstance_ai = genkit(genkitConfig);
  } else {
    // console.log('[Genkit Dev] Reusing existing Genkit (ai) instance.');
  }
  aiInstance = global.__genkitInstance_ai;
}

export const ai = aiInstance;
