import { useCompany } from '../contexts/CompanyContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2 } from 'lucide-react';

export default function CompanySelector() {
  const { companies, selectedCompany, setSelectedCompany } = useCompany();

  if (companies.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="p-8 max-w-md w-full">
          <div className="text-center">
            <Building2 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Tidak Ada Perusahaan</h2>
            <p className="text-gray-600 mb-6">
              Anda belum memiliki akses ke perusahaan manapun. Silakan hubungi administrator untuk mendapatkan akses.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="p-8 max-w-2xl w-full">
        <div className="text-center mb-8">
          <Building2 className="w-16 h-16 mx-auto text-blue-600 mb-4" />
          <h2 className="text-3xl font-bold mb-2">Pilih Perusahaan</h2>
          <p className="text-gray-600">
            Pilih perusahaan yang ingin Anda kelola
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {companies.map((company) => (
            <Card
              key={company.id}
              className={`p-6 cursor-pointer transition-all hover:shadow-lg ${
                selectedCompany?.id === company.id
                  ? 'border-blue-600 border-2 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-400'
              }`}
              onClick={() => setSelectedCompany(company)}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold mb-2">{company.name}</h3>
                  {company.industry && (
                    <p className="text-sm text-gray-600">{company.industry}</p>
                  )}
                </div>
                {selectedCompany?.id === company.id && (
                  <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Button
            size="lg"
            onClick={() => {
              window.location.href = '/';
            }}
            disabled={!selectedCompany}
          >
            Lanjutkan
          </Button>
        </div>
      </Card>
    </div>
  );
}
