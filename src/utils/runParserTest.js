import { parseFlashcards } from './flashcardParser.js'
import { testCases } from './flashcardParser.test.js'

function runTests() {
  console.log('Running Flashcard Parser Tests...\n')
  
  let passed = 0
  let failed = 0
  
  for (const testCase of testCases) {
    try {
      const actual = parseFlashcards(testCase.input, testCase.filePath || '')
      const expected = testCase.expected
      
      const actualStr = JSON.stringify(actual, null, 2)
      const expectedStr = JSON.stringify(expected, null, 2)
      
      if (actualStr === expectedStr) {
        console.log(`✅ ${testCase.name}`)
        passed++
      } else {
        console.log(`❌ ${testCase.name}`)
        console.log('Expected:', expectedStr)
        console.log('Actual:', actualStr)
        console.log('')
        failed++
      }
    } catch (error) {
      console.log(`❌ ${testCase.name}`)
      console.log('Error:', error.message)
      console.log('')
      failed++
    }
  }
  
  console.log('\n' + '='.repeat(50))
  console.log(`Total: ${testCases.length}, Passed: ${passed}, Failed: ${failed}`)
  
  return failed === 0
}

runTests()
