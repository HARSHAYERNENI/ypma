import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import { BrowserRouter as Router, Routes, Route, Link, useParams, useNavigate } from 'react-router-dom'

// ==========================================
// 1. THE MAIN DASHBOARD PAGE (Unchanged)
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
      <header className="mb-8 border-b border-yvv-charcoal pb-4 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-yvv-cyan tracking-widest">YPMA</h1>
          <p className="text-sm text-gray-400 mt-1">Tenant Management Portal</p>
        </div>
        <Link to="/water" className="px-6 py-2 bg-yvv-cyan text-yvv-charcoalDark font-bold rounded shadow-[0_0_15px_rgba(34,211,238,0.3)] hover:brightness-110 transition-all">
          💧 Water Billing Portal
        </Link>
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
          <span>+ Add New Unit</span><span className="text-yvv-cyan group-open:rotate-45 transition-transform duration-300">✕</span>
        </summary>
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
          {displayedUnits.map((unit) => (
            <div key={unit.id} className="bg-yvv-charcoal rounded-xl p-6 border border-gray-800 shadow-lg flex flex-col justify-between group hover:border-yvv-cyan transition-colors duration-300">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div><h2 className="text-2xl font-bold text-white">{unit.unit_number}</h2><p className="text-xs text-yvv-cyan uppercase tracking-widest">{unit.properties?.name}</p></div>
                  <button onClick={() => toggleOccupancy(unit.id, unit.is_occupied)} className={`px-3 py-1 rounded-full text-xs font-semibold ${unit.is_occupied ? 'bg-green-900/50 text-green-400 border border-green-800' : 'bg-red-900/50 text-red-400 border border-red-800'}`}>{unit.is_occupied ? 'Occupied' : 'Vacant'}</button>
                </div>
                <div className="space-y-3 my-6">
                  <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-500 text-sm">Tenant</span><span className="text-white font-medium">{unit.current_tenant_name || 'VACANT'}</span></div>
                  <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-500 text-sm">Base Rent</span><span className="text-white font-bold">₹{unit.base_rent}</span></div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-800 space-y-3">
                <Link to={`/unit/${unit.id}`} className="block text-center w-full py-2 bg-yvv-cyan text-yvv-charcoalDark rounded-lg hover:brightness-110 font-bold text-sm shadow-[0_0_10px_rgba(34,211,238,0.2)]">View Flat Profile →</Link>
                <div className="flex gap-2">
                  <button onClick={() => { setEditingUnit(unit); setTenantName(unit.current_tenant_name || ''); setEscalationDate(unit.rent_escalation_date || ''); }} className="flex-1 py-2 bg-yvv-charcoalDark border border-gray-700 text-gray-300 rounded-lg text-xs font-semibold hover:border-yvv-cyan">Manage</button>
                  <button onClick={() => deleteUnit(unit.id)} className="flex-1 py-2 text-xs text-gray-500 hover:text-red-500 hover:bg-red-900/20 rounded-lg">Delete</button>
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
// 2. THE WATER BILLING PAGE (Updated with Electricity & Database Save)
// ==========================================
function WaterBilling() {
  const navigate = useNavigate()
  const [units, setUnits] = useState([])
  const [loading, setLoading] = useState(true)
  
  const [billingMonth, setBillingMonth] = useState(new Date().toISOString().slice(0, 7))
  const [municipalBill, setMunicipalBill] = useState('')
  const [tankerCharges, setTankerCharges] = useState('')
  const [electricityBill, setElectricityBill] = useState('') // DAY 10: New Field

  const [readings, setReadings] = useState({})

  useEffect(() => { fetchUnits() }, [])

  const fetchUnits = async () => {
    try {
      const { data, error } = await supabase.from('units').select('id, unit_number, current_tenant_name, property_id').eq('is_occupied', true).order('unit_number', { ascending: true })
      if (error) throw error
      setUnits(data)
      
      const initialReadings = {}
      data.forEach(unit => {
        initialReadings[unit.id] = { previous: 0, current: 0 }
      })
      setReadings(initialReadings)
    } catch (error) { console.error(error.message) } finally { setLoading(false) }
  }

  const handleReadingChange = (unitId, field, value) => {
    setReadings(prev => ({ ...prev, [unitId]: { ...prev[unitId], [field]: Number(value) || 0 } }))
  }

  // --- THE UPDATED MATH ENGINE ---
  const totalExpense = (Number(municipalBill) || 0) + (Number(tankerCharges) || 0) + (Number(electricityBill) || 0)
  
  let totalConsumption = 0
  units.forEach(unit => {
    const consumption = Math.max(0, readings[unit.id].current - readings[unit.id].previous)
    totalConsumption += consumption
  })

  const costPerUnit = totalConsumption > 0 ? (totalExpense / totalConsumption) : 0

  // --- DAY 10: Save to Supabase Engine ---
  const handleSaveToDatabase = async () => {
    const propertyId = units.length > 0 ? units[0].property_id : null;
    if (!propertyId) return;

    try {
      // 1. Save Building Totals
      const { error: buildingError } = await supabase.from('building_water_bills').upsert({
        property_id: propertyId,
        billing_month: billingMonth,
        municipal_bill: Number(municipalBill) || 0,
        tanker_charges: Number(tankerCharges) || 0,
        electricity_bill: Number(electricityBill) || 0,
        total_building_units: totalConsumption,
        cost_per_unit: costPerUnit
      }, { onConflict: 'property_id, billing_month' });

      if (buildingError) throw buildingError;

      // 2. Save Individual Flat Bills
      const unitPromises = units.map(unit => {
        const prev = readings[unit.id]?.previous || 0;
        const curr = readings[unit.id]?.current || 0;
        const consumption = Math.max(0, curr - prev);
        const flatBill = consumption * costPerUnit;

        return supabase.from('unit_water_readings').upsert({
          unit_id: unit.id,
          billing_month: billingMonth,
          previous_reading: prev,
          current_reading: curr,
          unit_consumption: consumption,
          flat_bill_amount: flatBill
        }, { onConflict: 'unit_id, billing_month' });
      });

      await Promise.all(unitPromises);
      alert("✅ All water readings and bills successfully saved to the database!");
    } catch (error) {
      alert("Error saving data: " + error.message);
    }
  }

  return (
    <div className="min-h-screen bg-yvv-charcoalDark text-gray-200 p-8 font-sans pb-24">
      <div className="max-w-6xl mx-auto">
        <button onClick={() => navigate('/')} className="text-gray-400 hover:text-yvv-cyan transition-colors mb-6 flex items-center gap-2 font-semibold"><span>←</span> Back to Dashboard</button>

        <h1 className="text-3xl font-bold text-white mb-8 border-b border-gray-700 pb-4">WATER READING & BILLING</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT SIDE: Overview */}
          <div className="col-span-1 bg-yvv-charcoal p-6 rounded-xl border border-gray-800 shadow-lg h-fit sticky top-8">
            <h2 className="text-xs text-gray-400 uppercase tracking-widest border-b border-gray-700 pb-2 mb-4 font-bold">Property Overview & Costs</h2>
            <div className="space-y-6">
              <div><p className="text-sm text-gray-400">BUILDING:</p><p className="text-xl text-white font-bold tracking-wider">ALKAPURI APARTMENTS</p></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-yvv-charcoalDark p-4 rounded border border-gray-700"><p className="text-xs text-gray-400 uppercase">Total Cost:</p><p className="text-2xl text-red-400 font-bold">₹{totalExpense.toLocaleString('en-IN')}</p></div>
                <div className="bg-yvv-charcoalDark p-4 rounded border border-gray-700"><p className="text-xs text-gray-400 uppercase">Unit Cost (C):</p><p className="text-2xl text-yvv-cyan font-bold">₹{costPerUnit.toFixed(2)}<span className="text-sm text-gray-500 font-normal">/u</span></p></div>
              </div>
              <div className="grid grid-cols-2 gap-4 border-t border-gray-700 pt-6">
                <div><p className="text-xs text-gray-400 uppercase">Total Units Consumed:</p><p className="text-2xl text-white font-bold">{totalConsumption} <span className="text-sm text-gray-500 font-normal">u</span></p></div>
                <div><p className="text-xs text-gray-400 uppercase">Calculation Month:</p><input type="month" value={billingMonth} onChange={(e) => setBillingMonth(e.target.value)} className="bg-transparent text-white font-bold outline-none border-b border-yvv-cyan w-full mt-1" /></div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: Entry */}
          <div className="col-span-1 lg:col-span-2 space-y-6">
            {/* Calculator Input */}
            <div className="bg-yvv-charcoal p-6 rounded-xl border border-yvv-cyan shadow-[0_0_15px_rgba(34,211,238,0.1)]">
              <h2 className="text-xs text-yvv-cyan uppercase tracking-widest mb-4 font-bold">Building Calculator Input</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div><label className="block text-sm text-gray-400 mb-1">Municipal Bill (₹)</label><input type="number" placeholder="20000" value={municipalBill} onChange={(e) => setMunicipalBill(e.target.value)} className="w-full bg-yvv-charcoalDark border border-gray-700 rounded p-3 text-white outline-none focus:border-yvv-cyan" /></div>
                <div><label className="block text-sm text-gray-400 mb-1">Tanker Charges (₹)</label><input type="number" placeholder="10000" value={tankerCharges} onChange={(e) => setTankerCharges(e.target.value)} className="w-full bg-yvv-charcoalDark border border-gray-700 rounded p-3 text-white outline-none focus:border-yvv-cyan" /></div>
                <div><label className="block text-sm text-yvv-cyan font-bold mb-1">Motor/Electricity (₹)</label><input type="number" placeholder="1000" value={electricityBill} onChange={(e) => setElectricityBill(e.target.value)} className="w-full bg-yvv-charcoalDark border border-yvv-cyan rounded p-3 text-white outline-none" /></div>
              </div>
            </div>

            {/* Units Table */}
            <div className="bg-yvv-charcoal rounded-xl border border-gray-800 overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-800/50 border-b border-gray-700 text-xs text-gray-400 uppercase tracking-wider">
                      <th className="p-4 font-semibold">Unit</th><th className="p-4 font-semibold">Tenant</th><th className="p-4 font-semibold text-right">Previous (u)</th><th className="p-4 font-semibold text-right">Current (u)</th><th className="p-4 font-semibold text-center bg-gray-800">Consumption</th><th className="p-4 font-semibold text-right bg-gray-800">Calculated Bill</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan="6" className="p-8 text-center text-yvv-cyan animate-pulse">Loading Units...</td></tr>
                    ) : units.map((unit) => {
                      const prev = readings[unit.id]?.previous || 0;
                      const curr = readings[unit.id]?.current || 0;
                      const consumption = Math.max(0, curr - prev);
                      const bill = consumption * costPerUnit;

                      return (
                        <tr key={unit.id} className="border-b border-gray-800 hover:bg-gray-800/30 transition-colors">
                          <td className="p-4 font-bold text-white whitespace-nowrap">{unit.unit_number}</td>
                          <td className="p-4 text-sm text-gray-400 max-w-[150px] truncate" title={unit.current_tenant_name}>{unit.current_tenant_name || 'Vacant'}</td>
                          <td className="p-4"><input type="number" value={prev === 0 ? '' : prev} onChange={(e) => handleReadingChange(unit.id, 'previous', e.target.value)} className="w-full min-w-[80px] bg-transparent border-b border-gray-700 text-right text-white p-1 focus:border-yvv-cyan outline-none" /></td>
                          <td className="p-4"><input type="number" value={curr === 0 ? '' : curr} onChange={(e) => handleReadingChange(unit.id, 'current', e.target.value)} className="w-full min-w-[80px] bg-yvv-charcoalDark border border-gray-600 rounded text-right text-white p-2 focus:border-yvv-cyan outline-none" /></td>
                          <td className="p-4 text-center font-bold text-gray-300 bg-gray-800/20">{consumption}</td>
                          <td className="p-4 text-right font-bold text-yvv-cyan bg-gray-800/20">₹{Math.round(bill).toLocaleString('en-IN')}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Save Button */}
            <div className="flex justify-end pt-4">
               <button onClick={handleSaveToDatabase} className="px-8 py-3 bg-green-500 text-white font-bold rounded-lg shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:bg-green-400 transition-all">
                 Save All Readings to Database
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ==========================================
// 3. FLAT PROFILE PAGE (Updated Ledger Pull)
// ==========================================
function UnitDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [unit, setUnit] = useState(null)
  const [loading, setLoading] = useState(true)

  const [isEditingFinancials, setIsEditingFinancials] = useState(false)
  const [editRent, setEditRent] = useState('')
  const [editMaintenance, setEditMaintenance] = useState('')
  const [isEditingTenant, setIsEditingTenant] = useState(false)
  const [editTenantName, setEditTenantName] = useState('')
  const [editEscalationDate, setEditEscalationDate] = useState('')

  const [paymentMonth, setPaymentMonth] = useState(new Date().toISOString().slice(0, 7))
  const [payments, setPayments] = useState({ rent_paid: false, maintenance_paid: false, water_paid: false })
  
  // Auto-Fill Water Bill State
  const [waterCost, setWaterCost] = useState('Variable')

  useEffect(() => { fetchUnit() }, [id])

  useEffect(() => {
    if (unit) {
      fetchPayments()
      fetchWaterBill() 
    }
  }, [id, paymentMonth, unit])

  const fetchUnit = async () => {
    try {
      const { data, error } = await supabase.from('units').select('*, properties(name)').eq('id', id).single()
      if (error) throw error
      setUnit(data); setEditRent(data.base_rent); setEditMaintenance(data.maintenance_fee)
      setEditTenantName(data.current_tenant_name || ''); setEditEscalationDate(data.rent_escalation_date || '')
    } catch (error) { console.error(error.message) } finally { setLoading(false) }
  }

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase.from('payments').select('*').eq('unit_id', id).eq('payment_month', paymentMonth).single()
      if (data) setPayments({ rent_paid: data.rent_paid, maintenance_paid: data.maintenance_paid, water_paid: data.water_paid })
      else setPayments({ rent_paid: false, maintenance_paid: false, water_paid: false })
    } catch (error) { setPayments({ rent_paid: false, maintenance_paid: false, water_paid: false }) }
  }

  // --- DAY 10: Updated Fetch logic to pull from the new table ---
  const fetchWaterBill = async () => {
    try {
      const { data, error } = await supabase
        .from('unit_water_readings')
        .select('flat_bill_amount')
        .eq('unit_id', id)
        .eq('billing_month', paymentMonth) 
        .single()
      
      if (data) setWaterCost(Math.round(data.flat_bill_amount))
      else setWaterCost('Variable')
    } catch (err) { setWaterCost('Variable') }
  }

  const handleTogglePayment = async (field) => {
    const updatedPayments = { ...payments, [field]: !payments[field] }
    setPayments(updatedPayments)
    try {
      await supabase.from('payments').upsert({ unit_id: id, payment_month: paymentMonth, rent_paid: updatedPayments.rent_paid, maintenance_paid: updatedPayments.maintenance_paid, water_paid: updatedPayments.water_paid }, { onConflict: 'unit_id, payment_month' })
    } catch (error) { fetchPayments() }
  }

  const handleSaveFinancials = async () => {
    try { await supabase.from('units').update({ base_rent: editRent, maintenance_fee: editMaintenance }).eq('id', id); setIsEditingFinancials(false); fetchUnit() } catch (error) { alert(error.message) }
  }
  const handleSaveTenant = async () => {
    try { await supabase.from('units').update({ current_tenant_name: editTenantName, rent_escalation_date: editEscalationDate || null, is_occupied: editTenantName.length > 0 }).eq('id', id); setIsEditingTenant(false); fetchUnit() } catch (error) { alert(error.message) }
  }

  if (loading) return <div className="min-h-screen bg-yvv-charcoalDark flex justify-center items-center text-yvv-cyan">Loading...</div>
  if (!unit) return <div className="min-h-screen bg-yvv-charcoalDark flex justify-center items-center text-red-500">Unit not found.</div>

  return (
    <div className="min-h-screen bg-yvv-charcoalDark text-gray-200 p-8 font-sans pb-24">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate('/')} className="text-gray-400 hover:text-yvv-cyan transition-colors mb-8 flex items-center gap-2 font-semibold"><span>←</span> Back to Dashboard</button>

        <header className="mb-10 flex justify-between items-end border-b border-yvv-charcoal pb-6">
          <div><h1 className="text-5xl font-bold text-white mb-2">{unit.unit_number}</h1><p className="text-yvv-cyan uppercase tracking-widest text-sm">{unit.properties?.name}</p></div>
          <div className={`px-4 py-2 rounded-full text-sm font-bold ${unit.is_occupied ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>{unit.is_occupied ? 'Occupied' : 'Vacant'}</div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="bg-yvv-charcoal p-6 rounded-xl border border-gray-800 shadow-lg">
            <h2 className="text-xl font-bold text-white mb-6 border-b border-gray-700 pb-2">Tenant Information</h2>
            {isEditingTenant ? (
              <div className="space-y-4">
                <div><label className="text-xs text-yvv-cyan uppercase">Name</label><input type="text" value={editTenantName} onChange={(e) => setEditTenantName(e.target.value)} className="w-full bg-yvv-charcoalDark border border-gray-700 rounded p-2 text-white" /></div>
                <div><label className="text-xs text-yvv-cyan uppercase">Escalation Date</label><input type="date" value={editEscalationDate} onChange={(e) => setEditEscalationDate(e.target.value)} className="w-full bg-yvv-charcoalDark border border-gray-700 rounded p-2 text-white" /></div>
                <div className="flex gap-2"><button onClick={handleSaveTenant} className="px-4 py-2 bg-yvv-cyan text-yvv-charcoalDark font-bold rounded">Save</button><button onClick={() => setIsEditingTenant(false)} className="text-gray-400">Cancel</button></div>
              </div>
            ) : (
              <div className="space-y-4">
                <div><p className="text-gray-500 text-xs uppercase">Name</p><p className="text-lg text-white font-medium">{unit.current_tenant_name || 'No tenant assigned'}</p></div>
                <div><p className="text-gray-500 text-xs uppercase">Escalation Date</p><p className="text-white">{unit.rent_escalation_date ? new Date(unit.rent_escalation_date).toLocaleDateString() : 'Not Set'}</p></div>
                <div className="mt-6 pt-4 border-t border-gray-700"><button onClick={() => setIsEditingTenant(true)} className="text-yvv-cyan text-sm hover:underline font-semibold">Edit Tenant ✎</button></div>
              </div>
            )}
          </div>
          <div className="bg-yvv-charcoal p-6 rounded-xl border border-gray-800 shadow-lg">
            <h2 className="text-xl font-bold text-white mb-6 border-b border-gray-700 pb-2">Financials</h2>
            {isEditingFinancials ? (
              <div className="space-y-4">
                <div><label className="text-xs text-yvv-cyan uppercase">Base Rent (₹)</label><input type="number" value={editRent} onChange={(e) => setEditRent(e.target.value)} className="w-full bg-yvv-charcoalDark border border-gray-700 rounded p-2 text-white" /></div>
                <div><label className="text-xs text-yvv-cyan uppercase">Maintenance Fee (₹)</label><input type="number" value={editMaintenance} onChange={(e) => setEditMaintenance(e.target.value)} className="w-full bg-yvv-charcoalDark border border-gray-700 rounded p-2 text-white" /></div>
                <div className="flex gap-2"><button onClick={handleSaveFinancials} className="px-4 py-2 bg-yvv-cyan text-yvv-charcoalDark font-bold rounded">Save</button><button onClick={() => setIsEditingFinancials(false)} className="text-gray-400">Cancel</button></div>
              </div>
            ) : (
              <div className="space-y-4">
                <div><p className="text-gray-500 text-xs uppercase">Base Rent</p><p className="text-3xl text-white font-bold">₹{unit.base_rent}</p></div>
                <div><p className="text-gray-500 text-xs uppercase">Maintenance Fee</p><p className="text-white text-lg">₹{unit.maintenance_fee}</p></div>
                <div className="mt-6 pt-4 border-t border-gray-700"><button onClick={() => setIsEditingFinancials(true)} className="text-yvv-cyan text-sm hover:underline font-semibold">Edit Financials ✎</button></div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-yvv-charcoal p-8 rounded-xl border border-yvv-cyan shadow-[0_0_15px_rgba(34,211,238,0.1)]">
          <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
            <h2 className="text-2xl font-bold text-white">Monthly Ledger</h2>
            <input type="month" value={paymentMonth} onChange={(e) => setPaymentMonth(e.target.value)} className="bg-yvv-charcoalDark border border-gray-600 rounded p-2 text-yvv-cyan font-semibold outline-none focus:border-yvv-cyan" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer ${payments.rent_paid ? 'bg-green-900/30 border-green-500' : 'bg-yvv-charcoalDark border-gray-700'}`}>
              <div className="flex flex-col"><span className={`font-bold ${payments.rent_paid ? 'text-green-400' : 'text-white'}`}>Base Rent</span><span className="text-sm text-gray-400">₹{unit.base_rent}</span></div>
              <input type="checkbox" checked={payments.rent_paid} onChange={() => handleTogglePayment('rent_paid')} className="w-6 h-6 accent-green-500" />
            </label>

            <label className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer ${payments.maintenance_paid ? 'bg-green-900/30 border-green-500' : 'bg-yvv-charcoalDark border-gray-700'}`}>
              <div className="flex flex-col"><span className={`font-bold ${payments.maintenance_paid ? 'text-green-400' : 'text-white'}`}>Maintenance</span><span className="text-sm text-gray-400">₹{unit.maintenance_fee}</span></div>
              <input type="checkbox" checked={payments.maintenance_paid} onChange={() => handleTogglePayment('maintenance_paid')} className="w-6 h-6 accent-green-500" />
            </label>

            <label className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer ${payments.water_paid ? 'bg-green-900/30 border-green-500' : 'bg-yvv-charcoalDark border-gray-700'}`}>
              <div className="flex flex-col">
                <span className={`font-bold ${payments.water_paid ? 'text-green-400' : 'text-white'}`}>Water Bill</span>
                <span className={`text-sm font-bold ${waterCost === 'Variable' ? 'text-gray-400' : 'text-yvv-cyan'}`}>
                  {waterCost === 'Variable' ? 'Variable' : `₹${waterCost}`}
                </span>
              </div>
              <input type="checkbox" checked={payments.water_paid} onChange={() => handleTogglePayment('water_paid')} className="w-6 h-6 accent-green-500" />
            </label>
          </div>
        </div>
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