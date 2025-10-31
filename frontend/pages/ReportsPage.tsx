import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { FileText, Calculator, BarChart3, TrendingUp, Building, Clock, Wallet, AlertTriangle } from "lucide-react";
import backend from "~backend/client";
import { useToast } from "@/components/ui/use-toast";

interface ProfitLossData {
  pendapatanUsaha: Array<{ accountCode: string; accountName: string; amount: number }>;
  totalPendapatanUsaha: number;
  bebanPokokPendapatan: Array<{ accountCode: string; accountName: string; amount: number }>;
  totalBebanPokok: number;
  labaKotor: number;
  bebanOperasional: Array<{ accountCode: string; accountName: string; amount: number }>;
  totalBebanOperasional: number;
  labaOperasional: number;
  pendapatanLain: Array<{ accountCode: string; accountName: string; amount: number }>;
  totalPendapatanLain: number;
  bebanLain: Array<{ accountCode: string; accountName: string; amount: number }>;
  totalBebanLain: number;
  totalPendapatanBebanLain: number;
  labaRugiBersih: number;
  periode: { startDate: string; endDate: string };
}

interface BalanceSheetData {
  assets: {
    currentAssets: Array<{ accountCode: string; accountName: string; amount: number }>;
    totalCurrentAssets: number;
    fixedAssets: Array<{ accountCode: string; accountName: string; amount: number }>;
    depreciation: Array<{ accountCode: string; accountName: string; amount: number }>;
    totalFixedAssets: number;
    totalAssets: number;
  };
  liabilities: {
    shortTerm: Array<{ accountCode: string; accountName: string; amount: number }>;
    longTerm: Array<{ accountCode: string; accountName: string; amount: number }>;
    totalLiabilities: number;
  };
  equity: {
    capital: Array<{ accountCode: string; accountName: string; amount: number }>;
    openingBalance: Array<{ accountCode: string; accountName: string; amount: number }>;
    currentYearEarnings: number;
    priorYearEarnings: number;
    totalEquity: number;
  };
  totalPassiva: number;
  asOfDate: string;
}

interface AgingReceivablesData {
  items: Array<{
    invoiceNumber: string;
    customerName: string;
    invoiceDate: string;
    dueDate: string;
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
    daysPastDue: number;
    paymentTerms: number;
    agingCategory: string;
  }>;
  summary: {
    current: number;
    days30: number;
    days60: number;
    days90: number;
    over90: number;
    totalReceivables: number;
  };
  asOfDate: string;
}

interface CashBankData {
  cash: Array<{ accountCode: string; accountName: string; balance: number; category: string }>;
  bank: Array<{ accountCode: string; accountName: string; balance: number; category: string }>;
  giro: Array<{ accountCode: string; accountName: string; balance: number; category: string }>;
  other: Array<{ accountCode: string; accountName: string; balance: number; category: string }>;
  summary: {
    totalCash: number;
    totalBank: number;
    totalGiro: number;
    totalOther: number;
    grandTotal: number;
  };
  asOfDate: string;
}

interface AgingPayablesData {
  entries: Array<{
    supplier_id: number;
    supplier_name: string;
    invoice_id: number;
    invoice_number: string;
    invoice_date: string;
    due_date: string;
    total_amount: number;
    paid_amount: number;
    balance_due: number;
    days_overdue: number;
    current: number;
    days_1_30: number;
    days_31_60: number;
    days_61_90: number;
    days_over_90: number;
  }>;
  summary: {
    total_current: number;
    total_1_30: number;
    total_31_60: number;
    total_61_90: number;
    total_over_90: number;
    grand_total: number;
  };
  as_of_date: string;
}

