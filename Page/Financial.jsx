import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { format, parseISO, isAfter, isBefore, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Plus, 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  Calendar,
  Edit,
  Trash2,
  MoreVertical
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import StatCard from '../components/ui/StatCard';
import { cn } from "@/lib/utils";

const statusConfig = {
  pending: { label: 'Pendente', color: 'bg-yellow-50 text-yellow-600 border-yellow-200', icon: Clock },
  paid: { label: 'Pago', color: 'bg-emerald-50 text-emerald-600 border-emerald-200', icon: CheckCircle2 },
  overdue: { label: 'Atrasado', color: 'bg-red-50 text-red-600 border-red-200', icon: AlertCircle },
  cancelled: { label: 'Cancelado', color: 'bg-slate-50 text-slate-600 border-slate-200', icon: AlertCircle },
};

const recurrenceLabels = {
  once: 'Único',
  monthly: 'Mensal',
  quarterly: 'Trimestral',
  yearly: 'Anual',
};

export default function Financial() {
  const [billings, setBillings] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBilling, setEditingBilling] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [filterClient, setFilterClient] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const [formData, setFormData] = useState({
    client_id: '',
    description: '',
    amount: '',
    due_date: '',
    status: 'pending',
    payment_date: '',
    recurrence: 'monthly',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [billingsData, clientsData] = await Promise.all([
        base44.entities.Billing.list('-due_date'),
        base44.entities.Client.list()
      ]);
      
      // Auto-update overdue billings
      const today = new Date();
      const updatedBillings = billingsData.map(b => {
        if (b.status === 'pending' && isBefore(parseISO(b.due_date), today)) {
          return { ...b, status: 'overdue' };
        }
        return b;
      });
      
      setBillings(updatedBillings);
      setClients(clientsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = (billing = null) => {
    if (billing) {
      setFormData({
        client_id: billing.client_id || '',
        description: billing.description || '',
        amount: billing.amount || '',
        due_date: billing.due_date || '',
        status: billing.status || 'pending',
        payment_date: billing.payment_date || '',
        recurrence: billing.recurrence || 'monthly',
        notes: billing.notes || ''
      });
      setEditingBilling(billing);
    } else {
      setFormData({
        client_id: '',
        description: '',
        amount: '',
        due_date: '',
        status: 'pending',
        payment_date: '',
        recurrence: 'monthly',
        notes: ''
      });
      setEditingBilling(null);
    }
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      amount: parseFloat(formData.amount)
    };
    
    if (editingBilling) {
      await base44.entities.Billing.update(editingBilling.id, data);
    } else {
      await base44.entities.Billing.create(data);
    }
    
    loadData();
    setShowForm(false);
  };

  const handleDelete = async () => {
    if (deleteConfirm) {
      await base44.entities.Billing.delete(deleteConfirm.id);
      loadData();
      setDeleteConfirm(null);
    }
  };

  const handleMarkAsPaid = async (billing) => {
    await base44.entities.Billing.update(billing.id, {
      status: 'paid',
      payment_date: format(new Date(), 'yyyy-MM-dd')
    });
    loadData();
  };

  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client?.company_name || 'Cliente não encontrado';
  };

  const filteredBillings = billings.filter(b => {
    const matchesClient = filterClient === 'all' || b.client_id === filterClient;
    const matchesStatus = filterStatus === 'all' || b.status === filterStatus;
    return matchesClient && matchesStatus;
  });

  // Dashboard calculations
  const currentMonth = new Date();
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  
  const monthlyBillings = billings.filter(b => {
    const dueDate = parseISO(b.due_date);
    return isAfter(dueDate, monthStart) && isBefore(dueDate, monthEnd);
  });

  const totalPending = billings
    .filter(b => b.status === 'pending')
    .reduce((sum, b) => sum + (b.amount || 0), 0);

  const totalOverdue = billings
    .filter(b => b.status === 'overdue')
    .reduce((sum, b) => sum + (b.amount || 0), 0);

  const totalPaidThisMonth = monthlyBillings
    .filter(b => b.status === 'paid')
    .reduce((sum, b) => sum + (b.amount || 0), 0);

  const totalExpectedThisMonth = monthlyBillings
    .reduce((sum, b) => sum + (b.amount || 0), 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-slate-200 rounded animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-32 bg-slate-100 rounded-xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Financeiro</h1>
          <p className="text-slate-500">Gestão de cobranças e pagamentos</p>
        </div>
        <Button 
          className="bg-blue-500 hover:bg-blue-600"
          onClick={() => handleOpenForm()}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Cobrança
        </Button>
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Receita Esperada (Mês)"
          value={`R$ ${totalExpectedThisMonth.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={TrendingUp}
          iconBg="bg-blue-50"
          iconColor="text-blue-500"
        />
        <StatCard
          title="Recebido (Mês)"
          value={`R$ ${totalPaidThisMonth.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={CheckCircle2}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-500"
        />
        <StatCard
          title="Pendente"
          value={`R$ ${totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={Clock}
          iconBg="bg-yellow-50"
          iconColor="text-yellow-500"
        />
        <StatCard
          title="Atrasado"
          value={`R$ ${totalOverdue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={AlertCircle}
          iconBg="bg-red-50"
          iconColor="text-red-500"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <Select value={filterClient} onValueChange={setFilterClient}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Todos os Clientes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Clientes</SelectItem>
            {clients.map(client => (
              <SelectItem key={client.id} value={client.id}>
                {client.company_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Todos os Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            {Object.entries(statusConfig).map(([key, value]) => (
              <SelectItem key={key} value={key}>{value.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Billings Table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead>Cliente</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Recorrência</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBillings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                  Nenhuma cobrança encontrada
                </TableCell>
              </TableRow>
            ) : (
              filteredBillings.map(billing => {
                const status = statusConfig[billing.status] || statusConfig.pending;
                const StatusIcon = status.icon;
                return (
                  <TableRow key={billing.id} className="hover:bg-slate-50">
                    <TableCell className="font-medium">
                      {getClientName(billing.client_id)}
                    </TableCell>
                    <TableCell>{billing.description || '-'}</TableCell>
                    <TableCell className="font-semibold">
                      R$ {billing.amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      {format(parseISO(billing.due_date), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {recurrenceLabels[billing.recurrence] || billing.recurrence}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("border", status.color)}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {billing.status !== 'paid' && (
                            <DropdownMenuItem onClick={() => handleMarkAsPaid(billing)}>
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Marcar como Pago
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleOpenForm(billing)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => setDeleteConfirm(billing)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Form Modal */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingBilling ? 'Editar Cobrança' : 'Nova Cobrança'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Cliente *</Label>
              <Select
                value={formData.client_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, client_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Ex: Mensalidade Janeiro"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valor *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="0,00"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Vencimento *</Label>
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Recorrência</Label>
                <Select
                  value={formData.recurrence}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, recurrence: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="once">Único</SelectItem>
                    <SelectItem value="monthly">Mensal</SelectItem>
                    <SelectItem value="quarterly">Trimestral</SelectItem>
                    <SelectItem value="yearly">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusConfig).map(([key, value]) => (
                      <SelectItem key={key} value={key}>{value.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.status === 'paid' && (
              <div className="space-y-2">
                <Label>Data do Pagamento</Label>
                <Input
                  type="date"
                  value={formData.payment_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, payment_date: e.target.value }))}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Notas adicionais..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={!formData.client_id || !formData.amount || !formData.due_date}>
                {editingBilling ? 'Salvar' : 'Criar Cobrança'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Cobrança</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta cobrança? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}