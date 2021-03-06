let currencyTextObj = null;
let leaderboardDrawn = false;
let backpackDrawn = false;
let teamDrawn = false;

// prices
let pokeballPrice = 50;
let masterballPrice = 750;
let fullrestorePrice = 300;
let etherPrice = 200;
let overloadPrice = 150;
let lasooCost = 250;

var itemIdToMap = new Object(); // or var map = {};
itemIdToMap[0] = pokeballPrice;
itemIdToMap[1] = masterballPrice;
itemIdToMap[2] = overloadPrice;
itemIdToMap[3] = fullrestorePrice;
itemIdToMap[4] = etherPrice;
itemIdToMap[5] = lasooCost;


var Game = {
	players: {}
}

Game.init = function() {

	Game.ready = false;
	//Game.easystar = new EasyStar.js();
	Game.leaderboard = [];
	Game.playerFrozen = false;
};

Game.shutdown = function() {
	console.log('test!');
	game.world.removeAll();

	Game.chunkId = false;
	Game.player.sprite = undefined;
	Game.ready = false;
}

Game.update = function() {

	// We're in a different chunk.
	let chunkId = net.getCurrentChunkId();
	if (chunkId != Game.chunkId) {
		this.loadCurrentChunk(true);
		//Game.chunkId = net.chunkId;
		return;
	}

	if (this.cursors == undefined || Battle.inBattle || Game.playerFrozen) {
		return;
	}

	if (this.cursors.left.isDown) {
		this.player.step('left', (this.cursors.left.shiftKey) ? 2 : 1);
	} else if (this.cursors.right.isDown) {
		this.player.step('right', (this.cursors.right.shiftKey) ? 2 : 1);
	} else if (this.cursors.up.isDown) {
		this.player.step('up', (this.cursors.up.shiftKey) ? 2 : 1)
	} else if (this.cursors.down.isDown) {
		this.player.step('down', (this.cursors.down.shiftKey) ? 2 : 1);
	}

};

Game.preload = function() {
	game.stage.disableVisibilityChange = true;
	game.load.image('tileset', 'assets/tilesets/tileset.png');

	game.load.atlasJSONHash('atlas1', 'assets/sprites/pokemon_atlas1.png', 'assets/sprites/pokemon_atlas1.json');
	game.load.atlasJSONHash('atlas2', 'assets/sprites/pokemon_atlas2.png', 'assets/sprites/pokemon_atlas2.json');
	game.load.atlasJSONHash('attacks', 'assets/pokemon/attacks.png', 'assets/pokemon/attacks.json');

	game.load.audio('battle', ['assets/audio/battle.mp3']);

	// loading hud images
    game.load.image('backpack', 'assets/HUD/backpack.png');
    game.load.image('trophy', 'assets/HUD/trophy.png');
    game.load.image('coin', 'assets/HUD/coin.png');
    game.load.image('coin_trade', 'assets/HUD/coin_old.png');
    game.load.image('logout', 'assets/HUD/logout.png');
    game.load.image('pokedex', 'assets/HUD/pokedex.png');

    game.load.image('pokeball', 'assets/HUD/pokeball.png');
    game.load.image('ether', 'assets/HUD/ether.png');
    game.load.image('lasso', 'assets/HUD/lasso.png');
    game.load.image('overload', 'assets/HUD/overload.png');
    game.load.image('fullrestore', 'assets/HUD/fullrestore.png');
    game.load.image('masterball', 'assets/HUD/masterball.png');
    game.load.image('coin_small', 'assets/HUD/coin_small.png');

    // loading font assets
    // game.load.bitmapFont('carrier_command', 'assets/fonts/carrier_command.png', 'assets/fonts/carrier_command.xml');
    game.load.bitmapFont('nokia16black', 'assets/fonts/nokia16black.png', 'assets/fonts/nokia16black.xml');

    // loading buttons
    game.load.image('challenge_button', 'assets/buttons/button_challenge.png');
    game.load.image('pending_challenge_button', 'assets/buttons/button_pending.png');
    game.load.image('up_arrow', 'assets/buttons/uparrow.png');
    game.load.image('down_arrow', 'assets/buttons/downarrow.png');
    game.load.image('x_icon', 'assets/buttons/x.png');
    game.load.image('trade', 'assets/buttons/button_trade.png');

	Battle.preload();
};


