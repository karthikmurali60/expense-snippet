# Splitwise Proxy Edge Function

This Edge Function acts as a proxy for Splitwise API requests to avoid CORS issues when making requests from the browser.

## Setup

1. Make sure you have the Supabase CLI installed:
```bash
npm install -g supabase
```

2. Deploy the Edge Function:
```bash
supabase functions deploy splitwise-proxy
```

## Usage

The Edge Function proxies requests to the Splitwise API. The endpoint should be specified in the URL path.

Example:
```typescript
const response = await fetch('/functions/v1/splitwise-proxy/get_current_user', {
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  },
});
```

## Configuration

The function is configured to:
- Allow CORS requests from any origin
- Forward the Authorization header to the Splitwise API
- Handle both GET and POST requests
- Return JSON responses with appropriate status codes

## Error Handling

The function will return:
- 401 if no Authorization header is provided
- 400 if no endpoint is specified
- 500 for any other errors
- The original status code from the Splitwise API for successful requests 