'use client'

import React from 'react'
import { ErrorBoundary } from './ui/error-boundary'
import { Button } from './ui/button'
import { RefreshCw, Home, AlertTriangle } from 'lucide-react'

// Page-level error boundary for entire page failures
export const PageErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorBoundary
    level="page"
    resetOnPropsChange={true}
    fallback={PageErrorFallback}
  >
    {children}
  </ErrorBoundary>
)

// Feature-level error boundary for major features
export const FeatureErrorBoundary: React.FC<{ 
  children: React.ReactNode
  featureName?: string
}> = ({ children, featureName }) => (
  <ErrorBoundary
    level="feature"
    resetOnPropsChange={true}
    fallback={(props) => <FeatureErrorFallback {...props} featureName={featureName} />}
  >
    {children}
  </ErrorBoundary>
)

// Component-level error boundary for individual components
export const ComponentErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorBoundary level="component">
    {children}
  </ErrorBoundary>
)

// List-level error boundary for data lists that might fail to load
export const ListErrorBoundary: React.FC<{ 
  children: React.ReactNode
  listName?: string
}> = ({ children, listName }) => (
  <ErrorBoundary
    level="component"
    fallback={(props) => <ListErrorFallback {...props} listName={listName} />}
  >
    {children}
  </ErrorBoundary>
)

// Custom fallback components

const PageErrorFallback: React.FC<{
  error?: Error
  resetError: () => void
}> = ({ error, resetError }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
      <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
        <AlertTriangle className="w-6 h-6 text-red-600" />
      </div>
      
      <div className="text-center">
        <h1 className="text-xl font-semibold text-gray-900 mb-2">
          Oops! Something went wrong
        </h1>
        <p className="text-gray-600 mb-6">
          We encountered an unexpected error. Please try refreshing the page or go back to the home page.
        </p>
        
        {process.env.NODE_ENV === 'development' && error && (
          <details className="mb-6 text-left">
            <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900 mb-2">
              Error Details (Development)
            </summary>
            <div className="text-xs text-red-600 bg-red-50 p-3 rounded border overflow-auto max-h-32">
              <div className="font-medium mb-1">{error.message}</div>
              {error.stack && (
                <pre className="whitespace-pre-wrap text-xs">{error.stack}</pre>
              )}
            </div>
          </details>
        )}
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={resetError} variant="outline" className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Button>
          <Button onClick={() => window.location.href = '/'} className="flex items-center gap-2">
            <Home className="w-4 h-4" />
            Go Home
          </Button>
        </div>
      </div>
    </div>
  </div>
)

const FeatureErrorFallback: React.FC<{
  error?: Error
  resetError: () => void
  featureName?: string
}> = ({ error, resetError, featureName }) => (
  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 my-4">
    <div className="flex items-start">
      <div className="flex-shrink-0">
        <AlertTriangle className="h-5 w-5 text-yellow-400" />
      </div>
      <div className="ml-3 flex-1">
        <h3 className="text-sm font-medium text-yellow-800">
          {featureName || 'Feature'} Temporarily Unavailable
        </h3>
        <div className="mt-2 text-sm text-yellow-700">
          <p>
            This feature encountered an error and is temporarily unavailable. 
            You can try reloading it or continue using other parts of the application.
          </p>
        </div>
        
        {process.env.NODE_ENV === 'development' && error && (
          <details className="mt-3">
            <summary className="cursor-pointer text-sm font-medium text-yellow-800 hover:text-yellow-900">
              Error Details (Development)
            </summary>
            <div className="mt-2 text-xs text-yellow-700 bg-yellow-100 p-2 rounded overflow-auto max-h-24">
              <div className="font-medium">{error.message}</div>
              {error.stack && (
                <pre className="whitespace-pre-wrap text-xs mt-1">{error.stack.slice(0, 300)}...</pre>
              )}
            </div>
          </details>
        )}
        
        <div className="mt-4">
          <Button
            onClick={resetError}
            variant="outline"
            size="sm"
            className="text-yellow-800 border-yellow-300 hover:bg-yellow-100"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry {featureName || 'Feature'}
          </Button>
        </div>
      </div>
    </div>
  </div>
)

const ListErrorFallback: React.FC<{
  error?: Error
  resetError: () => void
  listName?: string
}> = ({ error, resetError, listName }) => (
  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
    <div className="text-gray-400 mb-2">
      <AlertTriangle className="w-8 h-8 mx-auto" />
    </div>
    <h4 className="text-sm font-medium text-gray-900 mb-1">
      Couldn&apos;t load {listName || 'list'}
    </h4>
    <p className="text-xs text-gray-600 mb-3">
      There was an error loading this content. Please try again.
    </p>
    
    {process.env.NODE_ENV === 'development' && error && (
      <details className="mb-3 text-left">
        <summary className="cursor-pointer text-xs font-medium text-gray-700 hover:text-gray-900">
          Error Details
        </summary>
        <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded overflow-auto max-h-20">
          {error.message}
        </div>
      </details>
    )}
    
    <Button
      onClick={resetError}
      variant="outline"
      size="sm"
      className="text-xs"
    >
      <RefreshCw className="w-3 h-3 mr-1" />
      Retry
    </Button>
  </div>
)