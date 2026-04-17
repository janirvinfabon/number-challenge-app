export const usePlayerName = () => {
  const playerName = useCookie('player_name', { maxAge: 60 * 60 * 24 * 365 })
  const deviceId = useCookie('device_id', { maxAge: 60 * 60 * 24 * 365 })

  if (!deviceId.value) {
    deviceId.value = crypto.randomUUID()
  }

  return { playerName, deviceId }
}
