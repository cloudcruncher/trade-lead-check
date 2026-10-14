// Trade Lead Check: pure calculation, no DOM, no network. Works in the browser (window.TLC) and Node (require).
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory()
  else root.TLC = factory()
})(typeof self !== 'undefined' ? self : this, function () {
  const DEFAULT_MARGIN = 30 // % of job value a trader keeps before the platform fee
  const MIN_LEADS_FOR_VERDICT = 5

  const gbp = n => {
    const sign = n < 0 ? '-' : ''
    return sign + '£' + Math.abs(Math.round(n)).toLocaleString('en-GB')
  }

  function validate(i) {
    const errors = {}
    const num = k => (i[k] === '' || i[k] === null || i[k] === undefined ? NaN : Number(i[k]))
    const need = ['spend', 'leads', 'talked', 'quotes', 'won', 'avgJob']
    for (const k of need) {
      const v = num(k)
      if (!Number.isFinite(v) || v < 0) errors[k] = 'Enter a number, 0 or more.'
    }
    const margin = i.margin === '' || i.margin === undefined ? DEFAULT_MARGIN : Number(i.margin)
    if (!Number.isFinite(margin) || margin <= 0 || margin > 100) errors.margin = 'Enter a percentage from 1 to 100.'
    if (!Object.keys(errors).length) {
      if (num('talked') > num('leads')) errors.talked = 'You can\'t talk to more people than sent enquiries.'
      if (num('quotes') > num('leads')) errors.quotes = 'Quotes can\'t be more than enquiries.'
      if (num('won') > num('quotes')) errors.won = 'Jobs won can\'t be more than quotes sent.'
    }
    return errors
  }

  function calc(input) {
    const errors = validate(input)
    if (Object.keys(errors).length) return { ok: false, errors }

    const spend = Number(input.spend)
    const leads = Number(input.leads)
    const talked = Number(input.talked)
    const quotes = Number(input.quotes)
    const won = Number(input.won)
    const avgJob = Number(input.avgJob)
    const margin = (input.margin === '' || input.margin === undefined ? DEFAULT_MARGIN : Number(input.margin)) / 100

    const revenue = won * avgJob
    const profitBeforeFee = revenue * margin
    const net = profitBeforeFee - spend
    const costPerLead = leads ? spend / leads : null
    const costPerJob = won ? spend / won : null
    const spendShare = revenue ? spend / revenue : null
    const profitPerJob = avgJob * margin
    const breakEvenJobs = profitPerJob ? Math.ceil(spend / profitPerJob) : null
    const contactRate = leads ? talked / leads : null
    const missed = leads - talked
    const jobsPerTalked = talked ? won / talked : 0
    const lostJobs = missed * jobsPerTalked
    const lostProfit = lostJobs * profitPerJob

    let kind, headline, reason
    if (spend === 0) {
      kind = 'none'
      headline = 'Nothing to check'
      reason = 'You didn\'t spend anything on this platform, so there\'s no cost to test.'
    } else if (won === 0 && leads < MIN_LEADS_FOR_VERDICT) {
      kind = 'early'
      headline = 'Too early to say'
      reason = `You paid ${gbp(spend)} and got ${leads} ${leads === 1 ? 'enquiry' : 'enquiries'}. Run this again with a full month, or three months together.`
    } else if (won === 0) {
      kind = 'cancel'
      headline = 'Cancel'
      reason = `You paid ${gbp(spend)} for ${leads} enquiries and won no jobs.`
    } else if (net < 0) {
      kind = 'cancel'
      headline = 'Cancel'
      reason = `Each job earns you about ${gbp(profitPerJob)} before the fee, but this platform costs ${gbp(costPerJob)} per job won. You lose ${gbp(-net)} a month.`
    } else if (contactRate < 0.7 && lostProfit >= 0.25 * spend) {
      kind = 'speed'
      headline = 'Answer faster'
      reason = `You only reached ${Math.round(contactRate * 100)}% of enquiries. At your usual hit rate, the ${missed} you missed were worth about ${gbp(lostProfit)} profit. Fix that before you pay for more leads.`
    } else if (net < spend) {
      kind = 'renegotiate'
      headline = 'Renegotiate'
      reason = `You keep ${gbp(net)} after the fee, less than the ${gbp(spend)} you pay. Ask for a lower rate, or a shorter contract, before renewing.`
    } else {
      kind = 'keep'
      headline = 'Worth keeping'
      reason = `You keep ${gbp(net)} after the fee, more than the ${gbp(spend)} you pay. Check it again in three months.`
    }

    return {
      ok: true,
      kind, headline, reason,
      spend, leads, talked, quotes, won, avgJob, margin,
      revenue, profitBeforeFee, net, costPerLead, costPerJob, spendShare,
      profitPerJob, breakEvenJobs, contactRate, missed, lostJobs, lostProfit
    }
  }

  return { calc, validate, gbp, DEFAULT_MARGIN, MIN_LEADS_FOR_VERDICT }
})
