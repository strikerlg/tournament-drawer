"use strict";

var defaultConfig = {
    // Number - Width of a round
    roundWidth: 120,

    // Number - Space between round
    roundSpacing: 60,

    textStyle: "10px Open Sans",

    strokeColor: "#ddd",

    scaleToFit: true,

    roundsPerPage: 3
}

helpers.powerOf2 = [1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048];

helpers.roundName = function(round) {
    switch (round) {
        case 0: return "Final";
        case 1: return "Semi-Final";
        case 2: return "Quater-Final";
        default: return "Round of " + helpers.powerOf2[round + 1];
    }
}

Tournament.Match = class extends Tournament.Element {
    constructor(configuration) {
        super(configuration);

        this.connectPoints = [];
        this.display = true;

        this.createPlayer();
    }

    inRange(tx, ty) {
        return tx > this.x && ty > this.y && tx < this.x + this.width && ty < this.y + this.height;
    }

    addLink(match) {
        var connectPoint = {};
        connectPoint.x = match.x + match.width;
        connectPoint.y = match.y + match.height / 2;

        this.connectPoints.push(connectPoint);
    }

    highlight(tx, ty) {
        if (this.player1 != null && this.player1.inRange(tx, ty)) {
            this.player1.fillColor = '#ddd';
            this.player2.fillColor = '#fff';
        }
        else if (this.player2 != null) {
            this.player1.fillColor = '#fff';
            this.player2.fillColor = '#ddd';
        }
    }

    highlightPlayer(playerName) {
        if (this.player1 != null) this.player1.fillColor = '#fff';
        if (this.player2 != null) this.player2.fillColor = '#fff';

        if (playerName == null) return null;

        if (this.player1 != null && this.player1.player == playerName) {
            this.player1.fillColor = '#ddd';
        }
        else if (this.player2 != null && this.player2.player == playerName) {
            this.player2.fillColor = '#ddd';
        }
    }

    unHighlight() {
        if (this.player1 != null) this.player1.fillColor = '#fff';
        if (this.player2 != null) this.player2.fillColor = '#fff';
    }

    draw() {
        if (this.display) {
            this.player1.draw();
            this.player2.draw();

            for (var point of this.connectPoints) {
                ctx.beginPath();
                ctx.moveTo(this.x, this.y + this.height / 2);
                ctx.lineTo((this.x + point.x) / 2, this.y + this.height / 2);
                ctx.lineTo((this.x + point.x) / 2, point.y);
                ctx.lineTo(point.x, point.y);
                ctx.stroke();
            }
        }
    }

    selectedPlayer(tx, ty) {
        if (this.player1 != null && this.player1.inRange(tx, ty)) {
            return this.player1.player;
        }
        else if (this.player2 != null) {
            return this.player2.player;
        }

        return '$$';
    }

    createPlayer() {
        this.player1 = new Tournament.Player({
                ctx: this.ctx,
                x: this.x,
                y: this.y,
                width: this.width,
                height: this.height / 2,
                strokeColor: this.strokeColor,
                fillColor: this.fillColor,
                showStroke: this.showStroke,
                player: this.player1,
                score: this.score1
            });

        this.player2 = new Tournament.Player({
            ctx: this.ctx,
            x: this.x,
            y: this.y + this.height / 2,
            width: this.width,
            height: this.height - this.height / 2,
            strokeColor: this.strokeColor,
            fillColor: this.fillColor,
            showStroke: this.showStroke,
            player: this.player2,
            score: this.score2
        });
    }
}

