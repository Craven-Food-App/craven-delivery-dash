import React from 'react';
import { OfficerAppointmentWorkflow } from '@/components/board/OfficerAppointmentWorkflow';
import { Card } from 'antd';

const AdminExecutiveAppointment: React.FC = () => {
  return (
    <div style={{ padding: 24 }}>
      <Card>
        <h1 style={{ marginTop: 0 }}>Corporate Officer Appointment</h1>
        <p style={{ color: '#6b7280' }}>
          Appoint corporate officers through proper board governance. Officers are appointed by the board,
          not hired like regular employees. This workflow generates board resolutions and legal documents.
        </p>
        <OfficerAppointmentWorkflow />
      </Card>
    </div>
  );
};

export default AdminExecutiveAppointment;
