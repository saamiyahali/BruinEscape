export class Input {
    constructor() {
        this.keys = Object.create(null);

        this.jumpPressed = false;

        window.addEventListener("keydown", (e) => {
            if (!this.keys[e.key] && this.isJumpKey(e.key)) {
                this.jumpPressed = true;
            }
            this.keys[e.key] = true;
        });
        window.addEventListener("keyup", (e) => {
            this.keys[e.key] = false;
        })
    }

    isJumpKey(k) {
        return k === " " || k === "w" || k === "W" || k === "ArrowUp";
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

    endFrame() {
        this.jumpPressed = false;
    }
}