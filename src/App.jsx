import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'

function App() {
  const [units, setUnits] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingUnit, setEditingUnit] = useState(null)

  // Form States (Add Unit)
  const [newUnitNumber, setNewUnitNumber] = useState('')
  const [newBaseRent, setNewBaseRent] = useState('')
  
  // Form States (Manage Tenant)
  const [tenantName, setTenantName] = useState('')
  const [escalationDate, setEscalationDate] = useState('')

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
    } catch (error) { console.error(error.message) }
    finally { setLoading(false) }
  }

  // --- DAY 3: Add Unit ---
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

  // --- DAY 4: Toggle Occupancy ---
  const toggleOccupancy = async (id, currentStatus) => {
    try {
      await supabase.from('units').update({ is_occupied: !currentStatus }).eq('id', id)
      fetchUnits()
    } catch (error) { alert(error.message) }
  }

  // --- DAY 4: Delete Unit ---
  const deleteUnit = async (id) => {
    if (!window.confirm("Are you sure you want to delete this unit?")) return
    try {
      await supabase.from('units').delete().eq('id', id)
      fetchUnits()
    } catch (error) { alert(error.message) }
  }

  // --- DAY 5: Update Tenant ---
  const handleUpdateTenant = async (e) => {
    e.preventDefault()
    try {
      const { error } = await supabase
        .from('units')
        .update({ 
          current_tenant_name: tenantName,
          rent_escalation_date: escalationDate || null,
          is_occupied: tenantName.length > 0 // Auto-occupy if name is added
        })
        .eq('id', editingUnit.id)

      if (error) throw error
      setEditingUnit(null)
      fetchUnits()
    } catch (error) { alert(error.message) }
  }

  return (
    <div className="min-h-screen bg-yvv-charcoalDark text-gray-200 p-8 font-sans">
      <header className="mb-10 border-b border-yvv-charcoal pb-4">
        <h1 className="text-3xl font-bold text-yvv-cyan tracking-widest">YPMA</h1>
        <p className="text-sm text-gray-400 mt-1">Tenant Management Portal</p>
      </header>

      {/* --- DAY 5: TENANT EDIT MODAL --- */}
      {editingUnit && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-yvv-charcoal p-8 rounded-xl border border-yvv-cyan w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-2 text-center">Manage {editingUnit.unit_number}</h2>
            <p className="text-center text-gray-400 mb-6 text-sm">Update tenant and lease details</p>
            
            <form onSubmit={handleUpdateTenant} className="space-y-4">
              <div>
                <label className="block text-xs text-yvv-cyan uppercase mb-1">Tenant Name</label>
                <input 
                  type="text" 
                  value={tenantName} 
                  onChange={(e) => setTenantName(e.target.value)}
                  className="w-full bg-yvv-charcoalDark border border-gray-700 rounded p-3 text-white outline-none focus:border-yvv-cyan"
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <label className="block text-xs text-yvv-cyan uppercase mb-1">Rent Escalation Date</label>
                <input 
                  type="date" 
                  value={escalationDate} 
                  onChange={(e) => setEscalationDate(e.target.value)}
                  className="w-full bg-yvv-charcoalDark border border-gray-700 rounded p-3 text-white outline-none focus:border-yvv-cyan"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setEditingUnit(null)} className="flex-1 py-3 text-gray-400 hover:text-white transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-yvv-cyan text-yvv-charcoalDark font-bold rounded-lg hover:brightness-110">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- DAY 3: ADD UNIT FORM --- */}
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

      {/* --- UNITS GRID --- */}
      {loading ? <p className="text-yvv-cyan animate-pulse text-center">Loading...</p> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {units.map((unit) => (
            <div key={unit.id} className="bg-yvv-charcoal rounded-xl p-6 border border-gray-800 shadow-lg flex flex-col justify-between relative group hover:border-yvv-cyan transition-colors duration-300">
              
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white">{unit.unit_number}</h2>
                    <p className="text-xs text-yvv-cyan uppercase tracking-widest">{unit.properties?.name}</p>
                  </div>
                  {/* DAY 4: Clickable Occupancy Badge restored */}
                  <button 
                    onClick={() => toggleOccupancy(unit.id, unit.is_occupied)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${unit.is_occupied ? 'bg-green-900/50 text-green-400 border border-green-800 hover:bg-red-900/30' : 'bg-red-900/50 text-red-400 border border-red-800 hover:bg-green-900/30'}`}
                  >
                    {unit.is_occupied ? 'Occupied' : 'Vacant'}
                  </button>
                </div>
                
                <div className="space-y-3 my-6">
                  <div className="flex justify-between border-b border-gray-800 pb-2">
                    <span className="text-gray-500 text-sm">Current Tenant</span>
                    <span className="text-white font-medium">{unit.current_tenant_name || 'VACANT'}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-800 pb-2">
                    <span className="text-gray-500 text-sm">Base Rent</span>
                    <span className="text-white font-bold">₹{unit.base_rent}</span>
                  </div>
                  {unit.rent_escalation_date && (
                    <div className="flex justify-between border-b border-gray-800 pb-2">
                      <span className="text-gray-500 text-sm">Escalation</span>
                      <span className="text-yvv-cyan text-xs">{new Date(unit.rent_escalation_date).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-2 space-y-2">
                <button 
                  onClick={() => {
                    setEditingUnit(unit);
                    setTenantName(unit.current_tenant_name || '');
                    setEscalationDate(unit.rent_escalation_date || '');
                  }}
                  className="w-full py-2 bg-yvv-charcoalDark border border-gray-700 text-gray-300 rounded-lg hover:border-yvv-cyan hover:text-white transition-all font-semibold text-sm"
                >
                  Manage Tenant
                </button>
                
                {/* DAY 4: Delete Button Restored */}
                <button 
                  onClick={() => deleteUnit(unit.id)}
                  className="w-full py-2 text-xs text-gray-500 hover:text-red-500 hover:bg-red-900/20 border border-transparent hover:border-red-900/50 rounded-lg transition-all"
                >
                  Delete Unit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default App