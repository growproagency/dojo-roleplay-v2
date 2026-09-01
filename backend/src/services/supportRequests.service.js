import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { findAllSupportRequests, findSupportRequestsByUser, insertSupportRequest, updateSupportRequestById } from '../db/supportRequests.queries.js';

async function notifySlack(request) {
  if (!config.slackSupportWebhookUrl) return;
  try {
    const response = await fetch(config.slackSupportWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `New Dojo Roleplay support request: ${request.subject}`,
        blocks: [
          { type: 'header', text: { type: 'plain_text', text: 'New Dojo Roleplay support request' } },
          { type: 'section', fields: [
            { type: 'mrkdwn', text: `*From*\n${request.email}` },
            { type: 'mrkdwn', text: `*Category*\n${request.category}` },
            { type: 'mrkdwn', text: `*School ID*\n${request.school_id ?? 'Platform admin'}` },
            { type: 'mrkdwn', text: `*Request ID*\n${request.id}` },
          ] },
          { type: 'section', text: { type: 'mrkdwn', text: `*${request.subject}*\n${request.message}` } },
          ...(request.page_url ? [{ type: 'context', elements: [{ type: 'mrkdwn', text: `Submitted from: ${request.page_url}` }] }] : []),
        ],
      }),
    });
    if (!response.ok) throw new Error(`Slack returned ${response.status}`);
  } catch (error) {
    logger.warn({ err: { message: error.message }, requestId: request.id }, 'Support Slack notification failed');
  }
}

export const listMine = (userId) => findSupportRequestsByUser(userId, 20);

export async function create(user, body) {
  const request = await insertSupportRequest({
    school_id: user.schoolId ?? null,
    user_id: user.id,
    email: user.email,
    category: body.category,
    subject: body.subject,
    message: body.message,
    page_url: body.pageUrl || null,
  });
  await notifySlack(request);
  return request;
}

export const listAll = (status) => findAllSupportRequests({ status, limit: 100 });
export const updateStatus = (id, status) => updateSupportRequestById(id, { status });
