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
 * Shows the given content in a modal dialog.
 *
 * @param {String|JQueryObject} content
 */
exports.show = function(content) {
    exports.hide();
    // Create elements
    var modalShadow = $('<div id="modal-shadow" />'),
        modalWindow = $('<div id="modal-window" />'),
        modalContent = $('<div id="modal-content" />'),
        buttonMenu = $('<div id="modal-button-menu" />'),
        doneButton = $('<a tabindex="-1" class="btn btn-primary">Done</a>');
    buttonMenu.append(doneButton);
    modalWindow.append(modalContent, buttonMenu);
    modalShadow.append(modalWindow);
    doneButton.on('keypress', function(e) {
        if (13 === e.keyCode) {
            $(this).click();
        }
    });
    doneButton.on('click', exports.hide);
    modalShadow.on('click', exports.hide);
    // Add content
    if ('string' === typeof content) {
        modalContent.text(content);
    } else {
        modalContent.html(content);
    }
    // Show the dialog
    $('body').append(modalShadow);
    doneButton.focus();
};

/**
 * Hides the current modal dialog.
 */
exports.hide = function() {
    var modalShadow = $('#modal-shadow');
    if (modalShadow) {
        modalShadow.remove();
    }
};