Game.create = function() {
	this.loadCurrentChunk(true);

	Game.ready = true;
	game.camera.roundPx = true;

	$("#chat-container").css('width', '300px').css('visibility', 'visible');

	$("#chat-input").on('keypress', function (e) {
         if (e.which === 13) {

        	let msg = $(this).val();

        	if (msg.length == 0) {
        		return;
        	}

            $(this).attr("disabled", "disabled");

            net.sendPacket(MESSAGE_TYPE.CHAT, {
            	message: msg
            });

            $(this).val('');
            $(this).removeAttr("disabled");
         }
         $(this).focus();
   });

};

Game.moveGroupTo = function(parent,group,endPos){
    // parent is the Phaser Group that contains the group to move (default: world)
    // group is the Phaser Group to be moved
    // endPos is the position (integer) at which to move it
    // if endPos is some group's z value, the moved group will be right below (visually) that group
    // This manipulation is needed because the rendering order and visual overlap of the sprites depend of the order of their groups
    var startPos = group.z-1;
    var diff = startPos-endPos;
    if(diff > 0){
        for(diff; diff > 0; diff--){
            parent.moveDown(group);
        }
    }else if(diff < 0){
        for(diff; diff < 0; diff++){
            parent.moveUp(group);
        }
    }
};


Game.drawLayers = function() {

	/* TODO: Cleanup */
	Game.layerNames = ['Base', 'Walk', 'Walkable', 'Collision', 'Top'];//, 'Bush'];
	Game.map.gameLayers = {};

	for(idx in Game.layerNames) {

		let layerName = Game.layerNames[idx];

		let group = (layerName != 'Top') ? Game.groundMapLayers : Game.highMapLayers;

		Game.map.gameLayers[layerName] = Game.map.createLayer(layerName, 0, 0, group);
		Game.map.gameLayers[layerName].resizeWorld();
	}

	Game.map.gameLayers['Base'].inputEnabled = true;
	Game.map.gameLayers['Base'].events.onInputUp.add(Game.handleMapClick, this);
	Game.drawHud();

	/*Game.moveGroupTo(game.world, Game.groundMapLayers, 0);
	Game.moveGroupTo(game.world, Game.entities, 1);
	Game.moveGroupTo(game.world, Game.highMapLayers, 2);
	Game.moveGroupTo(game.world, Game.HUD, 200);*/

	//game.world.sendToBack(Game.entities);
	//game.world.sendToBack(Game.highMapLayers);
	//game.world.sendToBack(Game.groundMapLayers);
	/*game.world.bringToTop(Game.entities);

	game.world.bringToTop(Game.highMapLayers);
	game.world.bringToTop(Game.HUD);*/
};

Game.handleMapClick = function(layer, pointer) {

	let coords = Game.computeTileCoords(pointer.worldX, Math.ceil((pointer.worldY - 16) / 16) * 16);

	/* Hack due to offset */
	if (coords.y == Game.map.height) {
		coords.y--;
	}

	if (!Game.playerFrozen) {
		Game.player.prepareMovement(coords);
	}
};

Game.computeTileCoords = function(x, y){
	let layer = Game.map.gameLayers['Base'];
	return new Phaser.Point(layer.getTileX(x), layer.getTileY(y));
};

Game.calculateCollisionMatrix = function(map) {

	/* Hack */

	let collisionMatrix = [];

	//collisionMatrix.push(Array(map.height).fill().map(() => 1))

	/* Dank Hack */
	for(let row = 0; row < map.height; row++) {

		let collsionRow = [];

		for(let col = 0; col < map.width; col++) {
			let tile = map.getTile(col, row, 'Collision', true);
			collsionRow.push(tile.index);
		}

		collisionMatrix.push(collsionRow);
	}

	return collisionMatrix;
};

Game.getMapElement = function(x, y, map) {
	if (map == undefined) {
		map = Game.map;
	}

	let coords = Game.computeTileCoords(x, y);
	return map.getFirst(coords.x, coords.y);
};

