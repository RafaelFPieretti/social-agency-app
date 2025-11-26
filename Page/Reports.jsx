import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { format, parseISO, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Users, 
  Eye, 
  Target, 
  MessageCircle, 
  Link2, 
  TrendingUp,
  Plus,
  Filter,
  Calendar,
  Edit,
  Trash2,
  Loader2
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import StatCard from '../components/ui/StatCard';
import { cn } from "@/lib/utils";

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState('all');
  const [dateRange, setDateRange] = useState({
    start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });
  const [showForm, setShowForm] = useState(false);
  const [editingReport, setEditingReport] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [saving, setSaving] = useState(false);

  const urlParams = new URLSearchParams(window.location.search);
  const clientIdFromUrl = urlParams.get('clientId');

  const [formData, setFormData] = useState({
    client_id: '',
    period_start: '',
    period_end: '',
    followers_gained: 0,
    total_impressions: 0,
    total_reach: 0,
    total_messages: 0,
    bio_link_clicks: 0,
    engagement_rate: 0,
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (clientIdFromUrl) {
      setSelectedClient(clientIdFromUrl);
    }
  }, [clientIdFromUrl]);

  const loadData = async () => {
    try {
      const [reportsData, clientsData] = await Promise.all([
        base44.entities.Report.list('-period_end'),
        base44.entities.Client.list()
      ]);
      setReports(reportsData);
      setClients(clientsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveReport = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingReport) {
        await base44.entities.Report.update(editingReport.id, formData);
      } else {
        await base44.entities.Report.create(formData);
      }
      loadData();
      setShowForm(false);
      setEditingReport(null);
      resetForm();
    } catch (error) {
      console.error('Error saving report:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteReport = async () => {
    if (deleteConfirm) {
      await base44.entities.Report.delete(deleteConfirm.id);
      loadData();
      setDeleteConfirm(null);
    }
  };

  const resetForm = () => {
    setFormData({
      client_id: selectedClient !== 'all' ? selectedClient : '',
      period_start: '',
      period_end: '',
      followers_gained: 0,
      total_impressions: 0,
      total_reach: 0,
      total_messages: 0,
      bio_link_clicks: 0,
      engagement_rate: 0,
      notes: ''
    });
  };

  const openEditForm = (report) => {
    setEditingReport(report);
    setFormData({
      client_id: report.client_id || '',
      period_start: report.period_start || '',
      period_end: report.period_end || '',
      followers_gained: report.followers_gained || 0,
      total_impressions: report.total_impressions || 0,
      total_reach: report.total_reach || 0,
      total_messages: report.total_messages || 0,
      bio_link_clicks: report.bio_link_clicks || 0,
      engagement_rate: report.engagement_rate || 0,
      notes: report.notes || ''
    });
    setShowForm(true);
  };

  const filteredReports = reports.filter(report => {
    const matchesClient = selectedClient === 'all' || report.client_id === selectedClient;
    let matchesDate = true;
    try {
      const reportStart = parseISO(report.period_start);
      const reportEnd = parseISO(report.period_end);
      const filterStart = parseISO(dateRange.start);
      const filterEnd = parseISO(dateRange.end);
      matchesDate = reportStart >= filterStart && reportEnd <= filterEnd;
    } catch {
      matchesDate = true;
    }
    return matchesClient && matchesDate;
  });

  const totals = filteredReports.reduce((acc, report) => ({
    followers: acc.followers + (report.followers_gained || 0),
    impressions: acc.impressions + (report.total_impressions || 0),
    reach: acc.reach + (report.total_reach || 0),
    messages: acc.messages + (report.total_messages || 0),
    clicks: acc.clicks + (report.bio_link_clicks || 0),
  }), { followers: 0, impressions: 0, reach: 0, messages: 0, clicks: 0 });

  const chartData = filteredReports
    .sort((a, b) => new Date(a.period_start) - new Date(b.period_start))
    .map(report => ({
      date: format(parseISO(report.period_start), 'dd/MM', { locale: ptBR }),
      seguidores: report.followers_gained || 0,
      alcance: report.total_reach || 0,
      impressoes: report.total_impressions || 0,
    }));

  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client?.company_name || '-';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-slate-200 rounded animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="h-32 bg-slate-100 rounded-xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Relatórios de Performance</h1>
          <p className="text-slate-500">Análise de métricas das redes sociais</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Select value={selectedClient} onValueChange={setSelectedClient}>
            <SelectTrigger className="w-48">
              <Filter className="w-4 h-4 mr-2 text-slate-400" />
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

          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="w-36"
            />
            <span className="text-slate-400">até</span>
            <Input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="w-36"
            />
          </div>

          <Button 
            className="bg-blue-500 hover:bg-blue-600"
            onClick={() => {
              setEditingReport(null);
              resetForm();
              setShowForm(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Relatório
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Seguidores Ganhos"
          value={totals.followers.toLocaleString('pt-BR')}
          icon={Users}
          iconBg="bg-blue-50"
          iconColor="text-blue-500"
        />
        <StatCard
          title="Impressões"
          value={totals.impressions.toLocaleString('pt-BR')}
          icon={Eye}
          iconBg="bg-purple-50"
          iconColor="text-purple-500"
        />
        <StatCard
          title="Alcance"
          value={totals.reach.toLocaleString('pt-BR')}
          icon={Target}
          iconBg="bg-green-50"
          iconColor="text-green-500"
        />
        <StatCard
          title="Mensagens (DMs)"
          value={totals.messages.toLocaleString('pt-BR')}
          icon={MessageCircle}
          iconBg="bg-orange-50"
          iconColor="text-orange-500"
        />
        <StatCard
          title="Cliques no Link"
          value={totals.clicks.toLocaleString('pt-BR')}
          icon={Link2}
          iconBg="bg-pink-50"
          iconColor="text-pink-500"
        />
      </div>

      {/* Charts */}
      {chartData.length > 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Evolução de Alcance</h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px'
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="alcance" 
                  stroke="#3b82f6" 
                  fill="#3b82f6" 
                  fillOpacity={0.1}
                  name="Alcance"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Seguidores por Período</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px'
                  }} 
                />
                <Bar dataKey="seguidores" fill="#10b981" radius={[4, 4, 0, 0]} name="Seguidores" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900">Histórico de Relatórios</h3>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Período</TableHead>
                <TableHead className="text-right">Seguidores</TableHead>
                <TableHead className="text-right">Impressões</TableHead>
                <TableHead className="text-right">Alcance</TableHead>
                <TableHead className="text-right">Mensagens</TableHead>
                <TableHead className="text-right">Cliques</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                    Nenhum relatório encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredReports.map(report => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">{getClientName(report.client_id)}</TableCell>
                    <TableCell>
                      {format(parseISO(report.period_start), 'dd/MM')} - {format(parseISO(report.period_end), 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell className="text-right">{report.followers_gained?.toLocaleString('pt-BR') || 0}</TableCell>
                    <TableCell className="text-right">{report.total_impressions?.toLocaleString('pt-BR') || 0}</TableCell>
                    <TableCell className="text-right">{report.total_reach?.toLocaleString('pt-BR') || 0}</TableCell>
                    <TableCell className="text-right">{report.total_messages?.toLocaleString('pt-BR') || 0}</TableCell>
                    <TableCell className="text-right">{report.bio_link_clicks?.toLocaleString('pt-BR') || 0}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEditForm(report)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm(report)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Form Modal */}
      <Dialog open={showForm} onOpenChange={() => { setShowForm(false); setEditingReport(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingReport ? 'Editar Relatório' : 'Novo Relatório'}</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSaveReport} className="space-y-6 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Cliente *</Label>
                <Select
                  value={formData.client_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, client_id: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
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
                <Label>Data Início *</Label>
                <Input
                  type="date"
                  value={formData.period_start}
                  onChange={(e) => setFormData(prev => ({ ...prev, period_start: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Data Fim *</Label>
                <Input
                  type="date"
                  value={formData.period_end}
                  onChange={(e) => setFormData(prev => ({ ...prev, period_end: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Seguidores Ganhos</Label>
                <Input
                  type="number"
                  value={formData.followers_gained}
                  onChange={(e) => setFormData(prev => ({ ...prev, followers_gained: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Impressões</Label>
                <Input
                  type="number"
                  value={formData.total_impressions}
                  onChange={(e) => setFormData(prev => ({ ...prev, total_impressions: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Alcance</Label>
                <Input
                  type="number"
                  value={formData.total_reach}
                  onChange={(e) => setFormData(prev => ({ ...prev, total_reach: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Mensagens (DMs)</Label>
                <Input
                  type="number"
                  value={formData.total_messages}
                  onChange={(e) => setFormData(prev => ({ ...prev, total_messages: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Cliques no Link</Label>
                <Input
                  type="number"
                  value={formData.bio_link_clicks}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio_link_clicks: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Taxa de Engajamento (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.engagement_rate}
                  onChange={(e) => setFormData(prev => ({ ...prev, engagement_rate: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Notas adicionais sobre o período..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingReport(null); }}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingReport ? 'Salvar Alterações' : 'Criar Relatório'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Relatório</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este relatório? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteReport}
              className="bg-red-500 hover:bg-red-600"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}