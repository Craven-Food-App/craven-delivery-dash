import React, { useState, useEffect } from 'react';
import { Card, Checkbox, Row, Col, Progress, Button, Space, Typography, Badge, Alert, Statistic, Divider } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, ExclamationCircleOutlined, RocketOutlined, TeamOutlined, BugOutlined, FileTextOutlined } from '@ant-design/icons';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

interface DailyTask {
  id: string;
  task_category: string;
  task_name: string;
  task_description?: string;
  completed: boolean;
  priority: string;
}

const taskCategories = [
  { key: 'morning_review', label: 'Morning Technical Review', icon: <ClockCircleOutlined />, color: '#1890ff' },
  { key: 'development', label: 'Development Leadership', icon: <RocketOutlined />, color: '#52c41a' },
  { key: 'strategic', label: 'Strategic Responsibilities', icon: <ExclamationCircleOutlined />, color: '#faad14' },
  { key: 'coordination', label: 'Executive Coordination', icon: <TeamOutlined />, color: '#722ed1' },
  { key: 'stability', label: 'Stability & Compliance', icon: <CheckCircleOutlined />, color: '#13c2c2' },
  { key: 'product', label: 'Product Development', icon: <BugOutlined />, color: '#eb2f96' },
  { key: 'documentation', label: 'Documentation & Reporting', icon: <FileTextOutlined />, color: '#f5222d' },
];

