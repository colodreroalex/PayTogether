import React, { useState } from 'react';
import { useApp } from '../context/AppContext.js';
import AddExpenseModal from './AddExpenseModal.js';
import CreateGroupModal from './CreateGroupModal.js';

function QuickActions() {
  const { state, exportToCSV } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Mis Gastos Diarios',
          text: 'Revisa mis gastos con Gastos Grupales',
          url: window.location.href
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copiar URL al portapapeles
      navigator.clipboard.writeText(window.location.href);
      alert('URL copiada al portapapeles');
    }
  };

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Crear Grupo o Agregar Gasto */}
        {!state.currentGroup ? (
          <button
            onClick={() => setShowCreateGroupModal(true)}
            className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl shadow-card hover:shadow-float transition-all duration-300 hover:scale-105 group"
          >
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-3 group-hover:bg-opacity-30 transition-all duration-300">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <span className="font-semibold text-sm">Crear Grupo</span>
          </button>
        ) : (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-xl shadow-card hover:shadow-float transition-all duration-300 hover:scale-105 group"
          >
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-3 group-hover:bg-opacity-30 transition-all duration-300">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className="font-semibold text-sm">Agregar Gasto</span>
          </button>
        )}

        {/* Ver Resumen */}
        <button
          onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
          className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-secondary-500 to-secondary-600 text-white rounded-xl shadow-card hover:shadow-float transition-all duration-300 hover:scale-105 group"
        >
          <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-3 group-hover:bg-opacity-30 transition-all duration-300">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <span className="font-semibold text-sm">Ver Resumen</span>
        </button>

        {/* Exportar Datos */}
        <button
          onClick={exportToCSV}
          className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-accent-500 to-accent-600 text-white rounded-xl shadow-card hover:shadow-float transition-all duration-300 hover:scale-105 group"
        >
          <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-3 group-hover:bg-opacity-30 transition-all duration-300">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <span className="font-semibold text-sm">Exportar CSV</span>
        </button>

        {/* Compartir */}
        <button
          onClick={handleShare}
          className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl shadow-card hover:shadow-float transition-all duration-300 hover:scale-105 group"
        >
          <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-3 group-hover:bg-opacity-30 transition-all duration-300">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
          </div>
          <span className="font-semibold text-sm">Compartir</span>
        </button>
      </div>

      {/* Modal para agregar gasto */}
      {showAddModal && (
        <AddExpenseModal onClose={() => setShowAddModal(false)} />
      )}
      
      {/* Modal para crear grupo */}
      {showCreateGroupModal && (
        <CreateGroupModal onClose={() => setShowCreateGroupModal(false)} />
      )}
    </>
  );
}

export default QuickActions;