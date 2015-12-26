/**
 * Copyright (c) 2015 Robert Fotino.
 */

var codeWindow, consoleWindow, mainWindow, gameCanvas,
    codeHidden = true, consoleHidden = true,
    codePosition, consolePosition;

function showCode() {
    codeWindow.removeClass('hidden');
    codeWindow.css('width', codePosition);
    consoleWindow.css('left', codePosition);
    consoleWindow.css('width', $(window).width() - codePosition);
    $('#code-popout-btn').text('<');
}

function hideCode() {
    codeWindow.addClass('hidden');
    codeWindow.css('width', '');
    consoleWindow.css('left', 0);
    consoleWindow.css('width', $(window).width());
    $('#code-popout-btn').text('>');
}

function showConsole() {
    consoleWindow.removeClass('hidden');
    consoleWindow.css('height', $(window).height() - consolePosition);
    $('#console-popout-btn').text('v');
}

function hideConsole() {
    consoleWindow.addClass('hidden');
    consoleWindow.css('height', '');
    $('#console-popout-btn').text('^');
}

$(document).ready(function() {
    var menuBar = $('#menubar');
    codeWindow = $('#code-window');
    consoleWindow = $('#console-window');
    mainWindow = $('#main-window');
    gameCanvas = document.getElementById('game-canvas');

    // Show/hide code and console windows when clicking their popout buttons
    $('#code-popout-btn').on('click', function() {
        codeHidden = !codeHidden;
        if (codeHidden) {
            hideCode();
        } else {
            showCode();
        }
    });
    $('#console-popout-btn').on('click', function(e) {
        consoleHidden = !consoleHidden;
        if (consoleHidden) {
            hideConsole();
        } else {
            showConsole();
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
    consolePosition = Math.round($(window).height() * 0.65);
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
    var cm = CodeMirror(function(elem) {
        var textarea = document.getElementById('code');
        textarea.parentNode.replaceChild(elem, textarea);
        elem.id = 'code';
    }, codeConfig);
});
