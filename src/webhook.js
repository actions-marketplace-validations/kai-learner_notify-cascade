const https = require('https');
const http = require('http');
const { URL } = require('url');

async function sendWebhook({ webhookUrl, method, headersJson, bodyTemplate, message, title }) {
  if (!webhookUrl) return { status: 'skipped' };

  let extraHeaders = {};
  if (headersJson) {
    try {
      extraHeaders = JSON.parse(headersJson);
    } catch {
      console.warn('[notify-cascade] webhook-headers is not valid JSON, ignoring');
    }
  }

  const context = {
    message,
    title,
    repository: process.env.GITHUB_REPOSITORY || '',
    run_id: process.env.GITHUB_RUN_ID || '',
    run_number: process.env.GITHUB_RUN_NUMBER || '',
    actor: process.env.GITHUB_ACTOR || '',
    event_name: process.env.GITHUB_EVENT_NAME || '',
    ref: process.env.GITHUB_REF || '',
    sha: process.env.GITHUB_SHA || '',
    server_url: process.env.GITHUB_SERVER_URL || 'https://github.com',
    run_url: `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
  };

  let body;
  if (bodyTemplate) {
    const rendered = bodyTemplate.replace(/\{\{(\w+)\}\}/g, (_, key) => context[key] ?? '');
    try {
      body = JSON.parse(rendered);
    } catch {
      body = rendered; // send as raw string if not valid JSON after substitution
    }
  } else {
    // Default payload — GitHub Actions-friendly
    body = context;
  }

  const httpMethod = (method || 'POST').toUpperCase();

  try {
    const responseCode = await request(webhookUrl, httpMethod, extraHeaders, typeof body === 'string' ? body : JSON.stringify(body));
    if (responseCode >= 200 && responseCode < 300) {
      return { status: 'sent' };
    } else {
      return { status: 'failed', error: `HTTP ${responseCode}` };
    }
  } catch (err) {
    console.error(`[notify-cascade] Webhook error: ${err.message}`);
    return { status: 'failed', error: err.message };
  }
}

function request(url, method, extraHeaders, data) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const lib = parsed.protocol === 'https:' ? https : http;
    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'notify-cascade-action',
      ...extraHeaders
    };
    if (method !== 'GET' && data) {
      headers['Content-Length'] = Buffer.byteLength(data);
    }
    const req = lib.request({
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      method,
      headers
    }, (res) => {
      res.resume(); // drain
      resolve(res.statusCode);
    });
    req.on('error', reject);
    if (method !== 'GET' && data) req.write(data);
    req.end();
  });
}

module.exports = { sendWebhook };
