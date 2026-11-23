import {test} from 'node:test';
import assert from 'node:assert/strict';
import {sum} from './sum.js';
test('sums positive and negative values',()=>assert.equal(sum([3,-1,2]),4));
test('empty input returns zero',()=>assert.equal(sum([]),0));
