import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { FileText, Download, Calculator, BarChart3, TrendingUp, Building } from "lucide-react";
import backend from "~backend/client";
import { useToast } from "@/components/ui/use-toast";

interface ProfitLossData {
  pendapatan: Array<{ accountCode: string; accountName: string; amount: number }>;
  hpp: Array<{ accountCode: string; accountName: string; amount: number }>;
  pendapatanBersih: number;
  biayaOperasional: Array<{ accountCode: string; accountName: string; amount: number }>;
  pendapatanOperasional: number;
  pendapatanLain: Array<{ accountCode: string; accountName: string; amount: number }>;
  bebanLain: Array<{ accountCode: string; accountName: string; amount: number }>;
  pendapatanLainLain: number;
  labaBersih: number;
  periode: { startDate: string; endDate: string };
}

interface BalanceSheetData {
  assets: {
    currentAssets: Array<{ accountCode: string; accountName: string; amount: number }>;
    fixedAssets: Array<{ accountCode: string; accountName: string; amount: number }>;
    totalAssets: number;
  };
  liabilities: {
    currentLiabilities: Array<{ accountCode: string; accountName: string; amount: number }>;
    longTermLiabilities: Array<{ accountCode: string; accountName: string; amount: number }>;
    totalLiabilities: number;
  };
  equity: {
    equityItems: Array<{ accountCode: string; accountName: string; amount: number }>;
    retainedEarnings: number;
    totalEquity: number;
  };
  asOfDate: string;
}

