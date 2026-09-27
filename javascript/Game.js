<<<<<<< HEAD
import {drawLine, drawCircle, drawText, getTextSize, counter, clamp} from './utils.js'
import Table from './Table.js'
import Ball from './Ball.js'
import Player from './Player.js'
import Menu from './Menu.js'

const WIDTH = 1280
const HEIGHT = 720
// const WIDTH = 1920
// const HEIGHT = 1080
const ASPECT_RATIO = WIDTH / HEIGHT
const MAX_WRAPPER_WIDTH = 1920
const FPS = 60

function continuousCollision(rayStart, rayEnd, target) {
    let nearX = (target.pos.x - rayStart.pos.x) / rayEnd.x
    let nearY = (target.pos.y - rayStart.pos.y) / rayEnd.y
    let farX = ((target.pos.x + target.width) - rayStart.pos.x) / rayEnd.x
    let farY = ((target.pos.y + target.height) - rayStart.pos.y) / rayEnd.y

    if (nearX > farX) {
        [nearX, farX] = [farX, nearX]
    }
    if (nearY > farY) {
        [nearY, farY] = [farY, nearY]
    }

    const tNear = Math.max(nearX, nearY)
    const tFar = Math.min(farX, farY)

    let sweptNearPointX = rayStart.pos.x + rayEnd.x*tNear
    let sweptNearPointY = rayStart.pos.y + rayEnd.y*tNear
    let sweptFarPointX = rayStart.pos.x + rayEnd.x*tFar
    let sweptFarPointY = rayStart.pos.y + rayEnd.y*tFar

    let nearPointX, nearPointY, normalX, normalY

    if (nearX > nearY) {
        if (rayEnd.x > 0) {
            nearPointX =  sweptNearPointX + rayStart.radius
            nearPointY = rayStart.pos.y + rayEnd.y*tNear
            normalX = -1
            normalY = 0
        } else {
            nearPointX =  sweptNearPointY - rayStart.radius
            nearPointY = rayStart.pos.y + rayEnd.y*tNear
            normalX = 1
            normalY = 0
        }
    } else if (nearX < nearY) {
        if (rayEnd.y > 0) {
            nearPointX = rayStart.pos.x + rayEnd.x*tNear
            nearPointY = sweptNearPointY + rayStart.radius
            normalX = 0
            normalY = -1
        } else {
            nearPointX = rayStart.pos.x + rayEnd.x*tNear
            nearPointY = sweptNearPointY - rayStart.radius
            normalX = 0
            normalY = 1
        }
    }
    return {tNear, tFar, nearPointX, nearPointY, normalX, normalY, sweptNearPointX, sweptNearPointY}
}

export default class Game {
    constructor() {
        this.cnv = document.getElementById('game-canvas')
        this.ctx = this.cnv.getContext('2d')

        this.keys = {}

        this.resize()
        this.addListeners()

        this.playerTurn = -1

        this.table = new Table(this.width, this.height)
        this.ball = new Ball(this.table)
        this.player1 = new Player(this.table, this.ball, true)
        this.player2 = new Player(this.table, this.ball, false)
        this.menu = new Menu(this.ctx, this.width, this.height)
        // this.menu.isActive = false

        this.players = [this.player1, this.player2]

        this.ball.radius = Math.floor(this.player1.width * 0.6)

        this.players.forEach((player) => {
            player.serveParams.origin = this.ball.radius
            player.serveParams.isDraw = this.playerTurn
            player.swept.pos.x = player.pos.x - this.ball.radius
            player.swept.pos.y = player.pos.y - this.ball.radius
            player.swept.width = player.width + this.ball.radius*2
            player.swept.height = player.height + this.ball.radius*2
        })

        // this.menu.isActive = false
        // this.ball.pos.x = this.player1.pos.x + this.player1.width
        // this.ball.pos.y = this.table.y + this.ball.radius
        // this.ball.pos.y = this.table.y + this.table.height - this.ball.radius

        this.isServed = false
        this.drawServeDirTimeElapsed = 0
        this.drawServeDirDuration = 0.5

        this.isOut = false
        this.outPauseTimeElapsed = 0
        this.outAnimationTimeElapsed = 0
        this.outPauseduration = 3
        this.endGameAnimationTimeElapsed = 0

        this.score = {
            round: {p1: 0, p2: 0},
            match: {p1: 0, p2: 0},
        }

        this.endGame = false
        this.winner = null
        this.paused = false

        this.lastTime = -1
        this.fps = 0
        this.timePerFrame = 1 / FPS

        this.animate()
    }

    draw() {
        this.table.draw(this.ctx)
        this.ball.draw(this.ctx)
        this.player1.draw(this.ctx)
        this.player2.draw(this.ctx)
        this.drawScore(this.ctx)
        this.drawMatchPoints(this.ctx)

        if (this.endGame) {
            this.drawEndGame(this.ctx)
        } else {
            this.drawOut()
        }
        if (this.menu.isActive) {
            this.menu.draw()
        }

        if (this.paused) {
            this.ctx.beginPath()
            this.ctx.rect(0, 0, this.cnv.width, this.cnv.height)
            this.ctx.fillStyle = `hsla(0, 0%, 10%, 0.9)`
            this.ctx.fill()
            const font = `${Math.floor(this.width * 0.0525)}px "Funnel Sans", sans-serif`
            let metrics = getTextSize(this.ctx, font, 'Пыузы')
            drawText(this.ctx, (this.cnv.width - metrics.width) * 0.5, (this.cnv.height - metrics.boundingBoxHeight) * 0.5, font, 'Пыузы',
                {color: 'white', align: 'left'}
            )
        }
    }

