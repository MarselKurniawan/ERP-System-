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
import { Plus, Calculator, FileText, BarChart3, Trash2 } from "lucide-react";
import backend from "~backend/client";
import type { CreateAccountRequest } from "~backend/accounting/create_account";
import type { CreateJournalEntryRequest, JournalEntryLine } from "~backend/accounting/create_journal_entry";

export default function AccountingPage() {
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [showJournalForm, setShowJournalForm] = useState(false);
  const [showTrialBalance, setShowTrialBalance] = useState(false);
  const [accountData, setAccountData] = useState<CreateAccountRequest>({
    accountCode: "",
    accountName: "",
    accountType: "asset",
    parentAccountId: undefined,
  });
  const [journalData, setJournalData] = useState<CreateJournalEntryRequest>({
    entryDate: new Date(),
    description: "",
    referenceType: "",
    referenceId: undefined,
    lines: [],
  });
  const [currentLine, setCurrentLine] = useState<JournalEntryLine>({
    accountId: 0,
    description: "",
    debitAmount: 0,
    creditAmount: 0,
  });
  const [trialBalanceDate, setTrialBalanceDate] = useState(new Date());

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: accounts } = useQuery({
    queryKey: ["accounts"],
    queryFn: () => backend.accounting.listAccounts(),
  });

  const { data: journalEntries } = useQuery({
    queryKey: ["journal-entries"],
    queryFn: () => backend.accounting.listJournalEntries(),
  });

  const { data: trialBalance } = useQuery({
    queryKey: ["trial-balance", trialBalanceDate],
    queryFn: () => backend.accounting.trialBalance({ asOfDate: trialBalanceDate }),
    enabled: showTrialBalance,
  });

  const createAccountMutation = useMutation({
    mutationFn: (data: CreateAccountRequest) => backend.accounting.createAccount(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      setShowAccountForm(false);
      setAccountData({
        accountCode: "",
        accountName: "",
        accountType: "asset",
        parentAccountId: undefined,
      });
      toast({
        title: "Success",
        description: "Account created successfully",
      });
    },
    onError: (error) => {
      console.error("Error creating account:", error);
      toast({
        title: "Error",
        description: "Failed to create account",
        variant: "destructive",
      });
    },
  });

  const createJournalEntryMutation = useMutation({
    mutationFn: (data: CreateJournalEntryRequest) => backend.accounting.createJournalEntry(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal-entries"] });
      setShowJournalForm(false);
      setJournalData({
        entryDate: new Date(),
        description: "",
        referenceType: "",
        referenceId: undefined,
        lines: [],
      });
      toast({
        title: "Success",
        description: "Journal entry created successfully",
      });
    },
    onError: (error) => {
      console.error("Error creating journal entry:", error);
      toast({
        title: "Error",
        description: "Failed to create journal entry",
        variant: "destructive",
      });
    },
  });

  const handleAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createAccountMutation.mutate(accountData);
  };

  const handleJournalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (journalData.lines.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one journal entry line",
        variant: "destructive",
      });
      return;
    }

    const totalDebits = journalData.lines.reduce((sum, line) => sum + (line.debitAmount || 0), 0);
    const totalCredits = journalData.lines.reduce((sum, line) => sum + (line.creditAmount || 0), 0);

    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      toast({
        title: "Error",
        description: "Journal entry must be balanced - total debits must equal total credits",
        variant: "destructive",
      });
      return;
    }

    createJournalEntryMutation.mutate(journalData);
  };

  const addLineToJournal = () => {
    if (!currentLine.accountId || (currentLine.debitAmount === 0 && currentLine.creditAmount === 0)) {
      toast({
        title: "Error",
        description: "Please select an account and enter either a debit or credit amount",
        variant: "destructive",
      });
      return;
    }

    if (currentLine.debitAmount > 0 && currentLine.creditAmount > 0) {
      toast({
        title: "Error",
        description: "A line can have either a debit or credit amount, not both",
        variant: "destructive",
      });
      return;
    }

    setJournalData({
      ...journalData,
      lines: [...journalData.lines, { ...currentLine }],
    });

    setCurrentLine({
      accountId: 0,
      description: "",
      debitAmount: 0,
      creditAmount: 0,
    });
  };

  const removeLineFromJournal = (index: number) => {
    setJournalData({
      ...journalData,
      lines: journalData.lines.filter((_, i) => i !== index),
    });
  };

  const getAccountName = (accountId: number) => {
    const account = accounts?.accounts.find(a => a.id === accountId);
    return account ? `${account.accountCode} - ${account.accountName}` : "Unknown Account";
  };

  const getAccountTypeBadge = (type: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      asset: "default",
      liability: "secondary",
      equity: "outline",
      revenue: "default",
      expense: "destructive",
    };
    return <Badge variant={variants[type] || "default"}>{type}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Accounting</h1>
        <p className="text-gray-600">Manage chart of accounts and journal entries</p>
      </div>

      <Tabs defaultValue="accounts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="accounts">Chart of Accounts</TabsTrigger>
          <TabsTrigger value="journal">Journal Entries</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="accounts" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Chart of Accounts</h2>
            <Button onClick={() => setShowAccountForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Account
            </Button>
          </div>

          {showAccountForm && (
            <Card>
              <CardHeader>
                <CardTitle>Create New Account</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAccountSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="accountCode">Account Code *</Label>
                      <Input
                        id="accountCode"
                        value={accountData.accountCode}
                        onChange={(e) => setAccountData({ ...accountData, accountCode: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="accountName">Account Name *</Label>
                      <Input
                        id="accountName"
                        value={accountData.accountName}
                        onChange={(e) => setAccountData({ ...accountData, accountName: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="accountType">Account Type *</Label>
                      <Select
                        value={accountData.accountType}
                        onValueChange={(value: "asset" | "liability" | "equity" | "revenue" | "expense") => 
                          setAccountData({ ...accountData, accountType: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="asset">Asset</SelectItem>
                          <SelectItem value="liability">Liability</SelectItem>
                          <SelectItem value="equity">Equity</SelectItem>
                          <SelectItem value="revenue">Revenue</SelectItem>
                          <SelectItem value="expense">Expense</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="parentAccount">Parent Account</Label>
                      <Select
                        value={accountData.parentAccountId?.toString() || ""}
                        onValueChange={(value) => setAccountData({ ...accountData, parentAccountId: value ? parseInt(value) : undefined })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select parent account" />
                        </SelectTrigger>
                        <SelectContent>
                          {accounts?.accounts.map((account) => (
                            <SelectItem key={account.id} value={account.id.toString()}>
                              {account.accountCode} - {account.accountName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button type="submit" disabled={createAccountMutation.isPending}>
                      {createAccountMutation.isPending ? "Creating..." : "Create Account"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowAccountForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 gap-4">
            {accounts?.accounts.map((account) => (
              <Card key={account.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center">
                        <Calculator className="mr-2 h-5 w-5" />
                        {account.accountCode} - {account.accountName}
                      </CardTitle>
                    </div>
                    {getAccountTypeBadge(account.accountType)}
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="journal" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Journal Entries</h2>
            <Button onClick={() => setShowJournalForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Entry
            </Button>
          </div>

          {showJournalForm && (
            <Card>
              <CardHeader>
                <CardTitle>Create New Journal Entry</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleJournalSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="entryDate">Entry Date *</Label>
                      <Input
                        id="entryDate"
                        type="date"
                        value={journalData.entryDate.toISOString().split('T')[0]}
                        onChange={(e) => setJournalData({ ...journalData, entryDate: new Date(e.target.value) })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="referenceType">Reference Type</Label>
                      <Input
                        id="referenceType"
                        value={journalData.referenceType}
                        onChange={(e) => setJournalData({ ...journalData, referenceType: e.target.value })}
                        placeholder="e.g., Invoice, Payment"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={journalData.description}
                      onChange={(e) => setJournalData({ ...journalData, description: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Journal Entry Lines</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border rounded">
                      <div>
                        <Label>Account</Label>
                        <Select
                          value={currentLine.accountId.toString()}
                          onValueChange={(value) => setCurrentLine({ ...currentLine, accountId: parseInt(value) })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select account" />
                          </SelectTrigger>
                          <SelectContent>
                            {accounts?.accounts.map((account) => (
                              <SelectItem key={account.id} value={account.id.toString()}>
                                {account.accountCode} - {account.accountName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Input
                          value={currentLine.description}
                          onChange={(e) => setCurrentLine({ ...currentLine, description: e.target.value })}
                          placeholder="Line description"
                        />
                      </div>
                      <div>
                        <Label>Debit Amount</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={currentLine.debitAmount}
                          onChange={(e) => setCurrentLine({ ...currentLine, debitAmount: parseFloat(e.target.value) || 0, creditAmount: 0 })}
                        />
                      </div>
                      <div>
                        <Label>Credit Amount</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={currentLine.creditAmount}
                          onChange={(e) => setCurrentLine({ ...currentLine, creditAmount: parseFloat(e.target.value) || 0, debitAmount: 0 })}
                        />
                      </div>
                      <div className="flex items-end">
                        <Button type="button" onClick={addLineToJournal}>
                          Add Line
                        </Button>
                      </div>
                    </div>

                    {journalData.lines.length > 0 && (
                      <div className="space-y-2">
                        {journalData.lines.map((line, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded">
                            <div className="flex-1">
                              <span className="font-medium">{getAccountName(line.accountId)}</span>
                              {line.description && (
                                <span className="text-sm text-gray-500 ml-2">- {line.description}</span>
                              )}
                            </div>
                            <div className="text-sm">
                              {line.debitAmount > 0 ? (
                                <span className="text-green-600">Dr: ${line.debitAmount.toFixed(2)}</span>
                              ) : (
                                <span className="text-red-600">Cr: ${line.creditAmount.toFixed(2)}</span>
                              )}
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeLineFromJournal(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <div className="p-3 bg-gray-50 rounded">
                          <div className="flex justify-between text-sm font-medium">
                            <span>Total Debits: Rp. {journalData.lines.reduce((sum, line) => sum + (line.debitAmount || 0), 0).toFixed(2)}</span>
                            <span>Total Credits: Rp. {journalData.lines.reduce((sum, line) => sum + (line.creditAmount || 0), 0).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    <Button type="submit" disabled={createJournalEntryMutation.isPending}>
                      {createJournalEntryMutation.isPending ? "Creating..." : "Create Entry"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowJournalForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 gap-4">
            {journalEntries?.entries.map((entry) => (
              <Card key={entry.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center">
                        <FileText className="mr-2 h-5 w-5" />
                        {entry.entryNumber}
                      </CardTitle>
                      <p className="text-sm text-gray-600">{entry.description}</p>
                    </div>
                    <Badge variant={entry.status === 'posted' ? 'default' : 'secondary'}>
                      {entry.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Entry Date:</span>
                      <p>{new Date(entry.entryDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <span className="font-medium">Total Debit:</span>
                      <p>Rp. {entry.totalDebit.toFixed(2)}</p>
                    </div>
                    <div>
                      <span className="font-medium">Total Credit:</span>
                      <p>Rp. {entry.totalCredit.toFixed(2)}</p>
                    </div>
                    {entry.referenceType && (
                      <div>
                        <span className="font-medium">Reference:</span>
                        <p>{entry.referenceType}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Financial Reports</h2>
            <div className="flex space-x-2">
              <Input
                type="date"
                value={trialBalanceDate.toISOString().split('T')[0]}
                onChange={(e) => setTrialBalanceDate(new Date(e.target.value))}
              />
              <Button onClick={() => setShowTrialBalance(true)}>
                <BarChart3 className="mr-2 h-4 w-4" />
                Generate Trial Balance
              </Button>
            </div>
          </div>

          {showTrialBalance && trialBalance && (
            <Card>
              <CardHeader>
                <CardTitle>Trial Balance as of {trialBalance.asOfDate.toLocaleDateString()}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-2">
                    <div className="grid grid-cols-4 gap-4 p-3 bg-gray-100 font-medium text-sm">
                      <span>Account</span>
                      <span>Account Type</span>
                      <span className="text-right">Debit Balance</span>
                      <span className="text-right">Credit Balance</span>
                    </div>
                    {trialBalance.entries.map((entry) => (
                      <div key={entry.accountId} className="grid grid-cols-4 gap-4 p-3 border-b text-sm">
                        <span>{entry.accountCode} - {entry.accountName}</span>
                        <span>{getAccountTypeBadge(entry.accountType)}</span>
                        <span className="text-right">
                          {entry.debitBalance > 0 ? `Rp. ${entry.debitBalance.toFixed(2)}` : '-'}
                        </span>
                        <span className="text-right">
                          {entry.creditBalance > 0 ? `Rp. ${entry.creditBalance.toFixed(2)}` : '-'}
                        </span>
                      </div>
                    ))}
                    <div className="grid grid-cols-4 gap-4 p-3 bg-gray-100 font-bold text-sm border-t-2">
                      <span colSpan={2}>TOTALS</span>
                      <span></span>
                      <span className="text-right">Rp. {trialBalance.totalDebits.toFixed(2)}</span>
                      <span className="text-right">Rp. {trialBalance.totalCredits.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  {Math.abs(trialBalance.totalDebits - trialBalance.totalCredits) > 0.01 && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded">
                      <p className="text-red-800 font-medium">
                        Warning: Trial balance is not balanced! 
                        Difference: Rp. {Math.abs(trialBalance.totalDebits - trialBalance.totalCredits).toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
