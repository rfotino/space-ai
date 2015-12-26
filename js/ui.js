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

    var codeDragging = false;
    $('#code-dragbar').on('mousedown', function(e) {
        if (!codeHidden) {
            codeDragging = true;
        }
    });

    var consoleDragging = false;
    $('#console-dragbar').on('mousedown', function(e) {
        if (!consoleHidden) {
            consoleDragging = true;
        }
    });
    
    codePosition = Math.round($(window).width() * 0.5);
    consolePosition = Math.round($(window).height() * 0.65);
    $(document).on('mouseup', function(e) {
        codeDragging = false;
        consoleDragging = false;
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
    });
});