export default function CTODailyWorkflow() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [today] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchTodayTasks();
    initializeDefaultTasks();
  }, []);

  const initializeDefaultTasks = async () => {
    const { data: existing } = await supabase
      .from('cto_daily_checklist')
      .select('id')
      .eq('checklist_date', today);

    if (!existing || existing.length === 0) {
      const defaultTasks = [
        // Morning Review
        { task_category: 'morning_review', task_name: 'Infrastructure & System Health Check', priority: 'high' },
        { task_category: 'morning_review', task_name: 'Active Sprint Check-In', priority: 'high' },
        { task_category: 'morning_review', task_name: 'Security Review (Quick Scan)', priority: 'normal' },
        // Development
        { task_category: 'development', task_name: 'Review Pull Requests', priority: 'high' },
        { task_category: 'development', task_name: 'Manage Developer Team', priority: 'high' },
        { task_category: 'development', task_name: 'System & Feature Planning', priority: 'normal' },
        // Strategic
        { task_category: 'strategic', task_name: 'Architecture Governance', priority: 'normal' },
        { task_category: 'strategic', task_name: 'Technology Roadmap Review', priority: 'normal' },
        { task_category: 'strategic', task_name: 'Data & Analytics Management', priority: 'normal' },
        // Coordination
        { task_category: 'coordination', task_name: 'CEO Sync Meeting', priority: 'high' },
        { task_category: 'coordination', task_name: 'CFO Sync (if needed)', priority: 'normal' },
        { task_category: 'coordination', task_name: 'Department Syncs (as needed)', priority: 'low' },
        // Stability
        { task_category: 'stability', task_name: 'Security Maintenance', priority: 'normal' },
        { task_category: 'stability', task_name: 'Backup & Redundancy Check', priority: 'normal' },
        { task_category: 'stability', task_name: 'Deployment Reliability Review', priority: 'normal' },
        // Product
        { task_category: 'product', task_name: 'Feature Scoping', priority: 'normal' },
        { task_category: 'product', task_name: 'QA Testing Review', priority: 'normal' },
        // Documentation
        { task_category: 'documentation', task_name: 'Sprint Updates', priority: 'normal' },
        { task_category: 'documentation', task_name: 'Deployment Notes', priority: 'normal' },
        { task_category: 'documentation', task_name: 'Daily CTO Report', priority: 'high' },
      ];

      await supabase.from('cto_daily_checklist').insert(
        defaultTasks.map(task => ({
          ...task,
          checklist_date: today,
          task_description: getTaskDescription(task.task_name),
        }))
      );
      fetchTodayTasks();
    }
  };

  const getTaskDescription = (taskName: string): string => {
    const descriptions: Record<string, string> = {
      'Infrastructure & System Health Check': 'Check error logs, server uptime, API latency, Supabase metrics, deployment status',
      'Active Sprint Check-In': 'Review all engineering tickets, update sprint burndown, assign tasks',
      'Security Review (Quick Scan)': 'Check for new vulnerabilities, dependency updates, auth alerts',
      'Review Pull Requests': 'Review and merge approved code, reject faulty code',
      'Manage Developer Team': 'Assign tickets, approve timeline changes, unblock developers',
      'System & Feature Planning': 'Plan next releases, review feature proposals, architecture diagrams',
      'Architecture Governance': 'Oversee entire Crave\'n technical ecosystem',
      'Technology Roadmap Review': 'Maintain 12-month engineering roadmap',
      'Data & Analytics Management': 'Ensure proper data tracking, review dashboards',
      'CEO Sync Meeting': 'Discuss progress, blockers, timelines, improvements',
      'CFO Sync (if needed)': 'Review infrastructure costs, engineering spend',
      'Department Syncs (as needed)': 'Coordinate with Operations, Marketing, Restaurant teams',
      'Security Maintenance': 'Access control, key rotation, database permissions',
      'Backup & Redundancy Check': 'Ensure daily backups, environment isolation',
      'Deployment Reliability Review': 'Zero-downtime releases, rollback plans',
      'Feature Scoping': 'Define requirements, UX flows, API endpoints',
      'QA Testing Review': 'Review bugs, verify fixes, approve builds',
      'Sprint Updates': 'Document sprint progress and updates',
      'Deployment Notes': 'Document all deployments and changes',
      'Daily CTO Report': 'Submit completed tasks, sprint status, blockers, risks',
    };
    return descriptions[taskName] || '';
  };

  const fetchTodayTasks = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('cto_daily_checklist')
        .select('*')
        .eq('checklist_date', today)
        .order('task_category', { ascending: true })
        .order('priority', { ascending: false });

      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = async (taskId: string, completed: boolean) => {
    try {
      await supabase
        .from('cto_daily_checklist')
        .update({
          completed: !completed,
          completed_at: !completed ? new Date().toISOString() : null,
        })
        .eq('id', taskId);

      fetchTodayTasks();
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount = tasks.length;
  const completionPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#f5222d';
      case 'high': return '#fa8c16';
      case 'normal': return '#1890ff';
      case 'low': return '#8c8c8c';
      default: return '#8c8c8c';
    }
  };

  return (
    <div>
      <Row gutter={16} className="mb-6">
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="Today's Progress"
              value={completionPercent}
              suffix="%"
              valueStyle={{ color: completionPercent === 100 ? '#3f8600' : '#1890ff' }}
              prefix={<CheckCircleOutlined />}
            />
            <Progress percent={completionPercent} status={completionPercent === 100 ? 'success' : 'active'} />
            <Text type="secondary" className="text-xs">
              {completedCount} of {totalCount} tasks completed
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="High Priority Tasks"
              value={tasks.filter(t => t.priority === 'high' || t.priority === 'urgent').filter(t => !t.completed).length}
              valueStyle={{ color: '#fa8c16' }}
              prefix={<ExclamationCircleOutlined />}
            />
            <Text type="secondary" className="text-xs">
              Remaining urgent/high priority
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Button type="primary" onClick={() => navigate('/cto?tab=sprint')}>
                View Active Sprint
              </Button>
              <Button onClick={() => navigate('/cto?tab=code-review')}>
                Code Review Queue
              </Button>
              <Button onClick={() => navigate('/cto?tab=daily-report')}>
                Submit Daily Report
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>

      {completionPercent < 50 && (
        <Alert
          message="Daily Workflow Status"
          description={`You have ${totalCount - completedCount} tasks remaining. Focus on high-priority items first.`}
          type="warning"
          showIcon
          className="mb-4"
        />
      )}

      <Divider>Daily Checklist by Category</Divider>

      <Row gutter={[16, 16]}>
        {taskCategories.map(category => {
          const categoryTasks = tasks.filter(t => t.task_category === category.key);
          const categoryCompleted = categoryTasks.filter(t => t.completed).length;
          const categoryTotal = categoryTasks.length;

          return (
            <Col xs={24} sm={12} lg={8} key={category.key}>
              <Card
                title={
                  <Space>
                    <span style={{ color: category.color }}>{category.icon}</span>
                    <span>{category.label}</span>
                    <Badge count={categoryTotal - categoryCompleted} style={{ backgroundColor: category.color }} />
                  </Space>
                }
                extra={
                  <Progress
                    type="circle"
                    percent={categoryTotal > 0 ? Math.round((categoryCompleted / categoryTotal) * 100) : 0}
                    size={40}
                    strokeColor={category.color}
                  />
                }
              >
                <Space direction="vertical" style={{ width: '100%' }} size="small">
                  {categoryTasks.map(task => (
                    <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Checkbox
                        checked={task.completed}
                        onChange={() => toggleTask(task.id, task.completed)}
                      />
                      <div style={{ flex: 1 }}>
                        <Text delete={task.completed} style={{ fontSize: '13px' }}>
                          {task.task_name}
                        </Text>
                        {task.task_description && (
                          <div>
                            <Text type="secondary" style={{ fontSize: '11px' }}>
                              {task.task_description}
                            </Text>
                          </div>
                        )}
                      </div>
                      <Badge
                        color={getPriorityColor(task.priority)}
                        text={task.priority}
                        style={{ fontSize: '10px' }}
                      />
                    </div>
                  ))}
                  {categoryTasks.length === 0 && (
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      No tasks for this category today
                    </Text>
                  )}
                </Space>
              </Card>
            </Col>
          );
        })}
      </Row>
    </div>
  );
}

