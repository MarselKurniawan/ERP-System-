import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, FileText, DollarSign } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useCompany } from '../../contexts/CompanyContext';
import { formatRupiah, formatDateShort } from '@/lib/utils';
import backend from '~backend/client';

export default function InvoicesTab() {
  const { selectedCompany } = useCompany();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['invoices', selectedCompany?.id, search],
    queryFn: async () => {
      if (!selectedCompany) return [];
      const response = await backend.sales.listInvoices({ companyId: selectedCompany.id });
      return response.invoices.filter((inv: any) => 
        search === '' || 
        inv.customerName.toLowerCase().includes(search.toLowerCase()) ||
        inv.invoiceNumber.toLowerCase().includes(search.toLowerCase())
      );
    },
    enabled: !!selectedCompany,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: any }) => {
      return await backend.sales.updateInvoice({ 
        id, 
        status: status as any,
        paidAmount: 0 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({ title: 'Invoice updated successfully' });
    },
    onError: (error: any) => {
      console.error('Failed to update invoice:', error);
      toast({ title: 'Failed to update invoice', variant: 'destructive' });
    },
  });

  const getStatusBadge = (invoice: any) => {
    const remaining = invoice.totalAmount - invoice.paidAmount;
    if (remaining <= 0) {
      return <Badge className="bg-green-600">Paid</Badge>;
    } else if (invoice.paidAmount > 0) {
      return <Badge className="bg-yellow-600">Partial</Badge>;
    } else if (new Date(invoice.dueDate) < new Date()) {
      return <Badge variant="destructive">Overdue</Badge>;
    } else {
      return <Badge variant="outline">Unpaid</Badge>;
    }
  };

  if (!selectedCompany) {
    return <Card className="p-6">Please select a company first</Card>;
  }

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex-1 max-w-sm">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search invoices..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice #</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Invoice Date</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Paid</TableHead>
            <TableHead>Remaining</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center">Loading...</TableCell>
            </TableRow>
          ) : invoices?.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center">No invoices found</TableCell>
            </TableRow>
          ) : (
            invoices?.map((invoice: any) => {
              const remaining = invoice.totalAmount - invoice.paidAmount;
              return (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                  <TableCell>{invoice.customerName}</TableCell>
                  <TableCell>{formatDateShort(invoice.invoiceDate)}</TableCell>
                  <TableCell>{formatDateShort(invoice.dueDate)}</TableCell>
                  <TableCell className="font-semibold">{formatRupiah(invoice.totalAmount)}</TableCell>
                  <TableCell className="text-green-600">{formatRupiah(invoice.paidAmount)}</TableCell>
                  <TableCell className={remaining > 0 ? 'text-red-600 font-semibold' : ''}>
                    {formatRupiah(remaining)}
                  </TableCell>
                  <TableCell>{getStatusBadge(invoice)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" title="View Invoice">
                      <FileText className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      title="Record Payment"
                      disabled={remaining <= 0}
                    >
                      <DollarSign className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </Card>
  );
}
