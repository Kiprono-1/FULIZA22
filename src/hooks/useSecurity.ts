import { useState, useCallback, useEffect } from 'react';
import { validate, sanitize, rateLimit, secureData, auditLog, antiBot } from '../utils/security';

interface ValidationErrors {
  phone?: string;
  idNumber?: string;
  email?: string;
  fullName?: string;
  county?: string;
}

interface SecurityState {
  isRateLimited: boolean;
  rateLimitReset: number;
  validationErrors: ValidationErrors;
  isValidating: boolean;
  sessionToken: string;
}

export const useSecurity = () => {
  const [securityState, setSecurityState] = useState<SecurityState>({
    isRateLimited: false,
    rateLimitReset: 0,
    validationErrors: {},
    isValidating: false,
    sessionToken: sessionStorage.getItem('sessionId') || '',
  });

  // Initialize security on mount
  useEffect(() => {
    if (!securityState.sessionToken) {
      const token = secureData.generateToken();
      sessionStorage.setItem('sessionId', token);
      setSecurityState(prev => ({ ...prev, sessionToken: token }));
    }
  }, [securityState.sessionToken]);

  // Validate and sanitize form data
  const validateFormData = useCallback((data: Record<string, string>, fields: string[]) => {
    const errors: ValidationErrors = {};
    const sanitizedData: Record<string, string> = {};

    fields.forEach(field => {
      const value = data[field] || '';
      
      switch (field) {
        case 'phone':
          sanitizedData.phone = sanitize.phone(value);
          const phoneValidation = validate.phone(sanitizedData.phone);
          if (!phoneValidation.isValid) {
            errors.phone = phoneValidation.error;
          }
          break;
          
        case 'idNumber':
          sanitizedData.idNumber = sanitize.idNumber(value);
          const idValidation = validate.idNumber(sanitizedData.idNumber);
          if (!idValidation.isValid) {
            errors.idNumber = idValidation.error;
          }
          break;
          
        case 'email':
          sanitizedData.email = sanitize.email(value);
          const emailValidation = validate.email(sanitizedData.email);
          if (!emailValidation.isValid) {
            errors.email = emailValidation.error;
          }
          break;
          
        case 'fullName':
          sanitizedData.fullName = sanitize.name(value);
          const nameValidation = validate.name(sanitizedData.fullName);
          if (!nameValidation.isValid) {
            errors.fullName = nameValidation.error;
          }
          break;
          
        case 'county':
          sanitizedData.county = sanitize.county(value);
          const countyValidation = validate.county(sanitizedData.county);
          if (!countyValidation.isValid) {
            errors.county = countyValidation.error;
          }
          break;
          
        default:
          sanitizedData[field] = sanitize.html(value);
      }
    });

    setSecurityState(prev => ({ ...prev, validationErrors: errors }));
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitizedData
    };
  }, []);

  // Check rate limits
  const checkRateLimit = useCallback((action: 'PHONE_CHECK' | 'FORM_SUBMIT' | 'PAYMENT', identifier: string) => {
    const result = rateLimit.check(identifier, action);
    
    if (!result.allowed) {
      const resetTime = result.resetTime || 0;
      setSecurityState(prev => ({
        ...prev,
        isRateLimited: true,
        rateLimitReset: resetTime
      }));
      
      auditLog.log('rate_limit_exceeded', { action, identifier });
      return false;
    }
    
    setSecurityState(prev => ({
      ...prev,
      isRateLimited: false,
      rateLimitReset: 0
    }));
    
    return true;
  }, []);

  // Anti-bot validation
  const validateHuman = useCallback((formStartTime: number, honeypotValue?: string) => {
    // Check honeypot
    if (honeypotValue && !antiBot.checkHoneypot(honeypotValue)) {
      auditLog.log('bot_detected', { reason: 'honeypot_filled' });
      return false;
    }
    
    // Check timing
    if (!antiBot.checkTiming(formStartTime)) {
      auditLog.log('bot_detected', { reason: 'too_fast' });
      return false;
    }
    
    // Check mouse movement
    if (!antiBot.hasMouseMovement()) {
      auditLog.log('bot_detected', { reason: 'no_mouse_movement' });
      return false;
    }
    
    return true;
  }, []);

  // Secure phone number submission
  const securePhoneSubmit = useCallback(async (phone: string, formStartTime: number, honeypot?: string) => {
    setSecurityState(prev => ({ ...prev, isValidating: true }));
    
    try {
      // Validate human behavior
      if (!validateHuman(formStartTime, honeypot)) {
        throw new Error('Security validation failed');
      }
      
      // Validate and sanitize phone
      const validation = validateFormData({ phone }, ['phone']);
      if (!validation.isValid) {
        return { success: false, errors: validation.errors };
      }
      
      const sanitizedPhone = validation.sanitizedData.phone;
      
      // Check rate limit
      if (!checkRateLimit('PHONE_CHECK', sanitizedPhone)) {
        const remainingTime = rateLimit.getRemainingTime(sanitizedPhone, 'PHONE_CHECK');
        return { 
          success: false, 
          error: `Too many attempts. Try again in ${Math.ceil(remainingTime / 60)} minutes.` 
        };
      }
      
      // Log successful validation
      auditLog.log('phone_validation_success', { 
        phone: secureData.maskPhone(sanitizedPhone) 
      });
      
      return { success: true, phone: sanitizedPhone };
      
    } catch (error) {
      auditLog.log('phone_validation_error', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      return { success: false, error: 'Validation failed' };
    } finally {
      setSecurityState(prev => ({ ...prev, isValidating: false }));
    }
  }, [validateFormData, validateHuman, checkRateLimit]);

  // Secure form submission
  const secureFormSubmit = useCallback(async (
    formData: Record<string, string>, 
    formStartTime: number, 
    honeypot?: string
  ) => {
    setSecurityState(prev => ({ ...prev, isValidating: true }));
    
    try {
      // Validate human behavior
      if (!validateHuman(formStartTime, honeypot)) {
        throw new Error('Security validation failed');
      }
      
      // Validate all fields
      const fields = Object.keys(formData);
      const validation = validateFormData(formData, fields);
      
      if (!validation.isValid) {
        return { success: false, errors: validation.errors };
      }
      
      // Check rate limit using phone as identifier
      const phone = validation.sanitizedData.phone || '';
      if (!checkRateLimit('FORM_SUBMIT', phone)) {
        const remainingTime = rateLimit.getRemainingTime(phone, 'FORM_SUBMIT');
        return { 
          success: false, 
          error: `Too many attempts. Try again in ${Math.ceil(remainingTime / 60)} minutes.` 
        };
      }
      
      // Log successful submission
      auditLog.log('form_submission_success', {
        phone: secureData.maskPhone(phone),
        email: secureData.maskEmail(validation.sanitizedData.email || ''),
        fields: fields.length
      });
      
      return { success: true, data: validation.sanitizedData };
      
    } catch (error) {
      auditLog.log('form_submission_error', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      return { success: false, error: 'Submission failed' };
    } finally {
      setSecurityState(prev => ({ ...prev, isValidating: false }));
    }
  }, [validateFormData, validateHuman, checkRateLimit]);

  // Secure payment initiation
  const securePaymentInit = useCallback(async (
    phone: string, 
    amount: number, 
    tier: number
  ) => {
    try {
      // Check payment rate limit
      if (!checkRateLimit('PAYMENT', phone)) {
        const remainingTime = rateLimit.getRemainingTime(phone, 'PAYMENT');
        return { 
          success: false, 
          error: `Payment limit reached. Try again in ${Math.ceil(remainingTime / 60)} minutes.` 
        };
      }
      
      // Validate amount and tier
      if (amount <= 0 || amount > 2500 || tier < 0 || tier > 7) {
        auditLog.log('payment_validation_failed', { 
          phone: secureData.maskPhone(phone), 
          amount, 
          tier 
        });
        return { success: false, error: 'Invalid payment parameters' };
      }
      
      // Log payment initiation
      auditLog.log('payment_initiated', {
        phone: secureData.maskPhone(phone),
        amount,
        tier,
        timestamp: Date.now()
      });
      
      return { success: true };
      
    } catch (error) {
      auditLog.log('payment_init_error', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      return { success: false, error: 'Payment initialization failed' };
    }
  }, [checkRateLimit]);

  // Get masked data for display
  const getMaskedData = useCallback((data: Record<string, string>) => {
    return {
      phone: data.phone ? secureData.maskPhone(data.phone) : '',
      idNumber: data.idNumber ? secureData.maskId(data.idNumber) : '',
      email: data.email ? secureData.maskEmail(data.email) : '',
      fullName: data.fullName || '',
      county: data.county || ''
    };
  }, []);

  // Clear security state
  const clearSecurityState = useCallback(() => {
    setSecurityState(prev => ({
      ...prev,
      isRateLimited: false,
      rateLimitReset: 0,
      validationErrors: {},
      isValidating: false
    }));
  }, []);

  return {
    securityState,
    validateFormData,
    checkRateLimit,
    validateHuman,
    securePhoneSubmit,
    secureFormSubmit,
    securePaymentInit,
    getMaskedData,
    clearSecurityState
  };
};