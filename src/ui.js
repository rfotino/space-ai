/**
 * Copyright (c) 2015 Robert Fotino.
 *
 * This defines a module for getting/setting the contents of the code window
 * and console.
 */

var $ = require('../lib/jquery/jquery.js');
var game = require('./game.js');
var modal = require('./modal.js');
var CodeMirror = require('../lib/codemirror/lib/codemirror.js');
require('../lib/codemirror/mode/javascript/javascript.js');
require('../lib/codemirror/addon/edit/matchbrackets.js');
require('../lib/codemirror/addon/selection/active-line.js');

// Available themes
var themes = [
    'default', '3024-day', '3024-night', 'abcdef', 'ambiance',
    'ambiance-mobile', 'base16-dark', 'base16-light', 'bespin', 'blackboard',
    'cobalt', 'colorforth', 'dracula', 'eclipse', 'elegant', 'erlang-dark',
    'hopscotch', 'icecoder', 'isotope', 'lesser-dark', 'liquibyte', 'material',
    'mbo', 'mdn-like', 'midnight', 'monokai', 'neat', 'neo', 'night',
    'paraiso-dark', 'paraiso-light', 'pastel-on-dark', 'railscasts',
    'rubyblue', 'seti', 'solarized dark', 'solarized light', 'the-matrix',
    'tomorrow-night-bright', 'tomorrow-night-eighties', 'ttcn', 'twilight',
    'vibrant-ink', 'xq-dark', 'xq-light', 'yeti', 'zenburn'
];

// Declare variables for DOM elements and handling state
var codeWindow, consoleWindow, mainWindow,
    codeHidden = true, consoleHidden = true,
    codePosition, consolePosition,
    codeMirror, consoleContent;

/**
 * setCode(code);
 * Overwrites the contents of the code window.
 */
exports.setCode = function(code) {
    codeMirror.getDoc().setValue(code);
};

/**
 * getCode();
 * Returns the contents of the code window.
 */
exports.getCode = function() {
    return codeMirror.getDoc().getValue();
};

/**
 * showCode();
 * Pops out the code window.
 */
exports.showCode = function() {
    codeHidden = false;
    codeWindow.removeClass('hidden');
    codeWindow.css('width', codePosition);
    consoleWindow.css('left', codePosition);
    consoleWindow.css('width', $(window).width() - codePosition);
    $('#code-popout-btn').html('&#x25C2');
    // Make sure the CodeMirror instance repaints
    var i = setInterval(function() { codeMirror.refresh(); }, 25);
    setTimeout(function() { clearInterval(i); }, 125);
    // Focus the coding area
    codeMirror.focus();
};

/**
 * hideCode();
 * Hides the code window.
 */
exports.hideCode = function() {
    codeHidden = true;
    codeWindow.addClass('hidden');
    codeWindow.css('width', '');
    consoleWindow.css('left', 0);
    consoleWindow.css('width', $(window).width());
    $('#code-popout-btn').html('&#x25B8');
    // Blur the coding area by focusing on something else
    $('#game-canvas').focus();
};

/**
 * isVisibleCode();
 * Returns true if the code window is visible.
 */
exports.isVisibleCode = function() {
    return !codeHidden;
};

/**
 * scrollConsole();
 * Scrolls down to the bottom of the console.
 */
exports.scrollConsole = function() {
    consoleContent.scrollTop(consoleContent[0].scrollHeight);
};

/**
 * writeConsole(line, level = 'log');
 * Writes the given text to the console window, optionally with a level
 * of log, warn, or error.
 */
exports.writeConsole = function(line, level) {
    if ('undefined' === typeof level) {
        level = 'log';
    }
    var maxLines = 300;
    var scrollBottom =
        consoleContent.scrollTop() + consoleContent[0].offsetHeight;
    var shouldScroll = scrollBottom === consoleContent[0].scrollHeight;
    var newContent = '<div class="console-line">';
    switch (level) {
    case 'warn':
        newContent += '<span style="color: orange;">Warning: </span>';
        break;
    case 'error':
        newContent += '<span style="color: red;">Error: </span>';
        exports.showConsole();
        shouldScroll = true;
        break;
    }
    // If line is an object, print out its JSON equivalent
    if (typeof line === 'object') {
        line = JSON.stringify(line, null, 2);
    }
    newContent += $('<div/>').text(line + "\n").html();
    newContent += '</div>';
    consoleContent.append(newContent);
    while (maxLines < consoleContent.children().length) {
        consoleContent.children().first().remove();
    }
    if (shouldScroll) {
        exports.scrollConsole();
    }
};

/**
 * clearConsole();
 * Clears all text from the console window.
 */
exports.clearConsole = function() {
    consoleContent.html('');
};

/**
 * showConsole();
 * Pops out the console window.
 */
exports.showConsole = function() {
    consoleHidden = false;
    consoleWindow.removeClass('hidden');
    consoleWindow.css('height', $(window).height() - consolePosition);
    $('#console-popout-btn').html('&#x25BC;');
};

/**
 * hideConsole();
 * Hides the console window.
 */
