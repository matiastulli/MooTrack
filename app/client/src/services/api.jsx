const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Get JWT token from localStorage
const getToken = () => localStorage.getItem('token');

// Common headers with authentication
const getHeaders = () => {
  const headers = {
    'Content-Type': 'application/json'
  };
  
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

export const api = {
  get: async (endpoint) => {
    try {

      // Ensure endpoint starts with a slash if it doesn't already
      const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      
      const response = await fetch(`${API_BASE_URL}${normalizedEndpoint}`, {
        headers: getHeaders(),
      });
      
      if (!response.ok) {
        // Handle unauthorized or other errors
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('userId');
          // Could also trigger a refresh token flow here
        }
        const error = await response.json();
        return { error: error.error || 'API request failed' };
      }
      
      return response.json();
    } catch (error) {
      console.error('API request failed:', error);
      return { error: error.message || 'Network error' };
    }
  },
  
  post: async (endpoint, data, options = {}) => {
    try {
      // Ensure endpoint starts with a slash if it doesn't already
      const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      
      let url = `${API_BASE_URL}${normalizedEndpoint}`;
      
      // Handle query parameters if provided
      if (options.params) {
        const searchParams = new URLSearchParams();
        Object.keys(options.params).forEach(key => {
          searchParams.append(key, options.params[key]);
        });
        url += `?${searchParams.toString()}`;
      }
      
      const response = await fetch(url, {
        method: 'POST',
        headers: getHeaders(),
        body: data ? JSON.stringify(data) : undefined,
      });
      
      if (!response.ok) {
        // Handle unauthorized or other errors
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('userId');
        }
        const error = await response.json();
        return { error: error.detail || error.error || 'API request failed' };
      }
      
      return response.json();
    } catch (error) {
      console.error('API request failed:', error);
      return { error: error.message || 'Network error' };
    }
  },
  
  put: async (endpoint, data) => {
    try {
      // Ensure endpoint starts with a slash if it doesn't already
      const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      
      const response = await fetch(`${API_BASE_URL}${normalizedEndpoint}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        // Handle unauthorized or other errors
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('userId');
        }
        const error = await response.json();
        return { error: error.error || 'API request failed' };
      }
      
      return response.json();
    } catch (error) {
      console.error('API request failed:', error);
      return { error: error.message || 'Network error' };
    }
  },
  
  delete: async (endpoint) => {
    try {
      // Ensure endpoint starts with a slash if it doesn't already
      const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      
      const response = await fetch(`${API_BASE_URL}${normalizedEndpoint}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        return { error: errorData.detail || "Request failed" };
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("API delete error:", error);
      return { error: "Failed to process your request" };
    }
  },
  
  // Authentication specific methods
  auth: {
    signin: async (credentials) => {
      return api.post('auth/signin', credentials);
    },
    
    signup: async (userData) => {
      return api.post('auth/signup', userData);
    },

    // Passwordless authentication methods
    passwordless: {
      sendCode: async (email, codeType) => {
        return api.post('auth/passwordless/send-code', {
          email,
          code_type: codeType
        });
      },

      verifyCode: async (email, code, codeType) => {
        return api.post('auth/passwordless/verify-code', {
          email,
          verification_code: code,
          code_type: codeType
        });
      },

      register: async (userData, verificationCode, email) => {
        return api.post('auth/passwordless/register', userData, {
          params: {
            verification_code: verificationCode,
            email: email
          }
        });
      },

      login: async (email, verificationCode) => {
        return api.post('auth/passwordless/login', null, {
          params: {
            email: email,
            verification_code: verificationCode
          }
        });
      }
    }
  },
  
  // Check if user is authenticated
  isAuthenticated: () => {
    return !!getToken();
  },
  
  // Logout user
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userId');
  },

  // Cow detection specific methods
  cowDetection: {
    // Upload image and run simple detection
    detectCows: async (file, confidence = 0.3) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`${API_BASE_URL}/detect?confidence=${confidence}`, {
        method: 'POST',
        headers: {
          ...getHeaders(),
          'Content-Type': undefined, // Let browser set content-type for FormData
        },
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        return { error: error.detail || 'Detection failed' };
      }
      
      return response.json();
    },

    // Enhanced detection
    detectCowsEnhanced: async (file, confidence = 0.3) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`${API_BASE_URL}/detect/enhanced?confidence=${confidence}`, {
        method: 'POST',
        headers: {
          ...getHeaders(),
          'Content-Type': undefined,
        },
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        return { error: error.detail || 'Enhanced detection failed' };
      }
      
      return response.json();
    },

    // Ultra-aggressive detection
    detectCowsUltra: async (file, confidence = 0.1) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`${API_BASE_URL}/detect/ultra?confidence=${confidence}`, {
        method: 'POST',
        headers: {
          ...getHeaders(),
          'Content-Type': undefined,
        },
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        return { error: error.detail || 'Ultra detection failed' };
      }
      
      return response.json();
    },

    // Compare all detection methods
    compareDetectionMethods: async (filename) => {
      return api.get(`detect/compare/${filename}`);
    },

    // List available images
    listImages: async () => {
      return api.get('images');
    },

    // Delete an image
    deleteImage: async (filename) => {
      return api.delete(`images/${filename}`);
    },

    // Run detection on existing image
    detectFromFile: async (filename, method = 'simple', confidence = 0.3) => {
      const endpoint = method === 'simple' 
        ? `detect/file/${filename}?confidence=${confidence}`
        : `detect/${method}/${filename}?confidence=${confidence}`;
      
      return api.get(endpoint);
    }
  },
};