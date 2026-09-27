import {drawLine, clamp, counter} from './utils.js'

const speed = 800
const acceleration = 400
const accBoost = 0 // 35 // 90

export default class Player {
    constructor(table, ball, isLeft) {
        this.table = table
        this.ball = ball
        this.color = 'white'
        this.isLeft = isLeft
        this.isAi = false
        this.isPlayerTurn = -1

        this.height = Math.floor(this.table.height * 0.25)
        this.width = Math.floor(this.height * 0.2)

        this.roundness = Math.floor((this.height / this.width) * 1)

        this.leftPosX = Math.floor(this.table.x - this.width + this.table.width*0.05)
        this.rightPosX = Math.floor(this.table.x + this.table.width*(1 - 0.05))

        this.pos = {
            x: this.isLeft ? this.leftPosX : this.rightPosX,
            y: this.table.y + (this.table.height - this.height) * 0.5
        }

        this.swept = {
            pos: {x: this.pos.x - this.ball.radius, y: this.pos.y - this.ball.radius},
            width: this.width + this.ball.radius*2,
            height: this.height + this.ball.radius*2
        }

        this.lineWidth = Math.max(Math.floor(this.table.width * 0.00295), 1)
        this.playerLineWidth = Math.max(Math.floor(this.table.width * 0.00175), 1)
        // console.log(this.playerLineWidth, this.table.width * 0.00175)

        this.speed = Math.floor(this.table.width * 0.5885) // 800
        this.acceleration = Math.floor(this.table.width * 0.2945) // 400
        this.accBoost = 0

        this.vel = {x: 0, y: 0}
        this.acc = {x: 0, y: 0}
        this.isDeccelerating = true

        this.serveParams = {
            startP: {x: 0, y: 0},
            endP: {x: 0, y: 0},
            normX: 0,
            normY: 0,
            angle: 0,
            origin: 0,
            aimAt: 0.4,
            isDraw: -1,
        }

        this.score = {
            round: 0,
            match: 0,
        }

        this.isAnimating = false
        this.timePassed = 0

        this.spBoostCounter = counter(5)
        this.spLowerCounter = counter(3)
        this.serveCounter = counter(4)
    }

    draw(ctx) {
        // console.log(this.width, this.height)
        ctx.beginPath()
        ctx.roundRect(Math.floor(this.pos.x), Math.floor(this.pos.y), this.width, this.height, [this.roundness])
        ctx.fillStyle = this.color // this.gradient
        ctx.fill()
        ctx.strokeStyle = 'black'
        ctx.lineWidth = 2
        ctx.stroke()

        // Serve Direction
        if (this.isLeft && this.serveParams.isDraw == -1) {
            drawLine(ctx,
                this.serveParams.startP.x,
                this.serveParams.startP.y,
                this.serveParams.endP.x,
                this.serveParams.endP.y,
                {
                    color:`hsl(100deg, 40%, 100%)`,
                    lineWidth: this.lineWidth
                }
            )
        } else if (!this.isLeft && this.serveParams.isDraw == 1) {
            drawLine(ctx,
                this.serveParams.startP.x,
                this.serveParams.startP.y,
                this.serveParams.endP.x,
                this.serveParams.endP.y,
                {
                    color:`hsl(100deg, 40%, 100%)`,
                    lineWidth: this.lineWidth
                }
            )
        }
    }

    updateMovement(dt) {
        if (this.isDeccelerating) {
            this.acc.y = this.vel.y * dt * -this.speed*0.8
            this.acc.x = this.vel.x * dt * -this.speed*0.8
        }

        this.vel.x += this.acc.x * dt
        this.vel.y += this.acc.y * dt
        // console.log(this.vel.y)

        this.vel.x = Math.max(-this.speed, Math.min(this.vel.x, this.speed))
        this.vel.y = Math.max(-this.speed, Math.min(this.vel.y, this.speed))

        if (Math.abs(this.acc.x) < 1) {
            this.acc.x = 0
        }
        if (Math.abs(this.acc.y) < 1) {
            this.acc.y = 0
        }

        if (Math.abs(this.vel.x) < 1) {
            this.vel.x = 0
        }
        if (Math.abs(this.vel.y) < 1) {
            this.vel.y = 0
        }
        // console.log(this.table.width * 0.7945)
    }

    updatePosition(dt) {
        this.pos.x += this.vel.x * dt
        this.pos.y += this.vel.y * dt
        this.swept.pos.x = this.pos.x - this.ball.radius
        this.swept.pos.y = this.pos.y - this.ball.radius
        // this.swept.pos.x += this.vel.x * dt
        // this.swept.pos.y += this.vel.y * dt

        if (this.pos.y < this.table.y) {
            this.pos.y = this.table.y
            this.swept.pos.y = this.pos.y - this.ball.radius
            this.vel.y = 0
            this.acc.y = 0
        }
        if (this.pos.y > this.table.y + this.table.height - this.height) {
            this.pos.y = this.table.y + this.table.height - this.height
            this.swept.pos.y = this.pos.y - this.ball.radius
            this.vel.y = 0
            this.acc.y = 0
        }
        if (this.pos.x < this.table.x) {
            this.pos.x = this.table.x
            this.vel.x = 0
            this.acc.x = 0
        }
        if (this.pos.x > this.table.x + this.table.width - this.width) {
            this.pos.x = this.table.x + this.table.width - this.width
            this.vel.x = 0
            this.acc.x = 0
        }

        if (this.isLeft && this.serveParams.isDraw == -1) {
            this.updateServeParams()
        } else if (!this.isLeft && this.serveParams.isDraw == 1) {
            this.updateServeParams()
        }
    }

