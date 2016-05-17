var fs = require('fs');
var esprima = require('esprima');
var estraverse = require('estraverse');
var _ = require('lodash');
var profanity = require('profanity-util');

var filename = 'test.js'; //process.argv[2];

var codeTexts = parseCodeTexts(filename);
codeTexts = detectProfanity(codeTexts);
reportProfanity(filename, codeTexts);

function addNewElementsToArray(oldArray, elements) {
    _.forEach(elements, function(e) {
        if (!_.find(oldArray, e)) {
            oldArray.push(e);
        }
    });
    return oldArray;
}

function parseCodeTexts(filename) {
    var codeTexts = {
        comments: [],
        identifiers: [],
        literals: [],
    };
    var parserOptions = {
        loc: true,
        attachComment: true,
    };
    var ast = esprima.parse(fs.readFileSync(filename), parserOptions);
    estraverse.traverse(ast, {
        enter: function(node) {
            //console.log(node.type);
            if (node.leadingComments) {
                codeTexts.comments = addNewElementsToArray(codeTexts.comments, node.leadingComments);
            }
            if (node.trailingComments) {
                codeTexts.comments = addNewElementsToArray(codeTexts.comments, node.trailingComments);
            }
            if (node.type == 'Identifier') {
                codeTexts.identifiers = addNewElementsToArray(codeTexts.identifiers, [node]);
            }
            if (node.type == 'Literal') {
                codeTexts.literals = addNewElementsToArray(codeTexts.literals, [node]);
            }
        }
    });
    return codeTexts;
}

function detectProfanity(codeTexts) {
    _.forEach(codeTexts.identifiers, function(identifier) {
        identifier.profanewords = profanity.check(identifier.name);
    });
    _.forEach(codeTexts.literals, function(literal) {
        literal.profanewords = profanity.check(literal.value + '');
    });
    _.forEach(codeTexts.comments, function(comment) {
        comment.profanewords = profanity.check(comment.value);
    });
    return codeTexts;
}

function reportProfanity(filename, codeTexts) {
    var violations = [];
    _.forEach(codeTexts.identifiers, function(identifer) {
        if (identifer.profanewords.length) {
            var v = 'VIOLATION (issue: profanity, type: identifier, line: ' + identifer.loc.start.line + ' col: ' + identifer.loc.start.column + ') = ' + identifer.name.trim();
            violations.push(v);
        }
    });
    _.forEach(codeTexts.literals, function(literal) {
        if (literal.profanewords.length) {
            var v = 'VIOLATION (issue: profanity, type: literal, line: ' + literal.loc.start.line + ' col: ' + literal.loc.start.column + ') = ' + (literal.value + '').trim();
            violations.push(v);
        }
    });
    _.forEach(codeTexts.comments, function(comment) {
        if (comment.profanewords.length) {
            var v = 'VIOLATION (issue: profanity, type: comment, line: ' + comment.loc.start.line + ' col: ' + comment.loc.start.column + ') = ' + comment.value.trim();
            violations.push(v);
        }
    });
    if (violations.length) {
        _.forEach(violations, function(v) {
            console.log(v);
        });
    } else {
        console.log('SUCCESS: No profanity found in ' + filename);
    }
}
