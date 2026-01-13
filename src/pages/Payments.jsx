import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { format, differenceInDays } from 'date-fns';
import { 
  CreditCard, 
  Clock, 
  AlertTriangle, 
  Mail, 
  Loader2,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import StatusBadge from '../components/ui/StatusBadge';

export default function Payments() {
  const queryClient = useQueryClient();

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => base44.entities.Invoice.list('-created_date'),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
  });

  const getClient = (id) => clients.find(c => c.id === id);

  const outstandingInvoices = invoices.filter(inv => inv.status !== 'paid');

  const [sendingReminder, setSendingReminder] = React.useState(null);

  const handleSendReminder = async (invoice) => {
    const client = getClient(invoice.client_id);
    if (!client?.email) {
      alert('Client does not have an email address');
      return;
    }

    setSendingReminder(invoice.id);

    const emailBody = `
Dear ${client.name},

This is a friendly reminder that invoice ${invoice.invoice_number} for £${invoice.total_amount?.toFixed(2)} is still outstanding.

Due Date: ${invoice.due_date ? format(new Date(invoice.due_date), 'MMMM d, yyyy') : 'N/A'}

Please arrange payment at your earliest convenience.

Thank you.

Best regards,
EquiPhysio
    `.trim();

    await base44.integrations.Core.SendEmail({
      to: client.email,
      subject: `Payment Reminder - Invoice ${invoice.invoice_number}`,
      body: emailBody,
    });

    setSendingReminder(null);
    alert('Reminder sent successfully!');
  };

  const totalOutstanding = outstandingInvoices.reduce(
    (sum, inv) => sum + (inv.total_amount || 0), 
    0
  );

  const overdueInvoices = outstandingInvoices.filter(inv => {
    if (!inv.due_date) return false;
    return differenceInDays(new Date(), new Date(inv.due_date)) > 0;
  });

  return (
    <div className="pb-6">
      <PageHeader title="Payments" />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-stone-200 p-4">
          <div className="flex items-center gap-2 text-stone-500 mb-2">
            <Clock size={18} />
            <span className="text-sm">Outstanding</span>
          </div>
          <p className="text-2xl font-bold text-stone-800">
            £{totalOutstanding.toFixed(2)}
          </p>
          <p className="text-sm text-stone-500">
            {outstandingInvoices.length} invoice{outstandingInvoices.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-4">
          <div className="flex items-center gap-2 text-amber-600 mb-2">
            <AlertTriangle size={18} />
            <span className="text-sm">Overdue</span>
          </div>
          <p className="text-2xl font-bold text-amber-600">
            {overdueInvoices.length}
          </p>
          <p className="text-sm text-stone-500">
            invoice{overdueInvoices.length !== 1 ? 's' : ''} overdue
          </p>
        </div>
      </div>

      {/* Outstanding Invoices */}
      <h2 className="font-semibold text-stone-800 mb-4">Outstanding Invoices</h2>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl h-32 animate-pulse" />
          ))}
        </div>
      ) : outstandingInvoices.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="All paid up!"
          description="You have no outstanding invoices. Great job!"
        />
      ) : (
        <div className="space-y-3">
          {outstandingInvoices.map((invoice) => {
            const client = getClient(invoice.client_id);
            const isOverdue = invoice.due_date && 
              differenceInDays(new Date(), new Date(invoice.due_date)) > 0;
            const daysOverdue = invoice.due_date 
              ? differenceInDays(new Date(), new Date(invoice.due_date))
              : 0;

            return (
              <div
                key={invoice.id}
                className={`
                  bg-white rounded-2xl border p-4
                  ${isOverdue ? 'border-amber-200' : 'border-stone-200'}
                `}
              >
                <Link
                  to={createPageUrl(`InvoiceDetail?id=${invoice.id}`)}
                  className="block mb-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-stone-800">
                          {invoice.invoice_number}
                        </h3>
                        <StatusBadge status={invoice.status} />
                        {isOverdue && (
                          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                            {daysOverdue} day{daysOverdue !== 1 ? 's' : ''} overdue
                          </span>
                        )}
                      </div>
                      <p className="text-stone-600">{client?.name}</p>
                      {invoice.due_date && (
                        <p className="text-sm text-stone-500">
                          Due: {format(new Date(invoice.due_date), 'MMM d, yyyy')}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-stone-800">
                        £{invoice.total_amount?.toFixed(2)}
                      </span>
                      <ChevronRight size={18} className="text-stone-400" />
                    </div>
                  </div>
                </Link>

                {invoice.status === 'sent' && client?.email && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSendReminder(invoice)}
                    disabled={sendingReminder === invoice.id}
                    className="w-full rounded-xl"
                  >
                    {sendingReminder === invoice.id ? (
                      <Loader2 size={16} className="animate-spin mr-2" />
                    ) : (
                      <Mail size={16} className="mr-2" />
                    )}
                    Send Reminder
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}