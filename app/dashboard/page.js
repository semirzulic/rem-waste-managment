'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const [items, setItems] = useState([])
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const router = useRouter()

  const [newItem, setNewItem] = useState({
    type: '',
    quantity: '',
    unit: 'kg',
    location: '',
    clientId: '',
    clientName: '',
    collectionDate: ''
  })

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')

    if (!token || !userData) {
      router.push('/login')
      return
    }

    setUser(JSON.parse(userData))
    fetchItems()
  }, [router])

  const fetchItems = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/items', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setItems(data.items)
      } else if (response.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        router.push('/login')
      } else {
        setError('Failed to fetch items')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/login')
  }

  const handleAddItem = async (e) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newItem)
      })

      if (response.ok) {
        await fetchItems()
        setShowAddForm(false)
        setNewItem({
          type: '',
          quantity: '',
          unit: 'kg',
          location: '',
          clientId: '',
          clientName: '',
          collectionDate: ''
        })
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to add item')
      }
    } catch (err) {
      setError('Network error')
    }
  }

  const handleEditItem = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      const token = localStorage.getItem('token')
      
      // Debug logging
      console.log('Editing item:', editingItem.id)
      console.log('Item data:', editingItem)
      
      // Create clean data object to avoid any serialization issues
      const updateData = {
        type: editingItem.type,
        quantity: parseInt(editingItem.quantity),
        unit: editingItem.unit,
        location: editingItem.location,
        clientId: editingItem.clientId,
        clientName: editingItem.clientName,
        status: editingItem.status,
        collectionDate: editingItem.collectionDate
      }
      
      console.log('Sending PUT request to:', `/api/items/${editingItem.id}`)
      console.log('Update data:', updateData)
      
      const response = await fetch(`/api/items/${editingItem.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      })

      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)

      if (response.ok) {
        console.log('Edit successful, refreshing items and closing modal')
        await fetchItems()
        setEditingItem(null) // Close modal
      } else {
        const data = await response.json()
        console.error('Edit failed:', data)
        setError(data.error || 'Failed to update item')
      }
    } catch (err) {
      console.error('Edit error:', err)
      setError('Network error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteItem = async (id) => {
    if (!confirm('Are you sure you want to delete this item?')) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/items/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        await fetchItems()
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to delete item')
      }
    } catch (err) {
      setError('Network error')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rem-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-rem-green-600 rounded flex items-center justify-center mr-3">
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-gray-900">REM Waste Management</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600" data-testid="user-info">
                Welcome, {user?.username} ({user?.role})
              </span>
              <button
                onClick={handleLogout}
                data-testid="logout-button"
                className="btn-secondary"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Waste Items</h2>
          <button
            onClick={() => setShowAddForm(true)}
            data-testid="add-item-button"
            className="btn-primary"
          >
            Add New Item
          </button>
        </div>

        {/* Add Item Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md" data-testid="add-item-modal">
              <h3 className="text-lg font-semibold mb-4">Add New Waste Item</h3>
              <form onSubmit={handleAddItem} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    required
                    data-testid="item-type-select"
                    className="input-field"
                    value={newItem.type}
                    onChange={(e) => setNewItem(prev => ({...prev, type: e.target.value}))}
                  >
                    <option value="">Select type...</option>
                    <option value="General Waste">General Waste</option>
                    <option value="Recycling">Recycling</option>
                    <option value="Hazardous">Hazardous</option>
                    <option value="Electronic">Electronic</option>
                    <option value="Construction">Construction</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    required
                    min="1"
                    data-testid="item-quantity-input"
                    className="input-field"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem(prev => ({...prev, quantity: e.target.value}))}
                    placeholder="Enter quantity"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                  <select
                    required
                    data-testid="item-unit-select"
                    className="input-field"
                    value={newItem.unit}
                    onChange={(e) => setNewItem(prev => ({...prev, unit: e.target.value}))}
                  >
                    <option value="kg">Kilograms (kg)</option>
                    <option value="tonnes">Tonnes</option>
                    <option value="litres">Litres</option>
                    <option value="cubic_metres">Cubic Metres (m³)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    required
                    data-testid="item-location-input"
                    className="input-field"
                    value={newItem.location}
                    onChange={(e) => setNewItem(prev => ({...prev, location: e.target.value}))}
                    placeholder="Enter location"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Client ID</label>
                  <input
                    type="text"
                    required
                    data-testid="item-client-id-input"
                    className="input-field"
                    value={newItem.clientId}
                    onChange={(e) => setNewItem(prev => ({...prev, clientId: e.target.value}))}
                    placeholder="Enter client ID"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
                  <input
                    type="text"
                    required
                    data-testid="item-client-name-input"
                    className="input-field"
                    value={newItem.clientName}
                    onChange={(e) => setNewItem(prev => ({...prev, clientName: e.target.value}))}
                    placeholder="Enter client name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Collection Date</label>
                  <input
                    type="date"
                    data-testid="item-collection-date-input"
                    className="input-field"
                    value={newItem.collectionDate}
                    onChange={(e) => setNewItem(prev => ({...prev, collectionDate: e.target.value}))}
                  />
                </div>
                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    data-testid="submit-new-item"
                    className="flex-1 btn-primary"
                  >
                    Add Item
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    data-testid="cancel-add-item"
                    className="flex-1 btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Item Modal */}
        {editingItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md" data-testid="edit-item-modal">
              <h3 className="text-lg font-semibold mb-4">Edit Waste Item</h3>
              <form onSubmit={handleEditItem} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    required
                    data-testid="edit-item-type-select"
                    className="input-field"
                    value={editingItem.type}
                    onChange={(e) => setEditingItem(prev => ({...prev, type: e.target.value}))}
                  >
                    <option value="">Select type...</option>
                    <option value="General Waste">General Waste</option>
                    <option value="Recycling">Recycling</option>
                    <option value="Hazardous">Hazardous</option>
                    <option value="Electronic">Electronic</option>
                    <option value="Construction">Construction</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    required
                    min="1"
                    data-testid="edit-item-quantity-input"
                    className="input-field"
                    value={editingItem.quantity}
                    onChange={(e) => setEditingItem(prev => ({...prev, quantity: e.target.value}))}
                    placeholder="Enter quantity"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                  <select
                    required
                    data-testid="edit-item-unit-select"
                    className="input-field"
                    value={editingItem.unit}
                    onChange={(e) => setEditingItem(prev => ({...prev, unit: e.target.value}))}
                  >
                    <option value="kg">Kilograms (kg)</option>
                    <option value="tonnes">Tonnes</option>
                    <option value="litres">Litres</option>
                    <option value="cubic_metres">Cubic Metres (m³)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    required
                    data-testid="edit-item-location-input"
                    className="input-field"
                    value={editingItem.location}
                    onChange={(e) => setEditingItem(prev => ({...prev, location: e.target.value}))}
                    placeholder="Enter location"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Client ID</label>
                  <input
                    type="text"
                    required
                    data-testid="edit-item-client-id-input"
                    className="input-field"
                    value={editingItem.clientId}
                    onChange={(e) => setEditingItem(prev => ({...prev, clientId: e.target.value}))}
                    placeholder="Enter client ID"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
                  <input
                    type="text"
                    required
                    data-testid="edit-item-client-name-input"
                    className="input-field"
                    value={editingItem.clientName}
                    onChange={(e) => setEditingItem(prev => ({...prev, clientName: e.target.value}))}
                    placeholder="Enter client name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    data-testid="edit-item-status-select"
                    className="input-field"
                    value={editingItem.status}
                    onChange={(e) => setEditingItem(prev => ({...prev, status: e.target.value}))}
                  >
                    <option value="pending">Pending</option>
                    <option value="collected">Collected</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Collection Date</label>
                  <input
                    type="date"
                    data-testid="edit-item-collection-date-input"
                    className="input-field"
                    value={editingItem.collectionDate}
                    onChange={(e) => setEditingItem(prev => ({...prev, collectionDate: e.target.value}))}
                  />
                </div>
                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    data-testid="submit-edit-item"
                    className="flex-1 btn-primary"
                  >
                    Update Item
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingItem(null)}
                    data-testid="cancel-edit-item"
                    className="flex-1 btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Items Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No waste items</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by adding a new waste item.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200" data-testid="items-table">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Collection Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.map((item) => (
                    <tr key={item.id} data-testid={`item-row-${item.id}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`h-2 w-2 rounded-full mr-3 ${
                            item.type === 'Hazardous' ? 'bg-red-500' :
                            item.type === 'Recycling' ? 'bg-green-500' :
                            item.type === 'Electronic' ? 'bg-blue-500' :
                            'bg-gray-500'
                          }`}></div>
                          <span className="text-sm font-medium text-gray-900">{item.type}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.location}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{item.clientName}</div>
                        <div className="text-sm text-gray-500">ID: {item.clientId}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.collectionDate ? new Date(item.collectionDate).toLocaleDateString() : 'Not scheduled'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          item.status === 'collected' ? 'bg-green-100 text-green-800' :
                          item.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {item.status || 'pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => setEditingItem(item)}
                          data-testid={`edit-item-${item.id}`}
                          className="text-rem-green-600 hover:text-rem-green-900 mr-4"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          data-testid={`delete-item-${item.id}`}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}