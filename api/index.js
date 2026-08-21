import { createApp } from '../server/app.js'
import { ensureServerlessReady } from '../server/serverless.js'

let appPromise

async function getApp() {
  if (!appPromise) {
    appPromise = (async () => {
      await ensureServerlessReady()
      return createApp()
    })()
  }
  return appPromise
}

export default async function handler(req, res) {
  const app = await getApp()
  return app(req, res)
}
