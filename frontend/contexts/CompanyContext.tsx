import React, { createContext, useContext, useState, useEffect } from 'react';
import backend from '~backend/client';

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
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(() => {
    const stored = localStorage.getItem('selectedCompany');
    return stored ? JSON.parse(stored) : null;
  });
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshCompanies = async () => {
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
    refreshCompanies();
  }, []);

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
