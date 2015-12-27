/**
 * Copyright (c) 2015 Robert Fotino.
 */

/**
 * setCode(code);
 * Overwrites the contents of the code window.
 */
var setCode;
/**
 * getCode();
 * Returns the contents of the code window.
 */
var getCode;
/**
 * showCode();
 * Pops out the code window.
 */
var showCode;
/**
 * hideCode();
 * Hides the code window.
 */
var hideCode;
/**
 * scrollConsole();
 * Scrolls down to the bottom of the console.
 */
var scrollConsole;
/**
 * writeConsole(line, color = 'black');
 * Writes the given text to the console window, optionally with the
 * given color.
 */
var writeConsole;
/**
 * showConsole();
 * Pops out the console window.
 */
var showConsole;
/**
 * hideConsole();
 * Hides the console window.
 */
var hideConsole;

// Wrap local variables in a function so that we hide implementation
// details and don't pollute the global scope.
(function () {
    var menuBar, codeWindow, consoleWindow, mainWindow, gameCanvas,
        codeHidden = true, consoleHidden = true,
        codePosition, consolePosition,
        codeMirror, consoleContent;

    setCode = function(code) {
        codeMirror.getDoc().setValue(code);
    };
    getCode = function() {
        return codeMirror.getDoc().getValue();
    };
    showCode = function() {
        codeHidden = false;
        codeWindow.removeClass('hidden');
        codeWindow.css('width', codePosition);
        consoleWindow.css('left', codePosition);
        consoleWindow.css('width', $(window).width() - codePosition);
        $('#code-popout-btn').text('<');
    };
    hideCode = function() {
        codeHidden = true;
        codeWindow.addClass('hidden');
        codeWindow.css('width', '');
        consoleWindow.css('left', 0);
        consoleWindow.css('width', $(window).width());
        $('#code-popout-btn').text('>');
    };
    scrollConsole = function() {
        consoleContent.scrollTop(consoleContent[0].scrollHeight);
    };
    writeConsole = function(line, color) {
        if (color === undefined) {
            color = 'black';
        }
        var scrollBottom =
            consoleContent.scrollTop() + consoleContent[0].offsetHeight;
        var shouldScroll = scrollBottom === consoleContent[0].scrollHeight;
        consoleContent.append('<span style="color: ' + color + ';">' +
                              $('<div/>').text(line + "\n").html() +
                              '</span>');
        if (shouldScroll) {
            scrollConsole();
        }
    };
    showConsole = function() {
        consoleHidden = false;
        consoleWindow.removeClass('hidden');
        consoleWindow.css('height', $(window).height() - consolePosition);
        $('#console-popout-btn').text('v');
    };
    hideConsole = function() {
        consoleHidden = true;
        consoleWindow.addClass('hidden');
        consoleWindow.css('height', '');
        $('#console-popout-btn').text('^');
    };

    $(document).ready(function() {
        menuBar = $('#menubar');
        codeWindow = $('#code-window');
        consoleWindow = $('#console-window');
        mainWindow = $('#main-window');
        gameCanvas = document.getElementById('game-canvas');
        consoleContent = $('#console');

        // Show/hide code and console windows when clicking their popout buttons
        $('#code-popout-btn').on('click', function() {
            if (codeHidden) {
                showCode();
            } else {
                hideCode();
            }
        });
        $('#console-popout-btn').on('click', function(e) {
            if (consoleHidden) {
                showConsole();
            } else {
                hideConsole();
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
                showCode();
            }
            if (consoleDragging) {
                consolePosition = e.pageY;
                showConsole();
            }
        });

        // Resize canvas, code window, and console window with the browser
        var windowWidth = $(window).width();
        var windowHeight = $(window).height();
        var resizeCanvas = function() {
            mainWindow.css('width', windowWidth);
            mainWindow.css('height', windowHeight - menuBar.height());
            gameCanvas.width = windowWidth;
            gameCanvas.height = windowHeight - menuBar.height();
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
                hideCode();
            } else {
                showCode();
            }

            if (consoleHidden) {
                hideConsole();
            } else {
                showConsole();
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
