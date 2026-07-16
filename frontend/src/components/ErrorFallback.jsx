import React from 'react';
import { AlertCircle, RotateCcw, AlertTriangle, CloudOff, Hourglass, ShieldAlert } from 'lucide-react';

export default function ErrorFallback({ error, onRetry }) {
  // Determine helper icon and titles based on the error message/type
  const getErrorInfo = () => {
    const msg = (typeof error === 'string' ? error : error?.message || '').toLowerCase();
    
    if (msg.includes('timeout') || msg.includes('504')) {
      return {
        icon: <Hourglass className="h-12 w-12 text-amber-400" />,
        title: 'Request Timed Out',
        desc: 'The AI model took too long to formulate a recipe. This usually happens when generating complex instructions or when servers are under heavy load.'
      };
    }
    
    if (msg.includes('rate limit') || msg.includes('429')) {
      return {
        icon: <ShieldAlert className="h-12 w-12 text-rose-400" />,
        title: 'Rate Limit Exceeded',
        desc: 'Too many requests were sent in a short period. Please wait a minute before requesting another recipe.'
      };
    }

    if (msg.includes('json') || msg.includes('parse') || msg.includes('schema')) {
      return {
        icon: <AlertTriangle className="h-12 w-12 text-orange-400" />,
        title: 'JSON Generation Error',
        desc: 'The recipe generator returned formatting that did not match the required interactive structure. Don\'t worry, you can retry.'
      };
    }

    if (msg.includes('fetch') || msg.includes('network') || msg.includes('failed') || msg.includes('unavailable') || msg.includes('502')) {
      return {
        icon: <CloudOff className="h-12 w-12 text-rose-500" />,
        title: 'Backend Unavailable',
        desc: 'We are unable to connect to the recipe server. Please verify the Express backend is running (npm run dev/start) and that your firewall is not blocking port 5000.'
      };
    }

    return {
      icon: <AlertCircle className="h-12 w-12 text-red-400" />,
      title: 'Unexpected Error',
      desc: typeof error === 'string' ? error : error?.message || 'Something went wrong while generating your recipe. Please check inputs and try again.'
    };
  };

  const info = getErrorInfo();

  return (
    <div className="w-full max-w-2xl mx-auto my-6 animate-fade-in">
      <div className="glass-card rounded-2xl p-6 sm:p-8 flex flex-col items-center text-center shadow-lg border border-red-500/20 relative overflow-hidden">
        {/* Soft background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-red-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="p-4 bg-slate-900/60 rounded-full border border-slate-800 shadow-inner mb-6 relative z-10">
          {info.icon}
        </div>

        <h3 className="text-xl sm:text-2xl font-bold text-slate-100 mb-3 relative z-10 tracking-tight">
          {info.title}
        </h3>
        
        <p className="text-slate-400 text-sm sm:text-base max-w-md mb-8 relative z-10 leading-relaxed">
          {info.desc}
        </p>

        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2.5 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 hover:text-white font-semibold rounded-xl shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-orange-500/20 outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-slate-950"
            aria-label="Retry generating recipe"
          >
            <RotateCcw className="h-4 w-4" />
            Try Generating Again
          </button>
        )}
      </div>
    </div>
  );
}
