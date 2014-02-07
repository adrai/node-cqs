var expect = require('expect.js')
  , domain = require('../../lib/domain/domain');

describe('Domain', function() {

    describe('noting a command', function() {

        describe('having well-formed data', function() {
            
            describe('having any command handlers', function() {

                var dummyEmitter = new (require('events').EventEmitter)();

                before(function(done) {

                    domain.on('event', function(evt) {
                        dummyEmitter.emit('published', evt);
                    });
                    domain.initialize({
                        commandHandlersPath: __dirname + '/commandHandlers',
                        aggregatesPath: __dirname + '/aggregates',
                        sagaHandlersPath: __dirname + '/sagaHandlers',
                        sagasPath: __dirname + '/sagas',
                        disableQueuing: true
                    }, done);

                });

                describe('having bad data', function() {

                    it('it should acknowledge the command', function(done) {

                        var cmd = 'foobar';
                        domain.handle(cmd, function(err) {
                            expect(err).not.to.be.ok();
                            done();
                        });

                    });

                });

                describe('having a command thant no command handler listens to', function() {

                    it('it should acknowledge the command', function(done) {

                        var cmd = {
                            command: 'foobar',
                            id: '82517'
                        };
                        domain.handle(cmd, function(err) {
                            expect(err).not.to.be.ok();
                            done();
                        });

                    });

                });

                it('it should acknowledge the command', function(done) {

                    var cmd = {
                        command: 'foobar',
                        id: '82517'
                    };
                    domain.handle(cmd, function(err) {
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

                    domain.handle(cmd, function(err) {});

                });

                describe('when the underlying aggregate has been destroyed', function() {

                    var cmd = {
                        command: 'changeDummy',
                        id: '12345',
                        payload: {
                            id: '82517'
                        }
                    };
                    
                    beforeEach(function(done) {

                        dummyEmitter.once('published', function(evt) {
                            expect(evt.event).to.eql('dummyDestroyed');
                            done();
                        });

                        domain.handle({
                            command: 'destroyDummy',
                            payload: {
                                id: '82517'
                            }
                        }, function() {});

                    });

                    it('it should raise a commandRejected event', function(done) {

                        dummyEmitter.once('published', function(evt) {
                            expect(evt.event).to.eql('commandRejected');
                            expect(evt.commandId).to.eql(cmd.id);
                            expect(evt.payload.reason.name).to.eql('AggregateDestroyed');
                            expect(evt.payload.reason.aggregateRevision).to.eql(1);
                            expect(evt.payload.reason.aggregateId).to.eql('82517');
                            done();
                        });

                        domain.handle(cmd, function(err) {});

                    });

                });

                describe('when sending multiple commands together', function() {

                    var cmd1 = {
                        command: 'changeDummy',
                        id: '123455',
                        payload: {
                            id: '12382517'
                        }
                    };

                    var cmd2 = {
                        command: 'changeDummy',
                        id: '23455789',
                        payload: {
                            id: '12382517'
                        }
                    };

                    var cmd3 = {
                        command: 'changeDummy',
                        id: '2312345789',
                        payload: {
                            id: '12382517'
                        }
                    };

                    it('it should set revision correctly', function(done) {

                        var count = 0;
                        var handle;
                        dummyEmitter.on('published', handle = function(evt) {
                            count++;
                            if (count === 3) {
                                expect(evt.head.revision).to.eql(3);
                                dummyEmitter.removeListener('published', handle);
                                done();
                            }
                        });

                        domain.handle(cmd1, function(err) {});
                        domain.handle(cmd2, function(err) {});
                        domain.handle(cmd3, function(err) {});

                    });

                });

            });

            describe('having a command handler that sends commands to other command handlers', function() {

                var dummyEmitter = new (require('events').EventEmitter)();

                before(function(done) {

                    domain.on('event', function(evt) {
                        dummyEmitter.emit('published', evt);
                    });
                    domain.initialize({
                        commandHandlersPath: __dirname + '/commandHandlers',
                        aggregatesPath: __dirname + '/aggregates',
                        sagaHandlersPath: __dirname + '/sagaHandlers',
                        sagasPath: __dirname + '/sagas',
                        publishingInterval: 20
                    }, done);

                });

                it('it should acknowledge the command', function(done) {

                    var cmd = {
                        command: 'fooIt',
                        id: '82517',
                        payload: {
                            haha: 'hihi'
                        }
                    };
                    domain.handle(cmd, function(err) {
                        expect(err).not.to.be.ok();
                        done();
                    });

                });

                it('it should publish an event', function(done) {

                    var cmd = {
                        command: 'fooIt',
                        id: '82517',
                        payload: {
                            haha: 'hihi'
                        }
                    };

                    var fooItedReceived = false
                      , fooCretedReceived = false;

                    function finish(evt) {
                        if (fooItedReceived && fooCretedReceived) {
                            return;
                        }
                        if (evt.event === 'fooIted') {
                            fooItedReceived = true;
                        } else if (evt.event === 'fooCreated') {
                            fooCretedReceived = true;
                        }

                        if (fooItedReceived && fooCretedReceived) {
                            done();
                        }
                    }

                    dummyEmitter.on('published', function(evt) {
                        finish(evt);
                    });

                    domain.handle(cmd, function(err) {});

                });

            });

        });
            
    });

    describe('having any saga handlers', function() {

        var dummyEmitter2 = new (require('events').EventEmitter)();

        before(function(done) {

            domain.on('event', function(evt) {
                if (evt.event === 'dummyDestroyed') {
                    dummyEmitter2.emit('published', evt);
                }
            });
            domain.initialize({
                commandHandlersPath: __dirname + '/commandHandlers',
                aggregatesPath: __dirname + '/aggregates',
                sagaHandlersPath: __dirname + '/sagaHandlers',
                sagasPath: __dirname + '/sagas',
                publishingInterval: 20
            }, done);

        });

        describe('noting an expected event', function() {

            it('it should emit an other event', function(done) {

                var cmd = {
                    command: 'cancelDummy',
                    id: '82517'
                };

                dummyEmitter2.once('published', function(evt) {
                    expect(evt.event).to.eql('dummyDestroyed');
                    done();
                });

                domain.handle(cmd, function(err) {});

            });

        });

    });


});