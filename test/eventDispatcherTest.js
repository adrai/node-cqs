var expect = require('expect.js')
  , async = require('async')
  , eventDispatcher = require('../lib/contextEventDenormalizer/eventDispatcher')
  , queue = require('node-queue')
  , eventQueue
  , eventEmitter = require('../lib/contextEventDenormalizer/eventEmitter')
  , dummyEmitter = new (require('events').EventEmitter)();

function cleanQueue(done) {
    eventQueue.getAll(function(err, evts) {
        async.forEach(evts, function(item, callback) {
            eventQueue.remove(item.id, callback);
        }, function(err) {
            if (!err) done();
        });
    });
}

describe('eventDispatcher', function() {

    before(function(done) {
        queue.connect(function(err, evtQueue) {
            eventQueue = evtQueue;
            eventDispatcher.configure(function() {
                this.use(eventQueue);
            });
            done();
        });
    });

    afterEach(function(done) {
        cleanQueue(done);
    });

    describe('calling initialize', function() {

        describe('having zero entries', function() {

            after(function() {
                // remove listeners as you connect in a second test again 
                // else you would call the dequeue function more than once 
                // as it is bound in initalize function
                eventEmitter.removeAllListeners('denormalized:*');
            });

            it('it should connect', function(done) {
                eventDispatcher.initialize({}, function(err) {
                    expect(err).not.to.be.ok();
                    done();
                });
            });

        });

        describe('having any entries', function() {

            var emitted = false;

            beforeEach(function(done) {
                eventEmitter.once('denormalize:dummyChanged', function() {});
                eventEmitter.once('denormalize:dummyChanged', function() { emitted = true; });

                // remove listeners as you connect in a second test again 
                // else you would call the dequeue function more than once 
                // as it is bound in initalize function
                eventEmitter.removeAllListeners('denormalized:*');

                eventQueue.push('1', { 
                    workers: 1,
                    event: { id: '1', event: 'dummyChanged'}
                }, done);
            });

            it('it should connect', function(done) {
                eventDispatcher.initialize({}, function(err) {
                    expect(err).not.to.be.ok();
                    done();
                });
            });

            it('it should update the number of workers in the entries', function(done) {
                eventDispatcher.initialize({}, function(err) {
                    eventQueue.getAll(function(err, entries) {
                        expect(entries[0]).to.eql({
                            id: '1',
                            data: { 
                                workers: 2,
                                event: { id: '1', event: 'dummyChanged'}
                            }
                        });
                        done();
                    });
                });
            });

            it('it should reemit the events', function() {
                expect(emitted).to.be.ok();
            });

        });

    });

    describe('being initialized', function() {

        before(function(done) {
            eventDispatcher.initialize(done);
        });

        describe('calling queueEvent', function() {

            describe('having zero denormalizers', function() {

                it('it should callback with success', function(done) {
                    eventDispatcher.queueEvent({id: '1', event: 'dummyChanged'}, function(err) {
                        expect(err).not.to.be.ok();
                        done();
                    });
                });

            });
            
            describe('having any denormalizers', function() {

                beforeEach(function() {
                    eventEmitter.once('denormalize:dummyChanged', function() {});
                    eventEmitter.once('denormalize:dummyChanged', function() {});
                });

                it('it should callback with success', function(done) {
                    eventDispatcher.queueEvent({ id: '0', event: 'dummyChanged'}, function(err) {
                        expect(err).not.to.be.ok();
                        done();
                    });
                });

                it('the eventQueueStore should contain an entry', function(done) {
                    eventDispatcher.queueEvent({ id: '1', event: 'dummyChanged'}, function(err) {
                        eventQueue.getAll(function(err, entries) {
                            expect(entries).to.have.length(1);
                            done();
                        });
                    });
                });

                it('the eventQueueStore\'s entries\' workers number should match the number of denormalizers', function(done) {
                    eventDispatcher.queueEvent({ id: '1', event: 'dummyChanged'}, function(err) {
                        eventQueue.getAll(function(err, entries) {
                            expect(entries[0]).to.eql({
                                id: '1',
                                data: { 
                                    workers: 2,
                                    event: { id: '1', event: 'dummyChanged'}
                                }
                            });
                            done();
                        });
                    });
                });

            });

        });

        describe('noting denormalized:* event being raised', function() {

            describe('on an entry with workers number > 1', function() {

                beforeEach(function(done) {
                    eventEmitter.once('denormalize:dummyChanged', function() {});
                    eventEmitter.once('denormalize:dummyChanged', function() {});

                    eventQueue.push('1', { 
                        workers: 2,
                        event: { id: '1', event: 'dummyChanged'}
                    }, done);
                });

                it('it should decrease the number by one', function(done) {
                    eventEmitter.emit('denormalized:dummyChanged', { id: '1', event: 'dummyChanged'});

                    // this will not work with an nonInMemoryImplementation 
                    // as dequeuing might take longer than calling getAll 
                    // so you will still have two workers instead of one
                    eventQueue.getAll(function(err, entries) {
                        expect(entries[0]).to.eql({
                            id: '1',
                            data: { 
                                workers: 1,
                                event: { id: '1', event: 'dummyChanged'}
                            }
                        });
                        done();
                    });
                });

            });

            describe('on entry with workers number == 1', function() {

                before(function(done) {
                    eventQueue.push('1', { 
                        workers: 1,
                        event: { id: '1', event: 'dummyChanged'}
                    }, done);
                });

                it('it should remove the entry and it should emit a extend event', function(done) {

                    eventEmitter.once('extend:*', function(evt) {
                        expect(evt).to.have.property('event', 'dummyChanged');
                        eventQueue.getAll(function(err, entries) {
                            expect(entries).to.have.length(0);
                            done();
                        });
                    });

                    eventEmitter.emit('denormalized:dummyChanged', { id: '1', event: 'dummyChanged'});
                    
                });

            });

            describe('on non existing entry', function() {

                it('it should not create an entry', function(done) {
                    eventEmitter.emit('denormalized:dummyChanged', { id: '1', event: 'dummyChanged'});

                    eventQueue.getAll(function(err, entries) {
                        expect(entries).to.have.length(0);
                        done();
                    });
                });

            });

        });

        describe('noting extend:* event being raised', function() {

            describe('having no extenders', function() {

                before(function(done) {
                    // remove listeners as you connect in a second test again 
                    // else you would call the dequeue function more than once 
                    // as it is bound in initalize function
                    eventEmitter.removeAllListeners('extend:*');
                    eventDispatcher.initialize({}, function(err) {
                        done();
                    });
                });

                it('it should emit an extended event', function(done) {

                    eventEmitter.once('extended:*', function(evt) {
                        expect(evt).to.have.property('event', 'dummyChanged');
                        done();
                    });

                    eventEmitter.emit('extend:dummyChanged', { id: '1', event: 'dummyChanged'});

                });

            });

            describe('having any extenders', function() {

                before(function(done) {
                    eventEmitter.removeAllListeners('extend:*');
                    eventDispatcher.initialize({}, function(err) {
                        eventEmitter.on('extend:dummyChanged', function(evt) {
                            dummyEmitter.emit('done');
                        });
                        done();
                    });
                });

                it('it should not emit an extended event', function(done) {
                    
                    dummyEmitter.on('done', function(evt) {
                        done();
                    });

                    eventEmitter.once('extended:*', function(evt) {
                        expect(false).to.be.ok();
                    });

                    eventEmitter.emit('extend:dummyChanged', { id: '1', event: 'dummyChanged'});

                });

            });

        });

    });

});