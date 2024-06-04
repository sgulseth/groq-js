import t from 'tap'

import {
  type ExprNode,
  parse,
  type FilterNode,
  type MapNode,
  type FlatMapNode,
  type ProjectionNode,
} from '../src/1'
import {builder} from '../src/builder'
import {isEqual} from '../src/isEqual'

function parseAndEqual(t: Tap.Test, query: string) {
  const parsed = parse(query)
  // console.log(JSON.stringify(parsed, null, 2))
  const built = builder(parsed)
  t.same(built, query)
}

function equalAndCanParse(t: Tap.Test, node: ExprNode, expectedQuery: string) {
  const built = builder(node)
  t.same(built, expectedQuery)
  t.same(builder(parse(built)), expectedQuery)
}

t.test('test projections', (t) => {
  parseAndEqual(t, `*{a,b}`)
  parseAndEqual(t, `*{a,b,c}`)
  parseAndEqual(t, `*{"a":b,c}`)
  parseAndEqual(t, `*{"a":b,c}.c`)
  t.end()
})

t.test('filters', (t) => {
  parseAndEqual(t, `*[a==1]`)
  parseAndEqual(t, `*[a==1&&b==2]`)
  parseAndEqual(t, `*[a==1&&b==2&&c==3]`)
  parseAndEqual(t, `*[a==1||b==2]`)
  parseAndEqual(t, `*[a==1||b==2||c==3]`)
  parseAndEqual(t, `*[a==1&&b==2||c==3]`)
  parseAndEqual(t, `*[a==1||b==2&&c==3]`)
  t.end()
})

t.test('filters and projections', (t) => {
  parseAndEqual(t, `*[a==1]{a,b[]}`)
  parseAndEqual(t, `*[(1+3)>4]{a,b[]}`)
  t.end()
})

t.test('test functions', (t) => {
  parseAndEqual(t, `count(foo)`)
  t.end()
})

t.test('test pipes', (t) => {
  parseAndEqual(t, `*[]|order(_score desc)`)
  parseAndEqual(t, `*[]|order(_score asc)`)
  t.end()
})

t.test('test maps and slices', (t) => {
  parseAndEqual(t, `*.foo[][1..2]`)
  parseAndEqual(t, `*.baz[].bar[1...2][5]`)
  parseAndEqual(t, `*[][1..2]`)
  parseAndEqual(t, `*[][1...2]`)
  parseAndEqual(t, `*[][1...2].foo[]`)
  parseAndEqual(t, `*[_type=="foo"][5]{_id}`)
  t.end()
})

t.test('test neg and pos', (t) => {
  parseAndEqual(t, `(*-1)`)
  parseAndEqual(t, `*+1`)
  t.end()
})

t.test('parent', (t) => {
  parseAndEqual(t, `^.foo`)
  parseAndEqual(t, `^.^.^.^.^.foo`)
  t.end()
})

t.test('test select', (t) => {
  parseAndEqual(
    t,
    `*[_type=="movie"]{...,"popularity":select(popularity>20=>"high",popularity>10=>"medium",popularity<=10=>"low")}`,
  )
  t.end()
})

t.test('test values', (t) => {
  equalAndCanParse(t, {type: 'Value', value: 1}, '1')
  equalAndCanParse(t, {type: 'Value', value: true}, 'true')
  equalAndCanParse(t, {type: 'Value', value: false}, 'false')
  equalAndCanParse(t, {type: 'Value', value: null}, 'null')
  equalAndCanParse(t, {type: 'Value', value: 'string'}, '"string"')
  equalAndCanParse(t, {type: 'Value', value: {a: 1}}, '{"a":1}')
  equalAndCanParse(t, {type: 'Value', value: {a: {b: 1}}}, '{"a":{"b":1}}')
  equalAndCanParse(t, {type: 'Value', value: {a: {b: 1}, c: 2}}, '{"a":{"b":1},"c":2}')
  equalAndCanParse(t, {type: 'Value', value: [1, 2, 3]}, '[1,2,3]')
  equalAndCanParse(t, {type: 'Value', value: [1, 'a', {b: 1}]}, '[1,"a",{"b":1}]')
  t.end()
})

const VALUES = [
  {type: 'Value', value: 1},
  {type: 'Value', value: true},
  {type: 'Value', value: false},
  {type: 'Value', value: null},
  {type: 'Value', value: 'string'},
  {type: 'Value', value: {a: 1}},
  {type: 'Value', value: {a: {b: 1}}},
  {type: 'Value', value: {a: {b: 1}, c: 2}},
  {type: 'Value', value: [1, 2, 3]},
  {type: 'Value', value: [1, 'a', {b: 1}]},
] as const
const OPERATORS = ['+', '-', '*', '/', '%', '==', '!=', '>', '>=', '<', '<='] as const

for (const op of OPERATORS) {
  for (const lhs of VALUES) {
    for (const rhs of VALUES) {
      t.test(`operators: ${JSON.stringify(lhs.value)}${op}${JSON.stringify(rhs.value)}`, (t) => {
        equalAndCanParse(
          t,
          {
            type: 'OpCall',
            op: op,
            left: lhs,
            right: rhs,
          },
          `${JSON.stringify(lhs.value)}${op}${JSON.stringify(rhs.value)}`,
        )
        parseAndEqual(t, `*[(${JSON.stringify(lhs.value)}${op}${JSON.stringify(rhs.value)})!=null]`)
        t.end()
      })
    }
  }
}

for (const lhs of VALUES) {
  for (const rhs of VALUES) {
    t.test(`and: ${lhs.value}&&${rhs.value}`, (t) => {
      equalAndCanParse(
        t,
        {
          type: 'And',
          left: lhs,
          right: rhs,
        },
        `${JSON.stringify(lhs.value)}&&${JSON.stringify(rhs.value)}`,
      )
      t.end()
    })
  }
}

for (const lhs of VALUES) {
  for (const rhs of VALUES) {
    t.test(`or: ${lhs.value}||${rhs.value}`, (t) => {
      equalAndCanParse(
        t,
        {
          type: 'Or',
          left: lhs,
          right: rhs,
        },
        `${JSON.stringify(lhs.value)}||${JSON.stringify(rhs.value)}`,
      )
      t.end()
    })
  }
}

const BaseExprNodes: (FilterNode | MapNode | FlatMapNode | ProjectionNode)[] = [
  {
    type: 'Filter',
    base: {type: 'Value', value: null},
    expr: {type: 'Value', value: null},
  },
  {
    type: 'Map',
    base: {type: 'Value', value: null},
    expr: {type: 'Value', value: null},
  },
  {
    type: 'FlatMap',
    base: {type: 'Value', value: null},
    expr: {type: 'Value', value: null},
  },
  {
    type: 'Projection',
    base: {type: 'Value', value: null},
    expr: {type: 'Value', value: null},
  },
]

for (const node of BaseExprNodes) {
  for (const lhs of VALUES) {
    for (const rhs of VALUES) {
      t.test(`baseexpr nodes(${node.type}): ${lhs.value}&&${rhs.value}`, (t) => {
        const ast = {
          ...node,
          expr: {
            type: 'And',
            left: lhs,
            right: rhs,
          },
        } as const
        const query = builder(ast)
        const parsed = parse(query)
        t.ok(isEqual(ast, parsed))

        t.end()
      })
    }
  }
}
