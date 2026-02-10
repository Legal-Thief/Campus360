import React, { createContext, useContext, useState } from 'react';

type Role = 'student' | 'admin' | 'warden' | 'superadmin' | null;

const AppContext = createContext<any>(null);

export function AppProvider({ children }) {
  const [role, setRole] = useState<Role>(null);

  const [eventState, setEventState] = useState({
    quizCompleted: false,
    priority: null as number | null,
    seatSelected: false,
    qrGenerated: false,
  });

  return (
    <AppContext.Provider
      value={{
        role,
        setRole,
        eventState,
        setEventState,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
