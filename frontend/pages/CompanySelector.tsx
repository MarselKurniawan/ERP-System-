import { useCompany } from '../contexts/CompanyContext';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, CheckCircle2, LogOut } from 'lucide-react';
import { Navigate, Link } from 'react-router-dom';

export default function CompanySelector() {
  const { companies, selectedCompany, setSelectedCompany, loading } = useCompany();
  const { logout } = useAuth();

  // Jika sudah pilih company, redirect ke dashboard
  if (selectedCompany) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Building2 className="w-16 h-16 mx-auto text-blue-600 mb-4 animate-pulse" />
          <p className="text-gray-600">Loading companies...</p>
        </div>
      </div>
    );
  }

  if (companies.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="p-8 max-w-md w-full text-center">
          <Building2 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Tidak Ada Perusahaan</h2>
          <p className="text-gray-600 mb-6">
            Anda belum memiliki akses ke perusahaan manapun. Silakan hubungi administrator untuk mendapatkan akses.
          </p>
          <Button onClick={() => logout()} variant="outline" className="w-full">
            <LogOut className="h-4 w-4 mr-2" />
            Logout dan Login Ulang
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <Building2 className="w-20 h-20 text-blue-600" />
            <Button onClick={() => logout()} variant="outline" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Pilih Perusahaan</h1>
          <p className="text-gray-600 text-lg">
            Pilih perusahaan yang ingin Anda kelola
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies.map((company) => (
            <Card
              key={company.id}
              className="p-6 cursor-pointer transition-all hover:shadow-xl hover:scale-105 border-2 hover:border-blue-400"
              onClick={() => setSelectedCompany(company)}
            >
              <div className="flex flex-col h-full">
                <div className="flex items-start justify-between mb-4">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <Building2 className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{company.name}</h3>
                {company.industry && (
                  <p className="text-sm text-gray-600 mb-4">{company.industry}</p>
                )}
                <div className="mt-auto">
                  <Button className="w-full" size="lg">
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Pilih Perusahaan
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