    update(dt) {
        if (this.paused) {
            return
        }
        if (this.menu.isActive) {
            if (this.keys['Enter']) {
                this.selectPlayer(this.menu.index)
                this.menu.isActive = false
            }
            // console.log(this.keys)
            this.menu.update(dt)
        } else {
            if (!this.isServed) {
                if (this.playerTurn === -1 && !this.player1.isAi) {
                    if (this.keys['ShiftLeft']) {
                        this.serve(this.ball, this.player1)
                    }
                } else if (this.playerTurn === 1 && !this.player2.isAi) {
                    if (this.keys['ShiftRight']) {
                        this.serve(this.ball, this.player2)
                    }
                }
            }

            if (this.keys['KeyW']) {
                this.player1.moveUp()
            } else if (this.keys['KeyS']){
                this.player1.moveDown()
            } else {
                this.player1.releaseButton()
            }

            if (this.keys['ArrowUp']) {
                this.player2.moveUp()
            } else if (this.keys['ArrowDown']){
                this.player2.moveDown()
            } else {
                this.player2.releaseButton()
            }

            if (this.isServed) {
                this.ball.updateTale(dt)
            }

            this.ball.vel.x += this.ball.acc.x * dt
            this.ball.vel.y += this.ball.acc.y * dt

            let ballVelX = this.ball.vel.x * dt
            let ballVelY = this.ball.vel.y * dt

            this.player1.moveAi(this.ball, dt)
            this.player2.moveAi(this.ball, dt)

            this.player1.updateMovement(dt)
            this.player2.updateMovement(dt)

            if (this.isServed) {
                for (let i = 0; i < this.players.length; i++) {
                    const collision = continuousCollision(
                        this.ball,
                        {x: ballVelX - this.players[i].vel.x * dt, y: ballVelY - this.players[i].vel.y * dt},
                        this.players[i].swept
                    )

                    if (collision.tNear < collision.tFar && collision.tNear <= 1 && collision.tFar > 0) {
                        if (collision.tNear <= 0) {
                            if (this.players[i].isLeft) {
                                if (collision.normalX === 1) {
                                    this.ball.resetCurveBall()
                                    const dx = this.table.x + this.table.width*0.2 - this.players[i].pos.x+this.players[i].width
                                    const dy = this.ball.pos.y - this.players[i].pos.y - this.players[i].height*0.5
                                    let theta = Math.atan2(dy, dx)
                                    const randAngle = (Math.random() - 0.5) * 0.01

                                    let speed = Math.sqrt(this.ball.vel.x*this.ball.vel.x + this.ball.vel.y*this.ball.vel.y)
                                    const speedBoost = this.players[i].speedBoost(this.ball, speed, Math.sin(theta)) // this.speedBoost(this.ball, speed, Math.sin(theta))
                                    const spLower = this.players[i].speedLower(this.ball, speed)

                                    theta += randAngle;

                                    [this.ball.vel.x, this.ball.vel.y] = this.ball.clampSpeed(theta, speed, speedBoost, spLower)

                                    ballVelX = this.ball.vel.x * dt
                                    ballVelY = this.ball.vel.y * dt

                                    this.ball.setCurveBall(speed, theta)
                                }
                                else if (collision.normalY === -1) {
                                    this.players[i].pos.y = this.ball.pos.y + this.ball.radius
                                    this.players[i].vel.y = 0
                                    // this.players[i].acc.y = 0
                                }
                                else if (collision.normalY === 1) {
                                    this.players[i].pos.y = this.ball.pos.y - this.ball.radius - this.players[i].height
                                    this.players[i].vel.y = 0
                                    // this.players[i].acc.y = 0
                                }
                                // else if (collision.normalY === 1 || collision.normalY === -1) {
                                //     this.ball.vel.y *= -1
                                //     ballVelX = this.ball.vel.x * dt
                                //     ballVelY = this.ball.vel.y * dt
                                // }
                                else {
                                    const dx = this.ball.pos.x - collision.nearPointX
                                    const dy = this.ball.pos.y - collision.nearPointY
                                    const len = Math.sqrt(dx*dx + dy*dy)
                                    const norm = {x: dx / len, y: dy / len}
                                    const dot = (this.ball.vel.x - this.players[i].vel.x) * norm.x + (this.ball.vel.y - this.players[i].vel.y) * norm.y
                                    const reflectionVecX = 2 * dot * norm.x
                                    const reflectionVecY = 2 * dot * norm.y
                                    this.ball.vel.x += -reflectionVecX
                                    this.ball.vel.y += -reflectionVecY
                                    ballVelX = this.ball.vel.x * dt
                                    ballVelY = this.ball.vel.y * dt
                                }
                            } else if (!this.players[i].isLeft) {
                                if (collision.normalX === -1) {
                                    this.ball.resetCurveBall()
                                    const dx = this.table.x + this.table.width*0.8 - this.players[i].pos.x
                                    const dy = this.ball.pos.y - this.players[i].pos.y - this.players[i].height*0.5
                                    let theta = Math.atan2(dy, dx)
                                    const randAngle = (Math.random() - 0.5) * 0.01

                                    const speed = Math.sqrt(this.ball.vel.x*this.ball.vel.x + this.ball.vel.y*this.ball.vel.y)
                                    const speedBoost = this.players[i].speedBoost(this.ball, speed, Math.sin(theta)) // this.speedBoost(this.ball, speed, Math.sin(theta))
                                    const spLower = this.players[i].speedLower(this.ball, speed)

                                    theta += randAngle;

                                    [this.ball.vel.x, this.ball.vel.y] = this.ball.clampSpeed(theta, speed, speedBoost, spLower)

                                    ballVelX = this.ball.vel.x * dt
                                    ballVelY = this.ball.vel.y * dt

                                    this.ball.setCurveBall(speed, theta)
                                }
                                else if (collision.normalY === -1) {
                                    this.players[i].pos.y = this.ball.pos.y + this.ball.radius
                                    this.players[i].vel.y = 0
                                    // this.players[i].acc.y = 0
                                }
                                else if (collision.normalY === 1) {
                                    this.players[i].pos.y = this.ball.pos.y - this.ball.radius - this.players[i].height
                                    this.players[i].vel.y = 0
                                    // this.players[i].acc.y = 0
                                }
                                // else if (collision.normalY === 1 || collision.normalY === -1) {
                                //     this.ball.vel.y *= -1
                                //     ballVelX = this.ball.vel.x * dt
                                //     ballVelY = this.ball.vel.y * dt
                                // }
                                else {
                                    const dx = this.ball.pos.x - collision.nearPointX
                                    const dy = this.ball.pos.y - collision.nearPointY
                                    const len = Math.sqrt(dx*dx + dy*dy)
                                    const norm = {x: dx / len, y: dy / len}
                                    const dot = (this.ball.vel.x - this.players[i].vel.x) * norm.x + (this.ball.vel.y - this.players[i].vel.y) * norm.y
                                    const reflectionVecX = 2 * dot * norm.x
                                    const reflectionVecY = 2 * dot * norm.y
                                    this.ball.vel.x += -reflectionVecX
                                    this.ball.vel.y += -reflectionVecY
                                    ballVelX = this.ball.vel.x * dt
                                    ballVelY = this.ball.vel.y * dt
                                }
                            }
                        } else {
                            ballVelX *= collision.tNear
                            ballVelY *= collision.tNear
                        }
                    }
                }
            };

            [ballVelX, ballVelY] = this.ball.checkTableBorder(ballVelX, ballVelY, dt)

            if (!this.isServed && !this.isOut) {
                if (this.playerTurn === -1) {
                    if (this.player1.setAiPos(dt, this.isServed)) {
                        this.serve(this.ball, this.player1)
                    }
                } else if (this.playerTurn === 1) {
                    if (this.player2.setAiPos(dt, this.isServed)) {
                        this.serve(this.ball, this.player2)
                    }
                }
            }

            // this.player1.moveAi(this.ball, dt)
            // this.player2.moveAi(this.ball, dt)

            this.player1.updatePosition(dt)
            this.player2.updatePosition(dt)

            this.ball.pos.x += ballVelX
            this.ball.pos.y += ballVelY

            if (!this.isServed) {
                this.drawServeDirTimeElapsed = 0
                if (this.playerTurn === -1) {
                    this.ball.placeBallToPlayer(this.player1)
                } else if (this.playerTurn === 1) {
                    this.ball.placeBallToPlayer(this.player2)
                }
            } else {
                if (this.drawServeDirTimeElapsed > this.drawServeDirDuration) {
                    this.player1.serveParams.isDraw = false
                    this.player2.serveParams.isDraw = false
                }
                this.drawServeDirTimeElapsed += dt
            }

                // Out
            this.handleOut(dt)

            if (this.endGame) {
                this.endGameAnimationTimeElapsed += dt
            }
        }
    }

