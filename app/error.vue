<script setup>
const props = defineProps({ error: Object })

const is4xx = computed(() => props.error?.statusCode >= 400 && props.error?.statusCode < 500)
const is5xx = computed(() => props.error?.statusCode >= 500)

const title = computed(() => {
  if (is4xx.value) return `${props.error.statusCode} — Page Not Found`
  if (is5xx.value) return `${props.error.statusCode} — Server Error`
  return 'Something went wrong'
})

const message = computed(() => {
  if (is4xx.value) return "The page you're looking for doesn't exist or has been moved."
  if (is5xx.value) return "Something went wrong on our end. Please try again later."
  return props.error?.message || 'An unexpected error occurred.'
})

const handleError = () => clearError({ redirect: '/' })
</script>

<template>
  <div class="error-container">
    <div class="error-code">{{ error?.statusCode }}</div>
    <h1>{{ title }}</h1>
    <p>{{ message }}</p>
    <button class="btn" @click="handleError">Go Home</button>
  </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap');

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: 'Poppins', sans-serif;
  background: #0f172a;
  color: #f1f5f9;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
}

.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
  text-align: center;
  padding: 2rem;
}

.error-code {
  font-size: 6rem;
  font-weight: 700;
  line-height: 1;
  color: #38bdf8;
  opacity: 0.2;
}

h1 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #f1f5f9;
}

p {
  font-size: 1rem;
  color: #94a3b8;
  max-width: 360px;
}

.btn {
  background: #38bdf8;
  color: #0f172a;
  border: none;
  padding: 0.7rem 2rem;
  font-size: 1rem;
  font-weight: 700;
  font-family: 'Poppins', sans-serif;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
  margin-top: 0.5rem;
}

.btn:hover { background: #7dd3fc; }
</style>
