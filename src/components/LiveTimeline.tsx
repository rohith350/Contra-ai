import type { TimelineEvent } from '../types/investigation'
import '../styles/LiveTimeline.css'

interface LiveTimelineProps {
  timeline: TimelineEvent[]
  activeStepIndex?: number
}

export function LiveTimeline({ timeline, activeStepIndex }: LiveTimelineProps) {
  return (
    <div className="timeline-container">
      <div className="timeline-header">
        <div className="timeline-tag-row">
          <span className="timeline-badge">SIGNATURE CAPABILITY 03</span>
          <span className="timeline-title">Live Investigation Timeline</span>
        </div>
        <p className="timeline-sub">
          Transparent event stream detailing autonomous queries, verified discoveries, and dialectical contradictions.
        </p>
      </div>

      <div className="timeline-feed">
        {timeline.map((evt, idx) => {
          const isCurrent = activeStepIndex === undefined || idx <= activeStepIndex
          const typeClass = `timeline-type-${evt.type}`

          return (
            <div
              key={evt.id}
              className={`timeline-entry ${typeClass} ${isCurrent ? 'entry-active' : 'entry-pending'}`}
            >
              <div className="entry-marker-col">
                <div className="entry-dot" />
                {idx < timeline.length - 1 && <div className="entry-line" />}
              </div>

              <div className="entry-content">
                <div className="entry-meta-row">
                  <span className="entry-offset">{evt.timeOffset}</span>
                  <span className="entry-type-pill">{evt.type}</span>
                  {evt.source && <span className="entry-source">via {evt.source}</span>}
                </div>

                <h5 className="entry-headline">{evt.headline}</h5>
                <p className="entry-detail">{evt.detail}</p>

                {evt.query && (
                  <div className="entry-query-block">
                    <span className="query-label">DISPATCHED QUERY:</span>
                    <code>{evt.query}</code>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
