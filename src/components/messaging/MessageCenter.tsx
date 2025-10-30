// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { Table, Space, Button, Modal, Form, Input, Typography, Row, Col, message } from 'antd';
import { supabase } from '@/integrations/supabase/client';

export function MessageCenter() {
  const [threads, setThreads] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedThread, setSelectedThread] = useState<any | null>(null);
  const [messagesList, setMessagesList] = useState<any[]>([]);
  const [composeOpen, setComposeOpen] = useState(false);
  const [reply, setReply] = useState('');
  const [form] = Form.useForm();

  useEffect(() => {
    loadThreads();
  }, []);

  async function loadThreads() {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('message_threads')
        .select('id, subject, created_at, created_by')
        .order('created_at', { ascending: false });
      setThreads((data || []).map((t:any)=> ({ key: t.id, ...t })));
    } finally { setLoading(false); }
  }

  async function openThread(thread: any) {
    setSelectedThread(thread);
    setLoading(true);
    try {
      const { data } = await supabase
        .from('messages')
        .select('id, thread_id, sender_label, body, created_at')
        .eq('thread_id', thread.id)
        .order('created_at', { ascending: true });
      setMessagesList((data || []).map((m:any)=> ({ key: m.id, ...m })));
    } finally { setLoading(false); }
  }

  async function sendReply() {
    if (!selectedThread || !reply.trim()) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert({ thread_id: selectedThread.id, body: reply, sender_label: 'You' });
      if (error) throw error;
      setReply('');
      await openThread(selectedThread);
    } finally { setLoading(false); }
  }

  return (
    <div>
      <Row gutter={[16,16]}>
        <Col xs={24} md={10}>
          <Space style={{ marginBottom: 8 }}>
            <Button type="primary" onClick={()=> setComposeOpen(true)}>New Message</Button>
            <Button onClick={loadThreads}>Refresh</Button>
          </Space>
          <Table
            loading={loading}
            dataSource={threads}
            pagination={{ pageSize: 10 }}
            onRow={(rec)=> ({ onClick: ()=> openThread(rec) })}
            columns={[
              { title: 'Subject', dataIndex: 'subject' },
              { title: 'Created', dataIndex: 'created_at', render: (v:string)=> new Date(v).toLocaleString(), width: 180 },
            ]}
          />
        </Col>
        <Col xs={24} md={14}>
          {selectedThread ? (
            <div>
              <Typography.Title level={5} style={{ marginTop: 0 }}>{selectedThread.subject}</Typography.Title>
              <div style={{ maxHeight: 380, overflow:'auto', border:'1px solid #e5e7eb', borderRadius:8, padding:12, marginBottom:8 }}>
                {messagesList.map(m => (
                  <div key={m.id} style={{ marginBottom: 12 }}>
                    <div style={{ fontSize:12, color:'#64748b' }}>{m.sender_label} • {new Date(m.created_at).toLocaleString()}</div>
                    <div>{m.body}</div>
                  </div>
                ))}
              </div>
              <Space.Compact style={{ width: '100%' }}>
                <Input.TextArea value={reply} onChange={(e)=> setReply(e.target.value)} placeholder="Write a reply..." rows={2} />
                <Button type="primary" onClick={sendReply}>Send</Button>
              </Space.Compact>
            </div>
          ) : (
            <div style={{ color:'#64748b' }}>Select a thread to view messages.</div>
          )}
        </Col>
      </Row>

      <ComposeModal open={composeOpen} onClose={()=> setComposeOpen(false)} onCreated={async (threadId)=> { setComposeOpen(false); await loadThreads(); }} />
    </div>
  );
}

function ComposeModal({ open, onClose, onCreated }: { open: boolean; onClose: ()=>void; onCreated: (id:string)=>void }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  return (
    <Modal
      title="New Message"
      open={open}
      onCancel={onClose}
      onOk={async () => {
        const vals = await form.validateFields();
        setLoading(true);
        try {
          const { data: t, error: e1 } = await supabase.from('message_threads').insert({ subject: vals.subject }).select('id').single();
          if (e1) throw e1;
          await supabase.from('messages').insert({ thread_id: t.id, sender_label: 'You', body: vals.body });
          const recipients = (vals.recipients || '').split(',').map((s:string)=> s.trim()).filter(Boolean);
          if (recipients.length) {
            await supabase.from('message_participants').insert(recipients.map((r:string)=> ({ thread_id: t.id, user_label: r })));
          }
          onCreated(t.id);
          form.resetFields();
        } finally { setLoading(false); }
      }}
      confirmLoading={loading}
    >
      <Form layout="vertical" form={form}>
        <Form.Item name="subject" label="Subject" rules={[{ required: true }]}>
          <Input placeholder="Subject" />
        </Form.Item>
        <Form.Item name="recipients" label="Recipients" tooltip="Comma-separated emails or names">
          <Input placeholder="email1@example.com, email2@example.com" />
        </Form.Item>
        <Form.Item name="body" label="Message" rules={[{ required: true }]}>
          <Input.TextArea rows={4} placeholder="Write your message..." />
        </Form.Item>
      </Form>
    </Modal>
  );
}
