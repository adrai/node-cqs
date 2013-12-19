var eventEmitter = require('../eventEmitter'),
    async = require('async'),
    _ = require('lodash'),
    util = require('util'),
    EventEmitter2 = require('eventemitter2').EventEmitter2;

var CommandHandler = function() {
  EventEmitter2.call(this, {
    wildcard: true,
    delimiter: ':',
    maxListeners: 1000 // default would be 10!
  });

  this.buffered = {};
};

util.inherits(CommandHandler, EventEmitter2);

_.extend(CommandHandler.prototype, {

    defaultHandle: function(id, cmd) {

        var self = this;

        async.waterfall([

            // load aggregate
            function(callback) {
                self.loadAggregate(id, callback);
            },

            // reject command if aggregate has already been destroyed
            function(aggregate, vm, callback) {
                if(aggregate.get('destroyed')) {
                    return callback('Aggregate has already been destroyed!');
                }
                
                callback(null, aggregate, vm);
            },

            // check revision
            function(aggregate, vm, callback) {
                self.checkRevision(cmd, aggregate.get('revision'), function(err) {
                    callback(err, aggregate, vm);
                });
            },

            // call validate command
            function(aggregate, vm, callback) {
                self.validate(cmd.command, cmd.payload, function(err) {
                    callback(err, aggregate, vm);
                });
            },

            // call command function on aggregate
            function(aggregate, vm, callback) {
                aggregate[cmd.command](cmd.payload, function(err) {
                    callback(err, aggregate, vm);
                });
            },

            // commit the new events
            function(aggregate, vm, callback) {
                vm.set(aggregate.toJSON());
                self.commit(vm, function(err) {
                    callback(err, aggregate, cmd);
                });
            },

            // publish events
            function(aggregate, cmd, callback) {
                self.publish(aggregate.events, cmd, callback);
            }
        ],

        // finally publish commandRejected event on error
        function(err) {
            self.finish(id, cmd, err);
        });

    },

    finish: function(id, cmd, err) {
        if (err) {
            eventEmitter.emit('commandRejected', cmd, err);
        }
        eventEmitter.emit('handled:' + cmd.command, id, cmd);
        this.emit('handled:' + id + ':' + cmd.id, id, cmd);
    },

    publish: function(evts, cmd, callback) {
        var self = this;
        async.concat(evts, function(evt, next) {
            evt.commandId = cmd.id;
            if (cmd.head) {
                evt.head = _.extend(_.clone(cmd.head), evt.head);
            }

            self.getNewId(function(err, id) {
                evt.id = id;
                self.publisher.publish(evt);
                next(err);
            });
        },
        // final
        callback);
    },

    commit: function(vm, callback) {
        var self = this;
        callback = callback || function(err) {};
        self.repository.commit(vm, callback);
    },

    validate: function(ruleName, data, callback) {
        if(this.validationRules && this.validationRules[ruleName]) {
            this.validationRules[ruleName].validate(data, callback);
        } else {
            callback(null);
        }
    },

    handle: function(id, cmd) {
        var self = this;

        this.buffered[id] = this.buffered[id] || [];
        this.buffered[id].push({ id: id, cmd: cmd });

        this.on('handled:' + id + ':' + cmd.id, function(id, cmd) {
          self.buffered[id] = _.reject(self.buffered[id], function(entry) {
            return entry.id === id && entry.cmd === cmd;
          });

          if (self.buffered[id].length > 0) {
            var nextCmd = self.buffered[id][0];
            if (self[nextCmd.cmd.command]) {
              self[nextCmd.cmd.command](nextCmd.id, nextCmd.cmd);
            } else {
              self.defaultHandle(nextCmd.id, nextCmd.cmd);
            }
          }
        });
            
        if (this.buffered[id].length === 1) {
          if (this[cmd.command]) {
            this[cmd.command](id, cmd);
          } else {
            this.defaultHandle(id, cmd);
          }
        }
    },

    loadAggregate: function(id, callback) {
        var aggregate = new this.Aggregate(id);
        this.repository.get(id, function(err, vm) {
            aggregate.load(vm);
            callback(err, aggregate, vm);
        });
    },

    checkRevision: function(cmd, aggRev, callback) {
        if(!cmd.head || cmd.head.revision === undefined ||
            (cmd.head && cmd.head.revision === aggRev)) {
            return callback(null);
        }

        callback('Concurrency exception. Actual ' +
            cmd.head.revision + ' expected ' + aggRev);
    },

    getNewId: function(callback) {
        this.repository.getNewId(callback);
    },

    configure: function(fn) {
        fn.call(this);
        return this;
    },

    use: function(module) {
        if (!module) return;
    
        if (module.commit) {
            this.repository = module;
        }

        if (module.publish) {
            this.publisher = module;
        }
    }

});

module.exports = {

    extend: function(obj) {
        return _.extend(new CommandHandler(), obj);
    }

};