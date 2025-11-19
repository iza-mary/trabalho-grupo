import { useContext } from 'react';
import { AuthContext } from '../context/AuthContextBase';

export function useAuth() {
  return useContext(AuthContext);
}
/*
  Hook useAuth
  - Fornece estado de autenticação, usuário atual e helpers.
  - Baseado em `AuthContext`; simplifica acesso em componentes.
*/