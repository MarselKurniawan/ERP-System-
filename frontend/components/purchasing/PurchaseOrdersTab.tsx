import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function PurchaseOrdersTab() {
  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Purchase Orders</h2>
          <Badge variant="secondary">Coming Soon</Badge>
        </div>
        <p className="text-gray-600">
          Purchase orders management will include:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-600">
          <li>Create purchase orders with multiple items</li>
          <li>Track order status (draft, confirmed, received)</li>
          <li>Filter by supplier, date, and tags</li>
          <li>Generate supplier invoices from POs</li>
          <li>Search and filter purchase orders</li>
        </ul>
      </div>
    </Card>
  );
}
