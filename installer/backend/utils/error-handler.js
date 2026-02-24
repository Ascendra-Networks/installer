/**
 * Error handling utilities
 */

class DeploymentError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = 'DeploymentError';
    this.code = code;
    this.details = details;
  }
}

class TerraformError extends DeploymentError {
  constructor(message, details = {}) {
    super(message, 'TERRAFORM_ERROR', details);
    this.name = 'TerraformError';
  }
}

class AnsibleError extends DeploymentError {
  constructor(message, details = {}) {
    super(message, 'ANSIBLE_ERROR', details);
    this.name = 'AnsibleError';
  }
}

class ConfigurationError extends DeploymentError {
  constructor(message, details = {}) {
    super(message, 'CONFIGURATION_ERROR', details);
    this.name = 'ConfigurationError';
  }
}

class ValidationError extends DeploymentError {
  constructor(message, details = {}) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

/**
 * Sanitize input to prevent command injection
 */
function sanitizeInput(input) {
  if (typeof input !== 'string') {
    return input;
  }
  
  // Remove potentially dangerous characters
  return input.replace(/[;&|`$(){}[\]<>]/g, '');
}

/**
 * Validate cluster name
 */
function validateClusterName(name) {
  if (!name) {
    throw new ValidationError('Cluster name is required');
  }
  
  if (name.length < 3 || name.length > 63) {
    throw new ValidationError('Cluster name must be between 3 and 63 characters');
  }
  
  if (!/^[a-z0-9-]+$/.test(name)) {
    throw new ValidationError('Cluster name must contain only lowercase letters, numbers, and hyphens');
  }
  
  if (name.startsWith('-') || name.endsWith('-')) {
    throw new ValidationError('Cluster name cannot start or end with a hyphen');
  }
  
  return true;
}

/**
 * Validate deployment ID (must be UUID)
 */
function validateDeploymentId(id) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  if (!uuidRegex.test(id)) {
    throw new ValidationError('Invalid deployment ID format');
  }
  
  return true;
}

/**
 * Log error with context
 */
function logError(error, context = {}) {
  console.error('='.repeat(80));
  console.error(`[ERROR] ${error.name || 'Error'}: ${error.message}`);
  
  if (error.code) {
    console.error(`[ERROR] Code: ${error.code}`);
  }
  
  if (error.details && Object.keys(error.details).length > 0) {
    console.error('[ERROR] Details:', JSON.stringify(error.details, null, 2));
  }
  
  if (Object.keys(context).length > 0) {
    console.error('[ERROR] Context:', JSON.stringify(context, null, 2));
  }
  
  if (error.stack) {
    console.error('[ERROR] Stack trace:');
    console.error(error.stack);
  }
  
  console.error('='.repeat(80));
}

/**
 * Wrap async function with error handling
 */
function asyncErrorHandler(fn) {
  return async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      logError(error, {
        method: req.method,
        path: req.path,
        params: req.params,
        query: req.query,
      });
      next(error);
    }
  };
}

/**
 * Check if required environment variables are set
 */
function checkEnvironment() {
  const warnings = [];
  
  if (!process.env.TYR_GHCR_USERNAME) {
    warnings.push('TYR_GHCR_USERNAME not set - Tyr deployment will fail');
  }
  
  if (!process.env.TYR_GHCR_PASSWORD) {
    warnings.push('TYR_GHCR_PASSWORD not set - Tyr deployment will fail');
  }
  
  if (warnings.length > 0) {
    console.warn('\n⚠️  Environment Warnings:');
    warnings.forEach(w => console.warn(`   - ${w}`));
    console.warn('');
  }
  
  return warnings;
}

/**
 * Validate deployment configuration
 */
function validateDeploymentConfig(config) {
  const errors = [];
  
  if (!config.cloudProvider) {
    errors.push('cloudProvider is required');
  }

  const isOnPremise = config.cloudProvider === 'on-premise' || config.cloudProvider === 'onpremise';

  if (isOnPremise) {
    if (!config.onPremiseConfig) {
      errors.push('onPremiseConfig is required for on-premise deployments');
    } else {
      if (!config.onPremiseConfig.clusterName) {
        errors.push('onPremiseConfig.clusterName is required');
      } else {
        try {
          validateClusterName(config.onPremiseConfig.clusterName);
        } catch (error) {
          errors.push(error.message);
        }
      }
    }
  } else {
    if (!config.clusterConfig) {
      errors.push('clusterConfig is required');
    } else {
      if (!config.clusterConfig.name) {
        errors.push('clusterConfig.name is required');
      } else {
        try {
          validateClusterName(config.clusterConfig.name);
        } catch (error) {
          errors.push(error.message);
        }
      }

      if (!config.clusterConfig.region) {
        errors.push('clusterConfig.region is required');
      }

      if (!config.clusterConfig.nodePools || config.clusterConfig.nodePools.length === 0) {
        errors.push('At least one node pool is required');
      }
    }
  }
  
  if (errors.length > 0) {
    throw new ValidationError('Invalid deployment configuration', { errors });
  }
  
  return true;
}

export {
  DeploymentError,
  TerraformError,
  AnsibleError,
  ConfigurationError,
  ValidationError,
  sanitizeInput,
  validateClusterName,
  validateDeploymentId,
  validateDeploymentConfig,
  logError,
  asyncErrorHandler,
  checkEnvironment,
};


