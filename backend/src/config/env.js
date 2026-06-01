import 'dotenv/config';

const required = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_KEY',
  'JWT_SECRET',
  'OPENAI_API_KEY',
];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(
      `\nMissing required env var: ${key}\n` +
      `Copy .env.example to .env.local and fill in your values.\n`
    );
  }
}

export const config = {
  supabaseUrl:      process.env.SUPABASE_URL,
  supabaseKey:      process.env.SUPABASE_SERVICE_KEY,
  allowedOrigins:   (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(','),
  port:             Number(process.env.PORT) || 3001,
  isProduction:     process.env.NODE_ENV === 'production',
  isDevelopment:    process.env.NODE_ENV !== 'production',
  logLevel:         process.env.LOG_LEVEL || 'info',
  jwtSecret:        process.env.JWT_SECRET,
  openaiApiKey:     process.env.OPENAI_API_KEY,
  openaiModel:      process.env.OPENAI_MODEL || 'gpt-4o-mini',
  vapiApiKey:        process.env.VAPI_API_KEY || '',
  vapiPublicKey:     process.env.VAPI_PUBLIC_KEY || '',
  vapiAssistantId:   process.env.VAPI_ASSISTANT_ID || '',
  vapiPhoneNumberId: process.env.VAPI_PHONE_NUMBER_ID || '',
  vapiWebhookUrl:    process.env.VAPI_WEBHOOK_URL || '',
  frontendUrl:        process.env.FRONTEND_URL || (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',')[0],
  automationWebhookSecret: process.env.AUTOMATION_WEBHOOK_SECRET || '',
};
