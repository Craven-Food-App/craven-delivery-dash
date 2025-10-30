import React from 'react';
import { ExecutiveAppointmentForm } from '@/components/admin/ExecutiveAppointmentForm';

const AdminExecutiveAppointment: React.FC = () => {
  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ marginTop: 0 }}>C-Suite Appointment</h1>
      <p style={{ color: '#6b7280' }}>Create required documents, sync Supabase, and generate PDFs.</p>
      <ExecutiveAppointmentForm />
    </div>
  );
};

export default AdminExecutiveAppointment;
