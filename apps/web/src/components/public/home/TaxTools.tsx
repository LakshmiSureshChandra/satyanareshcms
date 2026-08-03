'use client'

import { useState } from 'react'
import { Percent, ReceiptIndianRupee } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { Reveal } from '../Reveal'

const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`

/** New regime, AY 2026–27: ₹75k standard deduction, 87A rebate up to ₹12L, 4% cess. */
function computeIncomeTax(gross: number) {
  const taxable = Math.max(0, gross - 75_000)
  const slabs: [limit: number, rate: number][] = [
    [400_000, 0], [800_000, 0.05], [1_200_000, 0.1], [1_600_000, 0.15],
    [2_000_000, 0.2], [2_400_000, 0.25], [Infinity, 0.3],
  ]
  let tax = 0
  let prev = 0
  for (const [limit, rate] of slabs) {
    if (taxable <= prev) break
    tax += (Math.min(taxable, limit) - prev) * rate
    prev = limit
  }
  if (taxable <= 1_200_000) tax = 0 // section 87A rebate
  const cess = tax * 0.04
  return { taxable, tax, cess, total: tax + cess }
}

function Result({ label, value, big = false }: { label: string; value: string; big?: boolean }) {
  return (
    <div>
      <div className="mb-1 text-xs text-ink-soft">{label}</div>
      <div className={cn(big ? 'headline text-3xl text-accent' : 'text-lg font-medium text-ink')}>{value}</div>
    </div>
  )
}

function IncomeCalculator() {
  const [income, setIncome] = useState(1_200_000)
  const r = computeIncomeTax(income)

  return (
    <div className="max-w-lg rounded-2xl border border-line bg-card p-6">
      <label htmlFor="gross-income" className="mb-2 block text-sm text-ink-2">
        Annual gross income
      </label>
      <div className="mb-4 flex items-center gap-2.5">
        <span className="text-ink-soft">₹</span>
        <input
          id="gross-income"
          type="number"
          min={0}
          value={income}
          onChange={(e) => setIncome(Math.max(0, Number(e.target.value) || 0))}
          className="w-full rounded-lg border border-line bg-paper-2 px-3 py-2.5 text-[15px] text-ink outline-none focus:border-accent"
        />
      </div>
      <input
        type="range"
        aria-label="Annual gross income"
        min={300_000}
        max={5_000_000}
        step={10_000}
        value={Math.min(income, 5_000_000)}
        onChange={(e) => setIncome(Number(e.target.value))}
        className="mb-6 w-full accent-[var(--color-accent-dark)]"
      />

      <div className="grid grid-cols-2 gap-4">
        <Result label="Taxable income" value={inr(r.taxable)} />
        <Result label="Cess (4%)" value={inr(r.cess)} />
        <div className="col-span-2 border-t border-line pt-4">
          <Result label="Estimated tax payable" value={inr(r.total)} big />
        </div>
      </div>

      <p className="mt-5 text-xs leading-relaxed text-ink-soft">
        Indicative estimate under the new tax regime with standard deduction — not a substitute for
        personalised advice. Talk to us for an accurate computation.
      </p>
    </div>
  )
}

const GST_RATES = [5, 12, 18, 28]

function GstCalculator() {
  const [amount, setAmount] = useState(100_000)
  const [rate, setRate] = useState(18)
  const [mode, setMode] = useState<'exclusive' | 'inclusive'>('exclusive')

  const gst = mode === 'exclusive' ? (amount * rate) / 100 : amount - amount / (1 + rate / 100)
  const base = mode === 'exclusive' ? amount : amount - gst
  const total = mode === 'exclusive' ? amount + gst : amount

  const chip = (active: boolean) =>
    cn(
      'flex-1 rounded-lg border px-2 py-2.5 text-sm transition-colors',
      active ? 'border-accent-dark text-accent' : 'border-line text-ink-2 hover:text-ink'
    )

  return (
    <div className="max-w-lg rounded-2xl border border-line bg-card p-6">
      <label htmlFor="gst-amount" className="mb-2 block text-sm text-ink-2">
        Amount
      </label>
      <div className="mb-4 flex items-center gap-2.5">
        <span className="text-ink-soft">₹</span>
        <input
          id="gst-amount"
          type="number"
          min={0}
          value={amount}
          onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))}
          className="w-full rounded-lg border border-line bg-paper-2 px-3 py-2.5 text-[15px] text-ink outline-none focus:border-accent"
        />
      </div>

      <div className="mb-4 flex gap-2" role="group" aria-label="GST rate">
        {GST_RATES.map((r) => (
          <button key={r} type="button" aria-pressed={r === rate} onClick={() => setRate(r)} className={chip(r === rate)}>
            {r}%
          </button>
        ))}
      </div>
      <div className="mb-6 flex gap-2" role="group" aria-label="Amount is">
        {(['exclusive', 'inclusive'] as const).map((m) => (
          <button key={m} type="button" aria-pressed={m === mode} onClick={() => setMode(m)} className={chip(m === mode)}>
            {m} of GST
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Result label="Base amount" value={inr(base)} />
        <Result label="GST amount" value={inr(gst)} />
        <div className="col-span-2 border-t border-line pt-4">
          <Result label="Total" value={inr(total)} big />
        </div>
      </div>
    </div>
  )
}

export function TaxTools() {
  return (
    <section id="tools" className="border-y border-line bg-paper-2">
      <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <Reveal>
          <span className="eyebrow">Try it yourself</span>
          <h2 className="headline mt-3 text-3xl sm:text-4xl">Estimate before you consult.</h2>
          <p className="mt-3 max-w-lg leading-relaxed text-ink-2">
            A quick, illustrative estimate — our team will fine-tune the numbers to your actual filings.
          </p>

          <Tabs defaultValue="income" className="mt-6 gap-6">
            <TabsList>
              <TabsTrigger value="income">
                <ReceiptIndianRupee />
                Income tax
              </TabsTrigger>
              <TabsTrigger value="gst">
                <Percent />
                GST
              </TabsTrigger>
            </TabsList>
            <TabsContent value="income">
              <IncomeCalculator />
            </TabsContent>
            <TabsContent value="gst">
              <GstCalculator />
            </TabsContent>
          </Tabs>
        </Reveal>
      </div>
    </section>
  )
}
