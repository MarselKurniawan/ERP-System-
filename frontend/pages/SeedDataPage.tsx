import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Database, Users, Building2, Package, ShoppingCart, Truck, Calculator } from "lucide-react";
import backend from "~backend/client";

export default function SeedDataPage() {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const seedOperations = [
    {
      key: "users",
      title: "Users",
      description: "Create sample users with different roles",
      icon: Users,
      action: () => backend.auth.seedUsers(),
    },
    {
      key: "companies",
      title: "Companies",
      description: "Create sample company data",
      icon: Building2,
      action: () => backend.company.seedCompanies(),
    },
    {
      key: "inventory",
      title: "Inventory",
      description: "Create sample products and categories",
      icon: Package,
      action: () => backend.inventory.seedInventory(),
    },
    {
      key: "sales",
      title: "Sales",
      description: "Create sample customers and sales orders",
      icon: ShoppingCart,
      action: () => backend.sales.seedSales(),
    },
    {
      key: "purchasing",
      title: "Purchasing",
      description: "Create sample suppliers and purchase orders",
      icon: Truck,
      action: () => backend.purchasing.seedPurchasing(),
    },
    {
      key: "accounting",
      title: "Accounting",
      description: "Create sample journal entries",
      icon: Calculator,
      action: () => backend.accounting.seedAccounting(),
    },
  ];

  const handleSeed = async (operation: typeof seedOperations[0]) => {
    setLoadingStates(prev => ({ ...prev, [operation.key]: true }));

    try {
      const result = await operation.action();
      toast({
        title: "Success",
        description: result.message,
      });
    } catch (error) {
      console.error(`Error seeding ${operation.title}:`, error);
      toast({
        title: "Error",
        description: `Failed to seed ${operation.title.toLowerCase()}`,
        variant: "destructive",
      });
    } finally {
      setLoadingStates(prev => ({ ...prev, [operation.key]: false }));
    }
  };

  const handleSeedAll = async () => {
    for (const operation of seedOperations) {
      await handleSeed(operation);
      // Add a small delay between operations
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Seed Data</h1>
        <p className="text-gray-600">Generate sample data for testing and demonstration</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="mr-2 h-5 w-5" />
            Database Seeding
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
              <div>
                <h3 className="font-medium">Seed All Data</h3>
                <p className="text-sm text-gray-600">Generate all sample data at once</p>
              </div>
              <Button 
                onClick={handleSeedAll}
                disabled={Object.values(loadingStates).some(loading => loading)}
              >
                {Object.values(loadingStates).some(loading => loading) ? "Seeding..." : "Seed All"}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {seedOperations.map((operation) => {
                const Icon = operation.icon;
                const isLoading = loadingStates[operation.key];

                return (
                  <Card key={operation.key} className="relative">
                    <CardHeader>
                      <CardTitle className="flex items-center text-lg">
                        <Icon className="mr-2 h-5 w-5" />
                        {operation.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-4">{operation.description}</p>
                      <Button 
                        onClick={() => handleSeed(operation)}
                        disabled={isLoading}
                        className="w-full"
                      >
                        {isLoading ? "Seeding..." : `Seed ${operation.title}`}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-yellow-50 border-yellow-200">
        <CardHeader>
          <CardTitle className="text-yellow-800">Important Notes</CardTitle>
        </CardHeader>
        <CardContent className="text-yellow-700">
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Seeding operations will create sample data in your database</li>
            <li>Existing data with the same identifiers will be skipped</li>
            <li>This is intended for development and testing purposes</li>
            <li>Make sure to seed users first if you want to test with different user roles</li>
            <li>Some operations depend on others (e.g., sales orders need customers and products)</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
