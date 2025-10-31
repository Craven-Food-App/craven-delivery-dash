// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Modal, Form, message, Space } from 'antd';
import { BulbOutlined, PlusOutlined, SaveOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { supabase } from '@/integrations/supabase/client';

interface MindMapNode {
  id: string;
  text: string;
  x: number;
  y: number;
  children: MindMapNode[];
  parentId?: string;
  color?: string;
}

export const StrategicMindMap: React.FC = () => {
  const [nodes, setNodes] = useState<MindMapNode[]>([
    { id: '1', text: 'Craven Delivery', x: 400, y: 300, children: [] }
  ]);
  const [selectedNode, setSelectedNode] = useState<MindMapNode | null>(null);
  const [editingNode, setEditingNode] = useState<MindMapNode | null>(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      fetchMindMap();
    } catch (err: any) {
      console.error('Error initializing mind map:', err);
      setError('Failed to load mind map');
    }
  }, []);

  const fetchMindMap = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ceo_mindmaps')
        .select('*')
        .eq('map_name', 'Strategic Overview')
        .maybeSingle();

      if (data && !error && data.map_data) {
        // Validate the data structure
        if (Array.isArray(data.map_data) && data.map_data.length > 0) {
          setNodes(data.map_data);
        }
      }
    } catch (error: any) {
      // Silently fail - table might not exist yet
      console.warn('Mind map table not available yet:', error?.message || error);
      // Keep default nodes
    } finally {
      setLoading(false);
    }
  };

  const saveMindMap = async () => {
    try {
      const { error } = await supabase
        .from('ceo_mindmaps')
        .upsert({
          map_name: 'Strategic Overview',
          map_data: nodes,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'map_name'
        });

      if (error) {
        // If table doesn't exist, show helpful message
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          message.warning('Mind map table not created yet. Please run DEPLOY-MINDMAP.sql first.');
        } else {
          throw error;
        }
      } else {
        message.success('Mind map saved!');
      }
    } catch (error: any) {
      console.error('Error saving mind map:', error);
      message.error('Failed to save mind map: ' + (error?.message || 'Unknown error'));
    }
  };

  const addChildNode = (parentId: string) => {
    const parentNode = findNode(nodes, parentId);
    if (!parentNode) return;

    const newId = Date.now().toString();
    const childCount = (parentNode.children || []).length;
    const angle = (childCount * 60) * (Math.PI / 180);
    const radius = 150;

    const newNode: MindMapNode = {
      id: newId,
      text: 'New Node',
      x: (parentNode.x || 0) + Math.cos(angle) * radius,
      y: (parentNode.y || 0) + Math.sin(angle) * radius,
      children: [],
      parentId: parentId,
      color: '#' + Math.floor(Math.random()*16777215).toString(16)
    };

    setNodes(updateNode(nodes, parentId, node => ({
      ...node,
      children: [...(node.children || []), newNode]
    })));
  };

  const updateNode = (nodeList: MindMapNode[], id: string, updater: (node: MindMapNode) => MindMapNode): MindMapNode[] => {
    return nodeList.map(node => {
      if (node.id === id) {
        const updated = updater(node);
        return { ...updated, children: updated.children || [] };
      }
      if (node.children && node.children.length > 0) {
        return { ...node, children: updateNode(node.children, id, updater) };
      }
      return { ...node, children: node.children || [] };
    });
  };

  const findNode = (nodeList: MindMapNode[], id: string): MindMapNode | null => {
    for (const node of nodeList) {
      if (node.id === id) return node;
      if (node.children && node.children.length > 0) {
        const found = findNode(node.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const deleteNode = (id: string) => {
    if (id === '1') {
      message.warning('Cannot delete root node!');
      return;
    }

    setNodes(nodeList => {
      const updated = [...nodeList];
      const deleteFromChildren = (children: MindMapNode[]): MindMapNode[] => {
        return (children || []).filter(child => {
          if (child.id === id) return false;
          if (child.children && child.children.length > 0) {
            child.children = deleteFromChildren(child.children);
          }
          return true;
        });
      };
      if (updated[0]) {
        updated[0] = { ...updated[0], children: deleteFromChildren(updated[0].children || []) };
      }
      return updated;
    });
    message.success('Node deleted');
  };

  const handleEdit = (node: MindMapNode) => {
    setEditingNode(node);
    form.setFieldsValue({ text: node.text });
  };

  const handleSaveEdit = () => {
    const values = form.getFieldsValue();
    if (!editingNode) return;

    setNodes(updateNode(nodes, editingNode.id, node => ({
      ...node,
      text: values.text
    })));

    setEditingNode(null);
    form.resetFields();
    message.success('Node updated');
  };

  const renderNode = (node: MindMapNode, depth: number = 0): JSX.Element | null => {
    if (!node || !node.id || !node.text) return null;
    if (depth > 10) return null; // Prevent infinite recursion
    
    const nodeSize = depth === 0 ? { width: 120, height: 80 } : { width: 100, height: 60 };
    
    try {
      return (
        <g key={node.id}>
          {(node.children || []).map(child => {
            if (!child || !child.id) return null;
            return (
              <line
                key={`line-${node.id}-${child.id}`}
                x1={node.x || 0}
                y1={(node.y || 0) + nodeSize.height / 2}
                x2={child.x || 0}
                y2={(child.y || 0) + 30}
                stroke="#94a3b8"
                strokeWidth="2"
              />
            );
          })}
          
          {(node.children || []).map(child => renderNode(child, depth + 1))}
          
          <g>
            <rect
              x={(node.x || 0) - nodeSize.width / 2}
              y={(node.y || 0) - nodeSize.height / 2}
              width={nodeSize.width}
              height={nodeSize.height}
              rx="8"
              fill={node.color || (depth === 0 ? '#3b82f6' : '#8b5cf6')}
              stroke={selectedNode?.id === node.id ? '#f59e0b' : '#475569'}
              strokeWidth={selectedNode?.id === node.id ? '3' : '2'}
              className="cursor-pointer hover:brightness-110 transition-all"
              onClick={() => setSelectedNode(node)}
            />
            <text
              x={node.x || 0}
              y={node.y || 0}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="white"
              fontSize={depth === 0 ? '16' : '14'}
              fontWeight="bold"
              className="pointer-events-none select-none"
            >
              {node.text || 'Untitled'}
            </text>
          </g>
        </g>
      );
    } catch (error) {
      console.error('Error rendering node:', error);
      return null;
    }
  };

  if (error) {
    return (
      <div className="p-4 border border-red-200 rounded-lg bg-red-50">
        <p className="text-red-600">Error: {error}</p>
        <Button onClick={() => setError(null)} className="mt-2">Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2 flex items-center gap-2">
            <BulbOutlined /> Strategic Mind Map
          </h2>
          <p className="text-slate-600">Visualize strategic relationships and brainstorm initiatives</p>
        </div>
        <Button
          type="primary"
          icon={<SaveOutlined />}
          onClick={saveMindMap}
          loading={loading}
        >
          Save Mind Map
        </Button>
      </div>

      {/* Mind Map Canvas */}
      <Card>
        <div className="border-2 border-gray-200 rounded-lg bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden">
          <svg width="100%" height="600px" className="bg-white">
            {nodes.map(node => renderNode(node)).filter(Boolean)}
          </svg>
        </div>

        {/* Controls */}
        {selectedNode && (
          <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <div>
                <strong className="text-lg">Node: {selectedNode.text}</strong>
                {selectedNode.parentId && <div className="text-sm text-gray-500">Parent: {findNode(nodes, selectedNode.parentId)?.text}</div>}
              </div>
              <Space>
                <Button
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={() => addChildNode(selectedNode.id)}
                >
                  Add Child
                </Button>
                <Button
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => handleEdit(selectedNode)}
                >
                  Edit
                </Button>
                <Button
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => deleteNode(selectedNode.id)}
                >
                  Delete
                </Button>
              </Space>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-4 text-sm text-gray-600 bg-blue-50 p-4 rounded-lg">
          <strong>How to use:</strong>
          <ol className="list-decimal list-inside space-y-1 mt-2">
            <li>Click on a node to select it</li>
            <li>Use "Add Child" to create a new branch</li>
            <li>Use "Edit" to change the text</li>
            <li>Use "Delete" to remove a node (except root)</li>
            <li>Click "Save Mind Map" to persist changes</li>
          </ol>
        </div>
      </Card>

      {/* Edit Modal */}
      <Modal
        title="Edit Node"
        open={!!editingNode}
        onOk={handleSaveEdit}
        onCancel={() => {
          setEditingNode(null);
          form.resetFields();
        }}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="text" label="Node Text" rules={[{ required: true }]}>
            <Input placeholder="Enter node text" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

