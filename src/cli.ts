#!/usr/bin/env node

import {run} from '@oclif/command';
import flush from '@oclif/command/flush';
import {handle} from '@oclif/errors';

run().then(flush, handle);
