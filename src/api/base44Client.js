import { createClient } from '@base44/sdk';
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// Create a client with authentication required
export const base44 = createClient({
  appId: "695057f5d5e66fe0b381ffae", 
  requiresAuth: true // Ensure authentication is required for all operations
});