    handleOut(dt) {
        if (this.ball.pos.x > this.table.x + this.table.width + this.ball.radius*2) {
            if (!this.isOut) {
                this.player1.score.round += 1
            }
            this.isOut = 'right'
        }
        if (this.ball.pos.x < this.table.x - this.ball.radius*2) {
            if (!this.isOut) {
                this.player2.score.round += 1
            }
            this.isOut = 'left'
        }

        if (this.isOut) {
            if ((this.score.round.p1 >= 11 || this.score.round.p2 >= 11) && Math.abs(this.score.round.p1 - this.score.round.p2) >= 2) {
                if (this.score.round.p1 > this.score.round.p2) {
                    this.score.match.p1 += 1
                    this.player1.score.match += 1
                } else {
                    this.score.match.p2 += 1
                    this.player2.score.match += 1
                }
                this.score.round.p1 = 0
                this.score.round.p2 = 0
                this.player1.score.round = 0
                this.player2.score.round = 0

                if (this.score.match.p1 === 3 || this.score.match.p2 === 3) {
                    this.endGame = true
                    if (this.score.match.p1 > this.score.match.p2) {
                        this.winner = 'p1'
                    } else {
                        this.winner = 'p2'
                    }
                }

                this.playerTurn *= -1
            }
            this.outAnimationTimeElapsed += dt
        }
    }

    drawEndGame(ctx) {
        ctx.beginPath()
        ctx.rect(0, 0, this.cnv.width, this.cnv.height)
        ctx.fillStyle = `hsla(180, 2%, 20%, ${1})`
        ctx.fill()
        ctx.fillStyle = `hsla(160, 80%, 30%, ${Math.max(0, Math.min(this.endGameAnimationTimeElapsed / 1, 1))})`
        ctx.fill()

        const endGameText = this.winner === 'p1' ? 'Игрок 1 Победил!' : 'Игрок 2 Победил!'

        const font = `${Math.floor(this.width * 0.0525)}px "Funnel Sans", sans-serif`
        let metrics = getTextSize(ctx, font, endGameText)

        ctx.save()
        ctx.translate(this.cnv.width*0.5, this.cnv.height*0.5)
        ctx.scale((Math.max(0, Math.min(this.endGameAnimationTimeElapsed / 2, 1))), (Math.max(0, Math.min(this.endGameAnimationTimeElapsed / 2, 1))))
        this.ctx.translate(-this.cnv.width*0.5, -this.cnv.height*0.5)
        drawText(ctx, (this.cnv.width - metrics.width) * 0.5, (this.cnv.height - metrics.boundingBoxHeight) * 0.5, font, endGameText,
            {color: 'white', align: 'left'}
        )
        ctx.restore()

        if (this.endGameAnimationTimeElapsed >= 4) {
            this.reset()
            this.player1.score.round = 0
            this.player2.score.round = 0
            this.player1.score.match = 0
            this.player2.score.match = 0
            this.score = {
                round: {p1: 0, p2: 0},
                match: {p1: 0, p2: 0},
            }

            this.endGame = false
            this.winner = null
            this.paused = false
            this.playerTurn = -1
            this.menu.isActive = true
        }
    }

    drawMatchPoints(ctx) {
        // console.log(this.width * 0.0525)
            // Player 1
        for (let i = 0; i < this.score.match.p1; i++) { // this.score.match.p1
            ctx.beginPath()
            ctx.roundRect(this.table.x + this.table.width*0.5 - this.player1.width * 0.1 - this.table.width*0.35 + (this.player1.width * 0.6 * i), this.table.padding.top*0.5 - this.player1.height * 0.1, this.player1.width * 0.2, this.player1.height * 0.2, [this.player1.roundness*0.2])
            ctx.fillStyle = 'white'
            ctx.fill()
        }

                // Player 2
        for (let i = 0; i < this.score.match.p2; i++) { // this.score.match.p2
            ctx.beginPath()
            ctx.roundRect(this.table.x + this.table.width*0.5 - this.player1.width * 0.1 + this.table.width*0.35 - (this.player1.width * 0.6 * i), this.table.padding.top*0.5 - this.player1.height * 0.1, this.player1.width * 0.2, this.player1.height * 0.2, [this.player1.roundness*0.2])
            ctx.fillStyle = 'white'
            ctx.fill()
        }
    }

