import BinaryHeap from '../structures/BinaryHeap.mjs';
import GridNode from '../models/GridNode.mjs';

export class JumpPointFinder {

    constructor({
        grid,
        heuristic = (dx, dy) => dx + dy,
    } = {}) {
        this.grid = grid;

        this.heuristic = heuristic;
        this.startNode = null;
        this.endNode = null;
        this.openList = null;
    }

    findPath(start, end) {
        this.nodes = [];

        const { step } = this.grid;

        const sx = Math.floor(start.x / step),
            sy = Math.floor(start.y / step),
            ex = Math.floor(end.x / step),
            ey = Math.floor(end.y / step)

        const openList = this.openList = new BinaryHeap((a, b) => a.f - b.f);
        const startNode = this.startNode = this._getNodeAt(sx, sy);
        const endNode = this.endNode = this._getNodeAt(ex, ey);

        startNode.g = 0;
        startNode.f = 0;

        openList.push(startNode);
        startNode.opened = true;

        let node;
        while (!openList.empty()) {
            node = openList.pop();
            node.closed = true;

            if (node.isEqual(ex, ey)) {
                return adjust(backtrace(endNode, step), start, end);
            }

            this._identifySuccessors(node);
        }

        return [];
    }

    _identifySuccessors(node) {
        const heuristic = this.heuristic,
            openList = this.openList,
            endX = this.endNode.x,
            endY = this.endNode.y;
        let neighbors, neighbor,
            jumpPoint, i, l,
            x = node.x, y = node.y,
            jx, jy, d, ng, jumpNode,
            abs = Math.abs;

        neighbors = this._findNeighbors(node);
        for(i = 0, l = neighbors.length; i < l; ++i) {
            neighbor = neighbors[i];
            jumpPoint = this._jump(neighbor[0], neighbor[1], x, y);
            if (jumpPoint) {

                jx = jumpPoint[0];
                jy = jumpPoint[1];
                jumpNode = this._getNodeAt(jx, jy);

                if (jumpNode.closed) {
                    continue;
                }

                // include distance, as parent may not be immediately adjacent:
                d = octile(abs(jx - x), abs(jy - y));
                ng = node.g + d; // next `g` value

                if (!jumpNode.opened || ng < jumpNode.g) {
                    jumpNode.g = ng;
                    jumpNode.h = jumpNode.h || heuristic(abs(jx - endX), abs(jy - endY));
                    if (isBend(node, jumpNode)) {
                        jumpNode.h += 1;
                    }
                    jumpNode.f = jumpNode.g + jumpNode.h;
                    jumpNode.parent = node;

                    if (!jumpNode.opened) {
                        openList.push(jumpNode);
                        jumpNode.opened = true;
                    } else {
                        openList.updateItem(jumpNode);
                    }
                }
            }
        }
    };

    _findNeighbors(node) {
        const parent = node.parent,
            x = node.x, y = node.y,
            grid = this.grid;
        let px, py, dx, dy,
            neighbors = [], neighborNodes, neighborNode, i, l;

        // directed pruning: can ignore most neighbors, unless forced.
        if (parent) {
            px = parent.x;
            py = parent.y;
            // get the normalized direction of travel
            dx = (x - px) / Math.max(Math.abs(x - px), 1);
            dy = (y - py) / Math.max(Math.abs(y - py), 1);

            if (dx !== 0) {
                if (grid.isFree(x, y - 1)) {
                    neighbors.push([x, y - 1]);
                }
                if (grid.isFree(x, y + 1)) {
                    neighbors.push([x, y + 1]);
                }
                if (grid.isFree(x + dx, y)) {
                    neighbors.push([x + dx, y]);
                }
            }
            else if (dy !== 0) {
                if (grid.isFree(x - 1, y)) {
                    neighbors.push([x - 1, y]);
                }
                if (grid.isFree(x + 1, y)) {
                    neighbors.push([x + 1, y]);
                }
                if (grid.isFree(x, y + dy)) {
                    neighbors.push([x, y + dy]);
                }
            }
        }
        // return all neighbors
        else {
            neighborNodes = this._getNeighbors(node);
            for (i = 0, l = neighborNodes.length; i < l; ++i) {
                neighborNode = neighborNodes[i];
                neighbors.push([neighborNode.x, neighborNode.y]);
            }
        }

        return neighbors;
    };

