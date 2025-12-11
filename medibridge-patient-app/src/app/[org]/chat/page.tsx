'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { 
  ArrowLeft, Send, Loader2, User, Stethoscope, Calendar, 
  CheckCircle, Building2, Phone, FileText, ChevronDown, 
  ChevronUp, Pill, AlertTriangle, FlaskConical, Clock,
  MessageCircle, Bot, Sparkles
} from 'lucide-react';

// ============================================
// INTERFACES
// ============================================

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  type?: 'welcome' | 'question' | 'answer' | 'general';
}

interface PrescriptionData {
  id: string;
  file_url: string | null;
  status: string;
  created_at: string;
  chief_complaint: string | null;
  patient_name: string | null;
  patient_age: string | null;
  patient_gender: string | null;
  doctor_name: string | null;
  doctor_qualifications: string | null;
  doctor_registration: string | null;
  clinic_name: string | null;
  clinic_address: string | null;
  clinic_contact: string | null;
  prescription_date_extracted: string | null;
  diagnosis: string | null;
  user_question: string | null;
  ai_answer: string | null;
  ai_analysis: string | null;
  ai_summary: string | null;
  precautions: string[] | null;
  follow_up_instructions: {
    when_to_return?: string;
    warning_signs?: string;
    lifestyle_advice?: string;
  } | null;
  total_medicines: number | null;
  total_tests: number | null;
  document_type: string | null;
  suggested_questions: string[] | string | null;
}

interface PrescriptionItem {
  id: string;
  medicine_name: string;
  dosage: string | null;
  frequency: string | null;
  timing: string | null;
  duration: string | null;
  instructions: string | null;
  item_type: string;
  purpose: string | null;
  medicine_form: string | null;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

const safeParseArray = (value: any): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      if (value.includes(',')) {
        return value.split(',').map((s: string) => s.trim()).filter(Boolean);
      }
      return [value];
    }
  }
  return [];
};

// ============================================
// COLLAPSIBLE CARD COMPONENT
// ============================================

interface CollapsibleCardProps {
  title: string;
  icon: React.ReactNode;
  iconColor: string;
  badge?: string | number;
  badgeColor?: string;
  defaultExpanded?: boolean;
  children: React.ReactNode;
  preview?: React.ReactNode;
}

const CollapsibleCard = ({ 
  title, 
  icon, 
  iconColor, 
  badge, 
  badgeColor = 'bg-slate-700 text-slate-400',
  defaultExpanded = false,
  children,
  preview 
}: CollapsibleCardProps) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden transition-all duration-200">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-700/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className={iconColor}>{icon}</span>
          <span className="text-white font-medium text-sm">{title}</span>
          {badge !== undefined && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badgeColor}`}>
              {badge}
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        )}
      </button>
      
      {!isExpanded && preview && (
        <div className="px-4 pb-3 -mt-1">
          {preview}
        </div>
      )}
      
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-slate-700/50 pt-3 animate-slideDown">
          {children}
        </div>
      )}
    </div>
  );
};

// ============================================
// STATIC CARD COMPONENT (Always Open)
// ============================================

interface StaticCardProps {
  title: string;
  icon: React.ReactNode;
  iconColor: string;
  badge?: string | number;
  badgeColor?: string;
  children: React.ReactNode;
}

const StaticCard = ({ 
  title, 
  icon, 
  iconColor, 
  badge,
  badgeColor = 'bg-slate-700 text-slate-400',
  children 
}: StaticCardProps) => {
  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
      <div className="px-4 py-3 flex items-center gap-2">
        <span className={iconColor}>{icon}</span>
        <span className="text-white font-medium text-sm">{title}</span>
        {badge !== undefined && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badgeColor}`}>
            {badge}
          </span>
        )}
      </div>
      <div className="px-4 pb-4">
        {children}
      </div>
    </div>
  );
};

// ============================================
// MARKDOWN RENDERER
// ============================================

