import Sidebar from './Sidebar'
import TopBar from './TopBar'

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <Sidebar />
      <div className="md:ml-60 flex flex-col min-h-screen">
        <TopBar />
        <main className="flex-1 p-4 md:p-6 pb-28 md:pb-8">
          {children}
        </main>
      </div>
    </div>
  )
}
