import fs from 'node:fs'
import path from 'node:path'
import * as recase from 'change-case'
import type { IconifyInfo } from '@iconify/types'
import type { IconSet } from '@iconify/tools/lib/index.js'

export const constants = {
  packageName: 'total_iconify',
  packageUrl: 'https://github.com/dapotatoman/total_iconify'
}

export function ensureDir(path: string, cleanup = false) {
  // Cleanup target
  if (cleanup && fs.existsSync(path))
    fs.rmSync(path, { recursive: true })

  if (!fs.existsSync(path))
    fs.mkdirSync(path, { recursive: true })

  return path
}

export function getValidVarName(input: string) {
  const newName = recase.snakeCase(input).trim()

  const validName = /^[a-zA-Z_][$a-zA-Z0-9_]*$/
  const reservedWords = [
    'assert',
    'break',
    'case',
    'catch',
    'class',
    'const',
    'continue',
    'default',
    'do',
    'else',
    'enum',
    'extends',
    'false',
    'final',
    'finally',
    'for',
    'if',
    'in',
    'is',
    'new',
    'null',
    'rethrow',
    'return',
    'super',
    'switch',
    'this',
    'throw',
    'true',
    'try',
    'var',
    'void',
    'while',
    'with',
    'async',
    'hide',
    'on',
    'show',
    'sync',
    'abstract',
    'as',
    'covariant',
    'deferred',
    'dynamic',
    'export',
    'extension',
    'external',
    'factory',
    'function',
    'get',
    'implements',
    'import',
    'interface',
    'library',
    'mixin',
    'operator',
    'part',
    'set',
    'static',
    'typedef',
    'await',
    'yield',
  ]

  if (validName.test(newName) && !reservedWords.includes(newName))
    return newName
  return `i_${newName}`
}

export function useReleaseManager() {
  const filePath = path.resolve('..', 'lib/release.json') 
  let releases: Record<string, number> = {}

  // Load from actual file
  if (fs.existsSync(filePath)) {
    releases = JSON.parse(fs.readFileSync(filePath).toString('utf-8'))
  }

  function update() {
    const ordered = Object.keys(releases).sort().reduce(
      (obj, key) => { 
        obj[key] = releases[key]; 
        return obj;
      }, 
      {} as Record<string, number>
    );

    fs.writeFileSync(filePath, JSON.stringify(ordered, null, 2))
  }

  function shouldProcessIconset(iconset: IconSet) {
    return releases[iconset.prefix] !== iconset.lastModified
  }

  function setNewRelease(iconset: IconSet) {
    releases[iconset.prefix] = iconset.lastModified
    update()
  }

  return {
    shouldProcessIconset,
    setNewRelease
  }
}
