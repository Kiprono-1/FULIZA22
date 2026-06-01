/**
 * Security utilities for input validation, sanitization, and protection
 */

// Input validation patterns
export const VALIDATION_PATTERNS = {
  PHONE: /^(?:\+254|254|0)?([17]\d{8})$/,
  ID_NUMBER: /^\d{7,8}$/,
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  NAME: /^[a-zA-Z\s'-]{2,50}$/,
  COUNTY: /^[a-zA-Z\s'-]{2,30}$/,
} as const;

// Rate limiting configuration
const RATE_LIMITS = {
  PHONE_CHECK: { maxAttempts: 3, windowMs: 15 * 60 * 1000 }, // 3 attempts per 15 minutes
  FORM_SUBMIT: { maxAttempts: 5, windowMs: 10 * 60 * 1000 }, // 5 attempts per 10 minutes
  PAYMENT: { maxAttempts: 2, windowMs: 30 * 60 * 1000 }, // 2 attempts per 30 minutes
} as const;

// Rate limiter storage
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Input sanitization functions
 */
export const sanitize = {
  phone: (phone: string): string => {
    return phone.replace(/[^\d+]/g, '').slice(0, 13);
  },
  
  idNumber: (id: string): string => {
    return id.replace(/\D/g, '').slice(0, 8);
  },
  
  email: (email: string): string => {
    return email.toLowerCase().trim().slice(0, 100);
  },
  
  name: (name: string): string => {
    return name.trim().replace(/[^a-zA-Z\s'-]/g, '').slice(0, 50);
  },
  
  county: (county: string): string => {
    return county.trim().replace(/[^a-zA-Z\s'-]/g, '').slice(0, 30);
  },
  
  // General HTML sanitization
  html: (input: string): string => {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
  }
};

/**
 * Input validation functions
 */
export const validate = {
  phone: (phone: string): { isValid: boolean; error?: string } => {
    const sanitized = sanitize.phone(phone);
    
    if (!sanitized) {
      return { isValid: false, error: 'Phone number is required' };
    }
    
    if (!VALIDATION_PATTERNS.PHONE.test(sanitized)) {
      return { isValid: false, error: 'Please enter a valid Kenyan phone number' };
    }
    
    return { isValid: true };
  },
  
  idNumber: (id: string): { isValid: boolean; error?: string } => {
    const sanitized = sanitize.idNumber(id);
    
    if (!sanitized) {
      return { isValid: false, error: 'ID number is required' };
    }
    
    if (!VALIDATION_PATTERNS.ID_NUMBER.test(sanitized)) {
      return { isValid: false, error: 'Please enter a valid ID number (7-8 digits)' };
    }
    
    return { isValid: true };
  },
  
  email: (email: string): { isValid: boolean; error?: string } => {
    const sanitized = sanitize.email(email);
    
    if (!sanitized) {
      return { isValid: false, error: 'Email is required' };
    }
    
    if (!VALIDATION_PATTERNS.EMAIL.test(sanitized)) {
      return { isValid: false, error: 'Please enter a valid email address' };
    }
    
    return { isValid: true };
  },
  
  name: (name: string): { isValid: boolean; error?: string } => {
    const sanitized = sanitize.name(name);
    
    if (!sanitized || sanitized.length < 2) {
      return { isValid: false, error: 'Name must be at least 2 characters' };
    }
    
    if (!VALIDATION_PATTERNS.NAME.test(sanitized)) {
      return { isValid: false, error: 'Name contains invalid characters' };
    }
    
    return { isValid: true };
  },
  
  county: (county: string): { isValid: boolean; error?: string } => {
    const sanitized = sanitize.county(county);
    
    if (!sanitized) {
      return { isValid: false, error: 'County is required' };
    }
    
    if (!VALIDATION_PATTERNS.COUNTY.test(sanitized)) {
      return { isValid: false, error: 'Please select a valid county' };
    }
    
    return { isValid: true };
  }
};

/**
 * Rate limiting functionality
 */
export const rateLimit = {
  check: (key: string, type: keyof typeof RATE_LIMITS): { allowed: boolean; resetTime?: number } => {
    const config = RATE_LIMITS[type];
    const now = Date.now();
    const identifier = `${type}_${key}`;
    
    const existing = rateLimitStore.get(identifier);
    
    if (!existing || now > existing.resetTime) {
      // First attempt or window expired
      rateLimitStore.set(identifier, {
        count: 1,
        resetTime: now + config.windowMs
      });
      return { allowed: true };
    }
    
    if (existing.count >= config.maxAttempts) {
      return { allowed: false, resetTime: existing.resetTime };
    }
    
    // Increment count
    rateLimitStore.set(identifier, {
      ...existing,
      count: existing.count + 1
    });
    
    return { allowed: true };
  },
  
  getRemainingTime: (key: string, type: keyof typeof RATE_LIMITS): number => {
    const identifier = `${type}_${key}`;
    const existing = rateLimitStore.get(identifier);
    
    if (!existing) return 0;
    
    const remaining = existing.resetTime - Date.now();
    return Math.max(0, Math.ceil(remaining / 1000));
  }
};

/**
 * Secure data handling
 */
export const secureData = {
  // Mask sensitive data for display
  maskPhone: (phone: string): string => {
    const sanitized = sanitize.phone(phone);
    if (sanitized.length < 4) return sanitized;
    return sanitized.slice(0, -4).replace(/\d/g, '*') + sanitized.slice(-4);
  },
  
  maskId: (id: string): string => {
    const sanitized = sanitize.idNumber(id);
    if (sanitized.length < 3) return sanitized;
    return sanitized.slice(0, 2) + '*'.repeat(sanitized.length - 4) + sanitized.slice(-2);
  },
  
  maskEmail: (email: string): string => {
    const [local, domain] = email.split('@');
    if (!domain) return email;
    
    const maskedLocal = local.length > 2 
      ? local[0] + '*'.repeat(local.length - 2) + local.slice(-1)
      : local;
    
    return `${maskedLocal}@${domain}`;
  },
  
  // Generate secure session tokens
  generateToken: (): string => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  },
  
  // Hash sensitive data for storage
  hashData: async (data: string): Promise<string> => {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
};

/**
 * Security headers and CSP
 */
export const securityHeaders = {
  // Content Security Policy
  csp: {
    'default-src': "'self'",
    'script-src': "'self' 'unsafe-inline' https://js.paystack.co",
    'style-src': "'self' 'unsafe-inline' https://fonts.googleapis.com",
    'font-src': "'self' https://fonts.gstatic.com",
    'img-src': "'self' data: https:",
    'connect-src': "'self' https://api.paystack.co https://fonts.googleapis.com",
    'frame-src': "'none'",
    'object-src': "'none'",
    'base-uri': "'self'",
    'form-action': "'self'",
    'upgrade-insecure-requests': ''
  },
  
  // Generate CSP header string
  getCspHeader: (): string => {
    return Object.entries(securityHeaders.csp)
      .map(([directive, value]) => `${directive} ${value}`)
      .join('; ');
  }
};

/**
 * Anti-bot protection
 */
export const antiBot = {
  // Simple honeypot field detection
  checkHoneypot: (value: string): boolean => {
    return value === '' || value === undefined || value === null;
  },
  
  // Timing analysis for bot detection
  checkTiming: (startTime: number, minTime: number = 2000): boolean => {
    const elapsed = Date.now() - startTime;
    return elapsed >= minTime; // Humans typically take at least 2 seconds
  },
  
  // Mouse movement tracking
  hasMouseMovement: (): boolean => {
    return (window as any).__mouseMovement === true;
  }
};

/**
 * Audit logging
 */
export const auditLog = {
  log: (event: string, data: Record<string, any> = {}) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      userAgent: navigator.userAgent,
      url: window.location.href,
      sessionId: sessionStorage.getItem('sessionId') || 'anonymous',
      ...data
    };
    
    // In production, send to secure logging service
    console.log('[AUDIT]', logEntry);
    
    // Store locally for debugging (remove in production)
    const logs = JSON.parse(localStorage.getItem('auditLogs') || '[]');
    logs.push(logEntry);
    
    // Keep only last 100 logs
    if (logs.length > 100) {
      logs.splice(0, logs.length - 100);
    }
    
    localStorage.setItem('auditLogs', JSON.stringify(logs));
  }
};

/**
 * Initialize security measures
 */
export const initSecurity = () => {
  // Generate session ID if not exists
  if (!sessionStorage.getItem('sessionId')) {
    sessionStorage.setItem('sessionId', secureData.generateToken());
  }
  
  // Track mouse movement for bot detection
  let mouseMovement = false;
  document.addEventListener('mousemove', () => {
    if (!mouseMovement) {
      mouseMovement = true;
      (window as any).__mouseMovement = true;
    }
  }, { once: true });
  
  // Log session start
  auditLog.log('session_start');
  
  // Set up CSP if supported
  if (document.head) {
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.content = securityHeaders.getCspHeader();
    document.head.appendChild(meta);
  }
};