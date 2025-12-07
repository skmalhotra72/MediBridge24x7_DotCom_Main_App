import { Routes, Route } from 'react-router-dom';
import { PortalLayout } from '../components/portal/PortalLayout';
import { Dashboard } from './portal/Dashboard';
import { PatientsList } from './portal/PatientsList';
import { PatientDetail } from './portal/PatientDetail';
import { ConsultationsList } from './portal/ConsultationsList';
import { ConsultationForm } from './portal/ConsultationForm';
import { PrescriptionForm } from './portal/PrescriptionForm';
import { PrescriptionView } from './portal/PrescriptionView';
import { LabOrderForm } from './portal/LabOrderForm';
import { LabOrdersList } from './portal/LabOrdersList';
import { LabReportUpload } from './portal/LabReportUpload';
import { ChatSessions } from './portal/ChatSessions';
import { ChatRoom } from './portal/ChatRoom';
import { EscalationsList } from './portal/EscalationsList';

export const PortalDashboard = () => {
  return (
    <PortalLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/patients" element={<PatientsList />} />
        <Route path="/patients/:id" element={<PatientDetail />} />
        <Route path="/consultations" element={<ConsultationsList />} />
        <Route path="/consultations/new" element={<ConsultationForm />} />
        <Route path="/consultations/:id" element={<ConsultationForm />} />
        <Route path="/consultations/:id/prescription" element={<PrescriptionForm />} />
        <Route path="/consultations/:id/lab-order" element={<LabOrderForm />} />
        <Route path="/prescriptions/:id" element={<PrescriptionView />} />
        <Route path="/lab-orders" element={<LabOrdersList />} />
        <Route path="/lab-orders/new" element={<LabOrderForm />} />
        <Route path="/lab-orders/:id/upload" element={<LabReportUpload />} />
        <Route path="/chat" element={<ChatSessions />} />
        <Route path="/chat/:sessionId" element={<ChatRoom />} />
        <Route path="/escalations" element={<EscalationsList />} />
      </Routes>
    </PortalLayout>
  );
};
