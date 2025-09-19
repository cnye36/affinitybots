'use strict';

var props = require('./props.js');
var components = require('./components.js');
var text = require('./text.js');

expect.extend({
  toHaveRemoteProps: props.toHaveRemoteProps,
  toContainRemoteComponent: components.toContainRemoteComponent,
  toContainRemoteComponentTimes: components.toContainRemoteComponentTimes,
  toContainRemoteText: text.toContainRemoteText
});
