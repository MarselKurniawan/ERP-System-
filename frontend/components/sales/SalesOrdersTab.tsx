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
import { Plus, Search, Eye, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useCompany } from '../../contexts/CompanyContext';
import { formatRupiah, formatDateShort } from '@/lib/utils';
import backend from '~backend/client';

interface OrderItem {
  productId: number;
  productSku: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
}

export default function SalesOrdersTab() {
  const { selectedCompany } = useCompany();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    customerId: 0,
    orderDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    items: [] as OrderItem[],
    taxRate: 11,
    discountAmount: 0,
    notes: '',
  });
  const [itemForm, setItemForm] = useState({
    productId: 0,
    productSku: '',
    productName: '',
    quantity: 1,
    unitPrice: 0,
    discountAmount: 0,
  });

  const { data: orders, isLoading } = useQuery({
    queryKey: ['salesOrders', selectedCompany?.id, search],
    queryFn: async () => {
      if (!selectedCompany) return [];
      const response = await backend.sales.listOrders({ companyId: selectedCompany.id });
      return response.orders.filter((o: any) => 
        search === '' || 
        o.customerName.toLowerCase().includes(search.toLowerCase()) ||
        o.orderNumber.toLowerCase().includes(search.toLowerCase())
      );
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

  const { data: products } = useQuery({
    queryKey: ['products', selectedCompany?.id],
    queryFn: async () => {
      if (!selectedCompany) return [];
      const response = await backend.inventory.listProducts({ companyId: selectedCompany.id });
      return response.products;
    },
    enabled: !!selectedCompany,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return await backend.sales.createOrder(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salesOrders'] });
      setDialogOpen(false);
      toast({ title: 'Sales order created successfully' });
      resetForm();
    },
    onError: (error: any) => {
      console.error('Failed to create sales order:', error);
      toast({ title: 'Failed to create sales order', variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await backend.sales.deleteOrder({ id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salesOrders'] });
      toast({ title: 'Sales order deleted successfully' });
    },
    onError: (error: any) => {
      console.error('Failed to delete sales order:', error);
      toast({ title: 'Failed to delete sales order', variant: 'destructive' });
    },
  });

  const resetForm = () => {
    setFormData({
      customerId: 0,
      orderDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      items: [],
      taxRate: 11,
      discountAmount: 0,
      notes: '',
    });
    setItemForm({
      productId: 0,
      productSku: '',
      productName: '',
      quantity: 1,
      unitPrice: 0,
      discountAmount: 0,
    });
  };

  const addItem = () => {
    if (!itemForm.productId || itemForm.quantity <= 0 || itemForm.unitPrice <= 0) {
      toast({ title: 'Please fill all item fields', variant: 'destructive' });
      return;
    }
    setFormData({
      ...formData,
      items: [...formData.items, { ...itemForm }],
    });
    setItemForm({
      productId: 0,
      productSku: '',
      productName: '',
      quantity: 1,
      unitPrice: 0,
      discountAmount: 0,
    });
  };

  const removeItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const calculateSubtotal = () => {
    return formData.items.reduce((sum, item) => {
      return sum + (item.quantity * item.unitPrice - item.discountAmount);
    }, 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const tax = subtotal * formData.taxRate / 100;
    return subtotal + tax - formData.discountAmount;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.items.length === 0) {
      toast({ title: 'Please add at least one item', variant: 'destructive' });
      return;
    }
    createMutation.mutate({
      ...formData,
      orderDate: new Date(formData.orderDate),
      dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
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
              placeholder="Search orders..."
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
              Add Sales Order
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Sales Order</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customerId">Customer *</Label>
                  <select
                    id="customerId"
                    value={formData.customerId}
                    onChange={(e) => setFormData({ ...formData, customerId: parseInt(e.target.value) })}
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
                  <Label htmlFor="orderDate">Order Date *</Label>
                  <Input
                    id="orderDate"
                    type="date"
                    value={formData.orderDate}
                    onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Add Items</h3>
                <div className="grid grid-cols-6 gap-2 mb-2">
                  <select
                    value={itemForm.productId}
                    onChange={(e) => {
                      const product = products?.find((p: any) => p.id === parseInt(e.target.value));
                      if (product) {
                        setItemForm({
                          ...itemForm,
                          productId: product.id,
                          productSku: product.sku,
                          productName: product.name,
                          unitPrice: product.unitPrice,
                        });
                      }
                    }}
                    className="col-span-2 border rounded-md p-2"
                  >
                    <option value={0}>Select product</option>
                    {products?.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                    ))}
                  </select>
                  <Input
                    type="number"
                    placeholder="Qty"
                    value={itemForm.quantity}
                    onChange={(e) => setItemForm({ ...itemForm, quantity: parseInt(e.target.value) })}
                  />
                  <Input
                    type="number"
                    placeholder="Price"
                    value={itemForm.unitPrice}
                    onChange={(e) => setItemForm({ ...itemForm, unitPrice: parseFloat(e.target.value) })}
                  />
                  <Input
                    type="number"
                    placeholder="Discount"
                    value={itemForm.discountAmount}
                    onChange={(e) => setItemForm({ ...itemForm, discountAmount: parseFloat(e.target.value) })}
                  />
                  <Button type="button" onClick={addItem}>Add</Button>
                </div>

                {formData.items.length > 0 && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Discount</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {formData.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.productName}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{formatRupiah(item.unitPrice)}</TableCell>
                          <TableCell>{formatRupiah(item.discountAmount)}</TableCell>
                          <TableCell>{formatRupiah(item.quantity * item.unitPrice - item.discountAmount)}</TableCell>
                          <TableCell>
                            <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(index)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="taxRate">Tax Rate (%)</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    value={formData.taxRate}
                    onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="discountAmount">Order Discount</Label>
                  <Input
                    id="discountAmount"
                    type="number"
                    value={formData.discountAmount}
                    onChange={(e) => setFormData({ ...formData, discountAmount: parseFloat(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="bg-gray-50 p-4 rounded-md space-y-1">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-semibold">{formatRupiah(calculateSubtotal())}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax ({formData.taxRate}%):</span>
                  <span className="font-semibold">{formatRupiah(calculateSubtotal() * formData.taxRate / 100)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Discount:</span>
                  <span className="font-semibold">-{formatRupiah(formData.discountAmount)}</span>
                </div>
                <div className="flex justify-between text-lg border-t pt-2">
                  <span className="font-bold">Total:</span>
                  <span className="font-bold text-blue-600">{formatRupiah(calculateTotal())}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Creating...' : 'Create Order'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order #</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center">Loading...</TableCell>
            </TableRow>
          ) : orders?.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center">No orders found</TableCell>
            </TableRow>
          ) : (
            orders?.map((order: any) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium">{order.orderNumber}</TableCell>
                <TableCell>{order.customerName}</TableCell>
                <TableCell>{formatDateShort(order.orderDate)}</TableCell>
                <TableCell>{order.dueDate ? formatDateShort(order.dueDate) : '-'}</TableCell>
                <TableCell className="font-semibold">{formatRupiah(order.totalAmount)}</TableCell>
                <TableCell>
                  <Badge variant={
                    order.status === 'confirmed' ? 'default' :
                    order.status === 'shipped' ? 'secondary' :
                    order.status === 'cancelled' ? 'destructive' : 'outline'
                  }>
                    {order.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this order?')) {
                        deleteMutation.mutate(order.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
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
