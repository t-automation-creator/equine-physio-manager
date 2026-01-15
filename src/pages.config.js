import Appointments from './pages/Appointments';
import ClientDetail from './pages/ClientDetail';
import Clients from './pages/Clients';
import Home from './pages/Home';
import Invoices from './pages/Invoices';
import NewClient from './pages/NewClient';
import NewYard from './pages/NewYard';
import Payments from './pages/Payments';
import Profile from './pages/Profile';
import Yards from './pages/Yards';
import index from './pages/index';
import AppointmentDetail from './pages/AppointmentDetail';
import CreateInvoice from './pages/CreateInvoice';
import EditClient from './pages/EditClient';
import EditHorse from './pages/EditHorse';
import EditYard from './pages/EditYard';
import HorseDetail from './pages/HorseDetail';
import InvoiceDetail from './pages/InvoiceDetail';
import NewAppointment from './pages/NewAppointment';
import NewHorse from './pages/NewHorse';
import TreatmentEntry from './pages/TreatmentEntry';
import TreatmentSummary from './pages/TreatmentSummary';
import YardDetail from './pages/YardDetail';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Appointments": Appointments,
    "ClientDetail": ClientDetail,
    "Clients": Clients,
    "Home": Home,
    "Invoices": Invoices,
    "NewClient": NewClient,
    "NewYard": NewYard,
    "Payments": Payments,
    "Profile": Profile,
    "Yards": Yards,
    "index": index,
    "AppointmentDetail": AppointmentDetail,
    "CreateInvoice": CreateInvoice,
    "EditClient": EditClient,
    "EditHorse": EditHorse,
    "EditYard": EditYard,
    "HorseDetail": HorseDetail,
    "InvoiceDetail": InvoiceDetail,
    "NewAppointment": NewAppointment,
    "NewHorse": NewHorse,
    "TreatmentEntry": TreatmentEntry,
    "TreatmentSummary": TreatmentSummary,
    "YardDetail": YardDetail,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};