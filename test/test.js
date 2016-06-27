var SolemnJS = require('../lib/solemn-js');
var Profane = require('Profane');
var _ = require('lodash');

/*
  ======== A Handy Little Nodeunit Reference ========
  https://github.com/caolan/nodeunit

  Test methods:
    test.expect(numAssertions)
    test.done()
  Test assertions:
    test.ok(value, [message])
    test.equal(actual, expected, [message])
    test.notEqual(actual, expected, [message])
    test.deepEqual(actual, expected, [message])
    test.notDeepEqual(actual, expected, [message])
    test.strictEqual(actual, expected, [message])
    test.notStrictEqual(actual, expected, [message])
    test.throws(block, [error], [message])
    test.doesNotThrow(block, [error], [message])
    test.ifError(value)
*/

exports.solemnjs = {
    setUp: function(done) {
        // setup here if necessary
        this.s = new SolemnJS();
        done();
    },

    detect: function(test) {
        test.expect(1);
        var violations = this.s.detect('test/fixtures/script.js');
        test.equal(violations.length, 3);
        test.done();
    },

    get_dictionary: function(test) {
        test.expect(1);
        var dictionary = this.s.getDictionary();
        test.ok(_.map(dictionary).length > 0);
        test.done();
    },

    set_dictionary: function(test) {
        test.expect(1);
        var dictionary = new Profane({
            "bad": ["inappropriate"]
        });
        this.s.setDictionary(dictionary);
        test.equal(_.map(dictionary).length, 1);
        test.done();
    },
};
