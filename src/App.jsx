import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import { BrowserRouter as Router, Routes, Route, Link, useParams, useNavigate } from 'react-router-dom'

// ==========================================
// 1. THE DASHBOARD PAGE (Days 1-6)
// ==========================================
function Dashboard() {
  const [units, setUnits] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingUnit, setEditingUnit] = useState(null)
  const [filter, setFilter] = useState('all')

  const [newUnitNumber, setNewUnitNumber] = useState('')
  const [newBaseRent, setNewBaseRent] = useState('')
  const [tenantName, setTenantName] = useState('')
  const [escalationDate, setEscalationDate] = useState('')

  useEffect(() => { fetchUnits() }, [])

  const fetchUnits = async () => {
    try {
      const { data, error } = await supabase.from('units').select(`*, properties(name)`).order('unit_number', { ascending: true })
      if (error) throw error
      setUnits(data)
    } catch (error) { console.error(error.message) } finally { setLoading(false) }
  }

  const handleAddUnit = async (e) => {
    e.preventDefault()
    const alkapuriId = units.length > 0 ? units[0].property_id : null
    if (!alkapuriId || !newUnitNumber || !newBaseRent) return
    try {
      await supabase.from('units').insert([{ property_id: alkapuriId, unit_number: newUnitNumber, base_rent: newBaseRent }])
      setNewUnitNumber(''); setNewBaseRent(''); fetchUnits()
    } catch (error) { alert(error.message) }
  }

  const toggleOccupancy = async (id, currentStatus) => {
    try { await supabase.from('units').update({ is_occupied: !currentStatus }).eq('id', id); fetchUnits() } 
    catch (error) { alert(error.message) }
  }

  const deleteUnit = async (id) => {
    if (!window.confirm("Are you sure you want to delete this unit?")) return
    try { await supabase.from('units').delete().eq('id', id); fetchUnits() } 
    catch (error) { alert(error.message) }
  }

  const handleUpdateTenant = async (e) => {
    e.preventDefault()
    try {
      await supabase.from('units').update({ current_tenant_name: tenantName, rent_escalation_date: escalationDate || null, is_occupied: tenantName.length > 0 }).eq('id', editingUnit.id)
      setEditingUnit(null); fetchUnits()
    } catch (error) { alert(error.message) }
  }

  const totalUnits = units.length
  const occupiedUnits = units.filter(u => u.is_occupied).length
  const vacantUnits = totalUnits - occupiedUnits
  const monthlyRevenue = units.filter(u => u.is_occupied).reduce((sum, unit) => sum + (Number(unit.base_rent) || 0), 0)

  const displayedUnits = units.filter(unit => {
    if (filter === 'all') return true
    if (filter === 'occupied') return unit.is_occupied
    if (filter === 'vacant') return !unit.is_occupied
    return true
  })

  return (
    <div className="min-h-screen bg-yvv-charcoalDark text-gray-200 p-8 font-sans">
      <header className="mb-8 border-b border-yvv-charcoal pb-4">
        <h1 className="text-3xl font-bold text-yvv-cyan tracking-widest">YPMA</h1>
        <p className="text-sm text-gray-400 mt-1">Tenant Management Portal</p>
      </header>

      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-yvv-charcoal p-6 rounded-lg border border-gray-800 shadow-lg">
            <p className="text-gray-400 text-sm uppercase tracking-wider mb-1">Total Monthly Revenue</p>
            <h2 className="text-3xl font-bold text-white">₹{monthlyRevenue.toLocaleString('en-IN')}</h2>
          </div>
          <div className="bg-yvv-charcoal p-6 rounded-lg border border-gray-800 shadow-lg">
            <p className="text-gray-400 text-sm uppercase tracking-wider mb-1">Portfolio Occupancy</p>
            <h2 className="text-3xl font-bold text-white">{occupiedUnits} <span className="text-lg text-gray-500 font-normal">/ {totalUnits} Units</span></h2>
          </div>
          <div className="bg-yvv-charcoal p-6 rounded-lg border border-red-900/50 shadow-lg">
            <p className="text-gray-400 text-sm uppercase tracking-wider mb-1">Action Needed</p>
            <h2 className="text-3xl font-bold text-red-400">{vacantUnits} <span className="text-lg text-gray-500 font-normal">Vacant</span></h2>
          </div>
        </div>
      )}

      <details className="bg-yvv-charcoal p-4 rounded-lg border border-gray-800 mb-8 shadow-lg cursor-pointer group">
        <summary className="text-white font-bold list-none flex justify-between items-center outline-none">
          <span>+ Add New Unit</span>
          <span className="text-yvv-cyan group-open:rotate-45 transition-transform duration-300">✕</span>
        </summary>
        <div className="mt-4 pt-4 border-t border-gray-800 cursor-default">
          <form onSubmit={handleAddUnit} className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]"><label className="block text-xs text-yvv-cyan uppercase mb-2">Unit Number</label><input type="text" placeholder="Flat 105" value={newUnitNumber} onChange={(e) => setNewUnitNumber(e.target.value)} className="w-full bg-yvv-charcoalDark border border-gray-700 rounded p-2 text-white outline-none focus:border-yvv-cyan" /></div>
            <div className="flex-1 min-w-[200px]"><label className="block text-xs text-yvv-cyan uppercase mb-2">Base Rent (₹)</label><input type="number" placeholder="15000" value={newBaseRent} onChange={(e) => setNewBaseRent(e.target.value)} className="w-full bg-yvv-charcoalDark border border-gray-700 rounded p-2 text-white outline-none focus:border-yvv-cyan" /></div>
            <button type="submit" className="px-6 py-2 bg-yvv-charcoalDark border border-yvv-cyan text-yvv-cyan rounded hover:bg-yvv-cyan hover:text-yvv-charcoalDark transition-all font-semibold h-[42px]">+ Add</button>
          </form>
        </div>
      </details>

      <div className="flex gap-2 mb-6">
        <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${filter === 'all' ? 'bg-yvv-cyan text-yvv-charcoalDark' : 'bg-yvv-charcoal text-gray-400'}`}>All</button>
        <button onClick={() => setFilter('occupied')} className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${filter === 'occupied' ? 'bg-green-500 text-white' : 'bg-yvv-charcoal text-gray-400'}`}>Occupied</button>
        <button onClick={() => setFilter('vacant')} className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${filter === 'vacant' ? 'bg-red-500 text-white' : 'bg-yvv-charcoal text-gray-400'}`}>Vacant</button>
      </div>

      {editingUnit && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-yvv-charcoal p-8 rounded-xl border border-yvv-cyan w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-2 text-center">Manage Dashboard {editingUnit.unit_number}</h2>
            <form onSubmit={handleUpdateTenant} className="space-y-4 mt-6">
              <div><label className="block text-xs text-yvv-cyan uppercase mb-1">Tenant Name</label><input type="text" value={tenantName} onChange={(e) => setTenantName(e.target.value)} className="w-full bg-yvv-charcoalDark border border-gray-700 rounded p-3 text-white outline-none focus:border-yvv-cyan" /></div>
              <div><label className="block text-xs text-yvv-cyan uppercase mb-1">Rent Escalation Date</label><input type="date" value={escalationDate} onChange={(e) => setEscalationDate(e.target.value)} className="w-full bg-yvv-charcoalDark border border-gray-700 rounded p-3 text-white outline-none focus:border-yvv-cyan" /></div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setEditingUnit(null)} className="flex-1 py-3 text-gray-400 hover:text-white transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-yvv-cyan text-yvv-charcoalDark font-bold rounded-lg hover:brightness-110">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? <p className="text-yvv-cyan animate-pulse text-center">Loading...</p> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedUnits.map((unit) => (
            <div key={unit.id} className="bg-yvv-charcoal rounded-xl p-6 border border-gray-800 shadow-lg flex flex-col justify-between group hover:border-yvv-cyan transition-colors duration-300">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white">{unit.unit_number}</h2>
                    <p className="text-xs text-yvv-cyan uppercase tracking-widest">{unit.properties?.name}</p>
                  </div>
                  <button onClick={() => toggleOccupancy(unit.id, unit.is_occupied)} className={`px-3 py-1 rounded-full text-xs font-semibold ${unit.is_occupied ? 'bg-green-900/50 text-green-400 border border-green-800' : 'bg-red-900/50 text-red-400 border border-red-800'}`}>
                    {unit.is_occupied ? 'Occupied' : 'Vacant'}
                  </button>
                </div>
                
                <div className="space-y-3 my-6">
                  <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-500 text-sm">Tenant</span><span className="text-white font-medium">{unit.current_tenant_name || 'VACANT'}</span></div>
                  <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-500 text-sm">Base Rent</span><span className="text-white font-bold">₹{unit.base_rent}</span></div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-800 space-y-3">
                <Link to={`/unit/${unit.id}`} className="block text-center w-full py-2 bg-yvv-cyan text-yvv-charcoalDark rounded-lg hover:brightness-110 transition-all font-bold text-sm shadow-[0_0_10px_rgba(34,211,238,0.2)]">
                  View Flat Profile →
                </Link>
                <div className="flex gap-2">
                  <button onClick={() => { setEditingUnit(unit); setTenantName(unit.current_tenant_name || ''); setEscalationDate(unit.rent_escalation_date || ''); }} className="flex-1 py-2 bg-yvv-charcoalDark border border-gray-700 text-gray-300 rounded-lg hover:border-yvv-cyan hover:text-white transition-all text-xs font-semibold">
                    Manage
                  </button>
                  <button onClick={() => deleteUnit(unit.id)} className="flex-1 py-2 text-xs text-gray-500 hover:text-red-500 hover:bg-red-900/20 border border-transparent hover:border-red-900/50 rounded-lg transition-all">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ==========================================
// 2. THE NEW FLAT PROFILE PAGE (Day 8: Interactive)
// ==========================================
function UnitDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [unit, setUnit] = useState(null)
  const [loading, setLoading] = useState(true)

  // --- DAY 8: Interactive Editing States ---
  const [isEditingFinancials, setIsEditingFinancials] = useState(false)
  const [editRent, setEditRent] = useState('')
  const [editMaintenance, setEditMaintenance] = useState('')

  const [isEditingTenant, setIsEditingTenant] = useState(false)
  const [editTenantName, setEditTenantName] = useState('')
  const [editEscalationDate, setEditEscalationDate] = useState('')

  useEffect(() => {
    fetchUnit()
  }, [id])

  const fetchUnit = async () => {
    try {
      const { data, error } = await supabase.from('units').select('*, properties(name)').eq('id', id).single()
      if (error) throw error
      setUnit(data)
      // Pre-fill forms with current database data
      setEditRent(data.base_rent)
      setEditMaintenance(data.maintenance_fee)
      setEditTenantName(data.current_tenant_name || '')
      setEditEscalationDate(data.rent_escalation_date || '')
    } catch (error) { console.error(error.message) } finally { setLoading(false) }
  }

  // --- DAY 8: Save Functions ---
  const handleSaveFinancials = async () => {
    try {
      const { error } = await supabase.from('units')
        .update({ base_rent: editRent, maintenance_fee: editMaintenance }).eq('id', id)
      if (error) throw error
      setIsEditingFinancials(false)
      fetchUnit() // Refresh the local view
    } catch (error) { alert(error.message) }
  }

  const handleSaveTenant = async () => {
    try {
      const { error } = await supabase.from('units')
        .update({ 
          current_tenant_name: editTenantName, 
          rent_escalation_date: editEscalationDate || null,
          is_occupied: editTenantName.length > 0 
        }).eq('id', id)
      if (error) throw error
      setIsEditingTenant(false)
      fetchUnit()
    } catch (error) { alert(error.message) }
  }

  if (loading) return <div className="min-h-screen bg-yvv-charcoalDark flex justify-center items-center text-yvv-cyan animate-pulse">Loading Profile...</div>
  if (!unit) return <div className="min-h-screen bg-yvv-charcoalDark flex justify-center items-center text-red-500">Unit not found.</div>

  return (
    <div className="min-h-screen bg-yvv-charcoalDark text-gray-200 p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate('/')} className="text-gray-400 hover:text-yvv-cyan transition-colors mb-8 flex items-center gap-2 font-semibold">
          <span>←</span> Back to Dashboard
        </button>

        <header className="mb-10 flex justify-between items-end border-b border-yvv-charcoal pb-6">
          <div>
            <h1 className="text-5xl font-bold text-white mb-2">{unit.unit_number}</h1>
            <p className="text-yvv-cyan uppercase tracking-widest text-sm">{unit.properties?.name}</p>
          </div>
          <div className={`px-4 py-2 rounded-full text-sm font-bold ${unit.is_occupied ? 'bg-green-900/50 text-green-400 border border-green-800' : 'bg-red-900/50 text-red-400 border border-red-800'}`}>
            {unit.is_occupied ? 'Occupied' : 'Vacant'}
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* --- TENANT DETAILS CARD --- */}
          <div className="bg-yvv-charcoal p-6 rounded-xl border border-gray-800 shadow-lg">
            <h2 className="text-xl font-bold text-white mb-6 border-b border-gray-700 pb-2">Tenant Information</h2>
            
            {isEditingTenant ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-yvv-cyan uppercase mb-1">Name</label>
                  <input type="text" value={editTenantName} onChange={(e) => setEditTenantName(e.target.value)} className="w-full bg-yvv-charcoalDark border border-gray-700 rounded p-2 text-white outline-none focus:border-yvv-cyan" />
                </div>
                <div>
                  <label className="block text-xs text-yvv-cyan uppercase mb-1">Rent Escalation Date</label>
                  <input type="date" value={editEscalationDate} onChange={(e) => setEditEscalationDate(e.target.value)} className="w-full bg-yvv-charcoalDark border border-gray-700 rounded p-2 text-white outline-none focus:border-yvv-cyan" />
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={handleSaveTenant} className="px-4 py-2 bg-yvv-cyan text-yvv-charcoalDark font-bold rounded text-sm hover:brightness-110">Save</button>
                  <button onClick={() => setIsEditingTenant(false)} className="px-4 py-2 text-gray-400 hover:text-white text-sm">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Name</p>
                  <p className="text-lg text-white font-medium">{unit.current_tenant_name || 'No tenant assigned'}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Rent Escalation Date</p>
                  <p className="text-white">{unit.rent_escalation_date ? new Date(unit.rent_escalation_date).toLocaleDateString() : 'Not Set'}</p>
                </div>
                <div className="mt-6 pt-4 border-t border-gray-700">
                  <button onClick={() => setIsEditingTenant(true)} className="text-yvv-cyan text-sm hover:underline font-semibold">Edit Tenant ✎</button>
                </div>
              </div>
            )}
          </div>

          {/* --- FINANCIALS CARD --- */}
          <div className="bg-yvv-charcoal p-6 rounded-xl border border-gray-800 shadow-lg">
            <h2 className="text-xl font-bold text-white mb-6 border-b border-gray-700 pb-2">Financials</h2>
            
            {isEditingFinancials ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-yvv-cyan uppercase mb-1">Base Rent (₹)</label>
                  <input type="number" value={editRent} onChange={(e) => setEditRent(e.target.value)} className="w-full bg-yvv-charcoalDark border border-gray-700 rounded p-2 text-white outline-none focus:border-yvv-cyan" />
                </div>
                <div>
                  <label className="block text-xs text-yvv-cyan uppercase mb-1">Maintenance Fee (₹)</label>
                  <input type="number" value={editMaintenance} onChange={(e) => setEditMaintenance(e.target.value)} className="w-full bg-yvv-charcoalDark border border-gray-700 rounded p-2 text-white outline-none focus:border-yvv-cyan" />
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={handleSaveFinancials} className="px-4 py-2 bg-yvv-cyan text-yvv-charcoalDark font-bold rounded text-sm hover:brightness-110">Save</button>
                  <button onClick={() => setIsEditingFinancials(false)} className="px-4 py-2 text-gray-400 hover:text-white text-sm">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Base Rent</p>
                  <p className="text-3xl text-white font-bold">₹{unit.base_rent}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Maintenance Fee</p>
                  <p className="text-white text-lg">₹{unit.maintenance_fee}</p>
                </div>
                <div className="mt-6 pt-4 border-t border-gray-700">
                  <button onClick={() => setIsEditingFinancials(true)} className="text-yvv-cyan text-sm hover:underline font-semibold">Edit Financials ✎</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ==========================================
// 3. THE APP ROUTER
// ==========================================
export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/unit/:id" element={<UnitDetail />} />
      </Routes>
    </Router>
  )
}