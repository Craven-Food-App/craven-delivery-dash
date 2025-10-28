import React, { useState, useEffect } from 'react';
import { Table, Button, Tag, Modal, message, InputNumber, Input, Select } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, DollarOutlined } from '@ant-design/icons';
import { supabase } from '@/integrations/supabase/client';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

interface Approval {
  id: string;
  request_type: string;
  requester_name: string;
  amount: number;
  description: string;
  status: string;
  priority: string;
  requested_date: string;
}

export const FinancialApprovals: React.FC = () => {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');

  useEffect(() => {
    fetchApprovals();
  }, []);

  const fetchApprovals = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ceo_financial_approvals')
        .select('*')
        .order('requested_date', { ascending: false });

      if (error) throw error;
      setApprovals(data || []);
    } catch (error) {
      console.error('Error fetching approvals:', error);
      message.error('Failed to load approvals');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (approval: Approval) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('ceo_financial_approvals')
        .update({
          status: 'approved',
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          review_notes: reviewNotes
        })
        .eq('id', approval.id);

      if (error) throw error;

      await supabase.rpc('log_ceo_action', {
        p_action_type: 'approved_financial_request',
        p_action_category: 'financial',
        p_target_type: 'financial_approval',
        p_target_id: approval.id,
        p_target_name: approval.description,
        p_description: `Approved ${approval.request_type} request for $${approval.amount.toLocaleString()} from ${approval.requester_name}`,
        p_severity: 'high'
      });

      message.success(`✅ Approved $${approval.amount.toLocaleString()} request`);
      setModalVisible(false);
      setReviewNotes('');
      fetchApprovals();
    } catch (error: any) {
      console.error('Error approving:', error);
      message.error(error.message || 'Failed to approve');
    }
  };

  const handleDeny = async (approval: Approval) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('ceo_financial_approvals')
        .update({
          status: 'denied',
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          review_notes: reviewNotes
        })
        .eq('id', approval.id);

      if (error) throw error;

      await supabase.rpc('log_ceo_action', {
        p_action_type: 'denied_financial_request',
        p_action_category: 'financial',
        p_target_type: 'financial_approval',
        p_target_id: approval.id,
        p_target_name: approval.description,
        p_description: `Denied ${approval.request_type} request for $${approval.amount.toLocaleString()} from ${approval.requester_name}`,
        p_severity: 'high'
      });

      message.success('Request denied');
      setModalVisible(false);
      setReviewNotes('');
      fetchApprovals();
    } catch (error: any) {
      console.error('Error denying:', error);
      message.error(error.message || 'Failed to deny');
    }
  };

  const columns = [
    {
      title: 'Type',
      dataIndex: 'request_type',
      key: 'request_type',
      render: (type: string) => {
        const colors: Record<string, string> = {
          expense: 'blue',
          budget: 'purple',
          bonus: 'green',
          raise: 'orange',
          investment: 'red',
        };
        return <Tag color={colors[type]}>{type.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Requester',
      dataIndex: 'requester_name',
      key: 'requester_name',
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => (
        <span className="font-bold text-green-600">${amount.toLocaleString()}</span>
      ),
      sorter: (a: Approval, b: Approval) => a.amount - b.amount,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string) => {
        const colors: Record<string, string> = {
          low: 'default',
          normal: 'blue',
          high: 'orange',
          urgent: 'red',
        };
        return <Tag color={colors[priority]}>{priority.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Date',
      dataIndex: 'requested_date',
      key: 'requested_date',
      render: (date: string) => dayjs(date).format('MMM D, YYYY'),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors: Record<string, string> = {
          pending: 'gold',
          approved: 'green',
          denied: 'red',
          'on-hold': 'orange',
        };
        return <Tag color={colors[status]}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Approval) => (
        record.status === 'pending' ? (
          <div className="space-x-2">
            <Button
              type="primary"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => {
                setSelectedApproval(record);
                setModalVisible(true);
              }}
            >
              Review
            </Button>
          </div>
        ) : null
      ),
    },
  ];

  const pendingApprovals = approvals.filter(a => a.status === 'pending');
  const totalPendingAmount = pendingApprovals.reduce((sum, a) => sum + a.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Financial Approvals</h2>
          <p className="text-slate-600">Review and approve financial requests</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-slate-600">Pending Requests</div>
          <div className="text-3xl font-bold text-orange-600">{pendingApprovals.length}</div>
          <div className="text-sm text-slate-500">${totalPendingAmount.toLocaleString()} total</div>
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={approvals}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        className="shadow-lg"
      />

      <Modal
        title={`Review: ${selectedApproval?.description}`}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setReviewNotes('');
        }}
        footer={null}
        width={600}
      >
        {selectedApproval && (
          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-slate-600">Requester</div>
                  <div className="font-semibold">{selectedApproval.requester_name}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-600">Amount</div>
                  <div className="text-2xl font-bold text-green-600">
                    ${selectedApproval.amount.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-slate-600">Type</div>
                  <div className="font-semibold capitalize">{selectedApproval.request_type}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-600">Priority</div>
                  <Tag color={selectedApproval.priority === 'urgent' ? 'red' : 'orange'}>
                    {selectedApproval.priority.toUpperCase()}
                  </Tag>
                </div>
              </div>
              <div className="mt-4">
                <div className="text-sm text-slate-600 mb-1">Description</div>
                <div>{selectedApproval.description}</div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Review Notes</label>
              <TextArea
                rows={4}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Add notes about your decision..."
              />
            </div>

            <div className="flex gap-3">
              <Button
                type="primary"
                size="large"
                icon={<CheckCircleOutlined />}
                onClick={() => handleApprove(selectedApproval)}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                Approve
              </Button>
              <Button
                danger
                size="large"
                icon={<CloseCircleOutlined />}
                onClick={() => handleDeny(selectedApproval)}
                className="flex-1"
              >
                Deny
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
