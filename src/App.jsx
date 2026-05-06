import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'

function App() {
  const [units, setUnits] = useState([])
  const [loading, setLoading] = useState(true)
  
  // New state variables for our form
  const [newUnitNumber, setNewUnitNumber] = useState('')
  const [newBaseRent, setNewBaseRent] = useState('')

  useEffect(() => {
    fetchUnits()
  }, [])

  const fetchUnits = async () => {
    try {
      const { data, error } = await supabase
        .from('units')
        .select(`*, properties(name)`)
        .order('unit_number', { ascending: true }) // Keeps them in alphabetical order!
      
      if (error) throw error
      setUnits(data)
    } catch (error) {
      console.error("Error fetching units:", error.message)
    } finally {
      setLoading(false)
    }
  }

  // The function that runs when you click submit
  const handleAddUnit = async (e) => {
    e.preventDefault()
    
    // We need the property_id for Alkapuri to link the new unit. 
    // We'll grab it from the first unit currently in our list.
    const alkapuriId = units.length > 0 ? units[0].property_id : null
    
    if (!alkapuriId || !newUnitNumber || !newBaseRent) {
      alert("Please fill out all fields!")
      return
    }

    try {
      const { error } = await supabase
        .from('units')
        .insert([
          { 
            property_id: alkapuriId, 
            unit_number: newUnitNumber, 
            base_rent: newBaseRent,
            is_occupied: false // Defaults to vacant
          }
        ])

      if (error) throw error
      
      // Clear the form and refresh the grid!
      setNewUnitNumber('')
      setNewBaseRent('')
      fetchUnits()
      
    } catch (error) {
      console.error("Error adding unit:", error.message)
      alert("Failed to add unit. Check console.")
    }
  }

  return (
    <div className="min-h-screen bg-yvv-charcoalDark text-gray-200 p-8">
      <header className="mb-10 border-b border-yvv-charcoal pb-4">
        <h1 className="text-3xl font-bold text-yvv-cyan tracking-widest">YPMA</h1>
        <p className="text-sm text-gray-400 mt-1">Property Management Dashboard</p>
      </header>

      {/* --- NEW: The Add Unit Form --- */}
      <div className="bg-yvv-charcoal p-6 rounded-lg border border-gray-800 mb-8 shadow-lg">
        <h2 className="text-xl font-bold text-white mb-4">Add New Unit to Alkapuri</h2>
        <form onSubmit={handleAddUnit} className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-xs text-yvv-cyan uppercase tracking-wider mb-2">Unit Number</label>
            <input 
              type="text" 
              placeholder="e.g. Flat 104"
              value={newUnitNumber}
              onChange={(e) => setNewUnitNumber(e.target.value)}
              className="w-full bg-yvv-charcoalDark border border-gray-700 rounded p-2 text-white focus:outline-none focus:border-yvv-cyan"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-yvv-cyan uppercase tracking-wider mb-2">Base Rent (₹)</label>
            <input 
              type="number" 
              placeholder="e.g. 15000"
              value={newBaseRent}
              onChange={(e) => setNewBaseRent(e.target.value)}
              className="w-full bg-yvv-charcoalDark border border-gray-700 rounded p-2 text-white focus:outline-none focus:border-yvv-cyan"
            />
          </div>
          <button 
            type="submit"
            className="px-6 py-2 bg-yvv-charcoalDark border border-yvv-cyan text-yvv-cyan rounded hover:bg-yvv-cyan hover:text-yvv-charcoalDark transition-all font-semibold h-[42px]"
          >
            + Add Unit
          </button>
        </form>
      </div>

      {/* --- The Grid (Same as yesterday) --- */}
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <p className="text-yvv-cyan animate-pulse">Loading properties...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {units.map((unit) => (
            <div key={unit.id} className="bg-yvv-charcoal rounded-lg p-6 border border-gray-800 shadow-lg hover:border-yvv-cyan transition-colors duration-300">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold text-white">{unit.unit_number}</h2>
                  <p className="text-xs text-yvv-cyan uppercase tracking-wider">{unit.properties?.name}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${unit.is_occupied ? 'bg-green-900/50 text-green-400 border border-green-800' : 'bg-red-900/50 text-red-400 border border-red-800'}`}>
                  {unit.is_occupied ? 'Occupied' : 'Vacant'}
                </span>
              </div>
              
              <div className="space-y-2 mt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Tenant:</span>
                  <span className="font-medium">{unit.current_tenant_name || 'N/A'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Base Rent:</span>
                  <span className="font-medium text-white">₹{unit.base_rent}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default App