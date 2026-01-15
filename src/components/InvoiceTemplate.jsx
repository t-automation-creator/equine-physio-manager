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
      className="bg-[#f5f0eb] w-full md:w-[210mm] min-h-screen md:h-[297mm] relative flex flex-col print:m-0 print:absolute print:inset-0 print:w-[210mm] print:h-[297mm] mx-auto"
      style={{
        fontFamily: 'Arial, sans-serif',
        pageBreakAfter: 'always'
      }}
    >
      {/* Main Content */}
      <div className="flex-1 p-4 md:p-10">
        {/* Invoice Title and Client Info */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-4 md:gap-0 mb-8">
          <div>
            <h2 className="text-2xl md:text-4xl font-light text-gray-800 mb-4 md:mb-6">INVOICE</h2>
            <div className="space-y-1 text-sm md:text-base text-gray-700">
              <div className="flex gap-4 md:gap-8">
                <span className="font-semibold w-20 md:w-24">Invoice date:</span>
                <span>{invoiceDate}</span>
              </div>
              <div className="flex gap-4 md:gap-8">
                <span className="font-semibold w-20 md:w-24">Due date:</span>
                <span>{dueDate}</span>
              </div>
            </div>
          </div>
          <div className="text-left md:text-right">
            <p className="text-xs md:text-sm text-gray-500 mb-2">INVOICE TO</p>
            <p className="text-lg md:text-xl font-semibold text-gray-800">{client?.name || 'Client Name'}</p>
            <p className="text-sm md:text-base text-gray-600">{client?.email || ''}</p>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="mb-8 md:mb-12 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-300">
                <th className="text-left py-2 md:py-3 font-semibold text-gray-700 text-xs md:text-base">DESCRIPTIONS</th>
                <th className="text-center py-2 md:py-3 font-semibold text-gray-700 text-xs md:text-base">PRICE</th>
                <th className="text-center py-2 md:py-3 font-semibold text-gray-700 text-xs md:text-base">QTY</th>
                <th className="text-right py-2 md:py-3 font-semibold text-gray-700 text-xs md:text-base">AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              {invoice?.line_items?.map((item, index) => (
                <tr key={index} className="border-b border-gray-200">
                  <td className="py-3 md:py-4 text-gray-700 text-xs md:text-base">{item.description}</td>
                  <td className="py-3 md:py-4 text-center text-gray-700 text-xs md:text-base">£{item.unit_price?.toFixed(0) || item.unit_price}</td>
                  <td className="py-3 md:py-4 text-center text-gray-700 text-xs md:text-base">{item.quantity}</td>
                  <td className="py-3 md:py-4 text-right text-gray-700 text-xs md:text-base">£{item.total?.toFixed(0) || item.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Payment Details and Total */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 md:gap-0">
          <div>
            <h3 className="font-bold text-gray-800 mb-3 text-sm md:text-base">PAYMENT DETAILS</h3>
            <div className="space-y-1 text-gray-700 text-xs md:text-sm">
              <div className="flex gap-3 md:gap-4">
                <span className="w-24 md:w-28">Account Name:</span>
                <span className="font-semibold">{businessInfo.bankName}</span>
              </div>
              <div className="flex gap-3 md:gap-4">
                <span className="w-24 md:w-28">Sort Code:</span>
                <span className="font-semibold">{businessInfo.sortCode}</span>
              </div>
              <div className="flex gap-3 md:gap-4">
                <span className="w-24 md:w-28">Account No:</span>
                <span className="font-semibold">{businessInfo.accountNo}</span>
              </div>
            </div>
            
            <h3 className="font-bold text-gray-800 mt-6 mb-2 text-sm md:text-base">TERMS & CONDITIONS</h3>
            <p className="text-gray-600 text-xs md:text-sm">Payment due on receipt of invoice</p>
          </div>

          <div className="text-left md:text-right w-full md:w-auto">
            <div className="flex items-center justify-between md:justify-end gap-4 md:gap-8">
              <span className="text-gray-600 font-medium text-sm md:text-base">TOTAL</span>
              <span className="text-xl md:text-2xl font-bold text-gray-800">£{invoice?.total_amount?.toFixed(0) || '0'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-[#2d2926] text-white px-4 md:px-10 py-3 md:py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-0 text-xs md:text-sm">
        <div>
          <p className="font-medium">{businessInfo.name}</p>
          <p className="text-white/80 text-[10px] md:text-xs">{businessInfo.address}</p>
          <p className="text-white/80 text-[10px] md:text-xs">Registration Number: {businessInfo.registration}</p>
        </div>
        <div className="text-left md:text-right">
          <p className="font-medium">CONTACT:</p>
          <p className="text-white/80 text-[10px] md:text-xs">{businessInfo.email}</p>
          <p className="text-white/80 text-[10px] md:text-xs">{businessInfo.phone}</p>
        </div>
      </div>
    </div>
  );
});

InvoiceTemplate.displayName = 'InvoiceTemplate';

export default InvoiceTemplate;