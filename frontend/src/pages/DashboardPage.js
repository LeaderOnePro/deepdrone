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
      case 'ready': return { status: 'success', value: '系统就绪' };
      case 'no_model': return { status: 'warning', value: 'AI 模型未配置' };
      case 'no_drone': return { status: 'error', value: '无人机未连接' };
      default: return { status: 'error', value: '未知状态' };
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
            立即配置
          </button>
        </div>
      )}

      {/* 主要状态卡片 */}
      <div className="grid grid--4" style={{ marginBottom: 'var(--space-xxl)' }}>
        <StatusCard
          title="系统状态"
          status={systemStatusData.status}
          value={systemStatusData.value}
          description="系统整体健康状态和就绪情况"
        />

        <StatusCard
          title="AI 模型"
          status={currentModel?.configured ? 'success' : 'error'}
          value={currentModel?.configured ? 
            `${currentModel.model_info?.provider} - ${currentModel.model_info?.model_id}` : 
            '未配置'
          }
          description="用于自然语言控制的 AI 模型"
          action={!currentModel?.configured && (
            <button 
              className="button button--secondary"
              onClick={() => navigate('/settings')}
            >
              配置
            </button>
          )}
        />

        <StatusCard
          title="无人机状态"
          status={droneStatus?.connected ? 'success' : 'error'}
          value={droneStatus?.connected ? 
            `已连接 - 电量 ${droneStatus.battery}%` : 
            '未连接'
          }
          description={droneStatus?.connected ? 
            `模式: ${droneStatus.mode} | 高度: ${droneStatus.altitude}m` :
            '需要连接无人机才能进行控制'
          }
          action={!droneStatus?.connected && (
            <button 
              className="button button--secondary"
              onClick={() => navigate('/settings')}
            >
              连接
            </button>
          )}
        />

        <StatusCard
          title="快捷操作"
          description="开始控制您的无人机"
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
                开始控制
              </button>
              <button
                className="button button--secondary"
                onClick={() => navigate('/settings')}
              >
                设置
              </button>
            </div>
          }
        />
      </div>

      {/* 详细信息 */}
      {droneStatus?.connected && (
        <div className="grid grid--2">
          <StatusCard
            title="位置信息"
            description={`
              纬度: ${droneStatus.location?.lat || '未知'}
              经度: ${droneStatus.location?.lon || '未知'}
              高度: ${droneStatus.altitude || 0}m
            `}
          />

          <StatusCard
            title="系统信息"
            description="DeepDrone 2.0 - 由臻巅科技开发的 AI 驱动无人机控制系统，支持自然语言处理、多模型 AI 支持、实时遥测监控和安全飞行模式保护。"
          />
        </div>
      )}
    </Layout>
  );
};

export default DashboardPage;