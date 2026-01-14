import React, { forwardRef } from 'react';
import { format } from 'date-fns';
import invoiceHeaderImg from '../assets/invoice-header.jpg';

const InvoiceTemplate = forwardRef(({ invoice, client, settings }, ref) => {
  // Default business info - these can be extended in settings later
  const businessInfo = {
    name: settings?.business_name || 'Annie McAndrew Ltd',
    address: settings?.business_address || 'Corner Barn, Case Lane, Hatton, Warwickshire',
    registration: settings?.company_registration || '15693468',
    email: settings?.business_email || 'annievetphysio@gmail.com',
    phone: settings?.business_phone || '+44 7946854950',
    bankName: settings?.bank_account_name || 'Annie McAndrew Ltd',
    sortCode: settings?.bank_sort_code || '60-83-71',
    accountNo: settings?.bank_account_number || '58786706',
  };

  const invoiceDate = invoice?.created_date 
    ? format(new Date(invoice.created_date), 'dd/MM/yy')
    : format(new Date(), 'dd/MM/yy');
  
  const dueDate = invoice?.due_date 
    ? format(new Date(invoice.due_date), 'dd/MM/yy')
    : invoiceDate;

  return (
    <div 
      ref={ref}
      className="bg-[#f5f0eb] min-h-[297mm] w-[210mm] mx-auto relative"
      style={{ fontFamily: 'Arial, sans-serif' }}
    >
      {/* Header Banner */}
      <div className="relative h-[140px] overflow-hidden">
        <img 
          src={invoiceHeaderImg}
          alt="Annie McAndrew Vet Physio"
          className="absolute inset-0 w-full h-full object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-transparent" />
        <div className="relative flex items-center justify-center h-full">
          <div className="text-center text-white">
            <div className="flex items-center justify-center gap-8">
              <div className="w-16 h-[1px] bg-white/60" />
              <div>
                <h1 className="text-3xl tracking-wider" style={{ fontFamily: 'Georgia, serif' }}>
                  ANNIE McANDREW
                </h1>
                <p className="text-sm tracking-[0.3em] mt-1">VET PHYSIO</p>
              </div>
              <div className="w-16 h-[1px] bg-white/60" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-12 py-8">
        {/* Invoice Title and Client Info */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-4xl font-light text-stone-800 mb-6">INVOICE</h2>
            <div className="space-y-1 text-stone-700">
              <div className="flex gap-8">
                <span className="font-semibold w-24">Invoice date:</span>
                <span>{invoiceDate}</span>
              </div>
              <div className="flex gap-8">
                <span className="font-semibold w-24">Due date:</span>
                <span>{dueDate}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-stone-500 mb-2">INVOICE TO</p>
            <p className="text-xl font-semibold text-stone-800">{client?.name || 'Client Name'}</p>
            <p className="text-stone-600">{client?.email || ''}</p>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="mb-12">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-stone-300">
                <th className="text-left py-3 font-semibold text-stone-700 w-1/2">DESCRIPTIONS</th>
                <th className="text-center py-3 font-semibold text-stone-700 w-1/6">PRICE</th>
                <th className="text-center py-3 font-semibold text-stone-700 w-1/6">QTY</th>
                <th className="text-right py-3 font-semibold text-stone-700 w-1/6">AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              {invoice?.line_items?.map((item, index) => (
                <tr key={index} className="border-b border-stone-200">
                  <td className="py-4 text-stone-700">{item.description}</td>
                  <td className="py-4 text-center text-stone-700">£{item.unit_price?.toFixed(0) || item.unit_price}</td>
                  <td className="py-4 text-center text-stone-700">{item.quantity}</td>
                  <td className="py-4 text-right text-stone-700">£{item.total?.toFixed(0) || item.total}</td>
                </tr>
              ))}
              {/* Empty rows for spacing if needed */}
              {(!invoice?.line_items || invoice.line_items.length < 3) && (
                <tr>
                  <td colSpan="4" className="py-8"></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Payment Details and Total */}
        <div className="flex justify-between items-end mt-auto">
          <div>
            <h3 className="font-bold text-stone-800 mb-3">PAYMENT DETAILS</h3>
            <div className="space-y-1 text-stone-700 text-sm">
              <div className="flex gap-4">
                <span className="w-28">Account Name:</span>
                <span className="font-semibold">{businessInfo.bankName}</span>
              </div>
              <div className="flex gap-4">
                <span className="w-28">Sort Code:</span>
                <span className="font-semibold">{businessInfo.sortCode}</span>
              </div>
              <div className="flex gap-4">
                <span className="w-28">Account No:</span>
                <span className="font-semibold">{businessInfo.accountNo}</span>
              </div>
            </div>
            
            <h3 className="font-bold text-stone-800 mt-6 mb-2">TERMS & CONDITIONS</h3>
            <p className="text-stone-600 text-sm">Payment due on receipt of invoice</p>
          </div>

          <div className="text-right">
            <div className="flex items-center gap-8">
              <span className="text-stone-600 font-medium">TOTAL</span>
              <span className="text-2xl font-bold text-stone-800">£{invoice?.total_amount?.toFixed(0) || '0'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 bg-[#2d2926] text-white px-12 py-4 flex justify-between items-center text-sm">
        <div>
          <p className="font-medium">{businessInfo.name}</p>
          <p className="text-white/80 text-xs">{businessInfo.address}</p>
          <p className="text-white/80 text-xs">Registration Number: {businessInfo.registration}</p>
        </div>
        <div className="text-right">
          <p className="font-medium">CONTACT:</p>
          <p className="text-white/80 text-xs">{businessInfo.email}</p>
          <p className="text-white/80 text-xs">{businessInfo.phone}</p>
        </div>
      </div>
    </div>
  );
});

InvoiceTemplate.displayName = 'InvoiceTemplate';

export default InvoiceTemplate;
