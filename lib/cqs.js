var domain = require('./domain/domain')
  , contextEventDenormalizer = require('cqrs-eventdenormalizer').contextEventDenormalizer
  , _ = require('lodash')
  , async = require('async')
  , EventEmitter2 = require('eventemitter2').EventEmitter2
  , cqs;

module.exports = cqs = _.extend(new EventEmitter2({
        wildcard: true,
        delimiter: ':',
        maxListeners: 1000 // default would be 10!
    }), {

    initialize: function(options, newGetCommandId, callback) {

        if (arguments.length === 1) {
            callback = options;
        } else if (arguments.length === 2) {
            callback = newGetCommandId;
            newGetCommandId = null;
        }

        var defaults = {
            publishingInterval: 200,
            commandQueue: { type: 'inMemory', collectionName: 'commands' },
            eventQueue: { type: 'inMemory', collectionName: 'events' },
            forcedQueuing: false
        };

        _.defaults(options, defaults);

        domain.on('event', function(evt) {
            contextEventDenormalizer.denormalize(evt);
        });

        contextEventDenormalizer.on('event', function(evt) {
            cqs.emit('event', evt);
        });

        async.parallel({
            domain: function(callback) {
                domain.initialize(options, callback);
            },
            contextEventDenormalizer: function(callback) {
                contextEventDenormalizer.initialize(options, callback);
            }
        }, function(err, results) {
            callback(err);
        });
    },

    handle: function(cmd, callback) {
        domain.handle(cmd, callback);
    }

});