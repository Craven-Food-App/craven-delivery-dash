import React, { useState } from 'react';
import { Card, Button, Alert, Modal, Input, Space } from 'antd';
import {
  PauseCircleOutlined,
  PlayCircleOutlined,
  WarningOutlined,
  NotificationOutlined,
  StopOutlined,
} from '@ant-design/icons';

const { TextArea } = Input;

export const EmergencyControls: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [action, setAction] = useState('');

  const handleEmergencyAction = (actionType: string) => {
    setAction(actionType);
    setIsModalVisible(true);
  };

  return (
    <div className="space-y-6">
      <Alert
        message="Emergency Controls"
        description="These controls have immediate system-wide impact. Use with extreme caution."
        type="error"
        showIcon
        icon={<WarningOutlined />}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card
          hoverable
          className="border-2 border-red-500 shadow-lg hover:shadow-xl transition-shadow"
        >
          <div className="text-center py-4">
            <PauseCircleOutlined className="text-6xl text-red-600 mb-4" />
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Pause All Orders</h3>
            <p className="text-slate-600 mb-4">
              Immediately stop accepting new orders platform-wide
            </p>
            <Button
              danger
              size="large"
              icon={<PauseCircleOutlined />}
              onClick={() => handleEmergencyAction('pause')}
            >
              Pause Orders
            </Button>
          </div>
        </Card>

        <Card
          hoverable
          className="border-2 border-yellow-500 shadow-lg hover:shadow-xl transition-shadow"
        >
          <div className="text-center py-4">
            <StopOutlined className="text-6xl text-yellow-600 mb-4" />
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Maintenance Mode</h3>
            <p className="text-slate-600 mb-4">
              Enable maintenance mode for system updates
            </p>
            <Button
              type="primary"
              size="large"
              icon={<StopOutlined />}
              onClick={() => handleEmergencyAction('maintenance')}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              Enable Maintenance
            </Button>
          </div>
        </Card>

        <Card
          hoverable
          className="border-2 border-green-500 shadow-lg hover:shadow-xl transition-shadow"
        >
          <div className="text-center py-4">
            <PlayCircleOutlined className="text-6xl text-green-600 mb-4" />
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Resume Operations</h3>
            <p className="text-slate-600 mb-4">
              Restore normal operations and accept orders
            </p>
            <Button
              type="primary"
              size="large"
              icon={<PlayCircleOutlined />}
              onClick={() => handleEmergencyAction('resume')}
              className="bg-green-600 hover:bg-green-700"
            >
              Resume Operations
            </Button>
          </div>
        </Card>

        <Card
          hoverable
          className="border-2 border-purple-500 shadow-lg hover:shadow-xl transition-shadow"
        >
          <div className="text-center py-4">
            <NotificationOutlined className="text-6xl text-purple-600 mb-4" />
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Broadcast Message</h3>
            <p className="text-slate-600 mb-4">
              Send urgent message to all users
            </p>
            <Button
              type="primary"
              size="large"
              icon={<NotificationOutlined />}
              onClick={() => handleEmergencyAction('broadcast')}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Broadcast Now
            </Button>
          </div>
        </Card>
      </div>

      <Modal
        title={`Confirm ${action.toUpperCase()} Action`}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsModalVisible(false)}>
            Cancel
          </Button>,
          <Button key="confirm" type="primary" danger>
            Confirm Action
          </Button>,
        ]}
      >
        <Space direction="vertical" className="w-full">
          <Alert
            message="This action will be logged and audited"
            type="warning"
            showIcon
          />
          <TextArea
            rows={4}
            placeholder="Please provide a reason for this emergency action..."
            required
          />
        </Space>
      </Modal>
    </div>
  );
};

