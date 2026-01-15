import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createPageUrl } from '../utils';
import { format } from 'date-fns';
import { 
  Mail, 
  Link as LinkIcon, 
  CheckCircle, 
  Loader2,
  FileText,
  Copy,
  Check,
  Printer
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageHeader from '../components/ui/PageHeader';
import StatusBadge from '../components/ui/StatusBadge';
import InvoiceTemplate from '../components/InvoiceTemplate';

export default function InvoiceDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const invoiceId = urlParams.get('id');
  const queryClient = useQueryClient();
  const invoiceRef = useRef(null);

  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  const { data: invoice, isLoading } = useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: async () => {
      const invoices = await base44.entities.Invoice.filter({ id: invoiceId });
      return invoices[0];
    },
    enabled: !!invoiceId,
  });

  const { data: client } = useQuery({
    queryKey: ['client', invoice?.client_id],
    queryFn: async () => {
      const clients = await base44.entities.Client.filter({ id: invoice.client_id });
      return clients[0];
    },
    enabled: !!invoice?.client_id,
  });

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const response = await base44.functions.invoke('getMyData', { entity: 'Settings', query: {} });
      return response.data.data?.[0];
    },
    enabled: !!user,
  });

  // Handle body overflow and hide app when print preview is open
  useEffect(() => {
    if (showPrintPreview) {
      document.body.style.overflow = 'hidden';
      document.body.classList.add('print-preview-active');
    } else {
      document.body.style.overflow = '';
      document.body.classList.remove('print-preview-active');
    }
    return () => {
      document.body.style.overflow = '';
      document.body.classList.remove('print-preview-active');
    };
  }, [showPrintPreview]);

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Invoice.update(invoiceId, data),
    onSuccess: () => queryClient.invalidateQueries(['invoice', invoiceId]),
  });

  const handleSendEmail = async () => {
    if (!client?.email) {
      alert('Client does not have an email address');
      return;
    }

    setSending(true);
    
    const itemsList = invoice.line_items?.map(
      item => `• ${item.description}: £${item.total.toFixed(2)}`
    ).join('\n') || '';

    const emailBody = `
Dear ${client.name},

Please find below your invoice from Annie McAndrew Vet Physio.

Invoice Number: ${invoice.invoice_number}
Date: ${format(new Date(invoice.created_date), 'MMMM d, yyyy')}
Due Date: ${invoice.due_date ? format(new Date(invoice.due_date), 'MMMM d, yyyy') : 'N/A'}

Items:
${itemsList}

Total Amount: £${invoice.total_amount.toFixed(2)}

Payment Details:
Account Name: ${settings?.bank_account_name || 'Annie McAndrew Ltd'}
Sort Code: ${settings?.bank_sort_code || '60-83-71'}
Account No: ${settings?.bank_account_number || '58786706'}

${invoice.notes ? `Notes: ${invoice.notes}` : ''}

Payment due on receipt of invoice.

Thank you for your business.

Best regards,
Annie McAndrew Vet Physio
    `.trim();

    await base44.integrations.Core.SendEmail({
      to: client.email,
      subject: `Invoice ${invoice.invoice_number} - Annie McAndrew Vet Physio`,
      body: emailBody,
    });

    await updateMutation.mutateAsync({ status: 'sent' });
    setSending(false);
  };

  const handleCopyLink = () => {
    const paymentLink = `${window.location.origin}${createPageUrl(`PayInvoice?id=${invoiceId}`)}`;
    navigator.clipboard.writeText(paymentLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleMarkPaid = () => {
    updateMutation.mutate({ 
      status: 'paid',
      paid_date: format(new Date(), 'yyyy-MM-dd')
    });
  };

  const handlePrint = () => {
    setShowPrintPreview(true);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!invoice) {
    return <div>Invoice not found</div>;
  }

  // Print preview mode - render as portal to completely cover screen
  if (showPrintPreview) {
    return ReactDOM.createPortal(
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 999999,
        background: 'white',
        overflow: 'auto',
        margin: 0,
        padding: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div className="print:hidden" style={{
          position: 'fixed',
          top: 16,
          right: 16,
          zIndex: 100000,
          display: 'flex',
          gap: 8
        }}>
          <Button
            onClick={() => window.print()}
            className="bg-emerald-600 hover:bg-emerald-700 shadow-lg"
          >
            <Printer size={18} className="mr-2" />
            Print
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowPrintPreview(false)}
            className="bg-white shadow-lg"
          >
            Back
          </Button>
        </div>
        <InvoiceTemplate
          ref={invoiceRef}
          invoice={invoice}
          client={client}
          settings={settings}
        />
      </div>,
      document.body
    );
  }

  return (
    <div className="pb-6">
      <PageHeader 
        title={`Invoice ${invoice.invoice_number || ''}`}
        subtitle={client?.name}
        backTo="Invoices"
      />

      {/* Status Banner */}
      <div className={`
        rounded-2xl p-5 mb-6 flex items-center gap-4
        ${invoice.status === 'paid' 
          ? 'bg-emerald-50 border border-emerald-200' 
          : invoice.status === 'sent'
          ? 'bg-blue-50 border border-blue-200'
          : 'bg-stone-100 border border-stone-200'
        }
      `}>
        <div className={`
          w-12 h-12 rounded-xl flex items-center justify-center
          ${invoice.status === 'paid' 
            ? 'bg-emerald-100' 
            : invoice.status === 'sent'
            ? 'bg-blue-100'
            : 'bg-stone-200'
          }
        `}>
          {invoice.status === 'paid' ? (
            <CheckCircle className="w-6 h-6 text-emerald-600" />
          ) : (
            <FileText className={`w-6 h-6 ${invoice.status === 'sent' ? 'text-blue-600' : 'text-stone-600'}`} />
          )}
        </div>
        <div>
          <StatusBadge status={invoice.status} />
          {invoice.paid_date && (
            <p className="text-sm text-emerald-600 mt-1">
              Paid on {format(new Date(invoice.paid_date), 'MMMM d, yyyy')}
            </p>
          )}
        </div>
      </div>

      {/* Invoice Details */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 mb-4">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-sm text-stone-500">Invoice Date</p>
            <p className="font-medium text-stone-800">
              {format(new Date(invoice.created_date), 'MMM d, yyyy')}
            </p>
          </div>
          <div>
            <p className="text-sm text-stone-500">Due Date</p>
            <p className="font-medium text-stone-800">
              {invoice.due_date ? format(new Date(invoice.due_date), 'MMM d, yyyy') : '-'}
            </p>
          </div>
        </div>

        {/* Line Items */}
        <div className="border-t border-stone-100 pt-4">
          <h4 className="font-semibold text-stone-800 mb-3">Items</h4>
          <div className="space-y-3">
            {invoice.line_items?.map((item, index) => (
              <div 
                key={index}
                className="flex items-center justify-between py-2"
              >
                <div className="flex-1">
                  <p className="font-medium text-stone-700">{item.description}</p>
                  <p className="text-sm text-stone-500">
                    {item.quantity} × £{item.unit_price?.toFixed(2)}
                  </p>
                </div>
                <p className="font-medium text-stone-800">
                  £{item.total?.toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Total */}
        <div className="border-t border-stone-200 mt-4 pt-4">
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold text-stone-800">Total</span>
            <span className="text-2xl font-bold text-emerald-600">
              £{invoice.total_amount?.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="border-t border-stone-100 mt-4 pt-4">
            <p className="text-sm text-stone-500 mb-1">Notes</p>
            <p className="text-stone-700">{invoice.notes}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="space-y-3">
        {/* Print/View Invoice Button - Always visible */}
        <Button 
          onClick={handlePrint}
          variant="outline"
          className="w-full rounded-xl h-12 border-2 border-stone-300 hover:bg-stone-50"
        >
          <Printer size={20} className="mr-2" />
          View / Print Invoice
        </Button>

        {invoice.status === 'draft' && (
          <Button 
            onClick={handleSendEmail}
            disabled={sending || !client?.email}
            className="w-full bg-emerald-600 hover:bg-emerald-700 rounded-xl h-12 font-semibold"
          >
            {sending ? (
              <Loader2 size={20} className="animate-spin mr-2" />
            ) : (
              <Mail size={20} className="mr-2" />
            )}
            Send Invoice by Email
          </Button>
        )}

        {invoice.status !== 'paid' && (
          <>
            <Button 
              variant="outline"
              onClick={handleCopyLink}
              className="w-full rounded-xl h-12 border-2"
            >
              {copied ? (
                <>
                  <Check size={18} className="mr-2 text-emerald-600" />
                  Copied!
                </>
              ) : (
                <>
                  <LinkIcon size={18} className="mr-2" />
                  Copy Payment Link
                </>
              )}
            </Button>

            <Button 
              variant="outline"
              onClick={handleMarkPaid}
              disabled={updateMutation.isPending}
              className="w-full rounded-xl h-12 border-2 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
            >
              {updateMutation.isPending ? (
                <Loader2 size={18} className="animate-spin mr-2" />
              ) : (
                <CheckCircle size={18} className="mr-2" />
              )}
              Mark as Paid
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
