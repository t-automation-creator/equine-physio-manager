import Home from './pages/Home';
import Appointments from './pages/Appointments';
import AppointmentDetail from './pages/AppointmentDetail';
import TreatmentEntry from './pages/TreatmentEntry';
import TreatmentSummary from './pages/TreatmentSummary';
import CreateInvoice from './pages/CreateInvoice';
import InvoiceDetail from './pages/InvoiceDetail';
import Invoices from './pages/Invoices';
import Payments from './pages/Payments';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Appointments": Appointments,
    "AppointmentDetail": AppointmentDetail,
    "TreatmentEntry": TreatmentEntry,
    "TreatmentSummary": TreatmentSummary,
    "CreateInvoice": CreateInvoice,
    "InvoiceDetail": InvoiceDetail,
    "Invoices": Invoices,
    "Payments": Payments,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};