Game.clearPlayers = function() {
	for (var key in Game.players) {
	    if (Game.players.hasOwnProperty(key)) {

	    	// Hack
	    	let id = parseInt(key);
	    	let player = Game.players[id]

	    	if (player != undefined) {
	    		player.del();
	    	}


    		//Game.players[id] = undefined;
	    }
	}
}

Game.loadCurrentChunk = function(clear) {

	Game.chunkId = false;

	if (Game.map != undefined) {
		for(idx in Game.layerNames) {
			Game.map.gameLayers[Game.layerNames[idx]].destroy();
		}

		Game.map.destroy();
		game.world.removeAll();
	}

	let self = this;

	Game.clearPlayers();

	net.getChunk(function(chunk) {

		if (Game.groundMapLayers != undefined) {
			Game.groundMapLayers.destroy();
		}
		Game.groundMapLayers = game.add.group();


		if (Game.entities != undefined) {
			Game.entities.destroy();
		}
		Game.entities = game.add.group();

		if (Game.highMapLayers != undefined) {
			Game.highMapLayers.destroy();
		}
		Game.highMapLayers = game.add.group();


		if (Game.HUD != undefined) {
			Game.HUD.destroy();
		}
		Game.HUD = game.add.group();

    	// loading necessary libraries for drawing hud menu
		Game.slickUI = game.plugins.add(Phaser.Plugin.SlickUI);
		Game.slickUI.load('ui/kenney/kenney.json');

		Game.clearPlayers();

		game.cache.addTilemap(chunk.id, null, chunk.data, Phaser.Tilemap.TILED_JSON);

		Game.map = game.add.tilemap(chunk.id, 16, 16);
		Game.map.addTilesetImage('tileset', 'tileset', 16, 16);

		game.world.setBounds(0, 0, Game.map.widthInPixels, Game.map.heightInPixels);

		self.drawLayers();

		Game.collisionMatrix = self.calculateCollisionMatrix(Game.map);
		Game.easystar = new EasyStar.js();
		Game.easystar.setGrid(Game.collisionMatrix);
    		Game.easystar.setAcceptableTiles([-1]);

		// Hack
		Game.player.initSprite();
		Game.player.setVisible();
		Game.player.setCameraFocus(Game.camera);
		Game.clearPlayers();

		Game.cursors = game.input.keyboard.createCursorKeys();

		Game.chunkId = net.chunkId;
	});
};

