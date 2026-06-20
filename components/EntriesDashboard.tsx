'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Empty } from '@/components/ui/empty'
import { Spinner } from '@/components/ui/spinner'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { 
  Trash2, Edit, Plus,
  Search, Download, Users, BarChart3,
  ArrowUpRight, ArrowDownRight, IndianRupee, FileSpreadsheet, LogOut
} from 'lucide-react'

import { 
  PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  LineChart, Line, CartesianGrid
} from 'recharts'

interface Entry {
  id: string
  person_name: string
  work_description: string
  entry_type: 'receivable' | 'payable'
  total_amount: number
  amount_paid: number
  balance_amount: number
  entry_date: string
  created_at: string
  updated_at: string
}

interface PersonSummary {
  name: string
  totalReceivable: number
  totalPayable: number
  balanceReceivable: number
  balancePayable: number
  netBalance: number
  entriesCount: number
}

const COLORS = {
  receivable: '#10b981',
  payable: '#f43f5e',
  paid: '#3b82f6',
  balance: '#f59e0b'
}

export default function EntriesDashboard() {
  const router = useRouter()
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showPersonDialog, setShowPersonDialog] = useState(false)
  const [selectedPerson, setSelectedPerson] = useState<PersonSummary | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<'all' | 'receivable' | 'payable'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeView, setActiveView] = useState<'entries' | 'analytics' | 'people'>('entries')

  const [formData, setFormData] = useState({
    person_name: '',
    work_description: '',
    entry_type: 'receivable' as 'receivable' | 'payable',
    total_amount: '',
    amount_paid: '',
    entry_date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    const checkAuthAndLoad = () => {
      const user = localStorage.getItem('currentUser')
      
      if (!user) {
        router.push('/auth/login')
        return
      }
      
      setUserEmail(user)
      loadEntries()
    }
    checkAuthAndLoad()
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('currentUser')
    router.push('/auth/login')
    router.refresh()
  }

  const loadEntries = () => {
    try {
      setLoading(true)
      const user = localStorage.getItem('currentUser')
      const stored = localStorage.getItem('entries_' + user)
      if (stored) {
        const data = JSON.parse(stored) as Entry[]
        data.sort((a, b) => new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime())
        setEntries(data)
      } else {
        setEntries([])
      }
    } catch (err) {
      toast.error('Failed to load entries')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = () => {
    if (!formData.person_name || !formData.work_description || !formData.total_amount) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      const totalAmount = parseFloat(formData.total_amount)
      const amountPaid = parseFloat(formData.amount_paid || '0')
      const balanceAmount = totalAmount - amountPaid
      const user = localStorage.getItem('currentUser')
      
      let currentEntries = [...entries]

      if (editingId) {
        const index = currentEntries.findIndex(e => e.id === editingId)
        if (index > -1) {
          currentEntries[index] = {
            ...currentEntries[index],
            person_name: formData.person_name,
            work_description: formData.work_description,
            entry_type: formData.entry_type,
            total_amount: totalAmount,
            amount_paid: amountPaid,
            balance_amount: balanceAmount,
            entry_date: formData.entry_date,
            updated_at: new Date().toISOString()
          }
        }
        toast.success('Entry updated successfully')
      } else {
        const newEntry: Entry = {
          id: Math.random().toString(36).substr(2, 9),
          person_name: formData.person_name,
          work_description: formData.work_description,
          entry_type: formData.entry_type,
          total_amount: totalAmount,
          amount_paid: amountPaid,
          balance_amount: balanceAmount,
          entry_date: formData.entry_date,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        currentEntries.push(newEntry)
        toast.success('Entry created successfully')
      }

      localStorage.setItem('entries_' + user, JSON.stringify(currentEntries))
      setEntries(currentEntries)
      resetForm()
      setShowDialog(false)
    } catch (err) {
      toast.error('Failed to save entry')
    }
  }

  const handleEdit = (entry: Entry) => {
    setEditingId(entry.id)
    setFormData({
      person_name: entry.person_name,
      work_description: entry.work_description,
      entry_type: entry.entry_type,
      total_amount: entry.total_amount.toString(),
      amount_paid: entry.amount_paid.toString(),
      entry_date: entry.entry_date,
    })
    setShowDialog(true)
  }

  const handleDelete = () => {
    if (!deleteId) return
    try {
      const user = localStorage.getItem('currentUser')
      const currentEntries = entries.filter(e => e.id !== deleteId)
      localStorage.setItem('entries_' + user, JSON.stringify(currentEntries))
      setEntries(currentEntries)
      
      toast.success('Entry deleted successfully')
      setShowDeleteDialog(false)
      setDeleteId(null)
    } catch (err) {
      toast.error('Failed to delete entry')
    }
  }

  const resetForm = () => {
    setFormData({
      person_name: '',
      work_description: '',
      entry_type: 'receivable',
      total_amount: '',
      amount_paid: '',
      entry_date: new Date().toISOString().split('T')[0],
    })
    setEditingId(null)
  }

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Date', 'Person', 'Work Description', 'Type', 'Total Amount', 'Amount Paid', 'Balance']
    const csvData = filteredEntries.map(entry => [
      entry.entry_date,
      entry.person_name,
      `"${entry.work_description.replace(/"/g, '""')}"`,
      entry.entry_type,
      entry.total_amount,
      entry.amount_paid,
      entry.balance_amount
    ])
    
    const csvContent = [headers.join(','), ...csvData.map(row => row.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `entries_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    toast.success('Exported to CSV successfully')
  }

  // Filtered entries based on search and type
  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      const matchesType = filterType === 'all' || entry.entry_type === filterType
      const matchesSearch = searchQuery === '' || 
        entry.person_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.work_description.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesType && matchesSearch
    })
  }, [entries, filterType, searchQuery])

  // Stats calculations
  const stats = useMemo(() => ({
    totalReceivable: entries.filter(e => e.entry_type === 'receivable').reduce((sum, e) => sum + e.total_amount, 0),
    totalPayable: entries.filter(e => e.entry_type === 'payable').reduce((sum, e) => sum + e.total_amount, 0),
    totalBalanceReceivable: entries.filter(e => e.entry_type === 'receivable').reduce((sum, e) => sum + e.balance_amount, 0),
    totalBalancePayable: entries.filter(e => e.entry_type === 'payable').reduce((sum, e) => sum + e.balance_amount, 0),
    totalPaidReceivable: entries.filter(e => e.entry_type === 'receivable').reduce((sum, e) => sum + e.amount_paid, 0),
    totalPaidPayable: entries.filter(e => e.entry_type === 'payable').reduce((sum, e) => sum + e.amount_paid, 0),
  }), [entries])

  // Person-wise summaries
  const personSummaries = useMemo(() => {
    const summaryMap = new Map<string, PersonSummary>()
    
    entries.forEach(entry => {
      const existing = summaryMap.get(entry.person_name) || {
        name: entry.person_name,
        totalReceivable: 0,
        totalPayable: 0,
        balanceReceivable: 0,
        balancePayable: 0,
        netBalance: 0,
        entriesCount: 0
      }
      
      if (entry.entry_type === 'receivable') {
        existing.totalReceivable += entry.total_amount
        existing.balanceReceivable += entry.balance_amount
      } else {
        existing.totalPayable += entry.total_amount
        existing.balancePayable += entry.balance_amount
      }
      existing.entriesCount++
      existing.netBalance = existing.balanceReceivable - existing.balancePayable
      
      summaryMap.set(entry.person_name, existing)
    })
    
    return Array.from(summaryMap.values()).sort((a, b) => Math.abs(b.netBalance) - Math.abs(a.netBalance))
  }, [entries])

  // Chart data
  const pieChartData = useMemo(() => [
    { name: 'Receivable', value: stats.totalReceivable, color: COLORS.receivable },
    { name: 'Payable', value: stats.totalPayable, color: COLORS.payable }
  ], [stats])

  const paymentProgressData = useMemo(() => [
    { name: 'Receivable', paid: stats.totalPaidReceivable, balance: stats.totalBalanceReceivable },
    { name: 'Payable', paid: stats.totalPaidPayable, balance: stats.totalBalancePayable }
  ], [stats])

  // Monthly trend data
  const monthlyTrendData = useMemo(() => {
    const monthMap = new Map<string, { month: string, receivable: number, payable: number }>()
    
    entries.forEach(entry => {
      const month = entry.entry_date.substring(0, 7) // YYYY-MM
      const existing = monthMap.get(month) || { month, receivable: 0, payable: 0 }
      
      if (entry.entry_type === 'receivable') {
        existing.receivable += entry.total_amount
      } else {
        existing.payable += entry.total_amount
      }
      
      monthMap.set(month, existing)
    })
    
    return Array.from(monthMap.values())
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6) // Last 6 months
      .map(d => ({
        ...d,
        month: new Date(d.month + '-01').toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
      }))
  }, [entries])

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <Spinner className="w-12 h-12 mx-auto mb-4" />
          <p className="text-slate-400">Loading your entries...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-1">Entry Organizer</h1>
            <p className="text-slate-400 text-sm md:text-base">Track work payments and manage your finances efficiently</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {userEmail && (
              <span className="text-slate-400 text-sm hidden md:block truncate max-w-[200px]">{userEmail}</span>
            )}
            <Button
              variant="outline"
              onClick={exportToCSV}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button
              onClick={() => {
                resetForm()
                setShowDialog(true)
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Entry
            </Button>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="border-rose-700 text-rose-400 hover:bg-rose-900/30 hover:text-rose-300"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
          <Card className="bg-gradient-to-br from-emerald-900/50 to-emerald-950/50 border-emerald-800/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-emerald-300 flex items-center gap-2">
                <ArrowDownRight className="w-4 h-4" />
                To Receive
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl md:text-2xl font-bold text-white">{formatCurrency(stats.totalBalanceReceivable)}</p>
              <p className="text-xs text-emerald-400 mt-1">of {formatCurrency(stats.totalReceivable)} total</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-rose-900/50 to-rose-950/50 border-rose-800/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-rose-300 flex items-center gap-2">
                <ArrowUpRight className="w-4 h-4" />
                To Pay
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl md:text-2xl font-bold text-white">{formatCurrency(stats.totalBalancePayable)}</p>
              <p className="text-xs text-rose-400 mt-1">of {formatCurrency(stats.totalPayable)} total</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-900/50 to-blue-950/50 border-blue-800/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-blue-300 flex items-center gap-2">
                <Users className="w-4 h-4" />
                People
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl md:text-2xl font-bold text-white">{personSummaries.length}</p>
              <p className="text-xs text-blue-400 mt-1">{entries.length} total entries</p>
            </CardContent>
          </Card>

          <Card className={`bg-gradient-to-br ${stats.totalBalanceReceivable - stats.totalBalancePayable >= 0 ? 'from-amber-900/50 to-amber-950/50 border-amber-800/50' : 'from-purple-900/50 to-purple-950/50 border-purple-800/50'}`}>
            <CardHeader className="pb-2">
              <CardTitle className={`text-xs md:text-sm font-medium flex items-center gap-2 ${stats.totalBalanceReceivable - stats.totalBalancePayable >= 0 ? 'text-amber-300' : 'text-purple-300'}`}>
                <IndianRupee className="w-4 h-4" />
                Net Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-xl md:text-2xl font-bold ${stats.totalBalanceReceivable - stats.totalBalancePayable >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {stats.totalBalanceReceivable - stats.totalBalancePayable >= 0 ? '+' : ''}{formatCurrency(stats.totalBalanceReceivable - stats.totalBalancePayable)}
              </p>
              <p className={`text-xs mt-1 ${stats.totalBalanceReceivable - stats.totalBalancePayable >= 0 ? 'text-amber-400' : 'text-purple-400'}`}>
                {stats.totalBalanceReceivable - stats.totalBalancePayable >= 0 ? 'You are owed' : 'You owe'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* View Tabs */}
        <Tabs value={activeView} onValueChange={(v) => setActiveView(v as any)} className="mb-6">
          <TabsList className="bg-slate-800 border border-slate-700">
            <TabsTrigger value="entries" className="data-[state=active]:bg-slate-700">
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Entries
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-slate-700">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="people" className="data-[state=active]:bg-slate-700">
              <Users className="w-4 h-4 mr-2" />
              People
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Entries View */}
        {activeView === 'entries' && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-white">All Entries</CardTitle>
                  <CardDescription className="text-slate-400">
                    {filteredEntries.length} entries found
                  </CardDescription>
                </div>
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                    <Input
                      placeholder="Search person or work..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 bg-slate-700 border-slate-600 text-white placeholder-slate-500 w-full md:w-64"
                    />
                  </div>
                  <Tabs value={filterType} onValueChange={(v) => setFilterType(v as any)}>
                    <TabsList className="bg-slate-700">
                      <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                      <TabsTrigger value="receivable" className="text-xs">Receivable</TabsTrigger>
                      <TabsTrigger value="payable" className="text-xs">Payable</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredEntries.length === 0 ? (
                <Empty
                  title="No entries found"
                  description={entries.length === 0 ? 'Create your first entry to get started' : 'Try adjusting your search or filter'}
                />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-700 hover:bg-transparent">
                        <TableHead className="text-slate-300">Date</TableHead>
                        <TableHead className="text-slate-300">Person</TableHead>
                        <TableHead className="text-slate-300 hidden md:table-cell">Work</TableHead>
                        <TableHead className="text-slate-300">Type</TableHead>
                        <TableHead className="text-right text-slate-300">Total</TableHead>
                        <TableHead className="text-right text-slate-300 hidden md:table-cell">Paid</TableHead>
                        <TableHead className="text-right text-slate-300">Balance</TableHead>
                        <TableHead className="text-right text-slate-300">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEntries.map((entry) => (
                        <TableRow key={entry.id} className="border-slate-700 hover:bg-slate-700/50">
                          <TableCell className="text-slate-400 text-sm">
                            {new Date(entry.entry_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                          </TableCell>
                          <TableCell className="text-white font-medium">{entry.person_name}</TableCell>
                          <TableCell className="text-slate-300 hidden md:table-cell max-w-[200px] truncate">{entry.work_description}</TableCell>
                          <TableCell>
                            <Badge className={entry.entry_type === 'receivable' ? 'bg-emerald-600/20 text-emerald-400 border-emerald-600/30' : 'bg-rose-600/20 text-rose-400 border-rose-600/30'}>
                              {entry.entry_type === 'receivable' ? 'Receive' : 'Pay'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-white">{formatCurrency(entry.total_amount)}</TableCell>
                          <TableCell className="text-right text-slate-300 hidden md:table-cell">{formatCurrency(entry.amount_paid)}</TableCell>
                          <TableCell className={`text-right font-semibold ${entry.balance_amount > 0 ? (entry.entry_type === 'receivable' ? 'text-emerald-400' : 'text-rose-400') : 'text-slate-500'}`}>
                            {formatCurrency(entry.balance_amount)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-1 justify-end">
                              <Button variant="ghost" size="sm" onClick={() => handleEdit(entry)} className="text-blue-400 hover:text-blue-300 hover:bg-slate-700 h-8 w-8 p-0">
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => { setDeleteId(entry.id); setShowDeleteDialog(true) }} className="text-rose-400 hover:text-rose-300 hover:bg-slate-700 h-8 w-8 p-0">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Analytics View */}
        {activeView === 'analytics' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Overview Pie Chart */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-blue-400" />
                  Amount Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                {entries.length === 0 ? (
                  <div className="h-[250px] flex items-center justify-center text-slate-500">No data to display</div>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <RechartsPie>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                        labelStyle={{ color: '#e2e8f0' }}
                      />
                    </RechartsPie>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Payment Progress */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-emerald-400" />
                  Payment Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                {entries.length === 0 ? (
                  <div className="h-[250px] flex items-center justify-center text-slate-500">No data to display</div>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={paymentProgressData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                      <XAxis type="number" tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} stroke="#94a3b8" />
                      <YAxis type="category" dataKey="name" stroke="#94a3b8" />
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                      />
                      <Legend />
                      <Bar dataKey="paid" name="Paid" stackId="a" fill={COLORS.paid} radius={[0, 0, 0, 0]} />
                      <Bar dataKey="balance" name="Balance" stackId="a" fill={COLORS.balance} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Monthly Trend */}
            <Card className="bg-slate-800/50 border-slate-700 lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-amber-400" />
                  Monthly Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                {monthlyTrendData.length === 0 ? (
                  <div className="h-[250px] flex items-center justify-center text-slate-500">No data to display</div>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={monthlyTrendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                      <XAxis dataKey="month" stroke="#94a3b8" />
                      <YAxis tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} stroke="#94a3b8" />
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="receivable" name="Receivable" stroke={COLORS.receivable} strokeWidth={2} dot={{ fill: COLORS.receivable }} />
                      <Line type="monotone" dataKey="payable" name="Payable" stroke={COLORS.payable} strokeWidth={2} dot={{ fill: COLORS.payable }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* People View */}
        {activeView === 'people' && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Person-wise Summary</CardTitle>
              <CardDescription className="text-slate-400">
                Click on a person to see their detailed entries
              </CardDescription>
            </CardHeader>
            <CardContent>
              {personSummaries.length === 0 ? (
                <Empty title="No people found" description="Add entries to see person-wise summaries" />
              ) : (
                <div className="grid gap-4">
                  {personSummaries.map((person) => (
                    <div
                      key={person.name}
                      onClick={() => { setSelectedPerson(person); setShowPersonDialog(true) }}
                      className="bg-slate-700/50 rounded-lg p-4 cursor-pointer hover:bg-slate-700 transition-colors border border-slate-600"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                            {person.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="text-white font-semibold">{person.name}</h3>
                            <p className="text-slate-400 text-sm">{person.entriesCount} entries</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-4 md:gap-6">
                          <div className="text-center">
                            <p className="text-xs text-slate-400">To Receive</p>
                            <p className="text-emerald-400 font-semibold">{formatCurrency(person.balanceReceivable)}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-slate-400">To Pay</p>
                            <p className="text-rose-400 font-semibold">{formatCurrency(person.balancePayable)}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-slate-400">Net Balance</p>
                            <p className={`font-bold ${person.netBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {person.netBalance >= 0 ? '+' : ''}{formatCurrency(person.netBalance)}
                            </p>
                          </div>
                        </div>
                      </div>
                      {/* Progress bar */}
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-slate-400 mb-1">
                          <span>Collection Progress</span>
                          <span>{person.totalReceivable > 0 ? Math.round(((person.totalReceivable - person.balanceReceivable) / person.totalReceivable) * 100) : 0}%</span>
                        </div>
                        <Progress 
                          value={person.totalReceivable > 0 ? ((person.totalReceivable - person.balanceReceivable) / person.totalReceivable) * 100 : 0} 
                          className="h-2 bg-slate-600"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Entry' : 'Add New Entry'}</DialogTitle>
            <DialogDescription className="text-slate-400">
              {editingId ? 'Update entry details' : 'Create a new work payment entry'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="person_name" className="text-slate-300">Person Name *</Label>
              <Input
                id="person_name"
                placeholder="e.g., John Doe"
                value={formData.person_name}
                onChange={(e) => setFormData({ ...formData, person_name: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white placeholder-slate-500 mt-1"
              />
            </div>

            <div>
              <Label htmlFor="work_description" className="text-slate-300">Work Description *</Label>
              <Textarea
                id="work_description"
                placeholder="Describe the work or task"
                value={formData.work_description}
                onChange={(e) => setFormData({ ...formData, work_description: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white placeholder-slate-500 mt-1 resize-none"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="entry_type" className="text-slate-300">Type *</Label>
              <Select value={formData.entry_type} onValueChange={(value: 'receivable' | 'payable') => setFormData({ ...formData, entry_type: value })}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="receivable" className="text-white">Receivable (They owe me)</SelectItem>
                  <SelectItem value="payable" className="text-white">Payable (I owe them)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="total_amount" className="text-slate-300">Total Amount *</Label>
                <Input
                  id="total_amount"
                  type="number"
                  placeholder="0.00"
                  value={formData.total_amount}
                  onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white placeholder-slate-500 mt-1"
                />
              </div>
              <div>
                <Label htmlFor="amount_paid" className="text-slate-300">Amount Paid</Label>
                <Input
                  id="amount_paid"
                  type="number"
                  placeholder="0.00"
                  value={formData.amount_paid}
                  onChange={(e) => setFormData({ ...formData, amount_paid: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white placeholder-slate-500 mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="entry_date" className="text-slate-300">Date</Label>
              <Input
                id="entry_date"
                type="date"
                value={formData.entry_date}
                onChange={(e) => setFormData({ ...formData, entry_date: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white mt-1"
              />
            </div>

            <div className="bg-slate-700/50 p-3 rounded-lg border border-slate-600">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Balance:</span>
                <span className="font-bold text-lg text-white">
                  {formatCurrency(parseFloat(formData.total_amount || '0') - parseFloat(formData.amount_paid || '0'))}
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => { resetForm(); setShowDialog(false) }}
                className="border-slate-600 text-slate-300 hover:bg-slate-700 flex-1"
              >
                Cancel
              </Button>
              <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1">
                {editingId ? 'Update' : 'Create'} Entry
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Person Detail Dialog */}
      <Dialog open={showPersonDialog} onOpenChange={setShowPersonDialog}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                {selectedPerson?.name.charAt(0).toUpperCase()}
              </div>
              {selectedPerson?.name}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              All entries for this person
            </DialogDescription>
          </DialogHeader>

          {selectedPerson && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-emerald-900/30 rounded-lg p-3 text-center">
                  <p className="text-xs text-emerald-300">To Receive</p>
                  <p className="text-lg font-bold text-emerald-400">{formatCurrency(selectedPerson.balanceReceivable)}</p>
                </div>
                <div className="bg-rose-900/30 rounded-lg p-3 text-center">
                  <p className="text-xs text-rose-300">To Pay</p>
                  <p className="text-lg font-bold text-rose-400">{formatCurrency(selectedPerson.balancePayable)}</p>
                </div>
                <div className={`${selectedPerson.netBalance >= 0 ? 'bg-amber-900/30' : 'bg-purple-900/30'} rounded-lg p-3 text-center`}>
                  <p className={`text-xs ${selectedPerson.netBalance >= 0 ? 'text-amber-300' : 'text-purple-300'}`}>Net</p>
                  <p className={`text-lg font-bold ${selectedPerson.netBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {selectedPerson.netBalance >= 0 ? '+' : ''}{formatCurrency(selectedPerson.netBalance)}
                  </p>
                </div>
              </div>

              {/* Entries List */}
              <div className="space-y-2">
                {entries
                  .filter(e => e.person_name === selectedPerson.name)
                  .map(entry => (
                    <div key={entry.id} className="bg-slate-700/50 rounded-lg p-3 border border-slate-600">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-white font-medium">{entry.work_description}</p>
                          <p className="text-slate-400 text-sm">{new Date(entry.entry_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                        </div>
                        <div className="text-right">
                          <Badge className={entry.entry_type === 'receivable' ? 'bg-emerald-600/20 text-emerald-400' : 'bg-rose-600/20 text-rose-400'}>
                            {entry.entry_type}
                          </Badge>
                          <p className="text-white font-semibold mt-1">{formatCurrency(entry.total_amount)}</p>
                          <p className={`text-sm ${entry.balance_amount > 0 ? (entry.entry_type === 'receivable' ? 'text-emerald-400' : 'text-rose-400') : 'text-slate-500'}`}>
                            Balance: {formatCurrency(entry.balance_amount)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-slate-800 border-slate-700">
          <AlertDialogTitle className="text-white">Delete Entry</AlertDialogTitle>
          <AlertDialogDescription className="text-slate-400">
            Are you sure you want to delete this entry? This action cannot be undone.
          </AlertDialogDescription>
          <div className="flex gap-2 justify-end pt-4">
            <AlertDialogCancel className="border-slate-600 text-slate-300 hover:bg-slate-700">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-rose-600 hover:bg-rose-700">Delete</AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
