var suite = require('./_utils').suite

module.exports = suite(function (t) {
  t.test('() - group/extglob', function (t) {
    t.testPerSeparator(
      '@() matches one of the given subpatterns exactly one time',
      function (t) {
        t.match('@(one|two)')('one')
        t.match('@(one|two)')('two')
        t.dontMatch('@(one|two)')('')
        t.dontMatch('@(one|two)')('@(one|two)')
        t.dontMatch('@(one|two)')('onetwo')
        t.dontMatch('@(one|two)')('oneone')
        t.match('@(one|two|three|four)')('three')
        t.dontMatch('@(one|two|three|four)')('five')
        t.dontMatch('@(one|two|three|four)')('onetwo')
      }
    )

    t.testPerSeparator(
      '?() matches one of the given subpatterns zero or one time',
      function (t) {
        t.match('?(one|two)')('')
        t.match('?(one|two)')('one')
        t.match('?(one|two)')('two')
        t.dontMatch('?(one|two)')('?(one|two)')
        t.dontMatch('?(one|two)')('onetwo')
        t.dontMatch('?(one|two)')('oneone')
        t.match('?(one|two|three|four)')('')
        t.match('?(one|two|three|four)')('three')
        t.dontMatch('?(one|two|three|four)')('five')
        t.dontMatch('?(one|two|three|four)')('onetwo')
        t.dontMatch('?(one|two|three|four)')('twotwo')
      }
    )

    t.testPerSeparator(
      '*() matches one of the given subpatterns zero or more times',
      function (t) {
        t.match('*(one|two)')('')
        t.match('*(one|two)')('one')
        t.match('*(one|two)')('two')
        t.match('*(one|two)')('onetwo')
        t.match('*(one|two)')('oneone')
        t.match('*(one|two)')('oneonetwoonetwo')
        t.dontMatch('*(one|two)')('*(one|two)')
        t.dontMatch('*(one|two)')('three')
        t.match('*(one|two|three|four)')('')
        t.match('*(one|two|three|four)')('three')
        t.match('*(one|two|three|four)')('onetwothree')
        t.match('*(one|two|three|four)')('onetwothreefourthreetwoone')
        t.dontMatch('*(one|two|three|four)')('five')
      }
    )

    t.testPerSeparator(
      '+() matches one of the given subpatterns one or more times',
      function (t) {
        t.match('+(one|two)')('one')
        t.match('+(one|two)')('two')
        t.match('+(one|two)')('onetwo')
        t.match('+(one|two)')('oneone')
        t.match('+(one|two)')('oneonetwoonetwo')
        t.dontMatch('+(one|two)')('')
        t.dontMatch('+(one|two)')('+(one|two)')
        t.dontMatch('+(one|two)')('three')
        t.match('+(one|two|three|four)')('three')
        t.match('+(one|two|three|four)')('onetwothree')
        t.match('+(one|two|three|four)')('onetwothreefourthreetwoone')
        t.dontMatch('+(one|two|three|four)')('')
        t.dontMatch('+(one|two|three|four)')('five')
      }
    )

    t.testPerSeparator(
      '| is treated literally when not in a complete group with a valid modifier',
      function (t) {
        t.match('|')('|')
        t.match('o|e')('o|e')
        t.dontMatch('o|e')('o')
        t.dontMatch('o|e')('|')
        t.match('(o|e)')('(o|e)')
        t.dontMatch('(o|e)')('o')
        t.match('&(o|e)')('&(o|e)')
        t.dontMatch('&(o|e)')('o')
        t.match('|||')('|||')
        t.match('|@(|')('|@(|')
      }
    )

    t.testPerSeparator(
      'When there is no preceding modifier given, () are treated literally',
      function (t) {
        t.match('()')('()')
        t.match('one()')('one()')
        t.match('one()two')('one()two')
        t.match('(one)')('(one)')
        t.dontMatch('(one)')('one')
        t.dontMatch('(one|two)')('one')
        t.dontMatch('(one|two)')('two')
        t.match('(one|)/()')('(one|)/()')
        t.match('(one)/(two)')('(one)/(two)')
        t.match('(one|two)/(three)')('(one|two)/(three)')
        t.match('(one)/(two/three|four)')('(one)/(two/three|four)')
      }
    )

    t.testPerSeparator('When turned off in options, treated literally', function (t) {
      t.options({ '()': false })

      t.match('@(one)')('@(one)')
      t.match('@(one|two)')('@(one|two)')
      t.dontMatch('@(one|two)')('')
      t.dontMatch('@(one|two)')('one')
      t.match('?(one)')('?(one)')
      t.match('?(one|two)')('?(one|two)')
      t.dontMatch('?(one|two)')('')
      t.dontMatch('?(one|two)')('one')
      t.match('*(one)')('*(one)')
      t.match('*(one|two)')('*(one|two)')
      t.dontMatch('*(one|two)')('')
      t.dontMatch('*(one|two)')('one')
      t.match('+(one)')('+(one)')
      t.match('+(one|two)')('+(one|two)')
      t.dontMatch('+(one|two)')('')
      t.dontMatch('+(one|two)')('one')
      t.dontMatch('+(one|two)')('onetwo')

      t.match('@(one/two|three)')('@(one/two|three)')
      t.dontMatch('@(one/two|three)')('')
      t.dontMatch('@(one/two|three)')('three')
      t.match('?(one/two|three)')('?(one/two|three)')
      t.dontMatch('?(one/two|three)')('')
      t.dontMatch('?(one/two|three)')('three')
      t.match('*(one/two|three)')('*(one/two|three)')
      t.dontMatch('*(one/two|three)')('')
      t.dontMatch('*(one/two|three)')('three')
      t.match('+(one/two|three)')('+(one/two|three)')
      t.dontMatch('+(one/two|three)')('')
      t.dontMatch('+(one/two|three)')('three')

      t.match('one/@(two|three)/four')('one/@(two|three)/four')
      t.dontMatch('one/@(two|three)/four')('')
      t.dontMatch('one/@(two|three)/four')('one/two/four')
      t.match('one/?(two|three)/four')('one/?(two|three)/four')
      t.dontMatch('one/?(two|three)/four')('')
      t.dontMatch('one/?(two|three)/four')('one/two/four')
      t.match('one/*(two|three)/four')('one/*(two|three)/four')
      t.dontMatch('one/*(two|three)/four')('')
      t.dontMatch('one/*(two|three)/four')('one/two/four')
      t.match('one/+(two|three)/four')('one/+(two|three)/four')
      t.dontMatch('one/+(two|three)/four')('')
      t.dontMatch('one/+(two|three)/four')('one/two/four')
    })

    t.testPerSeparator('When unmatched, treated literally', function (t) {
      t.match('(')('(')
      t.match(')')(')')
      t.match('((')('((')
      t.match('))')('))')

      t.match('@(')('@(')
      t.match('@((')('@((')
      t.match('@(@(')('@(@(')
      t.match('@(@((')('@(@((')
      t.match('@()@(')('@(')

      t.match('?(')('?(')
      t.match('?((')('?((')
      t.match('?(?(')('?(?(')
      t.match('?(?(')('a(a(')
      t.match('?(?((')('?(?((')
      t.match('?(?((')('o(n((')
      t.match('?()?(')('?(')
      t.match('?()?(')('n(')

      t.match('*(')('*(')
      t.match('*(')('(')
      t.match('*(')('one(')
      t.match('*((')('*((')
      t.match('*((')('((')
      t.match('*((')('one((')
      t.match('*(*(')('*(*(')
      t.match('*(*(')('((')
      t.match('*(*(')('one(two(')
      t.match('*()*(')('(')
      t.match('*()*(')('one(')
      t.match('*(*((')('(((')

      t.match('+(')('+(')
      t.match('+((')('+((')
      t.match('+(+(')('+(+(')
      t.match('+(+((')('+(+((')
      t.match('+()+(')('+(')
    })

    t.testPerSeparator(
      'Separators between () make them be treated literally',
      function (t) {
        t.dontMatch('@(one/two)')('one')
        t.dontMatch('?(one/two)')('one')
        t.dontMatch('*(one/two)')('one')
        t.dontMatch('+(one/two)')('one')

        t.matchWhenSeparated('@(one/two)')('@(one/two)')
        t.matchWhenSeparated('?(one/two)')('?(one/two)')
        t.matchWhenSeparated('?(one/two)')('o(one/two)')
        t.matchWhenSeparated('*(one/two)')('*(one/two)')
        t.matchWhenSeparated('*(one/two)')('one(one/two)')
        t.matchWhenSeparated('+(one/two)')('+(one/two)')
      }
    )

    // TODO: add tests for escaped parens
  })
})
