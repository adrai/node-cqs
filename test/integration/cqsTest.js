var expect = require('expect.js')
  , cqs = require('../../index').cqs;

describe('CQS', function() {

    describe('noting a command', function() {

        var dummyEmitter = new (require('events').EventEmitter)();

        before(function(done) {

            cqs.on('event', function(evt) {
                dummyEmitter.emit('published', evt);
            });
            cqs.initialize({
                commandHandlersPath: __dirname + '/commandHandlers',
                aggregatesPath: __dirname + '/aggregates',
                sagaHandlersPath: __dirname + '/sagaHandlers',
                sagasPath: __dirname + '/sagas',
                denormalizersPath: __dirname + '/eventDenormalizers',
                extendersPath: __dirname + '/eventExtenders'
            }, done);

        });

        it('it should acknowledge the command', function(done) {

            var cmd = {
                command: 'foobar',
                id: '82517'
            };
            cqs.handle(cmd, function(err) {
                expect(err).not.to.be.ok();
                done();
            });

        });

        it('it should publish an event', function(done) {

            var cmd = {
                command: 'changeDummy',
                id: '82517'
            };

            dummyEmitter.once('published', function(evt) {
                expect(evt.event).to.eql('dummyChanged');
                expect(evt.commandId).to.eql(cmd.id);
                done();
            });

            cqs.handle(cmd, function(err) {});

        });
            
    });

});