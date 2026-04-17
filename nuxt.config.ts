import { readFileSync } from 'fs'
import { resolve } from 'path'

const { version } = JSON.parse(readFileSync(resolve('./package.json'), 'utf-8'))

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  appConfig: {
    version
  },
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || '',
      apiKey: process.env.NUXT_PUBLIC_API_KEY || ''
    }
  },
  app: {
    head: {
      title: 'Number Challenge',
      meta: [
        { name: 'description', content: 'Too relaxed? This game will fix that. A strategic number placement game. Generate random numbers and place them in the correct order across 20 boxes before it\'s too late.' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { property: 'og:title', content: 'Number Challenge' },
        { property: 'og:description', content: 'Too relaxed? This game will fix that. A strategic number placement game. Generate random numbers and place them in the correct order across 20 boxes before it\'s too late.' },
        { property: 'og:image', content: '/game-cover.png' },
        { property: 'og:type', content: 'website' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'Number Challenge' },
        { name: 'twitter:description', content: 'Too relaxed? This game will fix that. A strategic number placement game. Generate random numbers and place them in the correct order across 20 boxes before it\'s too late.' },
        { name: 'twitter:image', content: '/game-cover.png' },
      ]
    }
  }
})
