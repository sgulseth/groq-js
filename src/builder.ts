import type {ExprNode} from './nodeTypes'

export type BuilderOptions = {
  whitespace?: boolean
}

// eslint-disable-next-line complexity
export function builder(node: ExprNode, options?: BuilderOptions): string {
  const {whitespace = false} = options || {}
  const whitespaceChar = whitespace ? ' ' : ''
  const commaSeparator = `,${whitespaceChar}`
  const attributeSeparator = whitespace ? `,\n` : ','

  switch (node.type) {
    case 'And': {
      return [builder(node.left), '&&', builder(node.right)].join(whitespaceChar)
    }
    case 'Or': {
      return [builder(node.left), '||', builder(node.right)].join(whitespaceChar)
    }
    case 'InRange': {
      return [builder(node.left), node.isInclusive ? '..' : '...', builder(node.right)].join(
        whitespaceChar,
      )
    }
    case 'Slice': {
      return [
        builder(node.base),
        '[',
        node.left,
        node.isInclusive ? '..' : '...',
        node.right,
        ']',
      ].join(whitespaceChar)
    }
    case 'Neg': {
      return `-${builder(node.base)}`
    }
    case 'Pos': {
      return `+${builder(node.base)}`
    }

    case 'PipeFuncCall': {
      return [
        builder(node.base),
        '|',
        node.name,
        '(',
        node.args.map((arg) => builder(arg, options)).join(`,${whitespaceChar}`),
        ')',
      ].join(whitespaceChar)
    }

    case 'Select': {
      return `select(${node.alternatives
        .map((alt) =>
          [builder(alt.condition, options), `=>`, builder(alt.value, options)].join(whitespaceChar),
        )
        .join(commaSeparator)})`
    }

    case 'OpCall': {
      return [builder(node.left, options), node.op, builder(node.right, options)].join(
        whitespaceChar,
      )
    }
    case 'Object': {
      return `{${node.attributes
        .map((attr) => {
          if (attr.type === 'ObjectAttributeValue') {
            if (attr.value.type === 'AccessAttribute' && attr.name === attr.value.name) {
              return `${attr.name}`
            }
            if (
              attr.value.type === 'ArrayCoerce' &&
              attr.value.base.type === 'AccessAttribute' &&
              attr.name === attr.value.base.name
            ) {
              return `${attr.value.base.name}[]`
            }

            return `"${attr.name}":${builder(attr.value)}`
          }
          if (attr.type === 'ObjectConditionalSplat') {
            return [builder(attr.condition, options), `=>`, builder(attr.value, options)].join(
              whitespaceChar,
            )
          }
          if (attr.type === 'ObjectSplat') {
            return `...${builder(attr.value)}`
          }
          // @ts-expect-error - this should never happen
          throw new Error(`Unexpected attribute type: ${attr.type}`)
        })
        .join(attributeSeparator)}}`
    }
    case 'Not': {
      return `!${builder(node.base, options)}`
    }
    case 'Group': {
      return `(${builder(node.base, options)})`
    }
    case 'FuncCall': {
      return `${node.namespace && node.namespace !== 'global' ? `${node.namespace}::` : ''}${node.name}(${node.args.map((arg) => builder(arg, options)).join(',')})`
    }
    case 'Projection': {
      return [builder(node.base, options), builder(node.expr, options)].join(whitespaceChar)
    }
    case 'Map': {
      return [builder(node.base, options), builder(node.expr, options)].join(whitespaceChar)
    }
    case 'FlatMap': {
      return [builder(node.base, options), builder(node.expr, options)].join(whitespaceChar)
    }
    case 'Filter': {
      return `${builder(node.base, options)}[${builder(node.expr, options)}]`
    }
    case 'Deref': {
      return `${builder(node.base, options)}->`
    }
    case 'Value': {
      return JSON.stringify(node.value)
    }
    case 'Selector': {
      throw new Error('implement me')
    }
    case 'Parent': {
      return Array.from({length: node.n})
        .map(() => '^')
        .join('.')
    }
    case 'Parameter': {
      return `$${node.name}`
    }
    case 'Everything': {
      return '*'
    }
    case 'This': {
      return ''
    }
    case 'Context': {
      return `${node.key}()`
    }
    case 'Desc': {
      return `${builder(node.base, options)} desc`
    }
    case 'Asc': {
      return `${builder(node.base, options)} asc`
    }
    case 'ArrayCoerce': {
      return `${builder(node.base, options)}[]`
    }
    case 'Array': {
      return `[${node.elements
        .map((element) => {
          if (element.isSplat) {
            return `...${builder(element.value)}`
          }
          return builder(element.value)
        })
        .join(',')}]`
    }
    case 'Tuple': {
      return `${node.members.map((member) => builder(member, options)).join(',')}`
    }
    case 'AccessElement': {
      return `${builder(node.base, options)}[${node.index}]`
    }
    case 'AccessAttribute': {
      if (node.base) {
        return `${builder(node.base, options)}.${node.name}`
      }
      return `${node.name}`
    }
    default:
      // @ts-expect-error - this should never happen
      throw new Error(`Unexpected node type: ${node.type}`)
  }
}
