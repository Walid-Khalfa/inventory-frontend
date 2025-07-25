import React from 'react';

export function ScrollArea({ children }) {
  return (
    <div style={{ overflowY: 'auto', maxHeight: '400px' }}>
      {children}
    </div>
  );
}