export default function ReportsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [profitLossData, setProfitLossData] = useState<ProfitLossData | null>(null);
  const [balanceSheetData, setBalanceSheetData] = useState<BalanceSheetData | null>(null);
  const [generalLedgerData, setGeneralLedgerData] = useState<any>(null);
  const [salesReportData, setSalesReportData] = useState<any>(null);
  
  const [pnlStartDate, setPnlStartDate] = useState('');
  const [pnlEndDate, setPnlEndDate] = useState('');
  const [balanceSheetDate, setBalanceSheetDate] = useState('');
  const [glStartDate, setGlStartDate] = useState('');
  const [glEndDate, setGlEndDate] = useState('');
  const [salesStartDate, setSalesStartDate] = useState('');
  const [salesEndDate, setSalesEndDate] = useState('');

  const { toast } = useToast();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const generateProfitLossReport = async () => {
    if (!pnlStartDate || !pnlEndDate) {
      toast({ title: "Error", description: "Please select start and end dates", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const data = await backend.accounting.profitLossReport({
        startDate: pnlStartDate,
        endDate: pnlEndDate
      });
      setProfitLossData(data);
      toast({ title: "Success", description: "P&L report generated successfully" });
    } catch (error) {
      console.error('Error generating P&L report:', error);
      toast({ title: "Error", description: "Failed to generate P&L report", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const generateBalanceSheetReport = async () => {
    if (!balanceSheetDate) {
      toast({ title: "Error", description: "Please select a date", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const data = await backend.accounting.balanceSheetReport({
        asOfDate: balanceSheetDate
      });
      setBalanceSheetData(data);
      toast({ title: "Success", description: "Balance sheet generated successfully" });
    } catch (error) {
      console.error('Error generating balance sheet:', error);
      toast({ title: "Error", description: "Failed to generate balance sheet", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const generateGeneralLedgerReport = async () => {
    if (!glStartDate || !glEndDate) {
      toast({ title: "Error", description: "Please select start and end dates", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const data = await backend.accounting.generalLedgerReport({
        startDate: glStartDate,
        endDate: glEndDate
      });
      setGeneralLedgerData(data);
      toast({ title: "Success", description: "General ledger generated successfully" });
    } catch (error) {
      console.error('Error generating general ledger:', error);
      toast({ title: "Error", description: "Failed to generate general ledger", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const generateSalesReport = async () => {
    if (!salesStartDate || !salesEndDate) {
      toast({ title: "Error", description: "Please select start and end dates", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const data = await backend.sales.salesReport({
        startDate: salesStartDate,
        endDate: salesEndDate
      });
      setSalesReportData(data);
      toast({ title: "Success", description: "Sales report generated successfully" });
    } catch (error) {
      console.error('Error generating sales report:', error);
      toast({ title: "Error", description: "Failed to generate sales report", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const renderProfitLossReport = () => {
    if (!profitLossData) return null;

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Laporan Laba Rugi</h2>
          <p className="text-sm text-muted-foreground">
            Periode: {profitLossData.periode.startDate} s/d {profitLossData.periode.endDate}
          </p>
        </div>

        <div className="space-y-4">
          {/* Pendapatan */}
          <div>
            <h3 className="font-semibold text-lg">4. PENDAPATAN</h3>
            {profitLossData.pendapatan.map(item => (
              <div key={item.accountCode} className="flex justify-between py-1 px-4">
                <span>{item.accountCode} - {item.accountName}</span>
                <span>{formatCurrency(item.amount)}</span>
              </div>
            ))}
          </div>

          {/* HPP */}
          <div>
            <h3 className="font-semibold text-lg">5. HARGA POKOK PENJUALAN</h3>
            {profitLossData.hpp.map(item => (
              <div key={item.accountCode} className="flex justify-between py-1 px-4">
                <span>{item.accountCode} - {item.accountName}</span>
                <span>({formatCurrency(item.amount)})</span>
              </div>
            ))}
          </div>

          <Separator />
          <div className="flex justify-between font-semibold">
            <span>PENDAPATAN BERSIH</span>
            <span>{formatCurrency(profitLossData.pendapatanBersih)}</span>
          </div>

          {/* Biaya Operasional */}
          <div>
            <h3 className="font-semibold text-lg">6. BIAYA OPERASIONAL</h3>
            {profitLossData.biayaOperasional.map(item => (
              <div key={item.accountCode} className="flex justify-between py-1 px-4">
                <span>{item.accountCode} - {item.accountName}</span>
                <span>({formatCurrency(item.amount)})</span>
              </div>
            ))}
          </div>

          <Separator />
          <div className="flex justify-between font-semibold">
            <span>PENDAPATAN OPERASIONAL</span>
            <span>{formatCurrency(profitLossData.pendapatanOperasional)}</span>
          </div>

          {/* Pendapatan Lain */}
          <div>
            <h3 className="font-semibold text-lg">7. PENDAPATAN LAIN-LAIN</h3>
            {profitLossData.pendapatanLain.map(item => (
              <div key={item.accountCode} className="flex justify-between py-1 px-4">
                <span>{item.accountCode} - {item.accountName}</span>
                <span>{formatCurrency(item.amount)}</span>
              </div>
            ))}
          </div>

          {/* Beban Lain */}
          <div>
            <h3 className="font-semibold text-lg">8. BEBAN LAIN-LAIN</h3>
            {profitLossData.bebanLain.map(item => (
              <div key={item.accountCode} className="flex justify-between py-1 px-4">
                <span>{item.accountCode} - {item.accountName}</span>
                <span>({formatCurrency(item.amount)})</span>
              </div>
            ))}
          </div>

          <Separator />
          <div className="flex justify-between font-semibold">
            <span>PENDAPATAN LAIN-LAIN BERSIH</span>
            <span>{formatCurrency(profitLossData.pendapatanLainLain)}</span>
          </div>

          <Separator className="border-2" />
          <div className="flex justify-between font-bold text-lg">
            <span>LABA BERSIH</span>
            <span className={profitLossData.labaBersih >= 0 ? "text-green-600" : "text-red-600"}>
              {formatCurrency(profitLossData.labaBersih)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderBalanceSheetReport = () => {
    if (!balanceSheetData) return null;

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold">NERACA</h2>
          <p className="text-sm text-muted-foreground">
            Per Tanggal: {balanceSheetData.asOfDate}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Assets */}
          <div>
            <h3 className="font-bold text-lg mb-4">AKTIVA</h3>
            
            <div className="space-y-2">
              <h4 className="font-semibold">Aktiva Lancar</h4>
              {balanceSheetData.assets.currentAssets.map(item => (
                <div key={item.accountCode} className="flex justify-between py-1 px-4">
                  <span>{item.accountCode} - {item.accountName}</span>
                  <span>{formatCurrency(item.amount)}</span>
                </div>
              ))}
              
              <h4 className="font-semibold pt-4">Aktiva Tetap</h4>
              {balanceSheetData.assets.fixedAssets.map(item => (
                <div key={item.accountCode} className="flex justify-between py-1 px-4">
                  <span>{item.accountCode} - {item.accountName}</span>
                  <span>{formatCurrency(item.amount)}</span>
                </div>
              ))}
              
              <Separator />
              <div className="flex justify-between font-bold">
                <span>TOTAL AKTIVA</span>
                <span>{formatCurrency(balanceSheetData.assets.totalAssets)}</span>
              </div>
            </div>
          </div>

          {/* Liabilities & Equity */}
          <div>
            <h3 className="font-bold text-lg mb-4">PASIVA</h3>
            
            <div className="space-y-2">
              <h4 className="font-semibold">Kewajiban Lancar</h4>
              {balanceSheetData.liabilities.currentLiabilities.map(item => (
                <div key={item.accountCode} className="flex justify-between py-1 px-4">
                  <span>{item.accountCode} - {item.accountName}</span>
                  <span>{formatCurrency(item.amount)}</span>
                </div>
              ))}
              
              <h4 className="font-semibold pt-4">Kewajiban Jangka Panjang</h4>
              {balanceSheetData.liabilities.longTermLiabilities.map(item => (
                <div key={item.accountCode} className="flex justify-between py-1 px-4">
                  <span>{item.accountCode} - {item.accountName}</span>
                  <span>{formatCurrency(item.amount)}</span>
                </div>
              ))}
              
              <div className="flex justify-between font-semibold pt-2">
                <span>Total Kewajiban</span>
                <span>{formatCurrency(balanceSheetData.liabilities.totalLiabilities)}</span>
              </div>

              <h4 className="font-semibold pt-4">Modal</h4>
              {balanceSheetData.equity.equityItems.map(item => (
                <div key={item.accountCode} className="flex justify-between py-1 px-4">
                  <span>{item.accountCode} - {item.accountName}</span>
                  <span>{formatCurrency(item.amount)}</span>
                </div>
              ))}
              <div className="flex justify-between py-1 px-4">
                <span>Laba Ditahan</span>
                <span>{formatCurrency(balanceSheetData.equity.retainedEarnings)}</span>
              </div>
              
              <div className="flex justify-between font-semibold pt-2">
                <span>Total Modal</span>
                <span>{formatCurrency(balanceSheetData.equity.totalEquity)}</span>
              </div>
              
              <Separator />
              <div className="flex justify-between font-bold">
                <span>TOTAL PASIVA</span>
                <span>{formatCurrency(balanceSheetData.liabilities.totalLiabilities + balanceSheetData.equity.totalEquity)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-muted-foreground">Generate financial and business reports</p>
        </div>
      </div>

      <Tabs defaultValue="profit-loss" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profit-loss" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            P&L Report
          </TabsTrigger>
          <TabsTrigger value="balance-sheet" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Balance Sheet
          </TabsTrigger>
          <TabsTrigger value="general-ledger" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            General Ledger
          </TabsTrigger>
          <TabsTrigger value="sales-report" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Sales Report
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profit-loss">
          <Card>
            <CardHeader>
              <CardTitle>Profit & Loss Report</CardTitle>
              <CardDescription>Generate P&L report for a specific period</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pnl-start-date">Start Date</Label>
                  <Input
                    id="pnl-start-date"
                    type="date"
                    value={pnlStartDate}
                    onChange={(e) => setPnlStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="pnl-end-date">End Date</Label>
                  <Input
                    id="pnl-end-date"
                    type="date"
                    value={pnlEndDate}
                    onChange={(e) => setPnlEndDate(e.target.value)}
                  />
                </div>
              </div>
              <Button 
                onClick={generateProfitLossReport} 
                disabled={isLoading}
                className="w-full"
              >
                <Calculator className="mr-2 h-4 w-4" />
                {isLoading ? "Generating..." : "Generate P&L Report"}
              </Button>
              
              {profitLossData && (
                <div className="mt-6 p-4 border rounded-lg">
                  {renderProfitLossReport()}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="balance-sheet">
          <Card>
            <CardHeader>
              <CardTitle>Balance Sheet</CardTitle>
              <CardDescription>Generate balance sheet as of a specific date</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="balance-sheet-date">As of Date</Label>
                <Input
                  id="balance-sheet-date"
                  type="date"
                  value={balanceSheetDate}
                  onChange={(e) => setBalanceSheetDate(e.target.value)}
                />
              </div>
              <Button 
                onClick={generateBalanceSheetReport} 
                disabled={isLoading}
                className="w-full"
              >
                <Building className="mr-2 h-4 w-4" />
                {isLoading ? "Generating..." : "Generate Balance Sheet"}
              </Button>
              
              {balanceSheetData && (
                <div className="mt-6 p-4 border rounded-lg">
                  {renderBalanceSheetReport()}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="general-ledger">
          <Card>
            <CardHeader>
              <CardTitle>General Ledger</CardTitle>
              <CardDescription>Generate general ledger for all accounts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="gl-start-date">Start Date</Label>
                  <Input
                    id="gl-start-date"
                    type="date"
                    value={glStartDate}
                    onChange={(e) => setGlStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="gl-end-date">End Date</Label>
                  <Input
                    id="gl-end-date"
                    type="date"
                    value={glEndDate}
                    onChange={(e) => setGlEndDate(e.target.value)}
                  />
                </div>
              </div>
              <Button 
                onClick={generateGeneralLedgerReport} 
                disabled={isLoading}
                className="w-full"
              >
                <FileText className="mr-2 h-4 w-4" />
                {isLoading ? "Generating..." : "Generate General Ledger"}
              </Button>
              
              {generalLedgerData && (
                <div className="mt-6 p-4 border rounded-lg max-h-96 overflow-auto">
                  <h3 className="font-bold mb-4">General Ledger Report</h3>
                  {generalLedgerData.accounts.map((account: any) => (
                    <div key={account.accountCode} className="mb-6">
                      <h4 className="font-semibold">{account.accountCode} - {account.accountName}</h4>
                      <p className="text-sm text-muted-foreground">Opening Balance: {formatCurrency(account.openingBalance)}</p>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Debit</TableHead>
                            <TableHead>Credit</TableHead>
                            <TableHead>Balance</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {account.entries.map((entry: any, index: number) => (
                            <TableRow key={index}>
                              <TableCell>{entry.entryDate}</TableCell>
                              <TableCell>{entry.description}</TableCell>
                              <TableCell>{entry.debitAmount > 0 ? formatCurrency(entry.debitAmount) : ''}</TableCell>
                              <TableCell>{entry.creditAmount > 0 ? formatCurrency(entry.creditAmount) : ''}</TableCell>
                              <TableCell>{formatCurrency(entry.runningBalance)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      <p className="text-sm font-semibold mt-2">Closing Balance: {formatCurrency(account.closingBalance)}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sales-report">
          <Card>
            <CardHeader>
              <CardTitle>Sales Report</CardTitle>
              <CardDescription>Generate sales report for a specific period</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sales-start-date">Start Date</Label>
                  <Input
                    id="sales-start-date"
                    type="date"
                    value={salesStartDate}
                    onChange={(e) => setSalesStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="sales-end-date">End Date</Label>
                  <Input
                    id="sales-end-date"
                    type="date"
                    value={salesEndDate}
                    onChange={(e) => setSalesEndDate(e.target.value)}
                  />
                </div>
              </div>
              <Button 
                onClick={generateSalesReport} 
                disabled={isLoading}
                className="w-full"
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                {isLoading ? "Generating..." : "Generate Sales Report"}
              </Button>
              
              {salesReportData && (
                <div className="mt-6 p-4 border rounded-lg">
                  <h3 className="font-bold mb-4">Sales Report Summary</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                    <div className="p-3 bg-blue-50 rounded">
                      <p className="text-sm text-muted-foreground">Total Orders</p>
                      <p className="font-semibold">{salesReportData.summary.totalOrders}</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded">
                      <p className="text-sm text-muted-foreground">Total Sales</p>
                      <p className="font-semibold">{formatCurrency(salesReportData.summary.totalSales)}</p>
                    </div>
                    <div className="p-3 bg-yellow-50 rounded">
                      <p className="text-sm text-muted-foreground">Outstanding</p>
                      <p className="font-semibold">{formatCurrency(salesReportData.summary.totalOutstanding)}</p>
                    </div>
                  </div>
                  
                  <h4 className="font-semibold mb-2">Sales by Customer</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Orders</TableHead>
                        <TableHead>Total Amount</TableHead>
                        <TableHead>Outstanding</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {salesReportData.byCustomer.slice(0, 10).map((customer: any) => (
                        <TableRow key={customer.customerId}>
                          <TableCell>{customer.customerName}</TableCell>
                          <TableCell>{customer.totalOrders}</TableCell>
                          <TableCell>{formatCurrency(customer.totalAmount)}</TableCell>
                          <TableCell>{formatCurrency(customer.outstandingAmount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}