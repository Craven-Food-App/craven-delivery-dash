import React, { useState, useEffect } from 'react';
import { Card, Button, Stack, Group, Text, Table, Badge, Modal, Loader, Center } from '@mantine/core';
import { supabase } from '@/integrations/supabase/client';
import { notifications } from '@mantine/notifications';
import { IconTag, IconFileText } from '@tabler/icons-react';
import DocumentTemplateTagger from './DocumentTemplateTagger';

interface DocumentTemplate {
  id: string;
  template_key: string;
  name: string;
  description: string;
  html_content: string;
  is_active: boolean;
}

const DocumentTemplates: React.FC = () => {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [taggerOpen, setTaggerOpen] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('document_templates')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to load templates',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTagTemplate = (template: DocumentTemplate) => {
    setSelectedTemplate(template);
    setTaggerOpen(true);
  };

  const getTemplatePreviewUrl = (template: DocumentTemplate): string => {
    // Create a data URL from the HTML content
    const blob = new Blob([template.html_content], { type: 'text/html' });
    return URL.createObjectURL(blob);
  };

  if (loading) {
    return (
      <Center h={400}>
        <Loader size="lg" />
      </Center>
    );
  }

  return (
    <Stack gap="md">
      <Card padding="lg" radius="md" withBorder>
        <Group justify="space-between" mb="md">
          <Text fw={600} size="lg">Document Templates</Text>
        </Group>

        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Template Name</Table.Th>
              <Table.Th>Key</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {templates.map((template) => (
              <Table.Tr key={template.id}>
                <Table.Td>
                  <Group gap="xs">
                    <IconFileText size={16} />
                    <Text fw={500}>{template.name}</Text>
                  </Group>
                  {template.description && (
                    <Text size="xs" c="dimmed" mt={4}>
                      {template.description}
                    </Text>
                  )}
                </Table.Td>
                <Table.Td>
                  <Badge variant="light" color="gray">
                    {template.template_key}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Badge color={template.is_active ? 'green' : 'gray'}>
                    {template.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Button
                    size="xs"
                    leftSection={<IconTag size={14} />}
                    onClick={() => handleTagTemplate(template)}
                  >
                    Tag Signature Fields
                  </Button>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Card>

      <Modal
        opened={taggerOpen}
        onClose={() => {
          setTaggerOpen(false);
          setSelectedTemplate(null);
        }}
        title={`Tag Signature Fields: ${selectedTemplate?.name}`}
        size="xl"
        fullScreen
      >
        {selectedTemplate && (
          <DocumentTemplateTagger
            templateId={selectedTemplate.id}
            templateKey={selectedTemplate.template_key}
            documentUrl={getTemplatePreviewUrl(selectedTemplate)}
            onSave={() => {
              setTaggerOpen(false);
              setSelectedTemplate(null);
              notifications.show({
                title: 'Success',
                message: 'Signature fields saved successfully',
                color: 'green',
              });
            }}
          />
        )}
      </Modal>
    </Stack>
  );
};

export default DocumentTemplates;

