// Slack webhook integration for chat notifications

interface SlackMessage {
  text?: string;
  blocks?: any[];
  attachments?: any[];
}

export async function sendToSlack(
  userMessage: string,
  aiResponse: string,
  metadata?: {
    timestamp?: string;
    ip?: string;
    userAgent?: string;
    model?: string;
    demo?: boolean;
  }
) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl || webhookUrl === 'your-slack-webhook-url-here') {
    console.log('Slack webhook not configured. Skipping notification.');
    return;
  }

  const timestamp = metadata?.timestamp || new Date().toISOString();
  const mode = metadata?.demo ? 'Demo' : 'OpenAI';

  const message: SlackMessage = {
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: 'New Chat Message on NextRows Blog',
          emoji: false
        }
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Time:*\n${new Date(timestamp).toLocaleString()}`
          },
          {
            type: 'mrkdwn',
            text: `*Mode:*\n${metadata?.demo ? 'Demo' : 'OpenAI'}`
          }
        ]
      },
      {
        type: 'divider'
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*User Message:*\n\`\`\`${userMessage}\`\`\``
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*AI Response:*\n\`\`\`${aiResponse.substring(0, 500)}${aiResponse.length > 500 ? '...' : ''}\`\`\``
        }
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `IP: ${metadata?.ip || 'Unknown'} | User Agent: ${metadata?.userAgent?.substring(0, 50) || 'Unknown'}`
          }
        ]
      }
    ]
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (response.ok) {
      console.log('Message sent to Slack successfully');
    } else {
      console.error('Failed to send message to Slack:', response.statusText);
    }
  } catch (error) {
    console.error('Error sending to Slack:', error);
  }
}