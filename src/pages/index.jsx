import Layout from "../Layout.jsx";

import AppointmentDetail from "./AppointmentDetail";

import Appointments from "./Appointments";

import ClientDetail from "./ClientDetail";

import Clients from "./Clients";

import CreateInvoice from "./CreateInvoice";

import EditClient from "./EditClient";

import EditHorse from "./EditHorse";

import EditYard from "./EditYard";

import Home from "./Home";

import HorseDetail from "./HorseDetail";

import InvoiceDetail from "./InvoiceDetail";

import Invoices from "./Invoices";

import NewAppointment from "./NewAppointment";

import NewClient from "./NewClient";

import NewHorse from "./NewHorse";

import NewYard from "./NewYard";

import Payments from "./Payments";

import Profile from "./Profile";

import TreatmentEntry from "./TreatmentEntry";

import TreatmentSummary from "./TreatmentSummary";

import YardDetail from "./YardDetail";

import Yards from "./Yards";

import AdminImport from "./AdminImport";

import AnnieImport from "./AnnieImport";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    AppointmentDetail: AppointmentDetail,
    
    Appointments: Appointments,
    
    ClientDetail: ClientDetail,
    
    Clients: Clients,
    
    CreateInvoice: CreateInvoice,
    
    EditClient: EditClient,
    
    EditHorse: EditHorse,
    
    EditYard: EditYard,
    
    Home: Home,
    
    HorseDetail: HorseDetail,
    
    InvoiceDetail: InvoiceDetail,
    
    Invoices: Invoices,
    
    NewAppointment: NewAppointment,
    
    NewClient: NewClient,
    
    NewHorse: NewHorse,
    
    NewYard: NewYard,
    
    Payments: Payments,
    
    Profile: Profile,
    
    TreatmentEntry: TreatmentEntry,
    
    TreatmentSummary: TreatmentSummary,
    
    YardDetail: YardDetail,
    
    Yards: Yards,
    
    AdminImport: AdminImport,

    AnnieImport: AnnieImport,

}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<AppointmentDetail />} />
                
                
                <Route path="/AppointmentDetail" element={<AppointmentDetail />} />
                
                <Route path="/Appointments" element={<Appointments />} />
                
                <Route path="/ClientDetail" element={<ClientDetail />} />
                
                <Route path="/Clients" element={<Clients />} />
                
                <Route path="/CreateInvoice" element={<CreateInvoice />} />
                
                <Route path="/EditClient" element={<EditClient />} />
                
                <Route path="/EditHorse" element={<EditHorse />} />
                
                <Route path="/EditYard" element={<EditYard />} />
                
                <Route path="/Home" element={<Home />} />
                
                <Route path="/HorseDetail" element={<HorseDetail />} />
                
                <Route path="/InvoiceDetail" element={<InvoiceDetail />} />
                
                <Route path="/Invoices" element={<Invoices />} />
                
                <Route path="/NewAppointment" element={<NewAppointment />} />
                
                <Route path="/NewClient" element={<NewClient />} />
                
                <Route path="/NewHorse" element={<NewHorse />} />
                
                <Route path="/NewYard" element={<NewYard />} />
                
                <Route path="/Payments" element={<Payments />} />
                
                <Route path="/Profile" element={<Profile />} />
                
                <Route path="/TreatmentEntry" element={<TreatmentEntry />} />
                
                <Route path="/TreatmentSummary" element={<TreatmentSummary />} />
                
                <Route path="/YardDetail" element={<YardDetail />} />
                
                <Route path="/Yards" element={<Yards />} />
                
                <Route path="/AdminImport" element={<AdminImport />} />

                <Route path="/AnnieImport" element={<AnnieImport />} />

            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}