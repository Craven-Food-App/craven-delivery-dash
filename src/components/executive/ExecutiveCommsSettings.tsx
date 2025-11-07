import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Divider,
  Form,
  Input,
  Space,
  Spin,
  Switch,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd';
import { InfoCircleOutlined, ReloadOutlined, SaveOutlined } from '@ant-design/icons';
import { supabase } from '@/integrations/supabase/client';

interface ExecRecord {
  id: string;
  title: string | null;
  role: string;
  mention_handle: string | null;
  allow_direct_messages: boolean | null;
  user_id: string | null;
}

interface FormExecEntry {
  id: string;
  mention_handle: string;
  allow_direct_messages: boolean;
}

const { Text, Title, Paragraph } = Typography;

const sanitizeHandle = (handle: string) =>
  handle
    .trim()
    .replace(/^@+/, '')
    .toLowerCase();

const generateHandleFromTitle = (title?: string | null, fallbackRole?: string) => {
  if (!title && !fallbackRole) return '';
  const base = title || fallbackRole || '';
  return sanitizeHandle(
    base
      .split(/\s+/)
      .map((word, idx) => (idx === 0 ? word : word[0]))
      .join(''),
  );
};

const ExecutiveCommsSettings: React.FC = () => {
  const [form] = Form.useForm<{ executives: FormExecEntry[] }>();
  const [records, setRecords] = useState<ExecRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const executivesValues = Form.useWatch('executives', form) as FormExecEntry[] | undefined;

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('exec_users')
        .select('id, title, role, mention_handle, allow_direct_messages, user_id')
        .order('title', { ascending: true, nullsFirst: false });

      if (error) {
        throw error;
      }

      setRecords(data || []);
    } catch (err) {
      console.error('Failed to fetch executive communications settings:', err);
      message.error('Unable to load executive communications settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  useEffect(() => {
    const execEntries: FormExecEntry[] = (records || []).map((record) => ({
      id: record.id,
      mention_handle:
        record.mention_handle || generateHandleFromTitle(record.title, record.role),
      allow_direct_messages: record.allow_direct_messages ?? true,
    }));

    form.setFieldsValue({ executives: execEntries });
  }, [records, form]);

  const duplicates = useMemo(() => {
    const handles = (executivesValues || [])
      .map((entry: FormExecEntry) => sanitizeHandle(entry.mention_handle))
      .filter(Boolean);
    const seen = new Set<string>();
    const dupes = new Set<string>();
    handles.forEach((handle) => {
      if (seen.has(handle)) {
        dupes.add(handle);
      } else {
        seen.add(handle);
      }
    });
    return Array.from(dupes);
  }, [executivesValues]);

  const handleSave = async (values: { executives: FormExecEntry[] }) => {
    if (!values.executives || values.executives.length === 0) {
      message.warning('No executives available to update');
      return;
    }

    const normalized = values.executives.map((entry) => ({
      id: entry.id,
      mention_handle: sanitizeHandle(entry.mention_handle),
      allow_direct_messages: entry.allow_direct_messages,
    }));

    const emptyHandles = normalized.filter((entry) => !entry.mention_handle);
    if (emptyHandles.length > 0) {
      message.warning('Each executive must have a handle before saving');
      return;
    }

    const handleStrings = normalized.map((entry) => entry.mention_handle);
    const duplicatesLocal = handleStrings.filter(
      (handle, index) => handleStrings.indexOf(handle) !== index,
    );
    if (duplicatesLocal.length > 0) {
      message.error(
        `Duplicate handles detected: ${Array.from(new Set(duplicatesLocal)).join(', ')}`,
      );
      return;
    }

    setSaving(true);
    try {
      const updates = normalized.map((entry) =>
        supabase
          .from('exec_users')
          .update({
            mention_handle: entry.mention_handle,
            allow_direct_messages: entry.allow_direct_messages,
          })
          .eq('id', entry.id),
      );

      const results = await Promise.all(updates);
      const firstError = results.find((result) => result.error);
      if (firstError?.error) {
        throw firstError.error;
      }

      message.success('Executive communications settings updated');
      fetchRecords();
    } catch (err: any) {
      console.error('Failed to update executive communications settings:', err);
      message.error(err?.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleAutoFill = (index: number) => {
    const record = records[index];
    if (!record) return;
    const handle = generateHandleFromTitle(record.title, record.role);
    form.setFieldValue(['executives', index, 'mention_handle'], handle);
  };

  return (
    <Card style={{ borderRadius: 16 }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Title level={3} style={{ marginBottom: 8 }}>
            Communications Directory Settings
          </Title>
          <Paragraph type="secondary" style={{ marginBottom: 0 }}>
            Manage executive @handles and direct messaging permissions for secure communications.
          </Paragraph>
        </div>

        {duplicates.length > 0 && (
          <Alert
            type="warning"
            message={`Duplicate handles found: ${duplicates.join(', ')}`}
            showIcon
          />
        )}

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          disabled={loading || saving}
        >
          {loading ? (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <Spin size="large" />
            </div>
          ) : (
            <Form.List name="executives">
              {(fields) => (
                <Space direction="vertical" style={{ width: '100%' }} size="large">
                  {fields.map((field, index) => {
                    const record = records[index];
                    if (!record) return null;

                    return (
                      <Card key={record.id} size="small" style={{ borderRadius: 12 }}>
                        <Space
                          direction="vertical"
                          size="middle"
                          style={{ width: '100%' }}
                        >
                          <Form.Item name={[field.name, 'id']} hidden initialValue={record.id}>
                            <Input type="hidden" />
                          </Form.Item>

                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <div>
                              <Text strong style={{ fontSize: 16 }}>
                                {record.title || record.role.toUpperCase()}
                              </Text>
                              <div>
                                <Text type="secondary">Role ID: {record.role}</Text>
                              </div>
                              {record.user_id && (
                                <div>
                                  <Text type="secondary" style={{ fontSize: 12 }}>
                                    User ID: {record.user_id}
                                  </Text>
                                </div>
                              )}
                            </div>
                            <Tag color="blue" style={{ alignSelf: 'flex-start' }}>
                              Executive
                            </Tag>
                          </div>

                          <Form.Item
                            {...field}
                            label="@ Handle"
                            name={[field.name, 'mention_handle']}
                            rules={[
                              {
                                required: true,
                                message: 'Provide a unique handle',
                              },
                              {
                                pattern: /^[a-z0-9._-]+$/,
                                message:
                                  'Use lowercase letters, numbers, dot, underscore, or hyphen',
                              },
                            ]}
                          >
                            <Input
                              prefix="@"
                              placeholder="exec handle"
                              allowClear
                              onBlur={(event) => {
                                const value = sanitizeHandle(event.target.value);
                                form.setFieldValue(
                                  ['executives', index, 'mention_handle'],
                                  value,
                                );
                              }}
                              suffix={
                                <Tooltip title="Auto-generate from executive title">
                                  <span>
                                    <Button
                                      type="link"
                                      size="small"
                                      onClick={(event) => {
                                        event.preventDefault();
                                        handleAutoFill(index);
                                      }}
                                    >
                                      Suggest
                                    </Button>
                                  </span>
                                </Tooltip>
                              }
                            />
                          </Form.Item>

                          <Form.Item
                            {...field}
                            label="Allow direct messages?"
                            name={[field.name, 'allow_direct_messages']}
                            valuePropName="checked"
                          >
                            <Switch
                              checkedChildren="Enabled"
                              unCheckedChildren="Disabled"
                            />
                          </Form.Item>

                          <Alert
                            type="info"
                            showIcon
                            message={
                              <Space>
                                <InfoCircleOutlined />
                                <span>
                                  Handles let executives reach this leader via <strong>@alias</strong> in
                                  secure messages.
                                </span>
                              </Space>
                            }
                          />
                        </Space>
                      </Card>
                    );
                  })}
                </Space>
              )}
            </Form.List>
          )}

          <Divider />

          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Button icon={<ReloadOutlined />} onClick={fetchRecords} disabled={loading || saving}>
              Refresh
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={saving}
              disabled={loading}
            >
              Save Changes
            </Button>
          </Space>
        </Form>
      </Space>
    </Card>
  );
};

export default ExecutiveCommsSettings;

