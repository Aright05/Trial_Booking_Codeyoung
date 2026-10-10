import React, { useState, useEffect } from 'react';
import BookingPage from './pages/BookingPage';
import AdminPage from './pages/AdminPage';
import MentorPage from './pages/MentorPage';

function App() {
  const [currentView, setCurrentView] = useState(() => {
    // Support hash navigation: #admin, #mentor, #booking
    const hash = window.location.hash.toLowerCase();
    if (hash === '#admin' || window.location.pathname.includes('/admin')) {
      return 'admin';
    }
    if (hash === '#mentor' || hash === '#schedule' || window.location.pathname.includes('/mentor')) {
      return 'mentor';
    }
    return 'booking';
  });

  const navigateTo = (view) => {
    setCurrentView(view);
    if (view === 'admin') {
      window.location.hash = 'admin';
    } else if (view === 'mentor') {
      window.location.hash = 'mentor';
    } else {
      window.location.hash = '';
    }
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#admin') {
        setCurrentView('admin');
      } else if (hash === '#mentor' || hash === '#schedule') {
        setCurrentView('mentor');
      } else {
        setCurrentView('booking');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return (
    <div className="App min-h-screen">
      {currentView === 'admin' ? (
        <AdminPage onNavigateToBooking={() => navigateTo('booking')} onNavigate={navigateTo} />
      ) : currentView === 'mentor' ? (
        <MentorPage onNavigate={navigateTo} />
      ) : (
        <BookingPage onNavigate={navigateTo} />
      )}
    </div>
  );
}

export default App;

