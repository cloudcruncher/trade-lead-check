const test = require('node:test')
const assert = require('node:assert/strict')
const { calc, gbp } = require('./calc.js')

const base = { spend: 240, leads: 20, talked: 18, quotes: 10, won: 4, avgJob: 450, margin: 30 }

test('worked example: £240 for 4 jobs', () => {
  const r = calc(base)
  assert.equal(r.ok, true)
  assert.equal(r.costPerJob, 60)
  assert.equal(r.costPerLead, 12)
  assert.equal(r.profitPerJob, 135)
  assert.equal(r.net, 4 * 135 - 240) // 300
  assert.equal(r.breakEvenJobs, 2)
  assert.equal(r.kind, 'keep')
})

test('no jobs after enough leads: cancel', () => {
  const r = calc({ ...base, won: 0, quotes: 0 })
  assert.equal(r.kind, 'cancel')
  assert.equal(r.costPerJob, null)
})

test('too few leads and no jobs: too early', () => {
  const r = calc({ ...base, leads: 3, talked: 3, quotes: 2, won: 0 })
  assert.equal(r.kind, 'early')
})

test('platform costs more than the job earns: cancel', () => {
  const r = calc({ ...base, spend: 500, won: 2, quotes: 5, avgJob: 300 })
  assert.equal(r.kind, 'cancel')
  assert.ok(r.net < 0)
})

test('low contact rate with real money missed: answer faster', () => {
  const r = calc({ spend: 200, leads: 20, talked: 8, quotes: 6, won: 4, avgJob: 600, margin: 30 })
  assert.equal(r.kind, 'speed')
  assert.ok(r.lostProfit >= 0.25 * 200)
})

test('thin return: renegotiate', () => {
  const r = calc({ spend: 400, leads: 20, talked: 19, quotes: 10, won: 3, avgJob: 500, margin: 30 })
  // net = 3*150 - 400 = 50 < 400
  assert.equal(r.kind, 'renegotiate')
})

test('zero spend: nothing to check, no divide by zero', () => {
  const r = calc({ ...base, spend: 0 })
  assert.equal(r.kind, 'none')
  assert.equal(r.breakEvenJobs, 0)
})

test('zero leads and zero spend does not throw', () => {
  const r = calc({ spend: 0, leads: 0, talked: 0, quotes: 0, won: 0, avgJob: 0 })
  assert.equal(r.ok, true)
  assert.equal(r.costPerLead, null)
})

test('zero average job value does not divide by zero', () => {
  const r = calc({ ...base, avgJob: 0 })
  assert.equal(r.ok, true)
  assert.equal(r.breakEvenJobs, null)
})

test('impossible inputs are rejected with field errors', () => {
  const r = calc({ ...base, talked: 25 })
  assert.equal(r.ok, false)
  assert.ok(r.errors.talked)
  assert.ok(calc({ ...base, won: 11 }).errors.won)
  assert.ok(calc({ ...base, spend: '' }).errors.spend)
  assert.ok(calc({ ...base, spend: -5 }).errors.spend)
  assert.ok(calc({ ...base, margin: 0 }).errors.margin)
})

test('blank margin falls back to the default', () => {
  const r = calc({ ...base, margin: '' })
  assert.equal(r.margin, 0.3)
})

test('gbp formatting', () => {
  assert.equal(gbp(1234.6), '£1,235')
  assert.equal(gbp(-40), '-£40')
})
