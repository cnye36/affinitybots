'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var jestMatcherUtils = require('jest-matcher-utils');
var utilities = require('./utilities.js');

function toHaveRemoteProps(node, props) {
  utilities.assertIsNode(node, {
    expectation: 'toHaveRemoteProps',
    isNot: this.isNot
  });

  if (props == null || typeof props !== 'object') {
    return {
      pass: false,
      message: () => `You passed ${props == null ? String(props) : `a ${typeof props}`} as props, but it must be an object.`
    };
  }

  const pass = Object.keys(props).every(key => this.equals(props[key], node.props[key]));
  const message = pass ? () => `${jestMatcherUtils.matcherHint('.not.toHaveRemoteProps', node.toString())}\n\n` + `Expected the React element:\n  ${jestMatcherUtils.RECEIVED_COLOR(node.toString())}\n` + `Not to have props:\n  ${jestMatcherUtils.printExpected(props)}\n` + `Received:\n  ${jestMatcherUtils.printReceived(node.props)}\n` : () => {
    const diffString = utilities.diffPropsForNode(node, props, {
      expand: this.expand
    });
    return `${jestMatcherUtils.matcherHint('.toHaveRemoteProps', node.toString())}\n\n` + `Expected the React element:\n  ${jestMatcherUtils.RECEIVED_COLOR(node.toString())}\n` + `To have props:\n  ${jestMatcherUtils.printExpected(props)}\n` + `Received:\n  ${jestMatcherUtils.printReceived(node.props)}\n${diffString ? `Difference:\n${diffString}\n` : ''}`;
  };
  return {
    pass,
    message
  };
}

exports.toHaveRemoteProps = toHaveRemoteProps;
