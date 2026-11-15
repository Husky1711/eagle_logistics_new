import { useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { Field, inputCls } from './QuoteTester'
import { parseNumberList } from './format'
import { ConfirmButton } from '../ui'

export default function SettingsPanel({ draft, update, onResetDemo }) {
  const s = draft.settings
  const [slabText, setSlabText] = useState(s.slabWeights.join(', '))
  const setNum = (k) => (e) => update((d) => (d.settings[k] = e.target.value === '' ? '' : Number(e.target.value)))

  return (
    <div className="space-y-6">
      <div className="grid gap-5 rounded-2xl border border-neutral-200 bg-white p-5 shadow-soft sm:grid-cols-2 lg:grid-cols-3">
        <Field label="GST %" hint="Courier services in India: 18%">
          <input type="number" min="0" step="0.5" value={s.gstPercent} onChange={setNum('gstPercent')} className={inputCls} />
        </Field>
        <Field label="Show customers" hint="What the website calculator displays">
          <select
            value={s.pricesIncludeGst ? 'incl' : 'excl'}
            onChange={(e) => update((d) => (d.settings.pricesIncludeGst = e.target.value === 'incl'))}
            className={inputCls}
          >
            <option value="incl">Price including GST</option>
            <option value="excl">Price + GST (shown separately)</option>
          </select>
        </Field>
        <Field label="Round selling price up to nearest ₹" hint="e.g. 10 → ₹4,312 becomes ₹4,320">
          <input type="number" min="1" value={s.roundTo} onChange={setNum('roundTo')} className={inputCls} />
        </Field>
        <Field label="Minimum charge ₹ (before GST)" hint="Smallest price for any parcel">
          <input type="number" min="0" value={s.minimumCharge} onChange={setNum('minimumCharge')} className={inputCls} />
        </Field>
        <Field label="Volumetric divisor" hint="L×W×H (cm) ÷ this. Most express couriers use 5000">
          <input type="number" min="1000" step="1000" value={s.volumetricDivisor} onChange={setNum('volumetricDivisor')} className={inputCls} />
        </Field>
        <Field label="Weight step (kg)" hint="Weights round up to this, e.g. 2.3 kg → 2.5 kg">
          <input type="number" min="0.1" step="0.1" value={s.weightStep} onChange={setNum('weightStep')} className={inputCls} />
        </Field>
        <Field label="Maximum weight on website (kg)" hint="Above this, customers are asked to WhatsApp">
          <input type="number" min="1" value={s.maxWeight} onChange={setNum('maxWeight')} className={inputCls} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Weight slabs (kg)" hint="Rows of the rate card. Separate with commas. Rates for removed slabs are dropped on save.">
            <input
              value={slabText}
              onChange={(e) => setSlabText(e.target.value)}
              onBlur={() => {
                const list = parseNumberList(slabText)
                if (list.length) update((d) => (d.settings.slabWeights = list))
                setSlabText((list.length ? list : s.slabWeights).join(', '))
              }}
              className={inputCls}
            />
          </Field>
        </div>
      </div>

      <div className="rounded-2xl border border-dashed border-neutral-300 p-5">
        <p className="text-sm font-semibold text-heading">How a price is calculated</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-ink">
          <li>Chargeable weight = higher of actual and volumetric weight, rounded up to {s.weightStep} kg</li>
          <li>Published rate from the courier’s rate card (first slab ≥ that weight)</li>
          <li>− your courier discount %, then + fuel surcharge % → <strong>your cost</strong></li>
          <li>+ commission % + flat ₹ → at least ₹{s.minimumCharge}, rounded up to ₹{s.roundTo} → <strong>selling price</strong></li>
          <li>+ GST {s.gstPercent}% → <strong>customer total</strong></li>
        </ol>
      </div>

      <ConfirmButton
        onConfirm={onResetDemo}
        question="Replace ALL pricing with demo numbers? (A backup is kept.)"
        confirmLabel="Reset"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-red-700 hover:underline"
      >
        <RotateCcw size={15} aria-hidden /> Reset all pricing to demo numbers
      </ConfirmButton>
    </div>
  )
}
