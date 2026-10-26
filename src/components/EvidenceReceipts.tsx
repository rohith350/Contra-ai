import type { EvidenceReceipt } from '../types/investigation'
import '../styles/EvidenceReceipts.css'

interface EvidenceReceiptsProps {
  receipts: EvidenceReceipt[]
}

export function EvidenceReceipts({ receipts }: EvidenceReceiptsProps) {
  return (
    <div className="receipts-card">
      <div className="receipts-header">
        <div className="receipts-tag-row">
          <span className="receipts-badge">SIGNATURE CAPABILITY 05</span>
          <span className="receipts-title">Evidence Receipts & Citations</span>
        </div>
        <p className="receipts-sub">
          Granular citation receipts with verified stance classifications, empirical excerpts, and documented study limitations.
        </p>
      </div>

      <div className="receipts-list">
        {receipts.map((item) => {
          const stanceClass =
            item.stance === 'supporting'
              ? 'stance-supporting'
              : item.stance === 'contradicting'
              ? 'stance-contradicting'
              : 'stance-neutral'

          const stanceLabel =
            item.stance === 'supporting'
              ? 'Supports Hypothesis'
              : item.stance === 'contradicting'
              ? 'Contradicts Hypothesis'
              : 'Contextual / Neutral'

          return (
            <div key={item.id} className="receipt-item">
              <div className="receipt-top-row">
                <span className={`stance-pill ${stanceClass}`}>
                  <span className="stance-dot" />
                  <span>{stanceLabel}</span>
                </span>
                <span className="receipt-date">{item.date}</span>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="receipt-external-link"
                >
                  <span>Verify Primary Source</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <line x1="10" y1="14" x2="21" y2="3"></line>
                  </svg>
                </a>
              </div>

              <h4 className="receipt-item-title">{item.title}</h4>
              <span className="receipt-source-label">Source: {item.sourceName}</span>

              <blockquote className="receipt-excerpt">
                &ldquo;{item.excerpt}&rdquo;
              </blockquote>

              <div className="receipt-footer-notes">
                <div className="note-block">
                  <span className="note-label">Methodology:</span>
                  <span className="note-val">{item.methodologyNotes}</span>
                </div>
                <div className="note-block">
                  <span className="note-label">Caveats / Limitations:</span>
                  <span className="note-val">{item.limitations}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
