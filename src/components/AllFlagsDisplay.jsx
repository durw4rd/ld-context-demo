import { useState, useEffect } from 'react';
import { useLDClient } from 'launchdarkly-react-client-sdk';
import { FaFlag, FaCheckCircle, FaTimesCircle, FaInfoCircle } from 'react-icons/fa';

function AllFlagsDisplay() {
  const ldClient = useLDClient();
  const [flagsData, setFlagsData] = useState([]);

  const updateFlags = async () => {
    if (ldClient) {
      const allFlags = ldClient.allFlags();
      const flagKeys = Object.keys(allFlags);
      
      // Get evaluation details for each flag
      const flagsWithReasons = flagKeys.map(key => {
        const value = allFlags[key];
        const detail = ldClient.variationDetail(key, null);
        return {
          key,
          value,
          reason: detail.reason
        };
      });
      
      setFlagsData(flagsWithReasons);
    }
  };

  useEffect(() => {
    updateFlags();

    if (ldClient) {
      // Listen for flag changes
      const handleChange = () => {
        updateFlags();
      };

      ldClient.on('change', handleChange);

      // Cleanup function to remove the event listener when the component unmounts
      return () => {
        ldClient.off('change', handleChange);
      };
    }
  }, [ldClient]);

  const formatValue = (value) => {
    if (value === null || value === undefined) {
      return 'null';
    }
    if (typeof value === 'boolean') {
      return value.toString();
    }
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  const formatEvaluationReason = (reason) => {
    if (!reason) {
      return 'No reason available';
    }
    
    // Format the reason based on its kind
    const kind = reason.kind || 'UNKNOWN';
    const kindFormatted = kind.replace(/_/g, ' ').toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    let reasonText = kindFormatted;
    
    // Add additional context based on reason kind
    if (reason.ruleIndex !== undefined && reason.ruleIndex !== null) {
      reasonText += ` (Rule ${reason.ruleIndex})`;
    }
    if (reason.ruleId) {
      reasonText += ` - ${reason.ruleId}`;
    }
    if (reason.prerequisiteKey) {
      reasonText += ` - Prerequisite: ${reason.prerequisiteKey}`;
    }
    if (reason.errorKind) {
      reasonText += ` - Error: ${reason.errorKind}`;
    }
    
    return reasonText;
  };

  const getReasonStyles = (reason) => {
    if (!reason || !reason.kind) {
      return 'bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)] border border-[var(--color-border)]';
    }
    
    const kind = reason.kind.toUpperCase();
    if (kind.includes('OFF') || kind.includes('DISABLED')) {
      return 'bg-gray-800/50 text-gray-400 border border-gray-700';
    }
    if (kind.includes('FALLTHROUGH') || kind.includes('DEFAULT')) {
      return 'bg-blue-900/30 text-blue-400 border border-blue-800/50';
    }
    if (kind.includes('RULE') || kind.includes('TARGET')) {
      return 'bg-emerald-900/30 text-emerald-400 border border-emerald-800/50';
    }
    if (kind.includes('PREREQUISITE')) {
      return 'bg-amber-900/30 text-amber-400 border border-amber-800/50';
    }
    if (kind.includes('ERROR')) {
      return 'bg-red-900/30 text-red-400 border border-red-800/50';
    }
    return 'bg-purple-900/30 text-purple-400 border border-purple-800/50';
  };

  const getValueIcon = (value) => {
    if (typeof value === 'boolean') {
      return value ? (
        <FaCheckCircle className="text-emerald-400" />
      ) : (
        <FaTimesCircle className="text-red-400" />
      );
    }
    return <FaInfoCircle className="text-blue-400" />;
  };

  return (
    <div className="w-full max-w-4xl animate-fade-in">
      <h3 className="section-title mb-4">
        <FaFlag className="text-[var(--color-accent-secondary)]" />
        Feature Flags
      </h3>
      
      <div className="flags-table">
        {flagsData.length === 0 ? (
          <div className="p-8 text-center text-[var(--color-text-muted)]">
            <FaFlag className="text-4xl mx-auto mb-3 opacity-50" />
            <p>No flags available</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left">Flag Key</th>
                  <th className="text-left">Value</th>
                  <th className="text-left">Evaluation Reason</th>
                </tr>
              </thead>
              <tbody>
                {flagsData.map(({ key, value, reason }, index) => (
                  <tr 
                    key={key} 
                    className="transition-colors"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <td className="font-mono font-semibold text-[var(--color-text-primary)]">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[var(--color-accent-primary)]"></span>
                        {key}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        {getValueIcon(value)}
                        <pre className="font-mono text-sm whitespace-pre-wrap break-words text-[var(--color-text-secondary)]">
                          {formatValue(value)}
                        </pre>
                      </div>
                    </td>
                    <td>
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${getReasonStyles(reason)}`}>
                        {formatEvaluationReason(reason)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        <div className="px-6 py-4 border-t border-[var(--color-border)] flex items-center justify-between">
          <p className="text-sm text-[var(--color-text-muted)]">
            Total flags: <span className="text-[var(--color-accent-primary)] font-semibold">{flagsData.length}</span>
          </p>
          <div className="flex items-center gap-4 text-xs text-[var(--color-text-muted)]">
            <span className="flex items-center gap-1">
              <FaCheckCircle className="text-emerald-400" /> True
            </span>
            <span className="flex items-center gap-1">
              <FaTimesCircle className="text-red-400" /> False
            </span>
            <span className="flex items-center gap-1">
              <FaInfoCircle className="text-blue-400" /> Other
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AllFlagsDisplay;
