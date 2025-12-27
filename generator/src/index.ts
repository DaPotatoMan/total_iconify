import fs from 'node:fs'
import path from 'node:path'
import { lookupCollection, lookupCollections } from '@iconify/json'
import { IconSet, runSVGO } from '@iconify/tools'
import * as recase from 'change-case'
import { execa } from 'execa'
import ora from 'ora'
import PQueue from 'p-queue'
import { constants, ensureDir, getValidVarName, useReleaseManager } from './utils'

interface RawIcon {
  name: string
  svg: string
  svgBase64: string
}

interface CompiledIcon extends RawIcon {
  svgCompiled: string
}

const releases = useReleaseManager()
const spinner = ora('Starting Generator').start()
const libIconsDir = ensureDir(path.resolve('..', 'lib/icons'))

const deprecatedIconsets = [
  'fluent-emoji'
]

function generateClassFile(collection: IconSet, iconMap: Awaited<ReturnType<typeof prepareIcons>>) {
  const { prefix: key, info } = collection
  

  const className = recase.pascalCase(key)
  const filename = recase.snakeCase(key)

  const classContent = iconMap.flatMap((icon) => {
    const varName = getValidVarName(icon.name)

    return [
      '',
      `/// Font icon named "__${icon.name}__"`,
      '///',
      `/// <image width='96px' src='data:image/svg+xml;base64,${icon.svgBase64}'>`,
      `static const String ${varName} = '${icon.svgCompiled}';`,
    ]
  })

  const footerLinks = [
    `[License](${info?.license.url})`,
    `[Website](${info?.author.url})`,
    `[Icones](https://icones.js.org/collection/${key})`
  ]

  const year = new Date().getFullYear()
  const data = `// ! Auto generated code. DO NOT EDIT
// ignore_for_file: constant_identifier_names, unintended_html_in_doc_comment
// Generated using ${constants.packageName}.
// Copyright © ${year} ${constants.packageName} (${constants.packageUrl}).

/// __${info?.name}__
///
/// Version: ${info?.version}
///
/// Copyright © ${year} - ${info?.author.name}
///
/// ${footerLinks.join(' • ')}
///
///
abstract final class ${className} {
${classContent.flatMap(line => `  ${line}`).join('\n')}
}`

  fs.writeFileSync(`${libIconsDir}/${filename}.dart`, data)
}

async function getCompiledIcons(sources: RawIcon[]) {
  spinner.text = `Compiling binary icons: ${sources.length}`

  const queue = new PQueue({ concurrency: 3 })
  const chunkSize = 500 // Icons per chunk
  const result: CompiledIcon[] = []

  // Split to chunks
  for (let i = 0; i < sources.length; i += chunkSize) {
    const chunk = sources.slice(i, i + chunkSize)

    queue.add(async () => {
      spinner.text = `Compiling binary icons: (${i}/${sources.length})`

      const { stdout } = await execa({
        cwd: path.resolve('..'),
        input: JSON.stringify(chunk),
      })`dart run generator/src/svg_compiler.dart`

      result.push(
        ...JSON.parse(stdout),
      )
    })
  }

  // Sort result
  result.sort((a, b) => a.name.localeCompare(b.name))

  await queue.onIdle()
  return result
}

async function prepareIcons(iconset: IconSet): Promise<CompiledIcon[]> {
  spinner.text = `${iconset.info?.name}: Preparing icons`

  const queue = new PQueue({ concurrency: 10 })
  const rawIcons: RawIcon[] = iconset.list().map((name) => {
    const icon = iconset.toSVG(name)

    if (!icon)
      throw new Error(`Failed to get svg for icon: ${name}`)

    // Optimize SVG
    queue.add(() => runSVGO(icon, {
      multipass: true,
      plugins: [
        'preset-default',
        {
          name: 'cleanupNumericValues',
          params: {
            floatPrecision: 3,
          },
        },
      ],
    }))

    const svg = icon.toString()
    return { name, svg, svgBase64: btoa(svg) }
  })

  // Wait for optimizations
  await queue.onIdle()
  return getCompiledIcons(rawIcons)
}

async function main() {
  const collections = Object.entries(await lookupCollections())
    .filter(([key]) => !deprecatedIconsets.includes(key))
    .toSorted(([a], [b]) => a.localeCompare(b))

  spinner.info(`Got collections: ${Object.keys(collections).length}\n`)

  for (const [key, entry] of collections) {
    spinner.start(entry.name)

    const timestart = performance.now()
    const iconset = new IconSet(await lookupCollection(key))

    if (!releases.shouldProcessIconset(iconset)) {
      spinner.info(`${entry.name}: skipped`)
      continue
    }

    const result = await prepareIcons(iconset)
    generateClassFile(iconset, result)
    releases.setNewRelease(iconset)

    spinner.info(`${entry.name}: ${((performance.now() - timestart) / 1000).toFixed(2)}s`)
  }

  spinner.succeed('Processing complete')
}

main()