    drawOut() {
        if (this.isOut) {
            const progress1 = Math.max(0, Math.min(this.outAnimationTimeElapsed / 1, 1))
            const progress2 = Math.max(0, Math.min((this.outAnimationTimeElapsed - 1.2) / 1, 1))
            // console.log(progress2)

            this.ctx.beginPath()
            this.ctx.rect(0, 0, this.width, this.height)
                                                        // Math.sqrt(1 - Math.pow(x - 1, 2))
            this.ctx.fillStyle = `hsla(180deg, 2%, 20%, ${Math.sqrt(1 - Math.pow(progress1 - 1, 2)) - (progress2*progress2*progress2*progress2)})` //Math.sin((x * Math.PI) / 2)
            this.ctx.fill()

            if (this.isOut === 'right') {
                this.table.rightOutAlpha = progress1
            } else if (this.isOut === 'left') {
                this.table.leftOutAlpha = progress1
            }

            if (progress1 >= 1) {
                this.score.round.p1 = this.player1.score.round
                this.score.round.p2 = this.player2.score.round
                this.table.leftOutAlpha = 0
                this.table.rightOutAlpha = 0
                this.isOut = true
                this.reset()
            }
            if (progress2 >= 1) {
                this.isOut = false
                this.outAnimationTimeElapsed = 0
            }
        }
    }

    drawScore(ctx) {
        const font = `${Math.floor(this.width * 0.0295)}px "Funnel Sans", sans-serif`
        let metrics = getTextSize(ctx, font, this.score.round.p1)
        drawText(ctx, this.table.x + this.table.width*0.5-this.table.width * 0.05, this.table.padding.top*0.5 - metrics.boundingBoxHeight*0.5,  font, this.score.round.p1,
            {color: 'white', align: 'right'}
        )
        metrics = getTextSize(ctx, font, this.score.round.p2)
        drawText(ctx, this.table.x + this.table.width*0.5+this.table.width * 0.05, this.table.padding.top*0.5 - metrics.boundingBoxHeight*0.5,  font, this.score.round.p2,
            {color: 'white'}
        )
    }

    selectPlayer(player) {
        if (player === 0) {
            this.player1.isAi = false
            this.player2.isAi = true
        } else if (player === 1) {
            this.player1.isAi = false
            this.player2.isAi = false
        } else {
            this.player1.isAi = true
            this.player2.isAi = true
        }

        this.reset()
    }

    serve(ball, player) {
        let boost = 1
        if (player.serveCounter.add()) {
            boost = Math.random() + 1
            player.serveCounter.reset()
        } else if (Math.random() <= 0.1) {
            boost = Math.random() + 1
            player.serveCounter.reset()
        }

        this.isServed = true
        ball.vel.x = Math.cos(player.serveParams.angle) * ball.minSpeed * boost
        ball.vel.y = Math.sin(player.serveParams.angle) * ball.minSpeed * boost
    }

    reset() {
        const activePlayer = this.playerTurn == -1 ? this.player1 : this.player2
        this.player1.reset()
        this.player2.reset()
        this.ball.reset()
        // this.ball.placeBallToPlayer(activePlayer)
        this.isServed = false
        this.player1.serveParams.isDraw = this.playerTurn
        this.player2.serveParams.isDraw = this.playerTurn
        this.outPauseTimeElapsed = 0
    }

    handleKeyDown(e) {
        this.cnv.style.cursor = `none`
        if (e.code === 'Escape') {
            this.paused = !this.paused
        }
        if (!this.isOut) {
            this.keys[e.code] = true
        }
        // console.log(e.code)

        if (this.menu.isActive) {
            if (e.code === 'ArrowUp') {
                this.menu.moveUp()
            } else if (e.code === 'ArrowDown') {
                this.menu.moveDown()
            }
        }
    }

    handleKeyUp(e) {
        // this.keys[e.code] = false
        if (this.keys[e.code]) {
            delete this.keys[e.code]
        }
        // this.player1.releaseButton()
        // this.player2.releaseButton()
    }

    animate() {
        if(this.lastTime < 0) {
            this.lastTime = performance.now()
        }
        this.deltatime = (performance.now() - this.lastTime) * 0.001
        this.deltatime = Math.min(this.deltatime, 0.1)

        this.update(this.deltatime, performance.now())
        this.ctx.clearRect(0, 0, this.width, this.height)
        // this.ctx.fillStyle = 'hsla(180, 2%, 20%, 0.4)'
        // this.ctx.fillRect(0, 0, this.width, this.height)
        this.draw()
        this.lastTime = performance.now()

        this.fps = Math.round(1 / this.deltatime)

        requestAnimationFrame(this.animate.bind(this))
    }

    addListeners() {
        window.addEventListener('resize', this.resize.bind(this))
        window.addEventListener('keydown', this.handleKeyDown.bind(this))
        window.addEventListener('keyup', this.handleKeyUp.bind(this))
        window.addEventListener('visibilitychange', (e) => {
            // console.log(e.target.hidden)
            if (!e.target.hidden) {
                this.lastTime = -1
            }
        })
        window.addEventListener('mousemove', (e) => {
            this.cnv.style.cursor = `auto`
        })
    }

