const core = require('@actions/core');
const { sendSlack } = require('./src/slack');
const { sendEmail } = require('./src/email');
const { sendWebhook } = require('./src/webhook');

async function run() {
  try {
    const message = core.getInput('message', { required: true });
    const title = core.getInput('title') || 'GitHub Notification';

    core.info(`[notify-cascade] Starting notifications for: "${title}"`);

    const [slackResult, emailResult, webhookResult] = await Promise.allSettled([
      sendSlack({
        webhookUrl: core.getInput('slack-webhook'),
        message,
        title,
        channel: core.getInput('slack-channel'),
        username: core.getInput('slack-username'),
        iconEmoji: core.getInput('slack-icon-emoji')
      }),
      sendEmail({
        smtpHost: core.getInput('smtp-host'),
        smtpPort: core.getInput('smtp-port'),
        smtpSecure: core.getInput('smtp-secure'),
        smtpUser: core.getInput('smtp-user'),
        smtpPassword: core.getInput('smtp-password'),
        emailFrom: core.getInput('email-from'),
        emailTo: core.getInput('email-to'),
        title,
        message
      }),
      sendWebhook({
        webhookUrl: core.getInput('webhook-url'),
        method: core.getInput('webhook-method'),
        headersJson: core.getInput('webhook-headers'),
        bodyTemplate: core.getInput('webhook-body-template'),
        message,
        title
      })
    ]);

    const slack = slackResult.status === 'fulfilled' ? slackResult.value : { status: 'failed', error: slackResult.reason?.message };
    const email = emailResult.status === 'fulfilled' ? emailResult.value : { status: 'failed', error: emailResult.reason?.message };
    const webhook = webhookResult.status === 'fulfilled' ? webhookResult.value : { status: 'failed', error: webhookResult.reason?.message };

    core.setOutput('slack-status', slack.status);
    core.setOutput('email-status', email.status);
    core.setOutput('webhook-status', webhook.status);

    const summary = [
      `| Channel | Status |`,
      `|---------|--------|`,
      `| Slack   | ${formatStatus(slack)}  |`,
      `| Email   | ${formatStatus(email)}  |`,
      `| Webhook | ${formatStatus(webhook)}  |`
    ].join('\n');

    await core.summary
      .addHeading(`notify-cascade: ${title}`)
      .addRaw(message)
      .addEOL()
      .addRaw(summary)
      .write();

    const anyFailed = [slack, email, webhook].some(r => r.status === 'failed');
    if (anyFailed) {
      core.warning('[notify-cascade] One or more channels failed. See outputs for details.');
    }

    core.info(`[notify-cascade] Done. slack=${slack.status} email=${email.status} webhook=${webhook.status}`);
  } catch (err) {
    core.setFailed(err.message);
  }
}

function formatStatus({ status }) {
  if (status === 'sent') return '✅ sent';
  if (status === 'skipped') return '⏭️ skipped';
  return '❌ failed';
}

run();
