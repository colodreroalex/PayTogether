import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

function GroupManager() {
  const { state, dispatch } = useApp();
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [groupForm, setGroupForm] = useState({ name: '', description: '' });
  const [personForm, setPersonForm] = useState({ name: '', email: '' });
  const [selectedMembers, setSelectedMembers] = useState([]);

  const handleCreateGroup = (e) => {
    e.preventDefault();
    if (!groupForm.name.trim()) return;

    dispatch({
      type: 'CREATE_GROUP',
      payload: {
        name: groupForm.name.trim(),
        description: groupForm.description.trim(),
        members: selectedMembers
      }
    });

    setGroupForm({ name: '', description: '' });
    setSelectedMembers([]);
    setShowCreateGroup(false);
  };

  const handleAddPerson = (e) => {
    e.preventDefault();
    if (!personForm.name.trim()) return;

    dispatch({
      type: 'ADD_PERSON',
      payload: {
        name: personForm.name.trim(),
        email: personForm.email.trim()
      }
    });

    setPersonForm({ name: '', email: '' });
    setShowAddPerson(false);
  };

  const handleSelectGroup = (groupId) => {
    dispatch({ type: 'SELECT_GROUP', payload: groupId });
  };

  const handleDeleteGroup = (groupId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este grupo? Se eliminarán todos los gastos asociados.')) {
      dispatch({ type: 'DELETE_GROUP', payload: groupId });
    }
  };

  const toggleMemberSelection = (personId) => {
    setSelectedMembers(prev => 
      prev.includes(personId) 
        ? prev.filter(id => id !== personId)
        : [...prev, personId]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Gestión de Grupos
        </h2>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowAddPerson(true)}
            className="btn-secondary"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Añadir Persona
          </button>
          <button
            onClick={() => setShowCreateGroup(true)}
            className="btn-primary"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Crear Grupo
          </button>
        </div>
      </div>

      {/* Grupo actual */}
      {state.currentGroup && (
        <div className="card border-l-4 border-l-primary-500">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                📊 {state.currentGroup.name}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {state.currentGroup.description || 'Sin descripción'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                {state.currentGroup.members.length} miembros
              </p>
            </div>
            <span className="px-3 py-1 bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200 rounded-full text-sm font-medium">
              Grupo Activo
            </span>
          </div>
        </div>
      )}

      {/* Lista de grupos */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Todos los Grupos
        </h3>
        {state.groups.length === 0 ? (
          <div className="text-center py-8">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              No hay grupos creados
            </p>
            <button
              onClick={() => setShowCreateGroup(true)}
              className="btn-primary"
            >
              Crear tu primer grupo
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {state.groups.map(group => {
              const memberNames = group.members.map(memberId => {
                const person = state.people.find(p => p.id === memberId);
                return person ? person.name : 'Desconocido';
              }).join(', ');
              
              const groupExpenses = state.expenses.filter(e => e.groupId === group.id);
              const totalExpenses = groupExpenses.reduce((sum, e) => sum + e.amount, 0);
              
              return (
                <div
                  key={group.id}
                  className={`p-4 border rounded-lg transition-all duration-200 hover:shadow-md ${
                    state.currentGroup?.id === group.id
                      ? 'border-primary-300 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-700'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {group.name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {group.description || 'Sin descripción'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        Miembros: {memberNames || 'Sin miembros'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        Total gastado: €{totalExpenses.toFixed(2)}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      {state.currentGroup?.id !== group.id && (
                        <button
                          onClick={() => handleSelectGroup(group.id)}
                          className="px-3 py-1 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors duration-200 text-sm"
                        >
                          Seleccionar
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteGroup(group.id)}
                        className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors duration-200 text-sm"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Lista de personas */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Personas Registradas
        </h3>
        {state.people.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              No hay personas registradas
            </p>
            <button
              onClick={() => setShowAddPerson(true)}
              className="btn-secondary"
            >
              Añadir primera persona
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {state.people.map(person => (
              <div
                key={person.id}
                className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                    <span className="text-primary-600 dark:text-primary-400 font-medium text-sm">
                      {person.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {person.name}
                    </p>
                    {person.email && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {person.email}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal crear grupo */}
      {showCreateGroup && (
        <div className="modal-overlay animate-fade-in" onClick={(e) => e.target === e.currentTarget && setShowCreateGroup(false)}>
          <div className="modal-content animate-slide-up">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Crear Nuevo Grupo
              </h3>
              <button
                onClick={() => setShowCreateGroup(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleCreateGroup} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre del grupo *
                </label>
                <input
                  type="text"
                  value={groupForm.name}
                  onChange={(e) => setGroupForm(prev => ({ ...prev, name: e.target.value }))}
                  className="input-field"
                  placeholder="Ej: Viaje a Barcelona"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Descripción
                </label>
                <textarea
                  value={groupForm.description}
                  onChange={(e) => setGroupForm(prev => ({ ...prev, description: e.target.value }))}
                  className="input-field"
                  placeholder="Descripción opcional del grupo"
                  rows={3}
                />
              </div>
              
              {state.people.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Seleccionar miembros
                  </label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {state.people.map(person => (
                      <label key={person.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedMembers.includes(person.id)}
                          onChange={() => toggleMemberSelection(person.id)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-gray-900 dark:text-white">{person.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateGroup(false)}
                  className="btn-secondary flex-1"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1"
                >
                  Crear Grupo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal añadir persona */}
      {showAddPerson && (
        <div className="modal-overlay animate-fade-in" onClick={(e) => e.target === e.currentTarget && setShowAddPerson(false)}>
          <div className="modal-content animate-slide-up">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Añadir Nueva Persona
              </h3>
              <button
                onClick={() => setShowAddPerson(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleAddPerson} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={personForm.name}
                  onChange={(e) => setPersonForm(prev => ({ ...prev, name: e.target.value }))}
                  className="input-field"
                  placeholder="Nombre de la persona"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email (opcional)
                </label>
                <input
                  type="email"
                  value={personForm.email}
                  onChange={(e) => setPersonForm(prev => ({ ...prev, email: e.target.value }))}
                  className="input-field"
                  placeholder="email@ejemplo.com"
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddPerson(false)}
                  className="btn-secondary flex-1"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1"
                >
                  Añadir Persona
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default GroupManager;