import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'

function App() {
  const [units, setUnits] = useState([])
  const [loading, setLoading] = useState(true)
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
        .order('unit_number', { ascending: true })
      if (error) throw error
      setUnits(data)
    } catch (error) {
      console.error("Error:", error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAddUnit = async (e) => {
    e.preventDefault()
    const alkapuriId = units.length > 0 ? units[0].property_id : null
    if (!alkapuriId || !newUnitNumber || !newBaseRent) return
    try {
      const { error } = await supabase.from('units').insert([{ property_id: alkapuriId, unit_number: newUnitNumber, base_rent: newBaseRent }])
      if (error) throw error
      setNewUnitNumber(''); setNewBaseRent(''); fetchUnits()
    } catch (error) { alert(error.message) }
  }

  // --- NEW: Toggle Occupancy Function ---
  const toggleOccupancy = async (id, currentStatus) => {
    try {
      const { error } = await supabase
        .from('units')
        .update({ is_occupied: !currentStatus })
        .eq('id', id)
      if (error) throw error
      fetchUnits() // Refresh the list
    } catch (error) { alert(error.message) }
  }

  // --- NEW: Delete Unit Function ---
  const deleteUnit = async (id) => {
    if (!window.confirm("Are you sure you want to delete this unit?")) return
    try {
      const { error } = await supabase.from('units').delete().eq('id', id)
      if (error) throw error
      fetchUnits()
    } catch (error) { alert(error.message) }
  }

  return (
    <div className="min-h-screen bg-yvv-charcoalDark text-gray-200 p-8 font-sans">
      <header className="mb-10 border-b border-yvv-charcoal pb-4 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-yvv-cyan tracking-widest">YPMA</h1>
          <p className="text-sm text-gray-400 mt-1">Property Management Dashboard</p>
        </div>
      </header>

      {/* Add Unit Form */}
      <div className="bg-yvv-charcoal p-6 rounded-lg border border-gray-800 mb-8 shadow-lg">
        <h2 className="text-xl font-bold text-white mb-4">Quick Add Unit</h2>
        <form onSubmit={handleAddUnit} className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-yvv-cyan uppercase tracking-wider mb-2">Unit Number</label>
            <input type="text" placeholder="Flat 105" value={newUnitNumber} onChange={(e) => setNewUnitNumber(e.target.value)} className="w-full bg-yvv-charcoalDark border border-gray-700 rounded p-2 text-white outline-none focus:border-yvv-cyan" />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-yvv-cyan uppercase tracking-wider mb-2">Base Rent (₹)</label>
            <input type="number" placeholder="15000" value={newBaseRent} onChange={(e) => setNewBaseRent(e.target.value)} className="w-full bg-yvv-charcoalDark border border-gray-700 rounded p-2 text-white outline-none focus:border-yvv-cyan" />
          </div>
          <button type="submit" className="px-6 py-2 bg-yvv-charcoalDark border border-yvv-cyan text-yvv-cyan rounded hover:bg-yvv-cyan hover:text-yvv-charcoalDark transition-all font-semibold h-[42px]">+ Add</button>
        </form>
      </div>

      {/* Units Grid */}
      {loading ? <p className="text-yvv-cyan animate-pulse text-center">Loading...</p> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {units.map((unit) => (
            <div key={unit.id} className="bg-yvv-charcoal rounded-lg p-6 border border-gray-800 shadow-lg relative group">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold text-white">{unit.unit_number}</h2>
                  <p className="text-xs text-yvv-cyan uppercase tracking-wider">{unit.properties?.name}</p>
                </div>
                <button 
                  onClick={() => toggleOccupancy(unit.id, unit.is_occupied)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${unit.is_occupied ? 'bg-green-900/50 text-green-400 border border-green-800 hover:bg-red-900/30' : 'bg-red-900/50 text-red-400 border border-red-800 hover:bg-green-900/30'}`}
                >
                  {unit.is_occupied ? 'Occupied' : 'Vacant'}
                </button>
              </div>
              
              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-sm"><span className="text-gray-400">Tenant:</span><span>{unit.current_tenant_name || 'Empty'}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-400">Rent:</span><span className="text-white font-bold">₹{unit.base_rent}</span></div>
              </div>

              {/* Delete Button (Visible on Hover) */}
              <button 
                onClick={() => deleteUnit(unit.id)}
                className="w-full py-2 text-xs text-gray-500 hover:text-red-500 border border-transparent hover:border-red-900/50 rounded transition-all mt-4"
              >
                Delete Record
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default App