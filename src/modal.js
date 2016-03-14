/**
 * Copyright (c) 2016 Robert Fotino.
 *
 * Defines an interface for showing modal dialogs.
 */

var $ = require('../lib/jquery/jquery.js');

/**
 * @return {Boolean}
 */
exports.isShown = function() {
    return 0 < $('#modal-shadow').length;
};

/**
 * Shows the given content in a modal dialog, optionally calling the
 * given callback when the modal closes.
 *
 * @param {String|JQueryObject} content
 * @param {Function} doneCallback
 */
exports.show = function(content, doneCallback) {
    $('#modal-shadow').remove();
    // Create elements
    var modalShadow = $('<div id="modal-shadow" />'),
        modalWindow = $('<div id="modal-window" />'),
        modalContent = $('<div id="modal-content" />'),
        buttonMenu = $('<div id="modal-button-menu" />'),
        doneButton = $('<a tabindex="1000" class="btn btn-primary">Done</a>');
    doneButton.attr('id', 'done-btn');
    buttonMenu.append(doneButton);
    modalWindow.append(modalContent, buttonMenu);
    modalShadow.append(modalWindow);
    doneButton.on('keypress', function(e) {
        if (13 === e.keyCode) {
            $(this).click();
        }
    });
    doneButton.on('click', function(e) {
        $('#modal-shadow').remove();
        if ('function' === typeof doneCallback) {
            doneCallback();
        }
    });
    // Add content
    if ('string' === typeof content) {
        modalContent.text(content);
    } else {
        modalContent.html(content);
    }
    // Show the dialog
    $('body').append(modalShadow);
    doneButton.focus();
    // Make sure it is scrolled to the top
    modalWindow[0].offsetHeight; // Flush cached CSS changes
    modalWindow.scrollTop(0);
};

/**
 * Hides the current modal dialog.
 */
exports.hide = function() {
    $('#done-btn').click();
};
