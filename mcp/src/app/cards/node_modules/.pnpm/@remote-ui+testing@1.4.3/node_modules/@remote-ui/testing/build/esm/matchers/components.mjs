import { matcherHint, RECEIVED_COLOR, EXPECTED_COLOR, printExpected } from 'jest-matcher-utils';
import { assertIsNode, assertIsType, printType, diffs, pluralize } from './utilities.mjs';

function toContainRemoteComponent(node, type, props) {
  assertIsNode(node, {
    expectation: 'toContainRemoteComponent',
    isNot: this.isNot
  });
  assertIsType(type, {
    expectation: 'toContainRemoteComponent',
    isNot: this.isNot
  });
  const foundByType = node.findAll(type);
  const foundByProps = props == null ? foundByType : foundByType.filter(element => Object.keys(props).every(key => this.equals(props[key], element.props[key])));
  const pass = foundByProps.length > 0;
  const message = pass ? () => `${matcherHint('.not.toContainRemoteComponent')}\n\n` + `Expected the React element:\n  ${RECEIVED_COLOR(node.toString())}\n` + `Not to contain component:\n  ${EXPECTED_COLOR(printType(type))}\n${props ? `With props matching:\n  ${printExpected(props)}\n` : ''}` + `But ${foundByProps.length} matching ${printType(type)} ${foundByProps.length === 1 ? 'elements were' : 'element was'} found.\n` : () => `${`${matcherHint('.toContainRemoteComponent')}\n\n` + `Expected the React element:\n  ${RECEIVED_COLOR(node.toString())}\n` + `To contain component:\n  ${EXPECTED_COLOR(printType(type))}\n${props ? `With props matching:\n  ${printExpected(props)}\n` : ''}`}${foundByType.length === 0 ? `But no matching ${printType(type)} elements were found.\n` : `But the ${foundByType.length === 1 ? 'found element has' : 'found elements have'} the following prop differences:\n\n${diffs(foundByType, props, this.expand)}`}`;
  return {
    pass,
    message
  };
}
function toContainRemoteComponentTimes(node, type, times, props) {
  assertIsNode(node, {
    expectation: 'toContainRemoteComponentTimes',
    isNot: this.isNot
  });
  assertIsType(type, {
    expectation: 'toContainRemoteComponent',
    isNot: this.isNot
  });
  const foundByType = node.findAll(type);
  const foundByProps = props == null ? foundByType : foundByType.filter(element => Object.keys(props).every(key => this.equals(props[key], element.props[key])));
  const pass = foundByProps.length === times;
  const message = pass ? () => [`${matcherHint('.not.toContainRemoteComponentTimes')}\n`, `Expected the React element:\n  ${RECEIVED_COLOR(node.toString())}`, `Not to contain component:\n  ${EXPECTED_COLOR(printType(type))}`, `${times} ${pluralize('time', times)}, but it did.`].join('\n') : () => [`${matcherHint('.toContainRemoteComponentTimes')}\n`, `Expected the React element:\n  ${RECEIVED_COLOR(node.toString())}`, `To contain component:\n  ${EXPECTED_COLOR(printType(type))}`, `${times} ${pluralize('time', times)}, but it was found ${foundByProps.length}.`].join('\n');
  return {
    pass,
    message
  };
}

export { toContainRemoteComponent, toContainRemoteComponentTimes };
