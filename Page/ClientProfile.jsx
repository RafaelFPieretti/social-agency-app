import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { 
  Building2, 
  Save, 
  Loader2, 
  Target, 
  Package, 
  Users, 
  MessageSquare,
  Upload,
  CheckCircle
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
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const brandVoiceOptions = [
  { value: 'formal', label: 'Formal', description: 'Linguagem profissional e corporativa' },
  { value: 'informal', label: 'Informal', description: 'Comunicação casual e descontraída' },
  { value: 'divertido', label: 'Divertido', description: 'Tom leve com humor e criatividade' },
  { value: 'inspirador', label: 'Inspirador', description: 'Mensagens motivacionais e empoderadoras' },
  { value: 'técnico', label: 'Técnico', description: 'Foco em detalhes e especificações' },
  { value: 'amigável', label: 'Amigável', description: 'Próximo e acolhedor com o público' },
];

export default function ClientProfile() {
  const [user, setUser] = useState(null);
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [saved, setSaved] = useState(false);
  
  const [formData, setFormData] = useState({
    company_objective: '',
    products_services: '',
    target_audience: '',
    brand_voice: '',
    brand_voice_custom: '',
    logo_url: ''
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
        setFormData({
          company_objective: clientData.company_objective || '',
          products_services: clientData.products_services || '',
          target_audience: clientData.target_audience || '',
          brand_voice: clientData.brand_voice || '',
          brand_voice_custom: clientData.brand_voice_custom || '',
          logo_url: clientData.logo_url || ''
        });
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const handleSave = async () => {
    if (!client) return;
    
    setSaving(true);
    try {
      await base44.entities.Client.update(client.id, formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setSaving(false);
    }
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
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <Building2 className="w-8 h-8 text-slate-400" />
        </div>
        <h2 className="text-xl font-semibold text-slate-900 mb-2">Perfil não encontrado</h2>
        <p className="text-slate-500 max-w-md">
          Seu perfil de cliente ainda não foi configurado. Entre em contato com a agência para configurar sua conta.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Meu Perfil</h1>
          <p className="text-slate-500">Mantenha as informações da sua marca atualizadas</p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className={cn(
            "transition-all",
            saved ? "bg-green-500 hover:bg-green-600" : "bg-blue-500 hover:bg-blue-600"
          )}
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : saved ? (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Salvo!
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Salvar Alterações
            </>
          )}
        </Button>
      </div>

      {/* Company Info Card */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center gap-6 mb-8">
          <div className="relative">
            {formData.logo_url ? (
              <img 
                src={formData.logo_url} 
                alt={client.company_name}
                className="w-24 h-24 rounded-xl object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-3xl font-bold">
                {client.company_name?.[0]?.toUpperCase()}
              </div>
            )}
            {uploadingLogo && (
              <div className="absolute inset-0 bg-white/80 rounded-xl flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              </div>
            )}
            <label className="absolute -bottom-2 -right-2 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors">
              <Upload className="w-4 h-4 text-slate-600" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
              />
            </label>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900">{client.company_name}</h2>
            <p className="text-slate-500">{client.user_email}</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Company Objective */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-500" />
              <Label className="text-base font-medium">Objetivo da Empresa</Label>
            </div>
            <Textarea
              value={formData.company_objective}
              onChange={(e) => setFormData(prev => ({ ...prev, company_objective: e.target.value }))}
              placeholder="Descreva os principais objetivos da sua empresa nas redes sociais. Ex: Aumentar reconhecimento da marca, gerar leads qualificados, fortalecer relacionamento com clientes..."
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Products/Services */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-green-500" />
              <Label className="text-base font-medium">Produtos/Serviços</Label>
            </div>
            <Textarea
              value={formData.products_services}
              onChange={(e) => setFormData(prev => ({ ...prev, products_services: e.target.value }))}
              placeholder="Liste seus principais produtos ou serviços. Inclua detalhes que ajudem a agência a criar conteúdo relevante..."
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Target Audience */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-500" />
              <Label className="text-base font-medium">Público-Alvo / Persona</Label>
            </div>
            <Textarea
              value={formData.target_audience}
              onChange={(e) => setFormData(prev => ({ ...prev, target_audience: e.target.value }))}
              placeholder="Descreva seu cliente ideal: faixa etária, gênero, profissão, interesses, dores, desejos, comportamento de compra..."
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Brand Voice */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-orange-500" />
              <Label className="text-base font-medium">Tom de Voz da Marca</Label>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {brandVoiceOptions.map(option => (
                <div
                  key={option.value}
                  className={cn(
                    "p-4 rounded-xl border-2 cursor-pointer transition-all",
                    formData.brand_voice === option.value
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-100 hover:border-slate-200"
                  )}
                  onClick={() => setFormData(prev => ({ ...prev, brand_voice: option.value }))}
                >
                  <p className="font-medium text-slate-900">{option.label}</p>
                  <p className="text-xs text-slate-500 mt-1">{option.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Custom Brand Voice */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Descrição Personalizada do Tom de Voz</Label>
            <Textarea
              value={formData.brand_voice_custom}
              onChange={(e) => setFormData(prev => ({ ...prev, brand_voice_custom: e.target.value }))}
              placeholder="Adicione detalhes específicos sobre como sua marca deve se comunicar. Palavras a usar, evitar, exemplos de frases..."
              rows={3}
              className="resize-none"
            />
          </div>
        </div>
      </div>

      {/* Tips Card */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl border border-blue-100 p-6">
        <h3 className="font-semibold text-slate-900 mb-2">💡 Dica</h3>
        <p className="text-slate-600 text-sm">
          Quanto mais detalhadas forem as informações do seu perfil, melhor a agência poderá criar conteúdos alinhados com a identidade da sua marca. Mantenha sempre atualizado!
        </p>
      </div>
    </div>
  );
}