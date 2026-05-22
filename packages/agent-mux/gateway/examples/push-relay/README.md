# Push Relay Example

This relay accepts hook-request webhooks from the gateway and forwards them to APNs. The gateway never stores APNs
credentials; the relay owns the APNs token and topic.

## Environment

- `PORT`: HTTP port for webhook delivery. Defaults to `8788`.
- `APN_KEY_PATH`: path to your `.p8` APNs key.
- `APN_KEY_ID`: APNs key identifier.
- `APN_TEAM_ID`: Apple developer team id.
- `APN_TOPIC`: bundle identifier for the iOS app.
- `APN_PRODUCTION=1`: send to production APNs instead of sandbox.

## Run

```bash
npm install
npm run build
npm start
```

Point the gateway `notificationWebhook.url` at `http://relay-host:8788/hook-request`.
