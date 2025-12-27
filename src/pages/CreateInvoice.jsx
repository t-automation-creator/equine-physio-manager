import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { format, addDays } from 'date-fns';
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

  const { data: treatments = [] } = useQuery({
    queryKey: ['treatments', appointmentId],
    queryFn: () => base44.entities.Treatment.filter({ appointment_id: appointmentId }),
    enabled: !!appointmentId,
  });

  const { data: horses = [] } = useQuery({
    queryKey: ['horses'],
    queryFn: () => base44.entities.Horse.list(),
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['allInvoices'],
    queryFn: () => base44.entities.Invoice.list(),
  });

  const getHorse = (id) => horses.find(h => h.id === id);

  // Initialize line items from treatments
  useEffect(() => {
    if (treatments.length > 0 && lineItems.length === 0) {
      const items = treatments.map(t => {
        const horse = getHorse(t.horse_id);
        const treatmentDesc = t.treatment_types?.join(', ') || 'Physiotherapy Session';
        return {
          description: `${horse?.name || 'Horse'} - ${treatmentDesc}`,
          quantity: 1,
          unit_price: 75,
          total: 75,
        };
      });
      setLineItems(items);
    }
  }, [treatments, horses]);

  const createMutation = useMutation({
    mutationFn: async (invoiceData) => {
      return base44.entities.Invoice.create(invoiceData);
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
        {/* Client Info */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5">
          <h3 className="font-semibold text-stone-800 mb-3">Invoice For</h3>
          <p className="text-stone-700 font-medium">{client?.name}</p>
          {client?.email && <p className="text-stone-500 text-sm">{client.email}</p>}
          {client?.phone && <p className="text-stone-500 text-sm">{client.phone}</p>}
        </div>

        {/* Line Items */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5">
          <h3 className="font-semibold text-stone-800 mb-4">Line Items</h3>
          
          <div className="space-y-4">
            {lineItems.map((item, index) => (
              <div key={index} className="p-4 bg-stone-50 rounded-xl">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <Input
                    value={item.description}
                    onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                    placeholder="Description"
                    className="flex-1 rounded-lg"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeLineItem(index)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 size={18} />
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs text-stone-500">Qty</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateLineItem(index, 'quantity', parseInt(e.target.value) || 0)}
                      className="rounded-lg"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-stone-500">Price (£)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unit_price}
                      onChange={(e) => updateLineItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                      className="rounded-lg"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-stone-500">Total</Label>
                    <div className="h-10 flex items-center text-stone-700 font-medium">
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
            className="w-full mt-4 rounded-xl border-dashed"
          >
            <Plus size={18} className="mr-2" />
            Add Line Item
          </Button>
        </div>

        {/* Total */}
        <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calculator size={20} className="text-emerald-600" />
              <span className="font-semibold text-emerald-800">Total Amount</span>
            </div>
            <span className="text-2xl font-bold text-emerald-700">
              £{totalAmount.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Due Date */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5">
          <Label className="text-base font-semibold text-stone-800 mb-3 block">
            Due Date
          </Label>
          <Input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="rounded-xl"
          />
        </div>

        {/* Notes */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5">
          <Label className="text-base font-semibold text-stone-800 mb-3 block">
            Notes (Optional)
          </Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any additional notes for the invoice..."
            className="rounded-xl"
          />
        </div>

        {/* Create Button */}
        <Button 
          onClick={handleCreate}
          disabled={createMutation.isPending || lineItems.length === 0}
          className="w-full bg-emerald-600 hover:bg-emerald-700 rounded-xl h-14 text-lg"
        >
          {createMutation.isPending ? (
            <Loader2 size={20} className="animate-spin mr-2" />
          ) : (
            <FileText size={20} className="mr-2" />
          )}
          Create Invoice
        </Button>
      </div>
    </div>
  );
}