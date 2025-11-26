import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { format, isToday, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  Clock,
  Plus,
  ArrowRight,
  Send,
  Sparkles
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import StatCard from '../components/ui/StatCard';
import { cn } from "@/lib/utils";

const statusConfig = {
  idea: { label: 'Ideia', color: 'bg-purple-50 text-purple-600' },
  production: { label: 'Em Produção', color: 'bg-yellow-50 text-yellow-600' },
  approved: { label: 'Aprovado', color: 'bg-blue-50 text-blue-600' },
  scheduled: { label: 'Agendado', color: 'bg-orange-50 text-orange-600' },
  posted: { label: 'Postado', color: 'bg-emerald-50 text-emerald-600' },
};

export default function Dashboard() {
  const [clients, setClients] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [clientsData, postsData] = await Promise.all([
        base44.entities.Client.list(),
        base44.entities.Post.list('-scheduled_date', 100)
      ]);
      setClients(clientsData);
      setPosts(postsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const todayPosts = posts.filter(post => {
    try {
      return isToday(parseISO(post.scheduled_date));
    } catch {
      return false;
    }
  });

  const activeClients = clients.filter(c => c.status === 'active').length;
  const scheduledPosts = posts.filter(p => p.status === 'scheduled').length;
  const postedThisMonth = posts.filter(p => {
    try {
      const date = parseISO(p.scheduled_date);
      const now = new Date();
      return p.status === 'posted' && 
             date.getMonth() === now.getMonth() && 
             date.getFullYear() === now.getFullYear();
    } catch {
      return false;
    }
  }).length;

  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client?.company_name || 'Cliente';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-slate-200 rounded animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-32 bg-slate-100 rounded-xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500">Visão geral da sua agência</p>
        </div>
        <Link to={createPageUrl('Clients')}>
          <Button className="bg-blue-500 hover:bg-blue-600">
            <Plus className="w-4 h-4 mr-2" />
            Novo Cliente
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Clientes Ativos"
          value={activeClients}
          icon={Users}
          iconBg="bg-blue-50"
          iconColor="text-blue-500"
        />
        <StatCard
          title="Posts Hoje"
          value={todayPosts.length}
          icon={Calendar}
          iconBg="bg-purple-50"
          iconColor="text-purple-500"
        />
        <StatCard
          title="Agendados"
          value={scheduledPosts}
          icon={Clock}
          iconBg="bg-orange-50"
          iconColor="text-orange-500"
        />
        <StatCard
          title="Postados (Mês)"
          value={postedThisMonth}
          icon={TrendingUp}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Posts */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-slate-900">Postagens de Hoje</h2>
                <p className="text-sm text-slate-500">{format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}</p>
              </div>
              <Link to={createPageUrl('Calendar')}>
                <Button variant="ghost" size="sm">
                  Ver Calendário
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
            
            <div className="divide-y divide-slate-100">
              {todayPosts.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="text-slate-500">Nenhuma postagem agendada para hoje</p>
                </div>
              ) : (
                todayPosts.map(post => (
                  <div key={post.id} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                      {post.media_url ? (
                        <img 
                          src={post.media_url} 
                          alt={post.title}
                          className="w-14 h-14 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-lg bg-slate-100 flex items-center justify-center">
                          <Sparkles className="w-5 h-5 text-slate-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 truncate">{post.title}</p>
                        <p className="text-sm text-slate-500">{getClientName(post.client_id)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        {post.scheduled_time && (
                          <span className="text-sm text-slate-500">{post.scheduled_time}</span>
                        )}
                        <Badge className={cn("text-xs", statusConfig[post.status]?.color)}>
                          {statusConfig[post.status]?.label}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Recent Clients */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Clientes Recentes</h2>
            <Link to={createPageUrl('Clients')}>
              <Button variant="ghost" size="sm">
                Ver Todos
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
          
          <div className="divide-y divide-slate-100">
            {clients.slice(0, 5).map(client => (
              <div key={client.id} className="p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  {client.logo_url ? (
                    <img 
                      src={client.logo_url} 
                      alt={client.company_name}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-medium">
                      {client.company_name?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">{client.company_name}</p>
                    <p className="text-sm text-slate-500 truncate">{client.user_email}</p>
                  </div>
                  <Badge 
                    variant="secondary"
                    className={cn(
                      "text-xs",
                      client.status === 'active' 
                        ? "bg-emerald-50 text-emerald-600" 
                        : "bg-slate-50 text-slate-600"
                    )}
                  >
                    {client.status === 'active' ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              </div>
            ))}

            {clients.length === 0 && (
              <div className="p-8 text-center">
                <p className="text-slate-500">Nenhum cliente cadastrado</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}