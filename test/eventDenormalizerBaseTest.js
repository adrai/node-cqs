var expect = require('expect.js')
  , sinon = require('sinon')
  , async = require('async')
  , repository = require('viewmodel').write
  , dummyRepo
  , eventEmitter = require('../lib/contextEventDenormalizer/eventEmitter')
  , eventDenormalizerBase = require('../lib/contextEventDenormalizer/bases/eventDenormalizerBase')
  , Queue = require('../lib/contextEventDenormalizer/orderQueue');

var dummyDenormalizer = eventDenormalizerBase.extend({

    events: ['dummied', {'dummyCreated': 'create'}, {'dummyChanged': 'update'}, {'dummyDeleted': 'delete'}],
    collectionName: 'dummies',

    dummied: function(evt, repository, callback) {
        callback(null);
    }

});

function cleanRepo(done) {
    dummyRepo.find(function(err, results) {
        async.forEach(results, function(item, callback) {
            item.destroy();
            dummyRepo.commit(item, callback);
        }, function(err) {
            if (!err) done();
        });
    });
}

describe('EventDenormalizerBase', function() {

    before(function(done) {
        
        repository.init(function(err) {
            dummyRepo = repository.extend({
                collectionName: dummyDenormalizer.collectionName
            });

            dummyDenormalizer.configure(function() {
                dummyDenormalizer.use(dummyRepo);
            });

            done();
        });

    });

    describe('used by a dummy eventDenormalizer', function() {

        describe('calling handle with an event', function() {

            afterEach(function(done) {
                cleanRepo(done);
                dummyDenormalizer.queue = new Queue({ queueTimeout: 30 });
            });

            describe('that is mapped to', function() {

                describe('a default function', function() {

                    describe('with create action', function() {

                        var evt;

                        beforeEach(function() {

                            evt = {
                                id: '82517',
                                event: 'dummyCreated',
                                head: {
                                    revision: 1
                                },
                                payload: {
                                    id: '23'
                                }
                            };

                        });

                        it('it should raise a denormalized event', function(done) {

                            eventEmitter.once('denormalized:' + evt.event, function(data) {
                                done();
                            });
                            dummyDenormalizer.handle(evt);

                        });

                        it('it should call the commit function on the repository', function(done) {

                            var spy = sinon.spy(dummyRepo, 'commit');
                            eventEmitter.once('denormalized:' + evt.event, function(data) {
                                expect(spy.calledOnce).to.be.ok();
                                dummyRepo.commit.restore();
                                done();
                            });
                            dummyDenormalizer.handle(evt);

                        });

                    });

                    describe('with change action', function() {

                        var evt;

                        beforeEach(function(done) {

                            dummyRepo.get('23', function(err, vm) {
                                vm._revision = 1;
                                vm.foo = 'bar';
                                dummyRepo.commit(vm, function(err) {
                                    evt = {
                                        id: '82517',
                                        event: 'dummyChanged',
                                        head: {
                                            revision: vm._revision
                                        },
                                        payload: {
                                            id: vm.id
                                        }
                                    };
                                    done();
                                });
                            });

                        });

                        it('it should raise a denormalized event', function(done) {

                            eventEmitter.once('denormalized:' + evt.event, function(data) {
                                done();
                            });
                            dummyDenormalizer.handle(evt);

                        });

                        it('it should call the commit function on the repository', function(done) {

                            var spy = sinon.spy(dummyRepo, 'commit');
                            eventEmitter.once('denormalized:' + evt.event, function(data) {
                                expect(spy.calledOnce).to.be.ok();
                                dummyRepo.commit.restore();
                                done();
                            });
                            dummyDenormalizer.handle(evt);

                        });

                    });

                    describe('with delete action', function() {

                        var evt;

                        beforeEach(function(done) {

                            dummyRepo.get('23', function(err, vm) {
                                vm._revision = 1;
                                vm.foo = 'bar';
                                dummyRepo.commit(vm, function(err) {
                                    evt = {
                                        id: '82517',
                                        event: 'dummyDeleted',
                                        head: {
                                            revision: vm._revision
                                        },
                                        payload: {
                                            id: vm.id
                                        }
                                    };
                                    done();
                                });
                            });

                        });

                        it('it should raise a denormalized event', function(done) {

                            eventEmitter.once('denormalized:' + evt.event, function(data) {
                                done();
                            });
                            dummyDenormalizer.handle(evt);

                        });

                        it('it should call the commit function on the repository', function(done) {

                            var spy = sinon.spy(dummyRepo, 'commit');
                            eventEmitter.once('denormalized:' + evt.event, function(data) {
                                expect(spy.calledOnce).to.be.ok();
                                dummyRepo.commit.restore();
                                done();
                            });
                            dummyDenormalizer.handle(evt);

                        });

                    });

                    describe('having a change action with an event revision', function() {

                        var evt;

                        beforeEach(function(done) {

                            dummyRepo.get('23', function(err, vm) {
                                vm._revision = 1;
                                vm.foo = 'bar';
                                dummyRepo.commit(vm, function(err) {
                                    evt = {
                                        id: '82517',
                                        event: 'dummyChanged',
                                        head: {
                                            revision: vm._revision
                                        },
                                        payload: {
                                            id: vm.id
                                        }
                                    };
                                    done();
                                });
                            });

                        });

                        describe('less than the expected revision', function() {

                            it('it should raise a denormalized event', function(done) {
                                evt.head.revision--;

                                eventEmitter.once('denormalized:' + evt.event, function(data) {
                                    done();
                                });
                                dummyDenormalizer.handle(evt);

                            });

                        });

                        describe('equal to the expected revision', function() {

                            it('it should raise a denormalized event', function(done) {

                                eventEmitter.once('denormalized:' + evt.event, function(data) {
                                    done();
                                });
                                dummyDenormalizer.handle(evt);

                            });

                            it('it should call the commit function on the repository', function(done) {

                                var spy = sinon.spy(dummyRepo, 'commit');
                                eventEmitter.once('denormalized:' + evt.event, function(data) {
                                    expect(spy.calledOnce).to.be.ok();
                                    dummyRepo.commit.restore();
                                    done();
                                });
                                dummyDenormalizer.handle(evt);

                            });

                            describe('having notified a previous event with the successor revision of the expected revision', function() {

                                var firstEvt
                                  , secondEvt;

                                beforeEach(function() {

                                    firstEvt = {
                                        id: '82517',
                                        event: 'dummyCreated',
                                        head: {
                                            revision: 1
                                        },
                                        payload: {
                                            id: '23'
                                        }
                                    };
                                    secondEvt = {
                                        id: '82518',
                                        event: 'dummyChanged',
                                        head: {
                                            revision: 2
                                        },
                                        payload: {
                                            id: '23'
                                        }
                                    };

                                    dummyDenormalizer.handle(secondEvt);

                                });

                                it('it should raise a denormalized event for the previous event', function(done) {

                                    var todo = 2;
                                    function check() {
                                        todo--;

                                        if (!todo) done();
                                    }

                                    eventEmitter.once('denormalized:' + firstEvt.event, function(evt) {
                                        expect(evt).to.eql(firstEvt);
                                        check();
                                    });

                                    eventEmitter.once('denormalized:' + secondEvt.event, function(evt) {
                                        expect(evt).to.eql(secondEvt);
                                        check();
                                    });

                                    dummyDenormalizer.handle(firstEvt);

                                });

                                it('it should call the commit function twice on the repository', function(done) {

                                    var spy = sinon.spy(dummyRepo, 'commit')
                                      , todo = 2;

                                    function check() {
                                        todo--;

                                        if (!todo) {
                                            expect(spy.calledTwice).to.be.ok();
                                            dummyRepo.commit.restore();
                                            done();
                                        }
                                    }

                                    eventEmitter.once('denormalized:' + firstEvt.event, function(evt) {
                                        expect(evt).to.eql(firstEvt);
                                        check();
                                    });

                                    eventEmitter.once('denormalized:' + secondEvt.event, function(evt) {
                                        expect(evt).to.eql(secondEvt);
                                        check();
                                    });

                                    dummyDenormalizer.handle(firstEvt);

                                });

                            });

                        });

                    });

                });

                describe('a custom function', function() {

                        var evt;

                        beforeEach(function() {

                            evt = {
                                id: '82517',
                                event: 'dummied',
                                payload: {
                                    id: '23'
                                }
                            };

                        });

                        it('it should raise a denormalized event', function(done) {

                            eventEmitter.once('denormalized:' + evt.event, function(data) {
                                done();
                            });
                            dummyDenormalizer.handle(evt);

                        });

                        it('it should call the concrete function', function(done) {

                            var spy = sinon.spy(dummyDenormalizer, 'dummied');
                            eventEmitter.once('denormalized:' + evt.event, function(data) {
                                expect(spy.calledOnce).to.be.ok();
                                dummyDenormalizer.dummied.restore();
                                done();
                            });
                            dummyDenormalizer.handle(evt);

                        });

                });

            });

        });

    });

});