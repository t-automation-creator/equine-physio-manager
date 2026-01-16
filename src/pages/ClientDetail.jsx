import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import {
  Phone,
  Mail,
  ChevronRight,
  Plus,
  Edit,
  Loader2,
  AlertCircle,
  FileText,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';

export default function ClientDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const clientId = urlParams.get('id');

  console.log('ClientDetail mounted, clientId:', clientId);

  const { data: client, isLoading: clientLoading, isError, error } = useQuery({
    queryKey: ['client', clientId],
    queryFn: async () => {
      console.log('Fetching client...');
      const clients = await base44.entities.Client.filter({ id: clientId });
      console.log('Client fetched:', clients[0]);
      return clients[0];
    },
    enabled: !!clientId,
  });

  const { data: horses = [], isLoading: horsesLoading, isError: horsesError } = useQuery({
    queryKey: ['horses', clientId],
    queryFn: async () => {
      console.log('Fetching horses for client...');
      const allHorses = await base44.entities.Horse.filter({ owner_id: clientId });
      console.log('Horses fetched:', allHorses);
      return allHorses || [];
    },
    enabled: !!clientId,
  });

  const { data: yards = [] } = useQuery({
    queryKey: ['yards'],
    queryFn: async () => {
      console.log('Fetching yards...');
      const allYards = await base44.entities.Yard.list();
      console.log('Yards fetched:', allYards);
      return allYards || [];
    },
  });

  const getYard = (id) => yards.find(y => y.id === id);

  const isLoading = clientLoading || horsesLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-cvs-blue" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="pb-6">
        <PageHeader title="Client" backTo="Clients" />
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <AlertCircle className="w-12 h-12 text-cvs-red mx-auto mb-3" />
          <h3 className="font-bold text-red-800 mb-2">Failed to load client</h3>
          <p className="text-red-600 text-sm">{error?.message || 'An unexpected error occurred'}</p>
        </div>
      </div>
    );
  }

  if (!clientId) {
    return (
      <div className="pb-6">
        <PageHeader title="Client" backTo="Clients" />
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 text-center">
          <h3 className="font-bold text-gray-800 mb-2">No client ID provided</h3>
          <p className="text-gray-600 text-sm">Please select a client from the Clients page.</p>
        </div>
      </div>
    );
  }

  if (!client && !isLoading) {
    return (
      <div className="pb-6">
        <PageHeader title="Client" backTo="Clients" />
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 text-center">
          <h3 className="font-bold text-gray-800 mb-2">Client not found</h3>
          <p className="text-gray-600 text-sm">The client you're looking for doesn't exist or has been deleted.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-6">
      <PageHeader 
        title={client.name}
        backTo="Clients"
        action={
          <Link to={createPageUrl(`EditClient?id=${clientId}`)}>
            <Button variant="outline" size="lg">
              <Edit size={18} />
              Edit
            </Button>
          </Link>
        }
      />

      {/* Contact Info Card */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-4">
        <div className="p-5 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">Contact Information</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {client.phone && (
            <a 
              href={`tel:${client.phone}`}
              className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 bg-cvs-blue/10 rounded-lg flex items-center justify-center">
                <Phone size={18} className="text-cvs-blue" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium text-gray-900">{client.phone}</p>
              </div>
              <ChevronRight size={18} className="text-gray-400" />
            </a>
          )}
          {client.email && (
            <a 
              href={`mailto:${client.email}`}
              className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 bg-cvs-blue/10 rounded-lg flex items-center justify-center">
                <Mail size={18} className="text-cvs-blue" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium text-gray-900">{client.email}</p>
              </div>
              <ChevronRight size={18} className="text-gray-400" />
            </a>
          )}
        </div>
      </div>

      {/* Files Card */}
      {client.files && client.files.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-4">
          <div className="p-5 border-b border-gray-100">
            <h3 className="font-bold text-gray-900">Files</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {client.files.map((file, index) => (
              <a
                key={index}
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 bg-cvs-blue/10 rounded-lg flex items-center justify-center">
                  <FileText size={18} className="text-cvs-blue" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{file.name}</p>
                  {file.uploaded_date && (
                    <p className="text-sm text-gray-500">
                      {new Date(file.uploaded_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <Download size={18} className="text-gray-400" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Horses Card */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900">Horses</h3>
          <Link to={createPageUrl(`NewHorse?ownerId=${clientId}`)}>
            <Button size="sm">
              <Plus size={16} />
              Add
            </Button>
          </Link>
        </div>

        {horsesError ? (
          <div className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-cvs-red mx-auto mb-3" />
            <p className="text-red-600">Error loading horses</p>
          </div>
        ) : horses.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">No horses registered yet</p>
            <p className="text-gray-400 text-sm mt-1">Add a horse to get started</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {horses.map((horse) => {
              const yard = getYard(horse.yard_id);
              return (
                <Link
                  key={horse.id}
                  to={createPageUrl(`HorseDetail?id=${horse.id}`)}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <h4 className="font-semibold text-gray-900">{horse.name}</h4>
                    <div className="text-sm text-gray-500 mt-0.5">
                      {horse.discipline && <span>{horse.discipline}</span>}
                      {horse.discipline && yard && <span> • </span>}
                      {yard && <span>{yard.name}</span>}
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-gray-400" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}