    _jump(x, y, px, py) {
        const dx = x - px, dy = y - py, grid = this.grid;

        if (!grid.isFree(x, y)) {
            return null;
        }

        if (this._getNodeAt(x, y).isEqual(this.endNode.x, this.endNode.y)) {
            return [x, y];
        }

        if (dx !== 0) {
            if ((grid.isFree(x, y - 1) && !grid.isFree(x - dx, y - 1)) ||
                (grid.isFree(x, y + 1) && !grid.isFree(x - dx, y + 1))) {
                return [x, y];
            }
        }
        else if (dy !== 0) {
            if ((grid.isFree(x - 1, y) && !grid.isFree(x - 1, y - dy)) ||
                (grid.isFree(x + 1, y) && !grid.isFree(x + 1, y - dy))) {
                return [x, y];
            }
            //When moving vertically, must check for horizontal jump points
            if (this._jump(x + 1, y, x, y) || this._jump(x - 1, y, x, y)) {
                return [x, y];
            }
        }
        else {
            throw new Error("Only horizontal and vertical movements are allowed");
        }

        return this._jump(x + dx, y + dy, x, y);
    }

    _getNodeAt(x, y) {
        let col = this.nodes[x];
        if (!col) {
            this.nodes[x] = col = [];
        }

        let node = col[y];
        if (!node) {
            this.nodes[x][y] = node = new GridNode(x, y, this.grid.isFree(x, y));
        }
        return node;
    }

    _getNeighbors(node) {
        const x = node.x, y = node.y, neighbors = [], grid = this.grid;

        // up
        if (grid.isFree(x, y - 1)) {
            const n = this._getNodeAt(x, y - 1);
            neighbors.push(n);
        }
        // right
        if (grid.isFree(x + 1, y)) {
            const n = this._getNodeAt(x + 1, y);
            neighbors.push(n);
        }
        // down
        if (grid.isFree(x, y + 1)) {
            const n = this._getNodeAt(x, y + 1);
            neighbors.push(n);
        }
        // left
        if (grid.isFree(x - 1, y)) {
            const n = this._getNodeAt(x - 1, y);
            neighbors.push(n);
        }

        return neighbors;
    }
}

const backtrace = function(node, step) {
    let path = [{ x: node.x * step, y: node.y * step }];
    while (node.parent) {
        node = node.parent;
        path.push({ x: node.x * step, y: node.y * step });
    }
    return path.reverse();
}

const adjust = function(path, start, end) {
    if (path.length === 0) {
        return path;
    }

    const p0 = path[0];
    let p1 = path[1];
    if (!p0) {
        p1 = p0;
    }

    // adjust start segment to original start point coordinates
    const startAxis = p0.x === p1.x ? 'x': 'y';
    const startVal = p0[startAxis];
    let si = 0, sv = path[si];
    while (sv && sv[startAxis] === startVal) {
        path[si][startAxis] = start[startAxis];
        si += 1;
        sv = path[si];
    }

    if (startAxis === 'x') {
        path[0].y = start.y;
    } else {
        path[0].x = start.x;
    }

    // adjust end segment to original end point coordinates
    const endAxis = path[path.length - 1].x === path[path.length - 2].x ? 'x' : 'y';
    const endVal = path[path.length - 1][endAxis];
    let ei = path.length - 1, ev = path[ei];
    while (ev && ei >= si && ev[endAxis] === endVal) {
        path[ei][endAxis] = end[endAxis];
        ei -= 1;
        ev = path[ei];
    }

    if (endAxis === 'x') {
        path[path.length - 1].y = end.y;
    } else {
        path[path.length - 1].x = end.x;
    }

    return path;
}

const octile = function(dx, dy) {
    const F = Math.SQRT2 - 1;
    return (dx < dy) ? F * dx + dy : F * dy + dx;
}

const isBend = function(node, jumpNode) {
    return node.parent &&
        ((node.parent.x === node.x && node.x !== jumpNode.x) ||
        (node.parent.y === node.y && node.y !== jumpNode.y))
}