# notify-cascade ⚡

> Send notifications to **Slack**, **email**, and **custom webhooks** — all in one GitHub Action step.

Stop juggling 3 separate notification actions. Define them once, run them together.

## Features

- 🔔 **Slack** — Rich block-kit messages with repo/run context
- 📧 **Email** — HTML + plain-text via any SMTP provider (Gmail, SendGrid, SES, Mailgun)
- 🌐 **Webhook** — POST/GET to any HTTP endpoint with custom headers and body templates
- ⚡ **Parallel** — All channels fire simultaneously (non-blocking)
- 📊 **Job Summary** — Status table written to GitHub's built-in summary
- 🛡️ **Safe** — Any channel can be skipped by omitting its config

## Quick Start

```yaml
- uses: kai-learner/notify-cascade@v1
  with:
    message: "Deploy to production succeeded 🚀"
    title: "Production Deployment"
    slack-webhook: ${{ secrets.SLACK_WEBHOOK }}
    email-to: team@example.com
    smtp-host: smtp.gmail.com
    smtp-user: ${{ secrets.SMTP_USER }}
    smtp-password: ${{ secrets.SMTP_PASSWORD }}
    webhook-url: ${{ secrets.OPS_WEBHOOK }}
```

## Inputs

### Common

| Input     | Required | Default               | Description                          |
|-----------|----------|-----------------------|--------------------------------------|
| `message` | ✅ Yes   |                       | Notification body (Slack supports markdown) |
| `title`   | No       | `GitHub Notification` | Title / email subject prefix         |

### Slack

| Input              | Required | Default          | Description                          |
|--------------------|----------|------------------|--------------------------------------|
| `slack-webhook`    | No       |                  | Slack Incoming Webhook URL           |
| `slack-channel`    | No       | webhook default  | Override channel (e.g. `#alerts`)    |
| `slack-username`   | No       | `GitHub Actions` | Bot display name                     |
| `slack-icon-emoji` | No       | `:octocat:`      | Bot icon emoji                       |

### Email (SMTP)

| Input            | Required | Default | Description                          |
|------------------|----------|---------|--------------------------------------|
| `smtp-host`      | No       |         | SMTP hostname (omit to skip email)   |
| `smtp-port`      | No       | `587`   | SMTP port                            |
| `smtp-secure`    | No       | `false` | `true` for port 465, `false` for STARTTLS |
| `smtp-user`      | No       |         | SMTP username                        |
| `smtp-password`  | No       |         | SMTP password                        |
| `email-from`     | No       | smtp-user | Sender address                     |
| `email-to`       | No       |         | Recipient(s), comma-separated        |

### HTTP Webhook

| Input                  | Required | Default | Description                             |
|------------------------|----------|---------|-----------------------------------------|
| `webhook-url`          | No       |         | Webhook endpoint URL                    |
| `webhook-method`       | No       | `POST`  | `GET` or `POST`                         |
| `webhook-headers`      | No       |         | Extra headers as JSON string            |
| `webhook-body-template`| No       |         | Custom JSON body with `{{message}}`, `{{title}}`, `{{repository}}`, etc. |

### Webhook template variables

| Variable       | Value                              |
|----------------|------------------------------------|
| `{{message}}`  | The notification message           |
| `{{title}}`    | The notification title             |
| `{{repository}}`| `owner/repo`                     |
| `{{run_id}}`   | GitHub run ID                      |
| `{{run_number}}`| GitHub run number                 |
| `{{actor}}`    | GitHub actor (triggering user)     |
| `{{event_name}}`| GitHub event name                 |
| `{{ref}}`      | Git ref                            |
| `{{sha}}`      | Git SHA                            |
| `{{run_url}}`  | Full URL to the Actions run        |

## Outputs

| Output           | Values                          |
|------------------|---------------------------------|
| `slack-status`   | `sent` / `skipped` / `failed`   |
| `email-status`   | `sent` / `skipped` / `failed`   |
| `webhook-status` | `sent` / `skipped` / `failed`   |

## Examples

### Notify on failure only

```yaml
- uses: kai-learner/notify-cascade@v1
  if: failure()
  with:
    title: "Build Failed ❌"
    message: "Workflow `${{ github.workflow }}` failed on `${{ github.ref }}`"
    slack-webhook: ${{ secrets.SLACK_WEBHOOK }}
    email-to: oncall@example.com
    smtp-host: smtp.sendgrid.net
    smtp-user: apikey
    smtp-password: ${{ secrets.SENDGRID_API_KEY }}
```

### PagerDuty webhook on deploy

```yaml
- uses: kai-learner/notify-cascade@v1
  with:
    title: "Deploy Complete"
    message: "v${{ github.run_number }} deployed by ${{ github.actor }}"
    webhook-url: https://events.pagerduty.com/v2/enqueue
    webhook-headers: '{"Authorization": "Token token=${{ secrets.PD_TOKEN }}"}'
    webhook-body-template: |
      {
        "routing_key": "${{ secrets.PD_ROUTING_KEY }}",
        "event_action": "resolve",
        "payload": {
          "summary": "{{title}}",
          "source": "{{repository}}",
          "severity": "info"
        }
      }
```

### Slack only (simplest)

```yaml
- uses: kai-learner/notify-cascade@v1
  with:
    message: "✅ Tests passed"
    slack-webhook: ${{ secrets.SLACK_WEBHOOK }}
```

## License

MIT
