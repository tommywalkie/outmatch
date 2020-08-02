var suite = require('./_utils').suite

module.exports = suite(function (t) {
  t.test('[] - character class', function (t) {
    t.testPerSeparator('Matches one character from the given list', function (t) {
      // TODO: add cases with separators
      t.pattern('[abc]').matches('a', 'b').doesntMatch('d', 'ab')
      t.pattern('[ab][cd]').matches('ac', 'bd').doesntMatch('a', 'c', 'ca', 'abc')
    })

    t.testPerSeparator('Matches one character from the given range', function (t) {
      t.pattern('[a-z]').matches('a', 'g', 'z').doesntMatch('A', '2', 'ab', '', '[a-z]')
      t.pattern('[0-5]')
        .matches('0', '1', '2', '3', '4', '5')
        .doesntMatch('6', 'a', '01', '-1', '', '[0-5]')
      t.pattern('[0-z]')
        .matches('6', 'E', 's')
        .doesntMatch('', '!', ' ', '0z', '0-z', '[0-z]')
    })

    t.testPerSeparator(
      '? in a character class is treated as a literal member of the class',
      function (t) {
        t.pattern('[?]').matches('?').doesntMatch('', '[?]', 'one')
        t.pattern('[o?e]').matches('o', '?', 'e').doesntMatch('', 'n', '[o?e]')
      }
    )

    t.testPerSeparator(
      '* in a character class is treated as a literal member of the class',
      function (t) {
        t.pattern('[*]').matches('*').doesntMatch('', '[*]', 'one')
        t.pattern('[o*e]').matches('o', '*', 'e').doesntMatch('', 'n', '[o*e]')
      }
    )

    t.testPerSeparator(
      'When - is at the beginning or end of a character class, it is treated as a member of the class',
      function (t) {
        t.pattern('[-z]').matches('-', 'z').doesntMatch('', '-z', 'b')
        t.pattern('[z-]').matches('-', 'z').doesntMatch('', 'z-', 'b')
      }
    )

    t.testPerSeparator(
      'When ] is at the beginning of a character class, it is treated as a member of the class',
      function (t) {
        t.pattern('[]]').matches(']').doesntMatch('')
        t.pattern('[]z]').matches(']', 'z').doesntMatch('', ']z', 'b')
        t.pattern('one/[]t]wo').matches('one/two', 'one/]wo')
      }
    )

    t.options({ '[]': false }).testPerSeparator(
      'When turned off in options, treated literally',
      function (t) {
        t.pattern('[abc]').matches('[abc]').doesntMatch('', 'a', 'b', '[]')
        t.pattern('[a-z]').matches('[a-z]').doesntMatch('', 'a', '-', 'z', '[]')
        t.pattern('[a/c]').matches('[a/c]').doesntMatch('', 'a', '/')
        t.pattern('one/[tw]o').matches('one/[tw]o').doesntMatch('one/to')
        t.pattern('one/[tw]o/three')
          .matches('one/[tw]o/three')
          .doesntMatch('one/to/three')
      }
    )

    t.testPerSeparator('[] is treated literally', function (t) {
      t.pattern('[]').matches('[]').doesntMatch('', '[', ']', 'o')
      t.pattern('[]]').doesntMatch('[]')
      t.pattern('on[]/two').matches('on[]/two').doesntMatch('on[/two', 'on]/two')
    })

    t.testPerSeparator('Unclosed [ is treated literally', function (t) {
      t.pattern('[').matches('[').doesntMatch('', '[]')
      t.pattern('one[').matches('one[').doesntMatch('one')
      t.pattern('one[/two').matches('one[/two')
    })

    t.testPerSeparator(
      'Separators in the middle of a character class interrupt it, so [/] are treated literally',
      function (t) {
        t.pattern('[/]')
          .matchesWhenSeparated('[/]')
          .doesntMatch('[]')
          .doesntMatchWhenSeparated('/')
        t.pattern('[/').matches('[/').doesntMatch('[', '/')
      }
    )

    t.testPerSeparator("] that doesn't close anything is treated literally", function (
      t
    ) {
      t.pattern(']').matches(']').doesntMatch('', '[]')
      t.pattern('one]').matches('one]').doesntMatch('one')
      t.pattern('one]/two').matches('one]/two')
    })

    t.testPerSeparator('When escaped, treated literally', function (t) {
      t.pattern('\\[').matches('[').doesntMatch('', '\\[')
      t.pattern('\\[]').matches('[]').doesntMatch('', '\\[]')
      t.pattern('\\[abc]').matches('[abc]').doesntMatch('', '\\[abc]')
      t.pattern('[\\]').matches('[]').doesntMatch('', '[\\]')
      t.pattern('[abc\\]').matches('[abc]').doesntMatch('', '\\[abc]')
    })

    t.testPerSeparator(
      'When an escaped [, ] or - is in a character class, it is treated literally',
      function (t) {
        t.pattern('[a\\[b]').matches('[', 'a', 'b')
        t.pattern('[\\[]').doesntMatch('', 'c', '[\\[]')
        t.pattern('[a\\]b]').matches(']', 'a', 'b').doesntMatch('', 'c', '[a\\]b]')
        t.pattern('[a\\-b]').matches('-', 'a', 'b').doesntMatch('', 'c', '[a\\-b]')
      }
    )

    // TODO: add tests for characters after brackets
    // TODO: add tests for multiple brackets in a pattern
  })
})
