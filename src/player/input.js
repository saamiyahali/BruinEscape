export class Input {
    constructor() {
        this.keys = Object.create(null);
        window.addEventListener("keydown", (e) => {
            this.keys[e.key] = true;
        });
        window.addEventListener("keyup", (e) => {
            this.keys[e.key] = false;
        })
    }

    left() {
        return !!(this.keys["a"] || this.keys["A"] || this.keys["ArrowLeft"]);
    }

    right() {
        return !!(this.keys["d"] || this.keys["D"] || this.keys["ArrowRight"]);
    }
}