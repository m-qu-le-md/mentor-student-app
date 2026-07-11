import { createContext, useState, useEffect } from 'react';

export const RoleContext = createContext();

export const RoleProvider = ({ children }) => {
  const [role, setRole] = useState('student');

  useEffect(() => {
    const savedRole = localStorage.getItem('app_role');
    if (savedRole) setRole(savedRole);
  }, []);

  const toggleRole = () => {
    const newRole = role === 'mentor' ? 'student' : 'mentor';
    setRole(newRole);
    localStorage.setItem('app_role', newRole);
  };

  return (
    <RoleContext.Provider value={{ role, toggleRole }}>
      {/* Một thẻ div bọc ngoài cùng để áp dụng Dark/Light theme */}
      <div className="app-container">
        {children}
      </div>
    </RoleContext.Provider>
  );
};
