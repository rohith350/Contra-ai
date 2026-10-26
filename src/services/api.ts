/**
 * API client and base service configuration
 */

export const apiClient = {
  async get<T>(url: string): Promise<T> {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`)
    }
    return response.json() as Promise<T>
  },
}
