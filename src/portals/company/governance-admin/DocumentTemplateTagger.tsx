import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Stack, Group, Text, Badge, Loader, Center, Paper, Select } from '@mantine/core';
import { supabase } from '@/integrations/supabase/client';
import { notifications } from '@mantine/notifications';
import { IconX, IconSignature, IconCalendar, IconTypography, IconUser, IconMail, IconBuilding, IconBriefcase, IconArrowsMove } from '@tabler/icons-react';

interface SignatureField {
  id?: string;
  field_type: 'signature' | 'initial' | 'date' | 'text' | 'name' | 'email' | 'company' | 'title';
  signer_role: string;
  page_number: number;
  x: number; // Pixel position
  y: number; // Pixel position
  width: number; // Pixel width
  height: number; // Pixel height
  label?: string;
  required: boolean;
}

interface DocumentTemplateTaggerProps {
  templateId: string;
  templateKey: string;
  documentUrl: string;
  onSave?: () => void;
}

const DocumentTemplateTagger: React.FC<DocumentTemplateTaggerProps> = ({
  templateId,
  templateKey,
  documentUrl,
  onSave,
}) => {
  const [fields, setFields] = useState<SignatureField[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedField, setSelectedField] = useState<SignatureField | null>(null);
  const [draggedField, setDraggedField] = useState<any>(null);
  const [isDraggingField, setIsDraggingField] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [selectedRole, setSelectedRole] = useState<string>('officer');
  const documentRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const signerRoles = [
    { value: 'officer', label: 'Officer', color: '#3b82f6' },
    { value: 'executive', label: 'Executive', color: '#8b5cf6' },
    { value: 'secretary', label: 'Secretary', color: '#10b981' },
    { value: 'incorporator', label: 'Incorporator', color: '#f59e0b' },
    { value: 'notary', label: 'Notary', color: '#ef4444' },
    { value: 'founder', label: 'Founder', color: '#ec4899' },
    { value: 'board_member', label: 'Board Member', color: '#6366f1' },
  ];

  const fieldTypes = [
    { type: 'signature', label: 'Signature', icon: IconSignature, color: '#fef3c7', borderColor: '#e5b341' },
    { type: 'initial', label: 'Initial', icon: IconTypography, color: '#fef3c7', borderColor: '#e5b341' },
    { type: 'date', label: 'Date Signed', icon: IconCalendar, color: '#e9d5ff', borderColor: '#a855f7' },
    { type: 'text', label: 'Text', icon: IconTypography, color: '#dbeafe', borderColor: '#3b82f6' },
    { type: 'name', label: 'Full Name', icon: IconUser, color: '#fce7f3', borderColor: '#ec4899' },
    { type: 'email', label: 'Email', icon: IconMail, color: '#d1fae5', borderColor: '#10b981' },
    { type: 'company', label: 'Company', icon: IconBuilding, color: '#e0e7ff', borderColor: '#6366f1' },
    { type: 'title', label: 'Title', icon: IconBriefcase, color: '#cffafe', borderColor: '#06b6d4' },
  ];

  useEffect(() => {
    fetchFields();
  }, [templateId]);

  // Add global mouse move handler for dragging fields - ONLY when actively dragging
  useEffect(() => {
    if (!isDraggingField || !selectedField || !documentRef.current) {
      return;
    }

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDraggingField || !selectedField || !documentRef.current) return;
      
      e.preventDefault();
      e.stopPropagation();
      
      const rect = documentRef.current.getBoundingClientRect();
      // Account for padding: 60px top, 80px left
      // Calculate position relative to Paper container (not viewport)
      const x = Math.max(0, e.clientX - rect.left - 80 - dragOffset.x);
      const y = Math.max(0, e.clientY - rect.top - 60 - dragOffset.y);

      setFields(prevFields => 
        prevFields.map(f => 
          f.id === selectedField.id 
            ? { ...f, x, y }
            : f
        )
      );
    };

    const handleGlobalMouseUp = () => {
      setIsDraggingField(false);
    };

    document.addEventListener('mousemove', handleGlobalMouseMove, { passive: false });
    document.addEventListener('mouseup', handleGlobalMouseUp);
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDraggingField, selectedField, dragOffset]);

  const fetchFields = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('document_template_signature_fields')
        .select('*')
        .eq('template_id', templateId)
        .order('page_number', { ascending: true });

      if (error) throw error;
      
      // Convert percentage-based fields to pixel-based
      // Default document dimensions: 700px wide (accounting for 160px total padding), 1000px tall (accounting for 120px total padding)
      const defaultDocWidth = 700;
      const defaultDocHeight = 1000;
      const convertedFields = (data || []).map(f => ({
        ...f,
        field_type: f.field_type as any,
        x: f.x_percent ? (f.x_percent / 100) * defaultDocWidth : 0,
        y: f.y_percent ? (f.y_percent / 100) * defaultDocHeight : 0,
        width: f.width_percent ? (f.width_percent / 100) * defaultDocWidth : 150,
        height: f.height_percent ? (f.height_percent / 100) * defaultDocHeight : 35,
      }));
      
      setFields(convertedFields);
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to load signature fields',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFieldDragStart = (fieldType: any, e: React.DragEvent) => {
    setDraggedField(fieldType);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDocumentDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedField || !documentRef.current) return;

    const rect = documentRef.current.getBoundingClientRect();
    // Account for padding: 60px top, 80px left
    const x = e.clientX - rect.left - 80;
    const y = e.clientY - rect.top - 60;

    const newField: SignatureField = {
      id: Date.now().toString(),
      field_type: draggedField.type,
      signer_role: selectedRole,
      page_number: 1,
      x: Math.max(0, x),
      y: Math.max(0, y),
      width: draggedField.type === 'signature' ? 200 : 150,
      height: draggedField.type === 'signature' ? 50 : 35,
      label: draggedField.label,
      required: true,
    };

    setFields([...fields, newField]);
    setDraggedField(null);
  };

  const handleDocumentDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const removeField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
    if (selectedField?.id === id) {
      setSelectedField(null);
    }
  };

  const updateFieldRole = (fieldId: string, newRole: string) => {
    setFields(fields.map(f => 
      f.id === fieldId 
        ? { ...f, signer_role: newRole }
        : f
    ));
    if (selectedField?.id === fieldId) {
      setSelectedField({ ...selectedField, signer_role: newRole });
      setSelectedRole(newRole);
    }
  };

  const handleFieldMouseDown = (field: SignatureField, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    // Only allow dragging if clicking on the field itself, not on buttons inside
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('[data-no-drag]')) {
      return;
    }
    
    setIsDraggingField(true);
    setSelectedField(field);
    
    if (documentRef.current) {
      const rect = documentRef.current.getBoundingClientRect();
      // Account for padding: 60px top, 80px left
      // Calculate offset from mouse position to field position
      setDragOffset({
        x: e.clientX - rect.left - 80 - field.x,
        y: e.clientY - rect.top - 60 - field.y,
      });
    }
  };

  // Removed handleDocumentMouseMove - using global handler instead

  const handleDocumentMouseUp = () => {
    setIsDraggingField(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Delete existing fields
      await supabase
        .from('document_template_signature_fields')
        .delete()
        .eq('template_id', templateId);

      // Convert pixel-based fields back to percentages for storage
      if (fields.length > 0 && documentRef.current) {
        const rect = documentRef.current.getBoundingClientRect();
        // Account for padding: 60px top/bottom, 80px left/right
        const docWidth = (rect.width - 160) || 700; // 80px padding on each side
        const docHeight = (rect.height - 120) || 1000; // 60px padding on top/bottom

        const fieldsToInsert = fields.map(f => ({
          template_id: templateId,
          field_type: f.field_type,
          signer_role: f.signer_role,
          page_number: f.page_number,
          x_percent: (f.x / docWidth) * 100,
          y_percent: (f.y / docHeight) * 100,
          width_percent: (f.width / docWidth) * 100,
          height_percent: (f.height / docHeight) * 100,
          label: f.label,
          required: f.required,
        }));

        const { error } = await supabase
          .from('document_template_signature_fields')
          .insert(fieldsToInsert);

        if (error) throw error;
      }

      notifications.show({
        title: 'Success',
        message: 'Signature fields saved successfully',
        color: 'green',
      });

      if (onSave) onSave();
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to save signature fields',
        color: 'red',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Center h={400}>
        <Loader size="lg" />
      </Center>
    );
  }

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 200px)', backgroundColor: '#f3f4f6' }}>
      {/* Left Sidebar - Fields */}
      <div style={{ 
        width: '320px', 
        backgroundColor: 'white', 
        borderRight: '1px solid #e5e7eb',
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ fontWeight: 600, marginBottom: '12px', fontSize: '14px', color: '#111827' }}>Fields</h3>
          
          {/* Signer Role Selector */}
          <div style={{ marginBottom: '16px' }}>
            <Text size="xs" fw={500} mb={4} c="dimmed">Assign to Signer Role:</Text>
            <Select
              value={selectedRole}
              onChange={(value) => setSelectedRole(value || 'officer')}
              data={signerRoles.map(r => ({ value: r.value, label: r.label }))}
              size="sm"
              styles={{
                input: {
                  fontSize: '13px',
                }
              }}
            />
            <Badge 
              size="sm" 
              mt={8}
              style={{ 
                backgroundColor: signerRoles.find(r => r.value === selectedRole)?.color || '#3b82f6',
                color: 'white',
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              {signerRoles.find(r => r.value === selectedRole)?.label || 'Officer'}
            </Badge>
          </div>
          
          <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '16px' }}>
            Drag fields onto the document
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {fieldTypes.map((field) => {
              const Icon = field.icon;
              return (
                <div
                  key={field.type}
                  draggable
                  onDragStart={(e) => handleFieldDragStart(field, e)}
                  style={{
                    backgroundColor: field.color,
                    border: `2px solid ${field.borderColor}`,
                    borderRadius: '8px',
                    padding: '12px',
                    cursor: 'move',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'box-shadow 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Icon size={18} style={{ color: '#374151' }} />
                    <span style={{ fontSize: '14px', fontWeight: 500, color: '#1f2937' }}>
                      {field.label}
                    </span>
                  </div>
                  <IconArrowsMove size={16} style={{ color: '#6b7280' }} />
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
          {/* Selected Field Role Editor */}
          {selectedField && (
            <div style={{ marginBottom: '12px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
              <Text fw={500} size="xs" mb={4} c="dimmed">Selected Field Role:</Text>
              <Select
                value={selectedField.signer_role}
                onChange={(value) => {
                  if (value && selectedField.id) {
                    updateFieldRole(selectedField.id, value);
                  }
                }}
                data={signerRoles.map(r => ({ value: r.value, label: r.label }))}
                size="xs"
                styles={{
                  input: {
                    fontSize: '12px',
                  }
                }}
              />
            </div>
          )}
          
          {/* Field Summary by Role */}
          <div style={{ marginBottom: '12px', fontSize: '12px' }}>
            <Text fw={500} size="sm" mb={8} c="dimmed">Fields by Role:</Text>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '120px', overflowY: 'auto' }}>
              {signerRoles.map(role => {
                const count = fields.filter(f => f.signer_role === role.value).length;
                if (count === 0) return null;
                return (
                  <div key={role.value} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Badge size="xs" style={{ backgroundColor: role.color, color: 'white' }}>
                      {role.label}
                    </Badge>
                    <Text size="xs" c="dimmed">{count}</Text>
                  </div>
                );
              })}
            </div>
          </div>
          <Group justify="space-between" mb="md">
            <Text fw={500} size="sm" c="dimmed">{fields.length} fields placed</Text>
          </Group>
          <Button onClick={handleSave} loading={saving} fullWidth>
            Save Fields
          </Button>
        </div>
      </div>

      {/* Document Preview Area */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        padding: '32px',
        backgroundColor: '#f3f4f6'
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <Paper
            ref={documentRef}
            withBorder
            p={0}
            style={{
              backgroundColor: 'white',
              border: '2px solid #d1d5db',
              borderRadius: '8px',
              boxShadow: '0 10px 15px rgba(0,0,0,0.1)',
              minHeight: '1000px',
              position: 'relative',
              padding: '60px 80px',
              overflow: 'visible',
              isolation: 'isolate',
            }}
            onDrop={handleDocumentDrop}
            onDragOver={handleDocumentDragOver}
            onMouseUp={(e) => {
              if (!isDraggingField) {
                handleDocumentMouseUp();
              }
            }}
            onMouseLeave={(e) => {
              // Don't stop dragging if mouse leaves while dragging
              if (!isDraggingField) {
                handleDocumentMouseUp();
              }
            }}
          >
            {/* Document Preview */}
            <iframe
              ref={iframeRef}
              src={documentUrl}
              style={{
                width: '100%',
                minHeight: '1000px',
                border: 'none',
                pointerEvents: 'none',
                display: 'block',
                position: 'relative',
              }}
              scrolling="no"
              onLoad={(e) => {
                const iframe = e.currentTarget;
                try {
                  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
                  if (iframeDoc) {
                    const height = Math.max(
                      iframeDoc.body?.scrollHeight || 0,
                      iframeDoc.documentElement?.scrollHeight || 0,
                      1000
                    );
                    iframe.style.height = `${height}px`;
                    if (documentRef.current) {
                      documentRef.current.style.minHeight = `${height + 120}px`;
                    }
                  }
                } catch (err) {
                  iframe.style.height = '3000px';
                  if (documentRef.current) {
                    documentRef.current.style.minHeight = '3120px';
                  }
                }
              }}
            />

            {/* Placed Fields - DocuSign Style - Fixed to document content */}
            {fields.map((field) => {
              const fieldDef = fieldTypes.find(f => f.type === field.field_type);
              const Icon = fieldDef?.icon || IconSignature;
              const isSelected = selectedField?.id === field.id;
              const roleInfo = signerRoles.find(r => r.value === field.signer_role);

              return (
                <div
                  key={field.id}
                  data-field-id={field.id}
                  style={{
                    position: 'absolute',
                    left: `${field.x}px`,
                    top: `${field.y}px`,
                    width: `${field.width}px`,
                    height: `${field.height}px`,
                    backgroundColor: fieldDef?.color || '#fef3c7',
                    border: `2px solid ${isSelected ? '#0066cc' : (fieldDef?.borderColor || '#e5b341')}`,
                    borderRadius: '4px',
                    padding: '8px',
                    cursor: isDraggingField && selectedField?.id === field.id ? 'grabbing' : 'move',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    zIndex: isSelected ? 1000 : 100,
                    boxShadow: isSelected 
                      ? '0 4px 12px rgba(0, 102, 204, 0.3)' 
                      : '0 2px 4px rgba(0,0,0,0.1)',
                    transform: 'translate(0, 0)',
                    willChange: isDraggingField && selectedField?.id === field.id ? 'transform' : 'auto',
                    pointerEvents: 'auto',
                    userSelect: 'none',
                    touchAction: 'none',
                    WebkitUserSelect: 'none',
                    MozUserSelect: 'none',
                    msUserSelect: 'none',
                    contain: 'layout style paint',
                  }}
                  onClick={(e) => {
                    // Don't select if we just finished dragging
                    if (isDraggingField) {
                      e.stopPropagation();
                      return;
                    }
                    e.stopPropagation();
                    setSelectedField(field);
                    setSelectedRole(field.signer_role);
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    handleFieldMouseDown(field, e);
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    height: '100%'
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Icon size={14} style={{ color: '#374151' }} />
                        <span style={{ fontSize: '12px', fontWeight: 500, color: '#1f2937' }}>
                          {fieldDef?.label || field.field_type}
                        </span>
                      </div>
                      <div style={{ 
                        fontSize: '10px', 
                        color: 'white',
                        backgroundColor: roleInfo?.color || '#6b7280',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        display: 'inline-block',
                        width: 'fit-content',
                        fontWeight: 500,
                        marginTop: '2px',
                      }}>
                        {roleInfo?.label || field.signer_role}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeField(field.id!);
                      }}
                      style={{
                        opacity: isSelected ? 1 : 0,
                        transition: 'opacity 0.2s',
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '2px',
                        display: 'flex',
                        alignItems: 'center',
                        marginLeft: '4px',
                      }}
                    >
                      <IconX size={14} style={{ color: '#dc2626' }} />
                    </button>
                  </div>
                </div>
              );
            })}

            {fields.length === 0 && (
              <div style={{ 
                textAlign: 'center', 
                padding: '32px', 
                color: '#6b7280',
                fontSize: '14px',
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'none',
              }}>
                <p>Drag fields from the left sidebar onto the document</p>
              </div>
            )}
          </Paper>
        </div>
      </div>
    </div>
  );
};

export default DocumentTemplateTagger;
