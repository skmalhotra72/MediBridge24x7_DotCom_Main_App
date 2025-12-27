import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuthStore } from '../../store/authStore';
import {
  Search,
  Plus,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  User,
  Mail,
  Phone,
  Building2,
  Shield,
  Stethoscope,
  HeartPulse,
  Headset,
  FlaskConical,
  Pill,
  UserCheck,
  CreditCard,
  FileEdit,
  BarChart3,
  Ambulance,
  ShieldCheck,
  MoreVertical,
  Edit,
  UserX,
  UserPlus,
  Loader2,
  CheckCircle,
  AlertCircle,
  Calendar,
  Briefcase
} from 'lucide-react';

// ============================================
// TYPE DEFINITIONS
// ============================================

interface StaffMember {
  id: string;
  employee_id: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  profile_photo_url: string | null;
  gender: string | null;
  is_active: boolean;
  is_verified: boolean;
  employment_type: string | null;
  joining_date: string | null;
  last_login_at: string | null;
  can_handle_escalations: boolean;
  can_prescribe: boolean;
  can_approve_lab_orders: boolean;
  specialization: string | null;
  qualification: string | null;
  registration_number: string | null;
  experience_years: number | null;
  role_id: string;
  role_key: string;
  role_name: string;
  role_category: string;
  hierarchy_level: number;
  role_color: string;
  role_icon: string;
  department_id: string | null;
  department_code: string | null;
  department_name: string | null;
  department_icon: string | null;
  department_color: string | null;
  created_at: string;
}

interface Role {
  id: string;
  role_key: string;
  role_name: string;
  role_description: string | null;
  role_category: string;
  hierarchy_level: number;
  is_system_role: boolean;
  is_active: boolean;
  color_code: string;
  icon_name: string;
  active_staff_count: number;
  total_staff_count: number;
  permission_count: number;
}

interface Department {
  id: string;
  department_code: string;
  department_name: string;
  location: string | null;
  is_active: boolean;
  icon_name: string;
  color_code: string;
  active_staff_count: number;
  total_staff_count: number;
}

interface StaffListResponse {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  data: StaffMember[];
}

// ============================================
// ICON MAPPING
// ============================================

const iconMap: Record<string, any> = {
  Shield: Shield,
  ShieldCheck: ShieldCheck,
  Building2: Building2,
  BarChart3: BarChart3,
  Stethoscope: Stethoscope,
  HeartPulse: HeartPulse,
  Ambulance: Ambulance,
  Headset: Headset,
  FlaskConical: FlaskConical,
  Pill: Pill,
  UserCheck: UserCheck,
  CreditCard: CreditCard,
  FileEdit: FileEdit,
  User: User,
};

function getIcon(iconName: string) {
  return iconMap[iconName] || User;
}

// ============================================
// ROLE BADGE COMPONENT
// ============================================

