import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function PurchasePaymentsTab() {
  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Purchase Payments</h2>
          <Badge variant="secondary">Coming Soon</Badge>
        </div>
        <p className="text-gray-600">
          Purchase payments management will include:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-600">
          <li>Record payments to suppliers</li>
          <li>Allocate payments to multiple invoices</li>
          <li>Support partial payments</li>
          <li>Multiple payment methods (cash, bank transfer, check)</li>
          <li>Tag payments for better categorization</li>
          <li>Automatic journal entries and account updates</li>
        </ul>
      </div>
    </Card>
  );
}
