import Phaser from 'phaser';
import { GenerateObjective } from './GenerateObjective';
import { createCard } from './createCard.js';
import { createCardSlot } from './createCardSlot.js';
import { NumberCard, OperatorCard } from './Card.ts';


/**
 * Game UI Scene
 * Handles the user interface elements of the game.
 */
export class GameUI extends Phaser.Scene {
    constructor() {
        super({ key: 'GameUI' });
    }

    create() {
        this.scene.bringToTop();
        const { width: W, height: H } = this.sys.game.scale;
        this.input.dragDistanceThreshold = 8; // Set a threshold for drag distance to avoid accidental drags

        // Layout constants
        const M = 12; // margin
        const SIDEBAR_W = 170;
        const DECK_W = 120;
        const MAIN_W = W - SIDEBAR_W - DECK_W - (M * 4);
        const MAIN_X = SIDEBAR_W + (M * 2);

        // UI helpers
        this.rect = (x, y, w, h, fill = 0x206030, alpha = 0.35, strokeColor = 0xffffff, strokeWidth = 2) => {
            // fill: green felt, stroke: white
            const r = this.add.rectangle(x, y, w, h, fill, alpha).setOrigin(0, 0);
            r.setStrokeStyle(strokeWidth, strokeColor, 0.7);
            return r;
        };
        this.labelBox = (x, y, w, h, text, options = {}) => {
            const group = this.add.container(x, y);
            const box = this.rect(0, 0, w, h, options.fill ?? 0x206030, options.alpha ?? 0.35, 0xffffff, 2);
            const t = this.add.text(w / 2, h / 2, text, {
                fontSize: options.fontSize ?? 16,
                color: options.color ?? '#ffffff', // white text
                fontStyle: options.fontStyle ?? 'bold',
                align: options.align ?? 'center',
                backgroundColor: options.bg ?? null,
                stroke: '#000000',
                strokeThickness: 2,
                shadow: {
                    offsetX: 2,
                    offsetY: 2,
                    color: '#000000',
                    blur: 2,
                    fill: true
                }
            }).setOrigin(0.5);
            group.add([box, t]);
            return { group, box, t };
        };

        // Score Board panel
        this.sidebar = this.rect(M, M, SIDEBAR_W, H - M * 2, 0x000000, 0.08);
        this.scoreTitle = this.add.text(M + SIDEBAR_W / 2, M + 14, 'Score Board', { fontSize: 18, color: '#000000' }).setOrigin(0.5);
        this.currentScore = this.labelBox(M + 12, M + 34, SIDEBAR_W - 24, 44, 'current game score');
        this.calcText = this.add.text(M + 16, M + 34 + 44 + 20, 'calculations?\nmayber multipliers or smth else', { fontSize: 12, color: '#333333', wordWrap: { width: SIDEBAR_W - 32 } });
        this.cumulated = this.labelBox(M + 12, H - M - 100, SIDEBAR_W - 24, 80, 'Cumulated score (previous game)\nvs\nScore needed to pass the level', { fontSize: 12 });

        // Health bar + Games counter
        this.healthBarBg = this.rect(MAIN_X, M, MAIN_W - 110, 22, 0xff0000, 0.15);
        this.healthBarFill = this.add.rectangle(MAIN_X + 2, M + 2, (MAIN_W - 110) - 4, 22 - 4, 0x2ecc71, 0.55).setOrigin(0, 0);
        this.healthHint = this.add.text(this.healthBarBg.x, this.healthBarBg.y - 12, 'Health bar\n(deduct health if objective is impossible for current hand)', { fontSize: 10, color: '#666666' }).setOrigin(0, 1);
        this.gamesCounter = this.labelBox(MAIN_X + MAIN_W - 92, M, 92, 30, '1 / 10');

        // Objective label
        this.objective = this.labelBox(MAIN_X + MAIN_W / 2 - 60, M + 70, 120, 36, '> 17', { fontSize: 20, fontStyle: 'bold' });
        this.objectiveCaption = this.add.text(this.objective.group.x + 60, this.objective.group.y - 6, 'Objective', { fontSize: 10, color: '#666666' }).setOrigin(0.5, 1);


        // -------------- Test Section remove any time
        this.objectiveTestLabel = this.add.text(MAIN_X + MAIN_W / 2 + 100, M + 75, 'Test Objective', {
            fontSize: 16,
            color: '#ffffff',
            fill: 0x3498db,
            alpha: 0.8,
            fontStyle: 'bold',
        });
        this.objectiveTestLabel.setInteractive();
        // when label box is clicked, call generateObjective
        this.objectiveTestLabel.on(Phaser.Input.Events.POINTER_DOWN, () => {
            this.setObjective();
        });
        // -----------------------------------------

        // Result slots
        this.resultBar = this.rect(MAIN_X + 40, this.objective.group.y + 50, MAIN_W - 80, 110, 0x000000, 0.05);
        this.equalsText = this.add.text(this.resultBar.x + this.resultBar.width + 8, this.resultBar.y + 40, '=  ?', { fontSize: 30, color: '#000000' });


        // Hand bar
        this.handBar = this.rect(MAIN_X + 20, this.resultBar.y + 150, MAIN_W - 40, 110, 0x000000, 0.05);
        this.handCaption = this.add.text(this.handBar.x + this.handBar.width / 2, this.handBar.y + this.handBar.height + 16, 'Cards, either operator(+,-,*,/) or number (0–9)', { fontSize: 12, color: '#666666' }).setOrigin(0.5, 0);


        // Containers for dynamic visuals
        this.resultContainer = this.add.container(0, 0).setDepth(1002);
        this.handContainer = this.add.container(0, 0).setDepth(1002);

        // Initialize with defaults
        this.setHealth(1);
        this.setGames('1 / 10');
        this.setObjective('> 17');
        this.setScore(0);
        this.createHandSlots(8);
        this.updateHand([1, 2, 3, 4, 'x', '+', '/']);
        this.createResultSlots(6);
        

        // Event handlers for UI updates
        this.game.events.on('ui:update', (payload = {}) => {
            if (typeof payload.health === 'number') this.setHealth(payload.health);
            if (typeof payload.games === 'string') this.setGames(payload.games);
            if (typeof payload.score === 'number' || typeof payload.score === 'string') this.setScore(payload.score);
            if (typeof payload.objective === 'string') this.setObjective(payload.objective);
        });
        this.game.events.on('ui:hand', (items = []) => this.updateHand(items));
        this.game.events.on('ui:result', (items = []) => this.updateResultSlots(items));

        this.createDragEvents();
    }

