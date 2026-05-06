import { supabase } from './lib/supabase'

function App() {
  const checkConnection = async () => {
    // This is a simple ping to see if Supabase responds
    const { data, error } = await supabase.from('properties').select('*').limit(1)
    
    if (error) {
      console.error("Supabase Error:", error.message)
      alert("Connection failed! Check your console.")
    } else {
      console.log("Supabase Data:", data)
      alert("YPMA is connected to Supabase successfully! 🚀")
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-4xl font-bold text-yvv-cyan tracking-widest mb-2">YVV</h1>
      <h2 className="text-xl text-gray-300 mb-8">Property Management App</h2>
      
      <button 
        onClick={checkConnection}
        className="px-6 py-3 bg-yvv-charcoal border border-yvv-cyan text-yvv-cyan rounded hover:bg-yvv-cyan hover:text-yvv-charcoalDark transition-all duration-300 font-semibold"
      >
        Test Database Connection
      </button>
    </div>
  )
}

export default App