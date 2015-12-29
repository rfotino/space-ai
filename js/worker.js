/**
 * Copyright (c) 2015 Robert Fotino.
 */

// Wrap this in a function so that nothing is accessible from
// a global context where user code is executed
(function() {
    var userFunc = null;
    var locals = {
        // Don't allow sending/receiving of messages by user code
        onmessage: undefined,
        postMessage: undefined,
        // Change console context in user code
        console: {
            log: function(str) {
                postMessage({ type: 'console', level: 'log', value: str });
            },
            warn: function(str) {
                postMessage({ type: 'console', level: 'warn', value: str });
            },
            error: function(str) {
                postMessage({ type: 'console', level: 'error', value: str });
            }
        },
        // API functions accessible from user code
        // TODO: complete and implement this list of API functions
        accelerate: function() { },
        turn: function() { }
    };
    var install = function(userCode) {
        // Create a sandbox for user code
        var params = [], args = [];
        for (var param in locals) {
            if (locals.hasOwnProperty(param)) {
                params.push(param);
                args.push(locals[param]);
            }
        }
        try {
            var that = { };
            var context1 = Array.prototype.concat.call(that, params, userCode);
            var sandbox = new (Function.prototype.bind.apply(Function, context1));
            var context2 = Array.prototype.concat.call(that, args);
            userFunc = Function.prototype.bind.apply(sandbox, context2);
        } catch (e) {
            postMessage({ type: 'error',
                          value: e.message,
                          lineNumber: e.lineNumber,
                          columnNumber: e.columnNumber });
        }
    };
    var execute = function() {
        // Make sure there is user code to execute
        if (null === userFunc) {
            return;
        }
        // Try to execute user code
        try {
            userFunc();
        } catch (e) {
            postMessage({ type: 'error',
                          value: e.message,
                          lineNumber: e.lineNumber,
                          columnNumber: e.columnNumber });
        }
        // Let the main thread know that we have finished execution
        postMessage({ type: 'complete' });
    };
    // Handle messages from the main thread
    onmessage = function(e) {
        var message = e.data;
        if (undefined === message.type) {
            return;
        }
        switch (message.type) {
        case 'install':
            if (undefined === message.value) {
                return;
            }
            install(message.value);
            break;
        case 'execute':
            execute();
            break;
        default:
            return;
        }
    };
})();
