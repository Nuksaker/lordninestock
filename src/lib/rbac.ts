import { getSessionToken, verifyToken } from './auth';

export async function authorizeAdmin() {
  try {
    const token = await getSessionToken();
    if (!token) return false;
    
    const payload = await verifyToken(token);
    if (!payload) return false;
    
    return payload.role === 'ADMIN';
  } catch (error) {
    return false;
  }
}

export async function authorizeUser() {
    try {
      const token = await getSessionToken();
      if (!token) return null;
      
      const payload = await verifyToken(token);
      if (!payload) return null;
      
      return payload; // Return user payload (sub, role, etc)
    } catch (error) {
      return null;
    }
  }