Game.drawHud = function() {

	// hud grey bar
	let completionSprite = game.add.graphics(0, 0);
	completionSprite.beginFill(0x3d3d3d, 1);
	completionSprite.drawRect(Game.map.widthInPixels/1.5, Game.map.heightInPixels-0.51*Game.map.heightInPixels, Game.map.widthInPixels, Game.map.heightInPixels/10.4);
	completionSprite.boundsPadding = 0;
    completionSprite.fixedToCamera = true;
    completionSprite.inputEnabled = true;

    // hud white bar behind coins
    let whiteBar = game.add.graphics(0, 0);
  	whiteBar.beginFill(0xffffff, 1);
  	whiteBar.drawRect(Game.map.widthInPixels*0.85, Game.map.heightInPixels-0.53*Game.map.heightInPixels, Game.map.widthInPixels*0.15, Game.map.heightInPixels*0.02);
  	whiteBar.boundsPadding = 0;
    whiteBar.fixedToCamera = true;
    whiteBar.inputEnabled = true;

    // coin icon
  let coinIcon = game.add.sprite(Game.map.widthInPixels*0.85 + 4, Game.map.heightInPixels-0.53*Game.map.heightInPixels + 4, 'coin');
  //coinIcon.anchor.setTo(0.5, 0.5);
  coinIcon.inputEnabled = false;
  coinIcon.fixedToCamera = true;

    let coinText = game.add.bitmapText(Game.map.widthInPixels*0.85 + 24, Game.map.heightInPixels-0.53*Game.map.heightInPixels + 5, 'nokia16black', 'x'+Game.player.currency, 7.5*2);
    coinText.inputEnabled = false;
    coinText.fixedToCamera = true;
    currencyTextObj = coinText;

    // team management icon
    let teamIcon = game.add.sprite(Game.map.widthInPixels-Game.map.widthInPixels/4 - 35, Game.map.heightInPixels-Game.map.heightInPixels/2 + 35, 'pokedex');
    teamIcon.anchor.setTo(0.5, 0.5);
    teamIcon.inputEnabled = true;
    teamIcon.fixedToCamera = true;
    teamIcon.events.onInputDown.add(queueTeam, this);

    // backpack icon
    let backpackIcon = game.add.sprite(Game.map.widthInPixels-Game.map.widthInPixels/3 + 100, Game.map.heightInPixels-Game.map.heightInPixels/2.032, "backpack");
    backpackIcon.inputEnabled = true;
    backpackIcon.fixedToCamera = true;
    backpackIcon.events.onInputDown.add(queueBackpack, this);

	// trophy icon
	let trophyIcon = game.add.sprite(Game.map.widthInPixels-Game.map.widthInPixels/3 + 165, Game.map.heightInPixels-Game.map.heightInPixels/2.032, "trophy");
    trophyIcon.inputEnabled = true;
    trophyIcon.fixedToCamera = true;
    trophyIcon.events.onInputDown.add(queueLeaderboard, this);

    // logout button
	let logoutIcon = game.add.sprite(Game.map.widthInPixels-Game.map.widthInPixels/3 + 230, Game.map.heightInPixels-Game.map.heightInPixels/2.032 - 5, "logout");
    logoutIcon.inputEnabled = true;
    logoutIcon.fixedToCamera = true;
    logoutIcon.events.onInputDown.add(logout, this);
}



function drawLeadboard() {
	if (Battle.inBattle || !Game.ready) {
		return;
	}
	// leaderboard panel
	Game.panel = new SlickUI.Element.Panel(Game.map.widthInPixels/1.5, Game.map.heightInPixels/4.15, Game.map.widthInPixels/2, Game.map.heightInPixels/4);
	Game.slickUI.add(Game.panel);

	let header = new SlickUI.Element.Text(Game.panel.width/2 - 100 , 20, "Leaderboard:");

	for (let i = 0; i < Game.leaderboard.length; i++) {
		let usr = Game.leaderboard[i];
		let player = new SlickUI.Element.Text(Game.panel.width/2 - 100 , 65+27*i, (i+1)+ ". " + usr.name + " (" + usr.elo + ")");
		Game.panel.add(player);
	}

	let myElo = new SlickUI.Element.Text(Game.panel.width/2 - 100 , 65+29.6*Game.leaderboard.length, "My elo: " + Game.player.elo);
	Game.panel.add(myElo);
	Game.panel.add(header);
}

