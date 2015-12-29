/**
 * Copyright (c) 2015 Robert Fotino.
 */

var ui = {
    /**
     * setCode(code);
     * Overwrites the contents of the code window.
     */
    setCode: function(code) { },
    /**
     * getCode();
     * Returns the contents of the code window.
     */
    getCode: function() { },
    /**
     * showCode();
     * Pops out the code window.
     */
    showCode: function() { },
    /**
     * hideCode();
     * Hides the code window.
     */
    hideCode: function() { },
    /**
     * scrollConsole();
     * Scrolls down to the bottom of the console.
     */
    scrollConsole: function() { },
    /**
     * writeConsole(line, color = 'black');
     * Writes the given text to the console window, optionally with the
     * given color.
     */
    writeConsole: function(line, color) { },
    /**
     * showConsole();
     * Pops out the console window.
     */
    showConsole: function() { },
    /**
     * hideConsole();
     * Hides the console window.
     */
    hideConsole: function() { }
};

// Wrap local variables in a function so that we hide implementation
// details and don't pollute the global scope.
(function () {
    var codeWindow, consoleWindow, mainWindow,
        codeHidden = true, consoleHidden = true,
        codePosition, consolePosition,
        codeMirror, consoleContent;

    ui.setCode = function(code) {
        codeMirror.getDoc().setValue(code);
    };
    ui.getCode = function() {
        return codeMirror.getDoc().getValue();
    };
    ui.showCode = function() {
        codeHidden = false;
        codeWindow.removeClass('hidden');
        codeWindow.css('width', codePosition);
        consoleWindow.css('left', codePosition);
        consoleWindow.css('width', $(window).width() - codePosition);
        $('#code-popout-btn').text('<');
    };
    ui.hideCode = function() {
        codeHidden = true;
        codeWindow.addClass('hidden');
        codeWindow.css('width', '');
        consoleWindow.css('left', 0);
        consoleWindow.css('width', $(window).width());
        $('#code-popout-btn').text('>');
    };
    ui.scrollConsole = function() {
        consoleContent.scrollTop(consoleContent[0].scrollHeight);
    };
    ui.writeConsole = function(line, level) {
        if (undefined === level) {
            level = 'log';
        }
        var scrollBottom =
            consoleContent.scrollTop() + consoleContent[0].offsetHeight;
        var shouldScroll = scrollBottom === consoleContent[0].scrollHeight;
        switch (level) {
        case 'warn':
            consoleContent.append('<span style="color: orange;">Warning: </span>');
            break;
        case 'error':
            consoleContent.append('<span style="color: red;">Error: </span>');
            ui.showConsole();
            shouldScroll = true;
            break;
        }
        consoleContent.append($('<div/>').text(line + "\n").html());
        if (shouldScroll) {
            ui.scrollConsole();
        }
    };
    ui.showConsole = function() {
        consoleHidden = false;
        consoleWindow.removeClass('hidden');
        consoleWindow.css('height', $(window).height() - consolePosition);
        $('#console-popout-btn').text('v');
    };
    ui.hideConsole = function() {
        consoleHidden = true;
        consoleWindow.addClass('hidden');
        consoleWindow.css('height', '');
        $('#console-popout-btn').text('^');
    };

    $(document).ready(function() {
        codeWindow = $('#code-window');
        consoleWindow = $('#console-window');
        mainWindow = $('#main-window');
        consoleContent = $('#console');

        // Show/hide code and console windows when clicking their popout buttons
        $('#code-popout-btn').on('click', function(e) {
            e.preventDefault();
            if (codeHidden) {
                ui.showCode();
            } else {
                ui.hideCode();
            }
        });
        $('#console-popout-btn').on('click', function(e) {
            e.preventDefault();
            if (consoleHidden) {
                ui.showConsole();
            } else {
                ui.hideConsole();
            }
        });

        // Start repositioning code and console windows on mousedown on
        // their resize bars
        var codeDragging = false;
        var consoleDragging = false;
        $('#code-dragbar').on('mousedown', function(e) {
            if (!codeHidden) {
                codeDragging = true;
                codeWindow.addClass('notransition');
                consoleWindow.addClass('notransition');
            }
        });
        $('#console-dragbar').on('mousedown', function(e) {
            if (!consoleHidden) {
                consoleDragging = true;
                consoleWindow.addClass('notransition');
            }
        });

        // Reposition the code and console windows when dragging their resize bars
        codePosition = Math.round($(window).width() * 0.5);
        consolePosition = Math.round($(window).height() * 0.55);
        $(document).on('mouseup', function(e) {
            if (codeDragging) {
                codeDragging = false;
                codeWindow.removeClass('notransition');
                consoleWindow.removeClass('notransition');
            }
            if (consoleDragging) {
                consoleDragging = false;
                consoleWindow.removeClass('notransition');
            }
        });
        $(document).on('mousemove', function(e) {
            e.preventDefault();
            if (codeDragging) {
                codePosition = e.pageX;
                ui.showCode();
            }
            if (consoleDragging) {
                consolePosition = e.pageY;
                ui.showConsole();
            }
        });

        // Resize canvas, code window, and console window with the browser
        var windowWidth = $(window).width();
        var windowHeight = $(window).height();
        var resizeCanvas = function() {
            mainWindow.css('width', windowWidth);
            mainWindow.css('height', windowHeight - $('#menubar').height());
        }
        resizeCanvas();
        $(window).resize(function() {
            codePosition = (codePosition / windowWidth) * $(window).width();
            consolePosition = (consolePosition / windowHeight) * $(window).height();
            windowWidth = $(window).width();
            windowHeight = $(window).height();

            codeWindow.addClass('notransition');
            consoleWindow.addClass('notransition');

            resizeCanvas();

            if (codeHidden) {
                ui.hideCode();
            } else {
                ui.showCode();
            }

            if (consoleHidden) {
                ui.hideConsole();
            } else {
                ui.showConsole();
            }

            codeWindow[0].offsetHeight; // Flush cached CSS changes
            codeWindow.removeClass('notransition');
            consoleWindow.removeClass('notransition');
        });

        // Set up CodeMirror in the coding window
        var codeConfig = {
            mode: 'javascript',
            theme: 'elegant',
            lineNumbers: true,
            styleActiveLine: true,
            matchBrackets: true
        };
        codeMirror = CodeMirror(function(elem) {
            var textarea = document.getElementById('code');
            textarea.parentNode.replaceChild(elem, textarea);
            elem.id = 'code';
        }, codeConfig);
    });
})();
