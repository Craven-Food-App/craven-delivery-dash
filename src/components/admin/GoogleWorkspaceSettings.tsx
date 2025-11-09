import { useState } from "react";
import { Card, Form, Input, Button, Space, Typography, Alert } from "antd";
import { MailOutlined, SafetyOutlined, UserOutlined } from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

interface GoogleWorkspaceConfig {
  serviceAccountEmail: string;
  privateKey: string;
  delegatedUser: string;
  defaultFrom: string;
  executiveFrom?: string;
  treasuryFrom?: string;
}

export default function GoogleWorkspaceSettings() {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const [testing, setTesting] = useState(false);

  const { data: config, isLoading } = useQuery({
    queryKey: ["google-workspace-config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ceo_system_settings")
        .select("setting_value")
        .eq("setting_key", "google_workspace_email")
        .maybeSingle();

      if (error) throw error;
      return data?.setting_value ? (data.setting_value as unknown as GoogleWorkspaceConfig) : null;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (values: GoogleWorkspaceConfig) => {
      const { data: existing } = await supabase
        .from("ceo_system_settings")
        .select("id")
        .eq("setting_key", "google_workspace_email")
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("ceo_system_settings")
          .update({ setting_value: values as any })
          .eq("setting_key", "google_workspace_email");
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("ceo_system_settings")
          .insert({
            setting_key: "google_workspace_email",
            setting_value: values as any,
            category: "email",
            description: "Google Workspace email configuration",
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["google-workspace-config"] });
      toast.success("Google Workspace settings saved successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to save settings: ${error.message}`);
    },
  });

  const handleSave = (values: GoogleWorkspaceConfig) => {
    saveMutation.mutate(values);
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <Space direction="vertical" size="large" className="w-full">
        <div>
          <Title level={3}>
            <MailOutlined className="mr-2" />
            Google Workspace Email Configuration
          </Title>
          <Paragraph type="secondary">
            Configure Google Workspace API credentials to enable email sending from the platform.
          </Paragraph>
        </div>

        <Alert
          message="Setup Instructions"
          description={
            <ol className="ml-4 mt-2 space-y-1">
              <li>Go to Google Cloud Console and create a service account</li>
              <li>Enable Gmail API for your project</li>
              <li>Create and download a JSON key for the service account</li>
              <li>Enable domain-wide delegation for the service account</li>
              <li>In Google Workspace Admin, authorize the service account with scope: https://www.googleapis.com/auth/gmail.send</li>
              <li>Enter the credentials below</li>
            </ol>
          }
          type="info"
          showIcon
        />

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          initialValues={config || undefined}
        >
          <Form.Item
            label="Service Account Email"
            name="serviceAccountEmail"
            rules={[
              { required: true, message: "Please enter service account email" },
              { type: "email", message: "Please enter a valid email" },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="service-account@project-id.iam.gserviceaccount.com"
            />
          </Form.Item>

          <Form.Item
            label="Private Key"
            name="privateKey"
            rules={[{ required: true, message: "Please enter private key" }]}
            extra="Paste the entire private key from your service account JSON file, including BEGIN/END markers"
          >
            <TextArea
              rows={6}
              placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
            />
          </Form.Item>

          <Form.Item
            label="Delegated User Email"
            name="delegatedUser"
            rules={[
              { required: true, message: "Please enter delegated user email" },
              { type: "email", message: "Please enter a valid email" },
            ]}
            extra="The Google Workspace user account that will send emails"
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="admin@yourdomain.com"
            />
          </Form.Item>

          <Form.Item
            label="Default From Address"
            name="defaultFrom"
            rules={[
              { required: true, message: "Please enter default from address" },
            ]}
            extra='Format: "Display Name <email@domain.com>"'
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="Crave'N <noreply@craven.com>"
            />
          </Form.Item>

          <Form.Item
            label="Executive From Address (Optional)"
            name="executiveFrom"
            extra="Used for executive communications"
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="Crave'N HR <hr@craven.com>"
            />
          </Form.Item>

          <Form.Item
            label="Treasury From Address (Optional)"
            name="treasuryFrom"
            extra="Used for financial/treasury communications"
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="Crave'N Treasury <treasury@craven.com>"
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={saveMutation.isPending}
                icon={<SafetyOutlined />}
              >
                Save Configuration
              </Button>
              <Button onClick={() => form.resetFields()}>Reset</Button>
            </Space>
          </Form.Item>
        </Form>
      </Space>
    </Card>
  );
}
