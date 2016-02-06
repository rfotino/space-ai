/**
 * Copyright (c) 2015 Robert Fotino.
 */

var menu = {
    /**
     * setState(state);
     * Sets the menu state to 'running', 'paused', or 'waiting'.
     */
    setState: function(state) { },
    /**
     * showLevels();
     * Shows the level selector.
     */
    showLevels: function() { },
    /**
     * hideLevels();
     * Hides the level selector.
     */
    hideLevels: function() { },
    /**
     * isVisibleLevels();
     * Returns true if the level selector is visible.
     */
    isVisibleLevels: function() { },
    /**
     * selectPrevLevel();
     * Changes the selected level to the previous one.
     */
    selectPrevLevel: function() { },
    /**
     * selectNextLevel();
     * Changes the selected level to the next one.
     */
    selectNextLevel: function() { },
    /**
     * loadSelectedLevel();
     * Loads the select level, or does nothing if no level selected.
     */
    loadSelectedLevel: function() { }
};

$(document).ready(function() {
    var state, selectedLevel = null,
        showLevelsBtn = $('#show-levels'), hideLevelsBtn = $('#hide-levels'),
        loadLevelBtn = $('#load-level'), restartBtn = $('#restart'),
        runBtn = $('#run'), levelDivsArr = [];

    // Set up level selector interface
    var levelsDiv = $('#levels');
    for (var i = 0; i < levels.length; i++) {
        var level = levels[i];
        var div = $('<div class="level" />');
        // Get the bounding box of the initial level, used for the thumbnail
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
        div.on('dblclick', function(e) { loadLevelBtn.trigger('click'); });
        levelsDiv.append(div);
        // Draw the thumbnail
        var ctx = thumbnail[0].getContext('2d');
        level.viewport.fixToBounds(levelBounds, canvasWidth, canvasHeight);
        level.draw(ctx);
        // Add to level divs array
        levelDivsArr.push({
            level: level,
            div: div
        });
    }

    // Define public menu functions
    menu.setState = function(newState) {
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
    menu.showLevels = function() {
        $('#level-selector').show();
    };
    menu.hideLevels = function() {
        $('#level-selector').hide();
    };
    menu.isVisibleLevels = function() {
        return $('#level-selector').is(':visible');
    };
    var scrollLevelsDivTo = function(div) {
        levelsDiv.scrollTop(levelsDiv.scrollTop() + div.position().top - 55);
    };
    menu.selectPrevLevel = function() {
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
    menu.selectNextLevel = function() {
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
    menu.loadSelectedLevel = function() {
        loadLevelBtn.trigger('click');
    };
    // Set the initial state
    menu.setState('waiting');
    menu.hideLevels();

    // Set up show/hide/load button listeners for level selector
    showLevelsBtn.on('click', function(e) {
        e.preventDefault();
        menu.showLevels();
    });
    hideLevelsBtn.on('click', function(e) {
        e.preventDefault();
        menu.hideLevels();
    });
    loadLevelBtn.on('click', function(e) {
        e.preventDefault();
        if (selectedLevel) {
            menu.hideLevels();
            showLevelsBtn.text(selectedLevel.name);
            game.load(selectedLevel);
        }
    });
    loadLevelBtn.addClass('disabled');

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
});
