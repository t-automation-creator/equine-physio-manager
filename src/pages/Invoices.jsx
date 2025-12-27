import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { format } from 'date-fns';
import { FileText, ChevronRight } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import StatusBadge from '../components/ui/StatusBadge';

export default function Invoices() {
  const [filter, setFilter] = useState('all');

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => base44.entities.Invoice.list('-created_date'),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
  });

  const getClient = (id) => clients.find(c => c.id === id);

  const filteredInvoices = invoices.filter(inv => 
    filter === 'all' || inv.status === filter
  );

  const totalsByStatus = {
    all: invoices.length,
    draft: invoices.filter(i => i.status === 'draft').length,
    sent: invoices.filter(i => i.status === 'sent').length,
    paid: invoices.filter(i => i.status === 'paid').length,
  };

  return (
    <div className="pb-6">
      <PageHeader title="Invoices" />

      <Tabs value={filter} onValueChange={setFilter} className="mb-6">
        <TabsList className="w-full bg-stone-100 p-1 rounded-xl">
          <TabsTrigger 
            value="all" 
            className="flex-1 rounded-lg data-[state=active]:bg-white text-sm"
          >
            All ({totalsByStatus.all})
          </TabsTrigger>
          <TabsTrigger 
            value="draft" 
            className="flex-1 rounded-lg data-[state=active]:bg-white text-sm"
          >
            Draft ({totalsByStatus.draft})
          </TabsTrigger>
          <TabsTrigger 
            value="sent" 
            className="flex-1 rounded-lg data-[state=active]:bg-white text-sm"
          >
            Sent ({totalsByStatus.sent})
          </TabsTrigger>
          <TabsTrigger 
            value="paid" 
            className="flex-1 rounded-lg data-[state=active]:bg-white text-sm"
          >
            Paid ({totalsByStatus.paid})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl h-24 animate-pulse" />
          ))}
        </div>
      ) : filteredInvoices.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No invoices found"
          description={filter === 'all' 
            ? "Create your first invoice after completing a treatment."
            : `No ${filter} invoices.`
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredInvoices.map((invoice) => {
            const client = getClient(invoice.client_id);
            return (
              <Link
                key={invoice.id}
                to={createPageUrl(`InvoiceDetail?id=${invoice.id}`)}
                className="block bg-white rounded-2xl border border-stone-200 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-stone-800">
                        {invoice.invoice_number || 'Draft Invoice'}
                      </h3>
                      <StatusBadge status={invoice.status} />
                    </div>
                    <p className="text-stone-600">{client?.name || 'Unknown Client'}</p>
                    <p className="text-sm text-stone-500">
                      {format(new Date(invoice.created_date), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-stone-800">
                      £{invoice.total_amount?.toFixed(2)}
                    </span>
                    <ChevronRight size={20} className="text-stone-400" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}