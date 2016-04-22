(function() {
    "use strict";

    var root = this;
    var Tournament = root.Tournament;
    var helpers = Tournament.helpers;

    var defaultConfig = {
        // Number - Width of a round
        roundWidth: 80,

        // Number - Space between round
        roundSpacing: 30
    }

    Tournament.Match = Tournament.Element.extend({
        display: true,
        inRange: function(tx, ty) {
            return false;
        },
        draw: function() {
            if (this.display) {
                var player1 = new Tournament.Player({
                    ctx: this.ctx,
                    x: this.x,
                    y: this.y,
                    width: this.width,
                    height: this.height / 2,
                    strokeColor: this.strokeColor,
                    fillColor: this.fillColor,
                    strokeWidth: this.strokeWidth,
                    showStroke: this.showStroke
                });

                var player2 = new Tournament.Player({
                    ctx: this.ctx,
                    x: this.x,
                    y: this.y + this.height / 2,
                    width: this.width,
                    height: this.height - this.height / 2,
                    strokeColor: this.strokeColor,
                    fillColor: this.fillColor,
                    strokeWidth: this.strokeWidth,
                    showStroke: this.showStroke
                });

                player1.draw();
                player2.draw();

                // TODO draw connecting line between match
            }
        }
    })

    Tournament.Type.extend({

        name: "Elimination",
        defaults: defaultConfig,

        initialize: function(data) {
            this.matches = [];

            data = this.generateDummyData();
            console.log(this.defaults);

            helpers.each(data.matches, function(match, index) {
                this.matches.push(new Tournament.Match({
                    ctx: this.tournament.ctx,
                    x: match.group * this.defaults.roundWidth + match.group * this.defaults.roundSpacing + 5,
                    y: match.position + 5,
                    width: this.defaults.roundWidth,
                    height: data.meta.height,
                    strokeColor: "red",
                    fillColor: "orange",
                    strokeWidth: 1,
                    showStroke: true
                }));
            }, this);

            this.render();
        },

        draw: function() {
            helpers.each(this.matches, function(match, index) {
                match.draw();
            }, this);
        },

        generateDummyData: function() {
            return {
                meta: {
                    height: 25
                },
                matches: [
                    {
                        group: 0,
                        position: 0,
                    },
                    {
                        group: 0,
                        position: 40
                    },
                    {
                        group: 0,
                        position: 80
                    },
                    {
                        group: 0,
                        position: 120
                    },
                    {
                        group: 1,
                        position: 20
                    },
                    {
                        group: 1,
                        position: 100
                    },
                    {
                        group: 2,
                        position: 60
                    }
                ]
            }
        }
    })
}).call(this);