import { toHaveRemoteProps } from './props.mjs';
import { toContainRemoteComponent, toContainRemoteComponentTimes } from './components.mjs';
import { toContainRemoteText } from './text.mjs';

expect.extend({
  toHaveRemoteProps,
  toContainRemoteComponent,
  toContainRemoteComponentTimes,
  toContainRemoteText
});
