import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Eye } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useCompany } from '../../contexts/CompanyContext';
import { formatRupiah, formatDateShort } from '@/lib/utils';
import backend from '~backend/client';

interface PaymentAllocation {
  invoiceId: number;
  allocatedAmount: number;
}

export default function PaymentsTab() {
  const { selectedCompany } = useCompany();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    customerId: 0,
    paymentDate: new Date().toISOString().split('T')[0],
    amount: 0,
    paymentMethod: 'cash',
    referenceNumber: '',
    notes: '',
    cashBankAccountId: 0,
    tags: [] as string[],
    allocations: [] as PaymentAllocation[],
  });

  const { data: payments, isLoading } = useQuery({
    queryKey: ['salesPayments', selectedCompany?.id, search],
    queryFn: async () => {
      if (!selectedCompany) return [];
      const response = await backend.sales.listPayments({ 
        companyId: selectedCompany.id,
        search 
      });
      return response.payments;
    },
    enabled: !!selectedCompany,
  });

  const { data: customers } = useQuery({
    queryKey: ['customers', selectedCompany?.id],
    queryFn: async () => {
      if (!selectedCompany) return [];
      const response = await backend.sales.listCustomers({ companyId: selectedCompany.id });
      return response.customers;
    },
    enabled: !!selectedCompany,
  });

  const { data: invoices } = useQuery({
    queryKey: ['unpaidInvoices', selectedCompany?.id, formData.customerId],
    queryFn: async () => {
      if (!selectedCompany || !formData.customerId) return [];
      const response = await backend.sales.listInvoices({ companyId: selectedCompany.id });
      return response.invoices.filter((inv: any) => 
        inv.customerId === formData.customerId && 
        inv.totalAmount > inv.paidAmount
      );
    },
    enabled: !!selectedCompany && formData.customerId > 0,
  });

  const { data: accounts } = useQuery({
    queryKey: ['cashBankAccounts', selectedCompany?.id],
    queryFn: async () => {
      if (!selectedCompany) return [];
      const response = await backend.accounting.listAccounts({ companyId: selectedCompany.id });
      return response.accounts.filter((acc: any) => 
        acc.accountType === 'Asset' && 
        (acc.name.toLowerCase().includes('cash') || acc.name.toLowerCase().includes('bank'))
      );
    },
    enabled: !!selectedCompany,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return await backend.sales.createPayment(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salesPayments'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setDialogOpen(false);
      toast({ title: 'Payment recorded successfully' });
      resetForm();
    },
    onError: (error: any) => {
      console.error('Failed to record payment:', error);
      toast({ title: 'Failed to record payment', variant: 'destructive' });
    },
  });

  const resetForm = () => {
    setFormData({
      customerId: 0,
      paymentDate: new Date().toISOString().split('T')[0],
      amount: 0,
      paymentMethod: 'cash',
      referenceNumber: '',
      notes: '',
      cashBankAccountId: 0,
      tags: [],
      allocations: [],
    });
  };

  const addAllocation = (invoiceId: number, amount: number) => {
    const existing = formData.allocations.find(a => a.invoiceId === invoiceId);
    if (existing) {
      setFormData({
        ...formData,
        allocations: formData.allocations.map(a =>
          a.invoiceId === invoiceId ? { ...a, allocatedAmount: amount } : a
        ),
      });
    } else {
      setFormData({
        ...formData,
        allocations: [...formData.allocations, { invoiceId, allocatedAmount: amount }],
      });
    }
  };

  const getTotalAllocated = () => {
    return formData.allocations.reduce((sum, a) => sum + a.allocatedAmount, 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.allocations.length === 0) {
      toast({ title: 'Please allocate payment to at least one invoice', variant: 'destructive' });
      return;
    }
    if (getTotalAllocated() !== formData.amount) {
      toast({ title: 'Total allocated must equal payment amount', variant: 'destructive' });
      return;
    }
    createMutation.mutate({
      ...formData,
      companyId: selectedCompany!.id,
    });
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
              placeholder="Search payments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Record Payment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Record Customer Payment</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customerId">Customer *</Label>
                  <select
                    id="customerId"
                    value={formData.customerId}
                    onChange={(e) => {
                      setFormData({ ...formData, customerId: parseInt(e.target.value), allocations: [] });
                    }}
                    className="w-full border rounded-md p-2"
                    required
                  >
                    <option value={0}>Select customer</option>
                    {customers?.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="paymentDate">Payment Date *</Label>
                  <Input
                    id="paymentDate"
                    type="date"
                    value={formData.paymentDate}
                    onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="amount">Amount *</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="paymentMethod">Payment Method *</Label>
                  <select
                    id="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="w-full border rounded-md p-2"
                    required
                  >
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="check">Check</option>
                    <option value="credit_card">Credit Card</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="cashBankAccountId">Cash/Bank Account</Label>
                  <select
                    id="cashBankAccountId"
                    value={formData.cashBankAccountId}
                    onChange={(e) => setFormData({ ...formData, cashBankAccountId: parseInt(e.target.value) })}
                    className="w-full border rounded-md p-2"
                  >
                    <option value={0}>Select account</option>
                    {accounts?.map((acc: any) => (
                      <option key={acc.id} value={acc.id}>{acc.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="referenceNumber">Reference Number</Label>
                  <Input
                    id="referenceNumber"
                    value={formData.referenceNumber}
                    onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                  />
                </div>
              </div>

              {formData.customerId > 0 && invoices && invoices.length > 0 && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Allocate to Invoices</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice #</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Paid</TableHead>
                        <TableHead>Balance</TableHead>
                        <TableHead>Allocate</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoices.map((invoice: any) => {
                        const balance = invoice.totalAmount - invoice.paidAmount;
                        const allocation = formData.allocations.find(a => a.invoiceId === invoice.id);
                        return (
                          <TableRow key={invoice.id}>
                            <TableCell>{invoice.invoiceNumber}</TableCell>
                            <TableCell>{formatDateShort(invoice.invoiceDate)}</TableCell>
                            <TableCell>{formatRupiah(invoice.totalAmount)}</TableCell>
                            <TableCell>{formatRupiah(invoice.paidAmount)}</TableCell>
                            <TableCell className="font-semibold">{formatRupiah(balance)}</TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                max={balance}
                                value={allocation?.allocatedAmount || 0}
                                onChange={(e) => addAllocation(invoice.id, parseFloat(e.target.value) || 0)}
                                className="w-32"
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  <div className="mt-4 flex justify-between items-center bg-gray-50 p-3 rounded">
                    <span className="font-semibold">Payment Amount:</span>
                    <span className="text-lg font-bold">{formatRupiah(formData.amount)}</span>
                  </div>
                  <div className="flex justify-between items-center bg-gray-50 p-3 rounded mt-2">
                    <span className="font-semibold">Total Allocated:</span>
                    <span className={`text-lg font-bold ${getTotalAllocated() === formData.amount ? 'text-green-600' : 'text-red-600'}`}>
                      {formatRupiah(getTotalAllocated())}
                    </span>
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Recording...' : 'Record Payment'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Method</TableHead>
            <TableHead>Reference</TableHead>
            <TableHead>Tags</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center">Loading...</TableCell>
            </TableRow>
          ) : payments?.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center">No payments found</TableCell>
            </TableRow>
          ) : (
            payments?.map((payment: any) => (
              <TableRow key={payment.id}>
                <TableCell>{formatDateShort(payment.paymentDate)}</TableCell>
                <TableCell>{payment.customerName}</TableCell>
                <TableCell className="font-semibold text-green-600">{formatRupiah(payment.amount)}</TableCell>
                <TableCell>
                  <Badge variant="outline">{payment.paymentMethod.replace('_', ' ')}</Badge>
                </TableCell>
                <TableCell>{payment.referenceNumber || '-'}</TableCell>
                <TableCell>
                  {payment.tags?.map((tag: string, i: number) => (
                    <Badge key={i} variant="secondary" className="mr-1">{tag}</Badge>
                  ))}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Card>
  );
}