const RenderMarkdown = ({ text, className = '' }: { text: string; className?: string }) => {
  if (!text) return null;

  const processInline = (content: string): React.ReactNode => {
    if (!content) return null;
    
    const parts: React.ReactNode[] = [];
    let remaining = content;
    let keyIndex = 0;

    while (remaining.length > 0) {
      const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
      const codeMatch = remaining.match(/`(.+?)`/);

      let earliestMatch: RegExpMatchArray | null = null;
      let earliestIndex = remaining.length;
      let matchType = '';

      if (boldMatch && boldMatch.index !== undefined && boldMatch.index < earliestIndex) {
        earliestMatch = boldMatch;
        earliestIndex = boldMatch.index;
        matchType = 'bold';
      }
      if (codeMatch && codeMatch.index !== undefined && codeMatch.index < earliestIndex) {
        earliestMatch = codeMatch;
        earliestIndex = codeMatch.index;
        matchType = 'code';
      }

      if (earliestMatch && earliestIndex < remaining.length) {
        if (earliestIndex > 0) {
          parts.push(<span key={keyIndex++}>{remaining.substring(0, earliestIndex)}</span>);
        }

        const matchContent = earliestMatch[1];
        if (matchType === 'bold') {
          parts.push(<strong key={keyIndex++} className="font-semibold text-white">{matchContent}</strong>);
        } else if (matchType === 'code') {
          parts.push(
            <code key={keyIndex++} className="px-1.5 py-0.5 bg-slate-700/50 rounded text-cyan-300 text-xs font-mono">
              {matchContent}
            </code>
          );
        }

        remaining = remaining.substring(earliestIndex + earliestMatch[0].length);
      } else {
        parts.push(<span key={keyIndex++}>{remaining}</span>);
        break;
      }
    }

    return parts.length > 0 ? parts : content;
  };

  const lines = text.split('\n');

  return (
    <div className={`space-y-1.5 ${className}`}>
      {lines.map((line, lineIndex) => {
        if (line.startsWith('### ')) {
          return (
            <h4 key={lineIndex} className="text-sm font-bold text-white mt-3 mb-1">
              {processInline(line.replace('### ', ''))}
            </h4>
          );
        }
        if (line.startsWith('## ')) {
          return (
            <h3 key={lineIndex} className="text-base font-bold text-white mt-3 mb-1">
              {processInline(line.replace('## ', ''))}
            </h3>
          );
        }

        if (line.trim() === '---' || line.trim() === '***') {
          return <hr key={lineIndex} className="border-slate-600/50 my-3" />;
        }

        if (line.trim().startsWith('- ') || line.trim().startsWith('• ') || line.trim().startsWith('* ')) {
          const content = line.trim().replace(/^[-•*]\s/, '');
          return (
            <div key={lineIndex} className="flex items-start gap-2 ml-1">
              <span className="text-cyan-400 mt-0.5 text-xs">●</span>
              <span className="text-slate-200 text-sm">{processInline(content)}</span>
            </div>
          );
        }

        const numberedMatch = line.trim().match(/^(\d+)\.\s(.+)/);
        if (numberedMatch) {
          return (
            <div key={lineIndex} className="flex items-start gap-2 ml-1">
              <span className="text-cyan-400 font-medium text-sm min-w-[18px]">{numberedMatch[1]}.</span>
              <span className="text-slate-200 text-sm">{processInline(numberedMatch[2])}</span>
            </div>
          );
        }

        if (line.trim() === '') {
          return <div key={lineIndex} className="h-1.5" />;
        }

        return (
          <p key={lineIndex} className="text-slate-200 text-sm leading-relaxed">
            {processInline(line)}
          </p>
        );
      })}
    </div>
  );
};

// ============================================
// PRESCRIPTION DETAILS COMPONENT
// ============================================

interface PrescriptionDetailsProps {
  prescription: PrescriptionData | null;
  medicines: PrescriptionItem[];
  tests: PrescriptionItem[];
  precautions: string[];
  followUp: any;
  formatDate: (date: string | null) => string;
  getAiSummary: () => string;
}

