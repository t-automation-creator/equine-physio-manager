import React, { forwardRef } from 'react';
import { format } from 'date-fns';

const InvoiceTemplate = forwardRef(({ invoice, client, settings }, ref) => {
  // Default business info - these can be extended in settings later
  const businessInfo = {
    name: settings?.business_name || 'Annie McAndrew Ltd',
    address: settings?.business_address || 'Corner Barn, Case Lane, Hatton, Warwickshire',
    registration: settings?.business_registration || '15693468',
    email: settings?.business_email || 'annievetphysio@gmail.com',
    phone: settings?.business_phone || '+44 7946854950',
    bankName: settings?.bank_account_name || 'Annie McAndrew Ltd',
    sortCode: settings?.bank_sort_code || '60-83-71',
    accountNo: settings?.bank_account_number || '58786706',
  };

  const colorSchemes = {
    blue: { primary: '#0066cc', secondary: '#004999' },
    green: { primary: '#059669', secondary: '#047857' },
    purple: { primary: '#7c3aed', secondary: '#6d28d9' },
    red: { primary: '#dc2626', secondary: '#b91c1c' },
    orange: { primary: '#ea580c', secondary: '#c2410c' },
    teal: { primary: '#0d9488', secondary: '#0f766e' },
  };

  const colors = colorSchemes[settings?.color_scheme] || colorSchemes.blue;

  const invoiceDate = invoice?.created_date 
    ? format(new Date(invoice.created_date), 'dd/MM/yy')
    : format(new Date(), 'dd/MM/yy');
  
  const dueDate = invoice?.due_date 
    ? format(new Date(invoice.due_date), 'dd/MM/yy')
    : invoiceDate;

  return (
    <div
      ref={ref}
      className="bg-white w-full md:w-[210mm] min-h-screen md:h-[297mm] relative flex flex-col print:m-0 print:absolute print:inset-0 print:w-[210mm] print:h-[297mm] mx-auto border border-gray-200"
      style={{
        fontFamily: 'Arial, sans-serif',
        pageBreakAfter: 'always'
      }}
    >
      {/* Main Content */}
      <div className="flex-1 p-4 md:p-10">
        {/* Logo */}
        {settings?.logo_url && (
          <div className="mb-8">
            <img 
              src={settings.logo_url} 
              alt={businessInfo.name}
              className="h-16 md:h-20 object-contain"
            />
          </div>
        )}

        {/* Invoice Title and Client Info */}
        <div 
          className="flex flex-col md:flex-row justify-between items-start gap-6 md:gap-0 mb-10 pb-8 border-b-2"
          style={{ borderColor: colors.primary }}
        >
          <div>
            <h2 className="text-3xl md:text-5xl font-bold text-black mb-6 tracking-tight">INVOICE</h2>
            <div className="space-y-2 text-sm md:text-base text-black">
              <div className="flex gap-4">
                <span className="font-bold w-28">Invoice Date:</span>
                <span>{invoiceDate}</span>
              </div>
              <div className="flex gap-4">
                <span className="font-bold w-28">Due Date:</span>
                <span>{dueDate}</span>
              </div>
            </div>
          </div>
          <div className="text-left md:text-right">
            <p className="text-xs md:text-sm font-bold text-black mb-3 tracking-wider">BILL TO</p>
            <p className="text-lg md:text-2xl font-bold text-black mb-1">{client?.name || 'Client Name'}</p>
            <p className="text-sm md:text-base text-black">{client?.email || ''}</p>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="mb-10 md:mb-12">
          <table className="w-full">
            <thead>
              <tr className="text-white" style={{ backgroundColor: colors.primary }}>
                <th className="text-left py-3 md:py-4 px-3 md:px-4 font-bold text-xs md:text-sm tracking-wider">DESCRIPTION</th>
                <th className="text-center py-3 md:py-4 px-3 md:px-4 font-bold text-xs md:text-sm tracking-wider">PRICE</th>
                <th className="text-center py-3 md:py-4 px-3 md:px-4 font-bold text-xs md:text-sm tracking-wider">QTY</th>
                <th className="text-right py-3 md:py-4 px-3 md:px-4 font-bold text-xs md:text-sm tracking-wider">AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              {invoice?.line_items?.map((item, index) => (
                <tr key={index} className="border-b border-gray-300">
                  <td className="py-4 md:py-5 px-3 md:px-4 text-black text-sm md:text-base">{item.description}</td>
                  <td className="py-4 md:py-5 px-3 md:px-4 text-center text-black text-sm md:text-base">£{item.unit_price?.toFixed(0) || item.unit_price}</td>
                  <td className="py-4 md:py-5 px-3 md:px-4 text-center text-black text-sm md:text-base">{item.quantity}</td>
                  <td className="py-4 md:py-5 px-3 md:px-4 text-right text-black font-semibold text-sm md:text-base">£{item.total?.toFixed(0) || item.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Payment Details and Total */}
        <div 
          className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 md:gap-0 pt-6 border-t-2"
          style={{ borderColor: colors.primary }}
        >
          <div className="space-y-6">
            <div>
              <h3 className="font-bold text-black mb-3 text-sm md:text-base tracking-wider">PAYMENT DETAILS</h3>
              <div className="space-y-2 text-black text-xs md:text-sm">
                <div className="flex gap-4">
                  <span className="w-28 font-semibold">Account Name:</span>
                  <span>{businessInfo.bankName}</span>
                </div>
                <div className="flex gap-4">
                  <span className="w-28 font-semibold">Sort Code:</span>
                  <span>{businessInfo.sortCode}</span>
                </div>
                <div className="flex gap-4">
                  <span className="w-28 font-semibold">Account No:</span>
                  <span>{businessInfo.accountNo}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-bold text-black mb-2 text-sm md:text-base tracking-wider">TERMS</h3>
              <p className="text-black text-xs md:text-sm">Payment due on receipt of invoice</p>
            </div>
          </div>

          <div 
            className="text-white px-6 md:px-8 py-4 md:py-6 w-full md:w-auto"
            style={{ backgroundColor: colors.primary }}
          >
            <div className="flex flex-col gap-2">
              <span className="font-bold text-xs md:text-sm tracking-widest">TOTAL DUE</span>
              <span className="text-3xl md:text-4xl font-bold">£{invoice?.total_amount?.toFixed(0) || '0'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div 
        className="text-white px-4 md:px-10 py-4 md:py-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-0 text-xs md:text-sm mt-auto"
        style={{ backgroundColor: colors.primary }}
      >
        <div>
          <p className="font-bold text-sm md:text-base mb-1">{businessInfo.name}</p>
          <p className="text-white/90 text-[10px] md:text-xs leading-relaxed">{businessInfo.address}</p>
          <p className="text-white/90 text-[10px] md:text-xs mt-1">Reg. No: {businessInfo.registration}</p>
        </div>
        <div className="text-left md:text-right">
          <p className="font-bold text-sm md:text-base mb-1">CONTACT</p>
          <p className="text-white/90 text-[10px] md:text-xs">{businessInfo.email}</p>
          <p className="text-white/90 text-[10px] md:text-xs mt-1">{businessInfo.phone}</p>
        </div>
      </div>
    </div>
  );
});

InvoiceTemplate.displayName = 'InvoiceTemplate';

export default InvoiceTemplate;