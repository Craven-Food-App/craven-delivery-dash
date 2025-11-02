// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { Tabs, Typography, Button, Space, Layout, Divider, message } from 'antd';
import {
  FileTextOutlined,
  TeamOutlined,
  FileSearchOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { PersonnelManager } from '@/components/ceo/PersonnelManager';
import { AuditTrail } from '@/components/ceo/AuditTrail';
import DocumentGenerator from '@/components/hr/DocumentGenerator';
import DocumentPreview from '@/components/hr/DocumentPreview';
import SignaturePad from '@/components/hr/SignaturePad';
import DocumentDashboard from '@/components/hr/DocumentDashboard';
import { useExecAuth } from '@/hooks/useExecAuth';

const { Header, Content } = Layout;
const { TabPane } = Tabs;
const { Title } = Typography;

const HRPortal: React.FC = () => {
  const navigate = useNavigate();
  const { loading, user, execUser, isAuthorized, signOut } = useExecAuth();
  const [activeTab, setActiveTab] = useState('documents');
  const [generated, setGenerated] = useState<any>(null);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
        <div style={{ marginBottom: 16 }}>Access Denied</div>
        <Button onClick={() => navigate('/hub')}>Back to Hub</Button>
      </div>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh', background: '#ffffff' }}>
      <Header style={{ 
        background: '#ffffff', 
        borderBottom: '1px solid #e5e7eb',
        padding: '0 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Space>
          <Button
            type="default"
            size="middle"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/hub')}
          >
            Back to Hub
          </Button>
          <Title level={3} style={{ margin: 0, marginLeft: 16 }}>
            HR Portal
          </Title>
        </Space>
        <Space>
          <Button onClick={() => navigate('/ceo')}>CEO Portal</Button>
          <Button onClick={signOut}>Sign Out</Button>
        </Space>
      </Header>

      <Content style={{ padding: 24 }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          size="large"
          tabBarStyle={{ borderBottom: '2px solid #e2e8f0' }}
        >
          <TabPane
            tab={
              <span>
                <FileTextOutlined />
                Document Generator
              </span>
            }
            key="documents"
          >
            <DocumentGenerator onGenerated={(payload) => setGenerated(payload)} />
            {generated && (
              <>
                <Divider />
                <DocumentPreview html={generated.htmlPreview} fileUrl={generated.file_url} />
                <Divider />
                <SignaturePad
                  documentId={generated.document.id}
                  originalData={generated.data || generated.document}
                  onSigned={(url) => {
                    message.success(`Signed PDF saved: ${url}`);
                    setGenerated((prev: any) => ({ ...prev, signed_file_url: url }));
                  }}
                />
              </>
            )}
          </TabPane>

          <TabPane
            tab={
              <span>
                <FileSearchOutlined />
                Document Dashboard
              </span>
            }
            key="dashboard"
          >
            <DocumentDashboard />
          </TabPane>

          <TabPane
            tab={
              <span>
                <TeamOutlined />
                Personnel Management
              </span>
            }
            key="personnel"
          >
            <PersonnelManager />
          </TabPane>

          <TabPane
            tab={
              <span>
                <FileSearchOutlined />
                Audit Trail
              </span>
            }
            key="audit"
          >
            <AuditTrail />
          </TabPane>
        </Tabs>
      </Content>
    </Layout>
  );
};

export default HRPortal;

