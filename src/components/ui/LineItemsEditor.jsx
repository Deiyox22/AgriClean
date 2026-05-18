import { Plus, Trash2 } from 'lucide-react'
import { formatCurrency } from '../../utils/formatters'

const inputCls = 'w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary'

export default function LineItemsEditor({ lines, onChange }) {
  const updateLine = (i, key, val) => {
    const next = lines.map((l, idx) => {
      if (idx !== i) return l
      const updated = { ...l, [key]: val }
      updated.total = Number(updated.quantity ?? 0) * Number(updated.unitPrice ?? 0)
      return updated
    })
    onChange(next)
  }

  const addLine = () =>
    onChange([...lines, { description: '', quantity: 1, unitPrice: 0, total: 0 }])

  const removeLine = (i) => onChange(lines.filter((_, idx) => idx !== i))

  const totalHT = lines.reduce((sum, l) => sum + (l.total ?? 0), 0)

  return (
    <div className="space-y-3">
      <div className="hidden sm:grid grid-cols-[1fr_60px_100px_100px_32px] gap-2 text-xs font-medium text-slate-400 px-1">
        <span>Description</span>
        <span className="text-center">Qté</span>
        <span className="text-right">Prix unit. HT</span>
        <span className="text-right">Total HT</span>
        <span />
      </div>

      {lines.map((line, i) => (
        <div key={i} className="grid grid-cols-1 sm:grid-cols-[1fr_60px_100px_100px_32px] gap-2 items-center p-3 sm:p-0 bg-slate-50 sm:bg-transparent rounded-xl sm:rounded-none">
          <input
            className={inputCls}
            value={line.description}
            onChange={(e) => updateLine(i, 'description', e.target.value)}
            placeholder="Description de la prestation"
            aria-label="Description"
          />
          <input
            type="number"
            min="0"
            step="0.5"
            className={`${inputCls} text-center`}
            value={line.quantity}
            onChange={(e) => updateLine(i, 'quantity', Number(e.target.value))}
            aria-label="Quantité"
          />
          <input
            type="number"
            min="0"
            step="0.01"
            className={`${inputCls} text-right font-mono`}
            value={line.unitPrice}
            onChange={(e) => updateLine(i, 'unitPrice', Number(e.target.value))}
            aria-label="Prix unitaire HT"
          />
          <div className="text-right text-sm font-semibold text-slate-800 font-mono px-3 py-2">
            {formatCurrency(line.total)}
          </div>
          <button
            type="button"
            onClick={() => removeLine(i)}
            disabled={lines.length === 1}
            className="p-1.5 text-slate-300 hover:text-red-500 transition-colors disabled:opacity-20"
            aria-label="Supprimer la ligne"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addLine}
        className="flex items-center gap-2 text-sm text-primary hover:text-primary-light transition-colors py-1"
      >
        <Plus size={16} /> Ajouter une ligne
      </button>

      <div className="flex justify-end pt-2 border-t border-slate-100">
        <div className="text-sm">
          <span className="text-slate-500">Total HT : </span>
          <span className="font-bold text-slate-900 font-mono text-base">{formatCurrency(totalHT)}</span>
        </div>
      </div>
    </div>
  )
}
