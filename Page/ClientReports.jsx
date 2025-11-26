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
  Loader2,
  Calendar
} from 'lucide-react';
import { Input } from "@/components/ui/input";
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

export default function ClientReports() {
  const [user, setUser] = useState(null);
  const [client, setClient] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: format(subDays(new Date(), 90), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
      
      const clients = await base44.entities.Client.filter({ user_email: userData.email });
      if (clients.length > 0) {
        const clientData = clients[0];
        setClient(clientData);
        
        const reportsData = await base44.entities.Report.filter({ client_id: clientData.id }, '-period_end');
        setReports(reportsData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = reports.filter(report => {
    try {
      const reportStart = parseISO(report.period_start);
      const reportEnd = parseISO(report.period_end);
      const filterStart = parseISO(dateRange.start);
      const filterEnd = parseISO(dateRange.end);
      return reportStart >= filterStart && reportEnd <= filterEnd;
    } catch {
      return true;
    }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <p className="text-slate-500">Perfil de cliente não encontrado.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Relatórios de Performance</h1>
          <p className="text-slate-500">Acompanhe as métricas das suas redes sociais</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
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
                <TableHead>Período</TableHead>
                <TableHead className="text-right">Seguidores</TableHead>
                <TableHead className="text-right">Impressões</TableHead>
                <TableHead className="text-right">Alcance</TableHead>
                <TableHead className="text-right">Mensagens</TableHead>
                <TableHead className="text-right">Cliques</TableHead>
                <TableHead className="text-right">Engajamento</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                    <div className="flex flex-col items-center">
                      <TrendingUp className="w-12 h-12 text-slate-300 mb-3" />
                      <p>Nenhum relatório disponível para o período selecionado</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredReports.map(report => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">
                      {format(parseISO(report.period_start), 'dd/MM')} - {format(parseISO(report.period_end), 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell className="text-right text-emerald-600 font-medium">
                      +{report.followers_gained?.toLocaleString('pt-BR') || 0}
                    </TableCell>
                    <TableCell className="text-right">{report.total_impressions?.toLocaleString('pt-BR') || 0}</TableCell>
                    <TableCell className="text-right">{report.total_reach?.toLocaleString('pt-BR') || 0}</TableCell>
                    <TableCell className="text-right">{report.total_messages?.toLocaleString('pt-BR') || 0}</TableCell>
                    <TableCell className="text-right">{report.bio_link_clicks?.toLocaleString('pt-BR') || 0}</TableCell>
                    <TableCell className="text-right">
                      {report.engagement_rate ? `${report.engagement_rate.toFixed(2)}%` : '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Notes Section */}
      {filteredReports.some(r => r.notes) && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Observações da Agência</h3>
          <div className="space-y-4">
            {filteredReports.filter(r => r.notes).map(report => (
              <div key={report.id} className="bg-slate-50 rounded-lg p-4">
                <p className="text-sm text-slate-500 mb-2">
                  {format(parseISO(report.period_start), 'dd/MM')} - {format(parseISO(report.period_end), 'dd/MM/yyyy')}
                </p>
                <p className="text-slate-700">{report.notes}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}