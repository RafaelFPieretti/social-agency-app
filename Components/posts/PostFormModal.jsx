import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Upload, Loader2, Image, Video, X, Plus } from 'lucide-react';
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

const statusOptions = [
  { value: 'idea', label: 'Ideia' },
  { value: 'production', label: 'Em Produção' },
  { value: 'approved', label: 'Aprovado' },
  { value: 'scheduled', label: 'Agendado' },
  { value: 'posted', label: 'Postado' },
];

const platformOptions = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'twitter', label: 'Twitter/X' },
];

export default function PostFormModal({ open, onClose, post, clientId, onSave, isAdmin = true, clients = [] }) {
  const [formData, setFormData] = useState({
    client_id: clientId || '',
    title: '',
    caption: '',
    media_url: '',
    media_urls: [],
    media_type: 'image',
    scheduled_date: '',
    scheduled_time: '',
    status: 'idea',
    platform: 'instagram',
    comments: []
  });
  const [loading, setLoading] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  useEffect(() => {
    if (post) {
      setFormData({
        client_id: post.client_id || clientId || '',
        title: post.title || '',
        caption: post.caption || '',
        media_url: post.media_url || '',
        media_urls: post.media_urls || [],
        media_type: post.media_type || 'image',
        scheduled_date: post.scheduled_date || '',
        scheduled_time: post.scheduled_time || '',
        status: post.status || 'idea',
        platform: post.platform || 'instagram',
        comments: post.comments || []
      });
    } else {
      setFormData({
        client_id: clientId || '',
        title: '',
        caption: '',
        media_url: '',
        media_urls: [],
        media_type: 'image',
        scheduled_date: '',
        scheduled_time: '',
        status: 'idea',
        platform: 'instagram',
        comments: []
      });
    }
  }, [post, clientId, open]);

  const handleMediaUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setUploadingMedia(true);
    try {
      const currentCount = formData.media_urls.length + (formData.media_url ? 1 : 0);
      const remainingSlots = 20 - currentCount;
      const filesToUpload = files.slice(0, remainingSlots);

      for (const file of filesToUpload) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        const isVideo = file.type.startsWith('video/');
        
        if (!formData.media_url && formData.media_urls.length === 0) {
          setFormData(prev => ({ 
            ...prev, 
            media_url: file_url,
            media_type: isVideo ? 'video' : (filesToUpload.length > 1 ? 'carousel' : 'image')
          }));
        } else {
          setFormData(prev => ({ 
            ...prev, 
            media_urls: [...prev.media_urls, file_url],
            media_type: 'carousel'
          }));
        }
      }
    } catch (error) {
      console.error('Error uploading media:', error);
    } finally {
      setUploadingMedia(false);
    }
  };

  const removeMedia = (index) => {
    if (index === -1) {
      // Remove main media
      const newUrls = [...formData.media_urls];
      const newMain = newUrls.shift() || '';
      setFormData(prev => ({ 
        ...prev, 
        media_url: newMain,
        media_urls: newUrls,
        media_type: newUrls.length > 0 ? 'carousel' : (newMain ? 'image' : 'image')
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        media_urls: prev.media_urls.filter((_, i) => i !== index),
        media_type: prev.media_urls.length <= 1 && prev.media_url ? 'image' : 'carousel'
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving post:', error);
    } finally {
      setLoading(false);
    }
  };

  const availableStatuses = isAdmin 
    ? statusOptions 
    : statusOptions.filter(s => s.value !== 'posted');

  const allMediaUrls = [
    ...(formData.media_url ? [formData.media_url] : []),
    ...formData.media_urls
  ];

  const canAddMore = allMediaUrls.length < 20;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {post ? 'Editar Postagem' : 'Nova Postagem'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Client Selection - only for admin */}
          {isAdmin && clients.length > 0 && (
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
          )}

          {/* Media Upload - Multiple Images */}
          <div className="space-y-2">
            <Label>Mídia ({allMediaUrls.length}/20)</Label>
            <div className="flex flex-wrap gap-2">
              {allMediaUrls.map((url, index) => (
                <div key={index} className="relative w-20 h-20 rounded-lg overflow-hidden bg-slate-100">
                  <img 
                    src={url} 
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="absolute top-0.5 right-0.5 h-5 w-5"
                    onClick={() => removeMedia(index === 0 ? -1 : index - 1)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                  {index === 0 && allMediaUrls.length > 1 && (
                    <span className="absolute bottom-0.5 left-0.5 text-[10px] bg-black/60 text-white px-1 rounded">
                      Capa
                    </span>
                  )}
                </div>
              ))}
              
              {canAddMore && (
                <label className="w-20 h-20 rounded-lg border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:border-blue-300 transition-colors">
                  {uploadingMedia ? (
                    <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                  ) : (
                    <>
                      <Plus className="w-5 h-5 text-slate-400" />
                      <span className="text-[10px] text-slate-500 mt-1">Adicionar</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    className="hidden"
                    onChange={handleMediaUpload}
                  />
                </label>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Adicione até 20 imagens. A primeira será a capa.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Título ou descrição curta do post"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="caption">Legenda</Label>
            <Textarea
              id="caption"
              value={formData.caption}
              onChange={(e) => setFormData(prev => ({ ...prev, caption: e.target.value }))}
              placeholder="Escreva a legenda completa do post..."
              rows={5}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="scheduled_date">Data *</Label>
              <Input
                id="scheduled_date"
                type="date"
                value={formData.scheduled_date}
                onChange={(e) => setFormData(prev => ({ ...prev, scheduled_date: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scheduled_time">Horário</Label>
              <Input
                id="scheduled_time"
                type="time"
                value={formData.scheduled_time}
                onChange={(e) => setFormData(prev => ({ ...prev, scheduled_time: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Plataforma</Label>
              <Select
                value={formData.platform}
                onValueChange={(value) => setFormData(prev => ({ ...prev, platform: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {platformOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
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
                  {availableStatuses.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !formData.client_id}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {post ? 'Salvar Alterações' : 'Criar Postagem'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}