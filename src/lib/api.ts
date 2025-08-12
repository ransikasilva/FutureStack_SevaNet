/**
 * API configuration and utility functions
 */

// Get the API base URL from environment variables
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

/**
 * Get the full API endpoint URL
 */
export const getApiUrl = (endpoint: string): string => {
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint
  return `${API_BASE_URL}/api/v1/${cleanEndpoint}`
}

/**
 * Common API headers
 */
export const getApiHeaders = (): Record<string, string> => {
  return {
    'Content-Type': 'application/json',
  }
}

/**
 * API client wrapper with error handling
 */
export const apiClient = {
  async get(endpoint: string): Promise<Response> {
    return fetch(getApiUrl(endpoint), {
      method: 'GET',
      headers: getApiHeaders(),
    })
  },

  async post(endpoint: string, data?: any): Promise<Response> {
    const headers = data instanceof FormData 
      ? {} // Let browser set Content-Type for FormData
      : getApiHeaders()

    return fetch(getApiUrl(endpoint), {
      method: 'POST',
      headers,
      body: data instanceof FormData ? data : JSON.stringify(data),
    })
  },

  async put(endpoint: string, data?: any): Promise<Response> {
    return fetch(getApiUrl(endpoint), {
      method: 'PUT',
      headers: getApiHeaders(),
      body: JSON.stringify(data),
    })
  },

  async delete(endpoint: string): Promise<Response> {
    return fetch(getApiUrl(endpoint), {
      method: 'DELETE',
      headers: getApiHeaders(),
    })
  }
}