    setHealth(ratio) {
        const r = Phaser.Math.Clamp(ratio, 0, 1);
        const fullWidth = (this.healthBarBg.width - 4);
        this.healthBarFill.width = Math.max(0, fullWidth * r);
        this.healthBarFill.fillColor = r > 0.5 ? 0x2ecc71 : (r > 0.25 ? 0xf1c40f : 0xe74c3c);
    }
    setGames(txt) {
        this.gamesCounter.t.setText(txt);
    }
    setObjective(txt) {
        this.objective.t.setText(GenerateObjective());
    }
    setScore(val) {
        this.currentScore.t.setText(String(val));
    }
    createHandSlots(count) {
        const innerPad = 12, cardW = 60, cardH = 84;
        const innerW = this.handBar.width - innerPad * 2;
        const gap = Math.max(8, (innerW - count * cardW) / (count + 1));
        let x = this.handBar.x + innerPad + gap;
        const y = this.handBar.y + (this.handBar.height - cardH) / 2;

        this.handSlots = [];
        for (let i = 0; i < count; i++) {
            const slot = createCardSlot(this, x, y, cardW, cardH, {});
            this.handSlots.push(slot);
            this.handContainer.add(slot);
            x += cardW + gap;
        }
    }
    updateHand(items = []) {
        const cardW = 60, cardH = 84;

        for (let i = 0; i < this.handSlots.length; i++) {
            const slot = this.handSlots[i];
            const item = items[i];
            let cardObj;
            if (typeof item === 'number') {
                cardObj = new NumberCard(item);
            } else if (typeof item === 'string' && ['+', '-', '*', '/', '^'].includes(item)) {
                cardObj = new OperatorCard(item);
            } else {
                cardObj = new NumberCard(0); // placeholder
            }
            const isPlaceholder = items.length === 0;
            const card = createCard(this, 0, 0, cardW, cardH, cardObj, true, { fontSize: 22, color: '#222222' });
            if (isPlaceholder) {
                card.list[1].fillColor = 0xeeeeee;
                card.list[2].setText('');
            }
            slot.setCard(card);
            card.slot = slot; // link card to its slot
            this.handContainer.add(card);
            this.attachCardPointerListeners(card);
        }
    }
    createResultSlots(count) {
        const innerPad = 12, cardW = 60, cardH = 84;
        const innerW = this.resultBar.width - innerPad * 2;
        const gap = Math.max(8, (innerW - count * cardW) / (count + 1));
        let x = this.resultBar.x + innerPad + gap;
        const y = this.resultBar.y + (this.resultBar.height - cardH) / 2;

        this.resultSlots = [];
        for (let i = 0; i < count; i++) {
            const slot = createCardSlot(this, x, y, cardW, cardH, {});
            this.resultSlots.push(slot);
            this.resultContainer.add(slot);
            x += cardW + gap;
        }
    }
    updateResultSlots(items = []) {
        const cardW = 60, cardH = 84;
        for (let i = 0; i < this.resultSlots.length; i++) {
            const slot = this.resultSlots[i];
            const item = items[i];
            let cardObj;
            if (typeof item === 'number') {
                cardObj = new NumberCard(item);
            } else if (typeof item === 'string' && ['+', '-', '*', '/', '^'].includes(item)) {
                cardObj = new OperatorCard(item);
            } else {
                cardObj = new NumberCard(0); // placeholder
            }
            const isPlaceholder = items.length === 0;
            const card = createCard(this, 0, 0, cardW, cardH, cardObj, true, { fontSize: 22, color: '#222222' });
            if (isPlaceholder) {
                card.list[1].fillColor = 0xeeeeee;
                card.list[2].setText('');
            }
            slot.setCard(card);
            card.slot = slot;
            this.resultContainer.add(card);
            this.attachCardPointerListeners(card);
        }
    }

