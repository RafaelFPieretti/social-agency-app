import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Image, 
  Video, 
  MessageCircle, 
  MoreVertical, 
  Edit, 
  Trash2,
  CheckCircle,
  Clock,
  Sparkles,
  Send
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const statusConfig = {
  idea: { label: 'Ideia', color: 'bg-purple-50 text-purple-600 border-purple-200', icon: Sparkles },
  production: { label: 'Em Produção', color: 'bg-yellow-50 text-yellow-600 border-yellow-200', icon: Clock },
  approved: { label: 'Aprovado', color: 'bg-blue-50 text-blue-600 border-blue-200', icon: CheckCircle },
  scheduled: { label: 'Agendado', color: 'bg-orange-50 text-orange-600 border-orange-200', icon: Clock },
  posted: { label: 'Postado', color: 'bg-emerald-50 text-emerald-600 border-emerald-200', icon: Send },
};

const platformIcons = {
  instagram: '📸',
  facebook: '👍',
  tiktok: '🎵',
  linkedin: '💼',
  twitter: '🐦',
}