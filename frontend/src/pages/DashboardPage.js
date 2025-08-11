import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import StatusCard from '../components/StatusCard';

const DashboardPage = ({ currentModel, droneStatus, onModelUpdate, onDroneUpdate }) => {
  const navigate = useNavigate();
  const [systemStatus, setSystemStatus] = useState('ready');

  useEffect(() => {
    if (!currentModel?.configured) {
      setSystemStatus('no_model');
    } else if (!droneStatus?.connected) {
      setSystemStatus('no_drone');
    } else {
      setSystemStatus('ready');
    }
  }, [currentModel, droneStatus]);

  const getSystemStatus = () => {
    switch (systemStatus) {
      case 'ready': return { status: 'success', value: 'System Ready' };
      case 'no_model': return { status: 'warning', value: 'AI Model Not Configured' };
      case 'no_drone': return { status: 'error', value: 'Drone Not Connected' };
      default: return { status: 'error', value: 'Unknown Status' };
    }
  };

  const systemStatusData = getSystemStatus();

  return (
    <Layout>
      {/* 系统状态警告 */}
      {systemStatus !== 'ready' && (
        <div style={{
          padding: 'var(--space-md)',
          backgroundColor: systemStatus === 'no_model' ? '#fff3cd' : '#f8d7da',
          border: `1px solid ${systemStatus === 'no_model' ? '#ffeaa7' : '#f5c6cb'}`,
          borderRadius: 'var(--radius-md)',
          marginBottom: 'var(--space-xl)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: 'var(--font-size-sm)' }}>
            {systemStatusData.value}
          </span>
          <button 
            className="button button--primary"
            onClick={() => navigate('/settings')}
          >
            Configure Now
          </button>
        </div>
      )}

      {/* 主要状态卡片 */}
      <div className="grid grid--4" style={{ marginBottom: 'var(--space-xxl)' }}>
        <StatusCard
          title="System Status"
          status={systemStatusData.status}
          value={systemStatusData.value}
          description="Overall system health and readiness"
        />

        <StatusCard
          title="AI Model"
          status={currentModel?.configured ? 'success' : 'error'}
          value={currentModel?.configured ? 
            `${currentModel.model_info?.provider} - ${currentModel.model_info?.model_id}` : 
            'Not Configured'
          }
          description="AI model for natural language control"
          action={!currentModel?.configured && (
            <button 
              className="button button--secondary"
              onClick={() => navigate('/settings')}
            >
              Configure
            </button>
          )}
        />

        <StatusCard
          title="Drone Status"
          status={droneStatus?.connected ? 'success' : 'error'}
          value={droneStatus?.connected ? 
            `Connected - ${droneStatus.battery}% Battery` : 
            'Not Connected'
          }
          description={droneStatus?.connected ? 
            `Mode: ${droneStatus.mode} | Altitude: ${droneStatus.altitude}m` :
            'Drone connection required for control'
          }
          action={!droneStatus?.connected && (
            <button 
              className="button button--secondary"
              onClick={() => navigate('/settings')}
            >
              Connect
            </button>
          )}
        />

        <StatusCard
          title="Quick Actions"
          description="Start controlling your drone"
          action={
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              <button
                className="button button--primary"
                onClick={() => navigate('/control')}
                disabled={systemStatus !== 'ready'}
                style={{ 
                  opacity: systemStatus !== 'ready' ? 0.5 : 1,
                  cursor: systemStatus !== 'ready' ? 'not-allowed' : 'pointer'
                }}
              >
                Start Control
              </button>
              <button
                className="button button--secondary"
                onClick={() => navigate('/settings')}
              >
                Settings
              </button>
            </div>
          }
        />
      </div>

      {/* 详细信息 */}
      {droneStatus?.connected && (
        <div className="grid grid--2">
          <StatusCard
            title="Location Information"
            description={`
              Latitude: ${droneStatus.location?.lat || 'N/A'}
              Longitude: ${droneStatus.location?.lon || 'N/A'}
              Altitude: ${droneStatus.altitude || 0}m
            `}
          />

          <StatusCard
            title="System Information"
            description="DeepDrone 2.0 - AI-powered drone control system with natural language processing, multi-model AI support, real-time telemetry monitoring, and safety flight mode protection."
          />
        </div>
      )}
    </Layout>
  );
};

export default DashboardPage;