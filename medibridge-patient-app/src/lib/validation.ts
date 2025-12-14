/**
 * MediBridge Form Validation Utilities
 * Shared validation functions for consistent validation across the app
 */

// Indian phone number validation (must start with 6-9, exactly 10 digits)
export const isValidIndianPhone = (phone: string): boolean => {
    const cleanPhone = phone.replace(/\s+/g, ''); // Remove spaces
    return /^[6-9]\d{9}$/.test(cleanPhone);
  };
  
  // Name validation (only letters and spaces, minimum 2 characters)
  export const isValidName = (name: string): boolean => {
    const trimmedName = name.trim();
    return /^[a-zA-Z\s]{2,}$/.test(trimmedName);
  };
  
  // Email validation
  export const isValidEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };
  
  // Validation error messages
  export const ValidationMessages = {
    phone: {
      required: 'Phone number is required',
      invalid: 'Please enter a valid 10-digit Indian mobile number (starting with 6-9)',
    },
    name: {
      required: 'Name is required',
      invalid: 'Name should only contain letters and spaces (minimum 2 characters)',
    },
    email: {
      required: 'Email is required',
      invalid: 'Please enter a valid email address',
    },
  };
  
  // Combined validator for forms
  export const validateField = (
    field: 'phone' | 'name' | 'email',
    value: string
  ): { isValid: boolean; error: string | null } => {
    if (!value || !value.trim()) {
      return { isValid: false, error: ValidationMessages[field].required };
    }
  
    switch (field) {
      case 'phone':
        return isValidIndianPhone(value)
          ? { isValid: true, error: null }
          : { isValid: false, error: ValidationMessages.phone.invalid };
      case 'name':
        return isValidName(value)
          ? { isValid: true, error: null }
          : { isValid: false, error: ValidationMessages.name.invalid };
      case 'email':
        return isValidEmail(value)
          ? { isValid: true, error: null }
          : { isValid: false, error: ValidationMessages.email.invalid };
      default:
        return { isValid: true, error: null };
    }
  };