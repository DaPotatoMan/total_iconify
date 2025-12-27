// IGNORE
// This was an experiment to generate ttf font files from svg icons
// I decided to drop this for now because of too many hurdles :P


import fs from 'node:fs'
import path from 'node:path'
import { lookupCollection } from '@iconify/json'
import { IconSet, parseColors, runSVGO } from '@iconify/tools'
import * as recase from 'change-case'
import { execa } from 'execa'
import ora from 'ora'
import PQueue from 'p-queue'
import sax from 'sax'
import svgtofont from 'svgtofont'
import { ensureDir, getValidIconName } from './utils'

// ? Fixes max buffer issue with svgtofont > sax
sax.MAX_BUFFER_LENGTH = 64 * 1024 * 10

const spinner = ora('Starting Generator').start()

interface GlyphData {
  name: string
  unicode: string
}

function useClassGenerator(iconset: IconSet, params: {
  className: string
  fontName: string
}) {
  const glyphList: GlyphData[] = []

  function generate() {
    const classContent = [
      `static const iconFontFamily = '${params.fontName}';`,

      ...glyphList.flatMap((glyph) => {
        const varName = getValidIconName(recase.snakeCase(glyph.name))
        const unicode = (glyph.unicode).codePointAt(0)!.toString(16).padStart(4, '0')

        const icon = iconset.toSVG(glyph.name)!
        const svg = btoa(icon.toMinifiedString())

        return [
          '',
          `/// Font icon named "__${glyph.name}__"`,
          '///',
          `/// <image width='96px' src='data:image/svg+xml;base64,${svg}'>`,
          `static const IconData ${varName} = IconData(0x${unicode}, fontFamily: '${params.fontName}');`,
        ]
      }),
    ]

    return `// ! Auto generated code. DO NOT EDIT
// Generated using $kVendorName.
@staticIconProvider
abstract final class ${params.className} {
${classContent.flatMap(line => `  ${line}`).join('\n')}
}`
  }

  return { glyphList, generate }
}

async function createIconFont(collection: string) {
  console.time('done')

  const icons = await lookupCollection(collection)
  const iconSet = new IconSet(icons)

  if (icons.info?.tags?.includes('Contains Animations'))
    throw new Error('animated icons not supported')

  const collectionKeyName = recase.snakeCase(collection)
  const tempIconDir = ensureDir(`.temp/${collectionKeyName}`, true)
  const queue = new PQueue({ concurrency: 20 })

  for (const [key, icon] of Object.entries(icons.icons).splice(0, 100)) {
    const svg = iconSet.toSVG(key)!
    const filename = `${key}.svg`

    queue.add(async () => {
      spinner.text = `Converting > ${collection} > ${key}`

      const opt = true

      if (opt) {
        await runSVGO(svg, {
          multipass: true,
          plugins: [
            'preset-default',
            'removeEmptyAttrs',
            'convertShapeToPath',
            'mergePaths',
            'removeUselessDefs',
            {
              name: 'cleanupNumericValues',
              params: {
                floatPrecision: 3,
              },
            },
          ],
        })
      }

      await parseColors(svg, {
        defaultColor: '#d31313',
      })

      const fixedIconPath = path.resolve(tempIconDir, filename)
      const data = svg.toString()

      let finalSVGData = data

      try {
        //
        const process = execa(`picosvg`)
        process.stdin.end(data)

        const { stdout } = await process
        finalSVGData = stdout
      }
      catch (error) {
        spinner.warn(`Failed to cleanup: ${collection} > ${key}`)
        spinner.start()
      }

      fs.writeFileSync(fixedIconPath, finalSVGData)
    })
  }

  await queue.onIdle()

  const iconSetName = icons.info!.name
  const fontName = recase.snakeCase(iconSetName)

  const classGenerator = useClassGenerator(iconSet, {
    className: recase.pascalCase(iconSetName),
    fontName,
  })

  spinner.info(`Creating font: ${collection}`)

  await svgtofont({
    src: tempIconDir,
    dist: path.resolve('dist'),
    fontName,
    startUnicode: 0xEA01,
    svgicons2svgfont: {
      normalize: true,
      preserveAspectRatio: true,
      fontHeight: 1000,
    },
    css: false,
    excludeFormat: ['eot', 'svg', 'symbol.svg', 'woff', 'woff2'],

    getIconUnicode(name, unicode, startUnicode) {
      classGenerator.glyphList.push({
        name,
        unicode,
      })

      return [unicode, startUnicode]
    },
  })

  // Cleanup
  fs.writeFileSync(`dist/${fontName}.dart`, classGenerator.generate())

  console.timeEnd('done')
}

async function main() {
  const { default: collections } = await import('@iconify/json/collections.json')

  let count = 0

  // Cleanup
  ensureDir('.temp')
  ensureDir('dist')

  for (const [collection] of Object.entries(collections).toSorted(([a], [b]) => a.localeCompare(b))) {
    if (collection !== 'logos')
      continue
    if (count >= 3)
      break
    count++

    await createIconFont(collection)
  }

  spinner.succeed('Processing complete')
}

main()
