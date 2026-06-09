import { useState, useEffect, useCallback } from 'react';
import { useLDClient } from '@launchdarkly/react-sdk';
import { FaFlag, FaCheckCircle, FaTimesCircle, FaInfoCircle } from 'react-icons/fa';

function AllFlagsDisplay() {
  const ldClient = useLDClient();
  const [flagsData, setFlagsData] = useState([]);

  const updateFlags = useCallback(async () => {
    if (ldClient) {
      const allFlags = ldClient.allFlags();
      const flagKeys = Object.keys(allFlags);
      
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
  }, [ldClient]);

  useEffect(() => {
    updateFlags();

    if (ldClient) {
      const handleChange = () => {
        updateFlags();
      };

      ldClient.on('change', handleChange);

      return () => {
        ldClient.off('change', handleChange);
      };
    }
  }, [ldClient, updateFlags]);

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

  const getReasonClass = (reason) => {
    if (!reason || !reason.kind) return 'reason-default';
    const kind = reason.kind.toUpperCase();
    if (kind.includes('OFF') || kind.includes('DISABLED')) return 'reason-off';
    if (kind.includes('FALLTHROUGH') || kind.includes('DEFAULT')) return 'reason-fallthrough';
    if (kind.includes('RULE') || kind.includes('TARGET')) return 'reason-rule';
    if (kind.includes('PREREQUISITE')) return 'reason-prereq';
    if (kind.includes('ERROR')) return 'reason-error';
    return 'reason-default';
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
    <>
      <div className="dashboard-panel-header">
        <h2 className="dashboard-panel-title">
          <FaFlag />
          Feature Flags
        </h2>
        <span className="text-xs text-[var(--color-text-muted)]">
          {flagsData.length} flag{flagsData.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="flags-table animate-fade-in">
        {flagsData.length === 0 ? (
          <div className="flags-empty">
            <FaFlag className="mx-auto block" />
            <p>No flags available</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th>Flag Key</th>
                  <th>Value</th>
                  <th>Evaluation Reason</th>
                </tr>
              </thead>
              <tbody>
                {flagsData.map(({ key, value, reason }) => (
                  <tr key={key}>
                    <td>
                      <span className="flag-key">{key}</span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        {getValueIcon(value)}
                        <pre className="flag-value">{formatValue(value)}</pre>
                      </div>
                    </td>
                    <td>
                      <span className={`reason-badge ${getReasonClass(reason)}`}>
                        {formatEvaluationReason(reason)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {flagsData.length > 0 && (
          <div className="flags-table-footer">
            <p>
              Total flags: <span className="flags-table-footer-count">{flagsData.length}</span>
            </p>
            <div className="flags-legend">
              <span className="flex items-center gap-1">
                <FaCheckCircle className="text-emerald-400" /> True
              </span>
              <span className="flex items-center gap-1">
                <FaTimesCircle className="text-red-400" /> False
              </span>
              <span className="flex items-center gap-1">
                <FaInfoCircle className="text-[var(--ld-blue-light)]" /> Other
              </span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default AllFlagsDisplay;
