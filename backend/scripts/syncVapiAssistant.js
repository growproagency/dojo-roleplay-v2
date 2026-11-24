import { config } from '../src/config/env.js';

const VAPI_API_BASE = 'https://api.vapi.ai';

// Vapi sends these headers with every webhook, so the backend can reject anything else.
function webhookServer() {
  return {
    url: config.vapiWebhookUrl,
    timeoutSeconds: 20,
    headers: { 'x-vapi-secret': config.vapiWebhookSecret },
  };
}

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
        destinations: [{ type: 'dynamic', server: webhookServer() }],
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
    server: webhookServer(),
    serverMessages: ['end-of-call-report', 'status-update', 'handoff-destination-request'],
    silenceTimeoutSeconds: 60,
    maxDurationSeconds: 1200,
  };
}

async function patchVapi(path, payload, label) {
  const response = await fetch(`${VAPI_API_BASE}${path}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${config.vapiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const body = await response.text();
  if (!response.ok) {
    throw new Error(`Vapi ${label} sync failed (${response.status}): ${body}`);
  }
}

async function syncAssistant() {
  if (!config.vapiApiKey) throw new Error('Missing VAPI_API_KEY');
  if (!config.vapiAssistantId) throw new Error('Missing VAPI_ASSISTANT_ID');
  if (!config.vapiWebhookUrl) throw new Error('Missing VAPI_WEBHOOK_URL');
  if (!config.vapiWebhookSecret) throw new Error('Missing VAPI_WEBHOOK_SECRET');

  await patchVapi(`/assistant/${config.vapiAssistantId}`, buildPermanentReceptionistAssistant(), 'assistant');
  console.log(`Synced Vapi assistant ${config.vapiAssistantId}`);

  // Inbound phone calls ask the phone number's server for an assistant, so it needs the secret too.
  if (config.vapiPhoneNumberId) {
    await patchVapi(`/phone-number/${config.vapiPhoneNumberId}`, { server: webhookServer() }, 'phone number');
    console.log(`Synced Vapi phone number ${config.vapiPhoneNumberId}`);
  } else {
    console.warn('VAPI_PHONE_NUMBER_ID not set: phone number webhook secret was not synced');
  }
}

syncAssistant().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
