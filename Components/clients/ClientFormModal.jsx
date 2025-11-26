import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Upload, Loader2 } from 'lucide-react';
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

const brandVoiceOptions = [
  { value: 'formal', label: 'Formal' },
  { value: 'informal', label: 'Informal' },
  { value: 'divertido', label: 'Divertido' },
  { value: 'inspirador', label: 'Inspirador' },
  { value: 'técnico', label: 'Técnico' },
  { value: 'amigável', label: 'Amigável' },
];

export default function ClientFormModal({ open, onClose, client, onSave }) {
  const [formData, setFormData] = useState({
    company_name: '',
    user_email: '',
    company_objective: '',
    products_services: '',
    target_audience: '',
    brand_voice: '',
    brand_voice_custom: '',
    logo_url: '',
    status: 'active'
  });
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    if (client) {
      setFormData({
        company_name: client.company_name || '',
        user_email: client.user_email || '',
        company_objective: client.company_objective || '',
        products_services: client.products_services || '',
        target_audience: client.target_audience || '',
        brand_voice: client.brand_voice || '',
        brand_voice_custom: client.brand_voice_custom || '',
        logo_url: client.logo_url || '',
        status: client.status || 'active'
      });
    } else {
      setFormData({
        company_name: '',
        user_email: '',
        company_objective: '',
        products_services: '',
        target_audience: '',
        brand_voice: '',
        brand_voice_custom: '',
        logo_url: '',
        status: 'active'
      });
    }
  }, [client, open]);

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, logo_url: file_url }));
    } catch (error) {
      console.error('Error uploading logo:', error);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving client:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {client ? 'Editar Cliente' : 'Novo Cliente'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Logo Upload */}
          <div className="flex items-center gap-6">
            <div className="relative">
              {formData.logo_url ? (
                <img 
                  src={formData.logo_url} 
                  alt="Logo"
                  className="w-20 h-20 rounded-xl object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-xl bg-slate-100 flex items-center justify-center">
                  <Upload className="w-6 h-6 text-slate-400" />
                </div>
              )}
              {uploadingLogo && (
                <div className="absolute inset-0 bg-white/80 rounded-xl flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="logo" className="cursor-pointer">
                <span className="text-sm text-blue-500 hover:text-blue-600">
                  {formData.logo_url ? 'Alterar logo' : 'Fazer upload do logo'}
                </span>
              </Label>
              <input
                id="logo"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
              />
              <p className="text-xs text-slate-500 mt-1">PNG, JPG até 5MB</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company_name">Nome da Empresa *</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                placeholder="Nome da empresa"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user_email">E-mail de Login *</Label>
              <Input
                id="user_email"
                type="email"
                value={formData.user_email}
                onChange={(e) => setFormData(prev => ({ ...prev, user_email: e.target.value }))}
                placeholder="cliente@email.com"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="company_objective">Objetivo da Empresa</Label>
            <Textarea
              id="company_objective"
              value={formData.company_objective}
              onChange={(e) => setFormData(prev => ({ ...prev, company_objective: e.target.value }))}
              placeholder="Descreva os objetivos principais da empresa nas redes sociais..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="products_services">Produtos/Serviços</Label>
            <Textarea
              id="products_services"
              value={formData.products_services}
              onChange={(e) => setFormData(prev => ({ ...prev, products_services: e.target.value }))}
              placeholder="Liste os principais produtos ou serviços oferecidos..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="target_audience">Público-Alvo / Persona</Label>
            <Textarea
              id="target_audience"
              value={formData.target_audience}
              onChange={(e) => setFormData(prev => ({ ...prev, target_audience: e.target.value }))}
              placeholder="Descreva o público-alvo ideal..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tom de Voz</Label>
              <Select
                value={formData.brand_voice}
                onValueChange={(value) => setFormData(prev => ({ ...prev, brand_voice: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tom de voz" />
                </SelectTrigger>
                <SelectContent>
                  {brandVoiceOptions.map(option => (
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
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="brand_voice_custom">Descrição Personalizada do Tom de Voz</Label>
            <Textarea
              id="brand_voice_custom"
              value={formData.brand_voice_custom}
              onChange={(e) => setFormData(prev => ({ ...prev, brand_voice_custom: e.target.value }))}
              placeholder="Detalhes adicionais sobre como a marca deve se comunicar..."
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {client ? 'Salvar Alterações' : 'Criar Cliente'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}