    // Create drag events to allow card movement
    createDragEvents() {
        this.createCardDragStartEventListener();
        this.createCardDragHoldEventListener();
        this.createCardDragEndEventListener();
    }

    createCardDragStartEventListener() {
        this.input.on(Phaser.Input.Events.DRAG_START, (pointer, gameObject) => {
            gameObject.setAlpha(0.85);
            if (gameObject.parentContainer) {
                gameObject.parentContainer.bringToTop(gameObject);
            }
            if (gameObject.shadow) {
                gameObject.shadow.setAlpha(0.4);
            }

            gameObject.setDepth(100);
        });
    }

    createCardDragHoldEventListener() {
        this.input.on(Phaser.Input.Events.DRAG, (pointer, gameObject, cursorDragX, cursorDragY) => {
            gameObject.setPosition(cursorDragX, cursorDragY)
        });
    }

    createCardDragEndEventListener() {
        this.input.on(Phaser.Input.Events.DRAG_END, (pointer, gameObject) => {
            gameObject.setAlpha(1);
            if (gameObject.shadow) {
                gameObject.shadow.setAlpha(1);
            }
            gameObject.setDepth(0);

            // Check both handSlots and resultSlots for hovered slot
            const allSlots = [...this.handSlots, ...(this.resultSlots || [])];
            const hoveredSlot = allSlots.find(slot => slot.isPointerOver(pointer));

            // return card to slot if not hovering over anything
            if (!hoveredSlot) {
                if (gameObject.slot) {
                    gameObject.slot.setCard(gameObject);
                }
                return;
            }

            if (hoveredSlot.card && hoveredSlot.card !== gameObject) {
                // swap cards around if hovering over different card
                const oldSlot = gameObject.slot;
                const replacedCard = hoveredSlot.card;

                hoveredSlot.setCard(gameObject);

                if (oldSlot) {
                    oldSlot.setCard(replacedCard);
                }

            } else {
                // if hovering over original slot, snap it back or move to empty slot
                hoveredSlot.setCard(gameObject)
            }
        });
    }

    // Attach pointer listeners to a card container for click/drag logic
    attachCardPointerListeners(card) {
        card.on('pointerdown', function (pointer) {
            this._wasDrag = false;
        });
        card.on('dragstart', function (pointer) {
            this._wasDrag = true;
        });
        card.on('pointerup', function (pointer) {
            if (!this._wasDrag) {
                // click-to-move logic: move to first empty slot in opposing bar
                const scene = this.scene;
                if (scene.handSlots && scene.handSlots.includes(this.slot)) {
                    const emptyResultSlot = (scene.resultSlots || []).find(s => !s.card);
                    if (emptyResultSlot) {
                        emptyResultSlot.setCard(this);
                    }
                } else if (scene.resultSlots && scene.resultSlots.includes(this.slot)) {
                    const emptyHandSlot = (scene.handSlots || []).find(s => !s.card);
                    if (emptyHandSlot) {
                        emptyHandSlot.setCard(this);
                    }
                }
            }
        });
    }
}