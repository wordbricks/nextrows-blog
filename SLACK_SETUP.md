# Slack Webhook Setup Guide for NextRows Blog Chat

## Quick Setup Steps

1. **Create Slack App**
   - Go to https://api.slack.com/apps
   - Click "Create New App" → "From scratch"
   - Name it "NextRows Blog Chat"
   - Select your workspace

2. **Enable Incoming Webhooks**
   - In your app settings, click "Incoming Webhooks"
   - Toggle "Activate Incoming Webhooks" to ON
   - Click "Add New Webhook to Workspace"
   - Choose the channel where messages should be posted
   - Copy the webhook URL

3. **Configure Environment Variable**
   - Open `.env.local` in your project
   - Replace `your-slack-webhook-url-here` with your actual webhook URL:
   ```
   SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
   ```

4. **Test the Integration**
   - Restart your development server: `npm run dev`
   - Open http://localhost:4321
   - Click the chat icon in bottom right
   - Send a test message
   - Check your Slack channel for the notification

## What Gets Sent to Slack

Each chat interaction sends:
- User message
- AI response
- Timestamp
- IP address (for debugging)
- User agent
- Mode indicator (🤖 Demo or 🧠 OpenAI)

## Troubleshooting

- **No messages in Slack**: Check console for "⚠️ Slack webhook not configured" warning
- **Messages fail to send**: Verify webhook URL is correct and channel still exists
- **Rate limiting**: Slack webhooks have rate limits, consider implementing throttling for production

## Security Note

Never commit your webhook URL to git. Keep it in `.env.local` which is gitignored.