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

  // Cow Detection API methods
  cowDetection: {
    // Get API health status
    getHealth: async () => {
      return api.get('/health');
    },

    // Get API configuration
    getConfig: async () => {
      return api.get('/config');
    },

    // Upload image and detect cows
    detectFromUpload: async (file, confidence = 0.3) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const headers = {};
      const token = getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      try {
        const normalizedEndpoint = '/cow_counter/detect';
        const url = `${API_BASE_URL}${normalizedEndpoint}?confidence=${confidence}`;
        
        const response = await fetch(url, {
          method: 'POST',
          headers: headers,
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          return { error: error.detail || 'Detection failed' };
        }

        return response.json();
      } catch (error) {
        console.error('Detection upload failed:', error);
        return { error: error.message || 'Upload failed' };
      }
    },

    // Detect cows in existing file
    detectFromFile: async (filename, confidence = 0.3) => {
      return api.get(`/cow_counter/detect/file/${filename}?confidence=${confidence}`);
    },

    // Get latest detection results
    getResults: async () => {
      return api.get('/cow_counter/results');
    },

    // List all available images
    listImages: async () => {
      return api.get('/cow_counter/images');
    },

    // Delete an image
    deleteImage: async (filename) => {
      return api.delete(`/cow_counter/images/${filename}`);
    }
  },

  // Legacy methods for backward compatibility
  loadDetectionResults: async () => {
    return api.cowDetection.getResults();
  },

  loadFromFile: async (file, confidence = 0.3) => {
    return api.cowDetection.detectFromUpload(file, confidence);
  }
};