import React, { useState } from 'react';
import { AppProvider } from './context/AppContext';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import ExpenseList from './components/ExpenseList';
import Statistics from './components/Statistics';
import GroupManager from './components/GroupManager';
import GroupBalances from './components/GroupBalances';
import AddExpenseModal from './components/AddExpenseModal';
import FloatingActionButton from './components/FloatingActionButton';
import BottomNavigation from './components/BottomNavigation';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [showAddModal, setShowAddModal] = useState(false);

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'expenses':
        return <ExpenseList />;
      case 'groups':
        return <GroupManager />;
      case 'balances':
        return <GroupBalances />;
      case 'statistics':
        return <Statistics />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <AppProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        {/* Header */}
        <Header />
        
        {/* Main Content */}
        <main className="pb-20 pt-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {renderCurrentView()}
          </div>
        </main>
        
        {/* Floating Action Button */}
        <FloatingActionButton onClick={() => setShowAddModal(true)} />
        
        {/* Bottom Navigation */}
        <BottomNavigation 
          currentView={currentView} 
          onViewChange={setCurrentView} 
        />
        
        {/* Add Expense Modal */}
        {showAddModal && (
          <AddExpenseModal 
            onClose={() => setShowAddModal(false)}
          />
        )}
      </div>
    </AppProvider>
  );
}

export default App;