    resize() {
        const wrapper = this.cnv.parentElement

        let newWidth = window.innerWidth
        let newHeight = window.innerHeight

        if (newWidth > MAX_WRAPPER_WIDTH) {
            newWidth = MAX_WRAPPER_WIDTH
            newHeight = newWidth / ASPECT_RATIO
        }

        if (newHeight > window.innerHeight) {
            newHeight = window.innerHeight
            newWidth = newHeight * ASPECT_RATIO
        }

        if (newWidth / newHeight > ASPECT_RATIO) {
            newWidth = newHeight * ASPECT_RATIO
            // newHeight = newWidth / ASPECT_RATIO
            // newHeight = window.innerHeight
        } else {
            // newWidth = window.innerWidth
            newHeight = newWidth / ASPECT_RATIO
        }

        wrapper.style.width = `${Math.floor(newWidth)}px`
        wrapper.style.height = `${Math.floor(newHeight)}px`

        const wrapperWidth = wrapper.clientWidth
        const wrapperHeight = wrapper.clientHeight

        const dpr = 1 //window.devicePixelRatio || 1

        const scaleFactor = Math.min(wrapperWidth / WIDTH, wrapperHeight / HEIGHT)
        // console.log(scaleFactor)

        this.cnv.width = WIDTH * dpr
        this.cnv.height = HEIGHT * dpr

        this.width = this.cnv.width
        this.height = this.cnv.height

        if (scaleFactor < 1) {
            this.ctx.translate(this.width*0.5, this.height*0.5)
            this.ctx.scale(scaleFactor, scaleFactor)
            this.ctx.translate(-this.width*0.5, -this.height*0.5)
        }
        // this.ctx.translate((wrapperWidth - this.width)*0.5, (wrapperHeight - this.height)*0.5)
        // this.ctx.translate((wrapperWidth - this.width)*-0.5, (wrapperHeight - this.height)*-0.5)
    }
=======
import {drawLine, drawCircle, drawText, getTextSize, counter, clamp} from './utils.js'
import Table from './Table.js'
import Ball from './Ball.js'
import Player from './Player.js'
import Menu from './Menu.js'

// const WIDTH = 1280
// const HEIGHT = 720
const WIDTH = 1920
const HEIGHT = 1080
const ASPECT_RATIO = WIDTH / HEIGHT
const MAX_WRAPPER_WIDTH = 1920
const FPS = 60

function continuousCollision(rayStart, rayEnd, target) {
    let nearX = (target.pos.x - rayStart.pos.x) / rayEnd.x
    let nearY = (target.pos.y - rayStart.pos.y) / rayEnd.y
    let farX = ((target.pos.x + target.width) - rayStart.pos.x) / rayEnd.x
    let farY = ((target.pos.y + target.height) - rayStart.pos.y) / rayEnd.y

    if (nearX > farX) {
        [nearX, farX] = [farX, nearX]
    }
    if (nearY > farY) {
        [nearY, farY] = [farY, nearY]
    }

    const tNear = Math.max(nearX, nearY)
    const tFar = Math.min(farX, farY)

    let sweptNearPointX = rayStart.pos.x + rayEnd.x*tNear
    let sweptNearPointY = rayStart.pos.y + rayEnd.y*tNear
    let sweptFarPointX = rayStart.pos.x + rayEnd.x*tFar
    let sweptFarPointY = rayStart.pos.y + rayEnd.y*tFar

    let nearPointX, nearPointY, normalX, normalY

    if (nearX > nearY) {
        if (rayEnd.x > 0) {
            nearPointX =  sweptNearPointX + rayStart.radius
            nearPointY = rayStart.pos.y + rayEnd.y*tNear
            normalX = -1
            normalY = 0
        } else {
            nearPointX =  sweptNearPointY - rayStart.radius
            nearPointY = rayStart.pos.y + rayEnd.y*tNear
            normalX = 1
            normalY = 0
        }
    } else if (nearX < nearY) {
        if (rayEnd.y > 0) {
            nearPointX = rayStart.pos.x + rayEnd.x*tNear
            nearPointY = sweptNearPointY + rayStart.radius
            normalX = 0
            normalY = -1
        } else {
            nearPointX = rayStart.pos.x + rayEnd.x*tNear
            nearPointY = sweptNearPointY - rayStart.radius
            normalX = 0
            normalY = 1
        }
    }
    return {tNear, tFar, nearPointX, nearPointY, normalX, normalY, sweptNearPointX, sweptNearPointY}
}

export default class Game {
    constructor() {
        this.cnv = document.getElementById('game-canvas')
        this.ctx = this.cnv.getContext('2d')

        this.keys = {}

        this.resize()
        this.addListeners()

        this.playerTurn = -1

        this.table = new Table(this.width, this.height)
        this.ball = new Ball(this.table)
        this.player1 = new Player(this.table, this.ball, true)
        this.player2 = new Player(this.table, this.ball, false)
        this.menu = new Menu(this.ctx, this.width, this.height)
        // this.menu.isActive = false

        this.players = [this.player1, this.player2]

        this.ball.radius = Math.floor(this.player1.width * 0.6)

        this.players.forEach((player) => {
            player.serveParams.origin = this.ball.radius
            player.serveParams.isDraw = this.playerTurn
            player.swept.pos.x = player.pos.x - this.ball.radius
            player.swept.pos.y = player.pos.y - this.ball.radius
            player.swept.width = player.width + this.ball.radius*2
            player.swept.height = player.height + this.ball.radius*2
        })

        // this.menu.isActive = false
        // this.ball.pos.x = this.player1.pos.x + this.player1.width
        // this.ball.pos.y = this.table.y + this.ball.radius
        // this.ball.pos.y = this.table.y + this.table.height - this.ball.radius

        this.isServed = false
        this.drawServeDirTimeElapsed = 0
        this.drawServeDirDuration = 0.5

        this.isOut = false
        this.outPauseTimeElapsed = 0
        this.outAnimationTimeElapsed = 0
        this.outPauseduration = 3
        this.endGameAnimationTimeElapsed = 0

        this.score = {
            round: {p1: 0, p2: 0},
            match: {p1: 0, p2: 0},
        }

        this.endGame = false
        this.winner = null
        this.paused = false

        this.lastTime = -1
        this.fps = 0
        this.timePerFrame = 1 / FPS

        this.animate()
    }

    draw() {
        this.table.draw(this.ctx)
        this.ball.draw(this.ctx)
        this.player1.draw(this.ctx)
        this.player2.draw(this.ctx)
        this.drawScore(this.ctx)
        this.drawMatchPoints(this.ctx)

        if (this.endGame) {
            this.drawEndGame(this.ctx)
        } else {
            this.drawOut()
        }
        if (this.menu.isActive) {
            this.menu.draw()
        }

        if (this.paused) {
            this.ctx.beginPath()
            this.ctx.rect(0, 0, this.cnv.width, this.cnv.height)
            this.ctx.fillStyle = `hsla(0, 0%, 10%, 0.9)`
            this.ctx.fill()
            const font = `${Math.floor(this.width * 0.0525)}px "Funnel Sans", sans-serif`
            let metrics = getTextSize(this.ctx, font, 'Пыузы')
            drawText(this.ctx, (this.cnv.width - metrics.width) * 0.5, (this.cnv.height - metrics.boundingBoxHeight) * 0.5, font, 'Пыузы',
                {color: 'white', align: 'left'}
            )
        }
    }

