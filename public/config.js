// API Configuration for VoterNet
// This file automatically detects the environment and uses the appropriate API URL

const CONFIG = {
    // Detect if running locally or on GitHub Pages
    isLocal: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
    
    // API URLs for different environments
    API_URLS: {
        local: 'http://localhost:3000',
        // Replace this with your VPS URL after deployment
        production: 'https://your-vps-domain.com' // TODO: Update this after VPS deployment
    }
};

// Export the current API URL based on environment
const API_URL = CONFIG.isLocal ? CONFIG.API_URLS.local : CONFIG.API_URLS.production;

// Log current configuration (for debugging)
console.log('VoterNet Environment:', CONFIG.isLocal ? 'Local Development' : 'Production');
console.log('API URL:', API_URL);
