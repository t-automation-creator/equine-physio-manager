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
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';

// Helper to safely extract data from various API response formats
const extractData = (response, fallback = []) => {
  if (!response) return fallback;
  // Handle {data: [...]} format
  if (response.data !== undefined) return response.data || fallback;
  // Handle direct array/object format
  if (Array.isArray(response)) return response;
  return response;
};

export default function ClientDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const clientId = urlParams.get('id');

  const { data: client, isLoading, isError, error } = useQuery({
    queryKey: ['client', clientId],
    queryFn: async () => {
      try {
        const response = await base44.entities.Client.filter({ id: clientId });
        // Handle both array and object responses
        if (Array.isArray(response)) {
          return response[0] || null;
        }
        // Handle {data: [...]} format
        if (response?.data && Array.isArray(response.data)) {
          return response.data[0] || null;
        }
        // Handle direct object response
        return response || null;
      } catch (err) {
        console.error('Error fetching client:', err);
        throw err;
      }
    },
    enabled: !!clientId,
  });

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch (err) {
        console.error('Error fetching user:', err);
        return null;
      }
    },
  });

  const { data: horses = [], isLoading: isLoadingHorses } = useQuery({
    queryKey: ['horses', clientId],
    queryFn: async () => {
      try {
        const response = await base44.functions.invoke('getMyData', {
          entity: 'Horse',
          query: { owner_id: clientId }
        });
        return extractData(response, []);
      } catch (err) {
        console.error('Error fetching horses:', err);
        return [];
      }
    },
    enabled: !!clientId && !!user?.email,
  });

  const { data: yards = [] } = useQuery({
    queryKey: ['yards'],
    queryFn: async () => {
      try {
        const response = await base44.functions.invoke('getMyData', {
          entity: 'Yard',
          query: {}
        });
        return extractData(response, []);
      } catch (err) {
        console.error('Error fetching yards:', err);
        return [];
      }
    },
    enabled: !!user?.email,
  });

  const getYard = (id) => yards?.find(y => y?.id === id);

  const hasContactInfo = client?.phone || client?.email;
  const horseCount = horses?.length || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="pb-6">
        <PageHeader title="Client" backTo="Clients" />
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h3 className="font-semibold text-red-800 mb-2">Failed to load client</h3>
          <p className="text-red-600 text-sm">{error?.message || 'An unexpected error occurred'}</p>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="pb-6">
        <PageHeader title="Client" backTo="Clients" />
        <div className="bg-stone-50 border border-stone-200 rounded-2xl p-6 text-center">
          <User className="w-12 h-12 text-stone-400 mx-auto mb-3" />
          <h3 className="font-semibold text-stone-800 mb-2">Client not found</h3>
          <p className="text-stone-600 text-sm">The client you're looking for doesn't exist or has been deleted.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-6">
      <PageHeader
        title={client?.name || 'Client Details'}
        subtitle={horseCount > 0 ? `${horseCount} horse${horseCount !== 1 ? 's' : ''}` : undefined}
        backTo="Clients"
        action={
          <Link to={createPageUrl(`EditClient?id=${clientId}`)}>
            <Button variant="outline" className="rounded-xl">
              <Edit size={18} className="mr-2" />
              Edit
            </Button>
          </Link>
        }
      />

      {/* Contact Info */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 mb-4">
        <h3 className="font-semibold text-stone-800 mb-4">Contact Information</h3>
        {hasContactInfo ? (
          <div className="space-y-3">
            {client?.phone && (
              <a
                href={`tel:${client.phone}`}
                className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl hover:bg-stone-100 transition-colors"
              >
                <Phone size={20} className="text-emerald-600" />
                <span className="text-stone-700">{client.phone}</span>
              </a>
            )}
            {client?.email && (
              <a
                href={`mailto:${client.email}`}
                className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl hover:bg-stone-100 transition-colors"
              >
                <Mail size={20} className="text-emerald-600" />
                <span className="text-stone-700">{client.email}</span>
              </a>
            )}
          </div>
        ) : (
          <div className="text-center py-4 text-stone-500">
            <p>No contact information available</p>
          </div>
        )}
      </div>

      {/* Horses */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-stone-800">
            Horses {horseCount > 0 && <span className="text-stone-500 font-normal">({horseCount})</span>}
          </h3>
          <Link to={createPageUrl(`NewHorse?ownerId=${clientId}`)}>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 rounded-xl">
              <Plus size={16} className="mr-1" />
              Add
            </Button>
          </Link>
        </div>

        {isLoadingHorses ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
          </div>
        ) : horseCount === 0 ? (
          <div className="text-center py-8 text-stone-500">
            <p>No horses registered yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {horses.map((horse) => {
              const yard = getYard(horse?.yard_id);
              return (
                <Link
                  key={horse?.id}
                  to={createPageUrl(`HorseDetail?id=${horse?.id}`)}
                  className="flex items-center justify-between p-4 bg-stone-50 rounded-xl hover:bg-stone-100 transition-colors"
                >
                  <div>
                    <h4 className="font-medium text-stone-800">{horse?.name || 'Unnamed Horse'}</h4>
                    <div className="text-sm text-stone-500">
                      {horse?.discipline && <span>{horse.discipline}</span>}
                      {horse?.discipline && yard?.name && <span> • </span>}
                      {yard?.name && <span>{yard.name}</span>}
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-stone-400" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
