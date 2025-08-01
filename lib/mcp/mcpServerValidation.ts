/**
 * Validation utilities for MCP server configurations
 */

export interface MCPServerValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  authType: 'oauth' | 'api_key' | 'unknown';
}

export interface MCPServerConfig {
  qualified_name: string;
  url?: string;
  oauth_token?: string;
  session_id?: string;
  expires_at?: string;
  config?: Record<string, unknown>;
  is_enabled: boolean;
}

/**
 * Validates an MCP server configuration
 */
export function validateMCPServerConfig(serverConfig: MCPServerConfig): MCPServerValidationResult {
  const result: MCPServerValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    authType: 'unknown'
  };

  // Check basic requirements
  if (!serverConfig.qualified_name || serverConfig.qualified_name.trim() === '') {
    result.errors.push('Server must have a qualified_name');
    result.isValid = false;
  }

  // Determine authentication type
  if (serverConfig.oauth_token || serverConfig.session_id) {
    result.authType = 'oauth';
    
    // OAuth-specific validations
    if (serverConfig.oauth_token && !serverConfig.url) {
      result.errors.push('OAuth servers must have a URL configured');
      result.isValid = false;
    }
    
    if (serverConfig.expires_at) {
      const expiryDate = new Date(serverConfig.expires_at);
      if (expiryDate < new Date()) {
        result.warnings.push('OAuth token has expired');
      }
    }
  } else if (serverConfig.url) {
    result.authType = 'api_key';
    
    // API key server validations
    if (!isValidUrl(serverConfig.url)) {
      result.errors.push('Server URL is not valid');
      result.isValid = false;
    }
  } else {
    // No clear auth method - check if it's a Smithery server
    if (isSmitheryServerConfig(serverConfig)) {
      result.authType = 'api_key';
      
      if (!process.env.SMITHERY_API_KEY) {
        result.errors.push('Smithery server requires SMITHERY_API_KEY environment variable');
        result.isValid = false;
      }
    } else {
      result.errors.push('Server must have either a URL or OAuth configuration');
      result.isValid = false;
    }
  }

  // Check for deprecated or unsafe configurations
  if (serverConfig.config && typeof serverConfig.config !== 'object') {
    result.errors.push('Server config must be an object');
    result.isValid = false;
  }

  // Validate specific config fields based on auth type
  if (result.authType === 'oauth' && serverConfig.config?.auth_type === 'api_key') {
    result.warnings.push('Auth type mismatch: server has OAuth token but config specifies api_key');
  }

  return result;
}

/**
 * Validates a URL string
 */
function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:', 'ws:', 'wss:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Checks if a server configuration is for a Smithery server
 */
function isSmitheryServerConfig(serverConfig: MCPServerConfig): boolean {
  // Check explicit provider
  if (serverConfig.config?.provider === 'smithery') {
    return true;
  }
  
  // Check URL domain
  if (serverConfig.url?.includes('server.smithery.ai')) {
    return true;
  }
  
  // Check for Smithery-specific config keys
  if (serverConfig.config?.smitheryProfileId || serverConfig.config?.profileId) {
    return true;
  }
  
  return false;
}

/**
 * Validates multiple server configurations and returns a summary
 */
export function validateMCPServerConfigs(serverConfigs: MCPServerConfig[]): {
  valid: MCPServerConfig[];
  invalid: MCPServerConfig[];
  warnings: string[];
  summary: {
    total: number;
    valid: number;
    oauth: number;
    apiKey: number;
    smithery: number;
  };
} {
  const valid: MCPServerConfig[] = [];
  const invalid: MCPServerConfig[] = [];
  const warnings: string[] = [];
  
  let oauthCount = 0;
  let apiKeyCount = 0;
  let smitheryCount = 0;

  for (const config of serverConfigs) {
    const validation = validateMCPServerConfig(config);
    
    if (validation.isValid) {
      valid.push(config);
      
      if (validation.authType === 'oauth') oauthCount++;
      else if (validation.authType === 'api_key') apiKeyCount++;
      
      if (isSmitheryServerConfig(config)) smitheryCount++;
    } else {
      invalid.push(config);
    }
    
    warnings.push(...validation.warnings);
  }

  return {
    valid,
    invalid,
    warnings,
    summary: {
      total: serverConfigs.length,
      valid: valid.length,
      oauth: oauthCount,
      apiKey: apiKeyCount,
      smithery: smitheryCount
    }
  };
}

/**
 * Generates configuration recommendations for a server
 */
export function generateMCPServerRecommendations(serverConfig: MCPServerConfig): string[] {
  const recommendations: string[] = [];
  const validation = validateMCPServerConfig(serverConfig);
  
  if (!validation.isValid) {
    recommendations.push('⚠️ Server configuration has errors that must be fixed before use');
  }
  
  if (validation.authType === 'unknown') {
    recommendations.push('💡 Add either a URL for API key authentication or configure OAuth');
  }
  
  if (validation.authType === 'oauth' && !serverConfig.expires_at) {
    recommendations.push('💡 Consider adding an expiration time for OAuth tokens');
  }
  
  if (!serverConfig.config || Object.keys(serverConfig.config).length === 0) {
    recommendations.push('💡 Add configuration parameters specific to this server type');
  }
  
  if (isSmitheryServerConfig(serverConfig) && !serverConfig.config?.smitheryProfileId) {
    recommendations.push('💡 Set a specific Smithery profile ID for better server isolation');
  }
  
  return recommendations;
}