const nodemailer = require('nodemailer');

async function sendEmail({ smtpHost, smtpPort, smtpSecure, smtpUser, smtpPassword, emailFrom, emailTo, title, message }) {
  if (!smtpHost || !emailTo) return { status: 'skipped' };

  const transport = nodemailer.createTransport({
    host: smtpHost,
    port: parseInt(smtpPort || '587', 10),
    secure: smtpSecure === 'true',
    auth: {
      user: smtpUser,
      pass: smtpPassword
    }
  });

  const runUrl = `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`;
  const repoUrl = `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}`;

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #24292e;">
  <div style="border-left: 4px solid #0366d6; padding-left: 16px; margin-bottom: 24px;">
    <h2 style="margin: 0 0 8px; color: #0366d6;">${escapeHtml(title)}</h2>
    <p style="margin: 0; color: #586069;">${process.env.GITHUB_REPOSITORY} &bull; Run #${process.env.GITHUB_RUN_NUMBER}</p>
  </div>
  <div style="background: #f6f8fa; padding: 16px; border-radius: 6px; margin-bottom: 24px;">
    <p style="margin: 0; white-space: pre-wrap;">${escapeHtml(message)}</p>
  </div>
  <div style="font-size: 12px; color: #586069;">
    <a href="${repoUrl}" style="color: #0366d6;">View Repository</a>
    &nbsp;&bull;&nbsp;
    <a href="${runUrl}" style="color: #0366d6;">View Run #${process.env.GITHUB_RUN_NUMBER}</a>
  </div>
</body>
</html>`;

  try {
    await transport.sendMail({
      from: emailFrom || smtpUser,
      to: emailTo,
      subject: `[GitHub] ${title}`,
      text: `${title}\n\n${message}\n\nRepo: ${repoUrl}\nRun: ${runUrl}`,
      html
    });
    return { status: 'sent' };
  } catch (err) {
    console.error(`[notify-cascade] Email error: ${err.message}`);
    return { status: 'failed', error: err.message };
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

module.exports = { sendEmail };
