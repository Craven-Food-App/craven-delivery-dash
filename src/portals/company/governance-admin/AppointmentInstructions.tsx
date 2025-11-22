import React from 'react';
import {
  Container,
  Card,
  Stack,
  Title,
  Text,
  List,
  ThemeIcon,
  Divider,
  Alert,
  Badge,
  Group,
  Paper,
} from '@mantine/core';
import {
  IconCheck,
  IconAlertCircle,
  IconFileText,
  IconUsers,
  IconChecklist,
  IconMail,
  IconClock,
  IconShield,
  IconInfoCircle,
} from '@tabler/icons-react';

const AppointmentInstructions: React.FC = () => {
  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <div>
          <Title order={1} c="dark" mb="xs">
            Executive Appointment Instructions
          </Title>
          <Text c="dimmed" size="lg">
            Step-by-step guide to appointing executives and corporate officers
          </Text>
        </div>

        <Alert icon={<IconInfoCircle size={16} />} title="Overview" color="blue" variant="light">
          The executive appointment process ensures proper governance, documentation, and board approval
          for all corporate officer appointments. Follow these steps carefully to ensure compliance.
        </Alert>

        <Card padding="lg" radius="md" withBorder>
          <Stack gap="lg">
            <Title order={2} size="h3">
              Step 1: Create New Appointment
            </Title>
            <List
              spacing="sm"
              size="sm"
              icon={
                <ThemeIcon color="blue" size={24} radius="xl">
                  <IconFileText size={14} />
                </ThemeIcon>
              }
            >
              <List.Item>
                Navigate to the <Badge variant="light">Appointments</Badge> tab
              </List.Item>
              <List.Item>
                Click the <Badge variant="light" color="orange">+ New Appointment</Badge> button
              </List.Item>
              <List.Item>
                Fill out the appointment form with the following required information:
                <List withPadding spacing="xs" size="sm" mt="xs">
                  <List.Item>
                    <strong>Officer Name:</strong> Full legal name of the appointee
                  </List.Item>
                  <List.Item>
                    <strong>Email:</strong> Professional email address (will be used to create user account)
                  </List.Item>
                  <List.Item>
                    <strong>Title:</strong> Select from available executive titles (CEO, CFO, CTO, etc.)
                  </List.Item>
                  <List.Item>
                    <strong>Effective Date:</strong> Date when the appointment becomes effective
                  </List.Item>
                  <List.Item>
                    <strong>Appointment Type:</strong> NEW, REPLACEMENT, or INTERIM
                  </List.Item>
                </List>
              </List.Item>
              <List.Item>
                <strong>Optional but recommended:</strong>
                <List withPadding spacing="xs" size="sm" mt="xs">
                  <List.Item>Board Meeting Date</List.Item>
                  <List.Item>Term Length (in months)</List.Item>
                  <List.Item>Compensation Structure</List.Item>
                  <List.Item>Equity Details (if applicable)</List.Item>
                  <List.Item>Department and Reporting Structure</List.Item>
                </List>
              </List.Item>
              <List.Item>
                <strong>Formation Mode:</strong> Enable this checkbox only if the company has not yet filed
                Articles of Incorporation. This will generate a Pre-Incorporation Consent document.
              </List.Item>
              <List.Item>
                Click <Badge variant="light" color="green">Submit</Badge> to create the appointment draft
              </List.Item>
            </List>
          </Stack>
        </Card>

        <Card padding="lg" radius="md" withBorder>
          <Stack gap="lg">
            <Title order={2} size="h3">
              Step 2: Document Generation
            </Title>
            <Text size="sm" c="dimmed">
              After creating the appointment, the system automatically generates the following documents:
            </Text>
            <List
              spacing="sm"
              size="sm"
              icon={
                <ThemeIcon color="green" size={24} radius="xl">
                  <IconCheck size={14} />
                </ThemeIcon>
              }
            >
              <List.Item>
                <strong>Appointment Letter</strong> - Formal letter of appointment
              </List.Item>
              <List.Item>
                <strong>Board Resolution</strong> - Resolution document for board approval
              </List.Item>
              <List.Item>
                <strong>Officer Acceptance</strong> - Document for the appointee to sign
              </List.Item>
              <List.Item>
                <strong>Pre-Incorporation Consent</strong> - Only if Formation Mode is enabled
              </List.Item>
              <List.Item>
                <strong>Employment Agreement</strong> - If compensation details are provided
              </List.Item>
              <List.Item>
                <strong>Confidentiality & IP Assignment</strong> - Standard agreement
              </List.Item>
              <List.Item>
                <strong>Stock Subscription Agreement</strong> - If equity is included
              </List.Item>
            </List>
            <Alert icon={<IconClock size={16} />} title="Processing Time" color="yellow" variant="light">
              Document generation may take a few moments. Refresh the appointments list to see updated
              document status. If documents fail to generate, use the refresh icon on the appointment row
              to retry.
            </Alert>
          </Stack>
        </Card>

        <Card padding="lg" radius="md" withBorder>
          <Stack gap="lg">
            <Title order={2} size="h3">
              Step 3: Review Documents
            </Title>
            <List
              spacing="sm"
              size="sm"
              icon={
                <ThemeIcon color="orange" size={24} radius="xl">
                  <IconChecklist size={14} />
                </ThemeIcon>
              }
            >
              <List.Item>
                Return to the <Badge variant="light">Appointments</Badge> tab
              </List.Item>
              <List.Item>
                Locate the appointment in the table and check the <Badge variant="light">Documents</Badge> column
              </List.Item>
              <List.Item>
                Click the <Badge variant="light" color="blue">eye icon</Badge> to view each generated document
              </List.Item>
              <List.Item>
                Verify that all required documents are present (typically 7 documents, or 8 if Formation Mode)
              </List.Item>
              <List.Item>
                Review each document for accuracy and completeness
              </List.Item>
              <List.Item>
                If any documents are missing or incorrect, click the <Badge variant="light" color="orange">refresh icon</Badge> to regenerate
              </List.Item>
            </List>
          </Stack>
        </Card>

        <Card padding="lg" radius="md" withBorder>
          <Stack gap="lg">
            <Title order={2} size="h3">
              Step 4: Board Approval Process
            </Title>
            <List
              spacing="sm"
              size="sm"
              icon={
                <ThemeIcon color="purple" size={24} radius="xl">
                  <IconUsers size={14} />
                </ThemeIcon>
              }
            >
              <List.Item>
                Navigate to the <Badge variant="light">Resolutions</Badge> tab
              </List.Item>
              <List.Item>
                Find the resolution created for this appointment (it will be linked to the appointment)
              </List.Item>
              <List.Item>
                The resolution status will be <Badge color="yellow">PENDING_VOTE</Badge>
              </List.Item>
              <List.Item>
                Board members can vote on the resolution through the <Badge variant="light">Voting Dashboard</Badge> tab
              </List.Item>
              <List.Item>
                Once the board votes and approves, the resolution status changes to <Badge color="green">ADOPTED</Badge>
              </List.Item>
              <List.Item>
                The appointment status will automatically update to <Badge color="cyan">BOARD_ADOPTED</Badge>
              </List.Item>
            </List>
          </Stack>
        </Card>

        <Card padding="lg" radius="md" withBorder>
          <Stack gap="lg">
            <Title order={2} size="h3">
              Step 5: Secretary Review & Approval
            </Title>
            <List
              spacing="sm"
              size="sm"
              icon={
                <ThemeIcon color="teal" size={24} radius="xl">
                  <IconShield size={14} />
                </ThemeIcon>
              }
            >
              <List.Item>
                After board approval, navigate to the <Badge variant="light">Officer Validation</Badge> tab
              </List.Item>
              <List.Item>
                The appointment will appear in the validation queue with status <Badge color="yellow">READY_FOR_SECRETARY_REVIEW</Badge>
              </List.Item>
              <List.Item>
                Review all documents and appointment details
              </List.Item>
              <List.Item>
                Verify that all required information is complete and accurate
              </List.Item>
              <List.Item>
                Click <Badge variant="light" color="green">Approve</Badge> to finalize the appointment
              </List.Item>
              <List.Item>
                Upon approval, the status changes to <Badge color="green">SECRETARY_APPROVED</Badge>
              </List.Item>
            </List>
          </Stack>
        </Card>

        <Card padding="lg" radius="md" withBorder>
          <Stack gap="lg">
            <Title order={2} size="h3">
              Step 6: Activation & Notification
            </Title>
            <List
              spacing="sm"
              size="sm"
              icon={
                <ThemeIcon color="green" size={24} radius="xl">
                  <IconMail size={14} />
                </ThemeIcon>
              }
            >
              <List.Item>
                After Secretary approval, the appointment status changes to <Badge color="indigo">ACTIVATING</Badge>
              </List.Item>
              <List.Item>
                The system automatically:
                <List withPadding spacing="xs" size="sm" mt="xs">
                  <List.Item>Creates or updates the user account for the appointee</List.Item>
                  <List.Item>Assigns appropriate roles and permissions</List.Item>
                  <List.Item>Sends email notification with appointment documents</List.Item>
                  <List.Item>Updates the Officer Ledger</List.Item>
                  <List.Item>Creates governance log entries</List.Item>
                </List>
              </List.Item>
              <List.Item>
                Once activation is complete, status changes to <Badge color="green">ACTIVE</Badge>
              </List.Item>
              <List.Item>
                The appointee can now access their executive portal and sign documents
              </List.Item>
            </List>
          </Stack>
        </Card>

        <Divider />

        <Card padding="lg" radius="md" withBorder style={{ backgroundColor: '#f8f9fa' }}>
          <Stack gap="md">
            <Title order={2} size="h3">
              Status Flow Reference
            </Title>
            <Group gap="xs" wrap="wrap">
              <Badge color="gray" size="lg">DRAFT</Badge>
              <Text size="sm" c="dimmed">→</Text>
              <Badge color="blue" size="lg">SENT_TO_BOARD</Badge>
              <Text size="sm" c="dimmed">→</Text>
              <Badge color="cyan" size="lg">BOARD_ADOPTED</Badge>
              <Text size="sm" c="dimmed">→</Text>
              <Badge color="yellow" size="lg">READY_FOR_SECRETARY_REVIEW</Badge>
              <Text size="sm" c="dimmed">→</Text>
              <Badge color="lime" size="lg">SECRETARY_APPROVED</Badge>
              <Text size="sm" c="dimmed">→</Text>
              <Badge color="indigo" size="lg">ACTIVATING</Badge>
              <Text size="sm" c="dimmed">→</Text>
              <Badge color="green" size="lg">ACTIVE</Badge>
            </Group>
          </Stack>
        </Card>

        <Card padding="lg" radius="md" withBorder style={{ backgroundColor: '#fff3cd' }}>
          <Stack gap="md">
            <Title order={2} size="h3">
              Troubleshooting
            </Title>
            <List spacing="sm" size="sm">
              <List.Item>
                <strong>Documents not generating?</strong> Check that all required fields are filled,
                then click the refresh icon on the appointment row to retry document generation.
              </List.Item>
              <List.Item>
                <strong>User account not created?</strong> Ensure the email address is valid and unique.
                The system will create the account automatically during activation.
              </List.Item>
              <List.Item>
                <strong>Appointment stuck in DRAFT?</strong> Use the "Fix Nathan Curry Appointments" button
                (or similar fix function) to trigger the workflow manually.
              </List.Item>
              <List.Item>
                <strong>Board resolution not appearing?</strong> Check the Resolutions tab and ensure
                the resolution was created. If missing, the workflow may need to be retriggered.
              </List.Item>
              <List.Item>
                <strong>Need to update appointment details?</strong> Currently, appointments cannot be
                edited after creation. Create a new appointment with corrected information if needed.
              </List.Item>
            </List>
          </Stack>
        </Card>

        <Card padding="lg" radius="md" withBorder>
          <Stack gap="md">
            <Title order={2} size="h3">
              Best Practices
            </Title>
            <List spacing="sm" size="sm">
              <List.Item>
                Always verify email addresses before creating appointments to ensure proper account creation
              </List.Item>
              <List.Item>
                Include complete compensation and equity details to generate accurate employment agreements
              </List.Item>
              <List.Item>
                Set realistic effective dates that allow time for board approval and document signing
              </List.Item>
              <List.Item>
                Review all generated documents before proceeding to board approval
              </List.Item>
              <List.Item>
                Keep appointment notes detailed for audit trail and future reference
              </List.Item>
              <List.Item>
                Monitor the Governance Logs tab to track all appointment-related activities
              </List.Item>
            </List>
          </Stack>
        </Card>
      </Stack>
    </Container>
  );
};

export default AppointmentInstructions;

