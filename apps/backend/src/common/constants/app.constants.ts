/**
 * Application Constants
 *
 * Centralized configuration for constants used throughout the application.
 * This ensures consistency and makes updates easier.
 */

// JWT Constants
export const JWT_CONSTANTS = {
  ACCESS_TOKEN_EXPIRES_IN: '15m', // Access token valid for 15 minutes
  REFRESH_TOKEN_EXPIRES_IN: '7d', // Refresh token valid for 7 days
  SECRET_KEY: process.env.JWT_SECRET || 'your-super-secret-key', // Should be in .env
};

// Usage Limit Constants (free tier daily quotas & reward bonuses)
export const USAGE_LIMITS = {
  MAX_FREE_ACTIONS_PER_DAY: 2, // Số hành động miễn phí mỗi user/ngày
  MAX_FREE_CHAT_PER_DAY: 3, // Số lượt chat miễn phí mỗi user/ngày
  CHAT_BONUS_PER_AD: 1, // Lượt chat cộng thêm mỗi lần xem rewarded ad
};

// Pagination Constants
export const PAGINATION_CONSTANTS = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
};

// Cache Constants (for Redis integration)
export const CACHE_CONSTANTS = {
  USER_PROFILE_CACHE_TTL: 3600, // 1 hour in seconds
  USER_LIST_CACHE_TTL: 300, // 5 minutes
  HEALTH_CHECK_CACHE_TTL: 60, // 1 minute
};

// Error Messages
export const ERROR_MESSAGES = {
  // Auth errors
  INVALID_CREDENTIALS: 'Invalid email or password',
  TOKEN_EXPIRED: 'Token has expired',
  INVALID_TOKEN: 'Invalid token',
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Forbidden resource',

  // User errors
  USER_NOT_FOUND: 'User not found',
  USER_ALREADY_EXISTS: 'User with this email already exists',
  USER_INACTIVE: 'User account is inactive',

  // Validation errors
  INVALID_INPUT: 'Invalid input provided',
  MISSING_REQUIRED_FIELD: 'Missing required field',

  // Server errors
  INTERNAL_SERVER_ERROR: 'Internal server error',
  DATABASE_ERROR: 'Database operation failed',
  SERVICE_UNAVAILABLE: 'Service temporarily unavailable',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logout successful',
  USER_CREATED: 'User created successfully',
  USER_UPDATED: 'User updated successfully',
  USER_DELETED: 'User deleted successfully',
  PASSWORD_CHANGED: 'Password changed successfully',
  EMAIL_VERIFIED: 'Email verified successfully',
  PASSWORD_RESET_OTP_SENT: 'OTP sent to your phone number',
  PASSWORD_RESET_SUCCESS: 'Password reset successfully',
};

// Role Constants
export const ROLE_CONSTANTS = {
  ADMIN: 'ADMIN',
  USER: 'USER',
  MODERATOR: 'MODERATOR',
};

// User Status Constants
export const USER_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'SUSPENDED',
  PENDING_VERIFICATION: 'PENDING_VERIFICATION',
};

// API Response Status
export const RESPONSE_STATUS = {
  SUCCESS: true,
  FAILURE: false,
};

// Request Validation
export const VALIDATION_RULES = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MIN_UPPERCASE: 1,
  PASSWORD_MIN_NUMBERS: 1,
  PASSWORD_MIN_SPECIAL: 1,
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 50,
  PHONE_REGEX: /^\+?1?\d{9,15}$/, // International format
};

// Audit Actions
export const AUDIT_ACTIONS = {
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  USER_CREATE: 'USER_CREATE',
  USER_UPDATE: 'USER_UPDATE',
  USER_DELETE: 'USER_DELETE',
  PASSWORD_CHANGE: 'PASSWORD_CHANGE',
  EMAIL_VERIFY: 'EMAIL_VERIFY',
  TOKEN_REFRESH: 'TOKEN_REFRESH',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  PASSWORD_RESET: 'PASSWORD_RESET',
};
