import type {ExprNode} from './nodeTypes'

export type BuilderOptions = {
  whitespace?: boolean
}

// eslint-disable-next-line complexity, max-statements
export function isEqual(lhs: ExprNode, rhs: ExprNode): boolean {
  if (lhs.type !== rhs.type) {
    return false
  }

  if (lhs.type === 'And' && rhs.type === 'And') {
    return isEqual(lhs.left, rhs.left) && isEqual(lhs.right, rhs.right)
  }
  if (lhs.type === 'Or' && rhs.type === 'Or') {
    return isEqual(lhs.left, rhs.left) && isEqual(lhs.right, rhs.right)
  }
  if (lhs.type === 'InRange' && rhs.type === 'InRange') {
    return (
      isEqual(lhs.left, rhs.left) &&
      isEqual(lhs.right, rhs.right) &&
      lhs.isInclusive === rhs.isInclusive
    )
  }

  if (lhs.type === 'Slice' && rhs.type === 'Slice') {
    return (
      isEqual(lhs.base, rhs.base) &&
      lhs.left === rhs.left &&
      lhs.right === rhs.right &&
      lhs.isInclusive === rhs.isInclusive
    )
  }
  if (
    (lhs.type === 'Neg' && rhs.type === 'Neg') ||
    (lhs.type === 'Pos' && rhs.type === 'Pos') ||
    (lhs.type === 'Group' && rhs.type === 'Group') ||
    (lhs.type === 'Deref' && rhs.type === 'Deref') ||
    (lhs.type === 'Not' && rhs.type === 'Not') ||
    (lhs.type === 'ArrayCoerce' && rhs.type === 'ArrayCoerce') ||
    (lhs.type === 'Desc' && rhs.type === 'Desc') ||
    (lhs.type === 'Asc' && rhs.type === 'Asc')
  ) {
    return isEqual(lhs.base, rhs.base)
  }
  if (lhs.type === 'PipeFuncCall' && rhs.type === 'PipeFuncCall') {
    return (
      lhs.name === rhs.name &&
      isEqual(lhs.base, rhs.base) &&
      lhs.args.length === rhs.args.length &&
      lhs.args.every((arg, index) => isEqual(arg, rhs.args[index]))
    )
  }
  if (lhs.type === 'Select' && rhs.type === 'Select') {
    return (
      lhs.alternatives.length === rhs.alternatives.length &&
      lhs.alternatives.every((alt, index) => {
        const rhsAlt = rhs.alternatives[index]
        return isEqual(alt.condition, rhsAlt.condition) && isEqual(alt.value, rhsAlt.value)
      })
    )
  }
  if (lhs.type === 'OpCall' && rhs.type === 'OpCall') {
    return lhs.op === rhs.op && isEqual(lhs.left, rhs.left) && isEqual(lhs.right, rhs.right)
  }
  if (lhs.type === 'Object' && rhs.type === 'Object') {
    return (
      lhs.attributes.length === rhs.attributes.length &&
      lhs.attributes.every((attr, index) => {
        const rhsAttr = rhs.attributes[index]
        if (attr.type === 'ObjectAttributeValue' && rhsAttr.type === 'ObjectAttributeValue') {
          return attr.name === rhsAttr.name && isEqual(attr.value, rhsAttr.value)
        }
        if (attr.type === 'ObjectConditionalSplat' && rhsAttr.type === 'ObjectConditionalSplat') {
          return isEqual(attr.condition, rhsAttr.condition) && isEqual(attr.value, rhsAttr.value)
        }
        if (attr.type === 'ObjectSplat' && rhsAttr.type === 'ObjectSplat') {
          return isEqual(attr.value, rhsAttr.value)
        }
        return false
      })
    )
  }

  if (lhs.type === 'Value' && rhs.type === 'Value') {
    return lhs.value === rhs.value
  }
  if (lhs.type === 'Parameter' && rhs.type === 'Parameter') {
    return lhs.name === rhs.name
  }

  if (lhs.type === 'FuncCall' && rhs.type === 'FuncCall') {
    return (
      lhs.name === rhs.name &&
      lhs.namespace === rhs.namespace &&
      lhs.args.length === rhs.args.length &&
      lhs.args.every((arg, index) => isEqual(arg, rhs.args[index]))
    )
  }
  if (
    (lhs.type === 'Projection' && rhs.type === 'Projection') ||
    (lhs.type === 'Map' && rhs.type === 'Map') ||
    (lhs.type === 'FlatMap' && rhs.type === 'FlatMap') ||
    (lhs.type === 'Filter' && rhs.type === 'Filter')
  ) {
    return isEqual(lhs.base, rhs.base) && isEqual(lhs.expr, rhs.expr)
  }
  if (lhs.type === 'Parent' && rhs.type === 'Parent') {
    return lhs.n === rhs.n
  }

  if (lhs.type === 'Context' && rhs.type === 'Context') {
    return lhs.key === rhs.key
  }

  if (
    (lhs.type === 'Everything' && rhs.type === 'Everything') ||
    (lhs.type === 'This' && rhs.type === 'This')
  ) {
    return true
  }

  if (lhs.type === 'Array' && rhs.type === 'Array') {
    return (
      lhs.elements.length === rhs.elements.length &&
      lhs.elements.every((element, index) => {
        const rhsElement = rhs.elements[index]
        return element.isSplat === rhsElement.isSplat && isEqual(element.value, rhsElement.value)
      })
    )
  }

  if (lhs.type === 'Tuple' && rhs.type === 'Tuple') {
    return (
      lhs.members.length === rhs.members.length &&
      lhs.members.every((member, index) => isEqual(member, rhs.members[index]))
    )
  }

  if (lhs.type === 'AccessElement' && rhs.type === 'AccessElement') {
    return isEqual(lhs.base, rhs.base) && lhs.index === rhs.index
  }

  if (lhs.type === 'AccessAttribute' && rhs.type === 'AccessAttribute') {
    if (lhs.base === undefined && rhs.base === undefined) {
      return lhs.name === rhs.name
    }
    if (lhs.base !== undefined && rhs.base !== undefined) {
      return lhs.name === rhs.name && isEqual(lhs.base, rhs.base)
    }

    return false
  }

  return false
}
