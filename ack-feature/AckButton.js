// frontend/src/components/AckButton.js
// Drop-in component for any asset row or detail page.
// Shows status badge + "Send Ack Email" button.

import React, { useState } from 'react';
import { ackAPI } from '../services/api';

const BADGE = {
  'Not Sent':     { bg: '#f1f5f9', color: '#64748b' },
  'Pending':      { bg: '#fef9c3', color: '#92400e' },
  'Acknowledged': { bg: '#dcfce7', color: '#166534' },
};

export default function AckButton({ asset, onStatusChange }) {
  const [loading, setLoading]   = useState(false);
  const [message, setMessage]   = useState('');
  const [status,  setStatus]    = useState(asset.ack_status || 'Not Sent');

  const badge = BADGE[status] || BADGE['Not Sent'];

  const handleSend = async () => {
    if (!asset.employee_email) {
      setMessage('❌ No email address on this asset');
      return;
    }
    setLoading(true); setMessage('');
    try {
      const res = await ackAPI.sendEmail(asset.id);
      if (res.data.success) {
        setStatus('Pending');
        setMessage('✅ ' + res.data.message);
        if (onStatusChange) onStatusChange('Pending');
      } else {
        setMessage('❌ ' + res.data.error);
      }
    } catch (e) {
      setMessage('❌ ' + (e.response?.data?.error || 'Failed to send email'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Status badge */}
        <span style={{
          background: badge.bg, color: badge.color,
          padding: '2px 10px', borderRadius: 20,
          fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap'
        }}>
          {status === 'Acknowledged' ? '✓ ' : status === 'Pending' ? '⏳ ' : ''}
          {status}
        </span>

        {/* Action button */}
        {status !== 'Acknowledged' && (
          <button
            className="btn btn-sm btn-outline-primary"
            style={{ fontSize: 12, padding: '2px 10px' }}
            onClick={handleSend}
            disabled={loading}
            title={status === 'Pending' ? 'Resend acknowledgment email' : 'Send acknowledgment email'}
          >
            {loading ? '⏳' : status === 'Pending' ? '↺ Resend' : '📧 Send Ack'}
          </button>
        )}

        {/* Ack date if acknowledged */}
        {status === 'Acknowledged' && asset.ack_received_at && (
          <span style={{ fontSize: 11, color: '#64748b' }}>
            {new Date(asset.ack_received_at).toLocaleDateString()}
          </span>
        )}
      </div>

      {message && (
        <span style={{
          fontSize: 11,
          color: message.startsWith('✅') ? '#166534' : '#dc2626'
        }}>
          {message}
        </span>
      )}
    </div>
  );
}
