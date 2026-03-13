export class Input {
    constructor() {
        this.keys = Object.create(null);
        this.infinitePressed = false;
        this.jumpPressed = false;
        this.pausePressed = false;
        this.resetPressed = false;

        window.addEventListener("keydown", (e) => {
            if (!this.keys[e.key] && this.isJumpKey(e.key)) {
                this.jumpPressed = true;
            }
            if (!this.keys[e.key] && this.isPauseKey(e.key)) {
                this.pausePressed = true;
            }
            if (!this.keys[e.key] && this.isResetKey(e.key)) {
                this.resetPressed = true;
            }
            if (!this.keys[e.key] && (e.key === "i" || e.key === "I")) {
                this.infinitePressed = true;
            }
            this.keys[e.key] = true;
        });
        window.addEventListener("keyup", (e) => {
            this.keys[e.key] = false;
        });
    }

    isJumpKey(k) {
        return k === " " || k === "w" || k === "W" || k === "ArrowUp";
    }

    isPauseKey(k) {
        return k === "p" || k === "P" || k === "Escape";
    }

    isResetKey(k) {
        return k === "r" || k === "R";
    }

    left() {
        return !!(this.keys["a"] || this.keys["A"] || this.keys["ArrowLeft"]);
    }

    right() {
        return !!(this.keys["d"] || this.keys["D"] || this.keys["ArrowRight"]);
    }

    jump() {
        return this.jumpPressed;
    }

    slide() {
        return !!(this.keys["s"] || this.keys["S"] || this.keys["ArrowDown"]);
    }

    pause() {
        return this.pausePressed;
    }

    reset() {
        return this.resetPressed;
    }

    infiniteToggle() {
        return this.infinitePressed;
    }

    endFrame() {
        this.jumpPressed = false;
        this.pausePressed = false;
        this.resetPressed = false;
        this.infinitePressed = false;
    }
}