    update(dt) {
        if (this.paused) {
            return
        }
        if (this.menu.isActive) {
            if (this.keys['Enter']) {
                this.selectPlayer(this.menu.index)
                this.menu.isActive = false
            }
            // console.log(this.keys)
            this.menu.update(dt)
        } else {
            if (!this.isServed) {
                if (this.playerTurn === -1 && !this.player1.isAi) {
                    if (this.keys['ShiftLeft']) {
                        this.serve(this.ball, this.player1)
                    }
                } else if (this.playerTurn === 1 && !this.player2.isAi) {
                    if (this.keys['ShiftRight']) {
                        this.serve(this.ball, this.player2)
                    }
                }
            }

            if (this.keys['KeyW']) {
                this.player1.moveUp()
            } else if (this.keys['KeyS']){
                this.player1.moveDown()
            } else {
                this.player1.releaseButton()
            }

            if (this.keys['ArrowUp']) {
                this.player2.moveUp()
            } else if (this.keys['ArrowDown']){
                this.player2.moveDown()
            } else {
                this.player2.releaseButton()
            }

            if (this.isServed) {
                this.ball.updateTale(dt)
            }

            this.ball.vel.x += this.ball.acc.x * dt
            this.ball.vel.y += this.ball.acc.y * dt

            let ballVelX = this.ball.vel.x * dt
            let ballVelY = this.ball.vel.y * dt

            this.player1.moveAi(this.ball, dt)
            this.player2.moveAi(this.ball, dt)

            this.player1.updateMovement(dt)
            this.player2.updateMovement(dt)

            if (this.isServed) {
                for (let i = 0; i < this.players.length; i++) {
                    const collision = continuousCollision(
                        this.ball,
                        {x: ballVelX - this.players[i].vel.x * dt, y: ballVelY - this.players[i].vel.y * dt},
                        this.players[i].swept
                    )

                    if (collision.tNear < collision.tFar && collision.tNear <= 1 && collision.tFar > 0) {
                        if (collision.tNear <= 0) {
                            if (this.players[i].isLeft) {
                                if (collision.normalX === 1) {
                                    this.ball.resetCurveBall()
                                    const dx = this.table.x + this.table.width*0.2 - this.players[i].pos.x+this.players[i].width
                                    const dy = this.ball.pos.y - this.players[i].pos.y - this.players[i].height*0.5
                                    let theta = Math.atan2(dy, dx)
                                    const randAngle = (Math.random() - 0.5) * 0.01

                                    let speed = Math.sqrt(this.ball.vel.x*this.ball.vel.x + this.ball.vel.y*this.ball.vel.y)
                                    const speedBoost = this.players[i].speedBoost(this.ball, speed, Math.sin(theta)) // this.speedBoost(this.ball, speed, Math.sin(theta))
                                    const spLower = this.players[i].speedLower(this.ball, speed)

                                    theta += randAngle;

                                    [this.ball.vel.x, this.ball.vel.y] = this.ball.clampSpeed(theta, speed, speedBoost, spLower)

                                    ballVelX = this.ball.vel.x * dt
                                    ballVelY = this.ball.vel.y * dt

                                    this.ball.setCurveBall(speed, theta)
                                }
                                else if (collision.normalY === -1) {
                                    this.players[i].pos.y = this.ball.pos.y + this.ball.radius
                                    this.players[i].vel.y = 0
                                    // this.players[i].acc.y = 0
                                }
                                else if (collision.normalY === 1) {
                                    this.players[i].pos.y = this.ball.pos.y - this.ball.radius - this.players[i].height
                                    this.players[i].vel.y = 0
                                    // this.players[i].acc.y = 0
                                }
                                // else if (collision.normalY === 1 || collision.normalY === -1) {
                                //     this.ball.vel.y *= -1
                                //     ballVelX = this.ball.vel.x * dt
                                //     ballVelY = this.ball.vel.y * dt
                                // }
                                else {
                                    const dx = this.ball.pos.x - collision.nearPointX
                                    const dy = this.ball.pos.y - collision.nearPointY
                                    const len = Math.sqrt(dx*dx + dy*dy)
                                    const norm = {x: dx / len, y: dy / len}
                                    const dot = (this.ball.vel.x - this.players[i].vel.x) * norm.x + (this.ball.vel.y - this.players[i].vel.y) * norm.y
                                    const reflectionVecX = 2 * dot * norm.x
                                    const reflectionVecY = 2 * dot * norm.y
                                    this.ball.vel.x += -reflectionVecX
                                    this.ball.vel.y += -reflectionVecY
                                    ballVelX = this.ball.vel.x * dt
                                    ballVelY = this.ball.vel.y * dt
                                }
                            } else if (!this.players[i].isLeft) {
                                if (collision.normalX === -1) {
                                    this.ball.resetCurveBall()
                                    const dx = this.table.x + this.table.width*0.8 - this.players[i].pos.x
                                    const dy = this.ball.pos.y - this.players[i].pos.y - this.players[i].height*0.5
                                    let theta = Math.atan2(dy, dx)
                                    const randAngle = (Math.random() - 0.5) * 0.01

                                    const speed = Math.sqrt(this.ball.vel.x*this.ball.vel.x + this.ball.vel.y*this.ball.vel.y)
                                    const speedBoost = this.players[i].speedBoost(this.ball, speed, Math.sin(theta)) // this.speedBoost(this.ball, speed, Math.sin(theta))
                                    const spLower = this.players[i].speedLower(this.ball, speed)

                                    theta += randAngle;

                                    [this.ball.vel.x, this.ball.vel.y] = this.ball.clampSpeed(theta, speed, speedBoost, spLower)

                                    ballVelX = this.ball.vel.x * dt
                                    ballVelY = this.ball.vel.y * dt

                                    this.ball.setCurveBall(speed, theta)
                                }
                                else if (collision.normalY === -1) {
                                    this.players[i].pos.y = this.ball.pos.y + this.ball.radius
                                    this.players[i].vel.y = 0
                                    // this.players[i].acc.y = 0
                                }
                                else if (collision.normalY === 1) {
                                    this.players[i].pos.y = this.ball.pos.y - this.ball.radius - this.players[i].height
                                    this.players[i].vel.y = 0
                                    // this.players[i].acc.y = 0
                                }
                                // else if (collision.normalY === 1 || collision.normalY === -1) {
                                //     this.ball.vel.y *= -1
                                //     ballVelX = this.ball.vel.x * dt
                                //     ballVelY = this.ball.vel.y * dt
                                // }
                                else {
                                    const dx = this.ball.pos.x - collision.nearPointX
                                    const dy = this.ball.pos.y - collision.nearPointY
                                    const len = Math.sqrt(dx*dx + dy*dy)
                                    const norm = {x: dx / len, y: dy / len}
                                    const dot = (this.ball.vel.x - this.players[i].vel.x) * norm.x + (this.ball.vel.y - this.players[i].vel.y) * norm.y
                                    const reflectionVecX = 2 * dot * norm.x
                                    const reflectionVecY = 2 * dot * norm.y
                                    this.ball.vel.x += -reflectionVecX
                                    this.ball.vel.y += -reflectionVecY
                                    ballVelX = this.ball.vel.x * dt
                                    ballVelY = this.ball.vel.y * dt
                                }
                            }
                        } else {
                            ballVelX *= collision.tNear
                            ballVelY *= collision.tNear
                        }
                    }
                }
            };

            [ballVelX, ballVelY] = this.ball.checkTableBorder(ballVelX, ballVelY, dt)

            if (!this.isServed && !this.isOut) {
                if (this.playerTurn === -1) {
                    if (this.player1.setAiPos(dt, this.isServed)) {
                        this.serve(this.ball, this.player1)
                    }
                } else if (this.playerTurn === 1) {
                    if (this.player2.setAiPos(dt, this.isServed)) {
                        this.serve(this.ball, this.player2)
                    }
                }
            }

            // this.player1.moveAi(this.ball, dt)
            // this.player2.moveAi(this.ball, dt)

            this.player1.updatePosition(dt)
            this.player2.updatePosition(dt)

            this.ball.pos.x += ballVelX
            this.ball.pos.y += ballVelY

            if (!this.isServed) {
                this.drawServeDirTimeElapsed = 0
                if (this.playerTurn === -1) {
                    this.ball.placeBallToPlayer(this.player1)
                } else if (this.playerTurn === 1) {
                    this.ball.placeBallToPlayer(this.player2)
                }
            } else {
                if (this.drawServeDirTimeElapsed > this.drawServeDirDuration) {
                    this.player1.serveParams.isDraw = false
                    this.player2.serveParams.isDraw = false
                }
                this.drawServeDirTimeElapsed += dt
            }

                // Out
            this.handleOut(dt)

            if (this.endGame) {
                this.endGameAnimationTimeElapsed += dt
            }
        }
    }

