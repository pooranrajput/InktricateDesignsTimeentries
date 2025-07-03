import { createContext, useContext, useState, ReactNode } from "react";

type ViewToggleContextType = {
  viewAsEmployee: boolean;
  setViewAsEmployee: (value: boolean) => void;
};

const ViewToggleContext = createContext<ViewToggleContextType | null>(null);

export function ViewToggleProvider({ children }: { children: ReactNode }) {
  const [viewAsEmployee, setViewAsEmployee] = useState(false);

  return (
    <ViewToggleContext.Provider value={{ viewAsEmployee, setViewAsEmployee }}>
      {children}
    </ViewToggleContext.Provider>
  );
}

export function useViewToggle() {
  const context = useContext(ViewToggleContext);
  if (!context) {
    throw new Error("useViewToggle must be used within a ViewToggleProvider");
  }
  return context;
}