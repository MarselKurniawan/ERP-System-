import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Eye, Edit } from "lucide-react";
import backend from "~backend/client";

export default function InvoicesPage() {
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editStatus, setEditStatus] = useState("");
  const [editPaidAmount, setEditPaidAmount] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: invoices, isLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: () => backend.sales.listInvoices(),
  });

  const updateInvoiceMutation = useMutation({
    mutationFn: (data: { id: number; status?: "draft" | "sent" | "paid" | "overdue" | "cancelled"; paidAmount?: number }) => 
      backend.sales.updateInvoice(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      setShowEditDialog(false);
      toast({
        title: "Success",
        description: "Invoice updated successfully",
      });
    },
    onError: (error) => {
      console.error("Error updating invoice:", error);
      toast({
        title: "Error",
        description: "Failed to update invoice",
        variant: "destructive",
      });
    },
  });

  const handleViewDetails = async (invoice: any) => {
    try {
      const details = await backend.sales.getInvoice({ id: invoice.id });
      setSelectedInvoice(details);
      setShowDetailDialog(true);
    } catch (error) {
      console.error("Error fetching invoice details:", error);
      toast({
        title: "Error",
        description: "Failed to load invoice details",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (invoice: any) => {
    setSelectedInvoice(invoice);
    setEditStatus(invoice.status);
    setEditPaidAmount(invoice.paidAmount.toString());
    setShowEditDialog(true);
  };

  const handleUpdateInvoice = () => {
    if (!selectedInvoice) return;

    updateInvoiceMutation.mutate({
      id: selectedInvoice.id,
      status: editStatus as "draft" | "sent" | "paid" | "overdue" | "cancelled",
      paidAmount: parseFloat(editPaidAmount),
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      draft: "secondary",
      sent: "default",
      paid: "default",
      overdue: "destructive",
      cancelled: "destructive",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID');
  };

  return (
    <div className="space-y-2">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Invoice Management</h1>
        <p className="text-gray-600">Manage and track all invoices</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5" />
            All Invoices
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading invoices...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Invoice Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Outstanding</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices?.invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                    <TableCell>{invoice.customerName}</TableCell>
                    <TableCell>{formatDate(invoice.invoiceDate)}</TableCell>
                    <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    <TableCell>{formatCurrency(invoice.totalAmount)}</TableCell>
                    <TableCell>{formatCurrency(invoice.paidAmount)}</TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(invoice.totalAmount - invoice.paidAmount)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(invoice)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(invoice)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invoice Details - {selectedInvoice?.invoiceNumber}</DialogTitle>
            <DialogDescription>
              Complete invoice information
            </DialogDescription>
          </DialogHeader>

          {selectedInvoice && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Customer Information</h3>
                  <p><strong>Name:</strong> {selectedInvoice.customerName}</p>
                  {selectedInvoice.customerEmail && <p><strong>Email:</strong> {selectedInvoice.customerEmail}</p>}
                  {selectedInvoice.customerPhone && <p><strong>Phone:</strong> {selectedInvoice.customerPhone}</p>}
                  {selectedInvoice.customerAddress && <p><strong>Address:</strong> {selectedInvoice.customerAddress}</p>}
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Invoice Information</h3>
                  <p><strong>Invoice Number:</strong> {selectedInvoice.invoiceNumber}</p>
                  {selectedInvoice.salesOrderNumber && (
                    <p><strong>Sales Order:</strong> {selectedInvoice.salesOrderNumber}</p>
                  )}
                  <p><strong>Invoice Date:</strong> {formatDate(selectedInvoice.invoiceDate)}</p>
                  <p><strong>Due Date:</strong> {formatDate(selectedInvoice.dueDate)}</p>
                  <p><strong>Status:</strong> {getStatusBadge(selectedInvoice.status)}</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Items</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedInvoice.items.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.productSku}</TableCell>
                        <TableCell>{item.productName}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                        <TableCell>{formatCurrency(item.discountAmount)}</TableCell>
                        <TableCell>{formatCurrency(item.lineTotal)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-end">
                  <div className="w-64 space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(selectedInvoice.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax:</span>
                      <span>{formatCurrency(selectedInvoice.taxAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Discount:</span>
                      <span>({formatCurrency(selectedInvoice.discountAmount)})</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>Total:</span>
                      <span>{formatCurrency(selectedInvoice.totalAmount)}</span>
                    </div>
                    <div className="flex justify-between text-green-600">
                      <span>Paid:</span>
                      <span>{formatCurrency(selectedInvoice.paidAmount)}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-red-600">
                      <span>Outstanding:</span>
                      <span>{formatCurrency(selectedInvoice.totalAmount - selectedInvoice.paidAmount)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {selectedInvoice.notes && (
                <div>
                  <h3 className="font-semibold mb-2">Notes</h3>
                  <p className="text-sm text-gray-600">{selectedInvoice.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Invoice - {selectedInvoice?.invoiceNumber}</DialogTitle>
            <DialogDescription>
              Update invoice status and payment information
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="paidAmount">Paid Amount</Label>
              <Input
                id="paidAmount"
                type="number"
                step="0.01"
                value={editPaidAmount}
                onChange={(e) => setEditPaidAmount(e.target.value)}
              />
              {selectedInvoice && (
                <p className="text-sm text-muted-foreground mt-1">
                  Total: {formatCurrency(selectedInvoice.totalAmount)}
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleUpdateInvoice} 
                disabled={updateInvoiceMutation.isPending}
                className="flex-1"
              >
                {updateInvoiceMutation.isPending ? "Updating..." : "Update Invoice"}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowEditDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}