function RoleBadge({ role, size = 'sm' }: { role: { role_name: string; role_color: string; role_icon: string; role_category: string }; size?: 'sm' | 'md' }) {
  const Icon = getIcon(role.role_icon);
  const sizeClasses = size === 'md' ? 'px-3 py-1.5 text-sm' : 'px-2 py-1 text-xs';
  
  return (
    <span 
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${sizeClasses}`}
      style={{ 
        backgroundColor: `${role.role_color}20`, 
        color: role.role_color,
        border: `1px solid ${role.role_color}40`
      }}
    >
      <Icon className="w-3 h-3" />
      {role.role_name}
    </span>
  );
}

// ============================================
// DEPARTMENT BADGE COMPONENT
// ============================================

function DepartmentBadge({ department }: { department: { department_name: string; department_color: string | null; department_icon: string | null } | null }) {
  if (!department?.department_name) return <span className="text-xs text-slate-500">No Department</span>;
  
  return (
    <span 
      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium"
      style={{ 
        backgroundColor: `${department.department_color || '#64748b'}15`, 
        color: department.department_color || '#64748b'
      }}
    >
      <Building2 className="w-3 h-3" />
      {department.department_name}
    </span>
  );
}

// ============================================
// STATUS BADGE COMPONENT
// ============================================

function StatusBadge({ isActive }: { isActive: boolean }) {
  return isActive ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
      <CheckCircle className="w-3 h-3" />
      Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
      <AlertCircle className="w-3 h-3" />
      Inactive
    </span>
  );
}

// ============================================
// STAFF CARD COMPONENT
// ============================================

interface StaffCardProps {
  staff: StaffMember;
  onEdit: (staff: StaffMember) => void;
  onToggleStatus: (staff: StaffMember) => void;
}

function StaffCard({ staff, onEdit, onToggleStatus }: StaffCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const formatDate = (date: string | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-5 hover:border-slate-600/50 transition-all">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-semibold"
            style={{ backgroundColor: staff.role_color || '#6366f1' }}
          >
            {staff.profile_photo_url ? (
              <img src={staff.profile_photo_url} alt={staff.full_name} className="w-12 h-12 rounded-full object-cover" />
            ) : (
              staff.full_name?.charAt(0)?.toUpperCase() || 'U'
            )}
          </div>
          
          {/* Name & Role */}
          <div>
            <h3 className="text-white font-semibold">{staff.full_name}</h3>
            <RoleBadge role={staff} />
          </div>
        </div>

        {/* Actions Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
          >
            <MoreVertical className="w-4 h-4 text-slate-400" />
          </button>
          
          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-full mt-1 w-40 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-20 py-1">
                <button
                  onClick={() => { onEdit(staff); setShowMenu(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700/50"
                >
                  <Edit className="w-4 h-4" />
                  Edit Details
                </button>
                <button
                  onClick={() => { onToggleStatus(staff); setShowMenu(false); }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm ${staff.is_active ? 'text-red-400 hover:bg-red-500/10' : 'text-green-400 hover:bg-green-500/10'}`}
                >
                  {staff.is_active ? <UserX className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                  {staff.is_active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Contact Info */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Mail className="w-4 h-4 text-slate-500" />
          <span className="truncate">{staff.email}</span>
        </div>
        {staff.phone && (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Phone className="w-4 h-4 text-slate-500" />
            <span>{staff.phone}</span>
          </div>
        )}
      </div>

      {/* Department & Employee ID */}
      <div className="flex items-center justify-between mb-4">
        <DepartmentBadge department={staff.department_name ? { 
          department_name: staff.department_name, 
          department_color: staff.department_color, 
          department_icon: staff.department_icon 
        } : null} />
        {staff.employee_id && (
          <span className="text-xs text-slate-500">ID: {staff.employee_id}</span>
        )}
      </div>

      {/* Professional Info (for clinical roles) */}
      {(staff.role_category === 'clinical' && (staff.specialization || staff.qualification)) && (
        <div className="p-3 bg-slate-800/50 rounded-xl mb-4">
          {staff.specialization && (
            <p className="text-xs text-slate-400">
              <span className="text-slate-500">Specialization:</span> {staff.specialization}
            </p>
          )}
          {staff.qualification && (
            <p className="text-xs text-slate-400 mt-1">
              <span className="text-slate-500">Qualification:</span> {staff.qualification}
            </p>
          )}
          {staff.registration_number && (
            <p className="text-xs text-slate-400 mt-1">
              <span className="text-slate-500">Reg. No:</span> {staff.registration_number}
            </p>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-700/50">
        <StatusBadge isActive={staff.is_active} />
        <div className="flex items-center gap-3 text-xs text-slate-500">
          {staff.joining_date && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Joined {formatDate(staff.joining_date)}
            </span>
          )}
        </div>
      </div>

      {/* Capabilities */}
      {(staff.can_handle_escalations || staff.can_prescribe || staff.can_approve_lab_orders) && (
        <div className="flex flex-wrap gap-1 mt-3">
          {staff.can_handle_escalations && (
            <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-400 text-xs rounded-full">Escalations</span>
          )}
          {staff.can_prescribe && (
            <span className="px-2 py-0.5 bg-green-500/10 text-green-400 text-xs rounded-full">Prescribe</span>
          )}
          {staff.can_approve_lab_orders && (
            <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 text-xs rounded-full">Lab Approval</span>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// ADD/EDIT USER MODAL COMPONENT
// ============================================

interface UserModalProps {
  isOpen: boolean;
  staff: StaffMember | null;
  roles: Role[];
  departments: Department[];
  onClose: () => void;
  onSave: (data: any) => void;
  isLoading: boolean;
}

function UserModal({ isOpen, staff, roles, departments, onClose, onSave, isLoading }: UserModalProps) {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    employee_id: '',
    gender: '',
    role_key: '',
    department_id: '',
    employment_type: 'full_time',
    joining_date: '',
    qualification: '',
    specialization: '',
    registration_number: '',
    experience_years: '',
    can_handle_escalations: false,
    can_prescribe: false,
    can_approve_lab_orders: false,
  });

  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  useEffect(() => {
    if (staff) {
      setFormData({
        full_name: staff.full_name || '',
        email: staff.email || '',
        phone: staff.phone || '',
        employee_id: staff.employee_id || '',
        gender: staff.gender || '',
        role_key: staff.role_key || '',
        department_id: staff.department_id || '',
        employment_type: staff.employment_type || 'full_time',
        joining_date: staff.joining_date?.split('T')[0] || '',
        qualification: staff.qualification || '',
        specialization: staff.specialization || '',
        registration_number: staff.registration_number || '',
        experience_years: staff.experience_years?.toString() || '',
        can_handle_escalations: staff.can_handle_escalations || false,
        can_prescribe: staff.can_prescribe || false,
        can_approve_lab_orders: staff.can_approve_lab_orders || false,
      });
      setSelectedRole(roles.find(r => r.role_key === staff.role_key) || null);
    } else {
      setFormData({
        full_name: '',
        email: '',
        phone: '',
        employee_id: '',
        gender: '',
        role_key: '',
        department_id: '',
        employment_type: 'full_time',
        joining_date: '',
        qualification: '',
        specialization: '',
        registration_number: '',
        experience_years: '',
        can_handle_escalations: false,
        can_prescribe: false,
        can_approve_lab_orders: false,
      });
      setSelectedRole(null);
    }
  }, [staff, roles]);

  const handleRoleChange = (roleKey: string) => {
    setFormData({ ...formData, role_key: roleKey });
    setSelectedRole(roles.find(r => r.role_key === roleKey) || null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      experience_years: formData.experience_years ? parseInt(formData.experience_years) : null,
      department_id: formData.department_id || null,
    });
  };

  if (!isOpen) return null;

  const isClinicalRole = selectedRole?.role_category === 'clinical';

  // Group roles by category
  const rolesByCategory = roles.reduce((acc, role) => {
    if (!acc[role.role_category]) acc[role.role_category] = [];
    acc[role.role_category].push(role);
    return acc;
  }, {} as Record<string, Role[]>);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center">
              {staff ? <Edit className="w-5 h-5 text-white" /> : <UserPlus className="w-5 h-5 text-white" />}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                {staff ? 'Edit Staff Member' : 'Add New Staff Member'}
              </h2>
              <p className="text-sm text-slate-400">
                {staff ? 'Update staff details and permissions' : 'Create a new staff account'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Basic Information */}
          <div>
            <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
              <User className="w-4 h-4" />
              Basic Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-teal-500"
                  placeholder="Dr. John Doe"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Employee ID</label>
                <input
                  type="text"
                  value={formData.employee_id}
                  onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-teal-500"
                  placeholder="EMP001"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-teal-500"
                  placeholder="john@clinic.com"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-teal-500"
                  placeholder="+91 98765 43210"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-teal-500"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Joining Date</label>
                <input
                  type="date"
                  value={formData.joining_date}
                  onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Role & Department */}
          <div>
            <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Role & Department
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Role *</label>
                <select
                  required
                  value={formData.role_key}
                  onChange={(e) => handleRoleChange(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-teal-500"
                >
                  <option value="">Select Role</option>
                  {Object.entries(rolesByCategory).map(([category, categoryRoles]) => (
                    <optgroup key={category} label={category.charAt(0).toUpperCase() + category.slice(1)}>
                      {categoryRoles.map(role => (
                        <option key={role.role_key} value={role.role_key}>
                          {role.role_name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Department</label>
                <select
                  value={formData.department_id}
                  onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-teal-500"
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.department_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Employment Type</label>
                <select
                  value={formData.employment_type}
                  onChange={(e) => setFormData({ ...formData, employment_type: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-teal-500"
                >
                  <option value="full_time">Full Time</option>
                  <option value="part_time">Part Time</option>
                  <option value="contract">Contract</option>
                  <option value="visiting">Visiting</option>
                  <option value="intern">Intern</option>
                </select>
              </div>
            </div>
          </div>

          {/* Professional Information (for clinical roles) */}
          {isClinicalRole && (
            <div>
              <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                <Stethoscope className="w-4 h-4" />
                Professional Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Qualification</label>
                  <input
                    type="text"
                    value={formData.qualification}
                    onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-teal-500"
                    placeholder="MBBS, MD"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Specialization</label>
                  <input
                    type="text"
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-teal-500"
                    placeholder="Cardiology"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Registration Number</label>
                  <input
                    type="text"
                    value={formData.registration_number}
                    onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-teal-500"
                    placeholder="MCI-12345"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Experience (Years)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.experience_years}
                    onChange={(e) => setFormData({ ...formData, experience_years: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-teal-500"
                    placeholder="10"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Permissions */}
          <div>
            <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Special Permissions
            </h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl cursor-pointer hover:bg-slate-800">
                <input
                  type="checkbox"
                  checked={formData.can_handle_escalations}
                  onChange={(e) => setFormData({ ...formData, can_handle_escalations: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-600 text-teal-500 focus:ring-teal-500"
                />
                <div>
                  <p className="text-sm text-white">Can Handle Escalations</p>
                  <p className="text-xs text-slate-500">Receive and respond to patient escalations</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl cursor-pointer hover:bg-slate-800">
                <input
                  type="checkbox"
                  checked={formData.can_prescribe}
                  onChange={(e) => setFormData({ ...formData, can_prescribe: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-600 text-teal-500 focus:ring-teal-500"
                />
                <div>
                  <p className="text-sm text-white">Can Prescribe Medicines</p>
                  <p className="text-xs text-slate-500">Authority to create and sign prescriptions</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl cursor-pointer hover:bg-slate-800">
                <input
                  type="checkbox"
                  checked={formData.can_approve_lab_orders}
                  onChange={(e) => setFormData({ ...formData, can_approve_lab_orders: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-600 text-teal-500 focus:ring-teal-500"
                />
                <div>
                  <p className="text-sm text-white">Can Approve Lab Orders</p>
                  <p className="text-xs text-slate-500">Approve pending laboratory test orders</p>
                </div>
              </label>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-5 border-t border-slate-700 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white rounded-xl font-medium transition-all flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                {staff ? 'Update Staff' : 'Create Staff'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// MAIN USERS LIST COMPONENT
// ============================================

export function UsersList() {
  const { organization } = useAuthStore();
  
  // Data states
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  
  // UI states
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<boolean | null>(null);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const pageSize = 12;

  // Fetch staff list
  const fetchStaff = useCallback(async () => {
    if (!organization?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_staff_list', {
        p_org_id: organization.id,
        p_search: searchTerm || null,
        p_role_key: roleFilter || null,
        p_department_id: departmentFilter || null,
        p_is_active: statusFilter,
        p_page: currentPage,
        p_page_size: pageSize
      });

      if (!error && data) {
        const response = data as StaffListResponse;
        setStaff(response.data || []);
        setTotalCount(response.total || 0);
        setTotalPages(response.total_pages || 1);
      }
    } catch (error) {
      console.error('Error fetching staff:', error);
    } finally {
      setLoading(false);
    }
  }, [organization?.id, searchTerm, roleFilter, departmentFilter, statusFilter, currentPage]);

  // Fetch roles
  const fetchRoles = useCallback(async () => {
    if (!organization?.id) return;
    
    try {
      const { data, error } = await supabase.rpc('get_roles_list', {
        p_org_id: organization.id
      });

      if (!error && data) {
        setRoles(data as Role[]);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  }, [organization?.id]);

  // Fetch departments
  const fetchDepartments = useCallback(async () => {
    if (!organization?.id) return;
    
    try {
      const { data, error } = await supabase.rpc('get_departments_list', {
        p_org_id: organization.id
      });

      if (!error && data) {
        setDepartments(data as Department[]);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  }, [organization?.id]);

  // Initial load
  useEffect(() => {
    fetchRoles();
    fetchDepartments();
  }, [fetchRoles, fetchDepartments]);

  // Fetch staff with debounce for search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStaff();
    }, searchTerm ? 500 : 0);

    return () => clearTimeout(timer);
  }, [fetchStaff]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter, departmentFilter, statusFilter]);

  // Handle save (create or update)
  const handleSave = async (formData: any) => {
    if (!organization?.id) return;
    
    setIsSaving(true);
    try {
      if (editingStaff) {
        // Update existing staff
        const { data, error } = await supabase.rpc('update_staff_member', {
          p_staff_id: editingStaff.id,
          p_full_name: formData.full_name,
          p_email: formData.email,
          p_role_key: formData.role_key,
          p_department_id: formData.department_id,
          p_phone: formData.phone,
          p_employee_id: formData.employee_id,
          p_gender: formData.gender,
          p_employment_type: formData.employment_type,
          p_joining_date: formData.joining_date || null,
          p_qualification: formData.qualification,
          p_specialization: formData.specialization,
          p_registration_number: formData.registration_number,
          p_experience_years: formData.experience_years,
          p_can_handle_escalations: formData.can_handle_escalations,
          p_can_prescribe: formData.can_prescribe,
          p_can_approve_lab_orders: formData.can_approve_lab_orders,
        });

        if (data?.success) {
          setIsModalOpen(false);
          setEditingStaff(null);
          fetchStaff();
        } else {
          alert(data?.error || 'Failed to update staff member');
        }
      } else {
        // Create new staff
        const { data, error } = await supabase.rpc('create_staff_member', {
          p_org_id: organization.id,
          p_full_name: formData.full_name,
          p_email: formData.email,
          p_role_key: formData.role_key,
          p_department_id: formData.department_id,
          p_phone: formData.phone,
          p_employee_id: formData.employee_id,
          p_gender: formData.gender,
          p_employment_type: formData.employment_type,
          p_joining_date: formData.joining_date || null,
          p_qualification: formData.qualification,
          p_specialization: formData.specialization,
          p_registration_number: formData.registration_number,
          p_experience_years: formData.experience_years,
          p_can_handle_escalations: formData.can_handle_escalations,
          p_can_prescribe: formData.can_prescribe,
          p_can_approve_lab_orders: formData.can_approve_lab_orders,
        });

        if (data?.success) {
          setIsModalOpen(false);
          fetchStaff();
        } else {
          alert(data?.error || 'Failed to create staff member');
        }
      }
    } catch (error) {
      console.error('Error saving staff:', error);
      alert('An error occurred while saving');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle toggle status
  const handleToggleStatus = async (staffMember: StaffMember) => {
    const newStatus = !staffMember.is_active;
    const confirmMsg = newStatus 
      ? `Activate ${staffMember.full_name}?`
      : `Deactivate ${staffMember.full_name}? They will lose access to the portal.`;
    
    if (!confirm(confirmMsg)) return;

    try {
      const { data, error } = await supabase.rpc('update_staff_member', {
        p_staff_id: staffMember.id,
        p_is_active: newStatus
      });

      if (data?.success) {
        fetchStaff();
      } else {
        alert(data?.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  // Handle edit
  const handleEdit = (staffMember: StaffMember) => {
    setEditingStaff(staffMember);
    setIsModalOpen(true);
  };

  // Handle add new
  const handleAddNew = () => {
    setEditingStaff(null);
    setIsModalOpen(true);
  };

  // Clear filters
  const handleClearFilters = () => {
    setSearchTerm('');
    setRoleFilter('');
    setDepartmentFilter('');
    setStatusFilter(null);
    setCurrentPage(1);
  };

  const hasFilters = searchTerm || roleFilter || departmentFilter || statusFilter !== null;

  // Group roles by category for filter dropdown
  const rolesByCategory = roles.reduce((acc, role) => {
    if (!acc[role.role_category]) acc[role.role_category] = [];
    acc[role.role_category].push(role);
    return acc;
  }, {} as Record<string, Role[]>);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Users & Staff</h1>
          <p className="text-slate-400 text-sm">Manage staff members, roles, and permissions</p>
        </div>
        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white rounded-xl font-medium transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Staff
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center">
              <User className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{totalCount}</p>
              <p className="text-xs text-slate-500">Total Staff</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {roles.filter(r => r.role_category === 'clinical').reduce((sum, r) => sum + r.active_staff_count, 0)}
              </p>
              <p className="text-xs text-slate-500">Clinical Staff</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{roles.length}</p>
              <p className="text-xs text-slate-500">Roles Defined</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{departments.length}</p>
              <p className="text-xs text-slate-500">Departments</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-2xl bg-slate-800/30 border border-slate-700/50 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search by name, email, employee ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-teal-500/50"
              />
            </div>
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white text-sm focus:outline-none focus:border-teal-500/50"
          >
            <option value="">All Roles</option>
            {Object.entries(rolesByCategory).map(([category, categoryRoles]) => (
              <optgroup key={category} label={category.charAt(0).toUpperCase() + category.slice(1)}>
                {categoryRoles.map(role => (
                  <option key={role.role_key} value={role.role_key}>
                    {role.role_name} ({role.active_staff_count})
                  </option>
                ))}
              </optgroup>
            ))}
          </select>

          {/* Department Filter */}
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white text-sm focus:outline-none focus:border-teal-500/50"
          >
            <option value="">All Departments</option>
            {departments.map(dept => (
              <option key={dept.id} value={dept.id}>
                {dept.department_name} ({dept.active_staff_count})
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter === null ? '' : statusFilter.toString()}
            onChange={(e) => setStatusFilter(e.target.value === '' ? null : e.target.value === 'true')}
            className="px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white text-sm focus:outline-none focus:border-teal-500/50"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>

          {hasFilters && (
            <button
              onClick={handleClearFilters}
              className="flex items-center gap-2 px-4 py-2.5 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-xl transition-colors"
            >
              <X className="w-4 h-4" />
              <span className="text-sm">Clear</span>
            </button>
          )}
        </div>

        {/* Results count */}
        <div className="mt-3 pt-3 border-t border-slate-700/50">
          <p className="text-sm text-slate-500">
            Found <span className="text-white font-medium">{totalCount}</span> staff members
          </p>
        </div>
      </div>

      {/* Staff Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 bg-slate-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : staff.length === 0 ? (
        <div className="text-center py-12 rounded-2xl bg-slate-800/30 border border-slate-700/50">
          <User className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No staff members found</p>
          {hasFilters ? (
            <button onClick={handleClearFilters} className="mt-2 text-sm text-teal-400 hover:text-teal-300">
              Clear filters
            </button>
          ) : (
            <button onClick={handleAddNew} className="mt-2 text-sm text-teal-400 hover:text-teal-300">
              Add your first staff member
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {staff.map((member) => (
              <StaffCard
                key={member.id}
                staff={member}
                onEdit={handleEdit}
                onToggleStatus={handleToggleStatus}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 bg-slate-800/30 rounded-xl border border-slate-700/50">
              <p className="text-sm text-slate-500">
                Page {currentPage} of {totalPages} ({totalCount} total)
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Add/Edit Modal */}
      <UserModal
        isOpen={isModalOpen}
        staff={editingStaff}
        roles={roles}
        departments={departments}
        onClose={() => { setIsModalOpen(false); setEditingStaff(null); }}
        onSave={handleSave}
        isLoading={isSaving}
      />
    </div>
  );
}