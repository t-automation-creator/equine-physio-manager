import Home from './pages/Home';
import Appointments from './pages/Appointments';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Appointments": Appointments,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};