import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Building2, Calendar, BarChart3, MoreVertical, Trash2, Edit } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export default function ClientCard({ client, onEdit, onDelete, postsCount = 0 }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            {client.logo_url ? (
              <img 
                src={client.logo_url} 
                alt={client.company_name}
                className="w-14 h-14 rounded-xl object-cover"
              />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xl font-bold">
                {client.company_name?.[0]?.toUpperCase() || 'C'}
              </div>
            )}
            <div>
              <h3 className="font-semibold text-slate-900 text-lg">{client.company_name}</h3>
              <p className="text-sm text-slate-500">{client.user_email}</p>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(client)}>
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete(client)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <Badge 
            variant="secondary"
            className={cn(
              "text-xs",
              client.status === 'active' 
                ? "bg-emerald-50 text-emerald-600 border-emerald-200" 
                : "bg-slate-50 text-slate-600 border-slate-200"
            )}
          >
            {client.status === 'active' ? 'Ativo' : 'Inativo'}
          </Badge>
          {client.brand_voice && (
            <Badge variant="outline" className="text-xs">
              {client.brand_voice}
            </Badge>
          )}
        </div>

        {client.company_objective && (
          <p className="text-sm text-slate-600 line-clamp-2 mb-4">
            {client.company_objective}
          </p>
        )}

        <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
          <Link 
            to={createPageUrl(`Calendar?clientId=${client.id}`)}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-blue-500 transition-colors"
          >
            <Calendar className="w-4 h-4" />
            <span>{postsCount} posts</span>
          </Link>
          <Link 
            to={createPageUrl(`Reports?clientId=${client.id}`)}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-blue-500 transition-colors"
          >
            <BarChart3 className="w-4 h-4" />
            <span>Relatórios</span>
          </Link>
        </div>
      </div>
    </div>
  );
}