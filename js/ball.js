const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");
const ballX = 100;
const ballY = 200;
const cycles = 500;
const opacity = 0.5;
const mutate = 0.1;

class Block {
    constructor(x1, y1, x2, y2) {
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
    }
}

class Painter {
    static boardBlocks = [
        new Block(20, 165, 50, 165),
        new Block(20, 235, 50, 235),
        new Block(20, 160, 20, 240),

        new Block(50, 25, 50, 170),
        new Block(50, 230, 50, 475),
        new Block(50, 30, 800, 30),
        new Block(50, 470, 800, 470),
        new Block(800, 25, 800, 270),
        new Block(800, 330, 800, 475)
    ];

    static boardBg() {
        ctx.beginPath();
        ctx.fillStyle = "#444";
        ctx.fillRect(0, 0, 1000, 500);
    }

    static outLines() {
        ctx.beginPath();
        Painter.boardBlocks.forEach(({ x1, y1, x2, y2 }) => {
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
        });
        ctx.strokeStyle = "white";
        ctx.lineWidth = 10;
        ctx.stroke();
        10;
    }

    static statistics(generation, cycles, fitness) {
        ctx.beginPath();
        ctx.font = "16px sans-serif";
        ctx.fillStyle = "white";
        ctx.fillText(`Generation => ${generation}`, 830, 40);
        ctx.fillText(`Left Cycle ==> ${cycles}`, 830, 65);
        ctx.fillText(`Fitness ====> ${fitness.toFixed(3)}`, 830, 90);
    }

    static drawBalls(sys) {
        sys.balls.forEach(ball => ball.draw());
    }
}

class Ball {
    static directions = [
        "top",
        "left",
        "right",
        "bottom",
        "top,right",
        "top,left",
        "bottom,left",
        "bottom,right"
    ];
    static moveBy = 10;
    static maxDistance = Math.sqrt(
        Math.pow(ballX - 800, 2) + Math.pow(ballY - 300, 2)
    );

    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.moves = [];
        this.stuck = false;
        this.reached = false;
        this.fitness = 0;
        this.movesCounter = 0;
    }

    clone(ball) {
        this.moves = ball.moves.slice();
        this.fitness = ball.fitness;
        this.movesCounter = 0;
        this.stuck = false;
    }

    up() {
        this.y -= Ball.moveBy;
    }

    down() {
        this.y += Ball.moveBy;
    }

    left() {
        this.x -= Ball.moveBy;
    }

    right() {
        this.x += Ball.moveBy;
    }

    topLeft() {
        this.up();
        this.left();
    }

    topRight() {
        this.right();
        this.right();
    }

    bottomLeft() {
        this.down();
        this.left();
    }

    bottomRight() {
        this.down();
        this.right();
    }

    isStuck(blocks) {
        let stuck = false;
        blocks.forEach(({ x1, y1, x2, y2 }) => {
            stuck =
                stuck ||
                (this.x >= x1 && this.x <= x2 && this.y >= y1 && this.y <= y2);
        });

        return stuck;
    }

    // d = direction
    move(blocks) {
        if (!this.stuck) {
            const randomMoveIdx = Math.floor(
                Math.random() * (Ball.directions.length - 1)
            );
            let move = this.move[this.movesCounter++];
            if (!move) {
                move = Ball.directions[randomMoveIdx];
                this.moves.push(move);
            }
            switch (move) {
                case "top":
                    this.up();
                    break;
                case "bottom":
                    this.down();
                    break;
                case "left":
                    this.left();
                    break;
                case "right":
                    this.right();
                    break;
                case "top,right":
                    this.topRight();
                    break;
                case "top,left":
                    this.topLeft();
                    break;
                case "bottom,right":
                    this.bottomRight();
                    break;
                case "bottom,left":
                    this.bottomLeft();
                    break;
            }
            const fitness =
                // this.x / Ball.maxDistance.x;
                // console.log("fitness", fitness);

                Math.sqrt(
                    Math.pow(this.x - ballX, 2) + Math.pow(this.y - ballY, 2)
                ) / Ball.maxDistance;
            if (this.isStuck(blocks)) {
                this.stuck = true;
                // this.moves.pop();
            } else if (this.reachedTarget()) {
                console.log("Reached Target !!!!!!!");
                this.reached = true;
                this.fitness = 1;
            } else {
                this.fitness = fitness;
            }
        }
    }

    reachedTarget() {
        return this.x >= 800 && this.y > 270 && this.y < 330;
    }

    // best fitness #f1c40f
    draw() {
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, 20, 20, 0, 0, Math.PI * 2, false);
        ctx.fillStyle = `rgba(52, 152, 219, ${opacity})`;
        ctx.fill();
    }
}

