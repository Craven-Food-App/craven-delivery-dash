import React, { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Text,
  Stack,
  Card,
  Table,
  Badge,
  Button,
  Group,
  TextInput,
  Select,
  Loader,
  Alert,
  Anchor,
} from '@mantine/core';
import { IconFolder, IconDownload, IconEye, IconAlertCircle, IconFileText } from '@tabler/icons-react';
import { supabase } from '@/integrations/supabase/client';

interface Document {
  id: string;
  title: string;
  type: string;
  signing_status: string;
  created_at: string;
  pdf_url?: string;
  html_template?: string;
}

const DocumentVault: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadDocuments();
  }, [statusFilter]);

  const loadDocuments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's appointments
      const { data: appointments } = await supabase
        .from('appointments')
        .select('id')
        .eq('appointee_user_id', user.id);

      const appointmentIds = appointments?.map(a => a.id) || [];

      if (appointmentIds.length === 0) {
        setDocuments([]);
        setLoading(false);
        return;
      }

      // Load documents for these appointments
      let query = supabase
        .from('board_documents')
        .select('*')
        .in('related_appointment_id', appointmentIds)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('signing_status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setDocuments(data || []);
    } catch (error: any) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDocuments = documents.filter(
    (doc) =>
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'green';
      case 'pending':
        return 'yellow';
      default:
        return 'blue';
    }
  };

  if (loading) {
    return (
      <Container size="xl" py="xl">
        <Loader size="lg" />
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <div>
          <Title order={2} c="dark" mb="xs">
            <IconFolder size={28} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 12 }} />
            Document Vault
          </Title>
          <Text c="dimmed">
            Access all your executive documents, certificates, and agreements.
          </Text>
        </div>

        <Card padding="lg" radius="md" withBorder>
          <Group mb="md">
            <TextInput
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ flex: 1 }}
              leftSection={<IconFileText size={16} />}
            />
            <Select
              value={statusFilter}
              onChange={(value) => setStatusFilter(value || 'all')}
              data={[
                { value: 'all', label: 'All Status' },
                { value: 'completed', label: 'Signed' },
                { value: 'pending', label: 'Pending' },
              ]}
            />
          </Group>

          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Document</Table.Th>
                <Table.Th>Type</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Date</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredDocuments.map((doc) => (
                <Table.Tr key={doc.id}>
                  <Table.Td>
                    <Text fw={500}>{doc.title}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge variant="light">{doc.type}</Badge>
                  </Table.Td>
                  <Table.Td>
                    <Badge color={getStatusColor(doc.signing_status)}>
                      {doc.signing_status}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    {new Date(doc.created_at).toLocaleDateString()}
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      {doc.pdf_url && (
                        <>
                          <Button
                            size="xs"
                            variant="light"
                            leftSection={<IconEye size={14} />}
                            component="a"
                            href={doc.pdf_url}
                            target="_blank"
                          >
                            View
                          </Button>
                          <Button
                            size="xs"
                            variant="light"
                            leftSection={<IconDownload size={14} />}
                            component="a"
                            href={doc.pdf_url}
                            download
                          >
                            Download
                          </Button>
                        </>
                      )}
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>

          {filteredDocuments.length === 0 && (
            <Alert icon={<IconAlertCircle size={16} />} title="No Documents" color="blue" mt="md">
              {searchTerm ? 'No documents match your search.' : 'No documents found in your vault.'}
            </Alert>
          )}
        </Card>
      </Stack>
    </Container>
  );
};

export default DocumentVault;

