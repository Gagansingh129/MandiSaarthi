import React from 'react';

/**
 * Simple centered loading spinner using pure CSS animation.
 */
export default function LoadingSpinner() {
  return (
    <div className="spinner-wrapper" role="status" aria-label="Loading">
      <div className="spinner" />
    </div>
  );
}
