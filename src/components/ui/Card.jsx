export default function Card({ children, className = '', onClick }) {
  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-slate-100 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  )
}