exports.hideConsole = function() {
    consoleHidden = true;
    consoleWindow.addClass('hidden');
    consoleWindow.css('height', '');
    $('#console-popout-btn').html('&#x25B2');
};

/**
 * toggleConsole();
 * Toggles the console window.
 */
exports.toggleConsole = function() {
    if (consoleHidden) {
        exports.showConsole();
    } else {
        exports.hideConsole();
    }
};

/**
 * init();
 * Adds UI listeners via jQuery ready() function.
 */
exports.init = function() {
    $(document).ready(function() {
        codeWindow = $('#code-window');
        consoleWindow = $('#console-window');
        mainWindow = $('#main-window');
        consoleContent = $('#console');

        // Show/hide code and console windows when clicking their popout
        // buttons
        $('#code-popout-btn').on('click', function(e) {
            e.preventDefault();
            if (codeHidden) {
                exports.showCode();
            } else {
                exports.hideCode();
            }
        });
        $('#console-popout-btn').on('click', function(e) {
            e.preventDefault();
            if (consoleHidden) {
                exports.showConsole();
            } else {
                exports.hideConsole();
            }
        });

        // Start repositioning code and console windows on mousedown on
        // their resize bars
        var codeDragging = false;
        var consoleDragging = false;
        $('#code-dragbar').on('mousedown touchstart', function(e) {
            if (!codeHidden) {
                codeDragging = true;
                codeWindow.addClass('notransition');
                consoleWindow.addClass('notransition');
            }
        });
        $('#console-dragbar').on('mousedown touchstart', function(e) {
            if (!consoleHidden) {
                consoleDragging = true;
                consoleWindow.addClass('notransition');
            }
        });

        // Reposition the code and console windows when dragging their resize bars
        codePosition = Math.round($(window).width() * 0.5);
        consolePosition = Math.round($(window).height() * 0.55);
        $(document).on('mouseup touchend touchcancel', function(e) {
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
        $(document).on('mousemove touchmove', function(e) {
            if (e.originalEvent.touches) {
                e.pageX = e.originalEvent.touches[0].pageX;
                e.pageY = e.originalEvent.touches[0].pageY;
            }
            if (codeDragging) {
                codePosition = e.pageX;
                exports.showCode();
            }
            if (consoleDragging) {
                consolePosition = e.pageY;
                exports.showConsole();
            }
        });

        // Resize canvas, code window, and console window with the browser
        var windowWidth = $(window).width();
        var windowHeight = $(window).height();
        var resizeCanvas = function() {
            var width = $(window).width();
            var height = $(window).height() - $('#menubar').height();
            var canvas = document.getElementById('game-canvas');
            mainWindow.css('width', width);
            mainWindow.css('height', height);
            canvas.width = width;
            canvas.height = height;
            game.draw();
        }
        resizeCanvas();
        $(window).on('resize', function() {
            codePosition = (codePosition / windowWidth) * $(window).width();
            consolePosition = (consolePosition / windowHeight) * $(window).height();
            windowWidth = $(window).width();
            windowHeight = $(window).height();

            codeWindow.addClass('notransition');
            consoleWindow.addClass('notransition');

            resizeCanvas();

            if (codeHidden) {
                exports.hideCode();
            } else {
                exports.showCode();
            }

            if (consoleHidden) {
                exports.hideConsole();
            } else {
                exports.showConsole();
            }

            codeWindow[0].offsetHeight; // Flush cached CSS changes
            codeWindow.removeClass('notransition');
            consoleWindow.removeClass('notransition');
        });

        // Set up CodeMirror in the coding window
        var currentTheme = 'elegant';
        try {
            if (localStorage.hasOwnProperty('theme')) {
                currentTheme = localStorage.getItem('theme');
            }
        } catch (e) { }
        var codeConfig = {
            mode: 'javascript',
            theme: currentTheme,
            lineNumbers: true,
            styleActiveLine: true,
            matchBrackets: true
        };
        codeMirror = CodeMirror(function(elem) {
            var textarea = document.getElementById('code');
            textarea.parentNode.replaceChild(elem, textarea);
            elem.id = 'code';
        }, codeConfig);

        // Set up the theme selector
        $('#themes-btn').on('click', function(e) {
            var currentTheme = codeMirror.getOption('theme');
            var themeSelector = $('<select id="theme-selector" />')
                .attr('tabindex', '999')
                .css('font-size', '1.2em')
                .css('padding', '5px 10px');
            for (var i = 0; i < themes.length; i++) {
                var theme = themes[i];
                var themeOption = $('<option />').text(theme);
                themeOption.attr('value', theme);
                if (theme === currentTheme) {
                    themeOption.attr('selected', 'selected');
                }
                themeSelector.append(themeOption);
            }
            themeSelector.on('change', function(e) {
                var theme = themeSelector.val();
                try {
                    localStorage.setItem('theme', theme);
                } catch (e) { }
                codeMirror.setOption('theme', theme);
            });
            var heading = $('<h2 />')
                .text('Code Editor Theme').css('padding-bottom', 5);
            modal.show($('<div />').append(heading, themeSelector));
        });
    });
};
