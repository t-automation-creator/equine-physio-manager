import React, { useState, useEffect } from 'react';
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
  User,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';

// Helper to safely extract data from various API response formats
const extractData = (response, fallback = []) => {
  try {
    if (!response) return fallback;
    // Handle {data: [...]} format
    if (response?.data !== undefined) return response.data || fallback;
    // Handle direct array/object format
    if (Array.isArray(response)) return response;
    return response;
  } catch (err) {
    console.error('Error extracting data:', err);
    return fallback;
  }
};

// Error display component
const ErrorDisplay = ({ title, message, onRetry }) => (
  <div className="pb-6">
    <PageHeader title="Client" backTo="Clients" />
    <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
      <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
      <h3 className="font-semibold text-red-800 mb-2">{title}</h3>
      <p className="text-red-600 text-sm mb-4">{message}</p>
      {onRetry && (
        <Button
          onClick={onRetry}
          variant="outline"
          className="rounded-xl border-red-300 text-red-700 hover:bg-red-100"
        >
          <RefreshCw size={16} className="mr-2" />
          Try Again
        </Button>
      )}
    </div>
  </div>
);

// Inner component that does the actual rendering
function ClientDetailContent() {
  const [renderError, setRenderError] = useState(null);

  // Safely get URL params
  let clientId = null;
  try {
    const urlParams = new URLSearchParams(window.location.search);
    clientId = urlParams.get('id');
    console.log('ClientDetail: Loading client with ID:', clientId);
  } catch (err) {
    console.error('Error parsing URL params:', err);
    setRenderError('Failed to parse URL parameters');
  }

  const {
    data: client,
    isLoading,
    isError,
    error,
    refetch: refetchClient
  } = useQuery({
    queryKey: ['client', clientId],
    queryFn: async () => {
      console.log('ClientDetail: Fetching client data...');
      try {
        const response = await base44.entities.Client.filter({ id: clientId });
        console.log('ClientDetail: Client API response:', response);

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
        console.error('ClientDetail: Error fetching client:', err);
        throw err;
      }
    },
    enabled: !!clientId,
    retry: 1,
  });

  const {
    data: user,
    isError: isUserError,
    error: userError
  } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      console.log('ClientDetail: Fetching user data...');
      try {
        const result = await base44.auth.me();
        console.log('ClientDetail: User data received:', result?.email);
        return result;
      } catch (err) {
        console.error('ClientDetail: Error fetching user:', err);
        return null;
      }
    },
    retry: 1,
  });

  const {
    data: horses = [],
    isLoading: isLoadingHorses,
    isError: isHorsesError,
    error: horsesError
  } = useQuery({
    queryKey: ['horses', clientId],
    queryFn: async () => {
      console.log('ClientDetail: Fetching horses for client:', clientId);
      try {
        const response = await base44.functions.invoke('getMyData', {
          entity: 'Horse',
          query: { owner_id: clientId }
        });
        console.log('ClientDetail: Horses API response:', response);
        return extractData(response, []);
      } catch (err) {
        console.error('ClientDetail: Error fetching horses:', err);
        return [];
      }
    },
    enabled: !!clientId && !!user?.email,
    retry: 1,
  });

  const { data: yards = [] } = useQuery({
    queryKey: ['yards'],
    queryFn: async () => {
      console.log('ClientDetail: Fetching yards...');
      try {
        const response = await base44.functions.invoke('getMyData', {
          entity: 'Yard',
          query: {}
        });
        console.log('ClientDetail: Yards API response:', response);
        return extractData(response, []);
      } catch (err) {
        console.error('ClientDetail: Error fetching yards:', err);
        return [];
      }
    },
    enabled: !!user?.email,
    retry: 1,
  });

  // Safe yard lookup
  const getYard = (id) => {
    try {
      return yards?.find(y => y?.id === id) || null;
    } catch (err) {
      console.error('Error finding yard:', err);
      return null;
    }
  };

  // Safe computed values
  const hasContactInfo = !!(client?.phone || client?.email);
  const horseCount = Array.isArray(horses) ? horses.length : 0;

  // Handle render error state
  if (renderError) {
    return (
      <ErrorDisplay
        title="Rendering Error"
        message={renderError}
        onRetry={() => window.location.reload()}
      />
    );
  }

  // Handle missing clientId
  if (!clientId) {
    console.error('ClientDetail: No client ID provided in URL');
    return (
      <ErrorDisplay
        title="Invalid URL"
        message="No client ID was provided. Please go back and select a client."
      />
    );
  }

  // Handle loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  // Handle error state
  if (isError) {
    console.error('ClientDetail: Query error:', error);
    return (
      <ErrorDisplay
        title="Failed to load client"
        message={error?.message || 'An unexpected error occurred while loading the client.'}
        onRetry={() => refetchClient()}
      />
    );
  }

  // Handle client not found
  if (!client) {
    console.warn('ClientDetail: Client not found for ID:', clientId);
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

  // Main render - wrapped in try-catch for safety
  try {
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
          ) : isHorsesError ? (
            <div className="text-center py-8 text-red-500">
              <AlertCircle className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm">Failed to load horses</p>
            </div>
          ) : horseCount === 0 ? (
            <div className="text-center py-8 text-stone-500">
              <p>No horses registered yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {horses.map((horse, index) => {
                // Safe render for each horse
                if (!horse) return null;
                const yard = getYard(horse?.yard_id);
                return (
                  <Link
                    key={horse?.id || `horse-${index}`}
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
  } catch (err) {
    console.error('ClientDetail: Render error:', err);
    return (
      <ErrorDisplay
        title="Display Error"
        message={`Failed to display client details: ${err?.message || 'Unknown error'}`}
        onRetry={() => window.location.reload()}
      />
    );
  }
}

// Main exported component with error boundary wrapper
export default function ClientDetail() {
  const [hasError, setHasError] = useState(false);
  const [errorInfo, setErrorInfo] = useState(null);

  useEffect(() => {
    // Reset error state on mount
    setHasError(false);
    setErrorInfo(null);
  }, []);

  // Catch any errors that slip through
  if (hasError) {
    return (
      <ErrorDisplay
        title="Something went wrong"
        message={errorInfo || 'An unexpected error occurred while loading this page.'}
        onRetry={() => {
          setHasError(false);
          setErrorInfo(null);
          window.location.reload();
        }}
      />
    );
  }

  try {
    return <ClientDetailContent />;
  } catch (err) {
    console.error('ClientDetail: Top-level error:', err);
    // Set error state for next render
    setHasError(true);
    setErrorInfo(err?.message || 'Unknown error');
    return (
      <ErrorDisplay
        title="Failed to load page"
        message={err?.message || 'An unexpected error occurred.'}
        onRetry={() => window.location.reload()}
      />
    );
  }
}
