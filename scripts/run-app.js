import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

function runNode(scriptPath) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [scriptPath], {
      cwd: rootDir,
      stdio: 'inherit',
    })

    child.on('exit', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`Setup failed with exit code ${code}`))
    })
  })
}

function runDevStack() {
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm'

  return new Promise((resolve, reject) => {
    const child = spawn(npmCmd, ['run', 'dev:stack'], {
      cwd: rootDir,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    })

    child.on('exit', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`App exited with code ${code}`))
    })
  })
}

async function main() {
  console.log('\nStudent Success Platform\n')

  await runNode(path.join(rootDir, 'scripts', 'ensure-ready.js'))

  console.log('\nStarting frontend + backend...')
  console.log('Then open http://localhost:5173\n')
  console.log('Demo login: faculty@university.edu / faculty123 (Faculty role)\n')

  await runDevStack()
}

main().catch((error) => {
  console.error('\n' + error.message)
  console.error('\nIf you see "address already in use", close other app terminals and run again.\n')
  process.exit(1)
})
