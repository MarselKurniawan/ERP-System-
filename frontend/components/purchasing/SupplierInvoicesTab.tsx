import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function SupplierInvoicesTab() {
  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Supplier Invoices</h2>
          <Badge variant="secondary">Coming Soon</Badge>
        </div>
        <p className="text-gray-600">
          Supplier invoices management will include:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-600">
          <li>Track all supplier invoices with payment status</li>
          <li>View total, paid, and remaining amounts in Rupiah</li>
          <li>Filter by supplier, status, and due date</li>
          <li>Mark invoices as paid or partially paid</li>
          <li>Automatic journal entries creation</li>
        </ul>
      </div>
    </Card>
  );
}
