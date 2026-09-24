import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { KhataProvider, useKhata } from './context/KhataContext';
import { Customer } from './types/khata';
import { HomeView } from './components/HomeView';
import { CustomersView } from './components/CustomersView';
import { SettingsView } from './components/SettingsView';
import { CustomerKhataView } from './components/CustomerKhataView';
import { CustomerModal } from './components/CustomerModal';
import { PinLockScreen } from './components/PinLockScreen';
import { Navigation, TabType } from './components/Navigation';
import { LoginView } from './components/LoginView';
import { OfflineBanner } from './components/OfflineBanner';

function MainApp() {
  const { currentUser, authLoading } = useAuth();
  const { customers, isLocked } = useKhata();

  const [currentTab, setCurrentTab] = useState<TabType>('home');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Loading spinner during auth hydration
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-semibold tracking-wider">
            Loading Z.Z KHATA...
          </p>
        </div>
      </div>
    );
  }

  // If not authenticated, show Login & Registration screen
  if (!currentUser) {
    return <LoginView />;
  }

  // If the app is locked with a PIN, immediately display PinLockScreen
  if (isLocked) {
    return <PinLockScreen />;
  }

  // Active customer object derived from context
  const selectedCustomer = selectedCustomerId
    ? customers.find((c) => c.id === selectedCustomerId) || null
    : null;

  // When adding a new customer
  const handleAddNewCustomer = () => {
    setEditingCustomer(null);
    setShowCustomerModal(true);
  };

  // When editing an existing customer
  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setShowCustomerModal(true);
  };

  // When customer is created or edited
  const handleCustomerSaved = (savedCust: Customer) => {
    if (!editingCustomer) {
      // If new customer, directly open their khata
      setSelectedCustomerId(savedCust.id);
    }
    setEditingCustomer(null);
  };

  const handleOpenKhata = (cust: Customer) => {
    setSelectedCustomerId(cust.id);
  };

  const handleBackFromKhata = () => {
    setSelectedCustomerId(null);
  };

  return (
    <div
      className="min-h-screen bg-slate-100 dark:bg-slate-950 flex justify-center text-slate-900 dark:text-slate-100 font-sans transition-colors duration-150"
    >
      {/* Mobile-First Device Frame Container */}
      <div className="w-full max-w-md min-h-screen bg-slate-50 dark:bg-slate-950 shadow-2xl relative flex flex-col border-x border-slate-200/60 dark:border-slate-800/80">
        <OfflineBanner />
        {selectedCustomer ? (
          /* Customer Khata Detail Screen */
          <CustomerKhataView
            customer={selectedCustomer}
            onBack={handleBackFromKhata}
            onEditCustomer={handleEditCustomer}
          />
        ) : (
          /* Main 3-Tab Navigation View: HOME, CUSTOMERS, SETTINGS */
          <>
            <main className="flex-1">
              {currentTab === 'home' && (
                <HomeView
                  onOpenKhata={handleOpenKhata}
                  onAddNewCustomer={handleAddNewCustomer}
                  onViewAllCustomers={() => setCurrentTab('customers')}
                />
              )}
              {currentTab === 'customers' && (
                <CustomersView
                  onOpenKhata={handleOpenKhata}
                  onAddNewCustomer={handleAddNewCustomer}
                  onEditCustomer={handleEditCustomer}
                />
              )}
              {currentTab === 'settings' && <SettingsView />}
            </main>

            {/* Bottom 3-Tab Navigation Bar */}
            <Navigation
              currentTab={currentTab}
              onChangeTab={(tab) => {
                setSelectedCustomerId(null);
                setCurrentTab(tab);
              }}
            />
          </>
        )}

        {/* Add / Edit Customer Modal */}
        <CustomerModal
          isOpen={showCustomerModal}
          onClose={() => {
            setShowCustomerModal(false);
            setEditingCustomer(null);
          }}
          existingCustomer={editingCustomer || undefined}
          onSaved={handleCustomerSaved}
        />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <KhataProvider>
        <MainApp />
      </KhataProvider>
    </AuthProvider>
  );
}
