import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  ChevronLeft, 
  ChevronRight, 
  Grid3X3,
  List,
  Filter,
  MessageCircle,
  Loader2,
  CheckCircle,
  Send
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import PostCard from '../components/posts/PostCard';
import { cn } from "@/lib/utils";

const statusConfig = {
  idea: { label: 'Ideia', color: 'bg-purple-500', textColor: 'bg-purple-50 text-purple-600' },
  production: { label: 'Em Produção', color: 'bg-yellow-500', textColor: 'bg-yellow-50 text-yellow-600' },
  approved: { label: 'Aprovado', color: 'bg-blue-500', textColor: 'bg-blue-50 text-blue-600' },
  scheduled: { label: 'Agendado', color: 'bg-orange-500', textColor: 'bg-orange-50 text-orange-600' },
  posted: { label: 'Postado', color: 'bg-emerald-500', textColor: 'bg-emerald-50 text-emerald-600' },
};

export default function ClientCalendar() {
  const [user, setUser] = useState(null);
  const [client, setClient] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState('calendar');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPost, setSelectedPost] = useState(null);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);

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
        
        const postsData = await base44.entities.Post.filter({ client_id: clientData.id }, '-scheduled_date');
        setPosts(postsData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!comment.trim() || !selectedPost) return;
    
    setSaving(true);
    try {
      const newComment = {
        author: user.full_name || user.email,
        text: comment,
        date: new Date().toISOString()
      };
      
      const updatedComments = [...(selectedPost.comments || []), newComment];
      await base44.entities.Post.update(selectedPost.id, { comments: updatedComments });
      
      setSelectedPost(prev => ({ ...prev, comments: updatedComments }));
      setComment('');
      loadData();
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedPost || selectedPost.status === 'approved' || selectedPost.status === 'posted') return;
    
    setSaving(true);
    try {
      await base44.entities.Post.update(selectedPost.id, { status: 'approved' });
      setSelectedPost(prev => ({ ...prev, status: 'approved' }));
      loadData();
    } catch (error) {
      console.error('Error approving post:', error);
    } finally {
      setSaving(false);
    }
  };

  const filteredPosts = posts.filter(post => {
    return selectedStatus === 'all' || post.status === selectedStatus;
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
          <h1 className="text-2xl font-bold text-slate-900">Calendário de Postagens</h1>
          <p className="text-slate-500">{filteredPosts.length} postagens agendadas</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-40">
              <Filter className="w-4 h-4 mr-2 text-slate-400" />
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
                    <div key={`empty-${i}`} className="min-h-[100px] p-2 border-b border-r border-slate-100 bg-slate-50"></div>
                  ))}
                  <div 
                    className={cn(
                      "min-h-[100px] p-2 border-b border-r border-slate-100",
                      isToday && "bg-blue-50/50"
                    )}
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
                          onClick={() => setSelectedPost(post)}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPosts.map(post => (
            <div 
              key={post.id} 
              onClick={() => setSelectedPost(post)}
              className="cursor-pointer"
            >
              <PostCard
                post={post}
                onEdit={() => setSelectedPost(post)}
                onDelete={() => {}}
                onStatusChange={() => {}}
                isAdmin={false}
              />
            </div>
          ))}
        </div>
      )}

      {/* Post Detail Modal */}
      <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedPost && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>{selectedPost.title}</span>
                  <Badge className={cn("text-xs", statusConfig[selectedPost.status]?.textColor)}>
                    {statusConfig[selectedPost.status]?.label}
                  </Badge>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Media */}
                {selectedPost.media_url && (
                  <div className="rounded-xl overflow-hidden bg-slate-100">
                    {selectedPost.media_type === 'video' ? (
                      <video 
                        src={selectedPost.media_url} 
                        controls
                        className="w-full max-h-80 object-contain"
                      />
                    ) : (
                      <img 
                        src={selectedPost.media_url} 
                        alt={selectedPost.title}
                        className="w-full max-h-80 object-contain"
                      />
                    )}
                  </div>
                )}

                {/* Details */}
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-slate-500 mb-1">Data de Publicação</p>
                    <p className="text-slate-900">
                      {format(parseISO(selectedPost.scheduled_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      {selectedPost.scheduled_time && ` às ${selectedPost.scheduled_time}`}
                    </p>
                  </div>

                  {selectedPost.caption && (
                    <div>
                      <p className="text-sm font-medium text-slate-500 mb-1">Legenda</p>
                      <p className="text-slate-900 whitespace-pre-wrap">{selectedPost.caption}</p>
                    </div>
                  )}
                </div>

                {/* Approve Button */}
                {selectedPost.status !== 'approved' && selectedPost.status !== 'posted' && selectedPost.status !== 'scheduled' && (
                  <Button 
                    onClick={handleApprove}
                    disabled={saving}
                    className="w-full bg-green-500 hover:bg-green-600"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4 mr-2" />
                    )}
                    Aprovar Postagem
                  </Button>
                )}

                {/* Comments Section */}
                <div className="border-t pt-4">
                  <h4 className="font-medium text-slate-900 mb-4 flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    Comentários ({selectedPost.comments?.length || 0})
                  </h4>

                  {/* Comments List */}
                  <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                    {selectedPost.comments?.map((c, idx) => (
                      <div key={idx} className="bg-slate-50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm text-slate-900">{c.author}</span>
                          <span className="text-xs text-slate-400">
                            {format(parseISO(c.date), "dd/MM 'às' HH:mm")}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600">{c.text}</p>
                      </div>
                    ))}
                    {(!selectedPost.comments || selectedPost.comments.length === 0) && (
                      <p className="text-sm text-slate-500 text-center py-4">
                        Nenhum comentário ainda
                      </p>
                    )}
                  </div>

                  {/* Add Comment */}
                  <div className="flex gap-2">
                    <Textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Adicione um comentário..."
                      rows={2}
                      className="resize-none"
                    />
                    <Button 
                      onClick={handleAddComment}
                      disabled={!comment.trim() || saving}
                      size="icon"
                      className="shrink-0"
                    >
                      {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}