# Secure API Key Management Guide

## For Vercel Deployment

### Option A: Vercel Dashboard (Recommended)
1. Go to https://vercel.com/dashboard
2. Select your project
3. Navigate to **Settings** → **Environment Variables**
4. Add variables:
   - **OPENAI_API_KEY**: `your-new-api-key`
   - **SLACK_WEBHOOK_URL**: `your-webhook-url`
5. Select environments:
   - ✅ Production
   - ✅ Preview
   - ✅ Development
6. Deploy your app - Vercel automatically injects these

### Option B: Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Add environment variables
vercel env add OPENAI_API_KEY production
vercel env add SLACK_WEBHOOK_URL production

# Deploy
vercel --prod
```

## For Other Cloud Providers

### AWS (Using Systems Manager)
```bash
# Store in Parameter Store
aws ssm put-parameter \
  --name "/nextrows-blog/openai-api-key" \
  --value "your-api-key" \
  --type "SecureString"

# In your app, use AWS SDK to retrieve
```

### Google Cloud (Using Secret Manager)
```bash
# Create secret
echo -n "your-api-key" | gcloud secrets create openai-api-key --data-file=-

# Grant access to your service
gcloud secrets add-iam-policy-binding openai-api-key \
  --member="serviceAccount:your-service@project.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### Azure (Using Key Vault)
```bash
# Create key vault
az keyvault create --name nextrows-vault --resource-group myResourceGroup

# Add secret
az keyvault secret set --vault-name nextrows-vault \
  --name openai-api-key --value "your-api-key"
```

### Heroku
```bash
heroku config:set OPENAI_API_KEY=your-api-key
heroku config:set SLACK_WEBHOOK_URL=your-webhook-url
```

### Netlify
```bash
# Via CLI
netlify env:set OPENAI_API_KEY "your-api-key"

# Or in netlify.toml
[build.environment]
  # Don't put actual keys here! Use Netlify UI
```

## Security Checklist

### ✅ DO's:
- [ ] Rotate keys regularly (monthly)
- [ ] Use different keys for dev/staging/production
- [ ] Set spending limits in OpenAI dashboard
- [ ] Monitor usage for anomalies
- [ ] Use environment-specific keys
- [ ] Enable IP restrictions if available

### ❌ DON'Ts:
- [ ] Never commit keys to git
- [ ] Never expose keys in client-side code
- [ ] Never share keys in chat/email/slack
- [ ] Never use same key across projects
- [ ] Never hardcode keys in code

## Local Development Setup

### 1. Create `.env.local` file:
```env
OPENAI_API_KEY=sk-...
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
```

### 2. Verify `.gitignore` includes:
```gitignore
# local env files
.env*.local
```

### 3. For team development, use `.env.example`:
```env
# Copy to .env.local and fill with your values
OPENAI_API_KEY=your-openai-key-here
SLACK_WEBHOOK_URL=your-slack-webhook-here
```

## API Key Best Practices

### 1. **Implement Rate Limiting**
Add to your API route:
```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "1 m"), // 10 requests per minute
});
```

### 2. **Add Request Validation**
```typescript
// Validate origin
const origin = request.headers.get('origin');
const allowedOrigins = ['https://yourdomain.com'];
if (!allowedOrigins.includes(origin)) {
  return new Response('Forbidden', { status: 403 });
}
```

### 3. **Monitor Usage**
```typescript
// Log API usage
console.log({
  timestamp: new Date().toISOString(),
  usage: completion.usage,
  cost: calculateCost(completion.usage),
});
```

### 4. **Set OpenAI Spending Limits**
1. Go to https://platform.openai.com/account/limits
2. Set monthly budget
3. Set email alerts at 50%, 75%, 90%

## Emergency Response Plan

If your key is compromised:
1. **Immediately** revoke the key in OpenAI dashboard
2. Generate new key
3. Update all environments
4. Check OpenAI usage logs for unauthorized use
5. Review security practices

## Testing Security

```bash
# Test that key is not exposed in build
npm run build
grep -r "sk-" .next/

# Should return nothing
```

## Additional Security Layers

### Use Edge Functions (Recommended)
Move API calls to Edge Functions for additional security:
```typescript
// /api/chat/route.ts
export const runtime = 'edge';
```

### Add CORS Protection
```typescript
const cors = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
```

### Implement Request Signing
For extra security, implement HMAC signing for requests.

## Questions?
- OpenAI Security Docs: https://platform.openai.com/docs/guides/safety-best-practices
- Vercel Security: https://vercel.com/docs/security