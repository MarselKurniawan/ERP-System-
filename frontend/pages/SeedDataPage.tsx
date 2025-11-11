import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Database, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useBackend } from "@/hooks/useBackend";

export default function SeedDataPage() {
  const backend = useBackend();
  const [loading, setLoading] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const seedData = async (service: string, seedFunction: () => Promise<any>) => {
    setLoading(service);
    try {
      await seedFunction();
      setResults(prev => ({ ...prev, [service]: true }));
      toast({
        title: "Success",
        description: `${service} data seeded successfully`,
      });
    } catch (error) {
      console.error(`Error seeding ${service}:`, error);
      setResults(prev => ({ ...prev, [service]: false }));
      toast({
        title: "Error",
        description: `Failed to seed ${service} data`,
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const seedAll = async () => {
    setResults({});
    
    // Seed in order of dependencies
    await seedData("Users", () => backend.auth.seedUsers());
    await seedData("Companies", () => backend.company.seedCompanies());
    await seedData("Inventory", () => backend.inventory.seedInventory());
    await seedData("Sales", () => backend.sales.seedSales());
    await seedData("Purchasing", () => backend.purchasing.seedPurchasing());
    await seedData("Accounting", () => backend.accounting.seedAccounting());
  };

  const renderStatus = (service: string) => {
    if (loading === service) {
      return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
    }
    if (results[service] === true) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    if (results[service] === false) {
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Seed Database</h1>
        <p className="text-gray-600">Populate the database with sample data for testing</p>
      </div>

      <Alert>
        <Database className="h-4 w-4" />
        <AlertDescription>
          This will populate your database with sample data. Use this for testing purposes only.
          <strong className="block mt-2">Warning: This may overwrite existing data in some cases!</strong>
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Seed All Data</CardTitle>
          <CardDescription>
            This will seed all services with sample data in the correct order
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={seedAll} 
            disabled={loading !== null}
            className="w-full mb-4"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Seeding {loading}...
              </>
            ) : (
              <>
                <Database className="mr-2 h-4 w-4" />
                Seed All Data
              </>
            )}
          </Button>

          <div className="space-y-2">
            <h4 className="font-medium">Seeding Progress:</h4>
            {[
              "Users",
              "Companies", 
              "Inventory",
              "Sales",
              "Purchasing",
              "Accounting"
            ].map(service => (
              <div key={service} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                <span className="text-sm">{service}</span>
                {renderStatus(service)}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Separator />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Users</CardTitle>
            <CardDescription>Create sample users for testing</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => seedData("Users", () => backend.auth.seedUsers())}
              disabled={loading !== null}
              variant="outline"
              className="w-full"
            >
              {loading === "Users" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Database className="mr-2 h-4 w-4" />
              )}
              Seed Users
            </Button>
            <div className="mt-2 text-xs text-gray-500">
              Creates admin, manager, accountant, sales, purchasing, and regular users
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Companies</CardTitle>
            <CardDescription>Create sample company data</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => seedData("Companies", () => backend.company.seedCompanies())}
              disabled={loading !== null}
              variant="outline"
              className="w-full"
            >
              {loading === "Companies" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Database className="mr-2 h-4 w-4" />
              )}
              Seed Companies
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Inventory</CardTitle>
            <CardDescription>Create sample products and categories</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => seedData("Inventory", () => backend.inventory.seedInventory())}
              disabled={loading !== null}
              variant="outline"
              className="w-full"
            >
              {loading === "Inventory" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Database className="mr-2 h-4 w-4" />
              )}
              Seed Inventory
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sales</CardTitle>
            <CardDescription>Create sample customers</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => seedData("Sales", () => backend.sales.seedSales())}
              disabled={loading !== null}
              variant="outline"
              className="w-full"
            >
              {loading === "Sales" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Database className="mr-2 h-4 w-4" />
              )}
              Seed Sales Data
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Purchasing</CardTitle>
            <CardDescription>Create sample suppliers</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => seedData("Purchasing", () => backend.purchasing.seedPurchasing())}
              disabled={loading !== null}
              variant="outline"
              className="w-full"
            >
              {loading === "Purchasing" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Database className="mr-2 h-4 w-4" />
              )}
              Seed Purchasing Data
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Accounting</CardTitle>
            <CardDescription>Create sample accounts and transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => seedData("Accounting", () => backend.accounting.seedAccounting())}
              disabled={loading !== null}
              variant="outline"
              className="w-full"
            >
              {loading === "Accounting" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Database className="mr-2 h-4 w-4" />
              )}
              Seed Accounting Data
            </Button>
          </CardContent>
        </Card>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Login Credentials for Testing:</strong>
          <div className="mt-2 space-y-1 text-sm">
            <div>Admin: admin@company.com / admin123</div>
            <div>Manager: manager@company.com / manager123</div>
            <div>Accountant: accountant@company.com / accountant123</div>
            <div>Sales: sales@company.com / sales123</div>
            <div>Purchasing: purchasing@company.com / purchasing123</div>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}