import React, { createContext, useState, useContext, useEffect } from 'react';
import { User } from '@/api/entities';

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const currentUser = await User.me();
        setUser(currentUser);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch current user:', err);
        setError(err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const refreshUser = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      return currentUser;
    } catch (err) {
      console.error('Failed to refresh user:', err);
      throw err;
    }
  };

  return (
    <UserContext.Provider value={{ user, loading, error, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useCurrentUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useCurrentUser must be used within a UserProvider');
  }
  return context;
};

export default useCurrentUser;