function drawBackpack() {
	if (Battle.inBattle || !Game.ready || !Game.slickUI.game.load.hasLoaded) {
		return;
	}
	// leaderboard panel

	Game.panel = new SlickUI.Element.Panel(Game.map.widthInPixels/1.5, Game.map.heightInPixels/4.15, Game.map.widthInPixels/2, Game.map.heightInPixels/4);
	Game.slickUI.add(Game.panel);

	let header = new SlickUI.Element.Text(Game.panel.width/2 - 130 , 20, "Backpack:");

	// let player1 = new SlickUI.Element.Text(Game.panel.width/2 - 100 , 65, "empty");
	let items = Game.player.items;

	let pokeball = game.add.sprite(0, 0, 'pokeball');
    pokeball.anchor.setTo(0.5, 0.5);
    pokeball.inputEnabled = true;
    let pokeballtext = new SlickUI.Element.Text(Game.panel.width/3.8, 58, "x"+mapGet(items, 0, 0));
    pokeballtext.size = 9.5;
    let pokeballpricetext = new SlickUI.Element.Text(Game.panel.width/9.2, 58+63, "Cost: " + pokeballPrice);
    pokeballpricetext.size = 9.5;
    pokeball.events.onInputDown.add(function() {
    	renderItemPurchase(0);
    });

    let masterball = game.add.sprite(0, 0, 'masterball');
    masterball.anchor.setTo(0.5, 0.5);
    masterball.inputEnabled = true;
    let masterballtext = new SlickUI.Element.Text(Game.panel.width/3.8, 58 + 100, "x"+mapGet(items, 1, 0));
    masterballtext.size = 9.5;
    let masterballpricetext = new SlickUI.Element.Text(Game.panel.width/9.2, 58+100+63, "Cost: " + masterballPrice);
    masterballpricetext.size = 9.5;
    masterball.events.onInputDown.add(function() {
    	renderItemPurchase(1);
    });

    let fullrestore = game.add.sprite(0, 0, 'fullrestore');
    fullrestore.anchor.setTo(0.5, 0.5);
    fullrestore.inputEnabled = true;
    let fullrestoretext = new SlickUI.Element.Text(Game.panel.width/3.8 + 100, 58, "x"+mapGet(items, 3, 0));
    fullrestoretext.size = 9.5;
    let fullrestorepricetext = new SlickUI.Element.Text(Game.panel.width/9.2+100, 58+63, "Cost: " + fullrestorePrice);
    fullrestorepricetext.size = 9.5;
    fullrestore.events.onInputDown.add(function() {
    	renderItemPurchase(3);
    });

    let overload = game.add.sprite(0, 0, 'overload');
    overload.anchor.setTo(0.5, 0.5);
    overload.scale.setTo(0.2, 0.2);
    overload.inputEnabled = true;
    let overloadtext = new SlickUI.Element.Text(Game.panel.width/3.8 + 200, 58, "x"+mapGet(items, 2, 0));
    overloadtext.size = 9.5;
    let overloadpricetext = new SlickUI.Element.Text(Game.panel.width/9.2+200, 58+63, "Cost: " + overloadPrice);
    overloadpricetext.size = 9.5;
    overload.events.onInputDown.add(function() {
    	renderItemPurchase(2);
    });

    let ether = game.add.sprite(0, 0, 'ether');
    ether.anchor.setTo(0.5, 0.5);
    let ethertext = new SlickUI.Element.Text(Game.panel.width/3.8 + 100, 58 + 100, "x"+mapGet(items, 4, 0));
    ethertext.size = 9.5;
    let etherpricetext = new SlickUI.Element.Text(Game.panel.width/9.2+100, 58+100+63, "Cost: " + etherPrice);
    etherpricetext.size = 9.5;
    ether.inputEnabled = true;
    ether.events.onInputDown.add(function() {
    	renderItemPurchase(4);
    });

    let lasso = game.add.sprite(0, 0, 'lasso');
    lasso.anchor.setTo(0.5, 0.5);
    let lassotext = new SlickUI.Element.Text(Game.panel.width/3.8 + 200, 58 + 100, "x"+mapGet(items, 5, 0));
    lassotext.size = 9.5;
    let lassopricetext = new SlickUI.Element.Text(Game.panel.width/9.2+200, 58+63+100, "Cost: " + lasooCost);
    lassopricetext.size = 9.5;
    lasso.inputEnabled = true;
    lasso.events.onInputDown.add(function() {
    	renderItemPurchase(5);
    });

    Game.panel.add(header);
    Game.panel.add(new SlickUI.Element.DisplayObject(Game.panel.width/6, Game.panel.height/2.75, pokeball));
    Game.panel.add(new SlickUI.Element.DisplayObject(Game.panel.width/6 + 100, Game.panel.height/2.75, fullrestore));
    Game.panel.add(new SlickUI.Element.DisplayObject(Game.panel.width/6 + 200, Game.panel.height/2.75, overload));
    Game.panel.add(new SlickUI.Element.DisplayObject(Game.panel.width/6, Game.panel.height/2.75 + 100, masterball));
    Game.panel.add(new SlickUI.Element.DisplayObject(Game.panel.width/6 + 100, Game.panel.height/2.75 + 100, ether));
    Game.panel.add(new SlickUI.Element.DisplayObject(Game.panel.width/6 + 200, Game.panel.height/2.75 + 100, lasso));

	Game.panel.add(pokeballtext);
    Game.panel.add(overloadtext);
    Game.panel.add(masterballtext);
    Game.panel.add(fullrestoretext);
    Game.panel.add(lassotext);
    Game.panel.add(ethertext)

    Game.panel.add(pokeballpricetext);
    Game.panel.add(masterballpricetext);
    Game.panel.add(fullrestorepricetext);
    Game.panel.add(overloadpricetext);
    Game.panel.add(etherpricetext);
    Game.panel.add(lassopricetext);


}
function queueLeaderboard() {
	if (Battle.inBattle || !Game.ready || !Game.slickUI.game.load.hasLoaded) {
		return;
	}


	if (backpackDrawn || teamDrawn) {
		if (Game.panel.container != undefined) {
            Battle.clearButtons(Game.pokemonButtons);
			Game.panel.destroy();
			backpackDrawn = false;
			teamDrawn = false
		}
        leaderboardDrawn = true;
        drawLeadboard();
	} else if (leaderboardDrawn) {
        if (Game.panel.container != undefined) {
            Battle.clearButtons(Game.pokemonButtons);
            Game.panel.destroy();
            leaderboardDrawn = false;
        }
	} else {
		leaderboardDrawn = true;
        drawLeadboard();
	}
}

