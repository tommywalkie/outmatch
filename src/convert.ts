// Disclaimer: the code is optimized for performance and compatibility, hence the ugliness

import type { OutmatchOptions } from './index'

const EXCLUDE_DOT_PATTERN = '(?!\\.)'

function escapeRegExpChar(char: string) {
  if (
    char === '-' ||
    char === '^' ||
    char === '$' ||
    char === '+' ||
    char === '.' ||
    char === '(' ||
    char === ')' ||
    char === '|' ||
    char === '[' ||
    char === ']' ||
    char === '{' ||
    char === '}' ||
    char === '*' ||
    char === '?' ||
    char === '\\'
  ) {
    return '\\' + char
  } else {
    return char
  }
}

function escapeRegExpString(str: string) {
  let result = ''
  for (let i = 0; i < str.length; i++) {
    result += escapeRegExpChar(str[i])
  }
  return result
}

function findSeparatorEnd(pattern: string, startingIndex: number, separator: string) {
  let separatorEnd = -1

  for (let j = 0; ; j++) {
    let sepI = j % separator.length
    let patI = startingIndex + j

    // A complete separator is found, but there could be more right next to it, so we continue
    if (j > 0 && sepI === 0) {
      separatorEnd = patI - 1
    }

    if (separator[sepI] !== pattern[patI]) {
      break
    }
  }

  return separatorEnd
}

