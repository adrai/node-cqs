var viewBuilderBase = require('cqrs-eventdenormalizer').viewBuilderBase;

var dummyViewBuilder = viewBuilderBase.extend({

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

module.exports = dummyViewBuilder;