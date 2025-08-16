/**
 * Rate limiting utility with Redis support for distributed systems
 * Falls back to in-memory storage if Redis is not available
 */

interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

interface RateLimitOptions {
  limit: number // requests per window
  window: number // window in milliseconds
  keyPrefix?: string
}

// In-memory fallback for development/testing
const memoryStore = new Map<string, { count: number; resetTime: number }>()

async function getRedisClient(): Promise<any | null> {
  // Skip Redis for now - this is where Redis connection would be established
  // when the ioredis package is installed and Redis is available
  if (!process.env.REDIS_URL && !process.env.REDIS_HOST) {
    return null
  }

  // TODO: Uncomment this section when ioredis is installed:
  /*
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
  */
  
  console.info('Redis not configured, using in-memory rate limiting (not recommended for production)')
  return null
}

async function rateLimitRedis(
  redis: any,
  key: string,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  const { limit, window } = options
  const now = Date.now()
  const windowStart = Math.floor(now / window) * window

  try {
    const pipeline = redis.pipeline()
    const windowKey = `${key}:${windowStart}`
    
    pipeline.incr(windowKey)
    pipeline.expire(windowKey, Math.ceil(window / 1000))
    
    const results = await pipeline.exec()
    const count = results[0][1]
    
    const remaining = Math.max(0, limit - count)
    const reset = windowStart + window

    return {
      success: count <= limit,
      limit,
      remaining,
      reset,
    }
  } catch (error) {
    console.error('Redis rate limit error:', error)
    // Fall back to in-memory on Redis errors
    return rateLimitMemory(key, options)
  }
}

function rateLimitMemory(
  key: string,
  options: RateLimitOptions
): RateLimitResult {
  const { limit, window } = options
  const now = Date.now()
  const windowStart = Math.floor(now / window) * window
  
  const stored = memoryStore.get(key)
  
  if (!stored || stored.resetTime <= now) {
    memoryStore.set(key, { count: 1, resetTime: windowStart + window })
    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: windowStart + window,
    }
  }
  
  stored.count++
  const remaining = Math.max(0, limit - stored.count)
  
  return {
    success: stored.count <= limit,
    limit,
    remaining,
    reset: stored.resetTime,
  }
}

export async function rateLimit(
  identifier: string,
  options: RateLimitOptions = {
    limit: 50,
    window: 60000, // 1 minute
    keyPrefix: 'rl',
  }
): Promise<RateLimitResult> {
  const key = `${options.keyPrefix || 'rl'}:${identifier}`
  
  // Try Redis first
  const redis = await getRedisClient()
  
  if (redis) {
    const result = await rateLimitRedis(redis, key, options)
    try {
      redis.disconnect?.()
    } catch (error) {
      // Ignore disconnect errors
    }
    return result
  }
  
  // Fall back to in-memory
  return rateLimitMemory(key, options)
}

// Utility function to extract client IP
export function getClientIP(request: Request): string {
  // Check various headers for the real IP
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwardedFor.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP
  }
  
  if (cfConnectingIP) {
    return cfConnectingIP
  }
  
  // Fallback to a generic identifier
  return 'unknown'
}