    handleOut(dt) {
        if (this.ball.pos.x > this.table.x + this.table.width + this.ball.radius*2) {
            if (!this.isOut) {
                this.player1.score.round += 1
            }
            this.isOut = 'right'
        }
        if (this.ball.pos.x < this.table.x - this.ball.radius*2) {
            if (!this.isOut) {
                this.player2.score.round += 1
            }
            this.isOut = 'left'
        }

        if (this.isOut) {
            if ((this.score.round.p1 >= 11 || this.score.round.p2 >= 11) && Math.abs(this.score.round.p1 - this.score.round.p2) >= 2) {
                if (this.score.round.p1 > this.score.round.p2) {
                    this.score.match.p1 += 1
                    this.player1.score.match += 1
                } else {
                    this.score.match.p2 += 1
                    this.player2.score.match += 1
                }
                this.score.round.p1 = 0
                this.score.round.p2 = 0
                this.player1.score.round = 0
                this.player2.score.round = 0

                if (this.score.match.p1 === 3 || this.score.match.p2 === 3) {
                    this.endGame = true
                    if (this.score.match.p1 > this.score.match.p2) {
                        this.winner = 'p1'
                    } else {
                        this.winner = 'p2'
                    }
                }

                this.playerTurn *= -1
            }
            this.outAnimationTimeElapsed += dt
        }
    }

    drawEndGame(ctx) {
        ctx.beginPath()
        ctx.rect(0, 0, this.cnv.width, this.cnv.height)
        ctx.fillStyle = `hsla(180, 2%, 20%, ${1})`
        ctx.fill()
        ctx.fillStyle = `hsla(160, 80%, 30%, ${Math.max(0, Math.min(this.endGameAnimationTimeElapsed / 1, 1))})`
        ctx.fill()

        const endGameText = this.winner === 'p1' ? 'Игрок 1 Победил!' : 'Игрок 2 Победил!'

        const font = `${Math.floor(this.width * 0.0525)}px "Funnel Sans", sans-serif`
        let metrics = getTextSize(ctx, font, endGameText)

        ctx.save()
        ctx.translate(this.cnv.width*0.5, this.cnv.height*0.5)
        ctx.scale((Math.max(0, Math.min(this.endGameAnimationTimeElapsed / 2, 1))), (Math.max(0, Math.min(this.endGameAnimationTimeElapsed / 2, 1))))
        this.ctx.translate(-this.cnv.width*0.5, -this.cnv.height*0.5)
        drawText(ctx, (this.cnv.width - metrics.width) * 0.5, (this.cnv.height - metrics.boundingBoxHeight) * 0.5, font, endGameText,
            {color: 'white', align: 'left'}
        )
        ctx.restore()

        if (this.endGameAnimationTimeElapsed >= 4) {
            this.reset()
            this.player1.score.round = 0
            this.player2.score.round = 0
            this.player1.score.match = 0
            this.player2.score.match = 0
            this.score = {
                round: {p1: 0, p2: 0},
                match: {p1: 0, p2: 0},
            }

            this.endGame = false
            this.winner = null
            this.paused = false
            this.playerTurn = -1
            this.menu.isActive = true
        }
    }

    drawMatchPoints(ctx) {
        // console.log(this.width * 0.0525)
            // Player 1
        for (let i = 0; i < this.score.match.p1; i++) { // this.score.match.p1
            ctx.beginPath()
            ctx.roundRect(this.table.x + this.table.width*0.5 - this.player1.width * 0.1 - this.table.width*0.35 + (this.player1.width * 0.6 * i), this.table.padding.top*0.5 - this.player1.height * 0.1, this.player1.width * 0.2, this.player1.height * 0.2, [this.player1.roundness*0.2])
            ctx.fillStyle = 'white'
            ctx.fill()
        }

                // Player 2
        for (let i = 0; i < this.score.match.p2; i++) { // this.score.match.p2
            ctx.beginPath()
            ctx.roundRect(this.table.x + this.table.width*0.5 - this.player1.width * 0.1 + this.table.width*0.35 - (this.player1.width * 0.6 * i), this.table.padding.top*0.5 - this.player1.height * 0.1, this.player1.width * 0.2, this.player1.height * 0.2, [this.player1.roundness*0.2])
            ctx.fillStyle = 'white'
            ctx.fill()
        }
    }

    drawOut() {
        if (this.isOut) {
            const progress1 = Math.max(0, Math.min(this.outAnimationTimeElapsed / 1, 1))
            const progress2 = Math.max(0, Math.min((this.outAnimationTimeElapsed - 1.2) / 1, 1))
            // console.log(progress2)

            this.ctx.beginPath()
            this.ctx.rect(0, 0, this.width, this.height)
                                                        // Math.sqrt(1 - Math.pow(x - 1, 2))
            this.ctx.fillStyle = `hsla(180deg, 2%, 20%, ${Math.sqrt(1 - Math.pow(progress1 - 1, 2)) - (progress2*progress2*progress2*progress2)})` //Math.sin((x * Math.PI) / 2)
            this.ctx.fill()

            if (this.isOut === 'right') {
                this.table.rightOutAlpha = progress1
            } else if (this.isOut === 'left') {
                this.table.leftOutAlpha = progress1
            }

            if (progress1 >= 1) {
                this.score.round.p1 = this.player1.score.round
                this.score.round.p2 = this.player2.score.round
                this.table.leftOutAlpha = 0
                this.table.rightOutAlpha = 0
                this.isOut = true
                this.reset()
            }
            if (progress2 >= 1) {
                this.isOut = false
                this.outAnimationTimeElapsed = 0
            }
        }
    }