function convertPattern(
  pattern: string,
  options: OutmatchOptions,
  excludeDot: boolean
) {
  // While using the native .split() method is simpler and possibly even faster,
  // custom splitting logic is much more flexible and allows fine-tuning.

  // When separator === true, we use different separators for splitting the pattern
  // and matching samples, so we need more than one separator variables
  let separator = options.separator
  let separatorSplitter = separator === true ? '/' : separator || ''
  let separatorMatcher =
    separator === true
      ? '/|\\\\'
      : separatorSplitter && escapeRegExpString(separatorSplitter)

  if (separatorMatcher.length > 1) {
    separatorMatcher = '(?:' + separatorMatcher + ')'
  }

  // Multiple separators in a row are treated as a single one;
  // trailing separators are optional unless they are put in the pattern deliberately
  let optionalSeparator = separator ? separatorMatcher + '*' : ''
  let requiredSeparator = separator ? separatorMatcher + '+' : ''

  if (pattern.length === 0) {
    return optionalSeparator
  }

  // When the separator consists of only one char, we use a character class
  // rather than a lookahead because it is faster
  let wildcard = separatorMatcher
    ? separatorMatcher.length === 1
      ? '[^' + separatorMatcher + ']'
      : '(?:(?!' + separatorMatcher + ').)'
    : '.'

  excludeDot = excludeDot && options.excludeDot !== false
  let excludeDotPattern = excludeDot ? EXCLUDE_DOT_PATTERN : ''
  let segmentDotHandled = false

  let supportQMark = options['?'] !== false
  let supportStar = options['*'] !== false
  let supportGlobstar = options['**'] !== false

  let supportBrackets = options['[]'] !== false
  let openingBracket = pattern.length
  let closingBracket = -1

  let supportExtglobs = options['()'] !== false
  let extglobModifiers = []
  let openingParens = 0
  let closingParens = 0
  let parensHandledUntil = -1
  let scanningForParens = false

  let patternEndHandled = false
  let patternEnd = pattern.length - 1
  let segmentStart = 0
  let segmentEnd = patternEnd
  let separatorStart = -1
  let separatorEnd = -1
  let escapeChar = false

  // To support negated extglobs, we maintain two resulting patterns called `match` and `unmatch`.
  // They are built identically except for two things:
  // 1. The contents of negated extglobs.
  //    In `match` they become `wildcard + *`, i.e. "match everything but the separator".
  //    In `unmatch` they become a regular positive regexp group.
  // 2. Patterns for excluding leading dots.
  //    They are added to `match` and skipped in `unmatch`.
  // The `addTo*` variables are used to determine which pattern to add a character to.
  // `useUnmatch` is set to true if we actually encounter a negated extglob. In that case
  // the function returns the result as `'(?!^' + unmatch + '$)' + match`, otherwise
  // just `match` is returned.
  let match = ''
  let unmatch = ''
  let addToMatch = true
  let addToUnmatch = true
  let useUnmatch = false

  function add(addition: string, excludeDot?: boolean) {
    if (addToUnmatch) {
      unmatch += addition
    }

    if (addToMatch) {
      if (excludeDot && !segmentDotHandled) {
        addition = excludeDotPattern + addition
        segmentDotHandled = true
      } else if (!excludeDot) {
        segmentDotHandled = true
      }

      match += addition
    }
  }

  // Iterating from -1 to patternEnd + 1 could help us simplify the iteration logic,
  // but apparently it makes the compiler add bounds checks, which can degrade performance
  // significantly
  for (let i = 0; i <= patternEnd; i++) {
    let char = pattern[i]
    let nextChar = pattern[i + 1]

    // Check if the next char is the start of a separator. If so, mark the current index
    // as segment end and find the starting index of the next segment
    if (
      separator &&
      separatorEnd === -1 &&
      i + separatorSplitter.length <= patternEnd
    ) {
      if (i === 0) {
        separatorStart = i
        separatorEnd = findSeparatorEnd(pattern, separatorStart, separatorSplitter)
      }

      if (i > 0 || separatorEnd === -1) {
        separatorStart = i + 1
        separatorEnd = findSeparatorEnd(pattern, separatorStart, separatorSplitter)

        if (separatorEnd !== -1) {
          segmentEnd = i
        } else {
          separatorStart = -1
        }
      }
    }

    // The straightforward way to handle escaping would be to add the next character
    // to the result as soon as a backslash is found and skip the rest of the current iteration.
    // However, some processing has to be triggered for the last char in a pattern no matter
    // if it is escaped or not, so we can't do this. Instead, we set the escapeChar flag
    // for the next char and handle it in the next iteration (in which we have to be
    // extra careful to reset the flag whenever the iteration completes or continues)
    if (char === '\\') {
      if (i < segmentEnd) {
        escapeChar = true
        continue
      } else {
        // If the last char in a pattern is a backslash, it is omitted
        char = ''
      }
    }

    if (supportBrackets && !scanningForParens) {
      if (i > openingBracket && i <= closingBracket) {
        // We are certainly in a complete character class
        // and should treat almost all characters literally
        if (escapeChar) {
          add(escapeRegExpChar(char))
        } else if (i === closingBracket) {
          add(']')
          openingBracket = pattern.length
        } else if (char === '-' && i === closingBracket - 1) {
          add('\\-')
        } else if (char === '!' && i === openingBracket + 1) {
          add('^')
        } else if (char === ']') {
          add('\\]')
        } else {
          add(char)
        }
        escapeChar = false
        continue
      }

      if (i > openingBracket) {
        // We are in an open character class and are looking for a closing bracket
        // to make sure the class is terminated
        if (
          char === ']' &&
          !escapeChar &&
          i > openingBracket + 1 &&
          i > closingBracket
        ) {
          // Closing bracket is found; return to openingBracket
          // and treat all the in-between chars literally
          closingBracket = i
          i = openingBracket
          add('[', true)
        } else if (i === segmentEnd) {
          // Closing bracket is not found; return to the opening bracket
          // and treat all the in-between chars as usual
          add('\\[')
          i = openingBracket
          openingBracket = pattern.length
          closingBracket = pattern.length
        }
        escapeChar = false
        continue
      }

      // An opening bracket is found; commence scanning for a closing bracket
      if (char === '[' && !escapeChar && i > closingBracket && i < segmentEnd) {
        openingBracket = i
        escapeChar = false
        continue
      }
    }

    if (supportExtglobs) {
      // When we find an opening extglob paren, we start counting opening and closing
      // parens and ignoring other chars until all the opened extglobes are closed
      // or the pattern ends. After we have counted the parens, we return to the char
      // we started from and proceed normally while transforming the extglobs that have
      // a closing paren.
      if (
        nextChar === '(' &&
        !escapeChar &&
        (char === '@' || char === '?' || char === '*' || char === '+' || char === '!')
      ) {
        if (scanningForParens) {
          openingParens++
        } else if (i > parensHandledUntil) {
          parensHandledUntil = i
          scanningForParens = true
          openingParens++
          extglobModifiers.push(char)
        } else if (closingParens >= openingParens) {
          if (i > parensHandledUntil) {
            parensHandledUntil = i
          }
          if (char === '!') {
            unmatch = match
            addToMatch = true
            addToUnmatch = false
            add(wildcard + '*', true)
            addToMatch = false
            addToUnmatch = true
            useUnmatch = true
          }
          add('(?:', true)
          openingParens--
          i++
          continue
        } else {
          openingParens--
        }
      } else if (char === ')' && !escapeChar) {
        if (scanningForParens) {
          closingParens++
        } else if (closingParens) {
          let modifier = extglobModifiers.pop()
          if (modifier === '!') {
            if (extglobModifiers.indexOf('!') !== -1) {
              throw new Error("Nested negated extglobs aren't supported")
            }
            add(')')
          } else if (modifier === '@') {
            add(')')
          } else {
            add(')' + modifier)
          }
          if (closingParens === 0) {
            extglobModifiers = []
          }
          addToMatch = true
          addToUnmatch = true
          closingParens--
          continue
        }
      } else if (char === '|' && closingParens && !escapeChar) {
        add('|')
        continue
      }

      if (scanningForParens) {
        if (closingParens === openingParens || i === segmentEnd) {
          scanningForParens = false
          i = parensHandledUntil - 1
        }
        escapeChar = false
        continue
      }
    }

    let isGlobstar =
      separator &&
      supportGlobstar &&
      i === segmentEnd &&
      segmentEnd - segmentStart === 1 &&
      pattern[segmentStart] === '*' &&
      pattern[segmentEnd] === '*'

    if (!isGlobstar && (i < separatorStart || i > separatorEnd)) {
      if (!escapeChar && supportStar && char === '*') {
        if (i === segmentEnd || (i < segmentEnd && nextChar !== '*')) {
          add(wildcard + '*', true)
        }
      } else if (!escapeChar && supportQMark && char === '?') {
        add(wildcard, true)
      } else {
        add(escapeRegExpChar(char))
      }
    }

    // Add a separator matcher if the current char is the last one in a segment or it is
    // a part of a separator (which can happen if the pattern starts with a separator)
    if (separator && (i === segmentEnd || (i >= separatorStart && i <= separatorEnd))) {
      let currentSeparator = i < patternEnd ? requiredSeparator : optionalSeparator

      if (isGlobstar) {
        add('(?:' + excludeDotPattern + wildcard + '*' + currentSeparator + ')*')
      } else {
        add(currentSeparator)
      }

      if (i === patternEnd) {
        patternEndHandled = true
      } else {
        i = separatorEnd
        segmentStart = separatorEnd + 1
        segmentEnd = patternEnd
        separatorEnd = -1
        segmentDotHandled = false
      }
    }

    escapeChar = false
  }

  if (!patternEndHandled) {
    add(optionalSeparator)
  }

  if (useUnmatch) {
    return '(?!^' + unmatch + '$)' + match
  } else {
    return match
  }
}

function convert(pattern: string, options: OutmatchOptions) {
  let supportNegation = options['!'] !== false
  let supportParens = options['()'] !== false
  let isNegated = false
  let i: number

  if (supportNegation) {
    for (i = 0; i < pattern.length && pattern[i] === '!'; i++) {
      if (supportParens && pattern[i + 1] === '(') {
        i--
        break
      }
      isNegated = !isNegated
    }

    if (i > 0) {
      pattern = pattern.substr(i)
    }
  }

  if (isNegated) {
    pattern = '(?!^' + convertPattern(pattern, options, false) + '$)'
  } else {
    pattern = convertPattern(pattern, options, options.excludeDot !== false)
  }

  return { pattern, isNegated }
}

export default convert
