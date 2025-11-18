import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Modal, Form, Input, Select, Space, Badge, Typography, message, Tree, Tabs, Descriptions, Divider } from 'antd';
import { SaveOutlined, FileOutlined, FolderOutlined, SendOutlined, CheckCircleOutlined, CloseCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import Editor from '@monaco-editor/react';
import { supabase } from '@/integrations/supabase/client';
import { useCodeChangeRequests } from '@/hooks/useTechSupport';
import type { CodeChangeRequest } from '@/types/tech-support';

const { TextArea } = Input;
const { Title, Text } = Typography;
const { TabPane } = Tabs;

interface FileNode {
  title: string;
  key: string;
  isLeaf?: boolean;
  children?: FileNode[];
}

export default function CodeEditorPortal() {
  const [selectedRepository, setSelectedRepository] = useState<string>('craven-delivery');
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [fileContent, setFileContent] = useState<string>('');
  const [originalContent, setOriginalContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [requestModalVisible, setRequestModalVisible] = useState(false);
  const [form] = Form.useForm();
  const { requests, loading: requestsLoading, refetch: refetchRequests } = useCodeChangeRequests();
  const [pendingRequests, setPendingRequests] = useState<CodeChangeRequest[]>([]);
  const editorRef = useRef<any>(null);

  const repositories = [
    { value: 'craven-delivery', label: 'craven-delivery' },
    { value: 'craven-mobile', label: 'craven-mobile' },
    { value: 'craven-api', label: 'craven-api' },
  ];

  useEffect(() => {
    if (selectedRepository) {
      fetchFileTree();
    }
  }, [selectedRepository]);

  useEffect(() => {
    setPendingRequests(requests.filter(r => r.status === 'pending' || r.status === 'needs_changes'));
  }, [requests]);

  const callGitHubProxy = async (action: string, params: any) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Not authenticated');
    }

    // Use Supabase URL from client
    const supabaseUrl = 'https://xaxbucnjlrfkccsfiddq.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhheGJ1Y25qbHJma2Njc2ZpZGRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyODMyODAsImV4cCI6MjA3Mjg1OTI4MH0.3ETuLETgSEj6W8gYi7WAoUFDPNo4IwTjuSnVtt1BCFE';

    const response = await fetch(`${supabaseUrl}/functions/v1/github-proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': supabaseKey,
      },
      body: JSON.stringify({
        action,
        repository: selectedRepository,
        ...params,
      }),
    });

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'GitHub API error');
    }
    return result.data;
  };

  const fetchFileTree = async () => {
    setLoading(true);
    try {
      // Get default branch first
      const branches = await callGitHubProxy('get_branches', {});
      const defaultBranch = branches.find((b: any) => b.name === 'main' || b.name === 'master') || branches[0];
      if (!defaultBranch) {
        throw new Error('No branches found');
      }

      // Get repository tree
      const treeData = await callGitHubProxy('get_tree', { branch: defaultBranch.name });
      
      // Convert GitHub tree to Ant Design Tree format
      const buildTree = (items: any[]): FileNode[] => {
        const treeMap: Record<string, FileNode> = {};
        const rootNodes: FileNode[] = [];

        // First pass: create all nodes
        items.forEach((item: any) => {
          const pathParts = item.path.split('/');
          const fileName = pathParts[pathParts.length - 1];
          
          treeMap[item.path] = {
            title: fileName,
            key: item.path,
            isLeaf: item.type === 'blob',
            children: item.type === 'tree' ? [] : undefined,
          };
        });

        // Second pass: build hierarchy
        items.forEach((item: any) => {
          const pathParts = item.path.split('/');
          if (pathParts.length === 1) {
            // Root level
            rootNodes.push(treeMap[item.path]);
          } else {
            // Has parent
            const parentPath = pathParts.slice(0, -1).join('/');
            if (treeMap[parentPath]) {
              if (!treeMap[parentPath].children) {
                treeMap[parentPath].children = [];
              }
              treeMap[parentPath].children!.push(treeMap[item.path]);
            }
          }
        });

        return rootNodes;
      };

      const tree = buildTree(treeData.tree || []);
      setFileTree(tree);
    } catch (error: any) {
      console.error('Error fetching file tree:', error);
      message.error(error.message || 'Failed to load repository structure');
      setFileTree([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (filePath: string) => {
    if (!filePath || (filePath.includes('/') && !filePath.includes('.'))) {
      return; // Don't load directories
    }

    setSelectedFile(filePath);
    setLoading(true);
    try {
      // Get default branch
      const branches = await callGitHubProxy('get_branches', {});
      const defaultBranch = branches.find((b: any) => b.name === 'main' || b.name === 'master') || branches[0];
      if (!defaultBranch) {
        throw new Error('No branches found');
      }

      // Get file content from GitHub
      const fileData = await callGitHubProxy('get_file', {
        path: filePath,
        branch: defaultBranch.name,
      });

      const content = fileData.content || '';
      setFileContent(content);
      setOriginalContent(content);
    } catch (error: any) {
      console.error('Error loading file:', error);
      message.error(error.message || 'Failed to load file content');
      setFileContent('');
      setOriginalContent('');
    } finally {
      setLoading(false);
    }
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setFileContent(value);
    }
  };

  const handleSaveRequest = () => {
    if (!selectedFile) {
      message.warning('Please select a file first');
      return;
    }

    if (fileContent === originalContent) {
      message.info('No changes detected');
      return;
    }

    form.setFieldsValue({
      repository: selectedRepository,
      file_path: selectedFile,
      old_content: originalContent,
      new_content: fileContent,
      branch_name: `feature/${selectedFile.replace(/\//g, '-')}-${Date.now()}`,
    });
    setRequestModalVisible(true);
  };

  const handleSubmitRequest = async (values: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Generate request number
      let requestNumber = `CCR-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${Date.now().toString().slice(-4)}`;
      // Try to use RPC function if available, otherwise use generated number
      try {
        const { data: rpcNumber, error: numError } = await supabase.rpc('generate_code_request_number');
        if (!numError && rpcNumber) requestNumber = rpcNumber;
      } catch (e) {
        // Use generated number if RPC fails
      }

      const { error } = await supabase.from('code_change_requests').insert({
        ...values,
        developer_id: user?.id,
        request_number: requestNumber,
        status: 'pending',
      });

      if (error) throw error;
      message.success('Code change request submitted successfully');
      setRequestModalVisible(false);
      form.resetFields();
      refetchRequests();
    } catch (error: any) {
      message.error(error.message || 'Failed to submit code change request');
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const request = requests.find(r => r.id === requestId);
      if (!request) {
        throw new Error('Request not found');
      }

      // Get default branch
      const branches = await callGitHubProxy('get_branches', {});
      const defaultBranch = branches.find((b: any) => b.name === 'main' || b.name === 'master') || branches[0];
      if (!defaultBranch) {
        throw new Error('No branches found');
      }

      // Create branch if it doesn't exist
      try {
        await callGitHubProxy('create_branch', {
          branch: request.branch_name,
          base_branch: defaultBranch.name,
        });
      } catch (e: any) {
        // Branch might already exist, continue
        if (!e.message?.includes('already exists') && !e.message?.includes('Reference already exists')) {
          console.warn('Branch creation warning:', e);
        }
      }

      // Commit the file change to the branch
      await callGitHubProxy('commit_file', {
        path: request.file_path,
        branch: request.branch_name,
        content: request.new_content,
        commit_message: request.commit_message || `Update ${request.file_path}`,
      });

      // Create PR via GitHub API
      const prData = await callGitHubProxy('create_pr', {
        branch: request.branch_name,
        base_branch: defaultBranch.name,
        pr_title: request.commit_message || `Update ${request.file_path}`,
        pr_body: `Code change request: ${request.request_number}\n\nFile: ${request.file_path}\n\nThis PR was created from the CTO Portal Code Editor.`,
      });

      // Update request with PR info
      const { error } = await supabase
        .from('code_change_requests')
        .update({
          status: 'approved',
          reviewer_id: user?.id,
          github_pr_url: prData.html_url,
          github_pr_number: prData.number,
        })
        .eq('id', requestId);

      if (error) throw error;
      message.success(`Code change request approved. PR #${prData.number} created.`);
      refetchRequests();
    } catch (error: any) {
      console.error('Error approving request:', error);
      message.error(error.message || 'Failed to approve request');
    }
  };

  const handleRejectRequest = async (requestId: string, notes: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('code_change_requests')
        .update({
          status: 'rejected',
          reviewer_id: user?.id,
          review_notes: notes,
        })
        .eq('id', requestId);

      if (error) throw error;
      message.success('Code change request rejected');
      refetchRequests();
    } catch (error: any) {
      message.error(error.message || 'Failed to reject request');
    }
  };

  const hasChanges = fileContent !== originalContent;

  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <Title level={4} className="m-0">Code Editor Portal</Title>
        <Space>
          <Select
            value={selectedRepository}
            onChange={setSelectedRepository}
            style={{ width: 200 }}
          >
            {repositories.map(repo => (
              <Select.Option key={repo.value} value={repo.value}>
                {repo.label}
              </Select.Option>
            ))}
          </Select>
          {selectedFile && (
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSaveRequest}
              disabled={!hasChanges}
            >
              Submit Change Request
            </Button>
          )}
        </Space>
      </div>

      <div style={{ display: 'flex', gap: '16px', height: 'calc(100vh - 200px)' }}>
        {/* File Tree */}
        <Card style={{ width: '300px', overflow: 'auto' }}>
          <Title level={5}>Repository Files</Title>
          {loading ? (
            <div className="text-center p-4">Loading...</div>
          ) : (
            <Tree
              showLine
              treeData={fileTree}
              onSelect={(keys) => {
                if (keys.length > 0) {
                  handleFileSelect(keys[0] as string);
                }
              }}
              selectedKeys={[selectedFile]}
            />
          )}
        </Card>

        {/* Code Editor */}
        <Card style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {selectedFile ? (
            <>
              <div className="mb-2 flex justify-between items-center">
                <Text strong>{selectedFile}</Text>
                {hasChanges && (
                  <Badge status="warning" text="Unsaved Changes" />
                )}
              </div>
              <div style={{ flex: 1, border: '1px solid #d9d9d9', borderRadius: '4px' }}>
                <Editor
                  height="100%"
                  defaultLanguage="typescript"
                  value={fileContent}
                  onChange={handleEditorChange}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: true },
                    fontSize: 14,
                    wordWrap: 'on',
                    automaticLayout: true,
                  }}
                  onMount={(editor) => {
                    editorRef.current = editor;
                  }}
                />
              </div>
            </>
          ) : (
            <div className="text-center p-8 text-gray-400">
              Select a file from the tree to start editing
            </div>
          )}
        </Card>

        {/* Pending Requests */}
        <Card style={{ width: '350px', overflow: 'auto' }}>
          <Title level={5}>Pending Requests ({pendingRequests.length})</Title>
          {pendingRequests.length === 0 ? (
            <div className="text-center p-4 text-gray-400">No pending requests</div>
          ) : (
            <div style={{ maxHeight: 'calc(100vh - 300px)', overflowY: 'auto' }}>
              {pendingRequests.map((req) => (
                <Card key={req.id} size="small" className="mb-2">
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Request #">{req.request_number}</Descriptions.Item>
                    <Descriptions.Item label="File">{req.file_path}</Descriptions.Item>
                    <Descriptions.Item label="Developer">{req.developer?.email}</Descriptions.Item>
                    <Descriptions.Item label="Status">
                      <Badge status={req.status === 'pending' ? 'processing' : 'warning'} text={req.status} />
                    </Descriptions.Item>
                  </Descriptions>
                  <Space className="mt-2">
                    <Button
                      size="small"
                      type="primary"
                      icon={<CheckCircleOutlined />}
                      onClick={() => handleApproveRequest(req.id)}
                    >
                      Approve
                    </Button>
                    <Button
                      size="small"
                      danger
                      icon={<CloseCircleOutlined />}
                      onClick={() => {
                        Modal.confirm({
                          title: 'Reject Code Change Request',
                          content: (
                            <Input.TextArea
                              placeholder="Enter rejection reason..."
                              rows={4}
                              id="rejection-notes"
                            />
                          ),
                          onOk: () => {
                            const notes = (document.getElementById('rejection-notes') as HTMLTextAreaElement)?.value || '';
                            handleRejectRequest(req.id, notes);
                          },
                        });
                      }}
                    >
                      Reject
                    </Button>
                  </Space>
                </Card>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Submit Request Modal */}
      <Modal
        title="Submit Code Change Request"
        open={requestModalVisible}
        onCancel={() => setRequestModalVisible(false)}
        onOk={() => form.submit()}
        width={700}
      >
        <Form form={form} onFinish={handleSubmitRequest} layout="vertical">
          <Form.Item name="repository" label="Repository" rules={[{ required: true }]}>
            <Input disabled />
          </Form.Item>
          <Form.Item name="file_path" label="File Path" rules={[{ required: true }]}>
            <Input disabled />
          </Form.Item>
          <Form.Item name="branch_name" label="Branch Name" rules={[{ required: true }]}>
            <Input placeholder="feature/my-feature" />
          </Form.Item>
          <Form.Item name="commit_message" label="Commit Message" rules={[{ required: true }]}>
            <TextArea rows={3} placeholder="Describe your changes..." />
          </Form.Item>
          <Form.Item label="Changes Preview">
            <div style={{ maxHeight: '200px', overflow: 'auto', background: '#f5f5f5', padding: '8px', borderRadius: '4px' }}>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {form.getFieldValue('new_content')?.substring(0, 500)}
                {form.getFieldValue('new_content')?.length > 500 ? '...' : ''}
              </Text>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

