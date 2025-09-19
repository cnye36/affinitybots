'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var jestMatcherUtils = require('jest-matcher-utils');
var mount = require('../mount.js');

function assertIsNode(node, {
  expectation,
  isNot
}) {
  if (node == null) {
    throw new Error(jestMatcherUtils.matcherErrorMessage(jestMatcherUtils.matcherHint(`.${expectation}`, undefined, undefined, {
      isNot
    }), `${jestMatcherUtils.RECEIVED_COLOR('received')} value must be an @shopify/react-testing Root or Element object`, `Received ${jestMatcherUtils.RECEIVED_COLOR('null')}.\nThis usually means that your \`.findX\` method failed to find any matching elements.`));
  }

  if (Array.isArray(node) && node.length > 1 && mount.isNode(node[0])) {
    throw new Error(jestMatcherUtils.matcherErrorMessage(jestMatcherUtils.matcherHint(`.${expectation}`, undefined, undefined, {
      isNot
    }), `${jestMatcherUtils.RECEIVED_COLOR('received')} value must be an @shopify/react-testing Root or Element object`, `Received an ${jestMatcherUtils.RECEIVED_COLOR('array of Root or Element objects')}.\nThis usually means that you passed in the result of \`.findAllX\`. Pass the result of \`.findX\` instead.`));
  }

  if (!mount.isNode(node)) {
    throw new Error(jestMatcherUtils.matcherErrorMessage(jestMatcherUtils.matcherHint(`.${expectation}`, undefined, undefined, {
      isNot
    }), `${jestMatcherUtils.RECEIVED_COLOR('received')} value must be an @shopify/react-testing Root or Element object`, jestMatcherUtils.printWithType('Received', node, jestMatcherUtils.printReceived)));
  }
}
function assertIsType(type, {
  expectation,
  isNot
}) {
  if (type == null) {
    throw new Error(jestMatcherUtils.matcherErrorMessage(jestMatcherUtils.matcherHint(`.${expectation}`, undefined, undefined, {
      isNot
    }), `${jestMatcherUtils.RECEIVED_COLOR('expected')} value must be a string or a valid React component.`, jestMatcherUtils.printWithType('Expected', type, jestMatcherUtils.printExpected)));
  }
}
function diffs(element, props, expand) {
  return element.reduce((diffs, element, index) => {
    const separator = index === 0 ? '' : '\n\n';
    return `${diffs}${separator}${normalizedDiff(element, props, {
      expand,
      showLegend: index === 0
    })}`;
  }, '');
}

function normalizedDiff(element, props, {
  expand = false,
  showLegend = false
}) {
  const result = diffPropsForNode(element, props, {
    expand
  }) || '';
  return showLegend ? result : result.split('\n\n')[1];
}

function printType(type) {
  if (typeof type === 'object' && '_context' in type) {
    const context = type._context;
    const componentName = type === context.Provider ? 'Provider' : 'Consumer';
    const displayName = context.displayName || 'Context';
    return `<${displayName}.${componentName} />`;
  }

  const displayName = typeof type === 'string' ? type : type.displayName || type.name || 'Component';
  return `<${displayName} />`;
}
function diffPropsForNode(node, props, {
  expand = false
}) {
  return jestMatcherUtils.diff(props, getObjectSubset(node.props, props), {
    expand
  });
} // Original from https://github.com/facebook/jest/blob/master/packages/expect/src/utils.ts#L107

function getObjectSubset(object, subset) {
  if (Array.isArray(object)) {
    if (Array.isArray(subset) && subset.length === object.length) {
      return subset.map((sub, i) => getObjectSubset(object[i], sub));
    }
  } else if (object instanceof Date) {
    return object;
  } else if (typeof object === 'object' && object !== null && typeof subset === 'object' && subset !== null) {
    const trimmed = {};
    Object.keys(subset).filter(key => Reflect.has(object, key)).forEach(key => trimmed[key] = getObjectSubset(object[key], subset[key]));

    if (Object.keys(trimmed).length > 0) {
      return trimmed;
    }
  }

  return object;
}

function pluralize(word, count) {
  return count === 1 ? word : `${word}s`;
}
function printReceivedWithHighlight(text, start, length) {
  return jestMatcherUtils.RECEIVED_COLOR(`"${text.slice(0, start)}${jestMatcherUtils.INVERTED_COLOR(text.slice(start, start + length))}${text.slice(start + length)}"`);
}

exports.assertIsNode = assertIsNode;
exports.assertIsType = assertIsType;
exports.diffPropsForNode = diffPropsForNode;
exports.diffs = diffs;
exports.pluralize = pluralize;
exports.printReceivedWithHighlight = printReceivedWithHighlight;
exports.printType = printType;
