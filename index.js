var fs = require('fs');
var esprima = require('esprima');
var estraverse = require('estraverse');
var _ = require('lodash');
var profanity = require('profanity-util');

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

function reportProfanityViolations(fileName, codeTexts) {
    var violations = getProfanityViolations(fileName, codeTexts);
    if (violations.length) {
        _.forEach(violations, function(v) {
            console.log(v);
        });
    } else {
        console.log('SUCCESS: No profanity found in ' + fileName);
    }
}

function createProfanityViolation(codeTextType, fileName, loc, text) {
    text = text + '';
    var v = 'VIOLATION (issue: profanity, type: ' + codeTextType + ', file: ' + fileName + ', line: ' + loc.start.line + ' col: ' + loc.start.column + ') = ' + text.trim();
    return v;
}

function getProfanityViolations(fileName, codeTexts) {
    var violations = [];
    _.forEach(codeTexts.identifiers, function(identifer) {
        if (identifer.profanewords.length) {
            var v = createProfanityViolation('identifer', fileName, identifer.loc, identifer.name);
            violations.push(v);
        }
    });
    _.forEach(codeTexts.literals, function(literal) {
        if (literal.profanewords.length) {
            var v = createProfanityViolation('literal', fileName, literal.loc, literal.value);
            violations.push(v);
        }
    });
    _.forEach(codeTexts.comments, function(comment) {
        if (comment.profanewords.length) {
            var v = createProfanityViolation('comment', fileName, comment.loc, comment.value);
            violations.push(v);
        }
    });
    return violations;
}

module.exports = {
    parseCodeTexts: parseCodeTexts,
    detectProfanity: detectProfanity,
    reportProfanityViolations: reportProfanityViolations,
    getProfanityViolations: getProfanityViolations,
};
