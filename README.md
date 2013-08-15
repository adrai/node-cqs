# Introduction

[![Build Status](https://secure.travis-ci.org/adrai/node-cqs.png)](http://travis-ci.org/adrai/node-cqs)

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
        denormalizersPath: __dirname + '/eventDenormalizers',
        extendersPath: __dirname + '/eventExtenders',
        forcedQueuing: false
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

        events: ['dummied', {'dummyCreated': 'create'}, {'dummyChanged': 'update'}, {'dummyDeleted': 'delete'}],
        collectionName: 'dummies',

        dummied: function(evt, aux, callback) {
            callback(null);
        }

    });

See [tests](https://github.com/adrai/node-cqs/tree/master/test) for detailed information...

# Release Notes

## v0.4.2

- strip .js file extensions to enable loading of .coffee scripts too

## v0.4.1

- added forcedQueuing flag

## v0.4.0

- asynchronous api for saga

## v0.3.7

- optimized performance a little

## v0.3.6

- fixed saga handler base


# License

Copyright (c) 2013 Adriano Raiano

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