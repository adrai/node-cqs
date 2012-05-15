var _ = require('underscore')
  , eventEmitter = require('./eventEmitter');

var Queue = function(options) {
    this.queue = {};
};

Queue.prototype = {

    push: function(id, object) {
        if(!this.queue[id]) this.queue[id] = [];
        this.queue[id].push(object);
    },

    get: function(id) {
        return this.queue[id];
    },

    remove: function(id, object) {
        if (this.queue[id]) {
            this.queue[id].splice(_.indexOf(this.queue[id], object), 1);
        }
    },

    clear: function() {
        this.queue = {};
    }

};
module.exports = Queue;