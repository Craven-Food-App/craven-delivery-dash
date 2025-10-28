import React from 'react';
import { Card, Progress, Tag, Row, Col, Statistic } from 'antd';
import {
  RocketOutlined,
  TrophyOutlined,
  TeamOutlined,
  DollarOutlined,
} from '@ant-design/icons';

export const StrategicPlanning: React.FC = () => {
  const objectives = [
    {
      title: 'Q4 2025 Revenue Target',
      category: 'Revenue',
      target: 3000000,
      current: 2460000,
      progress: 82,
      status: 'on_track',
      icon: <DollarOutlined className="text-green-600" />,
    },
    {
      title: 'Driver Growth - 500 by EOY',
      category: 'Growth',
      target: 500,
      current: 487,
      progress: 97,
      status: 'on_track',
      icon: <TeamOutlined className="text-blue-600" />,
    },
    {
      title: 'Restaurant Partnerships - 200',
      category: 'Growth',
      target: 200,
      current: 134,
      progress: 67,
      status: 'at_risk',
      icon: <TrophyOutlined className="text-orange-600" />,
    },
    {
      title: 'Customer Satisfaction - 4.8/5.0',
      category: 'Operations',
      target: 4.8,
      current: 4.7,
      progress: 98,
      status: 'on_track',
      icon: <RocketOutlined className="text-purple-600" />,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Strategic Planning</h2>
        <p className="text-slate-600">Track company objectives and key results (OKRs)</p>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Total OKRs"
              value={4}
              valueStyle={{ color: '#3b82f6' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="On Track"
              value={3}
              valueStyle={{ color: '#059669' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="At Risk"
              value={1}
              valueStyle={{ color: '#f59e0b' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Avg Progress"
              value={86}
              suffix="%"
              valueStyle={{ color: '#8b5cf6' }}
            />
          </Card>
        </Col>
      </Row>

      <div className="grid grid-cols-1 gap-6">
        {objectives.map((obj, index) => (
          <Card key={index} className="shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-start gap-6">
              <div className="text-5xl">{obj.icon}</div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold text-slate-900">{obj.title}</h3>
                  <Tag color={obj.status === 'on_track' ? 'green' : 'orange'}>
                    {obj.status === 'on_track' ? 'On Track' : 'At Risk'}
                  </Tag>
                  <Tag>{obj.category}</Tag>
                </div>
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-slate-600 mb-2">
                    <span>
                      Current: <strong>{obj.current.toLocaleString()}</strong>
                    </span>
                    <span>
                      Target: <strong>{obj.target.toLocaleString()}</strong>
                    </span>
                  </div>
                  <Progress
                    percent={obj.progress}
                    status={obj.status === 'on_track' ? 'active' : 'exception'}
                    strokeColor={obj.status === 'on_track' ? '#059669' : '#f59e0b'}
                    trailColor="#e2e8f0"
                    strokeWidth={12}
                  />
                </div>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-blue-600">{obj.progress}%</div>
                <div className="text-sm text-slate-500">Progress</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

