import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, ShoppingCart, Truck, DollarSign } from "lucide-react";
import backend from "~backend/client";

export default function Dashboard() {
  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: () => backend.inventory.listProducts(),
  });

  const { data: salesOrders } = useQuery({
    queryKey: ["sales-orders"],
    queryFn: () => backend.sales.listOrders(),
  });

  const { data: purchaseOrders } = useQuery({
    queryKey: ["purchase-orders"],
    queryFn: () => backend.purchasing.listPurchaseOrders(),
  });

  const lowStockProducts = products?.products.filter(p => p.stockQuantity <= p.minStockLevel) || [];
  const totalSalesValue = salesOrders?.orders.reduce((sum, order) => sum + order.totalAmount, 0) || 0;
  const totalPurchaseValue = purchaseOrders?.orders.reduce((sum, order) => sum + order.totalAmount, 0) || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Overview of your ERP system</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products?.products.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              {lowStockProducts.length} low stock items
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sales Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{salesOrders?.orders.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              ${totalSalesValue.toFixed(2)} total value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Purchase Orders</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{purchaseOrders?.orders.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              ${totalPurchaseValue.toFixed(2)} total value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Position</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Rp. {(totalSalesValue - totalPurchaseValue).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Sales minus purchases
            </p>
          </CardContent>
        </Card>
      </div>

      {lowStockProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Low Stock Alert</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowStockProducts.slice(0, 5).map((product) => (
                <div key={product.id} className="flex justify-between items-center p-2 bg-red-50 rounded">
                  <span className="font-medium">{product.name}</span>
                  <span className="text-sm text-red-600">
                    {product.stockQuantity} / {product.minStockLevel} min
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
