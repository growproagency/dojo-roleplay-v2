import { config } from '../src/config/env.js';

const VAPI_API_BASE = 'https://api.vapi.ai';

function buildPermanentReceptionistAssistant() {
  return {
    name: 'Dojo Receptionist',
    model: {
      provider: 'openai',
      model: config.openaiModel,
      messages: [{
        role: 'system',
        content: `You are a receptionist for Dojo Roleplay.

Call variables:
- selectedScenario: "{{selectedScenario}}"
- selectedScenarioTitle: "{{selectedScenarioTitle}}"
- selectedDifficulty: "{{selectedDifficulty}}"

Your job is to call handoff_tool once the scenario and difficulty are known.

If selectedScenario and selectedDifficulty above are not empty:
- Do not ask which scenario or difficulty they want.
- Call handoff_tool immediately with destination "dynamic" and difficulty set to the selectedDifficulty value above.
- The backend will read the selected scenario from metadata.

If selectedScenario is not empty, but selectedDifficulty is empty:
- Do not ask which scenario they want.
- Ask only for difficulty.
- When calling handoff_tool, include destination "dynamic" and the difficulty.
- The backend will read the selected scenario from metadata.

If no scenario was selected, ask which scenario and difficulty they want.

Allowed difficulties:
- easy: also accept beginner, simple, easier, light
- medium: also accept normal, regular, standard, average, moderate
- hard: also accept difficult, advanced, challenging, tough, harder

If the difficulty is clear, call handoff_tool immediately with difficulty as exactly easy, medium, or hard.
If the difficulty is unclear or does not match one of those meanings, ask them to choose easy, medium, or hard. Do not call handoff_tool for unclear input.`,
      }],
      tools: [{
        type: 'handoff',
        function: {
          name: 'handoff_tool',
          description: 'Transfer to the selected training scenario after a clear difficulty choice.',
          parameters: {
            type: 'object',
            properties: {
              destination: { type: 'string', enum: ['dynamic'] },
              scenario: { type: 'string', description: 'Optional scenario slug if the caller selected by voice.' },
              difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] },
            },
            required: ['destination', 'difficulty'],
          },
        },
        destinations: [{ type: 'dynamic', server: { url: config.vapiWebhookUrl } }],
      }],
    },
    transcriber: {
      provider: 'deepgram',
      model: 'nova-2',
      language: 'en',
      endpointing: 300,
      confidenceThreshold: 0.2,
      keywords: ['easy', 'medium', 'hard', 'tough', 'difficult', 'advanced', 'challenging'],
    },
    backgroundSpeechDenoisingPlan: {
      smartDenoisingPlan: { enabled: false },
      fourierDenoisingPlan: { enabled: false },
    },
    voice: { provider: 'vapi', voiceId: 'Elliot' },
    firstMessage: '{% if selectedScenarioTitle and selectedDifficulty %}Starting {{selectedScenarioTitle}} on {{selectedDifficulty}} difficulty.{% elsif selectedScenarioTitle %}You selected {{selectedScenarioTitle}}. What difficulty would you like: easy, medium, or hard?{% else %}Which scenario and difficulty would you like to practice?{% endif %}',
    firstMessageInterruptionsEnabled: true,
    server: { url: config.vapiWebhookUrl, timeoutSeconds: 20 },
    serverMessages: ['end-of-call-report', 'status-update', 'handoff-destination-request'],
    silenceTimeoutSeconds: 60,
    maxDurationSeconds: 600,
  };
}

async function syncAssistant() {
  if (!config.vapiApiKey) throw new Error('Missing VAPI_API_KEY');
  if (!config.vapiAssistantId) throw new Error('Missing VAPI_ASSISTANT_ID');
  if (!config.vapiWebhookUrl) throw new Error('Missing VAPI_WEBHOOK_URL');

  const response = await fetch(`${VAPI_API_BASE}/assistant/${config.vapiAssistantId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${config.vapiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(buildPermanentReceptionistAssistant()),
  });

  const body = await response.text();
  if (!response.ok) {
    throw new Error(`Vapi assistant sync failed (${response.status}): ${body}`);
  }

  console.log(`Synced Vapi assistant ${config.vapiAssistantId}`);
}

syncAssistant().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
