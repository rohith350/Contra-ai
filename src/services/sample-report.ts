import type { InvestigationReport } from '../types/investigation'

export const SAMPLE_INVESTIGATION_REPORT: InvestigationReport = {
  id: 'dossier-ev-lifecycle-2026',
  hypothesis: 'Electric vehicles have a higher lifecycle carbon footprint than modern hybrid vehicles.',
  timestamp: '2026-10-26T21:40:00Z',
  verdictSummary:
    'The hypothesis is contradicted by current empirical lifecycle assessments across standard grid mixes. While initial battery manufacturing produces a 40–60% higher carbon debt upfront, the operational efficiency of EVs overcomes this disparity within 18,000–32,000 km of driving in typical energy environments.',
  certaintyScore: 84,
  biasIndex: 'High Empirical Consensus',
  stoppingRationale:
    'Cross-referencing 24 peer-reviewed LCA datasets revealed consistent breakeven parity. Residual uncertainty is isolated strictly to ultra-coal-dependent grids (over 80% coal), satisfying the stopping criteria.',
  assumptions: [
    {
      id: 'a1',
      premise: 'Upfront battery production emissions exceed internal combustion manufacturing emissions.',
      status: 'supported',
      vulnerability: 'Consensus verified: Lithium NMC and LFP production incur high initial mineral processing emissions.',
      coveragePercent: 96,
    },
    {
      id: 'a2',
      premise: 'Grid emissions over vehicle lifespan do not compensate for initial manufacturing debt.',
      status: 'contradicted',
      vulnerability: 'Fails empirical validation: Electric drivetrains convert >85% of grid power to propulsion versus ~25–35% thermal efficiency in hybrids.',
      coveragePercent: 92,
    },
    {
      id: 'a3',
      premise: 'Battery degradation requires full replacement before emissions breakeven is reached.',
      status: 'contradicted',
      vulnerability: 'Fleet telemetry over 10 years demonstrates 88–92% capacity retention at 150,000 miles without complete pack swap.',
      coveragePercent: 78,
    },
  ],
  timeline: [
    {
      id: 't1',
      timeOffset: '0.0s',
      type: 'search',
      query: 'electric vehicle lifecycle emissions vs hybrid EPA NREL 2025',
      headline: 'Initial Scope Decomposition',
      detail: 'Isolated mineral extraction, assembly footprint, operational grid emission factors, and end-of-life recycling credits.',
    },
    {
      id: 't2',
      timeOffset: '1.4s',
      type: 'discovery',
      headline: 'Upfront Manufacturing Carbon Disparity Identified',
      detail: 'Found consistent 40–60% upfront CO2 equivalent deficit for 75kWh+ battery packs (Argonne GREET Model).',
      source: 'Argonne National Laboratory',
    },
    {
      id: 't3',
      timeOffset: '2.8s',
      type: 'contradiction',
      headline: 'Operational Breakeven Discovered',
      detail: 'Operational efficiency gap amortizes initial debt at ~22,000 km under US average grid mix (380g CO2/kWh).',
      source: 'International Council on Clean Transportation (ICCT)',
    },
    {
      id: 't4',
      timeOffset: '3.6s',
      type: 'gap',
      headline: 'Sensitivity Gap: Extreme Coal Grids',
      detail: 'Under >80% coal generation, breakeven extends to 85,000+ km, approaching parity with high-efficiency non-plug hybrids.',
      source: 'Nature Energy Meta-Analysis',
    },
    {
      id: 't5',
      timeOffset: '4.5s',
      type: 'decision',
      headline: 'Stopping Criteria Satisfied',
      detail: 'Sufficient dialectical data gathered across 3 continents with robust sensitivity ranges.',
    },
  ],
  steelman: {
    title: 'Steelman Case (Affirmative Arguments)',
    coreArgument:
      'If vehicle lifespan is short (<60,000 km), battery recycling is absent, or operation is restricted to coal-heavy power networks, hybrid vehicles demonstrate a lower net lifecycle environmental footprint.',
    keyFindings: [
      'Initial manufacturing of a 75 kWh battery generates 6–10 metric tons of CO2 equivalent before vehicle rollout.',
      'In regions where coal constitutes >75% of generation (e.g. parts of Poland, India, or West Virginia), the operational emissions advantage narrows dramatically.',
      'Smaller hybrid batteries require fewer critical minerals (nickel, cobalt, lithium), reducing geopolitical and immediate environmental extraction load.',
    ],
    primarySources: ['Argonne National Laboratory GREET Model', 'Nature Communications (Mining Impact Review)'],
  },
  redTeam: {
    title: 'Red Team Counter-Case (Adversarial Refutation)',
    coreArgument:
      'In over 95% of real-world driving environments and grid mixes, electric vehicles achieve net lifecycle carbon parity within 2–3 years of typical use and substantially lower overall emissions thereafter.',
    keyFindings: [
      'Modern electrical grids are decarbonizing at 3–5% annually, automatically reducing EV operational footprint over its lifespan, whereas hybrid footprint remains fixed.',
      'Electric motors achieve 85–92% tank-to-wheel efficiency compared to 30–38% for Atkinson-cycle hybrid engines.',
      'Closed-loop battery recycling recovers up to 95% of active materials, significantly cutting subsequent manufacturing deficits.',
    ],
    primarySources: ['ICCT Global Lifecycle Comparison', 'BloombergNEF Clean Transport Report'],
  },
  evidenceReceipts: [
    {
      id: 'r1',
      title: 'A Global Comparison of the Life-Cycle Greenhouse Gas Emissions of Passenger Cars',
      sourceName: 'International Council on Clean Transportation (ICCT)',
      url: 'https://theicct.org/publication/a-global-comparison-of-the-life-cycle-greenhouse-gas-emissions-of-combustion-engine-and-electric-cars/',
      date: '2023-07-20',
      stance: 'contradicting',
      excerpt:
        'Lifecycle emissions of battery electric cars are 66%–69% lower in Europe, 60%–68% lower in the United States, and 37%–45% lower in China compared to conventional gasoline cars.',
      methodologyNotes: 'Empirical lifecycle assessment covering manufacturing, fuel/electricity production, and 200,000 km real driving.',
      limitations: 'Assumes average driving habits and does not model extreme sub-zero weather range degradation.',
    },
    {
      id: 'r2',
      title: 'GREET Model: Greenhouse Gases, Regulated Emissions, and Energy Use in Technologies',
      sourceName: 'Argonne National Laboratory',
      url: 'https://greet.es.anl.gov/',
      date: '2024-01-15',
      stance: 'supporting',
      excerpt:
        'Battery manufacturing phase emissions for a 300-mile range electric vehicle represent 35–45% of total production emissions, compared to less than 15% for internal combustion counterparts.',
      methodologyNotes: 'Comprehensive supply-chain and material processing lifecycle modeling.',
      limitations: 'Calculations depend on supply-chain provenance of lithium, cobalt, and grid origin during cell production.',
    },
    {
      id: 'r3',
      title: 'Car decarbonisation: A regional sensitivity assessment of electric vs hybrid powertrains',
      sourceName: 'Nature Energy',
      url: 'https://www.nature.com/articles/s41560-020-0579-x',
      date: '2023-11-10',
      stance: 'neutral',
      excerpt:
        'In 53 of 59 regions analyzed representing 95% of global passenger car kilometers, electric vehicles are already less carbon-intensive than fossil alternatives.',
      methodologyNotes: 'Multi-regional input-output analysis combined with hourly power grid dispatch simulation.',
      limitations: 'Local municipal variations in grid charging times can shift emissions by ±12%.',
    },
  ],
  falsificationPlan: {
    testProcedure:
      'Conduct controlled lifecycle analysis in a region where grid intensity exceeds 820g CO2/kWh with vehicle lifespan constrained to under 45,000 km.',
    measurableMetric:
      'Grams of CO2-equivalent emitted per vehicle kilometer traveled across a verified 100,000 km operational benchmark.',
    falsificationThreshold:
      'If the EV cumulative emissions exceed the hybrid baseline after 60,000 km of driving, the anti-hypothesis is falsified.',
    counterEvidenceRequired:
      'Certified independent emissions audits confirming power plant generation intensity and battery production carbon intensity above 140 kg CO2-eq/kWh.',
  },
}
