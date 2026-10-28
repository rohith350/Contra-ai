/**
 * Contra AI Backend API Client.
 * Connects React frontend to FastAPI backend for dialectical contradiction research.
 */

import type { InvestigationReport, TimelineEvent } from '../types/investigation'

export interface AttachedSourcePayload {
  id: string
  name: string
  size?: number
  type?: string
}

export interface InvestigationCreateResponse {
  id: string
  status: string
  message: string
}

export interface InvestigationStatusResponse {
  id: string
  hypothesis: string
  status: 'queued' | 'researching' | 'completed' | 'failed' | 'inconclusive'
  progress_percent: number
  current_stage: string
  current_query?: string
  claims_decomposed: string[]
  timeline_events_count: number
  created_at: string
  updated_at: string
  error_message?: string
  is_mock: boolean
}

export interface BackendHealthResponse {
  status: string
  service: string
  version: string
  runtime_model: string
  nebius_configured: boolean
  mock_mode_active: boolean
  application_limits: {
    max_search_queries: number
    max_results_per_query: number
    max_model_calls: number
    max_output_tokens: number
    timeout_seconds: number
  }
}

export interface SSECallbacks {
  onStatus?: (data: Partial<InvestigationStatusResponse>) => void
  onProgress?: (data: {
    progress_percent: number
    current_stage: string
    current_query?: string
    claims_decomposed?: string[]
  }) => void
  onTimeline?: (event: TimelineEvent) => void
  onComplete?: (report: InvestigationReport) => void
  onInconclusive?: (payload: { report: InvestigationReport; reason: string }) => void
  onError?: (err: { error: string }) => void
}

export const apiClient = {
  async get<T>(url: string): Promise<T> {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`)
    }
    return response.json() as Promise<T>
  },

  async post<T>(url: string, body: unknown): Promise<T> {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`Request failed (${response.status}): ${errText}`)
    }
    return response.json() as Promise<T>
  },
}

export async function checkBackendHealth(): Promise<BackendHealthResponse | null> {
  try {
    return await apiClient.get<BackendHealthResponse>('/health')
  } catch {
    return null
  }
}

export async function createInvestigation(
  hypothesis: string,
  attachedSources: AttachedSourcePayload[] = [],
): Promise<InvestigationCreateResponse> {
  return apiClient.post<InvestigationCreateResponse>('/api/investigations', {
    hypothesis,
    attached_sources: attachedSources,
  })
}

export async function getInvestigationStatus(
  id: string,
): Promise<InvestigationStatusResponse> {
  return apiClient.get<InvestigationStatusResponse>(`/api/investigations/${id}`)
}

export async function getInvestigationReport(
  id: string,
): Promise<InvestigationReport> {
  return apiClient.get<InvestigationReport>(`/api/investigations/${id}/report`)
}

/**
 * Subscribes to real-time telemetry events via Server-Sent Events (SSE).
 * Returns an unsubscribe teardown function.
 */
export function subscribeInvestigationEvents(
  investigationId: string,
  callbacks: SSECallbacks,
): () => void {
  const eventSource = new EventSource(`/api/investigations/${investigationId}/events`)

  eventSource.addEventListener('status', (e) => {
    try {
      const data = JSON.parse(e.data)
      callbacks.onStatus?.(data)
    } catch (err) {
      console.warn('Failed parsing SSE status event:', err)
    }
  })

  eventSource.addEventListener('progress', (e) => {
    try {
      const data = JSON.parse(e.data)
      callbacks.onProgress?.(data)
    } catch (err) {
      console.warn('Failed parsing SSE progress event:', err)
    }
  })

  eventSource.addEventListener('timeline', (e) => {
    try {
      const data = JSON.parse(e.data)
      callbacks.onTimeline?.(data)
    } catch (err) {
      console.warn('Failed parsing SSE timeline event:', err)
    }
  })

  eventSource.addEventListener('complete', (e) => {
    try {
      const data = JSON.parse(e.data)
      callbacks.onComplete?.(data)
      eventSource.close()
    } catch (err) {
      console.warn('Failed parsing SSE complete event:', err)
    }
  })

  eventSource.addEventListener('inconclusive', (e) => {
    try {
      const data = JSON.parse(e.data)
      callbacks.onInconclusive?.(data)
      eventSource.close()
    } catch (err) {
      console.warn('Failed parsing SSE inconclusive event:', err)
    }
  })

  eventSource.addEventListener('error', (e) => {
    try {
      if ((e as MessageEvent).data) {
        const data = JSON.parse((e as MessageEvent).data)
        callbacks.onError?.(data)
      } else {
        callbacks.onError?.({ error: 'SSE connection interrupted' })
      }
    } catch {
      callbacks.onError?.({ error: 'SSE stream encountered an error' })
    }
    eventSource.close()
  })

  return () => {
    eventSource.close()
  }
}
