import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from './ui/button';
import { AlertTriangle, RefreshCcw, Copy, Check } from 'lucide-react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  copied: boolean;
}

class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    copied: false
  };

  public static getDerivedStateFromError(error: Error): State {
    // Check if it's a dynamic import/chunk loading error
    const isChunkError = 
      error && error.message && 
      (error.message.includes('dynamically imported module') || 
       error.message.includes('Failed to fetch dynamically imported module') || 
       error.message.includes('Loading chunk') ||
       error.message.includes('chunk_') ||
       error.message.includes('dynamic import'));

    if (isChunkError) {
      console.warn('Dynamic import/chunk error detected. Attempting automatic reload...');
      try {
        const lastReload = sessionStorage.getItem('last_chunk_error_reload');
        const now = Date.now();
        if (!lastReload || (now - parseInt(lastReload, 10) > 10000)) {
          sessionStorage.setItem('last_chunk_error_reload', now.toString());
          window.location.reload();
        }
      } catch (e) {
        console.error('Failed to trigger auto-reload:', e);
      }
    }

    return { hasError: true, error, copied: false };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleCopy = () => {
    navigator.clipboard.writeText(`Error: ${this.state.error?.message}\nStack: ${this.state.error?.stack}`);
    (this as any).setState({ copied: true });
    setTimeout(() => (this as any).setState({ copied: false }), 2000);
  };

  public render() {
    if (this.state.hasError) {
      if ((this as any).props.fallback) {
        return (this as any).props.fallback;
      }

      return (
        <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
          <div className="max-w-md w-full bg-card border border-border shadow-2xl rounded-2xl p-8 text-center space-y-6 animate-in fade-in zoom-in duration-300">
            <div className="mx-auto w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-xl font-black uppercase tracking-tight text-foreground text-center">
                Ops! Ocorreu um erro inesperado.
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Algo não saiu como planejado. Se você estava realizando um cadastro ou alteração, verifique se a operação foi concluída ao retornar.
              </p>
              <div className="flex items-center justify-center gap-2 text-amber-600 bg-amber-50 py-2 rounded-lg border border-amber-100">
                <p className="text-[10px] font-bold uppercase tracking-wider">Dica: Suas alterações podem ter sido salvas antes do erro.</p>
              </div>
              
              {this.state.error && (
                <div className="mt-4 space-y-2">
                  <div className="p-3 bg-slate-950 border border-slate-700 rounded-lg text-left overflow-auto max-h-[200px] shadow-inner group relative">
                    <div className="absolute right-2 top-2 opacity-100 transition-opacity">
                      <Button 
                        size="sm"
                        variant="secondary" 
                        className="h-8 gap-2 bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-[10px] uppercase tracking-widest"
                        onClick={this.handleCopy}
                      >
                        {this.state.copied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
                        {this.state.copied ? 'Copiado!' : 'Copiar Erro'}
                      </Button>
                    </div>
                    <p className="text-[11px] font-mono text-red-400 font-bold mb-1 pt-8">
                      {this.state.error.name}: {this.state.error.message}
                    </p>
                    {this.state.error.stack && (
                      <pre className="text-[9px] font-mono text-slate-400 leading-tight">
                        {this.state.error.stack}
                      </pre>
                    )}
                  </div>
                  <p className="text-[9px] text-muted-foreground animate-pulse">Copie o erro acima e envie para seu suporte.</p>
                </div>
              )}
            </div>

            <div className="pt-2">
              <Button 
                onClick={this.handleReload}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-widest h-12 shadow-lg shadow-primary/20"
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                Recarregar Aplicativo
              </Button>
            </div>
            
            <p className="text-[10px] text-muted-foreground uppercase font-medium">
              Roder Indica V2 • Sistema de Gestão
            </p>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

export default ErrorBoundary;
