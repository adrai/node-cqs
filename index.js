var index;

if (typeof module.exports !== 'undefined') {
    index = module.exports;
} else {
    index = root.index = {};
}

index.VERSION = '0.0.1';

index.cqs = require('./lib/cqs');
index.aggregateBase = require('./lib/domain/bases/aggregateBase');
index.commandHandlerBase = require('./lib/domain/bases/commandHandlerBase');
index.sagaBase = require('./lib/domain/bases/sagaBase');
index.sagaHandlerBase = require('./lib/domain/bases/sagaHandlerBase');
index.eventDenormalizerBase = require('node-cqrs-eventdenormalizer').eventDenormalizerBase;
index.eventExtenderBase = require('node-cqrs-eventdenormalizer').eventExtenderBase;