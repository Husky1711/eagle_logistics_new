import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const CONTENT_DIR = path.join(process.cwd(), 'content')

/** Snapshot content JSON files before mutating tests. */
export function snapshotContent(files) {
  return Object.fromEntries(
    files.map((file) => [file, fs.readFileSync(path.join(CONTENT_DIR, file), 'utf8')]),
  )
}

/** Restore content JSON files and sync to public/content/. */
export function restoreContent(snapshots) {
  for (const [file, data] of Object.entries(snapshots)) {
    fs.writeFileSync(path.join(CONTENT_DIR, file), data)
  }
  execSync('npm run sync:content', { cwd: process.cwd(), stdio: 'pipe' })
}
