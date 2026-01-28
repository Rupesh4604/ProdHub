import React from 'react';
import { Info } from 'lucide-react';

export default function ConfigurationNeeded({ missingFirebase, missingGoogle }) {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-900 text-white p-8">
      <div className="bg-yellow-900/50 border border-yellow-700 rounded-lg p-8 max-w-2xl text-center">
        <Info size={48} className="text-yellow-300 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-yellow-200 mb-4">Configuration Required</h1>
        {missingFirebase && (
          <div className="text-left bg-gray-800 p-4 rounded-md mb-4">
            <p className="text-gray-300 mb-2">
              <strong>Firebase Config Missing:</strong> Please ensure your Firebase environment variables (REACT_APP_FIREBASE_*) are set correctly in your <code>.env.local</code> file.
            </p>
          </div>
        )}
        {missingGoogle && (
          <div className="text-left bg-gray-800 p-4 rounded-md">
            <p className="text-gray-300 mb-2">
              <strong>Google Client ID Missing:</strong> Please ensure REACT_APP_GOOGLE_CLIENT_ID is set in your <code>.env.local</code> file to enable Google Calendar sync.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
