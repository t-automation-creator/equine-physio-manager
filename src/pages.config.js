import Home from './pages/Home';
import Appointments from './pages/Appointments';
import AppointmentDetail from './pages/AppointmentDetail';
import TreatmentEntry from './pages/TreatmentEntry';
import TreatmentSummary from './pages/TreatmentSummary';
import CreateInvoice from './pages/CreateInvoice';
import InvoiceDetail from './pages/InvoiceDetail';
import Invoices from './pages/Invoices';
import Payments from './pages/Payments';
import Clients from './pages/Clients';
import ClientDetail from './pages/ClientDetail';
import Yards from './pages/Yards';
import YardDetail from './pages/YardDetail';
import HorseDetail from './pages/HorseDetail';
import NewAppointment from './pages/NewAppointment';
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
    "Clients": Clients,
    "ClientDetail": ClientDetail,
    "Yards": Yards,
    "YardDetail": YardDetail,
    "HorseDetail": HorseDetail,
    "NewAppointment": NewAppointment,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};