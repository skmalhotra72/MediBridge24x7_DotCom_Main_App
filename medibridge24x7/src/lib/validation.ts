export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  min?: number;
  max?: number;
  email?: boolean;
  phone?: boolean;
  url?: boolean;
  date?: boolean;
  custom?: (value: any) => string | null;
  message?: string;
}

export interface ValidationRules {
  [key: string]: ValidationRule;
}

export interface ValidationErrors {
  [key: string]: string;
}

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
  return phoneRegex.test(cleanPhone) && cleanPhone.length >= 10;
};

export const validateUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const validateDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
};

export const validateRequired = (value: any): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return true;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return Boolean(value);
};

export const validateField = (value: any, rule: ValidationRule): string | null => {
  if (rule.required && !validateRequired(value)) {
    return rule.message || 'This field is required';
  }

  if (!validateRequired(value) && !rule.required) {
    return null;
  }

  if (typeof value === 'string') {
    if (rule.minLength && value.length < rule.minLength) {
      return rule.message || `Minimum length is ${rule.minLength} characters`;
    }

    if (rule.maxLength && value.length > rule.maxLength) {
      return rule.message || `Maximum length is ${rule.maxLength} characters`;
    }

    if (rule.email && !validateEmail(value)) {
      return rule.message || 'Please enter a valid email address';
    }

    if (rule.phone && !validatePhone(value)) {
      return rule.message || 'Please enter a valid phone number';
    }

    if (rule.url && !validateUrl(value)) {
      return rule.message || 'Please enter a valid URL';
    }

    if (rule.date && !validateDate(value)) {
      return rule.message || 'Please enter a valid date';
    }

    if (rule.pattern && !rule.pattern.test(value)) {
      return rule.message || 'Invalid format';
    }
  }

  if (typeof value === 'number') {
    if (rule.min !== undefined && value < rule.min) {
      return rule.message || `Minimum value is ${rule.min}`;
    }

    if (rule.max !== undefined && value > rule.max) {
      return rule.message || `Maximum value is ${rule.max}`;
    }
  }

  if (rule.custom) {
    return rule.custom(value);
  }

  return null;
};

export const validateForm = (
  data: { [key: string]: any },
  rules: ValidationRules
): ValidationErrors => {
  const errors: ValidationErrors = {};

  Object.keys(rules).forEach((field) => {
    const value = data[field];
    const rule = rules[field];
    const error = validateField(value, rule);

    if (error) {
      errors[field] = error;
    }
  });

  return errors;
};

export const hasErrors = (errors: ValidationErrors): boolean => {
  return Object.keys(errors).length > 0;
};

export const clearFieldError = (
  errors: ValidationErrors,
  field: string
): ValidationErrors => {
  const newErrors = { ...errors };
  delete newErrors[field];
  return newErrors;
};

export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  return phone;
};

export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};
