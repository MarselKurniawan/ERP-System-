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
import { Plus, Users, ShoppingCart, Trash2, Edit, FileText } from "lucide-react";
import backend from "~backend/client";
import type { CreateCustomerRequest } from "~backend/sales/create_customer";
import type { CreateSalesOrderRequest, OrderItem } from "~backend/sales/create_order";
import type { UpdateCustomerRequest } from "~backend/sales/update_customer";
import type { UpdateSalesOrderRequest } from "~backend/sales/update_order";

export default function SalesPage() {
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [customerData, setCustomerData] = useState<CreateCustomerRequest>({
    name: "",
    email: "",
    phone: "",
    address: "",
    taxId: "",
    creditLimit: 0,
  });
  const [orderData, setOrderData] = useState<CreateSalesOrderRequest>({
    customerId: 0,
    orderDate: new Date(),
    dueDate: undefined,
    items: [],
    taxRate: 0,
    discountAmount: 0,
    notes: "",
  });
  const [currentItem, setCurrentItem] = useState<OrderItem>({
    productId: 0,
    productSku: "",
    productName: "",
    quantity: 1,
    unitPrice: 0,
    discountAmount: 0,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: customers } = useQuery({
    queryKey: ["customers"],
    queryFn: () => backend.sales.listCustomers(),
  });

  const { data: salesOrders } = useQuery({
    queryKey: ["sales-orders"],
    queryFn: () => backend.sales.listOrders(),
  });

  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: () => backend.inventory.listProducts(),
  });

  const createCustomerMutation = useMutation({
    mutationFn: (data: CreateCustomerRequest) => backend.sales.createCustomer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setShowCustomerForm(false);
      resetCustomerForm();
      toast({
        title: "Success",
        description: "Customer created successfully",
      });
    },
    onError: (error) => {
      console.error("Error creating customer:", error);
      toast({
        title: "Error",
        description: "Failed to create customer",
        variant: "destructive",
      });
    },
  });

  const updateCustomerMutation = useMutation({
    mutationFn: (data: UpdateCustomerRequest) => backend.sales.updateCustomer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setEditingCustomer(null);
      setShowCustomerForm(false);
      resetCustomerForm();
      toast({
        title: "Success",
        description: "Customer updated successfully",
      });
    },
    onError: (error) => {
      console.error("Error updating customer:", error);
      toast({
        title: "Error",
        description: "Failed to update customer",
        variant: "destructive",
      });
    },
  });

  const deleteCustomerMutation = useMutation({
    mutationFn: (id: number) => backend.sales.deleteCustomer({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast({
        title: "Success",
        description: "Customer deleted successfully",
      });
    },
    onError: (error) => {
      console.error("Error deleting customer:", error);
      toast({
        title: "Error",
        description: "Failed to delete customer",
        variant: "destructive",
      });
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: (data: CreateSalesOrderRequest) => backend.sales.createOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales-orders"] });
      setShowOrderForm(false);
      resetOrderForm();
      toast({
        title: "Success",
        description: "Sales order created successfully",
      });
    },
    onError: (error) => {
      console.error("Error creating sales order:", error);
      toast({
        title: "Error",
        description: "Failed to create sales order",
        variant: "destructive",
      });
    },
  });

  const updateOrderMutation = useMutation({
    mutationFn: (data: UpdateSalesOrderRequest) => backend.sales.updateOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales-orders"] });
      setEditingOrder(null);
      toast({
        title: "Success",
        description: "Sales order updated successfully",
      });
    },
    onError: (error) => {
      console.error("Error updating sales order:", error);
      toast({
        title: "Error",
        description: "Failed to update sales order",
        variant: "destructive",
      });
    },
  });

  const deleteOrderMutation = useMutation({
    mutationFn: (id: number) => backend.sales.deleteOrder({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales-orders"] });
      toast({
        title: "Success",
        description: "Sales order deleted successfully",
      });
    },
    onError: (error) => {
      console.error("Error deleting sales order:", error);
      toast({
        title: "Error",
        description: "Failed to delete sales order",
        variant: "destructive",
      });
    },
  });

  const generateInvoiceMutation = useMutation({
    mutationFn: (salesOrderId: number) => backend.sales.generateInvoice({ salesOrderId }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["sales-orders"] });
      toast({
        title: "Success",
        description: `Invoice ${response.invoiceNumber} generated successfully`,
      });
    },
    onError: (error) => {
      console.error("Error generating invoice:", error);
      toast({
        title: "Error",
        description: "Failed to generate invoice",
        variant: "destructive",
      });
    },
  });

  const resetCustomerForm = () => {
    setCustomerData({
      name: "",
      email: "",
      phone: "",
      address: "",
      taxId: "",
      creditLimit: 0,
    });
  };

  const resetOrderForm = () => {
    setOrderData({
      customerId: 0,
      orderDate: new Date(),
      dueDate: undefined,
      items: [],
      taxRate: 0,
      discountAmount: 0,
      notes: "",
    });
  };

  const handleCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCustomer) {
      updateCustomerMutation.mutate({
        id: editingCustomer.id,
        ...customerData,
      });
    } else {
      createCustomerMutation.mutate(customerData);
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

  const handleEditCustomer = (customer: any) => {
    setEditingCustomer(customer);
    setCustomerData({
      name: customer.name,
      email: customer.email || "",
      phone: customer.phone || "",
      address: customer.address || "",
      taxId: customer.taxId || "",
      creditLimit: customer.creditLimit,
    });
    setShowCustomerForm(true);
  };

  const handleDeleteCustomer = (id: number) => {
    if (confirm("Are you sure you want to delete this customer?")) {
      deleteCustomerMutation.mutate(id);
    }
  };

  const handleDeleteOrder = (id: number) => {
    if (confirm("Are you sure you want to delete this sales order?")) {
      deleteOrderMutation.mutate(id);
    }
  };

  const handleUpdateOrderStatus = (order: any, status: string) => {
    updateOrderMutation.mutate({
      id: order.id,
      status: status as "draft" | "confirmed" | "shipped" | "delivered" | "cancelled",
    });
  };

  const handleGenerateInvoice = (salesOrderId: number) => {
    if (confirm("Are you sure you want to generate an invoice for this order?")) {
      generateInvoiceMutation.mutate(salesOrderId);
    }
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
        unitPrice: product.unitPrice,
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      draft: "secondary",
      confirmed: "default",
      shipped: "outline",
      delivered: "default",
      cancelled: "destructive",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Sales Management</h1>
        <p className="text-gray-600">Manage customers and sales orders</p>
      </div>

      <Tabs defaultValue="orders" className="space-y-4">
        <TabsList>
          <TabsTrigger value="orders">Sales Orders</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Sales Orders</h2>
            <Button onClick={() => { setShowOrderForm(true); resetOrderForm(); }}>
              <Plus className="mr-2 h-4 w-4" />
              Create Order
            </Button>
          </div>

          {showOrderForm && (
            <Card>
              <CardHeader>
                <CardTitle>Create New Sales Order</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleOrderSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="customer">Customer *</Label>
                      <Select
                        value={orderData.customerId.toString()}
                        onValueChange={(value) => setOrderData({ ...orderData, customerId: parseInt(value) })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select customer" />
                        </SelectTrigger>
                        <SelectContent>
                          {customers?.customers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id.toString()}>
                              {customer.name}
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
                      <Label htmlFor="dueDate">Due Date</Label>
                      <Input
                        id="dueDate"
                        type="date"
                        value={orderData.dueDate?.toISOString().split('T')[0] || ""}
                        onChange={(e) => setOrderData({ ...orderData, dueDate: e.target.value ? new Date(e.target.value) : undefined })}
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
                              {item.quantity} × ${item.unitPrice.toFixed(2)} = ${((item.quantity * item.unitPrice) - item.discountAmount).toFixed(2)}
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
            {salesOrders?.orders.map((order) => (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center">
                        <ShoppingCart className="mr-2 h-5 w-5" />
                        {order.orderNumber}
                      </CardTitle>
                      <p className="text-sm text-gray-600">Customer: {order.customerName}</p>
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
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="shipped">Shipped</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      {order.status === 'confirmed' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleGenerateInvoice(order.id)}
                          disabled={generateInvoiceMutation.isPending}
                          title="Generate Invoice"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      )}
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
                    {order.dueDate && (
                      <div>
                        <span className="font-medium">Due Date:</span>
                        <p>{new Date(order.dueDate).toLocaleDateString()}</p>
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

        <TabsContent value="customers" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Customers</h2>
            <Button onClick={() => { setShowCustomerForm(true); setEditingCustomer(null); resetCustomerForm(); }}>
              <Plus className="mr-2 h-4 w-4" />
              Add Customer
            </Button>
          </div>

          {showCustomerForm && (
            <Card>
              <CardHeader>
                <CardTitle>{editingCustomer ? "Edit Customer" : "Create New Customer"}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCustomerSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="customerName">Customer Name *</Label>
                      <Input
                        id="customerName"
                        value={customerData.name}
                        onChange={(e) => setCustomerData({ ...customerData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="customerEmail">Email</Label>
                      <Input
                        id="customerEmail"
                        type="email"
                        value={customerData.email}
                        onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="customerPhone">Phone</Label>
                      <Input
                        id="customerPhone"
                        value={customerData.phone}
                        onChange={(e) => setCustomerData({ ...customerData, phone: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="customerTaxId">Tax ID</Label>
                      <Input
                        id="customerTaxId"
                        value={customerData.taxId}
                        onChange={(e) => setCustomerData({ ...customerData, taxId: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="creditLimit">Credit Limit</Label>
                      <Input
                        id="creditLimit"
                        type="number"
                        step="0.01"
                        value={customerData.creditLimit}
                        onChange={(e) => setCustomerData({ ...customerData, creditLimit: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="customerAddress">Address</Label>
                    <Textarea
                      id="customerAddress"
                      value={customerData.address}
                      onChange={(e) => setCustomerData({ ...customerData, address: e.target.value })}
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button type="submit" disabled={createCustomerMutation.isPending || updateCustomerMutation.isPending}>
                      {(createCustomerMutation.isPending || updateCustomerMutation.isPending) ? "Saving..." : (editingCustomer ? "Update Customer" : "Create Customer")}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => { setShowCustomerForm(false); setEditingCustomer(null); }}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {customers?.customers.map((customer) => (
              <Card key={customer.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="flex items-center">
                      <Users className="mr-2 h-5 w-5" />
                      {customer.name}
                    </CardTitle>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditCustomer(customer)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteCustomer(customer.id)}
                        disabled={deleteCustomerMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {customer.email && (
                    <p className="text-sm">
                      <strong>Email:</strong> {customer.email}
                    </p>
                  )}
                  {customer.phone && (
                    <p className="text-sm">
                      <strong>Phone:</strong> {customer.phone}
                    </p>
                  )}
                  {customer.address && (
                    <p className="text-sm">
                      <strong>Address:</strong> {customer.address}
                    </p>
                  )}
                  <p className="text-sm">
                    <strong>Credit Limit:</strong> ${customer.creditLimit.toFixed(2)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
