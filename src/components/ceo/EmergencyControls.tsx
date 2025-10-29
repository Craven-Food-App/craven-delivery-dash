// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Card, Switch, Button, Modal, Input, message, Alert } from 'antd';
import {
  PauseCircleOutlined,
  PlayCircleOutlined,
  WarningOutlined,
  BellOutlined,
  ToolOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import { supabase } from '@/integrations/supabase/client';

const { TextArea } = Input;

interface SystemSetting {
  id: string;
  setting_key: string;
  setting_value: any;
  category: string;
  description: string;
  is_critical: boolean;
  requires_confirmation: boolean;
}

export const EmergencyControls: React.FC = () => {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(false);
  const [confirmModal, setConfirmModal] = useState(false);
  const [selectedSetting, setSelectedSetting] = useState<SystemSetting | null>(null);
  const [confirmationReason, setConfirmationReason] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ceo_system_settings')
        .select('*')
        .order('is_critical', { ascending: false });

      if (error) throw error;
      setSettings(data || []);
    } catch (error) {
      console.error('Error fetching settings:', error);
      message.error('Failed to load system settings');
    } finally {
      setLoading(false);
    }
  };

  const toggleSetting = async (setting: SystemSetting) => {
    if (setting.requires_confirmation) {
      setSelectedSetting(setting);
      setConfirmModal(true);
      return;
    }
    await updateSetting(setting);
  };

  const updateSetting = async (setting: SystemSetting) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const newEnabled = !setting.setting_value.enabled;

      const { error } = await supabase
        .from('ceo_system_settings')
        .update({
          setting_value: { ...setting.setting_value, enabled: newEnabled },
          last_changed_by: user?.id,
          last_changed_at: new Date().toISOString()
        })
        .eq('id', setting.id);

      if (error) throw error;

      await supabase.rpc('log_ceo_action', {
        p_action_type: `toggle_${setting.setting_key}`,
        p_action_category: 'emergency',
        p_target_type: 'system_setting',
        p_target_id: setting.id,
        p_target_name: setting.setting_key,
        p_description: `${newEnabled ? 'Enabled' : 'Disabled'} ${setting.description}${confirmationReason ? `: ${confirmationReason}` : ''}`,
        p_severity: setting.is_critical ? 'critical' : 'high'
      });

      message.success(`${newEnabled ? 'Enabled' : 'Disabled'} ${setting.description}`);
      setConfirmModal(false);
      setConfirmationReason('');
      fetchSettings();
    } catch (error: any) {
      console.error('Error updating setting:', error);
      message.error(error.message || 'Failed to update setting');
    }
  };

  const getSettingIcon = (key: string) => {
    const icons: Record<string, any> = {
      system_maintenance_mode: <ToolOutlined className="text-2xl" />,
      orders_paused: <PauseCircleOutlined className="text-2xl" />,
      payment_processing: <DollarOutlined className="text-2xl" />,
      emergency_alerts: <BellOutlined className="text-2xl" />,
    };
    return icons[key] || <WarningOutlined className="text-2xl" />;
  };

  const getSettingColor = (setting: SystemSetting) => {
    if (setting.is_critical) {
      return setting.setting_value.enabled ? 'border-red-500' : 'border-green-500';
    }
    return setting.setting_value.enabled ? 'border-green-500' : 'border-gray-300';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Emergency Controls</h2>
        <p className="text-slate-600">System-wide toggles and emergency settings</p>
      </div>

      <Alert
        message="⚠️ Critical Controls"
        description="These settings affect the entire platform. Use with caution."
        type="warning"
        showIcon
        className="mb-4"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {settings.map((setting) => (
          <Card
            key={setting.id}
            className={`border-2 ${getSettingColor(setting)} hover:shadow-lg transition-shadow`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <div className={setting.setting_value.enabled ? 'text-green-600' : 'text-gray-400'}>
                  {getSettingIcon(setting.setting_key)}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">
                    {setting.description}
                  </h3>
                  <div className="flex items-center gap-2">
                    {setting.is_critical && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                        CRITICAL
                      </span>
                    )}
                    <span className="text-xs text-slate-500 capitalize">
                      {setting.category}
                    </span>
                  </div>
                </div>
              </div>
              <Switch
                checked={setting.setting_value.enabled}
                onChange={() => toggleSetting(setting)}
                loading={loading}
                checkedChildren={<PlayCircleOutlined />}
                unCheckedChildren={<PauseCircleOutlined />}
                className={setting.setting_value.enabled ? 'bg-green-600' : ''}
              />
            </div>
            {setting.setting_value.enabled && setting.setting_value.reason && (
              <div className="mt-3 p-2 bg-yellow-50 rounded text-sm text-yellow-800">
                <strong>Reason:</strong> {setting.setting_value.reason}
              </div>
            )}
          </Card>
        ))}
      </div>

      <Modal
        title={
          <div className="flex items-center gap-2">
            <WarningOutlined className="text-red-600" />
            <span>Confirm Critical Action</span>
          </div>
        }
        open={confirmModal}
        onCancel={() => {
          setConfirmModal(false);
          setConfirmationReason('');
        }}
        footer={null}
        width={500}
      >
        {selectedSetting && (
          <div className="space-y-4">
            <Alert
              message="This is a critical system setting"
              description={`You are about to ${selectedSetting.setting_value.enabled ? 'DISABLE' : 'ENABLE'} ${selectedSetting.description}. This action will be logged.`}
              type="error"
              showIcon
            />

            <div>
              <label className="block text-sm font-medium mb-2">
                Reason for this action <span className="text-red-500">*</span>
              </label>
              <TextArea
                rows={3}
                value={confirmationReason}
                onChange={(e) => setConfirmationReason(e.target.value)}
                placeholder="Explain why this action is necessary..."
              />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setConfirmModal(false);
                  setConfirmationReason('');
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="primary"
                danger
                onClick={() => updateSetting(selectedSetting)}
                disabled={!confirmationReason.trim()}
                className="flex-1"
              >
                Confirm Action
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
