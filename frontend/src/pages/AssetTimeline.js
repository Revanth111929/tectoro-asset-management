import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AssetHistoryTimeline from '../components/AssetHistoryTimeline';

function AssetTimeline() {
  const { assetId } = useParams();
  const navigate = useNavigate();

  const handleClose = () => {
    navigate(-1); // Go back to previous page
  };

  return (
    <div className="container-fluid" style={{ padding: '2rem 0' }}>
      <div className="row justify-content-center">
        <div className="col-12 col-xl-10">
          <AssetHistoryTimeline assetId={parseInt(assetId)} onClose={handleClose} />
        </div>
      </div>
    </div>
  );
}

export default AssetTimeline;
