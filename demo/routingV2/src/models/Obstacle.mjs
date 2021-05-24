import { util } from '../../../../joint.mjs';

export default class Obstacle {
    constructor(element, grid) {
        this._id = Number.parseInt(util.uniqueId());
        this._bounds = Obstacle.elementToBounds(element, grid._opts);
        this._cell = element;
        this._grid = grid;
    }

    update() {
        // todo: highly unoptimized poc
        // remove obstacle from grid completely
        let { hi, lo } = this.bounds;
        for (let x = lo.x; x < hi.x; ++x) {
            for (let y = lo.y; y < hi.y; ++y) {
                const node = this._grid.get(x, y);
                if (node) {
                    node.delete(this.id);

                    if (node.size === 0) {
                        this._grid.remove(x, y);
                    }
                }
            }
        }

        // add obstacle back to the grid, from scratch
        this._bounds = Obstacle.elementToBounds(this._cell, this._grid._opts);

        lo = this._bounds.lo;
        hi = this._bounds.hi;

        for(let x = lo.x; x < hi.x; ++x) {
            for(let y = lo.y; y < hi.y; ++y) {
                const node = this._grid.get(x, y) || new Map();
                node.set(this.id, this._cell);
                this._grid.set(x, y, node);
            }
        }
    }

    get bounds() {
        return this._bounds;
    }

    get id() {
        return this._id;
    }

    get cell() {
        return this._cell;
    }

    static elementToBounds(element, opt) {
        const rect = element.getBBox().moveAndExpand(opt.paddingBox);

        return Obstacle.rectToBounds(rect, opt.step);
    }

    static rectToBounds(rect, step) {
        return {
            hi: {
                x: Math.ceil((rect.x + rect.width) / step),
                y: Math.ceil((rect.y + rect.height) / step)
            },
            lo: {
                x: Math.floor(rect.x / step),
                y: Math.floor(rect.y / step)
            }
        };
    }
}
