import ndarray from 'ndarray';
import HashStore from '../structures/HashStore.mjs';

export default class Grid {
    constructor(step, width, height, quadrantSize) {
        this._width = width;
        this._height = height;
        this._step = step;
        this._array = ndarray(new HashStore(), [width, height]);

        //  3 | 2
        // ---|---
        //  1 | 0
        this._quadrants = [
            ndarray(new HashStore(), [quadrantSize, quadrantSize]),
            ndarray(new HashStore(), [quadrantSize, quadrantSize]),
            ndarray(new HashStore(), [quadrantSize, quadrantSize]),
            ndarray(new HashStore(), [quadrantSize, quadrantSize])
        ];
    }

    v2get(x, y) {
        if (!this.in(x, y)) {
            return null;
        }

        const chunk = this._quadrants[quadrant(x, y)];
        const ax = Math.abs(x), ay = Math.abs(y);

        return chunk.data.item(chunk.index(ax, ay));
    }

    v2set(x, y, v) {
        if (!this.in(x, y)) {
            return null;
        }

        const chunk = this._quadrants[quadrant(x, y)];
        const ax = Math.abs(x), ay = Math.abs(y);
        return chunk.data.set(chunk.index(ax, ay), v);
    }

    v2remove(x, y) {
        const chunk = this._quadrants[quadrant(x, y)];
        const ax = Math.abs(x), ay = Math.abs(y);
        return chunk.data.remove(chunk.index(ax, ay));
    }

    v2traversable(x, y) {
        if (!this.in(x, y)) {
            return false;
        }

        const chunk = this._quadrants[quadrant(x, y)];
        const ax = Math.abs(x), ay = Math.abs(y);
        return chunk.get(ax, ay) === 0;
    }

    in(x, y) {
        return x >= 0 && y >= 0 && x < this._width && y < this._height;
    }

    // =============================================================
    // OLD
    // =============================================================

    get(x, y) {
        return this._array.data.item(this._array.index(x, y));
    }

    getBinary(x, y) {
        return this._array.get(x, y);
    }

    inBounds(x, y) {
        return x >= 0 && y >= 0 && x < this._width && y < this._height;
    }

    isFree(x, y) {
        return this.getBinary(x, y) === 0 && this.inBounds(x, y);
    }

    getFragment(bounds) {
        const { hi, lo } = bounds;
        return this._array.hi(hi.x, hi.y).lo(lo.x, lo.y);
    }

    set(x, y, v) {
        this._array.set(this._array.index(x, y), v);
    }

    remove(x, y) {
        this._array.remove(this._array.index(x, y));
    }

    get shape() {
        return this._array.shape;
    }

    get step() {
        return this._step;
    }

    get data() {
        return this._array;
    }

    // helpers
    getObstacleBlob(x, y, {
        maxLoops = 1000,
    } = {}) {
        if (this.getBinary(x, y) === 0) return null;

        const startKey = `${x};${y}`
        const frontier = { [startKey]: { x, y }}, visited = {}, nodes = [];

        let loops = maxLoops;
        while (Object.keys(frontier).length > 0 && loops > 0) {
            const key = Object.keys(frontier)[0];
            const { x, y } = frontier[key];
            nodes.push(frontier[key]);

            [{ x: 1, y: 0 },
                { x: -1, y: 0 },
                { x: 0, y: 1 },
                { x: 0, y: -1 }].forEach(dir => {
                const neighbour = { x: x + dir.x, y: y + dir.y };
                const neighbourKey = `${neighbour.x};${neighbour.y}`;

                if (visited[neighbourKey] === true) {
                    return;
                }

                if (this.getBinary(neighbour.x, neighbour.y) === 1) {
                    frontier[neighbourKey] = neighbour;
                } else {
                    visited[neighbourKey] = true;
                }
            });

            delete frontier[key];
            visited[key] = true;
            loops--;
        }

        return nodes;
    }
}

export function quadrant(x, y) {
    return ((x < 0) << 0) + ((y < 0) << 1);
}
