import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import { BrowserRouter as Router, Routes, Route, Link, useParams, useNavigate } from 'react-router-dom'

// ==========================================
// 1. THE MAIN DASHBOARD PAGE
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

  // NEW: State to hold the current month's water bills for the dashboard cards
  const [currentWaterBills, setCurrentWaterBills] = useState({})

  useEffect(() => { 
    fetchUnits()
    fetchCurrentWaterBills() 
  }, [])

  const fetchUnits = async () => {
    try {
      const { data, error } = await supabase.from('units').select(`*, properties(name)`).order('unit_number', { ascending: true })
      if (error) throw error
      setUnits(data)
    } catch (error) { console.error(error.message) } finally { setLoading(false) }
  }

  // NEW: Fetch current month water bills to display on the cards
  const fetchCurrentWaterBills = async () => {
    const currentMonth = new Date().toISOString().slice(0, 7) // Gets YYYY-MM
    try {
      const { data } = await supabase.from('unit_water_readings').select('unit_id, flat_bill_amount').eq('billing_month', currentMonth)
      if (data) {
        const billsMap = {}
        data.forEach(bill => billsMap[bill.unit_id] = bill.flat_bill_amount)
        setCurrentWaterBills(billsMap)
      }
    } catch (error) { console.error("Could not fetch water bills for dashboard") }
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
    try { await supabase.from('units').update({ is_occupied: !currentStatus }).eq('id', id); fetchUnits() } catch (error) { alert(error.message) }
  }

  const deleteUnit = async (id) => {
    if (!window.confirm("Are you sure you want to delete this unit?")) return
    try { await supabase.from('units').delete().eq('id', id); fetchUnits() } catch (error) { alert(error.message) }
  }

  const handleUpdateTenant = async (e) => {
    e.preventDefault()
    try {
      await supabase.from('units').update({ current_tenant_name: tenantName, rent_escalation_date: escalationDate || null, is_occupied: tenantName.length > 0 }).eq('id', editingUnit.id)
      setEditingUnit(null); fetchUnits()
    } catch (error) { alert(error.message) }
  }

  const getEscalationStatus = (dateString) => {
    if (!dateString) return null
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const escalation = new Date(dateString)
    const diffDays = Math.ceil((escalation - today) / (1000 * 60 * 60 * 24))
    if (diffDays < 0) return { status: 'overdue', days: Math.abs(diffDays) }
    if (diffDays <= 30) return { status: 'due_soon', days: diffDays }
    return null
  }

  const totalUnits = units.length
  const occupiedUnits = units.filter(u => u.is_occupied).length
  const vacantUnits = totalUnits - occupiedUnits
  const monthlyRevenue = units.filter(u => u.is_occupied).reduce((sum, unit) => sum + (Number(unit.base_rent) || 0), 0)
  const escalationAlerts = units.filter(u => u.is_occupied && getEscalationStatus(u.rent_escalation_date) !== null)

  const displayedUnits = units.filter(unit => {
    if (filter === 'all') return true
    if (filter === 'occupied') return unit.is_occupied
    if (filter === 'vacant') return !unit.is_occupied
    if (filter === 'alerts') return unit.is_occupied && getEscalationStatus(unit.rent_escalation_date) !== null
    return true
  })

  return (
    <div className="min-h-screen bg-yvv-charcoalDark text-gray-200 p-8 font-sans">
      <header className="mb-8 border-b border-yvv-charcoal pb-4 flex justify-between items-end">
        <div><h1 className="text-3xl font-bold text-yvv-cyan tracking-widest">YPMA</h1><p className="text-sm text-gray-400 mt-1">Tenant Management Portal</p></div>
        <Link to="/water" className="px-6 py-2 bg-yvv-cyan text-yvv-charcoalDark font-bold rounded shadow-[0_0_15px_rgba(34,211,238,0.3)] hover:brightness-110 transition-all">💧 Water Billing Portal</Link>
      </header>

      {escalationAlerts.length > 0 && (
        <div className="mb-8 bg-yellow-900/30 border border-yellow-600 p-4 rounded-lg flex items-center justify-between shadow-[0_0_15px_rgba(202,138,4,0.1)]">
          <div className="flex items-center gap-3"><span className="text-2xl">⚠️</span><div><h3 className="text-yellow-500 font-bold">Lease Renewals Due</h3><p className="text-sm text-yellow-200/70">You have {escalationAlerts.length} unit(s) with leases expiring in the next 30 days or already overdue.</p></div></div>
          <button onClick={() => setFilter('alerts')} className="px-4 py-2 bg-yellow-600 text-yellow-50 font-bold text-sm rounded hover:bg-yellow-500 transition-colors">View Alerts</button>
        </div>
      )}

      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-yvv-charcoal p-6 rounded-lg border border-gray-800 shadow-lg"><p className="text-gray-400 text-sm uppercase tracking-wider mb-1">Total Monthly Revenue</p><h2 className="text-3xl font-bold text-white">₹{monthlyRevenue.toLocaleString('en-IN')}</h2></div>
          <div className="bg-yvv-charcoal p-6 rounded-lg border border-gray-800 shadow-lg"><p className="text-gray-400 text-sm uppercase tracking-wider mb-1">Portfolio Occupancy</p><h2 className="text-3xl font-bold text-white">{occupiedUnits} <span className="text-lg text-gray-500 font-normal">/ {totalUnits} Units</span></h2></div>
          <div className="bg-yvv-charcoal p-6 rounded-lg border border-red-900/50 shadow-lg"><p className="text-gray-400 text-sm uppercase tracking-wider mb-1">Action Needed</p><h2 className="text-3xl font-bold text-red-400">{vacantUnits} <span className="text-lg text-gray-500 font-normal">Vacant</span></h2></div>
        </div>
      )}

      <details className="bg-yvv-charcoal p-4 rounded-lg border border-gray-800 mb-8 shadow-lg cursor-pointer group">
        <summary className="text-white font-bold list-none flex justify-between items-center outline-none"><span>+ Add New Unit</span><span className="text-yvv-cyan group-open:rotate-45 transition-transform duration-300">✕</span></summary>
        <div className="mt-4 pt-4 border-t border-gray-800 cursor-default">
          <form onSubmit={handleAddUnit} className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]"><label className="block text-xs text-yvv-cyan uppercase mb-2">Unit Number</label><input type="text" placeholder="Flat 105" value={newUnitNumber} onChange={(e) => setNewUnitNumber(e.target.value)} className="w-full bg-yvv-charcoalDark border border-gray-700 rounded p-2 text-white outline-none focus:border-yvv-cyan" /></div>
            <div className="flex-1 min-w-[200px]"><label className="block text-xs text-yvv-cyan uppercase mb-2">Base Rent (₹)</label><input type="number" placeholder="15000" value={newBaseRent} onChange={(e) => setNewBaseRent(e.target.value)} className="w-full bg-yvv-charcoalDark border border-gray-700 rounded p-2 text-white outline-none focus:border-yvv-cyan" /></div>
            <button type="submit" className="px-6 py-2 bg-yvv-charcoalDark border border-yvv-cyan text-yvv-cyan rounded font-semibold h-[42px]">+ Add</button>
          </form>
        </div>
      </details>

      <div className="flex gap-2 mb-6">
        <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${filter === 'all' ? 'bg-yvv-cyan text-yvv-charcoalDark' : 'bg-yvv-charcoal text-gray-400'}`}>All</button>
        <button onClick={() => setFilter('occupied')} className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${filter === 'occupied' ? 'bg-green-500 text-white' : 'bg-yvv-charcoal text-gray-400'}`}>Occupied</button>
        <button onClick={() => setFilter('vacant')} className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${filter === 'vacant' ? 'bg-red-500 text-white' : 'bg-yvv-charcoal text-gray-400'}`}>Vacant</button>
        <button onClick={() => setFilter('alerts')} className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${filter === 'alerts' ? 'bg-yellow-500 text-yellow-950' : 'bg-yvv-charcoal text-gray-400 hover:text-yellow-500'}`}>Alerts ({escalationAlerts.length})</button>
      </div>

      {editingUnit && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-yvv-charcoal p-8 rounded-xl border border-yvv-cyan w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-2 text-center">Manage {editingUnit.unit_number}</h2>
            <form onSubmit={handleUpdateTenant} className="space-y-4 mt-6">
              <div><label className="block text-xs text-yvv-cyan uppercase mb-1">Tenant Name</label><input type="text" value={tenantName} onChange={(e) => setTenantName(e.target.value)} className="w-full bg-yvv-charcoalDark border border-gray-700 rounded p-3 text-white outline-none focus:border-yvv-cyan" /></div>
              <div><label className="block text-xs text-yvv-cyan uppercase mb-1">Rent Escalation Date</label><input type="date" value={escalationDate} onChange={(e) => setEscalationDate(e.target.value)} className="w-full bg-yvv-charcoalDark border border-gray-700 rounded p-3 text-white outline-none focus:border-yvv-cyan" /></div>
              <div className="flex gap-3 pt-4"><button type="button" onClick={() => setEditingUnit(null)} className="flex-1 py-3 text-gray-400 hover:text-white">Cancel</button><button type="submit" className="flex-1 py-3 bg-yvv-cyan text-yvv-charcoalDark font-bold rounded-lg hover:brightness-110">Save</button></div>
            </form>
          </div>
        </div>
      )}

      {loading ? <p className="text-yvv-cyan animate-pulse text-center">Loading...</p> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedUnits.map((unit) => {
            const alertStatus = unit.is_occupied ? getEscalationStatus(unit.rent_escalation_date) : null;
            const waterBillForThisUnit = currentWaterBills[unit.id]

            return (
              <div key={unit.id} className={`bg-yvv-charcoal rounded-xl p-6 border shadow-lg flex flex-col justify-between group transition-colors duration-300 ${alertStatus ? 'border-yellow-600/50 hover:border-yellow-500' : 'border-gray-800 hover:border-yvv-cyan'}`}>
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-white">{unit.unit_number}</h2>
                      <p className="text-xs text-yvv-cyan uppercase tracking-widest">{unit.properties?.name}</p>
                    </div>
                    <button onClick={() => toggleOccupancy(unit.id, unit.is_occupied)} className={`px-3 py-1 rounded-full text-xs font-semibold ${unit.is_occupied ? 'bg-green-900/50 text-green-400 border border-green-800' : 'bg-red-900/50 text-red-400 border border-red-800'}`}>{unit.is_occupied ? 'Occupied' : 'Vacant'}</button>
                  </div>
                  
                  {alertStatus && (
                    <div className="mb-4 bg-yellow-900/20 text-yellow-500 text-xs font-bold p-2 rounded border border-yellow-800/50">
                      ⚠️ {alertStatus.status === 'overdue' ? `Lease overdue by ${alertStatus.days} days!` : `Lease expires in ${alertStatus.days} days`}
                    </div>
                  )}

                  {/* NEW: Updated Dashboard Card Display with Maint & Water */}
                  <div className="space-y-3 my-6 bg-yvv-charcoalDark p-4 rounded border border-gray-800">
                    <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-500 text-sm">Tenant</span><span className="text-white font-medium">{unit.current_tenant_name || 'VACANT'}</span></div>
                    <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-500 text-sm">Base Rent</span><span className="text-white font-bold">₹{unit.base_rent}</span></div>
                    <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-500 text-sm">Maintenance</span><span className="text-gray-300 font-bold">₹{unit.maintenance_fee || 0}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500 text-sm">Water Bill (This Month)</span><span className="text-yvv-cyan font-bold">{waterBillForThisUnit ? `₹${Math.round(waterBillForThisUnit)}` : 'Pending'}</span></div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-800 space-y-3">
                  <Link to={`/unit/${unit.id}`} className="block text-center w-full py-2 bg-yvv-cyan text-yvv-charcoalDark rounded-lg hover:brightness-110 font-bold text-sm shadow-[0_0_10px_rgba(34,211,238,0.2)]">View Flat Profile →</Link>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditingUnit(unit); setTenantName(unit.current_tenant_name || ''); setEscalationDate(unit.rent_escalation_date || ''); }} className="flex-1 py-2 bg-yvv-charcoalDark border border-gray-700 text-gray-300 rounded-lg text-xs font-semibold hover:border-yvv-cyan">Quick Manage</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ==========================================
// 2. THE WATER BILLING PAGE (Unchanged)
// ==========================================
function WaterBilling() {
  const navigate = useNavigate()
  const [units, setUnits] = useState([])
  const [loading, setLoading] = useState(true)
  const [billingMonth, setBillingMonth] = useState(new Date().toISOString().slice(0, 7))
  const [municipalBill, setMunicipalBill] = useState('')
  const [tankerCharges, setTankerCharges] = useState('')
  const [electricityBill, setElectricityBill] = useState('')
  const [readings, setReadings] = useState({})

  useEffect(() => { fetchUnits() }, [])

  const fetchUnits = async () => {
    try {
      const { data, error } = await supabase.from('units').select('id, unit_number, current_tenant_name, property_id').eq('is_occupied', true).order('unit_number', { ascending: true })
      if (error) throw error; setUnits(data); const initialReadings = {}; data.forEach(unit => { initialReadings[unit.id] = { previous: 0, current: 0 } }); setReadings(initialReadings)
    } catch (error) { console.error(error.message) } finally { setLoading(false) }
  }

  const handleReadingChange = (unitId, field, value) => { setReadings(prev => ({ ...prev, [unitId]: { ...prev[unitId], [field]: Number(value) || 0 } })) }
  const totalExpense = (Number(municipalBill) || 0) + (Number(tankerCharges) || 0) + (Number(electricityBill) || 0)
  let totalConsumption = 0; units.forEach(unit => { totalConsumption += Math.max(0, readings[unit.id].current - readings[unit.id].previous) })
  const costPerUnit = totalConsumption > 0 ? (totalExpense / totalConsumption) : 0

  const handleSaveToDatabase = async () => {
    const propertyId = units.length > 0 ? units[0].property_id : null; if (!propertyId) return;
    try {
      const { error: buildingError } = await supabase.from('building_water_bills').upsert({ property_id: propertyId, billing_month: billingMonth, municipal_bill: Number(municipalBill) || 0, tanker_charges: Number(tankerCharges) || 0, electricity_bill: Number(electricityBill) || 0, total_building_units: totalConsumption, cost_per_unit: costPerUnit }, { onConflict: 'property_id, billing_month' });
      if (buildingError) throw buildingError;
      const unitPromises = units.map(unit => {
        const prev = readings[unit.id]?.previous || 0; const curr = readings[unit.id]?.current || 0; const consumption = Math.max(0, curr - prev); const flatBill = consumption * costPerUnit;
        return supabase.from('unit_water_readings').upsert({ unit_id: unit.id, billing_month: billingMonth, previous_reading: prev, current_reading: curr, unit_consumption: consumption, flat_bill_amount: flatBill }, { onConflict: 'unit_id, billing_month' });
      });
      await Promise.all(unitPromises); alert("✅ All water readings saved!");
    } catch (error) { alert("Error saving data: " + error.message); }
  }

  return (
    <div className="min-h-screen bg-yvv-charcoalDark text-gray-200 p-8 font-sans pb-24">
      <div className="max-w-6xl mx-auto">
        <button onClick={() => navigate('/')} className="text-gray-400 hover:text-yvv-cyan transition-colors mb-6 flex items-center gap-2 font-semibold"><span>←</span> Back to Dashboard</button>
        <h1 className="text-3xl font-bold text-white mb-8 border-b border-gray-700 pb-4">WATER READING & BILLING</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="col-span-1 bg-yvv-charcoal p-6 rounded-xl border border-gray-800 shadow-lg h-fit sticky top-8">
            <h2 className="text-xs text-gray-400 uppercase tracking-widest border-b border-gray-700 pb-2 mb-4 font-bold">Overview</h2>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-yvv-charcoalDark p-4 rounded border border-gray-700"><p className="text-xs text-gray-400 uppercase">Total Cost:</p><p className="text-2xl text-red-400 font-bold">₹{totalExpense.toLocaleString('en-IN')}</p></div>
                <div className="bg-yvv-charcoalDark p-4 rounded border border-gray-700"><p className="text-xs text-gray-400 uppercase">Unit Cost (C):</p><p className="text-2xl text-yvv-cyan font-bold">₹{costPerUnit.toFixed(2)}<span className="text-sm text-gray-500 font-normal">/u</span></p></div>
              </div>
              <div className="grid grid-cols-2 gap-4 border-t border-gray-700 pt-6">
                <div><p className="text-xs text-gray-400 uppercase">Total Consumed:</p><p className="text-2xl text-white font-bold">{totalConsumption} u</p></div>
                <div><p className="text-xs text-gray-400 uppercase">Month:</p><input type="month" value={billingMonth} onChange={(e) => setBillingMonth(e.target.value)} className="bg-transparent text-white font-bold outline-none border-b border-yvv-cyan w-full mt-1" /></div>
              </div>
            </div>
          </div>
          <div className="col-span-1 lg:col-span-2 space-y-6">
            <div className="bg-yvv-charcoal p-6 rounded-xl border border-yvv-cyan shadow-[0_0_15px_rgba(34,211,238,0.1)]">
              <h2 className="text-xs text-yvv-cyan uppercase tracking-widest mb-4 font-bold">Building Calculator Input</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div><label className="block text-sm text-gray-400 mb-1">Municipal Bill (₹)</label><input type="number" value={municipalBill} onChange={(e) => setMunicipalBill(e.target.value)} className="w-full bg-yvv-charcoalDark border border-gray-700 rounded p-3 text-white outline-none focus:border-yvv-cyan" /></div>
                <div><label className="block text-sm text-gray-400 mb-1">Tanker Charges (₹)</label><input type="number" value={tankerCharges} onChange={(e) => setTankerCharges(e.target.value)} className="w-full bg-yvv-charcoalDark border border-gray-700 rounded p-3 text-white outline-none focus:border-yvv-cyan" /></div>
                <div><label className="block text-sm text-yvv-cyan font-bold mb-1">Motor/Elec (₹)</label><input type="number" value={electricityBill} onChange={(e) => setElectricityBill(e.target.value)} className="w-full bg-yvv-charcoalDark border border-yvv-cyan rounded p-3 text-white outline-none" /></div>
              </div>
            </div>
            <div className="bg-yvv-charcoal rounded-xl border border-gray-800 overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead><tr className="bg-gray-800/50 border-b border-gray-700 text-xs text-gray-400 uppercase tracking-wider"><th className="p-4">Unit</th><th className="p-4">Prev</th><th className="p-4">Curr</th><th className="p-4 bg-gray-800">Bill</th></tr></thead>
                  <tbody>
                    {units.map((unit) => {
                      const prev = readings[unit.id]?.previous || 0; const curr = readings[unit.id]?.current || 0; const bill = Math.max(0, curr - prev) * costPerUnit;
                      return (
                        <tr key={unit.id} className="border-b border-gray-800">
                          <td className="p-4 text-white font-bold">{unit.unit_number}</td>
                          <td className="p-4"><input type="number" value={prev===0?'':prev} onChange={(e) => handleReadingChange(unit.id, 'previous', e.target.value)} className="w-20 bg-transparent border-b border-gray-700 text-white outline-none" /></td>
                          <td className="p-4"><input type="number" value={curr===0?'':curr} onChange={(e) => handleReadingChange(unit.id, 'current', e.target.value)} className="w-20 bg-yvv-charcoalDark border border-gray-600 rounded p-1 text-white outline-none" /></td>
                          <td className="p-4 font-bold text-yvv-cyan bg-gray-800/20">₹{Math.round(bill)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="flex justify-end pt-4"><button onClick={handleSaveToDatabase} className="px-8 py-3 bg-green-500 text-white font-bold rounded-lg hover:bg-green-400">Save All Readings</button></div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ==========================================
// 3. FLAT PROFILE PAGE (Upgraded with New Dates & Advance)
// ==========================================
function UnitDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [unit, setUnit] = useState(null)
  const [loading, setLoading] = useState(true)

  const [editMode, setEditMode] = useState({ tenant: false, tech: false, financial: false })
  const [formData, setFormData] = useState({})

  const [paymentMonth, setPaymentMonth] = useState(new Date().toISOString().slice(0, 7))
  const [payments, setPayments] = useState({ rent_paid: false, maintenance_paid: false, water_paid: false })
  const [waterCost, setWaterCost] = useState('Variable')
  const [tenantHistory, setTenantHistory] = useState([])
  
  // NEW: State for the dynamically calculated Last Rent Paid Date
  const [lastRentPaid, setLastRentPaid] = useState('Checking...')

  useEffect(() => { 
    fetchUnit()
    fetchTenantHistory() 
    fetchLastRentPaid() // Fetch the exact date from the ledger history
  }, [id])

  useEffect(() => { 
    if (unit) { fetchPayments(); fetchWaterBill() } 
  }, [id, paymentMonth, unit])

  const fetchUnit = async () => {
    try {
      const { data, error } = await supabase.from('units').select('*, properties(name)').eq('id', id).single()
      if (error) throw error
      setUnit(data)
      setFormData({
        tenantName: data.current_tenant_name || '',
        phone: data.phone_number || '',
        escalation: data.rent_escalation_date || '',
        keyNo: data.key_number || '',
        electricMeter: data.electric_meter_number || '',
        ptin: data.ptin || '',
        rent: data.base_rent || '',
        maintenance: data.maintenance_fee || '',
        advance: data.advance_amount || '',
        lastRentChange: data.last_rent_change_date || '' // NEW FIELD
      })
    } catch (error) { console.error(error.message) } finally { setLoading(false) }
  }

  // NEW: Searches the ledger for the last time the "Rent Paid" box was checked
  const fetchLastRentPaid = async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('payment_month')
        .eq('unit_id', id)
        .eq('rent_paid', true)
        .order('payment_month', { ascending: false })
        .limit(1)
        .single()
      
      if (data) setLastRentPaid(data.payment_month)
      else setLastRentPaid('No records found')
    } catch (error) { setLastRentPaid('No records found') }
  }

  const fetchTenantHistory = async () => {
    try {
      const { data, error } = await supabase.from('tenant_history').select('*').eq('unit_id', id).order('move_out_date', { ascending: false })
      if (error) throw error; setTenantHistory(data)
    } catch (error) { console.error("Error fetching history:", error.message) }
  }

  const handleArchiveTenant = async () => {
    if (!unit.current_tenant_name) return alert("No active tenant to archive!")
    if (!window.confirm(`Are you sure you want to archive ${unit.current_tenant_name} and reset this flat?`)) return
    try {
      const { error: historyError } = await supabase.from('tenant_history').insert([{ unit_id: id, tenant_name: unit.current_tenant_name, phone_number: unit.phone_number }])
      if (historyError) throw historyError
      const { error: wipeError } = await supabase.from('units').update({ current_tenant_name: null, phone_number: null, advance_amount: 0, rent_escalation_date: null, is_occupied: false }).eq('id', id)
      if (wipeError) throw wipeError
      alert("Tenant archived successfully. The unit is now vacant.")
      fetchUnit(); fetchTenantHistory()
    } catch (error) { alert("Error archiving tenant: " + error.message) }
  }

  const handleSave = async (section) => {
    try {
      let updateData = {}
      if (section === 'tenant') {
        updateData = { current_tenant_name: formData.tenantName, phone_number: formData.phone, rent_escalation_date: formData.escalation || null, is_occupied: formData.tenantName.length > 0 }
      } else if (section === 'tech') {
        updateData = { key_number: formData.keyNo, electric_meter_number: formData.electricMeter, ptin: formData.ptin }
      } else if (section === 'financial') {
        updateData = { base_rent: formData.rent, maintenance_fee: formData.maintenance, advance_amount: formData.advance, last_rent_change_date: formData.lastRentChange || null }
      }

      await supabase.from('units').update(updateData).eq('id', id)
      setEditMode({ ...editMode, [section]: false }); fetchUnit()
    } catch (error) { alert(error.message) }
  }

  const fetchPayments = async () => {
    try {
      const { data } = await supabase.from('payments').select('*').eq('unit_id', id).eq('payment_month', paymentMonth).single()
      if (data) setPayments({ rent_paid: data.rent_paid, maintenance_paid: data.maintenance_paid, water_paid: data.water_paid })
      else setPayments({ rent_paid: false, maintenance_paid: false, water_paid: false })
    } catch (error) { setPayments({ rent_paid: false, maintenance_paid: false, water_paid: false }) }
  }

  const fetchWaterBill = async () => {
    try {
      const { data } = await supabase.from('unit_water_readings').select('flat_bill_amount').eq('unit_id', id).eq('billing_month', paymentMonth).single()
      if (data) setWaterCost(Math.round(data.flat_bill_amount))
      else setWaterCost('Variable')
    } catch (err) { setWaterCost('Variable') }
  }

  const handleTogglePayment = async (field) => {
    const updatedPayments = { ...payments, [field]: !payments[field] }; setPayments(updatedPayments)
    try { 
      await supabase.from('payments').upsert({ unit_id: id, payment_month: paymentMonth, rent_paid: updatedPayments.rent_paid, maintenance_paid: updatedPayments.maintenance_paid, water_paid: updatedPayments.water_paid }, { onConflict: 'unit_id, payment_month' }) 
      // If they just checked "Rent Paid", refresh the Last Rent Paid date!
      if (field === 'rent_paid') fetchLastRentPaid();
    } catch (error) { fetchPayments() }
  }

  if (loading) return <div className="min-h-screen bg-yvv-charcoalDark flex justify-center items-center text-yvv-cyan">Loading...</div>
  if (!unit) return <div className="min-h-screen bg-yvv-charcoalDark flex justify-center items-center text-red-500">Unit not found.</div>

  return (
    <div className="min-h-screen bg-[#e5e7eb] text-gray-900 p-8 font-sans pb-24">
      <div className="max-w-5xl mx-auto">
        <button onClick={() => navigate('/')} className="text-gray-600 hover:text-black transition-colors mb-6 flex items-center gap-2 font-bold"><span>←</span> Back to Dashboard</button>

        <header className="mb-6 bg-white p-6 rounded shadow-sm border-t-4 border-gray-400 flex justify-between items-start">
          <div className="flex gap-6 items-center">
             <div className="w-24 h-24 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-2xl">🏢</div>
             <div>
               <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">{unit.properties?.name}</p>
               <h1 className="text-4xl font-bold text-gray-900 mb-1">FLAT {unit.unit_number}</h1>
               <div className={`inline-block px-3 py-1 rounded text-xs font-bold ${unit.is_occupied ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{unit.is_occupied ? 'OCCUPIED' : 'VACANT'}</div>
             </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="col-span-1 md:col-span-2 bg-white p-6 rounded shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-4 border-b pb-2"><h2 className="text-lg font-bold text-gray-800">Tenant Details</h2>{!editMode.tenant && <button onClick={() => setEditMode({...editMode, tenant: true})} className="text-blue-600 text-sm hover:underline">✎ Edit</button>}</div>
            {editMode.tenant ? (
              <div className="space-y-3">
                <div><label className="text-xs text-gray-500 font-bold mb-1 block">Tenant Name</label><input type="text" placeholder="Name" value={formData.tenantName} onChange={(e) => setFormData({...formData, tenantName: e.target.value})} className="w-full border rounded p-2 text-sm" /></div>
                <div><label className="text-xs text-gray-500 font-bold mb-1 block">Phone Number</label><input type="text" placeholder="Phone" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full border rounded p-2 text-sm" /></div>
                <div><label className="text-xs text-gray-500 font-bold mb-1 block">Rent Escalation Date (Triggers Dashboard Alert)</label><input type="date" value={formData.escalation} onChange={(e) => setFormData({...formData, escalation: e.target.value})} className="w-full border rounded p-2 text-sm" /></div>
                <div className="flex gap-2 pt-2"><button onClick={() => handleSave('tenant')} className="px-4 py-2 bg-blue-600 text-white text-sm rounded font-bold">Save</button><button onClick={() => setEditMode({...editMode, tenant: false})} className="text-sm text-gray-500">Cancel</button></div>
              </div>
            ) : (
              <div className="flex justify-between items-center">
                <div className="space-y-1"><p className="text-lg font-bold text-gray-900">{unit.current_tenant_name || 'No active tenant'}</p><p className="text-sm text-gray-600">Phone: {unit.phone_number || 'N/A'}</p></div>
                {unit.is_occupied && <button onClick={handleArchiveTenant} className="px-4 py-2 bg-gray-100 border border-gray-300 rounded text-sm font-bold text-gray-700 hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-colors">Archive & Change Tenant</button>}
              </div>
            )}
          </div>
          <div className="col-span-1 bg-white p-6 rounded shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-4 border-b pb-2"><h2 className="text-lg font-bold text-gray-800">Technical Info</h2>{!editMode.tech && <button onClick={() => setEditMode({...editMode, tech: true})} className="text-blue-600 text-sm hover:underline">✎ Edit</button>}</div>
            {editMode.tech ? (
              <div className="space-y-3">
                <input type="text" placeholder="Key No." value={formData.keyNo} onChange={(e) => setFormData({...formData, keyNo: e.target.value})} className="w-full border rounded p-2 text-sm" />
                <input type="text" placeholder="Electric Meter No." value={formData.electricMeter} onChange={(e) => setFormData({...formData, electricMeter: e.target.value})} className="w-full border rounded p-2 text-sm" />
                <input type="text" placeholder="PTIN (Tax ID)" value={formData.ptin} onChange={(e) => setFormData({...formData, ptin: e.target.value})} className="w-full border rounded p-2 text-sm" />
                <div className="flex gap-2"><button onClick={() => handleSave('tech')} className="px-4 py-2 bg-blue-600 text-white text-sm rounded font-bold">Save</button><button onClick={() => setEditMode({...editMode, tech: false})} className="text-sm text-gray-500">Cancel</button></div>
              </div>
            ) : (
              <div className="space-y-2 text-sm text-gray-800">
                <p><strong>Key No.:</strong> {unit.key_number || '-'}</p><p><strong>Meter No.:</strong> {unit.electric_meter_number || '-'}</p><p><strong>PTIN:</strong> {unit.ptin || '-'}</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded shadow-sm border border-gray-200 mb-6">
          <div className="flex justify-between items-center mb-4 border-b pb-2"><h2 className="text-lg font-bold text-gray-800">Financials & Current Month Ledger</h2>{!editMode.financial && <button onClick={() => setEditMode({...editMode, financial: true})} className="text-blue-600 text-sm hover:underline">✎ Edit Financials</button>}</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              {editMode.financial ? (
                <div className="space-y-3 bg-gray-50 p-4 rounded border">
                  <div><label className="text-xs text-gray-500 font-bold">Monthly Rent</label><input type="number" value={formData.rent} onChange={(e) => setFormData({...formData, rent: e.target.value})} className="w-full border rounded p-2 text-sm" /></div>
                  <div><label className="text-xs text-gray-500 font-bold">Maintenance</label><input type="number" value={formData.maintenance} onChange={(e) => setFormData({...formData, maintenance: e.target.value})} className="w-full border rounded p-2 text-sm" /></div>
                  
                  {/* NEW: Explicit Fields for Advance and Rent Increase Date */}
                  <div className="border-t pt-3 mt-3"><label className="text-xs text-gray-500 font-bold block mb-1">Advance Amount (Deposit)</label><input type="number" value={formData.advance} onChange={(e) => setFormData({...formData, advance: e.target.value})} className="w-full border rounded p-2 text-sm" /></div>
                  <div><label className="text-xs text-gray-500 font-bold block mb-1">Last Rent Increase Date</label><input type="date" value={formData.lastRentChange} onChange={(e) => setFormData({...formData, lastRentChange: e.target.value})} className="w-full border rounded p-2 text-sm" /></div>
                  
                  <div className="flex gap-2 pt-2"><button onClick={() => handleSave('financial')} className="px-4 py-2 bg-blue-600 text-white text-sm rounded font-bold">Save</button><button onClick={() => setEditMode({...editMode, financial: false})} className="text-sm text-gray-500">Cancel</button></div>
                </div>
              ) : (
                <div className="space-y-3 text-sm text-gray-800">
                  <div className="flex justify-between border-b pb-1"><span className="text-gray-500 font-bold">Monthly Rent:</span> <span className="font-bold">₹{unit.base_rent}</span></div>
                  <div className="flex justify-between border-b pb-1"><span className="text-gray-500 font-bold">Maintenance:</span> <span>₹{unit.maintenance_fee}</span></div>
                  <div className="flex justify-between border-b pb-1"><span className="text-gray-500 font-bold">Advance Amount:</span> <span>₹{unit.advance_amount}</span></div>
                  
                  {/* NEW: Displays */}
                  <div className="flex justify-between border-b pb-1"><span className="text-gray-500 font-bold">Last Rent Increase:</span> <span>{unit.last_rent_change_date ? new Date(unit.last_rent_change_date).toLocaleDateString() : 'N/A'}</span></div>
                  <div className="flex justify-between border-b pb-1 pt-2"><span className="text-blue-600 font-bold">Last Rent Paid Date:</span> <span className="text-blue-600 font-bold">{lastRentPaid}</span></div>
                  <div className="flex justify-between pt-2"><span className="text-gray-500 font-bold">Water Bill (Selected Month):</span> <span className="text-blue-600 font-bold">{waterCost === 'Variable' ? 'Variable' : `₹${waterCost}`}</span></div>
                </div>
              )}
            </div>
            <div>
               <div className="flex justify-between items-center mb-2"><p className="text-xs font-bold text-gray-500 uppercase">Payment Status For:</p><input type="month" value={paymentMonth} onChange={(e) => setPaymentMonth(e.target.value)} className="border rounded p-1 text-xs font-bold outline-none" /></div>
               <div className="border rounded divide-y">
                 <label className={`flex items-center p-3 cursor-pointer transition-colors ${payments.rent_paid ? 'bg-green-50' : 'hover:bg-gray-50'}`}><input type="checkbox" checked={payments.rent_paid} onChange={() => handleTogglePayment('rent_paid')} className="w-4 h-4 mr-3 accent-green-600" /><span className={`text-sm font-bold ${payments.rent_paid ? 'text-green-800' : 'text-gray-700'}`}>Rent Paid (₹{unit.base_rent})</span></label>
                 <label className={`flex items-center p-3 cursor-pointer transition-colors ${payments.maintenance_paid ? 'bg-green-50' : 'hover:bg-gray-50'}`}><input type="checkbox" checked={payments.maintenance_paid} onChange={() => handleTogglePayment('maintenance_paid')} className="w-4 h-4 mr-3 accent-green-600" /><span className={`text-sm font-bold ${payments.maintenance_paid ? 'text-green-800' : 'text-gray-700'}`}>Maintenance Paid (₹{unit.maintenance_fee})</span></label>
                 <label className={`flex items-center p-3 cursor-pointer transition-colors ${payments.water_paid ? 'bg-green-50' : 'hover:bg-gray-50'}`}><input type="checkbox" checked={payments.water_paid} onChange={() => handleTogglePayment('water_paid')} className="w-4 h-4 mr-3 accent-green-600" /><span className={`text-sm font-bold ${payments.water_paid ? 'text-green-800' : 'text-gray-700'}`}>Water Bill Paid</span></label>
               </div>
            </div>
          </div>
        </div>

        <details className="bg-white p-4 rounded shadow-sm border border-gray-200 group cursor-pointer">
          <summary className="text-gray-800 font-bold list-none flex justify-between items-center outline-none"><span className="flex items-center gap-2">📜 Past Tenant History</span><span className="text-gray-400 group-open:rotate-180 transition-transform duration-300">▼</span></summary>
          <div className="mt-4 pt-4 border-t border-gray-100 cursor-default">
            {tenantHistory.length === 0 ? <p className="text-sm text-gray-500 italic text-center py-4">No past tenants recorded for this unit.</p> : (
              <div className="space-y-3">
                {tenantHistory.map((history) => (
                  <div key={history.id} className="flex justify-between items-center p-3 bg-gray-50 rounded border border-gray-100 text-sm">
                    <div><p className="font-bold text-gray-800">{history.tenant_name}</p><p className="text-xs text-gray-500">📞 {history.phone_number || 'No phone recorded'}</p></div>
                    <div className="text-right"><p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Moved Out</p><p className="font-bold text-gray-700">{new Date(history.move_out_date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</p></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </details>
      </div>
    </div>
  )
}

// ==========================================
// 4. THE APP ROUTER
// ==========================================
export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/unit/:id" element={<UnitDetail />} />
        <Route path="/water" element={<WaterBilling />} />
      </Routes>
    </Router>
  )
}