Tournament.Elimination = class extends Tournament.Type {
    constructor(data, options, ctx) {
        options = helpers.merge(defaultConfig, options || {});
        super(data, options, ctx);

        var options = this.options;

        if (options.scaleToFit) {
            options.roundWidth = Math.floor(
                (this.ctx.canvas.width - 2 * options.roundSpacing - options.padding * 2) / options.roundsPerPage
            );
        }

        this.groups = [];
        helpers.each(data.groups, function(group, index) {
            this.groups.push(new Tournament.Cell({
                ctx: this.ctx,
                x: index * options.roundWidth + index * options.roundSpacing + options.padding,
                y: options.padding,
                width: options.roundWidth,
                height: data.meta.height / 2,
                strokeColor: options.strokeColor,
                fillColor: options.barColor,
                text: group
            }));

        }, this);

        this.matches = [];
        var maxHeight = 0;
        var maxWidth = 0;
        helpers.each(data.matches, function(match, index) {
            this.matches.push(new Tournament.Match({
                ctx: this.ctx,
                x: match.group * options.roundWidth + match.group * options.roundSpacing + options.padding,
                y: match.position + options.padding + data.meta.height,
                width: options.roundWidth,
                height: data.meta.height,
                strokeColor: options.strokeColor,
                fillColor: options.barColor,
                player1: match.player1,
                player2: match.player2,
                score1: match.score1,
                score2: match.score2,
                raw: match
            }));

            if (match.link1 != null)
                this.matches[this.matches.length - 1].addLink(this.matches[match.link1]);
            if (match.link2 != null)
                this.matches[this.matches.length - 1].addLink(this.matches[match.link2]);

            maxHeight = Math.max(maxHeight, this.matches[this.matches.length - 1].y + data.meta.height);
            maxWidth = Math.max(maxWidth, this.matches[this.matches.length - 1].x + options.roundWidth);
        }, this);

        this.ctx.canvas.height = maxHeight + options.padding;
        if (options.scaleToFit) {
            this.ctx.canvas.width = maxWidth + options.padding;
        }
        this.ctx.translate(0.5, 0.5);
        this.translate = { x: -.5, y: -.5 };

        this.roundIndex = 0;

        this.bindHightlightEvent();

        this.render();
    }

    bindHightlightEvent() {
        var self = this;

        this.ctx.canvas.addEventListener('mousemove', function(e) {
            var mousePos = Tournament.helpers.getMousePos(self.ctx.canvas, e, self.translate);
            var playerName = '$$';

            document.body.style.cursor = 'default';
            for (let match of self.matches) {
                if (match.inRange(mousePos.x, mousePos.y)) {
                    document.body.style.cursor = 'pointer';
                    playerName = match.selectedPlayer(mousePos.x, mousePos.y);
                    break;
                }
            }

            for (let match of self.matches) {
                match.highlightPlayer(playerName);
            }

        });
    }

    addMatchClickEventListener(listener) {
        var self = this;

        this.ctx.canvas.addEventListener('click', function(e) {
            var mousePos = Tournament.helpers.getMousePos(self.ctx.canvas, e, self.translate);

            for (var match of self.matches) {
                if (match.inRange(mousePos.x, mousePos.y))
                    return listener(match);
            }
        });
    }

    draw() {
        this.clear();

        ctx.font = this.options.textStyle;

        for (let group of this.groups) {
            group.draw();
        }

        for (let match of this.matches) {
            match.draw();
        }
    }

    next() {
        if (!this.options.scaleToFit) {
            var nextRoundIndex = this.roundIndex + 1;

            if (nextRoundIndex >= 0 && nextRoundIndex + this.options.roundsPerPage <= this.groups.length) {
                this.ctx.translate(- this.options.roundWidth - this.options.roundSpacing, 0);
                this.translate.x -= - this.options.roundWidth - this.options.roundSpacing;

                this.draw();

                this.roundIndex = nextRoundIndex;
            }
        }
    }

    prev() {
        if (!this.options.scaleToFit) {
            var nextRoundIndex = this.roundIndex - 1;

            if (nextRoundIndex >= 0 && nextRoundIndex + this.options.roundsPerPage <= this.groups.length) {
                this.ctx.translate(this.options.roundWidth + this.options.roundSpacing, 0);
                this.translate.x -= this.options.roundWidth + this.options.roundSpacing;

                this.draw();

                this.roundIndex = nextRoundIndex;
            }
        }
    }
}

// Static functions

Tournament.Elimination.generate = function(type, options) {
    var result = {
        meta: {
            height: 50
        }
    };

    result.groups = [];
    for (var i = 0; i < options.round; i++)
        result.groups.push(helpers.roundName(options.round - 1 - i));

    var dist = 80;

    result.matches = [];
    if (type === 'single') {
        for (var i = 0; i < options.round; i++) {
            var numMatches = helpers.powerOf2[options.round - 1 - i];

            var prevPos = -dist;
            for (var j = 0; j < numMatches; j++) {
                var match = {
                    group: i,
                    position: prevPos + dist
                }

                if (i != 0) {
                    var numMatchesInPrevRound = helpers.powerOf2[options.round - i];

                    match.link1 = result.matches.length - numMatchesInPrevRound + j;
                    match.link2 = result.matches.length - numMatchesInPrevRound + j + 1;
                    match.position = Math.floor(
                        (result.matches[match.link1].position + result.matches[match.link2].position) / 2
                    );
                }

                result.matches.push(match);

                prevPos = match.position;
            }
        }

    }
    else {
        // currently only support single elimination
    }

    return result;
}
