import React from 'react';
import AssetHistoryTimeline from './AssetHistoryTimeline';
import './AssetHistoryModal.css';

function AssetHistoryModal({ assetId, isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="asset-history-modal-overlay" onClick={onClose}>
      <div className="asset-history-modal-content" onClick={(e) => e.stopPropagation()}>
        <AssetHistoryTimeline assetId={assetId} onClose={onClose} />
      </div>
    </div>
  );
}

export default AssetHistoryModal;
