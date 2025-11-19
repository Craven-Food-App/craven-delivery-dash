import React, { useState, useEffect } from 'react';
import {
  Table,
  Badge,
  Button,
  Stack,
  Group,
  Text,
  Paper,
  Loader,
  Center,
  Modal,
  Radio,
  Textarea,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { supabase } from '@/integrations/supabase/client';
import { IconCheck, IconX, IconEye } from '@tabler/icons-react';
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

interface Vote {
  vote: string;
  comment?: string;
}

const BoardResolutionList: React.FC = () => {
  const [resolutions, setResolutions] = useState<BoardResolution[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResolution, setSelectedResolution] = useState<BoardResolution | null>(null);
  const [voteModalOpen, setVoteModalOpen] = useState(false);
  const [vote, setVote] = useState<string>('');
  const [comment, setComment] = useState('');
  const [voting, setVoting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchResolutions();
  }, []);

  const fetchResolutions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('governance_board_resolutions')
        .select('*')
        .eq('status', 'PENDING_VOTE')
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === '42P01') {
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

  const handleVote = async () => {
    if (!selectedResolution || !vote) return;

    setVoting(true);
    try {
      const { data, error } = await supabase.functions.invoke('governance-cast-vote', {
        body: {
          resolutionId: selectedResolution.id,
          vote: vote,
          comment: comment || undefined,
        },
      });

      if (error) throw error;

      notifications.show({
        title: 'Success',
        message: 'Your vote has been recorded',
        color: 'green',
        icon: <IconCheck size={16} />,
      });

      setVoteModalOpen(false);
      setSelectedResolution(null);
      setVote('');
      setComment('');
      fetchResolutions();
    } catch (error: any) {
      console.error('Error casting vote:', error);
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to cast vote',
        color: 'red',
      });
    } finally {
      setVoting(false);
    }
  };

  if (loading) {
    return (
      <Center h={300}>
        <Loader size="lg" />
      </Center>
    );
  }

  if (resolutions.length === 0) {
    return (
      <Paper p="xl" withBorder style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}>
        <Center>
          <Text c="dimmed">No resolutions pending your vote</Text>
        </Center>
      </Paper>
    );
  }

  return (
    <Stack gap="md">
      <Paper withBorder style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <Table.ScrollContainer minWidth={800}>
          <Table verticalSpacing="md" highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th c="dimmed">Resolution #</Table.Th>
                <Table.Th c="dimmed">Title</Table.Th>
                <Table.Th c="dimmed">Type</Table.Th>
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
                    <Text c="dark">
                      {resolution.meeting_date
                        ? dayjs(resolution.meeting_date).format('MMM D, YYYY')
                        : 'N/A'}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <Button
                        size="xs"
                        variant="light"
                        onClick={() => navigate(`/company/board/resolution/${resolution.id}`)}
                      >
                        View Details
                      </Button>
                      <Button
                        size="xs"
                        onClick={() => {
                          setSelectedResolution(resolution);
                          setVoteModalOpen(true);
                        }}
                      >
                        Vote
                      </Button>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Paper>

      {/* Vote Modal */}
      <Modal
        opened={voteModalOpen}
        onClose={() => {
          setVoteModalOpen(false);
          setSelectedResolution(null);
          setVote('');
          setComment('');
        }}
        title="Cast Your Vote"
        size="md"
      >
        {selectedResolution && (
          <Stack gap="md">
            <Paper p="md" withBorder style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}>
              <Text fw={500} c="dark" mb="xs">
                {selectedResolution.resolution_number}
              </Text>
              <Text c="dark" mb="xs">
                {selectedResolution.title}
              </Text>
              {selectedResolution.description && (
                <Text size="sm" c="dimmed">
                  {selectedResolution.description}
                </Text>
              )}
            </Paper>

            <Radio.Group
              label="Your Vote"
              value={vote}
              onChange={setVote}
              required
            >
              <Stack gap="xs" mt="xs">
                <Radio value="YES" label="Yes" />
                <Radio value="NO" label="No" />
                <Radio value="ABSTAIN" label="Abstain" />
              </Stack>
            </Radio.Group>

            <Textarea
              label="Comment (Optional)"
              placeholder="Add any comments about your vote..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />

            <Group justify="flex-end">
              <Button
                variant="subtle"
                onClick={() => {
                  setVoteModalOpen(false);
                  setSelectedResolution(null);
                  setVote('');
                  setComment('');
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleVote} loading={voting} disabled={!vote}>
                Submit Vote
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Stack>
  );
};

export default BoardResolutionList;
