const fs = require('fs')
const path = require('path')

const TEMPLATES_DIR = path.join(__dirname, './')

const slugify = (str) => {
  if (typeof str !== 'string') {
    throw new Error(`slugify expected a string, got: ${JSON.stringify(str)}`)
  }
  return str.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

let templateCache = null

const loadTemplates = () => {
  if (templateCache) return templateCache
  templateCache = {}

  const files = fs.readdirSync(TEMPLATES_DIR).filter((f) => f.endsWith('.json'))
  for (const file of files) {
    try {
      const parsed = JSON.parse(fs.readFileSync(path.join(TEMPLATES_DIR, file), 'utf8'))
      const templates = parsed.templates
      if (!Array.isArray(templates)) {
        console.warn(`Skipping ${file}: no "templates" array found`)
        continue
      }
      for (const tpl of templates) {
        if (!tpl.targetCareer || !tpl.skillLevel || !tpl.duration) {
          console.warn(`Skipping template in ${file}: missing targetCareer/skillLevel/duration`, tpl)
          continue
        }
        const key = `${slugify(tpl.targetCareer)}__${tpl.skillLevel.toLowerCase()}__${slugify(tpl.duration)}`
        templateCache[key] = tpl
      }
    } catch (err) {
      console.warn(`Skipping invalid template file ${file}:`, err.message)
    }
  }
  return templateCache
}

const findRoadmapTemplate = (targetCareer, skillLevel, duration) => {
  const templates = loadTemplates()
  console.log(targetCareer , duration , skillLevel);
  
  const key = `${slugify(targetCareer)}__${skillLevel.toLowerCase()}__${slugify(duration)}`
  return templates[key] || null
}

exports.findRoadmapTemplate = findRoadmapTemplate