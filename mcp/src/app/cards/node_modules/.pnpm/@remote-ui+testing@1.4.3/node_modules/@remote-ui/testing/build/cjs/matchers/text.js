'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var jestMatcherUtils = require('jest-matcher-utils');
var utilities = require('./utilities.js');

function toContainRemoteText(node, text) {
  utilities.assertIsNode(node, {
    expectation: 'toContainRemoteText',
    isNot: this.isNot
  });
  const nodeText = node.text;
  const matchIndex = nodeText.indexOf(text);
  const pass = matchIndex >= 0;
  const message = pass ? () => `${jestMatcherUtils.matcherHint('.not.toContainRemoteText', node.toString())}\n\n` + `Expected the React element:\n  ${jestMatcherUtils.RECEIVED_COLOR(node.toString())}\n` + `Not to contain text:\n  ${jestMatcherUtils.printExpected(text)}\n` + `But it did:\n  ${utilities.printReceivedWithHighlight(nodeText, matchIndex, text.length)}\n` : () => `${jestMatcherUtils.matcherHint('.not.toContainRemoteText', node.toString())}\n\n` + `Expected the React element:\n  ${jestMatcherUtils.RECEIVED_COLOR(node.toString())}\n` + `With text content:\n  ${jestMatcherUtils.printReceived(nodeText)}\n` + `To contain string:\n  ${jestMatcherUtils.printExpected(text)}\n`;
  return {
    pass,
    message
  };
}

exports.toContainRemoteText = toContainRemoteText;
