import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import SuppliersTab from '../components/purchasing/SuppliersTab';
import PurchaseOrdersTab from '../components/purchasing/PurchaseOrdersTab';
import SupplierInvoicesTab from '../components/purchasing/SupplierInvoicesTab';
import PurchasePaymentsTab from '../components/purchasing/PurchasePaymentsTab';

export default function PurchasingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Purchasing Management</h1>
        <p className="text-gray-600 mt-2">Manage suppliers, purchase orders, invoices, and payments</p>
      </div>

      <Tabs defaultValue="suppliers" className="space-y-6">
        <TabsList>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
          <TabsTrigger value="orders">Purchase Orders</TabsTrigger>
          <TabsTrigger value="invoices">Supplier Invoices</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="suppliers">
          <SuppliersTab />
        </TabsContent>

        <TabsContent value="orders">
          <PurchaseOrdersTab />
        </TabsContent>

        <TabsContent value="invoices">
          <SupplierInvoicesTab />
        </TabsContent>

        <TabsContent value="payments">
          <PurchasePaymentsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
