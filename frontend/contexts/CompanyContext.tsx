import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

interface Company {
  id: number;
  name: string;
  industry: string | null;
  assignedAt: Date;
}

interface CompanyContextType {
  selectedCompany: Company | null;
  setSelectedCompany: (company: Company | null) => void;
  companies: Company[];
  loading: boolean;
  refreshCompanies: () => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const { backend, user, isLoading: authLoading } = useAuth();
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(() => {
    const stored = localStorage.getItem('selectedCompany');
    return stored ? JSON.parse(stored) : null;
  });
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshCompanies = async () => {
    if (!user || authLoading) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await backend.auth.listUserCompanies();
      setCompanies(response.companies);
      
      if (response.companies.length > 0 && !selectedCompany) {
        const firstCompany = response.companies[0];
        setSelectedCompany(firstCompany);
        localStorage.setItem('selectedCompany', JSON.stringify(firstCompany));
      }
    } catch (error) {
      console.error('Failed to load companies:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && !authLoading) {
      refreshCompanies();
    } else {
      setLoading(false);
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (selectedCompany) {
      localStorage.setItem('selectedCompany', JSON.stringify(selectedCompany));
    }
  }, [selectedCompany]);

  return (
    <CompanyContext.Provider value={{ selectedCompany, setSelectedCompany, companies, loading, refreshCompanies }}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
}
