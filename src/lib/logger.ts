/**
 * Structured logging utility for the application
 * Provides consistent logging format and supports different environments
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogContext {
  userId?: string
  requestId?: string
  component?: string
  function?: string
  metadata?: Record<string, any>
}

export interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: LogContext
  error?: {
    name: string
    message: string
    stack?: string
  }
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private isTest = process.env.NODE_ENV === 'test'

  private formatLogEntry(level: LogLevel, message: string, context?: LogContext, error?: Error): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context
    }

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: this.isDevelopment ? error.stack : undefined
      }
    }

    return entry
  }

  private writeLog(entry: LogEntry) {
    // In test environment, suppress logs unless explicitly enabled
    if (this.isTest && !process.env.ENABLE_TEST_LOGS) {
      return
    }

    const output = this.isDevelopment 
      ? this.formatDevelopmentLog(entry)
      : JSON.stringify(entry)

    // Route to appropriate console method
    switch (entry.level) {
      case 'debug':
        console.debug(output)
        break
      case 'info':
        console.info(output)
        break
      case 'warn':
        console.warn(output)
        break
      case 'error':
        console.error(output)
        break
    }
  }

  private formatDevelopmentLog(entry: LogEntry): string {
    const { timestamp, level, message, context, error } = entry
    
    let output = `[${timestamp}] ${level.toUpperCase()}: ${message}`
    
    if (context) {
      const contextParts = []
      if (context.component) contextParts.push(`component=${context.component}`)
      if (context.function) contextParts.push(`function=${context.function}`)
      if (context.userId) contextParts.push(`userId=${context.userId}`)
      if (context.requestId) contextParts.push(`requestId=${context.requestId}`)
      
      if (contextParts.length > 0) {
        output += ` [${contextParts.join(', ')}]`
      }
      
      if (context.metadata) {
        output += ` ${JSON.stringify(context.metadata)}`
      }
    }
    
    if (error) {
      output += `\nError: ${error.name}: ${error.message}`
      if (error.stack) {
        output += `\n${error.stack}`
      }
    }
    
    return output
  }

  debug(message: string, context?: LogContext) {
    this.writeLog(this.formatLogEntry('debug', message, context))
  }

  info(message: string, context?: LogContext) {
    this.writeLog(this.formatLogEntry('info', message, context))
  }

  warn(message: string, context?: LogContext, error?: Error) {
    this.writeLog(this.formatLogEntry('warn', message, context, error))
  }

  error(message: string, context?: LogContext, error?: Error) {
    this.writeLog(this.formatLogEntry('error', message, context, error))
  }

  // Convenience method for API route logging
  apiError(message: string, request: Request, error?: Error, metadata?: Record<string, any>) {
    const context: LogContext = {
      component: 'api',
      requestId: request.headers.get('x-request-id') || undefined,
      metadata: {
        method: request.method,
        url: request.url,
        userAgent: request.headers.get('user-agent'),
        ...metadata
      }
    }
    
    this.error(message, context, error)
  }

  // Convenience method for component logging
  componentError(message: string, componentName: string, error?: Error, metadata?: Record<string, any>) {
    const context: LogContext = {
      component: componentName,
      metadata
    }
    
    this.error(message, context, error)
  }

  // Convenience method for service logging
  serviceError(message: string, serviceName: string, functionName: string, error?: Error, metadata?: Record<string, any>) {
    const context: LogContext = {
      component: serviceName,
      function: functionName,
      metadata
    }
    
    this.error(message, context, error)
  }
}

// Export singleton instance
export const logger = new Logger()

// Export convenience functions for common use cases
export const logApiError = logger.apiError.bind(logger)
export const logComponentError = logger.componentError.bind(logger)
export const logServiceError = logger.serviceError.bind(logger)