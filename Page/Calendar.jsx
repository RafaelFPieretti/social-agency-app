import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Grid3X3,
  List,
  Filter
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import PostCard from '../components/posts/PostCard';
import PostFormModal from '../components/posts/PostFormModal';
import { cn } from "@/lib/utils";

const statusConfig = {
  idea: { label: 'Ideia', color: 'bg-purple-500' },
  production: { label: 'Em Produção', color: 'bg-yellow-500' },
  approved: { label: 'Aprovado', color: 'bg-blue-500' },
  scheduled: { label: 'Agendado', color: 'bg-orange-500' },
  posted: { label: 'Postado', color: 'bg-emerald-500' },
};

export default function Calendar() {
  const [posts, setPosts] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState('calendar');
  const [selectedClient, setSelectedClient] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);

  const urlParams = new URLSearchParams(window.location.search);
  const clientIdFromUrl = urlParams.get('clientId');

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
      const [postsData, clientsData] = await Promise.all([
        base44.entities.Post.list('-scheduled_date'),
        base44.entities.Client.list()
      ]);
      setPosts(postsData);
      setClients(clientsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePost = async (data) => {
    if (editingPost) {
      await base44.entities.Post.update(editingPost.id, data);
    } else {
      await base44.entities.Post.create(data);
    }
    loadData();
    setEditingPost(null);
    setSelectedDate(null);
  };

  const handleDeletePost = async () => {
    if (deleteConfirm) {
      await base44.entities.Post.delete(deleteConfirm.id);
      loadData();
      setDeleteConfirm(null);
    }
  };

  const handleStatusChange = async (post, newStatus) => {
    await base44.entities.Post.update(post.id, { status: newStatus });
    loadData();
  };

  const filteredPosts = posts.filter(post => {
    const matchesClient = selectedClient === 'all' || post.client_id === selectedClient;
    const matchesStatus = selectedStatus === 'all' || post.status === selectedStatus;
    return matchesClient && matchesStatus;
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getPostsForDay = (day) => {
    return filteredPosts.filter(post => {
      try {
        return isSameDay(parseISO(post.scheduled_date), day);
      } catch {
        return false;
      }
    });
  };

  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client?.company_name || '';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-slate-200 rounded animate-pulse"></div>
        <div className="h-96 bg-slate-100 rounded-xl animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Calendário de Postagens</h1>
          <p className="text-slate-500">{filteredPosts.length} postagens</p>
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

          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
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

          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
            <Button
              variant={viewMode === 'calendar' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('calendar')}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>

          <Button 
            className="bg-blue-500 hover:bg-blue-600"
            onClick={() => {
              setEditingPost(null);
              setShowForm(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Postagem
          </Button>
        </div>
      </div>

      {viewMode === 'calendar' ? (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          {/* Calendar Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h2 className="text-lg font-semibold text-slate-900">
              {format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR })}
            </h2>
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
              <div key={day} className="p-3 text-center text-sm font-medium text-slate-500 border-b border-slate-100">
                {day}
              </div>
            ))}

            {monthDays.map((day, index) => {
              const dayPosts = getPostsForDay(day);
              const isToday = isSameDay(day, new Date());
              const firstDayOfWeek = monthDays[0].getDay();
              
              return (
                <React.Fragment key={day.toISOString()}>
                  {index === 0 && Array.from({ length: firstDayOfWeek }).map((_, i) => (
                    <div key={`empty-${i}`} className="min-h-[120px] p-2 border-b border-r border-slate-100 bg-slate-50"></div>
                  ))}
                  <div 
                    className={cn(
                      "min-h-[120px] p-2 border-b border-r border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors",
                      isToday && "bg-blue-50/50"
                    )}
                    onClick={() => {
                      setSelectedDate(format(day, 'yyyy-MM-dd'));
                      setEditingPost(null);
                      setShowForm(true);
                    }}
                  >
                    <div className={cn(
                      "text-sm font-medium mb-1",
                      isToday ? "text-blue-600" : "text-slate-700"
                    )}>
                      {format(day, 'd')}
                    </div>
                    <div className="space-y-1">
                      {dayPosts.slice(0, 3).map(post => (
                        <div 
                          key={post.id}
                          className={cn(
                            "text-xs p-1 rounded truncate cursor-pointer",
                            statusConfig[post.status]?.color,
                            "text-white"
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingPost(post);
                            setShowForm(true);
                          }}
                        >
                          {post.title}
                        </div>
                      ))}
                      {dayPosts.length > 3 && (
                        <div className="text-xs text-slate-500 text-center">
                          +{dayPosts.length - 3} mais
                        </div>
                      )}
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredPosts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              onEdit={(p) => {
                setEditingPost(p);
                setShowForm(true);
              }}
              onDelete={(p) => setDeleteConfirm(p)}
              onStatusChange={handleStatusChange}
              isAdmin={true}
            />
          ))}
        </div>
      )}

      {/* Post Form Modal */}
      <PostFormModal
        open={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingPost(null);
          setSelectedDate(null);
        }}
        post={editingPost ? editingPost : (selectedDate ? { scheduled_date: selectedDate } : null)}
        clientId={selectedClient !== 'all' ? selectedClient : ''}
        onSave={handleSavePost}
        isAdmin={true}
        clients={clients}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Postagem</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a postagem "{deleteConfirm?.title}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeletePost}
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