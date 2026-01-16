import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createPageUrl } from '../utils';
import { format } from 'date-fns';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { 
  Mail, 
  Link as LinkIcon, 
  CheckCircle, 
  Loader2,
  FileText,
  Copy,
  Check,
  Printer,
  Edit,
  Save,
  X as XIcon,
  Plus,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  const [isEditing, setIsEditing] = useState(false);
  const [editedLineItems, setEditedLineItems] = useState([]);

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
    onSuccess: () => {
      queryClient.invalidateQueries(['invoice', invoiceId]);
      setIsEditing(false);
    },
  });

  const updateLineItem = (index, field, value) => {
    const newItems = [...editedLineItems];
    newItems[index][field] = value;
    if (field === 'quantity' || field === 'unit_price') {
      newItems[index].total = newItems[index].quantity * newItems[index].unit_price;
    }
    setEditedLineItems(newItems);
  };

  const addLineItem = () => {
    setEditedLineItems([...editedLineItems, { description: '', quantity: 1, unit_price: 0, total: 0 }]);
  };

  const removeLineItem = (index) => {
    setEditedLineItems(editedLineItems.filter((_, i) => i !== index));
  };

  const editedTotal = editedLineItems.reduce((sum, item) => sum + (item.total || 0), 0);

  const handleStartEdit = () => {
    setEditedLineItems(JSON.parse(JSON.stringify(invoice.line_items || [])));
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedLineItems([]);
  };

  const handleSaveEdit = () => {
    updateMutation.mutate({
      line_items: editedLineItems,
      total_amount: editedTotal,
    });
  };

  const handleSendEmail = async () => {
    if (!client?.email) {
      alert('Client does not have an email address');
      return;
    }

    setSending(true);
    
    try {
      // Generate PDF
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.width = '210mm';
      document.body.appendChild(tempDiv);
      
      const root = ReactDOM.createRoot(tempDiv);
      root.render(
        <InvoiceTemplate
          invoice={invoice}
          client={client}
          settings={settings}
        />
      );
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const canvas = await html2canvas(tempDiv.firstChild, {
        scale: 2,
        useCORS: true,
        logging: false
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      const pdfBlob = pdf.output('blob');
      
      document.body.removeChild(tempDiv);
      
      // Upload PDF
      const pdfFile = new File([pdfBlob], `Invoice-${invoice.invoice_number}.pdf`, { type: 'application/pdf' });
      const { file_url } = await base44.integrations.Core.UploadFile({ file: pdfFile });
      
      // Attach to client
      const updatedFiles = [
        ...(client.files || []),
        {
          name: `Invoice ${invoice.invoice_number}.pdf`,
          url: file_url,
          uploaded_date: new Date().toISOString()
        }
      ];
      await base44.entities.Client.update(client.id, { files: updatedFiles });
      
      // Send email
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
      queryClient.invalidateQueries(['client', client.id]);
    } catch (error) {
      alert('Failed to send invoice: ' + error.message);
    } finally {
      setSending(false);
    }
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
        <Loader2 className="w-8 h-8 animate-spin text-cvs-blue" />
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
          >
            <Printer size={18} />
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
          ? 'bg-green-50 border border-green-200' 
          : invoice.status === 'sent'
          ? 'bg-blue-50 border border-blue-200'
          : 'bg-gray-100 border border-gray-200'
        }
      `}>
        <div className={`
          w-12 h-12 rounded-xl flex items-center justify-center
          ${invoice.status === 'paid' 
            ? 'bg-green-100' 
            : invoice.status === 'sent'
            ? 'bg-blue-100'
            : 'bg-gray-200'
          }
        `}>
          {invoice.status === 'paid' ? (
            <CheckCircle className="w-6 h-6 text-cvs-green" />
          ) : (
            <FileText className={`w-6 h-6 ${invoice.status === 'sent' ? 'text-cvs-blue' : 'text-gray-600'}`} />
          )}
        </div>
        <div>
          <StatusBadge status={invoice.status} />
          {invoice.paid_date && (
            <p className="text-sm text-cvs-green mt-1">
              Paid on {format(new Date(invoice.paid_date), 'MMMM d, yyyy')}
            </p>
          )}
        </div>
      </div>

      {/* Invoice Details */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-4">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-sm text-gray-500">Invoice Date</p>
            <p className="font-semibold text-gray-900">
              {format(new Date(invoice.created_date), 'MMM d, yyyy')}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Due Date</p>
            <p className="font-semibold text-gray-900">
              {invoice.due_date ? format(new Date(invoice.due_date), 'MMM d, yyyy') : '-'}
            </p>
          </div>
        </div>

        {/* Line Items */}
        <div className="border-t border-gray-100 pt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-gray-900">Items</h4>
            {!isEditing && invoice.status === 'draft' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleStartEdit}
              >
                <Edit size={16} />
                Edit
              </Button>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-4">
              {editedLineItems.map((item, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <Input
                      value={item.description}
                      onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                      placeholder="Description"
                      className="flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => removeLineItem(index)}
                      className="text-cvs-red hover:text-cvs-red hover:bg-red-50"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs text-gray-500">Qty</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateLineItem(index, 'quantity', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Price (£)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) => updateLineItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Total</Label>
                      <div className="h-10 flex items-center text-gray-900 font-semibold">
                        £{item.total.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                onClick={addLineItem}
                className="w-full border-dashed"
                size="sm"
              >
                <Plus size={16} />
                Add Line Item
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {invoice.line_items?.map((item, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between py-2"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-700">{item.description}</p>
                    <p className="text-sm text-gray-500">
                      {item.quantity} × £{item.unit_price?.toFixed(2)}
                    </p>
                  </div>
                  <p className="font-semibold text-gray-900">
                    £{item.total?.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Total */}
        <div className="border-t border-gray-200 mt-4 pt-4">
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-gray-900">Total</span>
            <span className="text-2xl font-bold text-cvs-green">
              £{isEditing ? editedTotal.toFixed(2) : invoice.total_amount?.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Edit Actions */}
        {isEditing && (
          <div className="border-t border-gray-100 mt-4 pt-4 flex gap-3">
            <Button
              onClick={handleSaveEdit}
              disabled={updateMutation.isPending || editedLineItems.length === 0}
              className="flex-1"
            >
              {updateMutation.isPending ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}
              Save Changes
            </Button>
            <Button
              variant="outline"
              onClick={handleCancelEdit}
              disabled={updateMutation.isPending}
            >
              <XIcon size={18} />
              Cancel
            </Button>
          </div>
        )}

        {/* Notes */}
        {invoice.notes && (
          <div className="border-t border-gray-100 mt-4 pt-4">
            <p className="text-sm text-gray-500 mb-1">Notes</p>
            <p className="text-gray-700">{invoice.notes}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="space-y-3">
        {/* Print/View Invoice Button - Always visible */}
        <Button 
          onClick={handlePrint}
          variant="outline"
          className="w-full"
          size="lg"
        >
          <Printer size={20} />
          View / Print Invoice
        </Button>

        {invoice.status === 'draft' && (
          <Button 
            onClick={handleSendEmail}
            disabled={sending || !client?.email}
            className="w-full"
            size="lg"
          >
            {sending ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Mail size={20} />
            )}
            Send Invoice by Email
          </Button>
        )}

        {invoice.status !== 'paid' && (
          <>
            <Button 
              variant="outline"
              onClick={handleCopyLink}
              className="w-full"
              size="lg"
            >
              {copied ? (
                <>
                  <Check size={18} className="text-cvs-green" />
                  Copied!
                </>
              ) : (
                <>
                  <LinkIcon size={18} />
                  Copy Payment Link
                </>
              )}
            </Button>

            <Button 
              variant="success"
              onClick={handleMarkPaid}
              disabled={updateMutation.isPending}
              className="w-full"
              size="lg"
            >
              {updateMutation.isPending ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <CheckCircle size={18} />
              )}
              Mark as Paid
            </Button>
          </>
        )}
      </div>
    </div>
  );
}