    moveAi(ball, dt) {
        if (this.isAi) {
            // this.setAiPos(ball, dt, isServed, playerTurn)
            let aiDistXFac = Math.abs(ball.pos.x - (this.pos.x + this.width*0.5)) / Math.floor(this.table.width * 0.73) //0.7945
            aiDistXFac = clamp(1 - aiDistXFac, 0, 1)
            aiDistXFac = Math.pow(aiDistXFac, 2)
            if (Math.abs(ball.pos.y - (this.pos.y + this.height*0.5)) > 0) {
                // this.pos.y += (ball.pos.y - (this.pos.y + this.height*0.5)) * aiDistXFac*0.1
                this.vel.y = (ball.pos.y - (this.pos.y + this.height*0.5)) * aiDistXFac * 11
                // this.swept.pos.y = this.pos.y - this.ball.radius
            }
        }
    }

    setAiPos(dt) {
        if (!this.isAi) {
            return false
        }

        if (!this.isAnimating) {
            this.isAnimating = true
            this.timePassed = 0
            this.randomPos = (this.table.height) * Math.random() - this.table.height*0.5
            this.startY = this.pos.y
            // this.randomPos = this.startY + this.randomPos
            this.randomPos = clamp(this.startY + this.randomPos, this.table.y, this.table.y + this.table.height - this.height)
        } else {
            let p = clamp(this.timePassed / 1.5, 0, 1)
            // console.log(p)

            const endY = this.randomPos
            this.pos.y = this.startY + (endY - this.startY) * p

            if (p >= 1) {
                this.isAnimating = false
                return true
            }
            this.timePassed += dt
            return false
        }
    }

    speedBoost(ball, ballSpeed, sin) {
        let boost = 1
        // console.log(sin)

        if (ballSpeed < ball.maxSpeed && Math.abs(sin) < 0.25) {
            // console.log('count:'+this.spBoostCounter.get())

            if (this.spBoostCounter.add()) {
                boost = (1 * Math.random() + 1.35)*1
                this.spBoostCounter.reset()
                // console.log('boost count:'+boost)
            }
            else if (Math.random() <= 0.3) {
                boost = (1 * Math.random() + 1.35)*1
                this.spBoostCounter.reset()
                // console.log('boost X%:'+boost)
            }
        }

        boost = clamp(boost, 1, 2)
        // console.log(boost)
        return boost
    }

    speedLower(ball, ballSpeed) {
        let cut = 1

        if (ballSpeed >= ball.minSpeed*1) {
            // console.log('CUT!!!')
            if (this.spLowerCounter.add()) {
                cut = ball.minSpeed / (ballSpeed * (0.9 + Math.random() *0.2))
                this.spLowerCounter.reset()
                // console.log('cut count:'+cut)
            }
            else if (Math.random() < 0.15) {
                cut = ball.minSpeed / (ballSpeed * (0.9 + Math.random() *0.2))
                this.spLowerCounter.reset()
                // console.log('cut %:'+cut)
            }
        }

        cut = clamp(cut, 0.1, 1)
        return cut
    }

    reset() {
        this.pos.x =  this.isLeft ? this.table.x - this.width + Math.floor(this.table.width*0.1) : this.table.x + Math.floor(this.table.width*(1 - 0.1))
        this.pos.y = this.table.y + (this.table.height - this.height) * 0.5
        this.swept.pos.x = this.pos.x - this.ball.radius
        this.swept.pos.y = this.pos.y - this.ball.radius

        this.vel.x = 0
        this.vel.y = 0
        this.acc.x = 0
        this.acc.y = 0
        this.spLowerCounter.reset()
        this.spBoostCounter.reset()
    }

    updateServeParams() {
        const aimAt = this.isLeft ? this.serveParams.aimAt : 1 - this.serveParams.aimAt
        const startP = {
            x: this.isLeft ? this.pos.x + this.width + this.serveParams.origin : this.pos.x - this.serveParams.origin,
            y: this.pos.y + this.height*0.5
        }
        const endP = {
            x: this.table.x + this.table.width * aimAt,
            y: this.table.y + this.table.height*0.5,
        }
        const dx = endP.x - startP.x
        const dy = endP.y - startP.y

        const theta = Math.atan2(dy, dx)
        const dist = Math.sqrt(dx*dx + dy*dy)
        const normX = dist === 0 ? 0 : dx / dist
        const normY = dist === 0 ? 0 : dy / dist
        const len = Math.floor(this.table.width * 0.07375)

        this.serveParams.startP.x = startP.x
        this.serveParams.startP.y = startP.y
        this.serveParams.endP.x = startP.x + normX*len
        this.serveParams.endP.y = startP.y + normY*len
        this.serveParams.angle = theta
    }

    moveUp() {
        this.acc.x = 0
        this.acc.y += -this.acceleration
        this.vel.y += -this.accBoost
        this.isDeccelerating = false
    }

    moveDown() {
        this.acc.x = 0
        this.acc.y += this.acceleration
        this.vel.y += this.accBoost
        this.isDeccelerating = false
    }

    moveLeft() {
        this.acc.y = 0
        this.acc.x += -this.acceleration
        this.vel.x += -this.accBoost
        this.isDeccelerating = false

    }

    moveRight() {
        this.acc.y = 0
        this.acc.x += this.acceleration
        this.vel.x += this.accBoost
        this.isDeccelerating = false
    }

    releaseButton() {
        // this.acc.y = 0
        this.isDeccelerating = true
    }
}