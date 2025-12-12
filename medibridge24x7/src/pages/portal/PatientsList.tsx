import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuthStore } from '../../store/authStore';
import {
  Search,
  Calendar,
  ChevronLeft,
  ChevronRight,
  User,
  Phone,
  Mail,
  MessageSquare,
  FileText,
  Clock,
  Eye,
  X,
  Filter,
  Download
} from 'lucide-react';

// ============================================
// TYPE DEFINITIONS
// ============================================

interface Patient {
  id: string;
  full_name: string;
  gender: string | null;
  age: number | null;
  date_of_birth: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  created_at: string;
  last_visit_date: string | null;
  total_visits: number;
  last_consultation: {
    date: string;
    doctor_id: string;
    status: string;
  } | null;
  chat_count: number;
  last_chat_date: string | null;
  prescription_count: number;
}

interface PatientListResponse {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  data: Patient[];
}

// ============================================
// SEARCH FILTERS COMPONENT
// ============================================

function SearchFilters({
  searchTerm,
  onSearchChange,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  onClear,
  totalCount
}: {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onClear: () => void;
  totalCount: number;
}) {
  const hasFilters = searchTerm || dateFrom || dateTo;

  return (
    <div className="rounded-2xl bg-slate-800/30 border border-slate-700/50 p-4">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search Input */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by name, phone, or email..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-teal-500/50 transition-colors"
            />
          </div>
        </div>

        {/* Date Filters */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-500" />
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => onDateFromChange(e.target.value)}
            className="px-3 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white text-sm focus:outline-none focus:border-teal-500/50 transition-colors"
            placeholder="From"
          />
          <span className="text-slate-500">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => onDateToChange(e.target.value)}
            className="px-3 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white text-sm focus:outline-none focus:border-teal-500/50 transition-colors"
            placeholder="To"
          />
        </div>

        {/* Clear Button */}
        {hasFilters && (
          <button
            onClick={onClear}
            className="flex items-center gap-2 px-4 py-2.5 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-xl transition-colors"
          >
            <X className="w-4 h-4" />
            <span className="text-sm">Clear</span>
          </button>
        )}
      </div>

      {/* Results count */}
      <div className="mt-3 pt-3 border-t border-slate-700/50 flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Found <span className="text-white font-medium">{totalCount}</span> patients
        </p>
        {hasFilters && (
          <div className="flex items-center gap-2 text-xs text-teal-400">
            <Filter className="w-3 h-3" />
            <span>Filters applied</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// PATIENT ROW COMPONENT
// ============================================

function PatientRow({ patient, onClick }: { patient: Patient; onClick: () => void }) {
  const formatDate = (date: string | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatDateTime = (date: string | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <tr 
      className="group border-b border-slate-800/50 hover:bg-slate-800/30 cursor-pointer transition-colors"
      onClick={onClick}
    >
      {/* Patient Info */}
      <td className="py-4 px-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white font-semibold text-sm shadow-lg">
            {patient.full_name?.charAt(0) || 'P'}
          </div>
          <div>
            <p className="text-white font-medium">{patient.full_name}</p>
            <p className="text-xs text-slate-500">
              {patient.gender || 'N/A'} • {patient.age ? `${patient.age} yrs` : 'Age N/A'}
            </p>
          </div>
        </div>
      </td>

      {/* Contact */}
      <td className="py-4 px-4">
        <div className="space-y-1">
          {patient.phone && (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Phone className="w-3 h-3" />
              <span>{patient.phone}</span>
            </div>
          )}
          {patient.email && (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Mail className="w-3 h-3" />
              <span className="truncate max-w-[180px]">{patient.email}</span>
            </div>
          )}
        </div>
      </td>

      {/* Last Consultation */}
      <td className="py-4 px-4">
        {patient.last_consultation ? (
          <div className="space-y-1">
            <p className="text-sm text-white">{formatDateTime(patient.last_consultation.date)}</p>
            <span className={`inline-block text-xs px-2 py-0.5 rounded-full ${
              patient.last_consultation.status === 'completed' ? 'bg-green-500/20 text-green-400' :
              patient.last_consultation.status === 'scheduled' ? 'bg-blue-500/20 text-blue-400' :
              patient.last_consultation.status === 'confirmed' ? 'bg-teal-500/20 text-teal-400' :
              'bg-slate-500/20 text-slate-400'
            }`}>
              {patient.last_consultation.status || 'N/A'}
            </span>
          </div>
        ) : (
          <span className="text-sm text-slate-500">No consultations</span>
        )}
      </td>

      {/* Chat Count */}
      <td className="py-4 px-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-blue-400" />
          <span className="text-white font-medium">{patient.chat_count || 0}</span>
        </div>
        {patient.last_chat_date && (
          <p className="text-xs text-slate-500 mt-1">
            Last: {formatDate(patient.last_chat_date)}
          </p>
        )}
      </td>

      {/* Prescriptions */}
      <td className="py-4 px-4">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-teal-400" />
          <span className="text-white font-medium">{patient.prescription_count || 0}</span>
        </div>
      </td>

      {/* Registered */}
      <td className="py-4 px-4">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Clock className="w-3 h-3" />
          <span>{formatDate(patient.created_at)}</span>
        </div>
      </td>

      {/* Actions */}
      <td className="py-4 px-4">
        <button 
          className="p-2 text-slate-400 hover:text-teal-400 hover:bg-teal-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
          onClick={(e) => { e.stopPropagation(); onClick(); }}
        >
          <Eye className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
}

// ============================================
// PAGINATION COMPONENT
// ============================================

function Pagination({
  currentPage,
  totalPages,
  total,
  pageSize,
  onPageChange
}: {
  currentPage: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, total);

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800/50">
      <p className="text-sm text-slate-500">
        Showing <span className="text-white">{startItem}</span> to <span className="text-white">{endItem}</span> of <span className="text-white">{total}</span> patients
      </p>
      
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        
        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, i) => (
            typeof page === 'number' ? (
              <button
                key={i}
                onClick={() => onPageChange(page)}
                className={`w-8 h-8 text-sm rounded-lg transition-colors ${
                  currentPage === page
                    ? 'bg-teal-500 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {page}
              </button>
            ) : (
              <span key={i} className="px-2 text-slate-500">...</span>
            )
          ))}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || totalPages === 0}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ============================================
// MAIN PATIENTS LIST COMPONENT
// ============================================

export function PatientsList() {
  const navigate = useNavigate();
  const { organization } = useAuthStore();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const pageSize = 20;

  const fetchPatients = useCallback(async () => {
    if (!organization?.id) return;

    setLoading(true);

    try {
      const { data, error } = await supabase.rpc('get_patients_list', {
        org_id: organization.id,
        search_term: searchTerm || null,
        date_from: dateFrom ? new Date(dateFrom).toISOString() : null,
        date_to: dateTo ? new Date(dateTo + 'T23:59:59').toISOString() : null,
        page_num: currentPage,
        page_size: pageSize
      });

      if (!error && data) {
        const response = data as PatientListResponse;
        setPatients(response.data || []);
        setTotalCount(response.total || 0);
        setTotalPages(response.total_pages || 1);
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  }, [organization?.id, searchTerm, dateFrom, dateTo, currentPage]);

  // Fetch patients when filters change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPatients();
    }, searchTerm ? 500 : 0); // Debounce search

    return () => clearTimeout(timer);
  }, [fetchPatients]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, dateFrom, dateTo]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
  };

  const handlePatientClick = (patientId: string) => {
    navigate(`/portal/patients/${patientId}`);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Patients</h1>
          <p className="text-slate-400 text-sm">Manage and view all registered patients</p>
        </div>
      </div>

      {/* Search & Filters */}
      <SearchFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        onClear={handleClearFilters}
        totalCount={totalCount}
      />

      {/* Patients Table */}
      <div className="rounded-2xl bg-slate-800/30 border border-slate-700/50 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400 mt-2">Loading patients...</p>
          </div>
        ) : patients.length === 0 ? (
          <div className="p-8 text-center">
            <User className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No patients found</p>
            {(searchTerm || dateFrom || dateTo) && (
              <button
                onClick={handleClearFilters}
                className="mt-2 text-sm text-teal-400 hover:text-teal-300"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700/50 bg-slate-800/50">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Patient</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Contact</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Last Consultation</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Chats</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Prescriptions</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Registered</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map((patient) => (
                    <PatientRow
                      key={patient.id}
                      patient={patient}
                      onClick={() => handlePatientClick(patient.id)}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                total={totalCount}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