export default function ReportsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [profitLossData, setProfitLossData] = useState<ProfitLossData | null>(null);
  const [balanceSheetData, setBalanceSheetData] = useState<BalanceSheetData | null>(null);
  const [generalLedgerData, setGeneralLedgerData] = useState<any>(null);
  const [salesReportData, setSalesReportData] = useState<any>(null);
  const [agingReceivablesData, setAgingReceivablesData] = useState<AgingReceivablesData | null>(null);
  const [cashBankData, setCashBankData] = useState<CashBankData | null>(null);
  const [agingPayablesData, setAgingPayablesData] = useState<AgingPayablesData | null>(null);
  
  const [pnlStartDate, setPnlStartDate] = useState('');
  const [pnlEndDate, setPnlEndDate] = useState('');
  const [balanceSheetDate, setBalanceSheetDate] = useState('');
  const [glStartDate, setGlStartDate] = useState('');
  const [glEndDate, setGlEndDate] = useState('');
  const [salesStartDate, setSalesStartDate] = useState('');
  const [salesEndDate, setSalesEndDate] = useState('');
  const [agingDate, setAgingDate] = useState('');
  const [cashBankDate, setCashBankDate] = useState('');
  const [agingPayablesDate, setAgingPayablesDate] = useState('');

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

  const generateAgingReceivablesReport = async () => {
    setIsLoading(true);
    try {
      const data = await backend.sales.agingReceivablesReport({
        asOfDate: agingDate || undefined
      });
      setAgingReceivablesData(data);
      toast({ title: "Success", description: "Aging receivables report generated successfully" });
    } catch (error) {
      console.error('Error generating aging receivables report:', error);
      toast({ title: "Error", description: "Failed to generate aging receivables report", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const generateCashBankReport = async () => {
    setIsLoading(true);
    try {
      const data = await backend.accounting.cashBankReport({
        asOfDate: cashBankDate || undefined
      });
      setCashBankData(data);
      toast({ title: "Success", description: "Cash/Bank report generated successfully" });
    } catch (error) {
      console.error('Error generating cash/bank report:', error);
      toast({ title: "Error", description: "Failed to generate cash/bank report", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const generateAgingPayablesReport = async () => {
    setIsLoading(true);
    try {
      const data = await backend.purchasing.agingPayablesReport();
      setAgingPayablesData(data);
      toast({ title: "Success", description: "Aging payables report generated successfully" });
    } catch (error) {
      console.error('Error generating aging payables report:', error);
      toast({ title: "Error", description: "Failed to generate aging payables report", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const renderProfitLossReport = () => {
    if (!profitLossData) return null;

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold">LAPORAN LABA RUGI</h2>
          <p className="text-sm text-muted-foreground">
            Periode: {profitLossData.periode.startDate} s/d {profitLossData.periode.endDate}
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg">PENDAPATAN USAHA</h3>
            {profitLossData.pendapatanUsaha.map(item => (
              <div key={item.accountCode} className="flex justify-between py-1 px-4">
                <span>{item.accountCode} - {item.accountName}</span>
                <span>{formatCurrency(item.amount)}</span>
              </div>
            ))}
            <div className="flex justify-between font-semibold py-1 px-4 border-t mt-2">
              <span>Total Pendapatan Usaha</span>
              <span>{formatCurrency(profitLossData.totalPendapatanUsaha)}</span>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-lg">BEBAN POKOK PENDAPATAN</h3>
            {profitLossData.bebanPokokPendapatan.map(item => (
              <div key={item.accountCode} className="flex justify-between py-1 px-4">
                <span>{item.accountCode} - {item.accountName}</span>
                <span>({formatCurrency(item.amount)})</span>
              </div>
            ))}
            <div className="flex justify-between font-semibold py-1 px-4 border-t mt-2">
              <span>Total Beban Pokok Pendapatan</span>
              <span>({formatCurrency(profitLossData.totalBebanPokok)})</span>
            </div>
          </div>

          <Separator className="border-2" />
          <div className="flex justify-between font-bold text-lg px-4">
            <span>LABA KOTOR</span>
            <span className={profitLossData.labaKotor >= 0 ? "text-green-600" : "text-red-600"}>
              {formatCurrency(profitLossData.labaKotor)}
            </span>
          </div>

          <div>
            <h3 className="font-semibold text-lg">BEBAN OPERASIONAL</h3>
            {profitLossData.bebanOperasional.map(item => (
              <div key={item.accountCode} className="flex justify-between py-1 px-4">
                <span>{item.accountCode} - {item.accountName}</span>
                <span>({formatCurrency(item.amount)})</span>
              </div>
            ))}
            <div className="flex justify-between font-semibold py-1 px-4 border-t mt-2">
              <span>Total Beban Operasional</span>
              <span>({formatCurrency(profitLossData.totalBebanOperasional)})</span>
            </div>
          </div>

          <Separator className="border-2" />
          <div className="flex justify-between font-bold text-lg px-4">
            <span>LABA OPERASIONAL</span>
            <span className={profitLossData.labaOperasional >= 0 ? "text-green-600" : "text-red-600"}>
              {formatCurrency(profitLossData.labaOperasional)}
            </span>
          </div>

          <div>
            <h3 className="font-semibold text-lg">PENDAPATAN LAIN</h3>
            {profitLossData.pendapatanLain.map(item => (
              <div key={item.accountCode} className="flex justify-between py-1 px-4">
                <span>{item.accountCode} - {item.accountName}</span>
                <span>{formatCurrency(item.amount)}</span>
              </div>
            ))}
            <div className="flex justify-between font-semibold py-1 px-4 border-t mt-2">
              <span>Total Pendapatan Lain</span>
              <span>{formatCurrency(profitLossData.totalPendapatanLain)}</span>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-lg">BEBAN LAIN</h3>
            {profitLossData.bebanLain.map(item => (
              <div key={item.accountCode} className="flex justify-between py-1 px-4">
                <span>{item.accountCode} - {item.accountName}</span>
                <span>({formatCurrency(item.amount)})</span>
              </div>
            ))}
            <div className="flex justify-between font-semibold py-1 px-4 border-t mt-2">
              <span>Total Beban Lain</span>
              <span>({formatCurrency(profitLossData.totalBebanLain)})</span>
            </div>
          </div>

          <Separator />
          <div className="flex justify-between font-semibold px-4">
            <span>Total Pendapatan & Beban Lain</span>
            <span className={profitLossData.totalPendapatanBebanLain >= 0 ? "text-green-600" : "text-red-600"}>
              {formatCurrency(profitLossData.totalPendapatanBebanLain)}
            </span>
          </div>

          <Separator className="border-4" />
          <div className="flex justify-between font-bold text-xl px-4 bg-blue-50 py-3 rounded">
            <span>LABA RUGI BERSIH</span>
            <span className={profitLossData.labaRugiBersih >= 0 ? "text-green-600" : "text-red-600"}>
              {formatCurrency(profitLossData.labaRugiBersih)}
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
              <div className="flex justify-between font-semibold py-1 px-4 border-t mt-2">
                <span>Total Aktiva Lancar</span>
                <span>{formatCurrency(balanceSheetData.assets.totalCurrentAssets)}</span>
              </div>
              
              <h4 className="font-semibold pt-4">Aktiva Tetap</h4>
              {balanceSheetData.assets.fixedAssets.map(item => (
                <div key={item.accountCode} className="flex justify-between py-1 px-4">
                  <span>{item.accountCode} - {item.accountName}</span>
                  <span>{formatCurrency(item.amount)}</span>
                </div>
              ))}
              {balanceSheetData.assets.depreciation.map(item => (
                <div key={item.accountCode} className="flex justify-between py-1 px-4">
                  <span>{item.accountCode} - {item.accountName}</span>
                  <span>({formatCurrency(Math.abs(item.amount))})</span>
                </div>
              ))}
              <div className="flex justify-between font-semibold py-1 px-4 border-t mt-2">
                <span>Total Aktiva Tetap</span>
                <span>{formatCurrency(balanceSheetData.assets.totalFixedAssets)}</span>
              </div>
              
              <Separator className="border-2" />
              <div className="flex justify-between font-bold">
                <span>TOTAL AKTIVA</span>
                <span>{formatCurrency(balanceSheetData.assets.totalAssets)}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-4">PASIVA</h3>
            
            <div className="space-y-2">
              <h4 className="font-semibold">Hutang Jangka Pendek</h4>
              {balanceSheetData.liabilities.shortTerm.map(item => (
                <div key={item.accountCode} className="flex justify-between py-1 px-4">
                  <span>{item.accountCode} - {item.accountName}</span>
                  <span>{formatCurrency(item.amount)}</span>
                </div>
              ))}
              
              <h4 className="font-semibold pt-4">Hutang Jangka Panjang</h4>
              {balanceSheetData.liabilities.longTerm.map(item => (
                <div key={item.accountCode} className="flex justify-between py-1 px-4">
                  <span>{item.accountCode} - {item.accountName}</span>
                  <span>{formatCurrency(item.amount)}</span>
                </div>
              ))}
              
              <div className="flex justify-between font-semibold py-1 px-4 border-t mt-2">
                <span>Total Hutang</span>
                <span>{formatCurrency(balanceSheetData.liabilities.totalLiabilities)}</span>
              </div>

              <h4 className="font-semibold pt-4">Modal Pemilik</h4>
              {balanceSheetData.equity.capital.map(item => (
                <div key={item.accountCode} className="flex justify-between py-1 px-4">
                  <span>{item.accountCode} - {item.accountName}</span>
                  <span>{formatCurrency(item.amount)}</span>
                </div>
              ))}
              {balanceSheetData.equity.openingBalance.map(item => (
                <div key={item.accountCode} className="flex justify-between py-1 px-4">
                  <span>{item.accountCode} - {item.accountName}</span>
                  <span>{formatCurrency(item.amount)}</span>
                </div>
              ))}
              {balanceSheetData.equity.priorYearEarnings !== 0 && (
                <div className="flex justify-between py-1 px-4">
                  <span>Laba Tahun Sebelumnya</span>
                  <span className={balanceSheetData.equity.priorYearEarnings >= 0 ? "text-green-600" : "text-red-600"}>
                    {formatCurrency(balanceSheetData.equity.priorYearEarnings)}
                  </span>
                </div>
              )}
              {balanceSheetData.equity.currentYearEarnings !== 0 && (
                <div className="flex justify-between py-1 px-4">
                  <span>Laba Periode Berjalan</span>
                  <span className={balanceSheetData.equity.currentYearEarnings >= 0 ? "text-green-600" : "text-red-600"}>
                    {formatCurrency(balanceSheetData.equity.currentYearEarnings)}
                  </span>
                </div>
              )}
              
              <div className="flex justify-between font-semibold py-1 px-4 border-t mt-2">
                <span>Total Modal Pemilik</span>
                <span>{formatCurrency(balanceSheetData.equity.totalEquity)}</span>
              </div>
              
              <Separator className="border-2" />
              <div className="flex justify-between font-bold">
                <span>TOTAL PASIVA</span>
                <span>{formatCurrency(balanceSheetData.totalPassiva)}</span>
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
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="profit-loss" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Laba Rugi
          </TabsTrigger>
          <TabsTrigger value="balance-sheet" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Neraca
          </TabsTrigger>
          <TabsTrigger value="general-ledger" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Buku Besar
          </TabsTrigger>
          <TabsTrigger value="sales-report" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Penjualan
          </TabsTrigger>
          <TabsTrigger value="aging-receivables" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Umur Piutang
          </TabsTrigger>
          <TabsTrigger value="cash-bank" className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Kas/Bank
          </TabsTrigger>
          <TabsTrigger value="aging-payables" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Umur Hutang
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profit-loss">
          <Card>
            <CardHeader>
              <CardTitle>Laporan Laba Rugi</CardTitle>
              <CardDescription>Generate laporan laba rugi untuk periode tertentu</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pnl-start-date">Tanggal Mulai</Label>
                  <Input
                    id="pnl-start-date"
                    type="date"
                    value={pnlStartDate}
                    onChange={(e) => setPnlStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="pnl-end-date">Tanggal Akhir</Label>
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
                {isLoading ? "Generating..." : "Generate Laporan Laba Rugi"}
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
              <CardTitle>Neraca</CardTitle>
              <CardDescription>Generate neraca per tanggal tertentu</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="balance-sheet-date">Per Tanggal</Label>
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
                {isLoading ? "Generating..." : "Generate Neraca"}
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
              <CardTitle>Buku Besar</CardTitle>
              <CardDescription>Generate buku besar untuk semua akun</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="gl-start-date">Tanggal Mulai</Label>
                  <Input
                    id="gl-start-date"
                    type="date"
                    value={glStartDate}
                    onChange={(e) => setGlStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="gl-end-date">Tanggal Akhir</Label>
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
                {isLoading ? "Generating..." : "Generate Buku Besar"}
              </Button>
              
              {generalLedgerData && (
                <div className="mt-6 p-4 border rounded-lg max-h-96 overflow-auto">
                  <h3 className="font-bold mb-4">Buku Besar</h3>
                  {generalLedgerData.accounts.map((account: any) => (
                    <div key={account.accountCode} className="mb-6">
                      <h4 className="font-semibold">{account.accountCode} - {account.accountName}</h4>
                      <p className="text-sm text-muted-foreground">Saldo Awal: {formatCurrency(account.openingBalance)}</p>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Tanggal</TableHead>
                            <TableHead>Deskripsi</TableHead>
                            <TableHead>Debit</TableHead>
                            <TableHead>Kredit</TableHead>
                            <TableHead>Saldo</TableHead>
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
                      <p className="text-sm font-semibold mt-2">Saldo Akhir: {formatCurrency(account.closingBalance)}</p>
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
              <CardTitle>Laporan Penjualan</CardTitle>
              <CardDescription>Generate laporan penjualan untuk periode tertentu</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sales-start-date">Tanggal Mulai</Label>
                  <Input
                    id="sales-start-date"
                    type="date"
                    value={salesStartDate}
                    onChange={(e) => setSalesStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="sales-end-date">Tanggal Akhir</Label>
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
                {isLoading ? "Generating..." : "Generate Laporan Penjualan"}
              </Button>
              
              {salesReportData && (
                <div className="mt-6 p-4 border rounded-lg">
                  <h3 className="font-bold mb-4">Ringkasan Penjualan</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                    <div className="p-3 bg-blue-50 rounded">
                      <p className="text-sm text-muted-foreground">Total Orders</p>
                      <p className="font-semibold">{salesReportData.summary.totalOrders}</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded">
                      <p className="text-sm text-muted-foreground">Total Penjualan</p>
                      <p className="font-semibold">{formatCurrency(salesReportData.summary.totalSales)}</p>
                    </div>
                    <div className="p-3 bg-yellow-50 rounded">
                      <p className="text-sm text-muted-foreground">Belum Dibayar</p>
                      <p className="font-semibold">{formatCurrency(salesReportData.summary.totalOutstanding)}</p>
                    </div>
                  </div>
                  
                  <h4 className="font-semibold mb-2">Penjualan per Customer</h4>
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

        <TabsContent value="aging-receivables">
          <Card>
            <CardHeader>
              <CardTitle>Laporan Umur Piutang</CardTitle>
              <CardDescription>Laporan piutang yang belum dibayar berdasarkan jangka waktu</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="aging-date">Per Tanggal (opsional)</Label>
                <Input
                  id="aging-date"
                  type="date"
                  value={agingDate}
                  onChange={(e) => setAgingDate(e.target.value)}
                />
              </div>
              <Button 
                onClick={generateAgingReceivablesReport} 
                disabled={isLoading}
                className="w-full"
              >
                <Clock className="mr-2 h-4 w-4" />
                {isLoading ? "Generating..." : "Generate Laporan Umur Piutang"}
              </Button>
              
              {agingReceivablesData && (
                <div className="mt-6 p-4 border rounded-lg">
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold">LAPORAN UMUR PIUTANG</h2>
                    <p className="text-sm text-muted-foreground">
                      Per Tanggal: {agingReceivablesData.asOfDate}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                    <div className="p-3 bg-green-50 rounded">
                      <p className="text-sm text-muted-foreground">Current</p>
                      <p className="font-semibold">{formatCurrency(agingReceivablesData.summary.current)}</p>
                    </div>
                    <div className="p-3 bg-yellow-50 rounded">
                      <p className="text-sm text-muted-foreground">1-30 hari</p>
                      <p className="font-semibold">{formatCurrency(agingReceivablesData.summary.days30)}</p>
                    </div>
                    <div className="p-3 bg-orange-50 rounded">
                      <p className="text-sm text-muted-foreground">31-60 hari</p>
                      <p className="font-semibold">{formatCurrency(agingReceivablesData.summary.days60)}</p>
                    </div>
                    <div className="p-3 bg-red-50 rounded">
                      <p className="text-sm text-muted-foreground">61-90 hari</p>
                      <p className="font-semibold">{formatCurrency(agingReceivablesData.summary.days90)}</p>
                    </div>
                    <div className="p-3 bg-red-100 rounded">
                      <p className="text-sm text-muted-foreground">&gt;90 hari</p>
                      <p className="font-semibold">{formatCurrency(agingReceivablesData.summary.over90)}</p>
                    </div>
                  </div>

                  <div className="mb-4 p-4 bg-blue-50 rounded">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total Piutang</span>
                      <span>{formatCurrency(agingReceivablesData.summary.totalReceivables)}</span>
                    </div>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Tgl Invoice</TableHead>
                        <TableHead>Tgl Jatuh Tempo</TableHead>
                        <TableHead>Termin</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Terbayar</TableHead>
                        <TableHead>Sisa</TableHead>
                        <TableHead>Hari Lewat</TableHead>
                        <TableHead>Kategori</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {agingReceivablesData.items.map((item) => (
                        <TableRow key={item.invoiceNumber}>
                          <TableCell>{item.invoiceNumber}</TableCell>
                          <TableCell>{item.customerName}</TableCell>
                          <TableCell>{item.invoiceDate}</TableCell>
                          <TableCell>{item.dueDate}</TableCell>
                          <TableCell>{item.paymentTerms} hari</TableCell>
                          <TableCell>{formatCurrency(item.totalAmount)}</TableCell>
                          <TableCell>{formatCurrency(item.paidAmount)}</TableCell>
                          <TableCell className="font-semibold">{formatCurrency(item.remainingAmount)}</TableCell>
                          <TableCell className={item.daysPastDue > 0 ? "text-red-600 font-semibold" : ""}>
                            {item.daysPastDue}
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded text-xs ${
                              item.agingCategory === 'Current' ? 'bg-green-100 text-green-800' :
                              item.agingCategory === '1-30 days' ? 'bg-yellow-100 text-yellow-800' :
                              item.agingCategory === '31-60 days' ? 'bg-orange-100 text-orange-800' :
                              item.agingCategory === '61-90 days' ? 'bg-red-100 text-red-800' :
                              'bg-red-200 text-red-900'
                            }`}>
                              {item.agingCategory}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cash-bank">
          <Card>
            <CardHeader>
              <CardTitle>Laporan Kas & Bank</CardTitle>
              <CardDescription>Laporan saldo kas, bank, dan giro</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="cash-bank-date">Per Tanggal (opsional)</Label>
                <Input
                  id="cash-bank-date"
                  type="date"
                  value={cashBankDate}
                  onChange={(e) => setCashBankDate(e.target.value)}
                />
              </div>
              <Button 
                onClick={generateCashBankReport} 
                disabled={isLoading}
                className="w-full"
              >
                <Wallet className="mr-2 h-4 w-4" />
                {isLoading ? "Generating..." : "Generate Laporan Kas & Bank"}
              </Button>
              
              {cashBankData && (
                <div className="mt-6 p-4 border rounded-lg">
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold">LAPORAN KAS & BANK</h2>
                    <p className="text-sm text-muted-foreground">
                      Per Tanggal: {cashBankData.asOfDate}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="p-3 bg-green-50 rounded">
                      <p className="text-sm text-muted-foreground">Kas</p>
                      <p className="font-semibold">{formatCurrency(cashBankData.summary.totalCash)}</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded">
                      <p className="text-sm text-muted-foreground">Bank</p>
                      <p className="font-semibold">{formatCurrency(cashBankData.summary.totalBank)}</p>
                    </div>
                    <div className="p-3 bg-purple-50 rounded">
                      <p className="text-sm text-muted-foreground">Giro</p>
                      <p className="font-semibold">{formatCurrency(cashBankData.summary.totalGiro)}</p>
                    </div>
                    <div className="p-3 bg-yellow-50 rounded">
                      <p className="text-sm text-muted-foreground">Lainnya</p>
                      <p className="font-semibold">{formatCurrency(cashBankData.summary.totalOther)}</p>
                    </div>
                  </div>

                  <div className="mb-6 p-4 bg-blue-50 rounded">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total Keseluruhan</span>
                      <span>{formatCurrency(cashBankData.summary.grandTotal)}</span>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {cashBankData.cash.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-lg mb-2">Kas</h3>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Kode Akun</TableHead>
                              <TableHead>Nama Akun</TableHead>
                              <TableHead className="text-right">Saldo</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {cashBankData.cash.map((item) => (
                              <TableRow key={item.accountCode}>
                                <TableCell>{item.accountCode}</TableCell>
                                <TableCell>{item.accountName}</TableCell>
                                <TableCell className="text-right font-semibold">{formatCurrency(item.balance)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}

                    {cashBankData.bank.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-lg mb-2">Bank</h3>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Kode Akun</TableHead>
                              <TableHead>Nama Akun</TableHead>
                              <TableHead className="text-right">Saldo</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {cashBankData.bank.map((item) => (
                              <TableRow key={item.accountCode}>
                                <TableCell>{item.accountCode}</TableCell>
                                <TableCell>{item.accountName}</TableCell>
                                <TableCell className="text-right font-semibold">{formatCurrency(item.balance)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}

                    {cashBankData.giro.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-lg mb-2">Giro</h3>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Kode Akun</TableHead>
                              <TableHead>Nama Akun</TableHead>
                              <TableHead className="text-right">Saldo</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {cashBankData.giro.map((item) => (
                              <TableRow key={item.accountCode}>
                                <TableCell>{item.accountCode}</TableCell>
                                <TableCell>{item.accountName}</TableCell>
                                <TableCell className="text-right font-semibold">{formatCurrency(item.balance)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}

                    {cashBankData.other.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-lg mb-2">Lainnya</h3>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Kode Akun</TableHead>
                              <TableHead>Nama Akun</TableHead>
                              <TableHead className="text-right">Saldo</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {cashBankData.other.map((item) => (
                              <TableRow key={item.accountCode}>
                                <TableCell>{item.accountCode}</TableCell>
                                <TableCell>{item.accountName}</TableCell>
                                <TableCell className="text-right font-semibold">{formatCurrency(item.balance)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="aging-payables">
          <Card>
            <CardHeader>
              <CardTitle>Laporan Umur Hutang</CardTitle>
              <CardDescription>Laporan hutang supplier yang belum dibayar berdasarkan jangka waktu</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={generateAgingPayablesReport} 
                disabled={isLoading}
                className="w-full"
              >
                <AlertTriangle className="mr-2 h-4 w-4" />
                {isLoading ? "Generating..." : "Generate Laporan Umur Hutang"}
              </Button>
              
              {agingPayablesData && (
                <div className="mt-6 p-4 border rounded-lg">
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold">LAPORAN UMUR HUTANG</h2>
                    <p className="text-sm text-muted-foreground">
                      Per Tanggal: {agingPayablesData.as_of_date}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                    <div className="p-3 bg-green-50 rounded">
                      <p className="text-sm text-muted-foreground">Current</p>
                      <p className="font-semibold">{formatCurrency(agingPayablesData.summary.total_current)}</p>
                    </div>
                    <div className="p-3 bg-yellow-50 rounded">
                      <p className="text-sm text-muted-foreground">1-30 hari</p>
                      <p className="font-semibold">{formatCurrency(agingPayablesData.summary.total_1_30)}</p>
                    </div>
                    <div className="p-3 bg-orange-50 rounded">
                      <p className="text-sm text-muted-foreground">31-60 hari</p>
                      <p className="font-semibold">{formatCurrency(agingPayablesData.summary.total_31_60)}</p>
                    </div>
                    <div className="p-3 bg-red-50 rounded">
                      <p className="text-sm text-muted-foreground">61-90 hari</p>
                      <p className="font-semibold">{formatCurrency(agingPayablesData.summary.total_61_90)}</p>
                    </div>
                    <div className="p-3 bg-red-100 rounded">
                      <p className="text-sm text-muted-foreground">&gt;90 hari</p>
                      <p className="font-semibold">{formatCurrency(agingPayablesData.summary.total_over_90)}</p>
                    </div>
                  </div>

                  <div className="mb-4 p-4 bg-blue-50 rounded">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total Hutang</span>
                      <span>{formatCurrency(agingPayablesData.summary.grand_total)}</span>
                    </div>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice</TableHead>
                        <TableHead>Supplier</TableHead>
                        <TableHead>Tgl Invoice</TableHead>
                        <TableHead>Tgl Jatuh Tempo</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Terbayar</TableHead>
                        <TableHead>Sisa</TableHead>
                        <TableHead>Hari Lewat</TableHead>
                        <TableHead>Current</TableHead>
                        <TableHead>1-30</TableHead>
                        <TableHead>31-60</TableHead>
                        <TableHead>61-90</TableHead>
                        <TableHead>&gt;90</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {agingPayablesData.entries.map((entry) => (
                        <TableRow key={entry.invoice_id}>
                          <TableCell>{entry.invoice_number}</TableCell>
                          <TableCell>{entry.supplier_name}</TableCell>
                          <TableCell>{entry.invoice_date}</TableCell>
                          <TableCell>{entry.due_date}</TableCell>
                          <TableCell>{formatCurrency(entry.total_amount)}</TableCell>
                          <TableCell>{formatCurrency(entry.paid_amount)}</TableCell>
                          <TableCell className="font-semibold text-red-600">{formatCurrency(entry.balance_due)}</TableCell>
                          <TableCell className={entry.days_overdue > 0 ? "text-red-600 font-semibold" : ""}>
                            {entry.days_overdue}
                          </TableCell>
                          <TableCell>{entry.current > 0 ? formatCurrency(entry.current) : '-'}</TableCell>
                          <TableCell>{entry.days_1_30 > 0 ? formatCurrency(entry.days_1_30) : '-'}</TableCell>
                          <TableCell>{entry.days_31_60 > 0 ? formatCurrency(entry.days_31_60) : '-'}</TableCell>
                          <TableCell>{entry.days_61_90 > 0 ? formatCurrency(entry.days_61_90) : '-'}</TableCell>
                          <TableCell>{entry.days_over_90 > 0 ? formatCurrency(entry.days_over_90) : '-'}</TableCell>
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