'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var jestMatcherUtils = require('jest-matcher-utils');
var utilities = require('./utilities.js');

function toContainRemoteComponent(node, type, props) {
  utilities.assertIsNode(node, {
    expectation: 'toContainRemoteComponent',
    isNot: this.isNot
  });
  utilities.assertIsType(type, {
    expectation: 'toContainRemoteComponent',
    isNot: this.isNot
  });
  const foundByType = node.findAll(type);
  const foundByProps = props == null ? foundByType : foundByType.filter(element => Object.keys(props).every(key => this.equals(props[key], element.props[key])));
  const pass = foundByProps.length > 0;
  const message = pass ? () => `${jestMatcherUtils.matcherHint('.not.toContainRemoteComponent')}\n\n` + `Expected the React element:\n  ${jestMatcherUtils.RECEIVED_COLOR(node.toString())}\n` + `Not to contain component:\n  ${jestMatcherUtils.EXPECTED_COLOR(utilities.printType(type))}\n${props ? `With props matching:\n  ${jestMatcherUtils.printExpected(props)}\n` : ''}` + `But ${foundByProps.length} matching ${utilities.printType(type)} ${foundByProps.length === 1 ? 'elements were' : 'element was'} found.\n` : () => `${`${jestMatcherUtils.matcherHint('.toContainRemoteComponent')}\n\n` + `Expected the React element:\n  ${jestMatcherUtils.RECEIVED_COLOR(node.toString())}\n` + `To contain component:\n  ${jestMatcherUtils.EXPECTED_COLOR(utilities.printType(type))}\n${props ? `With props matching:\n  ${jestMatcherUtils.printExpected(props)}\n` : ''}`}${foundByType.length === 0 ? `But no matching ${utilities.printType(type)} elements were found.\n` : `But the ${foundByType.length === 1 ? 'found element has' : 'found elements have'} the following prop differences:\n\n${utilities.diffs(foundByType, props, this.expand)}`}`;
  return {
    pass,
    message
  };
}
function toContainRemoteComponentTimes(node, type, times, props) {
  utilities.assertIsNode(node, {
    expectation: 'toContainRemoteComponentTimes',
    isNot: this.isNot
  });
  utilities.assertIsType(type, {
    expectation: 'toContainRemoteComponent',
    isNot: this.isNot
  });
  const foundByType = node.findAll(type);
  const foundByProps = props == null ? foundByType : foundByType.filter(element => Object.keys(props).every(key => this.equals(props[key], element.props[key])));
  const pass = foundByProps.length === times;
  const message = pass ? () => [`${jestMatcherUtils.matcherHint('.not.toContainRemoteComponentTimes')}\n`, `Expected the React element:\n  ${jestMatcherUtils.RECEIVED_COLOR(node.toString())}`, `Not to contain component:\n  ${jestMatcherUtils.EXPECTED_COLOR(utilities.printType(type))}`, `${times} ${utilities.pluralize('time', times)}, but it did.`].join('\n') : () => [`${jestMatcherUtils.matcherHint('.toContainRemoteComponentTimes')}\n`, `Expected the React element:\n  ${jestMatcherUtils.RECEIVED_COLOR(node.toString())}`, `To contain component:\n  ${jestMatcherUtils.EXPECTED_COLOR(utilities.printType(type))}`, `${times} ${utilities.pluralize('time', times)}, but it was found ${foundByProps.length}.`].join('\n');
  return {
    pass,
    message
  };
}

exports.toContainRemoteComponent = toContainRemoteComponent;
exports.toContainRemoteComponentTimes = toContainRemoteComponentTimes;
