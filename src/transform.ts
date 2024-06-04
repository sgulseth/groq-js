import type {ExprNode} from './nodeTypes'

// eslint-disable-next-line complexity
export function transform(node: ExprNode, fn: (node: ExprNode) => ExprNode): ExprNode {
  switch (node.type) {
    case 'And':
    case 'Or': {
      return fn({
        type: node.type,
        left: transform(node.left, fn),
        right: transform(node.right, fn),
      })
    }
    case 'InRange': {
      return fn({
        type: 'InRange',
        base: transform(node.base, fn),
        left: transform(node.left, fn),
        right: transform(node.right, fn),
        isInclusive: node.isInclusive,
      })
    }
    case 'Slice': {
      return fn({
        type: 'Slice',
        base: transform(node.base, fn),
        left: node.left,
        right: node.right,
        isInclusive: node.isInclusive,
      })
    }
    case 'Neg': {
      return fn({
        type: 'Neg',
        base: transform(node.base, fn),
      })
    }
    case 'Pos': {
      return fn({
        type: 'Pos',
        base: transform(node.base, fn),
      })
    }

    case 'PipeFuncCall': {
      return fn({
        type: 'PipeFuncCall',
        func: node.func,
        name: node.name,
        base: transform(node.base, fn),
        args: node.args.map((arg) => transform(arg, fn)),
      })
    }

    case 'Select': {
      return fn({
        type: 'Select',
        alternatives: node.alternatives.map((alt) => ({
          type: 'SelectAlternative',
          condition: transform(alt.condition, fn),
          value: transform(alt.value, fn),
        })),
        fallback: node.fallback ? transform(node.fallback, fn) : undefined,
      })
    }

    case 'OpCall': {
      return fn({
        type: 'OpCall',
        op: node.op,
        left: transform(node.left, fn),
        right: transform(node.right, fn),
      })
    }
    case 'Object': {
      return fn({
        type: 'Object',
        attributes: node.attributes.map((attr) => {
          if (attr.type === 'ObjectAttributeValue') {
            return {
              type: 'ObjectAttributeValue',
              name: attr.name,
              value: transform(attr.value, fn),
            }
          }
          if (attr.type === 'ObjectConditionalSplat') {
            return {
              type: 'ObjectConditionalSplat',
              condition: transform(attr.condition, fn),
              value: transform(attr.value, fn),
            }
          }
          if (attr.type === 'ObjectSplat') {
            return {
              type: 'ObjectSplat',
              value: transform(attr.value, fn),
            }
          }
          // @ts-expect-error - this should never happen
          throw new Error(`Unexpected attribute type: ${attr.type}`)
        }),
      })
    }
    case 'Not': {
      return fn({
        type: 'Not',
        base: transform(node.base, fn),
      })
    }
    case 'Group': {
      return fn({
        type: 'Group',
        base: transform(node.base, fn),
      })
    }
    case 'FuncCall': {
      return fn({
        type: 'FuncCall',
        func: node.func,
        namespace: node.namespace,
        name: node.name,
        args: node.args.map((arg) => transform(arg, fn)),
      })
    }
    case 'Projection':
    case 'Map':
    case 'FlatMap':
    case 'Filter': {
      return fn({
        type: node.type,
        base: transform(node.base, fn),
        expr: transform(node.expr, fn),
      })
    }
    case 'Deref': {
      return fn({
        type: 'Deref',
        base: transform(node.base, fn),
      })
    }
    case 'Value':
    case 'Selector':
    case 'Parent':
    case 'Parameter':
    case 'Everything':
    case 'This':
    case 'Context': {
      return fn(node)
    }
    case 'Desc':
    case 'Asc': {
      return fn({
        type: node.type,
        base: transform(node.base, fn),
      })
    }
    case 'ArrayCoerce': {
      return fn({
        type: 'ArrayCoerce',
        base: transform(node.base, fn),
      })
    }
    case 'Array': {
      return fn({
        type: 'Array',
        elements: node.elements.map((element) => ({
          type: 'ArrayElement',
          value: transform(element.value, fn),
          isSplat: element.isSplat,
        })),
      })
    }
    case 'Tuple': {
      return fn({
        type: 'Tuple',
        members: node.members.map((value) => transform(value, fn)),
      })
    }
    case 'AccessElement': {
      return fn({
        type: 'AccessElement',
        base: transform(node.base, fn),
        index: node.index,
      })
    }
    case 'AccessAttribute': {
      if (node.base) {
        return fn({
          name: node.name,
          type: node.type,
          base: transform(node.base, fn),
        })
      }
      return fn(node)
    }
    default:
      // @ts-expect-error - this should never happen
      throw new Error(`Unexpected node type: ${node.type}`)
  }
}