function queueBackpack() {
	if (Battle.inBattle || !Game.ready || !Game.slickUI.game.load.hasLoaded) {
		return;
	}

    if (leaderboardDrawn || teamDrawn) {
        if (Game.panel.container != undefined) {
            Battle.clearButtons(Game.pokemonButtons);
            Game.panel.destroy();
            leaderboardDrawn = false;
            teamDrawn = false
        }
        backpackDrawn = true;
        drawBackpack();
    } else if (backpackDrawn) {
        if (Game.panel.container != undefined) {
            Battle.clearButtons(Game.pokemonButtons);
            Game.panel.destroy();
            backpackDrawn = false;
        }
    } else {
        backpackDrawn = true;
        drawBackpack();
    }
};

function queueTeam() {

	if (Battle.inBattle || !Game.ready || !Game.slickUI.game.load.hasLoaded) {
		return;
	}

    if (leaderboardDrawn || backpackDrawn) {
        if (Game.panel.container != undefined) {
            Battle.clearButtons(Game.pokemonButtons);
            Game.panel.destroy();
            leaderboardDrawn = false;
            backpackDrawn = false
        }
        teamDrawn = true;
        drawTeam();
    } else if (teamDrawn) {
        if (Game.panel.container != undefined) {
        	try {
	            Battle.clearButtons(Game.pokemonButtons);
	            Game.panel.destroy();
	        } catch(err) {
	        	console.log(err);
	        }
            teamDrawn = false;
        }
    } else {
        teamDrawn = true;
        drawTeam();
    }
};

