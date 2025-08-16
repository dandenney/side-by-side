# Rate Limiting Configuration

This project uses a distributed rate limiting system that supports both in-memory and Redis-based storage.

## Current Status

- ✅ **In-memory rate limiting**: Currently active (suitable for development and single-instance deployments)
- 🔄 **Redis rate limiting**: Ready to enable (recommended for production with multiple instances)

## Features

- **Automatic fallback**: Falls back to in-memory storage if Redis is unavailable
- **HTTP headers**: Returns rate limit information in response headers
- **Configurable limits**: Easy to adjust limits per endpoint
- **Distributed**: Redis support for multi-instance deployments

## Enabling Redis Rate Limiting

### 1. Install Redis dependency

```bash
npm install ioredis
npm install --save-dev @types/ioredis
```

### 2. Update the rate limiting code

In `src/lib/rate-limit.ts`, uncomment the Redis connection code:

```typescript
// Remove the current getRedisClient function and replace with:
async function getRedisClient(): Promise<any | null> {
  if (!process.env.REDIS_URL && !process.env.REDIS_HOST) {
    return null
  }

  try {
    const { Redis } = await import('ioredis')
    
    const redis = new Redis(process.env.REDIS_URL || {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    })

    await redis.ping()
    return redis
  } catch (error) {
    console.warn('Redis connection failed, falling back to in-memory rate limiting:', error)
    return null
  }
}
```

### 3. Set environment variables

Add to your `.env.local` or deployment environment:

```bash
# Option 1: Redis URL (for services like Redis Cloud, Upstash, etc.)
REDIS_URL=redis://username:password@host:port

# Option 2: Individual Redis connection details
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password_if_needed
```

### 4. Deploy Redis

#### Local Development
```bash
# Using Docker
docker run -d --name redis -p 6379:6379 redis:alpine

# Using Homebrew (macOS)
brew install redis
brew services start redis
```

#### Production Options
- **Upstash**: Serverless Redis (recommended for Vercel)
- **Redis Cloud**: Managed Redis service
- **ElastiCache**: AWS managed Redis
- **MemoryStore**: Google Cloud managed Redis

## Rate Limiting Configuration

Current settings in `src/app/api/places/route.ts`:
- **Limit**: 50 requests per minute
- **Window**: 60 seconds
- **Key prefix**: `places_api`

To modify:
```typescript
const rateLimitResult = await rateLimit(ip, {
  limit: 100,        // requests per window
  window: 60000,     // window in milliseconds
  keyPrefix: 'api',  // Redis key prefix
})
```

## Monitoring Rate Limits

The system returns these headers:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining in current window
- `X-RateLimit-Reset`: Unix timestamp when window resets

## Testing Rate Limits

```bash
# Test rate limiting endpoint
for i in {1..55}; do
  curl -i "http://localhost:3000/api/places?query=test"
  sleep 0.1
done
```

After 50 requests, you should receive a 429 status code.