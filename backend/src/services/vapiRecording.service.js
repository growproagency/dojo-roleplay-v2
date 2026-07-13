import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';

const VAPI_BASE_URL = 'https://api.vapi.ai';

export async function getVapiRecordingUrl(
  vapiCallId,
  { apiKey = config.vapiApiKey, fetchImpl = fetch } = {},
) {
  if (!apiKey) throw new Error('VAPI_NOT_CONFIGURED');
  if (!vapiCallId) throw new Error('RECORDING_UNAVAILABLE');

  const response = await fetchImpl(
    `${VAPI_BASE_URL}/call/${encodeURIComponent(vapiCallId)}/mono-recording`,
    {
      headers: { Authorization: `Bearer ${apiKey}` },
      redirect: 'manual',
    },
  );

  if (response.status === 404) throw new Error('RECORDING_UNAVAILABLE');

  if (response.status >= 300 && response.status < 400) {
    const location = response.headers.get('location');
    try {
      if (location && new URL(location).protocol === 'https:') return location;
    } catch {
      // Fall through to the safe provider error below.
    }
  }

  logger.warn({ vapiCallId, status: response.status }, 'Vapi recording URL request failed');
  throw new Error('VAPI_RECORDING_FAILED');
}
