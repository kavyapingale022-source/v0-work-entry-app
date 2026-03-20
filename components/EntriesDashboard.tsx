'use client'

import { useState, useEffect } from 'react'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Empty } from '@/components/ui/empty'
import { Spinner } from '@/components/ui/spinner'
import { toast } from 'sonner'
import { Trash2, Edit, Plus, DollarSign, TrendingUp, TrendingDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

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

export default function EntriesDashboard() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<'all' | 'receivable' | 'payable'>('all')
  const [user, setUser] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    person_name: '',
    work_description: '',
    entry_type: 'receivable' as const,
    total_amount: '',
    amount_paid: '',
    entry_date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    initializeApp()
  }, [])

  const initializeApp = async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      
      // Check if user is authenticated
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !currentUser) {
        setError('Please sign in to use this app')
        setLoading(false)
        return
      }
      
      setUser(currentUser)
      
      // Try to load entries
      await loadEntries()
    } catch (err) {
      console.log('[v0] Initialization error:', err)
      setError('Failed to initialize app. Please refresh and try again.')
    } finally {
      setLoading(false)
    }
  }

  const loadEntries = async () => {
    try {
      const supabase = createClient()
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      
      if (!currentUser) {
        setError('Not authenticated')
        return
      }

      const { data, error: queryError } = await supabase
        .from('entries')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('entry_date', { ascending: false })

      if (queryError) {
        console.log('[v0] Query error:', queryError)
        if (queryError.code === '42P01') {
          // Table doesn't exist
          setError('Database table not initialized. Please check with support.')
        } else {
          setError(`Database error: ${queryError.message}`)
        }
        return
      }

      setEntries(data || [])
      setError(null)
    } catch (err) {
      console.log('[v0] Error loading entries:', err)
      setError('Failed to load entries')
    }
  }

  const handleSave = async () => {
    if (!formData.person_name || !formData.work_description || !formData.total_amount) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      const supabase = createClient()
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      
      if (!currentUser) {
        toast.error('Not authenticated')
        return
      }

      const totalAmount = parseFloat(formData.total_amount)
      const amountPaid = parseFloat(formData.amount_paid || '0')

      if (editingId) {
        const { error: updateError } = await supabase
          .from('entries')
          .update({
            person_name: formData.person_name,
            work_description: formData.work_description,
            entry_type: formData.entry_type,
            total_amount: totalAmount,
            amount_paid: amountPaid,
            entry_date: formData.entry_date,
          })
          .eq('id', editingId)

        if (updateError) throw updateError
        toast.success('Entry updated successfully')
      } else {
        const { error: insertError } = await supabase
          .from('entries')
          .insert({
            user_id: currentUser.id,
            person_name: formData.person_name,
            work_description: formData.work_description,
            entry_type: formData.entry_type,
            total_amount: totalAmount,
            amount_paid: amountPaid,
            entry_date: formData.entry_date,
          })

        if (insertError) throw insertError
        toast.success('Entry created successfully')
      }

      resetForm()
      setShowDialog(false)
      await loadEntries()
    } catch (err) {
      console.log('[v0] Error saving entry:', err)
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

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      const supabase = createClient()
      const { error: deleteError } = await supabase
        .from('entries')
        .delete()
        .eq('id', deleteId)

      if (deleteError) throw deleteError
      toast.success('Entry deleted successfully')
      setShowDeleteDialog(false)
      setDeleteId(null)
      await loadEntries()
    } catch (err) {
      console.log('[v0] Error deleting entry:', err)
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

  const filteredEntries = entries.filter(
    (entry) => filterType === 'all' || entry.entry_type === filterType
  )

  const stats = {
    totalReceivable: entries
      .filter((e) => e.entry_type === 'receivable')
      .reduce((sum, e) => sum + e.total_amount, 0),
    totalPayable: entries
      .filter((e) => e.entry_type === 'payable')
      .reduce((sum, e) => sum + e.total_amount, 0),
    totalBalanceReceivable: entries
      .filter((e) => e.entry_type === 'receivable')
      .reduce((sum, e) => sum + e.balance_amount, 0),
    totalBalancePayable: entries
      .filter((e) => e.entry_type === 'payable')
      .reduce((sum, e) => sum + e.balance_amount, 0),
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <Spinner className="w-12 h-12 mx-auto mb-4" />
          <p className="text-slate-400">Initializing your app...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6">
        <div className="max-w-md mx-auto mt-20">
          <Card className="bg-slate-800 border-rose-700">
            <CardHeader>
              <CardTitle className="text-rose-400">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300 mb-4">{error}</p>
              <Button 
                onClick={initializeApp}
                className="bg-blue-600 hover:bg-blue-700 text-white w-full"
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Entry Organizer</h1>
          <p className="text-slate-400">Track work payments and manage your finances efficiently</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                Total Receivable
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-white">₹{stats.totalReceivable.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
              <p className="text-xs text-slate-400 mt-1">Balance: ₹{stats.totalBalanceReceivable.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-rose-500" />
                Total Payable
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-white">₹{stats.totalPayable.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
              <p className="text-xs text-slate-400 mt-1">Balance: ₹{stats.totalBalancePayable.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-blue-500" />
                Total Entries
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-white">{entries.length}</p>
              <p className="text-xs text-slate-400 mt-1">Active records</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400">Net Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${stats.totalBalanceReceivable - stats.totalBalancePayable >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                ₹{(stats.totalBalanceReceivable - stats.totalBalancePayable).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-slate-400 mt-1">Receivable - Payable</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-white">Entries</CardTitle>
              <CardDescription className="text-slate-400">
                Manage your work payments and track balances
              </CardDescription>
            </div>
            <Button
              onClick={() => {
                resetForm()
                setShowDialog(true)
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Entry
            </Button>
          </CardHeader>

          <CardContent>
            {/* Filter Tabs */}
            <Tabs defaultValue="all" className="mb-6" onValueChange={(v) => setFilterType(v as any)}>
              <TabsList className="bg-slate-700">
                <TabsTrigger value="all" className="text-slate-300">All</TabsTrigger>
                <TabsTrigger value="receivable" className="text-slate-300">Receivable</TabsTrigger>
                <TabsTrigger value="payable" className="text-slate-300">Payable</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Table */}
            {filteredEntries.length === 0 ? (
              <Empty
                title="No entries found"
                description={filterType === 'all' ? 'Create your first entry to get started' : `No ${filterType} entries yet`}
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700 hover:bg-transparent">
                      <TableHead className="text-slate-300">Person</TableHead>
                      <TableHead className="text-slate-300">Work Description</TableHead>
                      <TableHead className="text-slate-300">Type</TableHead>
                      <TableHead className="text-right text-slate-300">Total Amount</TableHead>
                      <TableHead className="text-right text-slate-300">Paid</TableHead>
                      <TableHead className="text-right text-slate-300">Balance</TableHead>
                      <TableHead className="text-slate-300">Date</TableHead>
                      <TableHead className="text-right text-slate-300">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEntries.map((entry) => (
                      <TableRow key={entry.id} className="border-slate-700 hover:bg-slate-700/50">
                        <TableCell className="text-white font-medium">{entry.person_name}</TableCell>
                        <TableCell className="text-slate-300">{entry.work_description}</TableCell>
                        <TableCell>
                          <Badge
                            variant={entry.entry_type === 'receivable' ? 'default' : 'secondary'}
                            className={entry.entry_type === 'receivable' ? 'bg-emerald-600' : 'bg-rose-600'}
                          >
                            {entry.entry_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-white">₹{entry.total_amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</TableCell>
                        <TableCell className="text-right text-slate-300">₹{entry.amount_paid.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</TableCell>
                        <TableCell className={`text-right font-semibold ${entry.balance_amount > 0 ? 'text-emerald-400' : 'text-slate-300'}`}>
                          ₹{entry.balance_amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-slate-400 text-sm">{new Date(entry.entry_date).toLocaleDateString('en-IN')}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(entry)}
                              className="text-blue-400 hover:text-blue-300 hover:bg-slate-700"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setDeleteId(entry.id)
                                setShowDeleteDialog(true)
                              }}
                              className="text-rose-400 hover:text-rose-300 hover:bg-slate-700"
                            >
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
              <Select value={formData.entry_type} onValueChange={(value: any) => setFormData({ ...formData, entry_type: value })}>
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

            <div className="bg-slate-700 p-3 rounded text-sm text-slate-300">
              Balance: ₹<span className="font-semibold text-white">
                {(parseFloat(formData.total_amount || '0') - parseFloat(formData.amount_paid || '0')).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  resetForm()
                  setShowDialog(false)
                }}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {editingId ? 'Update' : 'Create'} Entry
              </Button>
            </div>
          </div>
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
