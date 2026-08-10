#!/usr/bin/env node

import { parseOptions } from '../src/cli/optionParser.js';

const options = parseOptions();
console.log('Parsed options:', options);