# Introduction

[![travis](https://img.shields.io/travis/adrai/node-cqs.svg)](https://travis-ci.org/adrai/node-cqs) [![npm](https://img.shields.io/npm/v/node-cqs.svg)](https://npmjs.org/package/node-cqs)

Node-cqs is a node.js module that implements the cqrs pattern without eventsourcing.
It can be very useful as domain and eventdenormalizer component if you work with (d)ddd, cqrs, host, etc.

# Installation

    $ npm install node-cqs

# Usage

## Initialization

	var cqs = require('node-cqs').cqs;

	cqs.on('event', function(evt) {
        // send to clients
    });
    cqs.initialize({
        commandHandlersPath: __dirname + '/commandHandlers',
        aggregatesPath: __dirname + '/aggregates',
        sagaHandlersPath: __dirname + '/sagaHandlers',
        sagasPath: __dirname + '/sagas',
        viewBuildersPath: __dirname + '/viewBuilders',
        extendersPath: __dirname + '/eventExtenders',
        disableQueuing: false
    }, function(err) {

    });

    cqs.handle({ id: 'msgId', command: 'changeDummy', payload: { id: '23445' } }, function(err) {

    });

## Define aggregates...

    var base = require('node-cqs').aggregateBase;

    module.exports = base.extend({

        changeDummy: function(data, callback) {
            this.apply(this.toEvent('dummyChanged', data));

            this.checkBusinessRules(callback);
        },

        destroyDummy: function(data, callback) {
            this.apply(this.toEvent('dummyDestroyed', data));

            this.checkBusinessRules(callback);
        },

        cancelDummy: function(data, callback) {
            this.apply(this.toEvent('dummyCancelled', data));

            this.checkBusinessRules(callback);
        },

        dummyChanged: function(data) {
            this.set(data);
        },

        dummyCancelled: function(data) {
            this.set('cancelled', true);
        },

        dummyDestroyed: function(data) {
            this.set('destroyed', true);
        }

    });

## Define eventdenormalizers...

    var base = require('node-cqs').eventDenormalizerBase;

    module.exports = base.extend({

        events: [
            'dummied',
            {
                event: 'dummyCreated',
                method: 'create',
                viewModelId: 'payload.id'
            },
            {
                event: 'dummyChanged',
                method: 'update',
                payload: 'payload'
            },
            {
                event: 'dummyDeleted',
                method: 'delete'
            },
            'dummySpezi',
            'somethingFlushed'
        ],

        collectionName: 'dummies',

        dummied: function(data, vm, evt) {
        },

        dummySpezi: function(data, vm, evt) {
            vm.otherValue = 'value';
        },

        somethingFlushed: function(data, vm, evt) {
        }

    });

See [tests](https://github.com/adrai/node-cqs/tree/master/test) for detailed information...

[Release notes](https://github.com/adrai/node-cqs/blob/master/releasenotes.md)

# License

Copyright (c) 2014 Adriano Raiano

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
