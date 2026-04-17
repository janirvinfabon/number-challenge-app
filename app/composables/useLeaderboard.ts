export const useLeaderboard = () => {
  const { public: { apiBase, apiKey } } = useRuntimeConfig()

  const headers = { 'x-api-key': apiKey as string }

  async function submitScore(playerName: string, deviceId: string, score: number, stage: number) {
    await $fetch(`${apiBase}/scores`, {
      method: 'POST',
      headers,
      body: { playerName, deviceId, score, stage },
    })
  }

  async function getTopScores(limit = 10) {
    return $fetch<{ playerName: string; score: number; stage: number; timestamp: string }[]>(
      `${apiBase}/scores/top`,
      { headers, query: { limit } }
    )
  }

  return { submitScore, getTopScores }
}
