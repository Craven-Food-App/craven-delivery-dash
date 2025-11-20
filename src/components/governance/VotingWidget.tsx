import React, { useState } from 'react';
import {
  Modal,
  Stack,
  Select,
  Textarea,
  Button,
  Group,
  Alert,
  Loader,
} from '@mantine/core';
import { IconCheck, IconX, IconMinus, IconAlertCircle } from '@tabler/icons-react';
import { supabase } from '@/integrations/supabase/client';
import { notifications } from '@mantine/notifications';

interface VotingWidgetProps {
  resolutionId: string;
  resolutionTitle: string;
  opened: boolean;
  onClose: () => void;
  onVoteSubmitted?: () => void;
}

export const VotingWidget: React.FC<VotingWidgetProps> = ({
  resolutionId,
  resolutionTitle,
  opened,
  onClose,
  onVoteSubmitted,
}) => {
  const [vote, setVote] = useState<string>('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!vote) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke('governance-cast-vote', {
        body: {
          resolution_id: resolutionId,
          vote,
          comment: comment || null,
        },
      });

      if (error) throw error;

      notifications.show({
        title: 'Success',
        message: 'Your vote has been recorded',
        color: 'green',
        icon: <IconCheck size={16} />,
      });

      setVote('');
      setComment('');
      onClose();
      if (onVoteSubmitted) onVoteSubmitted();
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to submit vote',
        color: 'red',
        icon: <IconAlertCircle size={16} />,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getVoteIcon = () => {
    switch (vote) {
      case 'YES':
        return <IconCheck size={16} />;
      case 'NO':
        return <IconX size={16} />;
      case 'ABSTAIN':
        return <IconMinus size={16} />;
      default:
        return null;
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={`Vote on Resolution`}
      size="md"
    >
      <Stack gap="md">
        <Alert icon={<IconAlertCircle size={16} />} color="blue" title="Resolution">
          {resolutionTitle}
        </Alert>

        <Select
          label="Your Vote"
          placeholder="Select your vote"
          data={[
            { value: 'YES', label: 'Yes - Approve' },
            { value: 'NO', label: 'No - Reject' },
            { value: 'ABSTAIN', label: 'Abstain' },
          ]}
          value={vote}
          onChange={(value) => setVote(value || '')}
          required
        />

        <Textarea
          label="Comment (Optional)"
          placeholder="Add any comments about your vote..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          minRows={3}
        />

        <Group justify="flex-end" mt="md">
          <Button variant="subtle" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            loading={submitting}
            disabled={!vote}
            leftSection={getVoteIcon()}
          >
            Submit Vote
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};

