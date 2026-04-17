export const useVersionCheck = () => {
  const { version } = useAppConfig()
  const seenVersion = useCookie('app_version', { maxAge: 60 * 60 * 24 * 365 })
  const showUpdateToast = ref(false)

  onMounted(() => {
    if (seenVersion.value && seenVersion.value !== version) {
      showUpdateToast.value = true
    }
    seenVersion.value = version
  })

  return { showUpdateToast }
}
