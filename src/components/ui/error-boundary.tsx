'use client'

import React from 'react'
import { logComponentError } from '@/lib/logger'
import { Button } from './button'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{
    error?: Error
    resetError: () => void
  }>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  resetOnPropsChange?: boolean
  level?: 'page' | 'component' | 'feature'
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  private resetTimeoutId: number | null = null

  constructor(props: ErrorBoundaryProps) {
    super(props)

    this.state = {
      hasError: false,
    }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    })

    // Log error using our structured logging
    logComponentError(
      `Error caught by ${this.props.level || 'component'} error boundary`,
      undefined,
      error,
      {
        errorInfo: {
          componentStack: errorInfo.componentStack,
        },
        level: this.props.level,
      }
    )

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo)
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetOnPropsChange } = this.props
    const { hasError } = this.state

    // Reset error boundary when props change (useful for route changes)
    if (hasError && resetOnPropsChange && prevProps.children !== this.props.children) {
      this.resetErrorBoundary()
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId)
    }
  }

  resetErrorBoundary = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId)
    }

    this.resetTimeoutId = window.setTimeout(() => {
      this.setState({
        hasError: false,
        error: undefined,
        errorInfo: undefined,
      })
    }, 0)
  }

  render() {
    const { hasError, error } = this.state
    const { children, fallback: Fallback } = this.props

    if (hasError) {
      if (Fallback) {
        return <Fallback error={error} resetError={this.resetErrorBoundary} />
      }

      return <DefaultErrorFallback error={error} resetError={this.resetErrorBoundary} level={this.props.level} />
    }

    return children
  }
}

interface DefaultErrorFallbackProps {
  error?: Error
  resetError: () => void
  level?: string
}

const DefaultErrorFallback: React.FC<DefaultErrorFallbackProps> = ({
  error,
  resetError,
  level = 'component',
}) => {
  const isPageLevel = level === 'page'
  
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-6 rounded-lg border border-red-200 bg-red-50',
        isPageLevel ? 'min-h-[400px]' : 'min-h-[200px]'
      )}
      role="alert"
    >
      <div className="text-center space-y-4">
        <div className="text-red-600">
          <svg
            className="mx-auto h-12 w-12"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {isPageLevel ? 'Something went wrong' : 'Error loading component'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {isPageLevel 
              ? 'An unexpected error occurred. Please try refreshing the page.'
              : 'This component encountered an error and couldn\'t load properly.'
            }
          </p>
          
          {process.env.NODE_ENV === 'development' && error && (
            <details className="mt-4 text-left">
              <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                Error Details
              </summary>
              <pre className="mt-2 text-xs text-red-600 bg-red-100 p-2 rounded overflow-auto max-h-32">
                {error.message}
                {error.stack && (
                  <>
                    {'\n\n'}
                    {error.stack}
                  </>
                )}
              </pre>
            </details>
          )}
        </div>

        <div className="flex gap-2 justify-center">
          <Button
            onClick={resetError}
            variant="outline"
            size="sm"
          >
            Try Again
          </Button>
          
          {isPageLevel && (
            <Button
              onClick={() => window.location.reload()}
              size="sm"
            >
              Refresh Page
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function cn(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

// Higher-order component for easier usage
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`

  return WrappedComponent
}

// Hook for imperative error boundary reset
export function useErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null)

  const resetError = React.useCallback(() => {
    setError(null)
  }, [])

  const captureError = React.useCallback((error: Error) => {
    setError(error)
  }, [])

  React.useEffect(() => {
    if (error) {
      throw error
    }
  }, [error])

  return {
    captureError,
    resetError,
  }
}