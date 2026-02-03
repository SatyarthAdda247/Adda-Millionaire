import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from './ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  isDeploymentError: boolean;
}

class DeploymentErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    isDeploymentError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Check if it's a deployment-related error
    const errorMsg = error.message || String(error);
    const isDeploymentError = 
      errorMsg.includes('isDynamoDBConfigured') ||
      errorMsg.includes('useDynamoDB') ||
      errorMsg.includes('is not defined') ||
      errorMsg.includes('not a function');

    return {
      hasError: true,
      error,
      errorInfo: null,
      isDeploymentError,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 ERROR CAUGHT BY BOUNDARY:', error);
    console.error('📍 Component Stack:', errorInfo.componentStack);
    
    const errorMsg = error.message || String(error);
    if (errorMsg.includes('isDynamoDBConfigured') || errorMsg.includes('is not defined')) {
      console.error('⚠️ DEPLOYMENT CACHE ISSUE DETECTED!');
      console.error('📝 Solution: Redeploy on Vercel without cache');
      console.error('📖 See: VERCEL_MANUAL_DEPLOY_INSTRUCTIONS.md');
    }

    this.setState({
      error,
      errorInfo,
    });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleHardReload = () => {
    // Clear cache and reload
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      });
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.state.isDeploymentError) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-6">
            <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8 border-4 border-red-500">
              <div className="flex items-center gap-4 mb-6">
                <AlertCircle className="w-12 h-12 text-red-600" />
                <div>
                  <h1 className="text-3xl font-bold text-red-600">Deployment Cache Error</h1>
                  <p className="text-gray-600 mt-1">You're running old cached code</p>
                </div>
              </div>

              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 mb-6">
                <h2 className="font-semibold text-red-900 mb-3 text-lg">🚨 Error Details:</h2>
                <p className="text-red-800 font-mono text-sm bg-red-100 p-3 rounded overflow-x-auto">
                  {this.state.error?.message || 'Unknown error'}
                </p>
              </div>

              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-6">
                <h2 className="font-semibold text-blue-900 mb-4 text-lg">✅ Solution (3 Steps):</h2>
                <ol className="space-y-3 text-blue-900">
                  <li className="flex gap-3">
                    <span className="font-bold text-blue-600 min-w-[24px]">1.</span>
                    <div>
                      <strong>Go to Vercel Dashboard</strong>
                      <p className="text-sm text-blue-700 mt-1">
                        Navigate to: <code className="bg-blue-100 px-2 py-1 rounded">Deployments</code> tab
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold text-blue-600 min-w-[24px]">2.</span>
                    <div>
                      <strong>Redeploy Without Cache</strong>
                      <p className="text-sm text-blue-700 mt-1">
                        Click <code className="bg-blue-100 px-2 py-1 rounded">⋯</code> → 
                        <code className="bg-blue-100 px-2 py-1 rounded">Redeploy</code> → 
                        Select <code className="bg-blue-100 px-2 py-1 rounded">"Use existing build cache: NO"</code>
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold text-blue-600 min-w-[24px]">3.</span>
                    <div>
                      <strong>Hard Reload Browser</strong>
                      <p className="text-sm text-blue-700 mt-1">
                        Press: <code className="bg-blue-100 px-2 py-1 rounded">Cmd+Shift+R</code> (Mac) or 
                        <code className="bg-blue-100 px-2 py-1 rounded ml-1">Ctrl+Shift+R</code> (Windows)
                      </p>
                    </div>
                  </li>
                </ol>
              </div>

              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-yellow-900 text-sm">
                  <strong>ℹ️ Why this happened:</strong> Your browser is running old JavaScript code. 
                  The code has been fixed in GitHub (commit: 0322cd2) but Vercel hasn't rebuilt the app yet.
                </p>
              </div>

              <div className="flex gap-3">
                <Button 
                  onClick={this.handleHardReload}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  🔄 Try Hard Reload
                </Button>
                <Button 
                  onClick={this.handleReload}
                  variant="outline"
                  className="flex-1"
                >
                  🔁 Regular Reload
                </Button>
              </div>

              <div className="mt-6 text-center text-sm text-gray-500">
                <p>After Vercel redeploys, these errors will disappear completely.</p>
              </div>
            </div>
          </div>
        );
      }

      // Generic error fallback
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
          <div className="max-w-lg w-full bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-10 h-10 text-red-600" />
              <h1 className="text-2xl font-bold text-gray-900">Something went wrong</h1>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800 font-mono text-sm">
                {this.state.error?.message || 'Unknown error occurred'}
              </p>
            </div>

            <Button onClick={this.handleReload} className="w-full">
              Reload Page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default DeploymentErrorBoundary;
