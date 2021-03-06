import { suite } from './_utils'

export default suite((t) => {
  t.testPerSeparator('No wildcards and no separators in arguments', (t) => {
    t.pattern('').matches('').doesntMatch('o')
    t.pattern('o').matches('o').doesntMatch('', 'n', 'O')
    t.pattern('one').matches('one').doesntMatch('', 'o', 'on', 'two')
    t.pattern('One').matches('One')
    t.pattern('onetwo').matches('onetwo').doesntMatch('oneTwo')
    t.pattern('oneTwoThree').matches('oneTwoThree')
    t.pattern('O').doesntMatch('o')
    t.pattern('oneTwo').doesntMatch('onetwo')
  })

  t.testPerSeparator('Wildcard symbols in samples are treated literally', (t) => {
    t.pattern('').doesntMatch('?')
    t.pattern('o').doesntMatch('?')
    t.pattern('one').doesntMatch('?', '???', '***')
    t.pattern('onetwo').doesntMatch(
      'one?wo',
      'one?two',
      '*',
      'one*',
      '*two',
      'one*two',
      '**',
      'one**',
      '**two',
      'one**two',
      '***'
    )
    t.pattern('/').doesntMatch(
      '?',
      '??',
      '???',
      '*',
      '**',
      '/?',
      '/??',
      '/???',
      '/*',
      '/**',
      '?/',
      '??/',
      '???/',
      '*/',
      '**/'
    )
    t.pattern('o/').doesntMatch('?/')
    t.pattern('on/').doesntMatch('??/')
    t.pattern('one/').doesntMatch('???/', '*/', '**/')
  })

  t.testPerSeparator('No wildcards in patterns', (t) => {
    t.pattern('').matchesWhenSeparated('/')
    t.pattern('/').matches('/').doesntMatch('', 'one/two')
    t.pattern('//').matches('//')
    t.pattern('///').matches('///')
    t.pattern('one/')
      .matches('one/')
      .matchesWhenSeparated('one//', 'one/////')
      .doesntMatch('/one', '/one/', 'one/two')
    t.pattern('/one')
      .matches('/one')
      .matchesWhenSeparated('//one', '/////one', '/one/')
      .doesntMatch('one//', 'one/')
    t.pattern('one/two')
      .matches('one/two')
      .doesntMatch('one_two', '/', 'one/', 'one/three')
    t.pattern('/one/').matches('/one/')
    t.pattern('one/two/three').doesntMatch('one/three', 'one/three/two')
  })

  t.test('Treats unused RegExp characters literally', (t) => {
    t.pattern('^$.+-|)').matches('^$.+-|)')
  })
})
