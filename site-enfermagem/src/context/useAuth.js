import { useContext } from 'react';
import { AuthContext } from './AuthContextBase';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
};

export default useAuth;
