var fs = require('fs');
var esprima = require('esprima');
var estraverse = require('estraverse');
var _ = require('lodash');
var profane = require('profane');

function detect(fileName) {
    var codeTexts = parse(fileName);
    return getViolationsForCodeTexts(fileName, codeTexts);
}

function detectInText(text, fileName) {
    if (fileName === undefined) {
        fileName = '';
    }
    var codeTexts = parseText(text);
    return getViolationsForCodeTexts(fileName, codeTexts);
}

function parse(fileName) {
    var text = fs.readFileSync(fileName) + '';
    return parseText(text);
}

function parseText(text) {
    var codeTexts = {
        comments: [],
        identifiers: [],
        literals: [],
    };
    var parserOptions = {
        loc: true,
        attachComment: true,
    };
    var ast = esprima.parse(text, parserOptions);
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

function reportViolations(fileName, violations) {
    if (violations.length) {
        _.forEach(violations, function(v) {
            console.log(formatViolation(v));
        });
    } else {
        console.log('SUCCESS: No issues found in ' + fileName);
    }
}

function createViolation(codeTextType, fileName, pos, text) {
    text = text + '';
    var issues = profane.checkForCategories(text);
    var violation = {
        issues: issues,
        type: codeTextType,
        file: fileName,
        line: pos.start.line,
        column: pos.start.column,
        text: text,
    };
    return violation;
}

function formatViolation(violation) {
    var issuesText = '[' + _.map(violation.issues, function(value, key) {
        return key + '=' + value;
    }).join(' ') + ']';
    var v = 'VIOLATION (issues: ' + issuesText + ', type: ' + violation.type + ', file: ' + violation.file + ', line: ' + violation.line + ', col: ' + violation.column + ') = ' + violation.text.trim();
    return v;
}

function getViolationsForCodeTexts(fileName, codeTexts) {
    var violations = [];

    // find profane words
    _.forEach(codeTexts.identifiers, function(identifier) {
        identifier.profanewords = profane.checkForWords(identifier.name);
    });
    _.forEach(codeTexts.literals, function(literal) {
        literal.profanewords = profane.checkForWords(literal.value + '');
    });
    _.forEach(codeTexts.comments, function(comment) {
        comment.profanewords = profane.checkForWords(comment.value);
    });

    // find violations for profane words
    _.forEach(codeTexts.identifiers, function(identifer) {
        if (identifer.profanewords.length) {
            var v = createViolation('identifer', fileName, identifer.loc, identifer.name);
            violations.push(v);
        }
    });
    _.forEach(codeTexts.literals, function(literal) {
        if (literal.profanewords.length) {
            var v = createViolation('literal', fileName, literal.loc, literal.value);
            violations.push(v);
        }
    });
    _.forEach(codeTexts.comments, function(comment) {
        if (comment.profanewords.length) {
            var v = createViolation('comment', fileName, comment.loc, comment.value);
            violations.push(v);
        }
    });
    return violations;
}

function getDictionary() {
    return profane;
}

function setDictionary(d) {
    profane = d;
}

function addNewElementsToArray(oldArray, elements) {
    _.forEach(elements, function(e) {
        if (!_.find(oldArray, e)) {
            oldArray.push(e);
        }
    });
    return oldArray;
}

module.exports = {
    detect: detect,
    detectInText: detectInText,
    reportViolations: reportViolations,
    formatViolation: formatViolation,
    getDictionary: getDictionary,
    setDictionary: setDictionary,
};
