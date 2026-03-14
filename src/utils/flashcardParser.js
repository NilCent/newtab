/**
 * Flashcard Markdown Parser
 * 
 * 解析扩展 Markdown 语法，生成 flashcard 数据结构
 * 
 * 支持文件路径 tag：
 * - 文件路径如 "database/postgres.md" 会生成 pathTags: ['database', 'postgres']
 * - pathTags 在前，headingTags 在后
 * - 如果一级 heading 和文件名相同，只保留文件名的 tag
 */

function parseFlashcards(markdown, filePath = '') {
  const pathTags = extractPathTags(filePath)
  const lines = markdown.split('\n')
  const cards = []
  let headingTags = []
  let currentContent = []
  let inCodeBlock = false
  let firstH1Text = null

  const flushContent = () => {
    const content = currentContent.join('\n').trim()
    currentContent = []
    return content
  }

  const addCard = (card) => {
    if (card) {
      const lastPathTag = pathTags.length > 0 ? pathTags[pathTags.length - 1] : null
      const firstHeadingTag = headingTags.length > 0 ? headingTags[0] : null
      
      let finalHeadingTags = [...headingTags]
      if (firstHeadingTag && lastPathTag && firstHeadingTag.toLowerCase() === lastPathTag.toLowerCase()) {
        finalHeadingTags = headingTags.slice(1)
      }
      
      card.tags = [...pathTags, ...finalHeadingTags]
      cards.push(card)
    }
  }

  const parseCardContent = (content) => {
    const trimmed = content.trim()
    if (!trimmed) return null

    if (isDoubleSidedInline(trimmed)) {
      const [front, back] = splitInline(trimmed)
      return { type: 'double', front, back }
    }

    if (isDoubleSidedBlock(trimmed)) {
      const { front, back } = splitBlock(trimmed)
      return { type: 'double', front, back }
    }

    return { type: 'single', content: trimmed }
  }

  const processContent = () => {
    const content = flushContent()
    if (content) {
      const card = parseCardContent(content)
      addCard(card)
    }
  }

  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    const trimmedLine = line.trim()

    if (isCodeBlockStart(trimmedLine) && !inCodeBlock) {
      inCodeBlock = true
      currentContent.push(line)
      i++
      continue
    }

    if (inCodeBlock) {
      if (trimmedLine === '```' || trimmedLine.match(/^```\s*$/)) {
        inCodeBlock = false
      }
      currentContent.push(line)
      i++
      continue
    }

    if (isHeading(trimmedLine)) {
      processContent()

      const { level, text } = parseHeading(trimmedLine)
      
      if (level === 1 && firstH1Text === null) {
        firstH1Text = text
      }
      
      updateTags(headingTags, level, text)
      i++
      continue
    }

    if (isDivider(trimmedLine)) {
      processContent()
      i++
      continue
    }

    if (trimmedLine === ':::') {
      const blockResult = tryParseBlockCard(lines, i, currentContent)
      if (blockResult) {
        const { frontLines, backLines, endIndex } = blockResult
        const front = frontLines.join('\n').trim()
        const back = backLines.join('\n').trim()
        
        flushContent()
        
        if (front || currentContent.length > 0) {
          const combinedFront = currentContent.length > 0 
            ? [...currentContent, ...frontLines].join('\n').trim()
            : front
          if (combinedFront && back) {
            addCard({ type: 'double', front: combinedFront, back })
          }
        } else if (front && back) {
          addCard({ type: 'double', front, back })
        }
        
        currentContent = []
        i = endIndex + 1
        continue
      }
    }

    if (isSingleLineDoubleSided(trimmedLine)) {
      const prevLine = i > 0 ? lines[i - 1].trim() : ''
      const nextLine = i < lines.length - 1 ? lines[i + 1].trim() : ''
      
      const prevIsSeparator = prevLine === '' || isHeading(prevLine) || isSingleLineDoubleSided(prevLine) || prevLine === '***'
      const nextIsSeparator = nextLine === '' || isHeading(nextLine) || isSingleLineDoubleSided(nextLine) || nextLine === '***'
      const isStandalone = prevIsSeparator && nextIsSeparator
      
      if (isStandalone) {
        if (currentContent.length > 0) {
          processContent()
        }
        
        const [front, back] = splitInline(trimmedLine)
        addCard({ type: 'double', front, back })
        i++
        continue
      }
    }

    if (isEmptyLine(trimmedLine) && currentContent.length > 0) {
      let emptyCount = 0
      let j = i
      while (j < lines.length && isEmptyLine(lines[j].trim())) {
        emptyCount++
        j++
      }
      
      if (emptyCount >= 2) {
        processContent()
        i = j
        continue
      }
    }

    currentContent.push(line)
    i++
  }

  processContent()

  return cards
}

function extractPathTags(filePath) {
  if (!filePath) return []
  
  let path = filePath.replace(/\\/g, '/')
  path = path.replace(/\.md$/i, '')
  
  const parts = path.split('/').filter(p => p.length > 0)
  
  return parts
}

function isCodeBlockStart(line) {
  return line.startsWith('```')
}

function isHeading(line) {
  return line.startsWith('#')
}

function parseHeading(line) {
  const match = line.match(/^(#{1,6})\s+(.+)$/)
  if (!match) return { level: 0, text: '' }
  return {
    level: match[1].length,
    text: match[2].trim()
  }
}

function updateTags(tags, newLevel, newText) {
  if (newLevel === 0 || !newText) return

  while (tags.length >= newLevel) {
    tags.pop()
  }
  tags.push(newText)
}

function isDivider(line) {
  return line === '***'
}

function isEmptyLine(line) {
  return line === ''
}

function isSingleLineDoubleSided(line) {
  if (!line.includes('>>>')) return false
  if (line.includes('\n')) return false
  
  const parts = line.split('>>>')
  if (parts.length !== 2) return false
  
  const front = parts[0].trim()
  const back = parts[1].trim()
  
  return front.length > 0 && back.length > 0
}

function isDoubleSidedInline(content) {
  if (content.includes('\n')) return false
  if (!content.includes('>>>')) return false
  
  const parts = content.split('>>>')
  if (parts.length !== 2) return false
  
  const front = parts[0].trim()
  const back = parts[1].trim()
  
  return front.length > 0 && back.length > 0
}

function splitInline(content) {
  const parts = content.split('>>>')
  return [parts[0].trim(), parts[1].trim()]
}

function isDoubleSidedBlock(content) {
  const lines = content.split('\n')
  let foundOpen = false
  let foundClose = false
  let inCode = false
  
  for (const line of lines) {
    const trimmed = line.trim()
    
    if (trimmed.startsWith('```')) {
      inCode = !inCode
      continue
    }
    
    if (inCode) continue
    
    if (trimmed === ':::' && !foundOpen) {
      foundOpen = true
    } else if (trimmed === ':::' && foundOpen) {
      foundClose = true
    }
  }
  
  return foundOpen && foundClose
}

function tryParseBlockCard(lines, startIndex, frontLines) {
  let inCode = false
  let foundClose = false
  const backLines = []
  
  for (let i = startIndex + 1; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()
    
    if (trimmed.startsWith('```')) {
      inCode = !inCode
      backLines.push(line)
      continue
    }
    
    if (inCode) {
      backLines.push(line)
      continue
    }
    
    if (trimmed === ':::') {
      foundClose = true
      return {
        frontLines,
        backLines,
        endIndex: i
      }
    }
    
    backLines.push(line)
  }
  
  return null
}

function splitBlock(content) {
  const lines = content.split('\n')
  const frontLines = []
  const backLines = []
  let inBack = false
  let inCode = false
  
  for (const line of lines) {
    const trimmed = line.trim()
    
    if (trimmed.startsWith('```')) {
      if (inCode) {
        inCode = false
      } else {
        inCode = true
      }
      if (inBack) {
        backLines.push(line)
      } else {
        frontLines.push(line)
      }
      continue
    }
    
    if (inCode) {
      if (inBack) {
        backLines.push(line)
      } else {
        frontLines.push(line)
      }
      continue
    }
    
    if (trimmed === ':::' && !inBack) {
      inBack = true
      continue
    }
    
    if (trimmed === ':::' && inBack) {
      continue
    }
    
    if (inBack) {
      backLines.push(line)
    } else {
      frontLines.push(line)
    }
  }
  
  const front = frontLines.join('\n').trim()
  const back = backLines.join('\n').trim()
  
  return { front, back }
}

export { parseFlashcards }
