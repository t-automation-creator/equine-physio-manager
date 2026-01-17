import AppointmentDetail from './pages/AppointmentDetail';
import Appointments from './pages/Appointments';
import ClientDetail from './pages/ClientDetail';
import Clients from './pages/Clients';
import CreateInvoice from './pages/CreateInvoice';
import EditClient from './pages/EditClient';
import EditHorse from './pages/EditHorse';
import EditYard from './pages/EditYard';
import Home from './pages/Home';
import HorseDetail from './pages/HorseDetail';
import InviteUserSetup from './pages/InviteUserSetup';
import InvoiceDetail from './pages/InvoiceDetail';
import Invoices from './pages/Invoices';
import NewAppointment from './pages/NewAppointment';
import NewClient from './pages/NewClient';
import NewHorse from './pages/NewHorse';
import NewYard from './pages/NewYard';
import Payments from './pages/Payments';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import TreatmentEntry from './pages/TreatmentEntry';
import TreatmentSummary from './pages/TreatmentSummary';
import YardDetail from './pages/YardDetail';
import Yards from './pages/Yards';
import index from './pages/index';
import Horses from './pages/Horses';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AppointmentDetail": AppointmentDetail,
    "Appointments": Appointments,
    "ClientDetail": ClientDetail,
    "Clients": Clients,
    "CreateInvoice": CreateInvoice,
    "EditClient": EditClient,
    "EditHorse": EditHorse,
    "EditYard": EditYard,
    "Home": Home,
    "HorseDetail": HorseDetail,
    "InviteUserSetup": InviteUserSetup,
    "InvoiceDetail": InvoiceDetail,
    "Invoices": Invoices,
    "NewAppointment": NewAppointment,
    "NewClient": NewClient,
    "NewHorse": NewHorse,
    "NewYard": NewYard,
    "Payments": Payments,
    "Profile": Profile,
    "Settings": Settings,
    "TreatmentEntry": TreatmentEntry,
    "TreatmentSummary": TreatmentSummary,
    "YardDetail": YardDetail,
    "Yards": Yards,
    "index": index,
    "Horses": Horses,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};