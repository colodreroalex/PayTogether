import React from 'react';
import { useApp } from '../context/AppContext.js';

function GroupBalances() {
  const { state, calculateBalances, calculateDebts, getCurrentGroupExpenses, getCurrentGroupMembers } = useApp();

  if (!state.currentGroup) {
    return (
      <div className="card text-center py-8">
        <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No hay grupo seleccionado
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Selecciona un grupo para ver los balances
        </p>
      </div>
    );
  }

  const groupExpenses = getCurrentGroupExpenses();
  const groupMembers = getCurrentGroupMembers();
  const balances = calculateBalances();
  const debts = calculateDebts();

  const totalExpenses = groupExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const averagePerPerson = groupMembers.length > 0 ? totalExpenses / groupMembers.length : 0;

  // Los nombres ahora se almacenan directamente como strings

  const getBalanceColor = (balance) => {
    if (balance > 0.01) return 'text-green-600 dark:text-green-400';
    if (balance < -0.01) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const getBalanceIcon = (balance) => {
    if (balance > 0.01) {
      return (
        <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
        </svg>
      );
    }
    if (balance < -0.01) {
      return (
        <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
        </svg>
      );
    }
    return (
      <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header del grupo */}
      <div className="card border-l-4 border-l-primary-500">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              💰 Balances - {state.currentGroup.name}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {state.currentGroup.description || 'Sin descripción'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
              €{totalExpenses.toFixed(2)}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Total gastado
            </p>
          </div>
        </div>
      </div>

      {/* Estadísticas del grupo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Miembros</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{groupMembers.length}</p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Gastos</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{groupExpenses.length}</p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Promedio/persona</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">€{averagePerPerson.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Balances individuales */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          📊 Balances por Persona
        </h3>
        {groupMembers.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-gray-500 dark:text-gray-400">
              No hay miembros en este grupo
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {groupMembers.map(person => {
              const balance = balances[person.name] || 0;
              const totalPaid = groupExpenses
                .filter(e => e.paidBy === person.name)
                .reduce((sum, e) => sum + e.amount, 0);
              const totalOwed = groupExpenses
                .filter(e => e.splitBetween.includes(person.name))
                .reduce((sum, e) => sum + (e.amount / e.splitBetween.length), 0);
              
              return (
                <div key={person.name} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                      <span className="text-primary-600 dark:text-primary-400 font-medium">
                        {person.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {person.name}
                      </p>
                      <div className="flex space-x-4 text-sm text-gray-500 dark:text-gray-400">
                        <span>Pagó: €{totalPaid.toFixed(2)}</span>
                        <span>Debe: €{totalOwed.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getBalanceIcon(balance)}
                    <span className={`font-semibold ${getBalanceColor(balance)}`}>
                      {balance > 0.01 ? '+' : ''}€{balance.toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Deudas simplificadas */}
      {debts.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            🔄 Liquidación de Deudas
          </h3>
          <div className="space-y-3">
            {debts.map((debt, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                      <span className="text-red-600 dark:text-red-400 font-medium text-sm">
                        {debt.from.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {debt.from}
                    </span>
                  </div>
                  
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                  
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                      <span className="text-green-600 dark:text-green-400 font-medium text-sm">
                        {debt.to.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {debt.to}
                    </span>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="font-semibold text-yellow-700 dark:text-yellow-300">
                    €{debt.amount.toFixed(2)}
                  </p>
                  <p className="text-xs text-yellow-600 dark:text-yellow-400">
                    debe pagar
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start space-x-2">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Liquidación optimizada
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  Estas son las transferencias mínimas necesarias para saldar todas las deudas del grupo.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Estado equilibrado */}
      {debts.length === 0 && groupExpenses.length > 0 && (
        <div className="card text-center py-8">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            ¡Todo equilibrado!
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            No hay deudas pendientes en este grupo
          </p>
        </div>
      )}
    </div>
  );
}

export default GroupBalances;