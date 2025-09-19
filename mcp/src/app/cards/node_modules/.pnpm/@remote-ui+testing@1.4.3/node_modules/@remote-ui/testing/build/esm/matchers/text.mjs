import { matcherHint, RECEIVED_COLOR, printExpected, printReceived } from 'jest-matcher-utils';
import { assertIsNode, printReceivedWithHighlight } from './utilities.mjs';

function toContainRemoteText(node, text) {
  assertIsNode(node, {
    expectation: 'toContainRemoteText',
    isNot: this.isNot
  });
  const nodeText = node.text;
  const matchIndex = nodeText.indexOf(text);
  const pass = matchIndex >= 0;
  const message = pass ? () => `${matcherHint('.not.toContainRemoteText', node.toString())}\n\n` + `Expected the React element:\n  ${RECEIVED_COLOR(node.toString())}\n` + `Not to contain text:\n  ${printExpected(text)}\n` + `But it did:\n  ${printReceivedWithHighlight(nodeText, matchIndex, text.length)}\n` : () => `${matcherHint('.not.toContainRemoteText', node.toString())}\n\n` + `Expected the React element:\n  ${RECEIVED_COLOR(node.toString())}\n` + `With text content:\n  ${printReceived(nodeText)}\n` + `To contain string:\n  ${printExpected(text)}\n`;
  return {
    pass,
    message
  };
}

export { toContainRemoteText };