    drawScore(ctx) {
        const font = `${Math.floor(this.width * 0.0295)}px "Funnel Sans", sans-serif`
        let metrics = getTextSize(ctx, font, this.score.round.p1)
        drawText(ctx, this.table.x + this.table.width*0.5-this.table.width * 0.05, this.table.padding.top*0.5 - metrics.boundingBoxHeight*0.5,  font, this.score.round.p1,
            {color: 'white', align: 'right'}
        )
        metrics = getTextSize(ctx, font, this.score.round.p2)
        drawText(ctx, this.table.x + this.table.width*0.5+this.table.width * 0.05, this.table.padding.top*0.5 - metrics.boundingBoxHeight*0.5,  font, this.score.round.p2,
            {color: 'white'}
        )
    }

    selectPlayer(player) {
        if (player === 0) {
            this.player1.isAi = false
            this.player2.isAi = true
        } else if (player === 1) {
            this.player1.isAi = false
            this.player2.isAi = false
        } else {
            this.player1.isAi = true
            this.player2.isAi = true
        }

        this.reset()
    }

    serve(ball, player) {
        let boost = 1
        if (player.serveCounter.add()) {
            boost = Math.random() + 1
            player.serveCounter.reset()
        } else if (Math.random() <= 0.1) {
            boost = Math.random() + 1
            player.serveCounter.reset()
        }

        this.isServed = true
        ball.vel.x = Math.cos(player.serveParams.angle) * ball.minSpeed * boost
        ball.vel.y = Math.sin(player.serveParams.angle) * ball.minSpeed * boost
    }

    reset() {
        const activePlayer = this.playerTurn == -1 ? this.player1 : this.player2
        this.player1.reset()
        this.player2.reset()
        this.ball.reset()
        // this.ball.placeBallToPlayer(activePlayer)
        this.isServed = false
        this.player1.serveParams.isDraw = this.playerTurn
        this.player2.serveParams.isDraw = this.playerTurn
        this.outPauseTimeElapsed = 0
    }

    handleKeyDown(e) {
        this.cnv.style.cursor = `none`
        if (e.code === 'Escape') {
            this.paused = !this.paused
        }
        if (!this.isOut) {
            this.keys[e.code] = true
        }
        // console.log(e.code)

        if (this.menu.isActive) {
            if (e.code === 'ArrowUp') {
                this.menu.moveUp()
            } else if (e.code === 'ArrowDown') {
                this.menu.moveDown()
            }
        }
    }

    handleKeyUp(e) {
        // this.keys[e.code] = false
        if (this.keys[e.code]) {
            delete this.keys[e.code]
        }
        // this.player1.releaseButton()
        // this.player2.releaseButton()
    }

    animate() {
        if(this.lastTime < 0) {
            this.lastTime = performance.now()
        }
        this.deltatime = (performance.now() - this.lastTime) * 0.001
        this.deltatime = Math.min(this.deltatime, 0.1)

        this.update(this.deltatime, performance.now())
        this.ctx.clearRect(0, 0, this.width, this.height)
        // this.ctx.fillStyle = 'hsla(180, 2%, 20%, 0.4)'
        // this.ctx.fillRect(0, 0, this.width, this.height)
        this.draw()
        this.lastTime = performance.now()

        this.fps = Math.round(1 / this.deltatime)

        requestAnimationFrame(this.animate.bind(this))
    }

    addListeners() {
        window.addEventListener('resize', this.resize.bind(this))
        window.addEventListener('keydown', this.handleKeyDown.bind(this))
        window.addEventListener('keyup', this.handleKeyUp.bind(this))
        window.addEventListener('visibilitychange', (e) => {
            // console.log(e.target.hidden)
            if (!e.target.hidden) {
                this.lastTime = -1
            }
        })
        window.addEventListener('mousemove', (e) => {
            this.cnv.style.cursor = `auto`
        })
    }

    resize() {
        const wrapper = this.cnv.parentElement

        let newWidth = window.innerWidth
        let newHeight = window.innerHeight

        if (newWidth > MAX_WRAPPER_WIDTH) {
            newWidth = MAX_WRAPPER_WIDTH
            newHeight = newWidth / ASPECT_RATIO
        }

        if (newHeight > window.innerHeight) {
            newHeight = window.innerHeight
            newWidth = newHeight * ASPECT_RATIO
        }

        if (newWidth / newHeight > ASPECT_RATIO) {
            newWidth = newHeight * ASPECT_RATIO
            // newHeight = newWidth / ASPECT_RATIO
            // newHeight = window.innerHeight
        } else {
            // newWidth = window.innerWidth
            newHeight = newWidth / ASPECT_RATIO
        }

        wrapper.style.width = `${Math.floor(newWidth)}px`
        wrapper.style.height = `${Math.floor(newHeight)}px`

        const wrapperWidth = wrapper.clientWidth
        const wrapperHeight = wrapper.clientHeight

        const dpr = 1 //window.devicePixelRatio || 1

        const scaleFactor = Math.min(wrapperWidth / WIDTH, wrapperHeight / HEIGHT)
        // console.log(scaleFactor)

        this.cnv.width = WIDTH * dpr
        this.cnv.height = HEIGHT * dpr

        this.width = this.cnv.width
        this.height = this.cnv.height

        if (scaleFactor < 1) {
            this.ctx.translate(this.width*0.5, this.height*0.5)
            this.ctx.scale(scaleFactor, scaleFactor)
            this.ctx.translate(-this.width*0.5, -this.height*0.5)
        }
        // this.ctx.translate((wrapperWidth - this.width)*0.5, (wrapperHeight - this.height)*0.5)
        // this.ctx.translate((wrapperWidth - this.width)*-0.5, (wrapperHeight - this.height)*-0.5)
    }
>>>>>>> 08e6d43a56df9441c86aaaa535937c1582bd5664
}