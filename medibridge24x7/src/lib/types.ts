export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: Organization;
        Insert: Omit<Organization, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Organization, 'id' | 'created_at'>>;
      };
      organization_settings: {
        Row: OrganizationSettings;
        Insert: Omit<OrganizationSettings, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<OrganizationSettings, 'id' | 'created_at'>>;
      };
      users: {
        Row: User;
        Insert: Omit<User, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<User, 'id' | 'created_at'>>;
      };
      org_staff: {
        Row: OrgStaff;
        Insert: Omit<OrgStaff, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<OrgStaff, 'id' | 'created_at'>>;
      };
      patients: {
        Row: Patient;
        Insert: Omit<Patient, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Patient, 'id' | 'created_at'>>;
      };
    };
  };
}

export type UserRole = 'super_admin' | 'clinic_admin' | 'doctor' | 'staff';
export type OrganizationStatus = 'active' | 'inactive' | 'suspended';

export interface Organization {
  id: string;
  name: string;
  subdomain: string;
  logo_url?: string;
  status: OrganizationStatus;
  created_at: string;
  updated_at: string;
}

export interface OrganizationSettings {
  id: string;
  organization_id: string;
  primary_color?: string;
  secondary_color?: string;
  logo_url?: string;
  ai_enabled: boolean;
  escalation_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface OrgStaff {
  id: string;
  user_id: string;
  organization_id: string;
  can_handle_escalations: boolean;
  created_at: string;
  updated_at: string;
}

export interface Patient {
  id: string;
  organization_id: string;
  full_name: string;
  age?: number;
  gender?: string;
  phone?: string;
  email?: string;
  address?: string;
  medical_history: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface AuthUser {
  id: string;
  email: string;
  user_metadata?: Record<string, any>;
}

export interface Session {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  user: AuthUser;
}
