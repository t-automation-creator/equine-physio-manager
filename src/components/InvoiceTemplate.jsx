import React, { forwardRef } from 'react';
import { format } from 'date-fns';

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
      className="bg-[#f5f0eb] w-[210mm] h-[297mm] mx-auto relative flex flex-col"
      style={{
        fontFamily: 'Arial, sans-serif',
        maxWidth: '210mm',
        maxHeight: '297mm',
        minHeight: '297mm',
        pageBreakAfter: 'always'
      }}
    >
      {/* Main Content */}
      <div className="flex-1 p-10">
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
            </tbody>
          </table>
        </div>

        {/* Payment Details and Total */}
        <div className="flex justify-between items-end">
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
      <div className="bg-[#2d2926] text-white px-10 py-4 flex justify-between items-center text-sm">
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
