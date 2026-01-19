import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { format, addDays } from 'date-fns';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import InvoiceTemplate from '../components/InvoiceTemplate';
import { 
  Plus, 
  Trash2, 
  FileText, 
  Loader2,
  Calculator
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import PageHeader from '../components/ui/PageHeader';

export default function CreateInvoice() {
  const urlParams = new URLSearchParams(window.location.search);
  const appointmentId = urlParams.get('appointmentId');
  const navigate = useNavigate();

  const [lineItems, setLineItems] = useState([]);
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState(format(addDays(new Date(), 14), 'yyyy-MM-dd'));

  const { data: appointment } = useQuery({
    queryKey: ['appointment', appointmentId],
    queryFn: async () => {
      const appts = await base44.entities.Appointment.filter({ id: appointmentId });
      return appts[0];
    },
    enabled: !!appointmentId,
  });

  const { data: client } = useQuery({
    queryKey: ['client', appointment?.client_id],
    queryFn: async () => {
      const clients = await base44.entities.Client.filter({ id: appointment.client_id });
      return clients[0];
    },
    enabled: !!appointment?.client_id,
  });

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: treatments = [] } = useQuery({
    queryKey: ['treatments', appointmentId],
    queryFn: async () => {
      const response = await base44.functions.invoke('getMyData', { entity: 'Treatment', query: { appointment_id: appointmentId } });
      return response.data.data;
    },
    enabled: !!appointmentId && !!user,
  });

  const { data: horses = [] } = useQuery({
    queryKey: ['horses'],
    queryFn: async () => {
      const response = await base44.functions.invoke('getMyData', { entity: 'Horse', query: {} });
      return response.data.data;
    },
    enabled: !!user,
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['allInvoices'],
    queryFn: async () => {
      const response = await base44.functions.invoke('getMyData', { entity: 'Invoice', query: {} });
      return response.data.data;
    },
    enabled: !!user,
  });

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const response = await base44.functions.invoke('getMyData', { entity: 'Settings', query: {} });
      const settingsData = response.data.data;
      if (settingsData.length === 0) {
        return base44.entities.Settings.create({
          default_treatment_price: 60,
          default_travel_charge: 0,
          invoice_terms_days: 14
        });
      }
      return settingsData[0];
    },
    enabled: !!user,
  });

  const { data: appointmentType } = useQuery({
    queryKey: ['appointmentType', appointment?.appointment_type_id],
    queryFn: async () => {
      const types = await base44.entities.AppointmentType.filter({ id: appointment.appointment_type_id });
      return types[0];
    },
    enabled: !!appointment?.appointment_type_id,
  });

  const getHorse = (id) => horses.find(h => h.id === id);

  // Auto-generate invoice line items from treatments
  useEffect(() => {
    if (treatments.length > 0 && lineItems.length === 0 && horses.length > 0 && settings) {
      // Use appointment type price if available, otherwise fall back to settings
      const price = appointmentType?.default_price || settings.default_treatment_price || 60;
      const serviceName = appointmentType?.name || 'Physiotherapy Treatment';

      const items = treatments.map(t => {
        const horse = getHorse(t.horse_id);
        const treatmentDesc = t.treatment_types?.length > 0
          ? t.treatment_types.join(', ')
          : serviceName;
        return {
          description: `${horse?.name || 'Horse'} - ${treatmentDesc}`,
          quantity: 1,
          unit_price: price,
          total: price,
        };
      });

      // Add travel charge if configured
      if (settings.default_travel_charge && settings.default_travel_charge > 0) {
        items.push({
          description: 'Travel / Call-out Charge',
          quantity: 1,
          unit_price: settings.default_travel_charge,
          total: settings.default_travel_charge,
        });
      }

      setLineItems(items);
      
      // Set notes from settings
      if (settings.invoice_notes) {
        setNotes(settings.invoice_notes);
      }
      
      // Set due date based on terms
      if (settings.invoice_terms_days) {
        setDueDate(format(addDays(new Date(), settings.invoice_terms_days), 'yyyy-MM-dd'));
      }
    }
  }, [treatments, horses, settings, appointmentType]);

  const createMutation = useMutation({
    mutationFn: async (invoiceData) => {
      const newInvoice = await base44.entities.Invoice.create(invoiceData);
      
      // Generate PDF and attach to client
      try {
        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.style.width = '210mm';
        document.body.appendChild(tempDiv);
        
        const root = ReactDOM.createRoot(tempDiv);
        root.render(
          <InvoiceTemplate
            invoice={newInvoice}
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
        const pdfFile = new File([pdfBlob], `Invoice-${newInvoice.invoice_number}.pdf`, { type: 'application/pdf' });
        const { file_url } = await base44.integrations.Core.UploadFile({ file: pdfFile });
        
        // Attach to client
        const updatedFiles = [
          ...(client.files || []),
          {
            name: `Invoice ${newInvoice.invoice_number}.pdf`,
            url: file_url,
            uploaded_date: new Date().toISOString()
          }
        ];
        await base44.entities.Client.update(client.id, { files: updatedFiles });
      } catch (error) {
        console.error('Failed to generate PDF:', error);
      }
      
      return newInvoice;
    },
    onSuccess: (data) => {
      navigate(createPageUrl(`InvoiceDetail?id=${data.id}`));
    },
  });

  const updateLineItem = (index, field, value) => {
    const newItems = [...lineItems];
    newItems[index][field] = value;
    if (field === 'quantity' || field === 'unit_price') {
      newItems[index].total = newItems[index].quantity * newItems[index].unit_price;
    }
    setLineItems(newItems);
  };

  const addLineItem = () => {
    setLineItems([...lineItems, { description: '', quantity: 1, unit_price: 0, total: 0 }]);
  };

  const removeLineItem = (index) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const totalAmount = lineItems.reduce((sum, item) => sum + (item.total || 0), 0);

  const handleCreate = () => {
    const invoiceNumber = `INV-${String(invoices.length + 1).padStart(4, '0')}`;
    
    createMutation.mutate({
      invoice_number: invoiceNumber,
      client_id: appointment?.client_id,
      appointment_id: appointmentId,
      line_items: lineItems,
      total_amount: totalAmount,
      status: 'draft',
      due_date: dueDate,
      notes,
    });
  };

  return (
    <div className="pb-6">
      <PageHeader 
        title="Create Invoice"
        subtitle={client?.name}
        backTo={`AppointmentDetail?id=${appointmentId}`}
      />

      <div className="space-y-6">
        {/* Auto-generated Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
          <p className="text-sm text-blue-800 font-medium">
            ✓ Invoice automatically generated from {treatments.length} treatment{treatments.length !== 1 ? 's' : ''} at £{(appointmentType?.default_price || settings?.default_treatment_price || 60).toFixed(2)} per horse
            {appointmentType?.name && <span className="text-blue-600"> ({appointmentType.name})</span>}
          </p>
        </div>

        {/* Client Info */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h3 className="font-bold text-gray-900 mb-3">Invoice For</h3>
          <p className="text-gray-900 font-medium">{client?.name}</p>
          {client?.email && <p className="text-gray-500 text-sm">{client.email}</p>}
          {client?.phone && <p className="text-gray-500 text-sm">{client.phone}</p>}
        </div>

        {/* Line Items */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">Line Items</h3>
            <span className="text-xs text-gray-500">Edit if needed</span>
          </div>
          
          <div className="space-y-4">
            {lineItems.map((item, index) => (
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
                    size="icon"
                    onClick={() => removeLineItem(index)}
                    className="text-cvs-red hover:text-cvs-red hover:bg-red-50"
                  >
                    <Trash2 size={18} />
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
                    <div className="h-14 flex items-center text-gray-900 font-semibold">
                      £{item.total.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Button
            variant="outline"
            onClick={addLineItem}
            className="w-full mt-4 border-dashed"
          >
            <Plus size={18} />
            Add Line Item
          </Button>
        </div>

        {/* Total */}
        <div className="bg-green-50 rounded-2xl border border-green-200 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calculator size={20} className="text-cvs-green" />
              <span className="font-bold text-gray-900">Total Amount</span>
            </div>
            <span className="text-2xl font-bold text-cvs-green">
              £{totalAmount.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Due Date */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <Label className="text-base font-bold text-gray-900 mb-3 block">
            Due Date
          </Label>
          <Input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>

        {/* Notes */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <Label className="text-base font-bold text-gray-900 mb-3 block">
            Notes (Optional)
          </Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any additional notes for the invoice..."
          />
        </div>

        {/* Create Button */}
        <Button 
          onClick={handleCreate}
          disabled={createMutation.isPending || lineItems.length === 0}
          className="w-full"
          size="lg"
        >
          {createMutation.isPending ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <FileText size={20} />
          )}
          Create Invoice
        </Button>
      </div>
    </div>
  );
}