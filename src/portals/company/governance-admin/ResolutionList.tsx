import React, { useState, useEffect } from 'react';
import {
  Table,
  Badge,
  Button,
  Stack,
  Group,
  Text,
  Select,
  Paper,
  ActionIcon,
  Tooltip,
  Loader,
  Center,
  Modal,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { supabase } from '@/integrations/supabase/client';
import { IconEye, IconCheck, IconX } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

interface BoardResolution {
  id: string;
  resolution_number: string;
  title: string;
  description?: string;
  type: string;
  status: string;
  meeting_date?: string;
  effective_date?: string;
  created_at: string;
}

const ResolutionList: React.FC = () => {
  const [resolutions, setResolutions] = useState<BoardResolution[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedResolution, setSelectedResolution] = useState<BoardResolution | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [adoptModalOpen, setAdoptModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [canManage, setCanManage] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchResolutions();
    checkPermissions();
  }, [statusFilter]);

  const checkPermissions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email === 'tstroman.ceo@cravenusa.com') {
        setCanManage(true);
        return;
      }
      const { fetchUserRoles, canManageGovernance } = await import('@/lib/roles');
      const roles = await fetchUserRoles();
      setCanManage(canManageGovernance(roles));
    } catch (error) {
      console.error('Error checking permissions:', error);
    }
  };

  const fetchResolutions = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('governance_board_resolutions')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) {
        if (error.code === '42P01') {
          notifications.show({
            title: 'Setup Required',
            message: 'Governance tables not found. Please run the database migration.',
            color: 'orange',
          });
          setResolutions([]);
          return;
        }
        throw error;
      }

      setResolutions(data || []);
    } catch (error: any) {
      console.error('Error fetching resolutions:', error);
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to load resolutions',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'gray';
      case 'PENDING_VOTE':
        return 'blue';
      case 'ADOPTED':
        return 'green';
      case 'REJECTED':
        return 'red';
      default:
        return 'gray';
    }
  };

  if (loading) {
    return (
      <Center h={300}>
        <Loader size="lg" />
      </Center>
    );
  }

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Text fw={600} size="lg" c="dark">
          Board Resolutions
        </Text>
        <Select
          placeholder="Filter by status"
          value={statusFilter}
          onChange={(value) => setStatusFilter(value || 'all')}
          data={[
            { value: 'all', label: 'All Statuses' },
            { value: 'DRAFT', label: 'Draft' },
            { value: 'PENDING_VOTE', label: 'Pending Vote' },
            { value: 'ADOPTED', label: 'Adopted' },
            { value: 'REJECTED', label: 'Rejected' },
          ]}
          style={{ width: 200 }}
        />
      </Group>

      {resolutions.length === 0 ? (
        <Paper p="xl" style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}>
          <Center>
            <Text c="dimmed">No resolutions found</Text>
          </Center>
        </Paper>
      ) : (
        <Paper style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <Table.ScrollContainer minWidth={800}>
            <Table verticalSpacing="md" highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th c="dimmed">Resolution #</Table.Th>
                  <Table.Th c="dimmed">Title</Table.Th>
                  <Table.Th c="dimmed">Type</Table.Th>
                  <Table.Th c="dimmed">Status</Table.Th>
                  <Table.Th c="dimmed">Meeting Date</Table.Th>
                  <Table.Th c="dimmed">Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {resolutions.map((resolution) => (
                  <Table.Tr key={resolution.id}>
                    <Table.Td>
                      <Text fw={500} c="dark">
                        {resolution.resolution_number}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text c="dark">{resolution.title}</Text>
                      {resolution.description && (
                        <Text size="xs" c="dimmed" lineClamp={1}>
                          {resolution.description}
                        </Text>
                      )}
                    </Table.Td>
                    <Table.Td>
                      <Badge variant="light" size="sm">
                        {resolution.type.replace('_', ' ')}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Badge color={getStatusColor(resolution.status)} variant="light">
                        {resolution.status}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text c="dark">
                        {resolution.meeting_date
                          ? dayjs(resolution.meeting_date).format('MMM D, YYYY')
                          : 'N/A'}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <Tooltip label="View Details">
                          <ActionIcon
                            variant="light"
                            onClick={() => {
                              setSelectedResolution(resolution);
                              setDetailModalOpen(true);
                            }}
                          >
                            <IconEye size={16} />
                          </ActionIcon>
                        </Tooltip>
                        {resolution.status === 'PENDING_VOTE' && (
                          <Tooltip label="View in Board Portal">
                            <ActionIcon
                              variant="light"
                              color="blue"
                              onClick={() =>
                                navigate(`/company/board/resolution/${resolution.id}`)
                              }
                            >
                              <IconEye size={16} />
                            </ActionIcon>
                          </Tooltip>
                        )}
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </Paper>
      )}

      {/* Detail Modal */}
      <Modal
        opened={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedResolution(null);
        }}
        title="Resolution Details"
        size="lg"
      >
        {selectedResolution && (
          <Stack gap="md">
            <Group>
              <Text fw={500}>Resolution Number:</Text>
              <Text>{selectedResolution.resolution_number}</Text>
            </Group>
            <Group>
              <Text fw={500}>Title:</Text>
              <Text>{selectedResolution.title}</Text>
            </Group>
            {selectedResolution.description && (
              <div>
                <Text fw={500} mb="xs">Description:</Text>
                <Text>{selectedResolution.description}</Text>
              </div>
            )}
            <Group>
              <Text fw={500}>Type:</Text>
              <Badge>{selectedResolution.type.replace('_', ' ')}</Badge>
            </Group>
            <Group>
              <Text fw={500}>Status:</Text>
              <Badge color={getStatusColor(selectedResolution.status)}>
                {selectedResolution.status}
              </Badge>
            </Group>
            {selectedResolution.meeting_date && (
              <Group>
                <Text fw={500}>Meeting Date:</Text>
                <Text>{dayjs(selectedResolution.meeting_date).format('MMMM D, YYYY')}</Text>
              </Group>
            )}
            {selectedResolution.effective_date && (
              <Group>
                <Text fw={500}>Effective Date:</Text>
                <Text>{dayjs(selectedResolution.effective_date).format('MMMM D, YYYY')}</Text>
              </Group>
            )}
            {canManage && selectedResolution.status === 'PENDING_VOTE' && (
              <Group mt="md">
                <Button
                  leftSection={<IconCheck size={16} />}
                  color="green"
                  onClick={() => {
                    setDetailModalOpen(false);
                    setAdoptModalOpen(true);
                  }}
                >
                  Manually Adopt
                </Button>
                <Button
                  leftSection={<IconX size={16} />}
                  color="red"
                  variant="outline"
                  onClick={() => {
                    setDetailModalOpen(false);
                    setRejectModalOpen(true);
                  }}
                >
                  Manually Reject
                </Button>
              </Group>
            )}
          </Stack>
        )}
      </Modal>

      {/* Manual Adopt Modal */}
      <Modal
        opened={adoptModalOpen}
        onClose={() => {
          setAdoptModalOpen(false);
          setSelectedResolution(null);
        }}
        title="Manually Adopt Resolution"
        size="md"
      >
        {selectedResolution && (
          <Stack gap="md">
            <Text>
              Are you sure you want to manually adopt resolution {selectedResolution.resolution_number}? This will immediately approve the resolution and finalize any associated appointments.
            </Text>
            {selectedResolution.type === 'EXECUTIVE_APPOINTMENT' && (
              <Paper p="md" withBorder style={{ backgroundColor: '#f9fafb' }}>
                <Text size="sm" c="dimmed">
                  This will also approve the executive appointment and create a corporate officer record.
                </Text>
              </Paper>
            )}
            <Group justify="flex-end">
              <Button variant="subtle" onClick={() => setAdoptModalOpen(false)}>
                Cancel
              </Button>
              <Button
                color="green"
                onClick={async () => {
                  setProcessing(true);
                  try {
                    const { error } = await supabase.functions.invoke('governance-manual-adopt-resolution', {
                      body: {
                        resolution_id: selectedResolution.id,
                        action: 'ADOPT',
                      },
                    });
                    if (error) throw error;
                    notifications.show({
                      title: 'Success',
                      message: 'Resolution manually adopted',
                      color: 'green',
                      icon: <IconCheck size={16} />,
                    });
                    setAdoptModalOpen(false);
                    setSelectedResolution(null);
                    fetchResolutions();
                  } catch (error: any) {
                    notifications.show({
                      title: 'Error',
                      message: error.message || 'Failed to adopt resolution',
                      color: 'red',
                    });
                  } finally {
                    setProcessing(false);
                  }
                }}
                loading={processing}
              >
                Adopt Resolution
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>

      {/* Manual Reject Modal */}
      <Modal
        opened={rejectModalOpen}
        onClose={() => {
          setRejectModalOpen(false);
          setSelectedResolution(null);
        }}
        title="Manually Reject Resolution"
        size="md"
      >
        {selectedResolution && (
          <Stack gap="md">
            <Text>
              Are you sure you want to manually reject resolution {selectedResolution.resolution_number}? This will immediately reject the resolution.
            </Text>
            {selectedResolution.type === 'EXECUTIVE_APPOINTMENT' && (
              <Paper p="md" withBorder style={{ backgroundColor: '#f9fafb' }}>
                <Text size="sm" c="dimmed">
                  The associated executive appointment will remain in SENT_TO_BOARD status.
                </Text>
              </Paper>
            )}
            <Group justify="flex-end">
              <Button variant="subtle" onClick={() => setRejectModalOpen(false)}>
                Cancel
              </Button>
              <Button
                color="red"
                onClick={async () => {
                  setProcessing(true);
                  try {
                    const { error } = await supabase.functions.invoke('governance-manual-adopt-resolution', {
                      body: {
                        resolution_id: selectedResolution.id,
                        action: 'REJECT',
                      },
                    });
                    if (error) throw error;
                    notifications.show({
                      title: 'Success',
                      message: 'Resolution manually rejected',
                      color: 'green',
                      icon: <IconCheck size={16} />,
                    });
                    setRejectModalOpen(false);
                    setSelectedResolution(null);
                    fetchResolutions();
                  } catch (error: any) {
                    notifications.show({
                      title: 'Error',
                      message: error.message || 'Failed to reject resolution',
                      color: 'red',
                    });
                  } finally {
                    setProcessing(false);
                  }
                }}
                loading={processing}
              >
                Reject Resolution
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Stack>
  );
};

export default ResolutionList;
