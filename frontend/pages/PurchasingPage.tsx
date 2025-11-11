import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Truck, Building, Trash2, Edit, FileText, DollarSign } from "lucide-react";
import { useBackend } from "@/hooks/useBackend";
import type { CreateSupplierRequest } from "~backend/purchasing/create_supplier";
import type { CreatePurchaseOrderRequest, PurchaseOrderItem } from "~backend/purchasing/create_purchase_order";
import type { UpdateSupplierRequest } from "~backend/purchasing/update_supplier";
import type { UpdatePurchaseOrderRequest } from "~backend/purchasing/update_purchase_order";
import type { CreateSupplierInvoiceRequest, SupplierInvoiceItem } from "~backend/purchasing/create_supplier_invoice";
import type { PaySupplierInvoiceRequest } from "~backend/purchasing/pay_supplier_invoice";

export default function PurchasingPage() {
  const backend = useBackend();
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [editingSupplier, setEditingSupplier] = useState<any>(null);
  const [supplierData, setSupplierData] = useState<CreateSupplierRequest>({
    name: "",
    email: "",
    phone: "",
    address: "",
    taxId: "",
    paymentTerms: "",
  });
  const [orderData, setOrderData] = useState<CreatePurchaseOrderRequest>({
    supplierId: 0,
    orderDate: new Date(),
    expectedDate: undefined,
    items: [],
    taxRate: 0,
    discountAmount: 0,
    notes: "",
  });
  const [currentItem, setCurrentItem] = useState<PurchaseOrderItem>({
    productId: 0,
    productSku: "",
    productName: "",
    quantity: 1,
    unitPrice: 0,
    discountAmount: 0,
  });
  const [invoiceData, setInvoiceData] = useState<CreateSupplierInvoiceRequest>({
    supplier_id: 0,
    invoice_number: "",
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: new Date().toISOString().split('T')[0],
    items: [],
    tax_amount: 0,
    notes: "",
  });
  const [currentInvoiceItem, setCurrentInvoiceItem] = useState<SupplierInvoiceItem>({
    description: "",
    quantity: 1,
    unit_price: 0,
  });
  const [paymentData, setPaymentData] = useState<PaySupplierInvoiceRequest>({
    id: 0,
    payment_date: new Date().toISOString().split('T')[0],
    amount: 0,
    payment_method: "cash",
    reference_number: "",
    notes: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: suppliers } = useQuery({
    queryKey: ["suppliers"],
    queryFn: () => backend.purchasing.listSuppliers(),
  });

  const { data: purchaseOrders } = useQuery({
    queryKey: ["purchase-orders"],
    queryFn: () => backend.purchasing.listPurchaseOrders(),
  });

  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: () => backend.inventory.listProducts(),
  });

  const { data: supplierInvoices } = useQuery({
    queryKey: ["supplier-invoices"],
    queryFn: () => backend.purchasing.listSupplierInvoices(),
  });

  const createSupplierMutation = useMutation({
    mutationFn: (data: CreateSupplierRequest) => backend.purchasing.createSupplier(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      setShowSupplierForm(false);
      resetSupplierForm();
      toast({
        title: "Success",
        description: "Supplier created successfully",
      });
    },
    onError: (error) => {
      console.error("Error creating supplier:", error);
      toast({
        title: "Error",
        description: "Failed to create supplier",
        variant: "destructive",
      });
    },
  });

  const updateSupplierMutation = useMutation({
    mutationFn: (data: UpdateSupplierRequest) => backend.purchasing.updateSupplier(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      setEditingSupplier(null);
      setShowSupplierForm(false);
      resetSupplierForm();
      toast({
        title: "Success",
        description: "Supplier updated successfully",
      });
    },
    onError: (error) => {
      console.error("Error updating supplier:", error);
      toast({
        title: "Error",
        description: "Failed to update supplier",
        variant: "destructive",
      });
    },
  });

  const deleteSupplierMutation = useMutation({
    mutationFn: (id: number) => backend.purchasing.deleteSupplier({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast({
        title: "Success",
        description: "Supplier deleted successfully",
      });
    },
    onError: (error) => {
      console.error("Error deleting supplier:", error);
      toast({
        title: "Error",
        description: "Failed to delete supplier",
        variant: "destructive",
      });
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: (data: CreatePurchaseOrderRequest) => backend.purchasing.createPurchaseOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      setShowOrderForm(false);
      resetOrderForm();
      toast({
        title: "Success",
        description: "Purchase order created successfully",
      });
    },
    onError: (error) => {
      console.error("Error creating purchase order:", error);
      toast({
        title: "Error",
        description: "Failed to create purchase order",
        variant: "destructive",
      });
    },
  });

  const updateOrderMutation = useMutation({
    mutationFn: (data: UpdatePurchaseOrderRequest) => backend.purchasing.updatePurchaseOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      toast({
        title: "Success",
        description: "Purchase order updated successfully",
      });
    },
    onError: (error) => {
      console.error("Error updating purchase order:", error);
      toast({
        title: "Error",
        description: "Failed to update purchase order",
        variant: "destructive",
      });
    },
  });

  const deleteOrderMutation = useMutation({
    mutationFn: (id: number) => backend.purchasing.deletePurchaseOrder({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      toast({
        title: "Success",
        description: "Purchase order deleted successfully",
      });
    },
    onError: (error) => {
      console.error("Error deleting purchase order:", error);
      toast({
        title: "Error",
        description: "Failed to delete purchase order",
        variant: "destructive",
      });
    },
  });

  const createInvoiceMutation = useMutation({
    mutationFn: (data: CreateSupplierInvoiceRequest) => backend.purchasing.createSupplierInvoice(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-invoices"] });
      setShowInvoiceForm(false);
      resetInvoiceForm();
      toast({
        title: "Success",
        description: "Supplier invoice created successfully",
      });
    },
    onError: (error) => {
      console.error("Error creating supplier invoice:", error);
      toast({
        title: "Error",
        description: "Failed to create supplier invoice",
        variant: "destructive",
      });
    },
  });

  const payInvoiceMutation = useMutation({
    mutationFn: (data: PaySupplierInvoiceRequest) => backend.purchasing.paySupplierInvoice(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-invoices"] });
      setShowPaymentDialog(false);
      setSelectedInvoice(null);
      toast({
        title: "Success",
        description: "Payment recorded successfully",
      });
    },
    onError: (error) => {
      console.error("Error recording payment:", error);
      toast({
        title: "Error",
        description: "Failed to record payment",
        variant: "destructive",
      });
    },
  });

  const resetSupplierForm = () => {
    setSupplierData({
      name: "",
      email: "",
      phone: "",
      address: "",
      taxId: "",
      paymentTerms: "",
    });
  };

  const resetOrderForm = () => {
    setOrderData({
      supplierId: 0,
      orderDate: new Date(),
      expectedDate: undefined,
      items: [],
      taxRate: 0,
      discountAmount: 0,
      notes: "",
    });
  };

  const resetInvoiceForm = () => {
    setInvoiceData({
      supplier_id: 0,
      invoice_number: "",
      invoice_date: new Date().toISOString().split('T')[0],
      due_date: new Date().toISOString().split('T')[0],
      items: [],
      tax_amount: 0,
      notes: "",
    });
    setCurrentInvoiceItem({
      description: "",
      quantity: 1,
      unit_price: 0,
    });
  };

  const handleSupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSupplier) {
      updateSupplierMutation.mutate({
        id: editingSupplier.id,
        ...supplierData,
      });
    } else {
      createSupplierMutation.mutate(supplierData);
    }
  };

  const handleOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderData.items.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one item to the order",
        variant: "destructive",
      });
      return;
    }
    createOrderMutation.mutate(orderData);
  };

  const handleEditSupplier = (supplier: any) => {
    setEditingSupplier(supplier);
    setSupplierData({
      name: supplier.name,
      email: supplier.email || "",
      phone: supplier.phone || "",
      address: supplier.address || "",
      taxId: supplier.taxId || "",
      paymentTerms: supplier.paymentTerms || "",
    });
    setShowSupplierForm(true);
  };

  const handleDeleteSupplier = (id: number) => {
    if (confirm("Are you sure you want to delete this supplier?")) {
      deleteSupplierMutation.mutate(id);
    }
  };

  const handleDeleteOrder = (id: number) => {
    if (confirm("Are you sure you want to delete this purchase order?")) {
      deleteOrderMutation.mutate(id);
    }
  };

  const handleUpdateOrderStatus = (order: any, status: string) => {
    updateOrderMutation.mutate({
      id: order.id,
      status: status as "draft" | "sent" | "confirmed" | "received" | "cancelled",
    });
  };

  const addItemToOrder = () => {
    if (!currentItem.productId || currentItem.quantity <= 0) {
      toast({
        title: "Error",
        description: "Please select a product and enter a valid quantity",
        variant: "destructive",
      });
      return;
    }

    setOrderData({
      ...orderData,
      items: [...orderData.items, { ...currentItem }],
    });

    setCurrentItem({
      productId: 0,
      productSku: "",
      productName: "",
      quantity: 1,
      unitPrice: 0,
      discountAmount: 0,
    });
  };

  const removeItemFromOrder = (index: number) => {
    setOrderData({
      ...orderData,
      items: orderData.items.filter((_, i) => i !== index),
    });
  };

  const handleProductSelect = (productId: string) => {
    const product = products?.products.find(p => p.id === parseInt(productId));
    if (product) {
      setCurrentItem({
        ...currentItem,
        productId: product.id,
        productSku: product.sku,
        productName: product.name,
        unitPrice: product.costPrice,
      });
    }
  };

  const handleInvoiceProductSelect = (productId: string) => {
    const product = products?.products.find(p => p.id === parseInt(productId));
    if (product) {
      setCurrentInvoiceItem({
        ...currentInvoiceItem,
        product_id: product.id,
        description: product.name,
        unit_price: product.costPrice,
      });
    }
  };

  const handleInvoiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (invoiceData.items.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one item to the invoice",
        variant: "destructive",
      });
      return;
    }
    createInvoiceMutation.mutate(invoiceData);
  };

  const addInvoiceItem = () => {
    if (!currentInvoiceItem.description || currentInvoiceItem.quantity <= 0) {
      toast({
        title: "Error",
        description: "Please enter item description and valid quantity",
        variant: "destructive",
      });
      return;
    }
    setInvoiceData({
      ...invoiceData,
      items: [...invoiceData.items, { ...currentInvoiceItem }],
    });
    setCurrentInvoiceItem({
      description: "",
      quantity: 1,
      unit_price: 0,
    });
  };

  const removeInvoiceItem = (index: number) => {
    setInvoiceData({
      ...invoiceData,
      items: invoiceData.items.filter((_, i) => i !== index),
    });
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    payInvoiceMutation.mutate(paymentData);
  };

  const openPaymentDialog = (invoice: any) => {
    setSelectedInvoice(invoice);
    setPaymentData({
      id: invoice.id,
      payment_date: new Date().toISOString().split('T')[0],
      amount: invoice.balance_due,
      payment_method: "cash",
      reference_number: "",
      notes: "",
    });
    setShowPaymentDialog(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      draft: "secondary",
      sent: "outline",
      confirmed: "default",
      received: "default",
      cancelled: "destructive",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Purchasing Management</h1>
        <p className="text-gray-600">Manage suppliers and purchase orders</p>
      </div>

      <Tabs defaultValue="orders" className="space-y-4">
        <TabsList>
          <TabsTrigger value="orders">Purchase Orders</TabsTrigger>
          <TabsTrigger value="invoices">Supplier Invoices</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Purchase Orders</h2>
            <Button onClick={() => { setShowOrderForm(true); resetOrderForm(); }}>
              <Plus className="mr-2 h-4 w-4" />
              Create Order
            </Button>
          </div>

          {showOrderForm && (
            <Card>
              <CardHeader>
                <CardTitle>Create New Purchase Order</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleOrderSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="supplier">Supplier *</Label>
                      <Select
                        value={orderData.supplierId.toString()}
                        onValueChange={(value) => setOrderData({ ...orderData, supplierId: parseInt(value) })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select supplier" />
                        </SelectTrigger>
                        <SelectContent>
                          {suppliers?.suppliers.map((supplier) => (
                            <SelectItem key={supplier.id} value={supplier.id.toString()}>
                              {supplier.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="orderDate">Order Date *</Label>
                      <Input
                        id="orderDate"
                        type="date"
                        value={orderData.orderDate.toISOString().split('T')[0]}
                        onChange={(e) => setOrderData({ ...orderData, orderDate: new Date(e.target.value) })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="expectedDate">Expected Date</Label>
                      <Input
                        id="expectedDate"
                        type="date"
                        value={orderData.expectedDate?.toISOString().split('T')[0] || ""}
                        onChange={(e) => setOrderData({ ...orderData, expectedDate: e.target.value ? new Date(e.target.value) : undefined })}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Order Items</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border rounded">
                      <div>
                        <Label>Product</Label>
                        <Select
                          value={currentItem.productId.toString()}
                          onValueChange={handleProductSelect}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                          <SelectContent>
                            {products?.products.map((product) => (
                              <SelectItem key={product.id} value={product.id.toString()}>
                                {product.name} ({product.sku})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Quantity</Label>
                        <Input
                          type="number"
                          min="1"
                          value={currentItem.quantity}
                          onChange={(e) => setCurrentItem({ ...currentItem, quantity: parseInt(e.target.value) || 1 })}
                        />
                      </div>
                      <div>
                        <Label>Unit Price</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={currentItem.unitPrice}
                          onChange={(e) => setCurrentItem({ ...currentItem, unitPrice: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                      <div>
                        <Label>Discount</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={currentItem.discountAmount}
                          onChange={(e) => setCurrentItem({ ...currentItem, discountAmount: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="flex items-end">
                        <Button type="button" onClick={addItemToOrder}>
                          Add Item
                        </Button>
                      </div>
                    </div>

                    {orderData.items.length > 0 && (
                      <div className="space-y-2">
                        {orderData.items.map((item, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded">
                            <div className="flex-1">
                              <span className="font-medium">{item.productName}</span>
                              <span className="text-sm text-gray-500 ml-2">({item.productSku})</span>
                            </div>
                            <div className="text-sm">
                              {item.quantity} × {formatCurrency(item.unitPrice)} = {formatCurrency((item.quantity * item.unitPrice) - (item.discountAmount || 0))}
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItemFromOrder(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="taxRate">Tax Rate (%)</Label>
                      <Input
                        id="taxRate"
                        type="number"
                        step="0.01"
                        value={orderData.taxRate}
                        onChange={(e) => setOrderData({ ...orderData, taxRate: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="discountAmount">Discount Amount</Label>
                      <Input
                        id="discountAmount"
                        type="number"
                        step="0.01"
                        value={orderData.discountAmount}
                        onChange={(e) => setOrderData({ ...orderData, discountAmount: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={orderData.notes}
                      onChange={(e) => setOrderData({ ...orderData, notes: e.target.value })}
                    />
                  </div>

                  <div className="flex space-x-2">
                    <Button type="submit" disabled={createOrderMutation.isPending}>
                      {createOrderMutation.isPending ? "Creating..." : "Create Order"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowOrderForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 gap-4">
            {purchaseOrders?.orders.map((order) => (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center">
                        <Truck className="mr-2 h-5 w-5" />
                        {order.orderNumber}
                      </CardTitle>
                      <p className="text-sm text-gray-600">Supplier: {order.supplierName}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(order.status)}
                      <Select
                        value={order.status}
                        onValueChange={(value) => handleUpdateOrderStatus(order, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="sent">Sent</SelectItem>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="received">Received</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteOrder(order.id)}
                        disabled={deleteOrderMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Order Date:</span>
                      <p>{new Date(order.orderDate).toLocaleDateString()}</p>
                    </div>
                    {order.expectedDate && (
                      <div>
                        <span className="font-medium">Expected Date:</span>
                        <p>{new Date(order.expectedDate).toLocaleDateString()}</p>
                      </div>
                    )}
                    <div>
                      <span className="font-medium">Subtotal:</span>
                      <p>Rp. {order.subtotal.toFixed(2)}</p>
                    </div>
                    <div>
                      <span className="font-medium">Total:</span>
                      <p className="font-bold">Rp. {order.totalAmount.toFixed(2)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Supplier Invoices</h2>
            <Button onClick={() => { setShowInvoiceForm(true); resetInvoiceForm(); }}>
              <Plus className="mr-2 h-4 w-4" />
              Create Invoice
            </Button>
          </div>

          {showInvoiceForm && (
            <Card>
              <CardHeader>
                <CardTitle>Create Supplier Invoice</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleInvoiceSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Supplier *</Label>
                      <Select
                        value={invoiceData.supplier_id.toString()}
                        onValueChange={(value) => setInvoiceData({ ...invoiceData, supplier_id: parseInt(value) })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select supplier" />
                        </SelectTrigger>
                        <SelectContent>
                          {suppliers?.suppliers.map((supplier) => (
                            <SelectItem key={supplier.id} value={supplier.id.toString()}>
                              {supplier.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Invoice Number *</Label>
                      <Input
                        value={invoiceData.invoice_number}
                        onChange={(e) => setInvoiceData({ ...invoiceData, invoice_number: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label>Invoice Date *</Label>
                      <Input
                        type="date"
                        value={invoiceData.invoice_date}
                        onChange={(e) => setInvoiceData({ ...invoiceData, invoice_date: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label>Due Date *</Label>
                      <Input
                        type="date"
                        value={invoiceData.due_date}
                        onChange={(e) => setInvoiceData({ ...invoiceData, due_date: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Invoice Items</h3>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border rounded">
                      <div>
                        <Label>Product (Optional)</Label>
                        <Select
                          value={currentInvoiceItem.product_id?.toString() || ""}
                          onValueChange={handleInvoiceProductSelect}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                          <SelectContent>
                            {products?.products.map((product) => (
                              <SelectItem key={product.id} value={product.id.toString()}>
                                {product.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Description *</Label>
                        <Input
                          value={currentInvoiceItem.description}
                          onChange={(e) => setCurrentInvoiceItem({ ...currentInvoiceItem, description: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Quantity *</Label>
                        <Input
                          type="number"
                          min="1"
                          step="0.01"
                          value={currentInvoiceItem.quantity}
                          onChange={(e) => setCurrentInvoiceItem({ ...currentInvoiceItem, quantity: parseFloat(e.target.value) || 1 })}
                        />
                      </div>
                      <div>
                        <Label>Unit Price *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={currentInvoiceItem.unit_price}
                          onChange={(e) => setCurrentInvoiceItem({ ...currentInvoiceItem, unit_price: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="flex items-end">
                        <Button type="button" onClick={addInvoiceItem}>
                          Add Item
                        </Button>
                      </div>
                    </div>

                    {invoiceData.items.length > 0 && (
                      <div className="space-y-2">
                        {invoiceData.items.map((item, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded">
                            <div className="flex-1">
                              <span className="font-medium">{item.description}</span>
                            </div>
                            <div className="text-sm">
                              {item.quantity} × Rp. {item.unit_price.toFixed(2)} = Rp. {(item.quantity * item.unit_price).toFixed(2)}
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeInvoiceItem(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Tax Amount</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={invoiceData.tax_amount}
                        onChange={(e) => setInvoiceData({ ...invoiceData, tax_amount: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Notes</Label>
                    <Textarea
                      value={invoiceData.notes}
                      onChange={(e) => setInvoiceData({ ...invoiceData, notes: e.target.value })}
                    />
                  </div>

                  <div className="flex space-x-2">
                    <Button type="submit" disabled={createInvoiceMutation.isPending}>
                      {createInvoiceMutation.isPending ? "Creating..." : "Create Invoice"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowInvoiceForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 gap-4">
            {supplierInvoices?.invoices.map((invoice) => (
              <Card key={invoice.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center">
                        <FileText className="mr-2 h-5 w-5" />
                        {invoice.invoice_number}
                      </CardTitle>
                      <p className="text-sm text-gray-600">Supplier: {invoice.supplier_name}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={invoice.status === 'paid' ? 'default' : invoice.status === 'partial' ? 'secondary' : 'destructive'}>
                        {invoice.status}
                      </Badge>
                      {invoice.balance_due > 0 && (
                        <Button
                          size="sm"
                          onClick={() => openPaymentDialog(invoice)}
                        >
                          <DollarSign className="mr-1 h-4 w-4" />
                          Pay
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                    <div>
                      <span className="font-medium">Invoice Date:</span>
                      <p>{new Date(invoice.invoice_date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <span className="font-medium">Due Date:</span>
                      <p>{new Date(invoice.due_date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <span className="font-medium">Total:</span>
                      <p>Rp. {invoice.total_amount.toFixed(2)}</p>
                    </div>
                    <div>
                      <span className="font-medium">Balance Due:</span>
                      <p className="font-bold text-red-600">Rp. {invoice.balance_due.toFixed(2)}</p>
                    </div>
                  </div>

                  {invoice.items.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Items:</h4>
                      <div className="space-y-1">
                        {invoice.items.map((item) => (
                          <div key={item.id} className="text-sm flex justify-between">
                            <span>{item.description}</span>
                            <span>{item.quantity} × Rp. {item.unit_price.toFixed(2)} = Rp. {item.total_price.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {invoice.payments.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Payments:</h4>
                      <div className="space-y-1">
                        {invoice.payments.map((payment) => (
                          <div key={payment.id} className="text-sm flex justify-between">
                            <span>{new Date(payment.payment_date).toLocaleDateString()} - {payment.payment_method}</span>
                            <span className="font-medium">Rp. {payment.amount.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Payment</DialogTitle>
            </DialogHeader>
            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div>
                <Label>Invoice Number</Label>
                <Input value={selectedInvoice?.invoice_number || ""} disabled />
              </div>
              <div>
                <Label>Balance Due</Label>
                <Input value={`Rp. ${selectedInvoice?.balance_due.toFixed(2) || 0}`} disabled />
              </div>
              <div>
                <Label>Payment Date *</Label>
                <Input
                  type="date"
                  value={paymentData.payment_date}
                  onChange={(e) => setPaymentData({ ...paymentData, payment_date: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Amount *</Label>
                <Input
                  type="number"
                  step="0.01"
                  max={selectedInvoice?.balance_due || 0}
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData({ ...paymentData, amount: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
              <div>
                <Label>Payment Method *</Label>
                <Select
                  value={paymentData.payment_method}
                  onValueChange={(value) => setPaymentData({ ...paymentData, payment_method: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                    <SelectItem value="credit_card">Credit Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Reference Number</Label>
                <Input
                  value={paymentData.reference_number}
                  onChange={(e) => setPaymentData({ ...paymentData, reference_number: e.target.value })}
                />
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea
                  value={paymentData.notes}
                  onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                />
              </div>
              <div className="flex space-x-2">
                <Button type="submit" disabled={payInvoiceMutation.isPending}>
                  {payInvoiceMutation.isPending ? "Processing..." : "Record Payment"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowPaymentDialog(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <TabsContent value="suppliers" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Suppliers</h2>
            <Button onClick={() => { setShowSupplierForm(true); setEditingSupplier(null); resetSupplierForm(); }}>
              <Plus className="mr-2 h-4 w-4" />
              Add Supplier
            </Button>
          </div>

          {showSupplierForm && (
            <Card>
              <CardHeader>
                <CardTitle>{editingSupplier ? "Edit Supplier" : "Create New Supplier"}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSupplierSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="supplierName">Supplier Name *</Label>
                      <Input
                        id="supplierName"
                        value={supplierData.name}
                        onChange={(e) => setSupplierData({ ...supplierData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="supplierEmail">Email</Label>
                      <Input
                        id="supplierEmail"
                        type="email"
                        value={supplierData.email}
                        onChange={(e) => setSupplierData({ ...supplierData, email: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="supplierPhone">Phone</Label>
                      <Input
                        id="supplierPhone"
                        value={supplierData.phone}
                        onChange={(e) => setSupplierData({ ...supplierData, phone: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="supplierTaxId">Tax ID</Label>
                      <Input
                        id="supplierTaxId"
                        value={supplierData.taxId}
                        onChange={(e) => setSupplierData({ ...supplierData, taxId: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="paymentTerms">Payment Terms</Label>
                      <Input
                        id="paymentTerms"
                        value={supplierData.paymentTerms}
                        onChange={(e) => setSupplierData({ ...supplierData, paymentTerms: e.target.value })}
                        placeholder="e.g., Net 30"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="supplierAddress">Address</Label>
                    <Textarea
                      id="supplierAddress"
                      value={supplierData.address}
                      onChange={(e) => setSupplierData({ ...supplierData, address: e.target.value })}
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button type="submit" disabled={createSupplierMutation.isPending || updateSupplierMutation.isPending}>
                      {(createSupplierMutation.isPending || updateSupplierMutation.isPending) ? "Saving..." : (editingSupplier ? "Update Supplier" : "Create Supplier")}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => { setShowSupplierForm(false); setEditingSupplier(null); }}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {suppliers?.suppliers.map((supplier) => (
              <Card key={supplier.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="flex items-center">
                      <Building className="mr-2 h-5 w-5" />
                      {supplier.name}
                    </CardTitle>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditSupplier(supplier)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteSupplier(supplier.id)}
                        disabled={deleteSupplierMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {supplier.email && (
                    <p className="text-sm">
                      <strong>Email:</strong> {supplier.email}
                    </p>
                  )}
                  {supplier.phone && (
                    <p className="text-sm">
                      <strong>Phone:</strong> {supplier.phone}
                    </p>
                  )}
                  {supplier.address && (
                    <p className="text-sm">
                      <strong>Address:</strong> {supplier.address}
                    </p>
                  )}
                  {supplier.paymentTerms && (
                    <p className="text-sm">
                      <strong>Payment Terms:</strong> {supplier.paymentTerms}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
