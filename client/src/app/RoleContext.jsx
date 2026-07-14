import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { setApiRole } from '../api/axiosClient';

const RoleContext = createContext(null);
const ROLE_KEY = 'studymed-role';

function readRole() {
  const saved = sessionStorage.getItem(ROLE_KEY);
  return saved === 'mentor' ? 'mentor' : 'student';
}

export function RoleProvider({ children }) {
  const [role, setRoleState] = useState(() => {
    const initial = readRole();
    setApiRole(initial);
    return initial;
  });

  const setRole = useCallback((nextRole) => {
    const safeRole = nextRole === 'mentor' ? 'mentor' : 'student';
    sessionStorage.setItem(ROLE_KEY, safeRole);
    setApiRole(safeRole);
    setRoleState(safeRole);
  }, []);

  const value = useMemo(() => ({ role, setRole }), [role, setRole]);
  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useRole() {
  const value = useContext(RoleContext);
  if (!value) throw new Error('useRole phải nằm trong RoleProvider');
  return value;
}
