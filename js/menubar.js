/**
 * Copyright (c) 2015 Robert Fotino.
 *
 * This defines a module for manipulating and getting information from the
 * menubar's UI.
 */

define(function(require, exports, module) {
    var $ = require('jquery');
    var ui = require('ui');
    var game = require('game');
    var levels = require('levels');

    // Declare variables for DOM elements and handling state
    var state, selectedLevel = null, levelsDiv, showLevelsBtn, hideLevelsBtn,
        loadLevelBtn, restartBtn, runBtn, levelDivsArr = [];

    /**
     * setState(state);
     * Sets the menu state to 'running', 'paused', or 'waiting'.
     */
    exports.setState = function(newState) {
        state = newState;
        switch (state) {
        case 'running':
            runBtn.text('Pause');
            runBtn.removeClass('disabled');
            break;
        case 'paused':
            runBtn.text('Run');
            runBtn.removeClass('disabled');
            break;
        case 'waiting':
        default:
            runBtn.text('Run');
            runBtn.addClass('disabled');
            break;
        }
    };

    /**
     * showLevels();
     * Shows the level selector.
     */
    exports.showLevels = function() {
        $('#level-selector').show();
    };

    /**
     * hideLevels();
     * Hides the level selector.
     */
    exports.hideLevels = function() {
        $('#level-selector').hide();
    };

    /**
     * isVisibleLevels();
     * Returns true if the level selector is visible.
     */
    exports.isVisibleLevels = function() {
        return $('#level-selector').is(':visible');
    };

    // Helper function used when selecting previous or next level
    var scrollLevelsDivTo = function(div) {
        levelsDiv.scrollTop(levelsDiv.scrollTop() + div.position().top - 55);
    };

    /**
     * selectPrevLevel();
     * Changes the selected level to the previous one.
     */
    exports.selectPrevLevel = function() {
        if (null === selectedLevel) {
            return;
        }
        for (var i = 1; i < levelDivsArr.length; i++) {
            if (selectedLevel === levelDivsArr[i].level) {
                var div = levelDivsArr[i - 1].div;
                div.trigger('click');
                scrollLevelsDivTo(div);
                break;
            }
        }
    };

    /**
     * selectNextLevel();
     * Changes the selected level to the next one.
     */
    exports.selectNextLevel = function() {
        if (null === selectedLevel) {
            if (0 < levelDivsArr.length) {
                var div = levelDivsArr[0].div;
                div.trigger('click');
                scrollLevelsDivTo(div);
            }
            return;
        }
        for (var i = 0; i + 1 < levelDivsArr.length; i++) {
            if (selectedLevel === levelDivsArr[i].level) {
                var div = levelDivsArr[i + 1].div;
                div.trigger('click');
                scrollLevelsDivTo(div);
                break;
            }
        }
    };

    /**
     * loadSelectedLevel();
     * Loads the select level, or does nothing if no level selected.
     */
    exports.loadSelectedLevel = function() {
        loadLevelBtn.trigger('click');
    };

    /**
     * init();
     * Initializes the menubar UI and adds listeners via jQuery.
     */
    exports.init = function() {
        $(document).ready(function() {
            // Assign jQuery DOM variables for use in other functions
            levelsDiv = $('#levels');
            showLevelsBtn = $('#show-levels');
            hideLevelsBtn = $('#hide-levels');
            loadLevelBtn = $('#load-level');
            restartBtn = $('#restart');
            runBtn = $('#run');

            // Set up level selector interface
            for (var i = 0; i < levels.length; i++) {
                var level = levels[i];
                var div = $('<div class="level" />');
                // Get the bounding box of the initial level, used for the
                // thumbnail
                level.init();
                var levelBounds = level.bounds();
                // Get the right scale for the thumbnail
                var canvasWidth = 130;
                var canvasHeight = 100;
                var thumbnail = $('<canvas width="' + canvasWidth + '" ' +
                                  'height="' + canvasHeight + '" ' +
                                  'class="thumbnail" />');
                var name = $('<div class="name" />');
                name.text(level.name);
                div.append(thumbnail);
                div.append(name);
                var selectLevelHandler = (function(level, div) {
                    return function(e) {
                        e.preventDefault();
                        $('#level-selector .level').removeClass('selected');
                        div.addClass('selected');
                        selectedLevel = level;
                        loadLevelBtn.removeClass('disabled');
                    };
                })(level, div);
                div.on('click', selectLevelHandler);
                div.on('dblclick', function(e) {
                    loadLevelBtn.trigger('click');
                });
                levelsDiv.append(div);
                // Draw the thumbnail
                var ctx = thumbnail[0].getContext('2d');
                level.viewport.fixToBounds(
                    levelBounds,
                    canvasWidth,
                    canvasHeight
                );
                level.draw(ctx);
                // Add to level divs array
                levelDivsArr.push({
                    level: level,
                    div: div
                });
            }

            // Set up show/hide/load button listeners for level selector
            showLevelsBtn.on('click', function(e) {
                e.preventDefault();
                exports.showLevels();
            });
            hideLevelsBtn.on('click', function(e) {
                e.preventDefault();
                exports.hideLevels();
            });
            loadLevelBtn.on('click', function(e) {
                e.preventDefault();
                if (selectedLevel) {
                    exports.hideLevels();
                    showLevelsBtn.text('Level: ' + selectedLevel.name);
                    game.load(selectedLevel);
                }
            });
            loadLevelBtn.addClass('disabled');

            // Listen for clicks of file menu buttons
            var currentFileName = null;
            var warnedAboutLocalStorage = false;
            function checkForLocalStorage() {
                try {
                    localStorage.setItem('test', 'test');
                    localStorage.removeItem('test');
                    return true;
                } catch (e) {
                    return false;
                }
            }
            function updateFileMenuItems() {
                // Update save/save-as/delete buttons
                if (null === currentFileName) {
                    $('#file-save-btn').addClass('disabled');
                    $('#file-save-btn .item-label').text('Save');
                    $('#file-delete-btn').addClass('disabled');
                    $('#file-delete-btn .item-label').text('Delete');
                } else {
                    $('#file-save-btn').removeClass('disabled');
                    $('#file-save-btn .item-label')
                        .text('Save \'' + currentFileName + '\'');
                    $('#file-delete-btn').removeClass('disabled');
                    $('#file-delete-btn .item-label').
                        text('Delete \'' + currentFileName + '\'');
                }
                // Update load buttons
                $('.file-load-btn').remove();
                for (var i = 0; i < localStorage.length; i++) {
                    var fileName = localStorage.key(i);
                    var loadBtn = $('<tr />')
                        .addClass('dropdown-item file-load-btn')
                        .data('name', fileName);
                    var loadBtnLabel = $('<td />')
                        .addClass('item-label')
                        .text('Load \'' + fileName + '\'');
                    var loadBtnShortcut = $('<td />');
                    loadBtn.append(loadBtnLabel).append(loadBtnShortcut);
                    loadBtn.on('click', (function(fileName) {
                        return function(e) {
                            currentFileName = fileName;
                            ui.setCode(localStorage.getItem(currentFileName));
                            updateFileMenuItems();
                        };
                    })(fileName));
                    $('#file-menu .dropdown-menu').append(loadBtn);
                }
            }
            $('#file-save-btn').on('click', function(e) {
                if (null === currentFileName) {
                    return;
                }
                if (!checkForLocalStorage()) {
                    if (!warnedAboutLocalStorage) {
                        alert('Local storage must be enabled for saving code.');
                        warnedAboutLocalStorage = true;
                    }
                }
                localStorage.setItem(currentFileName, ui.getCode());
            });
            $('#file-save-as-btn').on('click', function(e) {
                var newFileName = prompt('New file name:');
                if (null === newFileName) {
                    return;
                }
                currentFileName = newFileName;
                updateFileMenuItems();
                $('#file-save-btn').trigger('click');
            });
            $('#file-delete-btn').on('click', function(e) {
                if (null === currentFileName) {
                    return;
                }
                localStorage.removeItem(currentFileName);
                currentFileName = null;
                updateFileMenuItems();
            });
            updateFileMenuItems();

            // Listen for clicks of view menu buttons
            $('#focus-player-btn').on('click', function(e) {
                game.viewToPlayer();
            });
            $('#focus-bounds-btn').on('click', function(e) {
                game.viewToBounds();
            });
            $('#debug-mode-btn').on('click', function(e) {
                game.toggleDebugMode();
            });
            $('#zoom-in-btn').on('click', function(e) {
                game.viewScale(zoomFactor);
            });
            $('#zoom-out-btn').on('click', function(e) {
                game.viewScale(1 / zoomFactor);
            });
            $('#pan-left-btn').on('click', function(e) {
                game.viewTranslate(arrowPanDist, 0);
            });
            $('#pan-up-btn').on('click', function(e) {
                game.viewTranslate(0, arrowPanDist);
            });
            $('#pan-right-btn').on('click', function(e) {
                game.viewTranslate(-arrowPanDist, 0);
            });
            $('#pan-down-btn').on('click', function(e) {
                game.viewTranslate(0, -arrowPanDist);
            });

            // Set up restart/run button listeners
            runBtn.on('click', function(e) {
                e.preventDefault();
                switch (state) {
                case 'running':
                    game.pause();
                    break;
                case 'paused':
                    game.run();
                    break;
                case 'waiting':
                default:
                    // Do nothing
                    break;
                }
            });
            restartBtn.on('click', function(e) {
                e.preventDefault();
                game.install(ui.getCode());
                game.restart();
            });

            // Set the initial state
            exports.setState('waiting');
            exports.hideLevels();
        });
    };
});
