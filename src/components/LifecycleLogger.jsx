import { useState, useEffect, useRef } from 'react';
import { useLDClient } from 'launchdarkly-react-client-sdk';

function LifecycleLogger() {
  const ldClient = useLDClient();
  const [logs, setLogs] = useState([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const logsEndRef = useRef(null);

  const formatTimestamp = () => {
    const now = new Date();
    return now.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const addLog = (eventType, message, data = null) => {
    const newLog = {
      id: Date.now() + Math.random(),
      timestamp: formatTimestamp(),
      eventType,
      message,
      data
    };
    setLogs(prevLogs => [...prevLogs, newLog]);
  };

  // Auto-scroll to bottom when new logs are added
  useEffect(() => {
    if (logsEndRef.current && !isCollapsed) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isCollapsed]);

  const deleteLog = (logId) => {
    setLogs(prevLogs => prevLogs.filter(log => log.id !== logId));
  };

  const clearAllLogs = () => {
    setLogs([]);
  };

  useEffect(() => {
    if (!ldClient) return;

    // Ready event - client has finished starting up
    const handleReady = () => {
      addLog('ready', 'Client has finished starting up');
    };

    // Initialized event - client successfully started with valid flag data
    const handleInitialized = () => {
      addLog('initialized', 'Client successfully initialized with valid feature flag data');
    };

    // Failed event - client encountered an error
    const handleFailed = () => {
      addLog('failed', 'Client encountered an error that prevented connection to LaunchDarkly');
    };

    // Error event - general error condition
    const handleError = (error) => {
      addLog('error', 'Error occurred', error?.message || String(error));
    };

    // Change event - client received new feature flag data
    const handleChange = (changes) => {
      const changedFlags = Object.keys(changes || {});
      if (changedFlags.length > 0) {
        addLog('change', `Flag values changed: ${changedFlags.join(', ')}`, changes);
      } else {
        addLog('change', 'Flag values changed');
      }
    };

    // Register all event listeners
    ldClient.on('ready', handleReady);
    ldClient.on('initialized', handleInitialized);
    ldClient.on('failed', handleFailed);
    ldClient.on('error', handleError);
    ldClient.on('change', handleChange);

    // Cleanup function
    return () => {
      ldClient.off('ready', handleReady);
      ldClient.off('initialized', handleInitialized);
      ldClient.off('failed', handleFailed);
      ldClient.off('error', handleError);
      ldClient.off('change', handleChange);
    };
  }, [ldClient]);

  const getEventTypeColor = (eventType) => {
    switch (eventType) {
      case 'ready':
        return 'bg-blue-100 text-blue-800';
      case 'initialized':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'change':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const highlightJSON = (jsonString) => {
    // Escape HTML to prevent XSS
    let highlighted = jsonString
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    
    // Highlight keys (quoted strings followed by colon, at start of line or after brace/comma)
    highlighted = highlighted.replace(/(^|\s|[{,]\s*)"([^"]+)":/gm, '$1<span class="text-blue-400 font-semibold">"$2"</span>:');
    
    // Highlight string values (quoted strings after colon and whitespace, but not keys)
    highlighted = highlighted.replace(/:\s*"([^"]*)"/g, ': <span class="text-green-400">"$1"</span>');
    
    // Highlight numbers (integers and decimals, not part of strings)
    highlighted = highlighted.replace(/:\s*(-?\d+\.?\d*)\b/g, ': <span class="text-orange-500 font-semibold">$1</span>');
    
    // Highlight booleans
    highlighted = highlighted.replace(/:\s*(true|false)\b/g, ': <span class="text-purple-500 font-semibold">$1</span>');
    
    // Highlight null
    highlighted = highlighted.replace(/:\s*(null)\b/g, ': <span class="text-red-500 font-semibold">$1</span>');
    
    return highlighted;
  };

  return (
    <div className={`fixed right-0 top-0 h-full bg-white shadow-lg border-l border-gray-300 z-30 transition-all duration-300 ${
      isCollapsed ? 'w-12' : 'w-96'
    }`}>
      <div className="relative h-full">
        {/* Header */}
        <div className={`bg-gray-800 text-white flex items-center justify-between ${
          isCollapsed ? 'p-2' : 'p-4'
        }`}>
        {!isCollapsed && (
          <h3 className="text-lg font-bold">Lifecycle Events</h3>
        )}
        <div className="flex items-center gap-2">
          {!isCollapsed && logs.length > 0 && (
            <button
              onClick={clearAllLogs}
              className="text-xs px-2 py-1 bg-red-600 hover:bg-red-700 rounded transition-colors"
              title="Clear all logs"
            >
              Clear All
            </button>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 hover:bg-gray-700 rounded transition-colors"
            title={isCollapsed ? 'Expand' : 'Collapse'}
          >
            {isCollapsed ? '▶' : '◀'}
          </button>
        </div>
      </div>

      {/* Logs Container */}
      {!isCollapsed && (
        <div className="h-[calc(100%-4rem)] overflow-y-auto p-4">
          {logs.length === 0 ? (
            <p className="text-gray-500 text-sm text-center mt-4">No events logged yet</p>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="bg-gray-50 border border-gray-200 rounded p-3 text-sm"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getEventTypeColor(log.eventType)}`}>
                        {log.eventType.toUpperCase()}
                      </span>
                    </div>
                    <button
                      onClick={() => deleteLog(log.id)}
                      className="text-red-600 hover:text-red-800 text-xs font-bold"
                      title="Delete log"
                    >
                      ×
                    </button>
                  </div>
                  <p className="text-gray-700 mb-1">{log.message}</p>
                  <p className="text-xs text-gray-500">{log.timestamp}</p>
                  {log.data && typeof log.data === 'object' && (
                    <details className="mt-2">
                      <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-800 text-left">
                        View details
                      </summary>
                      <pre 
                        className="mt-2 p-3 bg-gray-900 rounded text-xs overflow-x-auto text-left font-mono"
                        style={{ 
                          color: '#e5e7eb',
                          lineHeight: '1.5'
                        }}
                        dangerouslySetInnerHTML={{ 
                          __html: highlightJSON(JSON.stringify(log.data, null, 2))
                        }}
                      />
                    </details>
                  )}
                  {log.data && typeof log.data === 'string' && (
                    <p className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                      {log.data}
                    </p>
                  )}
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          )}
        </div>
      )}

        {/* Collapsed indicator */}
        {isCollapsed && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -rotate-90">
            <div className="text-white text-xs font-bold whitespace-nowrap bg-gray-800/80 px-2 py-1 rounded">
              Events ({logs.length})
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default LifecycleLogger;

