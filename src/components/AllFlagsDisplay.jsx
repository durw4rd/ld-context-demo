import { useState, useEffect } from 'react';
import { useLDClient } from 'launchdarkly-react-client-sdk';

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

  const getReasonColor = (reason) => {
    if (!reason || !reason.kind) {
      return 'bg-gray-100 text-gray-800';
    }
    
    const kind = reason.kind.toUpperCase();
    if (kind.includes('OFF') || kind.includes('DISABLED')) {
      return 'bg-gray-100 text-gray-800';
    }
    if (kind.includes('FALLTHROUGH') || kind.includes('DEFAULT')) {
      return 'bg-blue-100 text-blue-800';
    }
    if (kind.includes('RULE') || kind.includes('TARGET')) {
      return 'bg-green-100 text-green-800';
    }
    if (kind.includes('PREREQUISITE')) {
      return 'bg-yellow-100 text-yellow-800';
    }
    if (kind.includes('ERROR')) {
      return 'bg-red-100 text-red-800';
    }
    return 'bg-purple-100 text-purple-800';
  };

  return (
    <div className="bg-white p-6 rounded shadow-md w-full max-w-4xl mt-6">
      <h2 className="text-2xl font-bold mb-4">All Feature Flags</h2>
      {flagsData.length === 0 ? (
        <p className="text-gray-500">No flags available</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-2 text-left">Flag Key</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Value</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Evaluation Reason</th>
              </tr>
            </thead>
            <tbody>
              {flagsData.map(({ key, value, reason }) => (
                <tr key={key} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-2 font-mono font-semibold">
                    {key}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    <pre className="font-mono text-sm whitespace-pre-wrap break-words">
                      {formatValue(value)}
                    </pre>
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    <span className={`inline-block px-2 py-1 rounded text-xs ${getReasonColor(reason)}`}>
                      {formatEvaluationReason(reason)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-sm text-gray-500 mt-4">
        Total flags: {flagsData.length}
      </p>
    </div>
  );
}

export default AllFlagsDisplay;