const PrescriptionDetails = ({
  prescription,
  medicines,
  tests,
  precautions,
  followUp,
  formatDate,
  getAiSummary
}: PrescriptionDetailsProps) => {
  return (
    <div className="space-y-3">
      {/* 1. Prescription Analysis (Collapsible) */}
      <CollapsibleCard
        title="Prescription Analysis"
        icon={<CheckCircle className="w-4 h-4" />}
        iconColor="text-green-400"
        defaultExpanded={true}
        preview={
          <p className="text-slate-400 text-xs">
            {prescription?.patient_name || 'Patient'} • {prescription?.patient_age || '-'} • {prescription?.status === 'analyzed' ? '✓ Analyzed' : 'Processing'}
          </p>
        }
      >
        <div className="space-y-3">
          <div className="bg-slate-700/30 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-3 h-3 text-blue-400" />
              <span className="text-blue-400 text-xs font-medium">Patient Information</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-slate-500">Name</p>
                <p className="text-white">{prescription?.patient_name || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-slate-500">Age / Gender</p>
                <p className="text-white">
                  {prescription?.patient_age || '-'}
                  {prescription?.patient_gender && ` / ${prescription.patient_gender}`}
                </p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-700/30 rounded-lg p-2">
              <p className="text-slate-500 text-xs flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Date
              </p>
              <p className="text-white text-xs mt-1">
                {formatDate(prescription?.prescription_date_extracted || prescription?.created_at || null)}
              </p>
            </div>
            <div className="bg-slate-700/30 rounded-lg p-2">
              <p className="text-slate-500 text-xs">Status</p>
              <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${
                prescription?.status === 'analyzed' || prescription?.status === 'completed'
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-yellow-500/20 text-yellow-400'
              }`}>
                {prescription?.status === 'analyzed' || prescription?.status === 'completed' ? '✓ Analyzed' : 'Processing'}
              </span>
            </div>
          </div>
        </div>
      </CollapsibleCard>

      {/* 2. AI Analysis Complete (ALWAYS OPEN) */}
      <StaticCard
        title="AI Analysis Complete"
        icon={<Sparkles className="w-4 h-4" />}
        iconColor="text-cyan-400"
      >
        <div className="space-y-3">
          {(prescription?.user_question || prescription?.chief_complaint) && (
            <div>
              <p className="text-cyan-400 text-xs font-medium mb-1">Question Asked:</p>
              <p className="text-slate-300 text-xs bg-slate-700/30 rounded-lg p-2">
                {prescription?.user_question || prescription?.chief_complaint}
              </p>
            </div>
          )}
          <div>
            <p className="text-cyan-400 text-xs font-medium mb-1">AI Summary:</p>
            <p className="text-slate-300 text-xs leading-relaxed">
              {getAiSummary()}
            </p>
          </div>
        </div>
      </StaticCard>

      {/* 3. Precautions (ALWAYS OPEN) */}
      <StaticCard
        title="Precautions"
        icon={<AlertTriangle className="w-4 h-4" />}
        iconColor="text-orange-400"
        badge={precautions.length > 0 ? precautions.length : undefined}
        badgeColor="bg-orange-500/20 text-orange-400"
      >
        {precautions.length > 0 ? (
          <ul className="space-y-2">
            {precautions.map((precaution, index) => (
              <li key={index} className="text-slate-300 text-xs flex items-start gap-2">
                <span className="text-orange-400 mt-0.5">•</span>
                <span>{precaution}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-slate-500 text-sm">No specific precautions noted</p>
        )}
      </StaticCard>

      {/* 4. Diagnostic Tests (Collapsible) */}
      <CollapsibleCard
        title="Diagnostic Tests"
        icon={<FlaskConical className="w-4 h-4" />}
        iconColor="text-teal-400"
        badge={tests.length > 0 ? tests.length : undefined}
        badgeColor="bg-teal-500/20 text-teal-400"
        preview={
          <p className="text-slate-500 text-xs">
            {tests.length > 0 ? `${tests.length} test(s) prescribed` : 'No diagnostic tests prescribed'}
          </p>
        }
      >
        {tests.length > 0 ? (
          <div className="space-y-2">
            {tests.map((test, index) => (
              <div key={test.id} className="text-sm">
                <p className="text-white font-medium">{index + 1}. {test.medicine_name}</p>
                {test.instructions && (
                  <p className="text-slate-400 text-xs ml-4">• {test.instructions}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-sm">No diagnostic tests prescribed</p>
        )}
      </CollapsibleCard>

      {/* 5. Prescribed Medicines (Collapsible) */}
      <CollapsibleCard
        title="Prescribed Medicines"
        icon={<Pill className="w-4 h-4" />}
        iconColor="text-pink-400"
        badge={medicines.length > 0 ? `${medicines.length} medicine${medicines.length > 1 ? 's' : ''}` : undefined}
        badgeColor="bg-pink-500/20 text-pink-400"
        preview={
          medicines.length > 0 ? (
            <p className="text-slate-400 text-xs">
              {medicines.slice(0, 2).map(m => m.medicine_name).join(', ')}
              {medicines.length > 2 && ` +${medicines.length - 2} more`}
            </p>
          ) : (
            <p className="text-slate-500 text-xs">No medicines prescribed</p>
          )
        }
      >
        {medicines.length > 0 ? (
          <div className="space-y-2">
            {medicines.map((med, index) => (
              <div key={med.id} className="bg-slate-700/30 rounded-lg p-3">
                <p className="text-white font-medium text-sm mb-1">
                  {index + 1}. {med.medicine_name}
                </p>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                  {med.purpose && (
                    <p className="text-slate-300"><span className="text-slate-500">Purpose:</span> {med.purpose}</p>
                  )}
                  {med.dosage && (
                    <p className="text-slate-300"><span className="text-slate-500">Dosage:</span> {med.dosage}</p>
                  )}
                  {med.frequency && (
                    <p className="text-slate-300"><span className="text-slate-500">Frequency:</span> {med.frequency}</p>
                  )}
                  {med.duration && (
                    <p className="text-slate-300"><span className="text-slate-500">Duration:</span> {med.duration}</p>
                  )}
                  {med.timing && (
                    <p className="text-slate-300"><span className="text-slate-500">Timing:</span> {med.timing}</p>
                  )}
                  {med.medicine_form && (
                    <p className="text-slate-300"><span className="text-slate-500">Form:</span> {med.medicine_form}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-sm">No medicines prescribed</p>
        )}
      </CollapsibleCard>

      {/* 6. Follow Up (Collapsible) */}
      <CollapsibleCard
        title="Follow Up"
        icon={<Clock className="w-4 h-4" />}
        iconColor="text-blue-400"
        preview={
          <p className="text-slate-400 text-xs">
            {followUp?.when_to_return || 'As advised by doctor'}
          </p>
        }
      >
        <div className="space-y-2 text-xs">
          <p className="text-slate-300">
            <span className="text-teal-400 font-medium">When to return:</span> {followUp?.when_to_return || 'As advised by doctor'}
          </p>
          {followUp?.warning_signs && (
            <p className="text-slate-300">
              <span className="text-red-400 font-medium">Warning signs:</span> {followUp.warning_signs}
            </p>
          )}
          {followUp?.lifestyle_advice && (
            <p className="text-slate-300">
              <span className="text-green-400 font-medium">Lifestyle advice:</span> {followUp.lifestyle_advice}
            </p>
          )}
        </div>
      </CollapsibleCard>

      {/* 7. Doctor Information (Collapsible) */}
      <CollapsibleCard
        title="Doctor Information"
        icon={<Stethoscope className="w-4 h-4" />}
        iconColor="text-green-400"
        preview={
          <p className="text-slate-400 text-xs">
            {prescription?.doctor_name || 'Not specified'}
          </p>
        }
      >
        <div className="space-y-2 text-xs">
          <div>
            <p className="text-slate-500">Doctor Name</p>
            <p className="text-white font-medium">{prescription?.doctor_name || 'Not specified'}</p>
          </div>
          {prescription?.doctor_qualifications && (
            <div>
              <p className="text-slate-500">Qualifications</p>
              <p className="text-white">{prescription.doctor_qualifications}</p>
            </div>
          )}
          {prescription?.doctor_registration && (
            <div>
              <p className="text-slate-500">Registration No.</p>
              <p className="text-white">{prescription.doctor_registration}</p>
            </div>
          )}
        </div>
      </CollapsibleCard>

      {/* 8. Clinic Information (Collapsible) */}
      <CollapsibleCard
        title="Clinic Information"
        icon={<Building2 className="w-4 h-4" />}
        iconColor="text-purple-400"
        preview={
          <p className="text-slate-400 text-xs">
            {prescription?.clinic_name || 'Not specified'}
          </p>
        }
      >
        <div className="space-y-2 text-xs">
          <div>
            <p className="text-slate-500">Clinic Name</p>
            <p className="text-white font-medium">{prescription?.clinic_name || 'Not specified'}</p>
          </div>
          {prescription?.clinic_address && (
            <div>
              <p className="text-slate-500">Address</p>
              <p className="text-white">{prescription.clinic_address}</p>
            </div>
          )}
          {prescription?.clinic_contact && (
            <div>
              <p className="text-slate-500">Contact</p>
              <p className="text-white flex items-center gap-1">
                <Phone className="w-3 h-3" />
                {prescription.clinic_contact}
              </p>
            </div>
          )}
        </div>
      </CollapsibleCard>

      {/* Footer */}
      <div className="text-center py-4">
        <p className="text-green-400 text-sm font-medium">सर्वे सन्तु निरामया:</p>
        <p className="text-orange-400 text-xs mt-1">"May all be free from illness"</p>
      </div>
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export default function ChatPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const org = params.org as string;
  const prescriptionId = searchParams.get('prescription_id');
  const sessionId = searchParams.get('session');

  // State
  const [prescription, setPrescription] = useState<PrescriptionData | null>(null);
  const [prescriptionItems, setPrescriptionItems] = useState<PrescriptionItem[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [orgName, setOrgName] = useState('');
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const defaultQuickQuestions = [
    'What are the side effects?',
    'Can I take this with food?',
    'What if I miss a dose?',
    'Any drug interactions?'
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch data
  useEffect(() => {
    async function fetchData() {
      try {
        const { data: orgData } = await supabase
          .from('organizations')
          .select('name')
          .eq('slug', org)
          .single();
        
        if (orgData) setOrgName(orgData.name);

        if (!prescriptionId) {
          setLoading(false);
          return;
        }

        const { data: prescriptionData, error: prescriptionError } = await supabase
          .from('prescriptions')
          .select(`
            id, file_url, status, created_at, chief_complaint,
            patient_name, patient_age, patient_gender,
            doctor_name, doctor_qualifications, doctor_registration,
            clinic_name, clinic_address, clinic_contact,
            prescription_date_extracted, diagnosis,
            user_question, ai_answer, ai_analysis, ai_summary,
            precautions, follow_up_instructions,
            total_medicines, total_tests, document_type,
            suggested_questions
          `)
          .eq('id', prescriptionId)
          .single();

        if (prescriptionError) {
          console.error('Error fetching prescription:', prescriptionError);
        } else {
          setPrescription(prescriptionData);
          
          const dbQuestions = safeParseArray(prescriptionData?.suggested_questions);
          setSuggestedQuestions(dbQuestions.length > 0 ? dbQuestions : defaultQuickQuestions);
          
          const initialMessages: Message[] = [];
          
          initialMessages.push({
            id: 'welcome',
            role: 'assistant',
            content: `Hello! I'm Dr. Bridge, your AI healthcare assistant. I've analyzed your prescription and I'm here to answer any questions you have about your medicines, dosages, and treatment plan. What would you like to know?`,
            timestamp: new Date(prescriptionData.created_at),
            type: 'welcome'
          });
          
          if (prescriptionData.user_question || prescriptionData.chief_complaint) {
            initialMessages.push({
              id: 'user-question',
              role: 'user',
              content: prescriptionData.user_question || prescriptionData.chief_complaint || '',
              timestamp: new Date(prescriptionData.created_at),
              type: 'question'
            });
          }
          
          if (prescriptionData.ai_answer) {
            initialMessages.push({
              id: 'ai-answer',
              role: 'assistant',
              content: prescriptionData.ai_answer,
              timestamp: new Date(prescriptionData.created_at),
              type: 'answer'
            });
          }
          
          setMessages(initialMessages);
        }

        const { data: itemsData, error: itemsError } = await supabase
          .from('prescription_items')
          .select('*')
          .eq('prescription_id', prescriptionId)
          .order('sequence_number', { ascending: true });

        if (!itemsError && itemsData) {
          setPrescriptionItems(itemsData);
        }

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [org, prescriptionId, sessionId, supabase]);

  // Send message
  const handleSendMessage = async (message?: string) => {
    const messageToSend = message || inputValue.trim();
    if (!messageToSend || sending) return;

    setSending(true);
    setInputValue('');

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageToSend,
      timestamp: new Date(),
      type: 'question'
    };

    setMessages(prev => [...prev, userMessage]);

    const loadingMessage: Message = {
      id: 'loading',
      role: 'assistant',
      content: '...',
      timestamp: new Date(),
      type: 'general'
    };

    setMessages(prev => [...prev, loadingMessage]);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL ||
        'https://n8n.nhcare.in/webhook/28465002-1451-4336-8fc7-eb333dec1ef3';

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prescription_id: prescriptionId,
          chat_session_id: sessionId || prescriptionId,
          user_id: user?.id,
          query: messageToSend,
          chief_complaint: messageToSend,
          channel: 'web',
          organization: org,
          document_type: 'follow_up'
        })
      });

      const result = await response.json();
      
      let answerText = result.output || result.text || 'I apologize, but I could not process your question. Please try again.';
      
      const answerMatch = answerText.match(/###\s*ANSWER TO YOUR QUESTION\s*([\s\S]*?)(?=###|---\s*###|$)/i);
      if (answerMatch) {
        answerText = answerMatch[1].trim();
      }
      
      if (result.suggested_questions) {
        const newQuestions = safeParseArray(result.suggested_questions);
        if (newQuestions.length > 0) {
          setSuggestedQuestions(newQuestions);
        }
      }
      
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== 'loading');
        return [...filtered, {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: answerText,
          timestamp: new Date(),
          type: 'answer'
        }];
      });

    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== 'loading');
        return [...filtered, {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date(),
          type: 'general'
        }];
      });
    } finally {
      setSending(false);
    }
  };

  // Data helpers
  const medicines = prescriptionItems.filter(item => item.item_type === 'medicine');
  const tests = prescriptionItems.filter(item => item.item_type === 'test');

  const getPrecautions = (): string[] => {
    if (!prescription?.precautions) return [];
    if (Array.isArray(prescription.precautions)) return prescription.precautions;
    if (typeof prescription.precautions === 'string') {
      try {
        return JSON.parse(prescription.precautions);
      } catch {
        return [prescription.precautions];
      }
    }
    return [];
  };

  const getFollowUp = () => {
    if (!prescription?.follow_up_instructions) return null;
    if (typeof prescription.follow_up_instructions === 'string') {
      try {
        return JSON.parse(prescription.follow_up_instructions);
      } catch {
        return null;
      }
    }
    return prescription.follow_up_instructions;
  };

  const getAiSummary = (): string => {
    if (prescription?.ai_summary) return prescription.ai_summary;
    if (prescription?.ai_answer) {
      return prescription.ai_answer
        .replace(/[#*_~`]/g, '')
        .replace(/\n+/g, ' ')
        .trim()
        .substring(0, 300) + '...';
    }
    return 'Prescription analyzed successfully.';
  };

  const precautions = getPrecautions();
  const followUp = getFollowUp();

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    if (dateString.includes('/')) return dateString;
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading your prescription...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      
      {/* ============================================ */}
      {/* HEADER */}
      {/* ============================================ */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold text-white">{orgName || 'MediBridge'}</h1>
            <button
              onClick={() => router.push(`/${org}/dashboard`)}
              className="text-slate-400 hover:text-white flex items-center gap-1 text-sm transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          </div>
        </div>
      </header>

      {/* ============================================ */}
      {/* DESKTOP: SPLIT LAYOUT (40/60) */}
      {/* ============================================ */}
      <div className="hidden lg:flex h-[calc(100vh-57px)]">
        
        {/* LEFT PANEL - PRESCRIPTION DETAILS (40%) */}
        <div className="w-[40%] border-r border-slate-800 bg-slate-900/50 flex flex-col">
          <div className="p-4 border-b border-slate-800 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-white font-semibold text-sm">Prescription Details</h2>
                <p className="text-slate-400 text-xs">AI-powered insights</p>
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            <PrescriptionDetails
              prescription={prescription}
              medicines={medicines}
              tests={tests}
              precautions={precautions}
              followUp={followUp}
              formatDate={formatDate}
              getAiSummary={getAiSummary}
            />
          </div>
        </div>

        {/* RIGHT PANEL - CHAT (60%) */}
        <div className="flex-1 flex flex-col bg-slate-950">
          {/* Chat Header */}
          <div className="p-4 border-b border-slate-800 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-white font-semibold text-sm">Dr. Bridge</h2>
                  <p className="text-green-400 text-xs flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                    Online • Ready to help
                  </p>
                </div>
              </div>
              
              {prescription?.patient_name && (
                <div className="flex items-center gap-2 bg-slate-800/50 pl-2 pr-3 py-1.5 rounded-full">
                  <div className="w-7 h-7 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">
                      {prescription.patient_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="text-left">
                    <p className="text-white text-xs font-medium leading-tight">{prescription.patient_name}</p>
                    <p className="text-slate-400 text-[10px] leading-tight">
                      {prescription.patient_age}{prescription.patient_gender ? ` • ${prescription.patient_gender}` : ''}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="max-w-3xl mx-auto space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-messageIn`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex-shrink-0 mr-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-cyan-500/20">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  )}
                  
                  <div
                    className={`max-w-[80%] ${
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-2xl rounded-br-md'
                        : 'bg-slate-800/80 text-white rounded-2xl rounded-bl-md border border-slate-700/50'
                    } px-4 py-3 shadow-lg`}
                  >
                    {message.role === 'user' && message.type === 'question' && (
                      <p className="text-cyan-200 font-semibold text-[10px] uppercase tracking-wide mb-1">Your Question</p>
                    )}
                    {message.role === 'assistant' && message.type === 'answer' && (
                      <p className="text-cyan-400 font-semibold text-[10px] uppercase tracking-wide mb-2">Answer to Your Question</p>
                    )}
                    
                    <div className="text-sm leading-relaxed">
                      {message.content === '...' ? (
                        <div className="flex items-center gap-2 py-1">
                          <div className="flex gap-1">
                            <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                            <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                            <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                          </div>
                          <span className="text-slate-400 text-xs">Thinking...</span>
                        </div>
                      ) : message.role === 'assistant' ? (
                        <RenderMarkdown text={message.content} />
                      ) : (
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      )}
                    </div>
                    
                    <p className={`text-[10px] mt-2 ${message.role === 'user' ? 'text-cyan-200/70' : 'text-slate-500'}`}>
                      {message.timestamp.toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </p>
                  </div>
                  
                  {message.role === 'user' && (
                    <div className="flex-shrink-0 ml-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Suggested Questions */}
          <div className="px-4 py-3 border-t border-slate-800/50 flex-shrink-0">
            <div className="max-w-3xl mx-auto">
              <p className="text-slate-500 text-xs mb-2">Quick questions:</p>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {suggestedQuestions.slice(0, 4).map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleSendMessage(question)}
                    disabled={sending}
                    className="flex-shrink-0 px-4 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs rounded-full border border-slate-700 hover:border-cyan-500/50 transition-all duration-200 disabled:opacity-50 whitespace-nowrap"
                  >
                    {question.length > 40 ? question.substring(0, 40) + '...' : question}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-slate-800 flex-shrink-0">
            <div className="max-w-3xl mx-auto">
              <div className="flex gap-3 items-end">
                <div className="flex-1 relative">
                  <textarea
                    value={inputValue}
                    onChange={(e) => {
                      setInputValue(e.target.value);
                      e.target.style.height = 'auto';
                      e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Ask anything about your prescription..."
                    disabled={sending}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 disabled:opacity-50 transition-all resize-none text-sm"
                    rows={1}
                    style={{ minHeight: '48px', maxHeight: '120px' }}
                  />
                </div>
                <button
                  onClick={() => handleSendMessage()}
                  disabled={sending || !inputValue.trim()}
                  className="p-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:scale-105 flex-shrink-0"
                >
                  {sending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
              <p className="text-center text-slate-500 text-xs mt-3">
                Press Enter to send • Shift+Enter for new line
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* MOBILE: SINGLE SCROLL LAYOUT */}
      {/* ============================================ */}
      <div className="lg:hidden">
        <div className="p-4 space-y-4">
          
          {/* Chat Header - Mobile */}
          <div className="bg-slate-800/50 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-white font-semibold text-sm">Dr. Bridge</h2>
                <p className="text-green-400 text-xs flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                  Online
                </p>
              </div>
            </div>
            {prescription?.patient_name && (
              <div className="flex items-center gap-2 bg-slate-700/50 pl-2 pr-3 py-1.5 rounded-full">
                <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-[10px] font-bold">
                    {prescription.patient_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <p className="text-white text-xs font-medium">{prescription.patient_name.split(' ')[0]}</p>
              </div>
            )}
          </div>

          {/* Chat Messages - Mobile */}
          <div className="space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className="flex-shrink-0 mr-2">
                    <div className="w-7 h-7 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center">
                      <Bot className="w-3.5 h-3.5 text-white" />
                    </div>
                  </div>
                )}
                
                <div
                  className={`max-w-[85%] ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-2xl rounded-br-md'
                      : 'bg-slate-800/80 text-white rounded-2xl rounded-bl-md border border-slate-700/50'
                  } px-3 py-2.5 shadow-lg`}
                >
                  {message.role === 'user' && message.type === 'question' && (
                    <p className="text-cyan-200 font-semibold text-[9px] uppercase tracking-wide mb-1">Your Question</p>
                  )}
                  {message.role === 'assistant' && message.type === 'answer' && (
                    <p className="text-cyan-400 font-semibold text-[9px] uppercase tracking-wide mb-1.5">Answer to Your Question</p>
                  )}
                  
                  <div className="text-sm leading-relaxed">
                    {message.content === '...' ? (
                      <div className="flex items-center gap-2 py-1">
                        <div className="flex gap-1">
                          <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                          <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                          <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </div>
                        <span className="text-slate-400 text-xs">Thinking...</span>
                      </div>
                    ) : message.role === 'assistant' ? (
                      <RenderMarkdown text={message.content} />
                    ) : (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    )}
                  </div>
                  
                  <p className={`text-[9px] mt-1.5 ${message.role === 'user' ? 'text-cyan-200/70' : 'text-slate-500'}`}>
                    {message.timestamp.toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </p>
                </div>
                
                {message.role === 'user' && (
                  <div className="flex-shrink-0 ml-2">
                    <div className="w-7 h-7 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <User className="w-3.5 h-3.5 text-white" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Suggested Questions - Mobile */}
          <div className="pt-2">
            <p className="text-slate-500 text-xs mb-2">Quick questions:</p>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {suggestedQuestions.slice(0, 4).map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleSendMessage(question)}
                  disabled={sending}
                  className="flex-shrink-0 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs rounded-full border border-slate-700 transition-all disabled:opacity-50 whitespace-nowrap"
                >
                  {question.length > 30 ? question.substring(0, 30) + '...' : question}
                </button>
              ))}
            </div>
          </div>

          {/* Input Area - Mobile */}
          <div className="bg-slate-900/80 rounded-xl p-3">
            <div className="flex gap-2 items-end">
              <textarea
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Ask anything..."
                disabled={sending}
                className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 disabled:opacity-50 transition-all resize-none text-sm"
                rows={1}
                style={{ minHeight: '40px', maxHeight: '100px' }}
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={sending || !inputValue.trim()}
                className="p-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              >
                {sending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
            <p className="text-center text-slate-500 text-[10px] mt-2">
              Press Enter to send • Shift+Enter for new line
            </p>
          </div>

          {/* ============================================ */}
          {/* PRESCRIPTION DETAILS - BELOW CHAT ON MOBILE */}
          {/* ============================================ */}
          <div className="pt-4 border-t border-slate-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-white font-semibold text-sm">Prescription Details</h2>
                <p className="text-slate-400 text-xs">AI-powered insights</p>
              </div>
            </div>
            
            <PrescriptionDetails
              prescription={prescription}
              medicines={medicines}
              tests={tests}
              precautions={precautions}
              followUp={followUp}
              formatDate={formatDate}
              getAiSummary={getAiSummary}
            />
          </div>

        </div>
      </div>

      {/* ============================================ */}
      {/* GLOBAL STYLES */}
      {/* ============================================ */}
      <style jsx global>{`
        @keyframes slideDown {
          from { opacity: 0; max-height: 0; }
          to { opacity: 1; max-height: 500px; }
        }
        
        @keyframes messageIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-slideDown {
          animation: slideDown 0.2s ease-out forwards;
        }
        
        .animate-messageIn {
          animation: messageIn 0.3s ease-out forwards;
        }
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}