class Agent {
    constructor(n, cycles = 250) {
        this.balls = [];
        for (let i = 0; i < n; i++) {
            this.balls.push(new Ball(ballX, ballY));
        }
        this.generation = 0;
        this.cycles = cycles;
        this.fitness = 0;
        this.blocks = [];
    }

    addBlock(block) {
        this.blocks.push(block);
    }

    getBestTwoParents() {
        this.balls.sort((a, b) => a.fitness - b.fitness);
        this.balls.shift();
        const parentA = this.balls[this.balls.length - 1];
        const parentB = this.balls[this.balls.length - 2];
        return { parentA, parentB };
    }

    forward() {
        this.balls.forEach(ball => {
            try {
                ball.move(this.blocks);
            } catch (e) {
                console.log(e);
                console.log(ball);
                throw new Error("fuck my life");
            }
        });
        const { reachedTarget, allStuck } = this.isDone();
        if (reachedTarget) {
            console.log("reached target!");
            return true;
        }
        this.cycles--;
        if (allStuck || this.cycles === -1) {
            // time to crossover and get new generation
            const { parentA, parentB } = this.getBestTwoParents();
            const child = new Ball(ballX, ballY);
            const mid = Math.floor(
                Math.min(parentA.moves.length, parentB.moves.length) / 2
            );
            const parentAMoves = parentA.moves.slice(0, mid);
            const parentBMoves = parentB.moves.slice(mid);
            child.moves = [...parentAMoves, ...parentBMoves];
            this.fitness = parentA.fitness;
            this.balls.push(child);
            this.balls.forEach(ball => {
                if (ball.stuck) {
                    console.log("before", ball);
                    ball.clone(parentA);
                    console.log("after", ball);

                    ball.stuck = false;
                }
                ball.movesCounter = 0;
                ball.x = ballX;
                ball.y = ballY;
            });
            // this.balls.forEach(ball => {
            //     ball.moves = ball.moves.map(move => {
            //         if (Math.random() < mutate) {
            //             return Ball.directions[
            //                 Math.floor(Math.random() * (Ball.directions - 1))
            //             ];
            //         }
            //         return move;
            //     });
            // });
            this.generation++;
        }

        if (this.cycles === -1) {
            this.generation++;
            this.cycles = cycles;
        }
        return false;
    }

    isDone() {
        let reachedTarget = null;
        let allStuck = true;
        this.balls.forEach(ball => {
            if (ball.reached) {
                reachedTarget = ball;
            }
            allStuck = allStuck && ball.stuck;
        });
        return { reachedTarget, allStuck };
    }
}

const agent = new Agent(200, cycles);
Painter.boardBlocks.forEach(block => agent.addBlock(block));

function draw() {
    ctx.clearRect(0, 0, 1000, 500);
    Painter.boardBg();
    Painter.outLines();
    Painter.statistics(agent.generation, agent.cycles, agent.fitness);
    Painter.drawBalls(agent);
    if (!agent.forward()) {
        requestAnimationFrame(draw);
    }
}

requestAnimationFrame(draw);
