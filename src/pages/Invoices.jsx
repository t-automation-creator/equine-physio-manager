import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { format } from 'date-fns';
import { FileText, ChevronRight } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import StatusBadge from '../components/ui/StatusBadge';

export default function Invoices() {
  const [filter, setFilter] = useState('all');

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => base44.entities.Invoice.filter({ created_by: user.email }, '-created_date'),
    enabled: !!user,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.filter({ created_by: user.email }),
    enabled: !!user,
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

  const filterTabs = [
    { value: 'all', label: 'All' },
    { value: 'draft', label: 'Draft' },
    { value: 'sent', label: 'Sent' },
    { value: 'paid', label: 'Paid' },
  ];

  return (
    <div className="pb-6">
      <PageHeader title="Invoices" />

      {/* Filter Tabs - CVS Style Pill Buttons */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {filterTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`
              px-4 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-2
              ${filter === tab.value 
                ? 'bg-cvs-blue text-white' 
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }
            `}
          >
            {tab.label}
            <span className={`
              text-xs px-2 py-0.5 rounded-full
              ${filter === tab.value 
                ? 'bg-white/20 text-white' 
                : 'bg-gray-100 text-gray-500'
              }
            `}>
              {totalsByStatus[tab.value]}
            </span>
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 h-24 animate-pulse" />
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
                className="block bg-white rounded-2xl border border-gray-200 p-4 hover:shadow-card-hover transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-gray-900">
                        {invoice.invoice_number || 'Draft Invoice'}
                      </h3>
                      <StatusBadge status={invoice.status} />
                    </div>
                    <p className="text-gray-700 font-medium">{client?.name || 'Unknown Client'}</p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(invoice.created_date), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-bold text-gray-900">
                      £{invoice.total_amount?.toFixed(2)}
                    </span>
                    <ChevronRight size={20} className="text-gray-400" />
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