async function drawTeam() {
	if (Battle.inBattle || !Game.ready || !Game.slickUI.game.load.hasLoaded) {
		return;
	}

    Game.panel = new SlickUI.Element.Panel(Game.map.widthInPixels/1.5, 0, Game.map.widthInPixels/2, game.height - 98);
    Game.slickUI.add(Game.panel);

    Game.pokemonButtons = [];

    let buttonWidth = Game.panel.width;
    let buttonHeight = Game.panel.height / 5;

    let allPokemon = Game.player.pokemon;
    let pokemonCount = allPokemon.length;

    let team = [];

    for (let x = 0; x < pokemonCount; x++){
    	let pokemon = allPokemon[x];
    	if (!pokemon.stored) {
    		team.push(pokemon);
		}
	}

    for (let i = 0; i < team.length; i++) {
        let pokemon = team[i];


        if (Game.player.activePokemon == undefined) {
            Game.player.activePokemon = pokemon.id;
        }

        let pokeButton = new SlickUI.Element.Button(0, i * buttonHeight, buttonWidth, buttonHeight);


        Game.panel.add(pokeButton);

        Phaser.Canvas.setImageRenderingCrisp(game.canvas);

        let text = new SlickUI.Element.Text(100, 5, ucfirst(pokemon.nickname));
        let level = new SlickUI.Element.Text(225, 5, 'Lvl: ' + String(pokemon.level));

        const y = (buttonHeight * (1 + i)) + 30;

        let hp = new SlickUI.Element.Text(80, 26, 'HP: ');
        let exp = new SlickUI.Element.Text(80, 56, 'EXP: ');

        Battle.custDrawFrontPokemon(pokemon, function(key) {
            pokeButton.events.onInputUp.removeAll();

            pokeButton.pokeId = pokemon.id;

            let sprite = game.add.sprite(0, 0, key);
            sprite.visible = true;

            if (pokemon.id == Game.player.activePokemon) {
                pokeButton.sprite.loadTexture(pokeButton.spriteOn.texture);
            }

            if (pokemon.health > 0) {
                pokeButton.events.onInputDown.add(function() {

                    for(let i = 0; i < Game.pokemonButtons.length; i++) {
                        let x = Game.pokemonButtons[i];

                        if (x.sprite == undefined) {
                            continue;
                        }
                        x.sprite.loadTexture(x.spriteOff.texture);
                    }

                    net.sendPacket(MESSAGE_TYPE.UPDATE_ACTIVE_POKEMON, {
                        pokemon_id: pokemon.id
                    });

                    Game.player.activePokemon = pokeButton.pokeId;
                    pokeButton.sprite.loadTexture(pokeButton.spriteOn.texture);

                });
            } else {
                pokeButton.inputEnabled = false;
                pokeButton.events.onInputDown.removeAll();
                pokeButton.events.onInputUp.removeAll();
            }


            let h = 65 / sprite.height;
            let w = 65 / sprite.width;

            let s = Math.min(w, h);

            sprite.scale.set(s, s);
            sprite.anchor.setTo(0.5, 0.5);
            sprite.x = Game.panel.x + 55;
            sprite.y = y - 75;

            sprite.fixedToCamera = true;

            Game.pokemonButtons.push(sprite);
        });

        let healthbar = this.game.add.plugin(Phaser.Plugin.HealthMeter);
        healthbar.bar(pokemon, {
           x: Game.panel.x + 125,
           y: y - 85,
           width: 175,
           height: 5
        });

        let currExp = pokemon.currExp - pokemon.currLvlExp;
        let expToLevelUp = pokemon.nextExp - pokemon.currLvlExp;

        if (pokemon.level >= 100){
        	currExp = 100;
        	expToLevelUp = 100;
		}

		let experience = {
        	health: currExp,
            maxHealth: expToLevelUp
        };

        let expbar = this.game.add.plugin(Phaser.Plugin.HealthMeter);
        expbar.bar(experience, {
            x: Game.panel.x + 125,
            y: y - 55,
            width: 175,
            height: 5,
			foreground: '#3884ff'
        });

        text.size = 12;
        level.size = 12;
        hp.size = 12;
        exp.size = 12;
        pokeButton.add(hp);
        pokeButton.add(text);
        pokeButton.add(level);
        pokeButton.add(exp);

       /* if (Game.player.activePokemon == pokemon.id || pokemon.id == 2) {
        	console.log('testsetesttestess');
            Game.activePokemonBox = game.add.graphics(0, 0);
            Game.activePokemonBox.lineStyle(3, 0x1EA7E1, 1);
            console.log(Game.panel.x, i * buttonHeight, pokeButton.width, pokeButton.height);


           // Game.activePokemonBox.drawRect(Game.panel.x, i * buttonHeight, pokeButton.width, pokeButton.height);

			//await Game.panel.x;
            Game.activePokemonBox.drawRect(Game.panel.x + 4, (i * (buttonHeight + 4)), buttonWidth, buttonHeight);
            Game.activePokemonBox.fixedToCamera = true;



            Game.activePokemonBox.visible = true;

            //Game.HUD.add(Game.activePokemonBox)
		}*/

        Game.pokemonButtons.push(healthbar);
        Game.pokemonButtons.push(expbar);
        Game.pokemonButtons.push(pokeButton);
    }


};

function logout() {

	if (Battle.inBattle) {
		return;
	}

    console.log('clicked!');
    Cookies.remove("id");
    Cookies.remove("token");
    location.reload();
}
