import {drawLine, counter} from './utils.js'

const maxSpeed = 1750
const minSpeed = 850

export default class Ball {
    constructor(table) {
        this.table = table
        this.color = `hsl(40deg, 95%, 60%)`
        this.radius = Math.floor(this.table.width*0.017) // 23

        this.pos = {
            x: this.table.x + this.table.width*0.5,
            y: this.table.y + this.table.height*0.5
        }

        this.maxSpeed = Math.floor(this.table.width * 1.35)
        this.minSpeed = Math.floor(this.table.width * 0.625)

        this.vel = {x: 0, y: 0}
        this.acc = {x: 0, y: 0}

        this.curveCounter = counter(3)

        this.velocityVector = {x: 0, y: 0}

        this.oldPos = {x: this.pos.x, y: this.pos.y}

        this.isFirstTale = false
        this.isTalePush = false
        this.taleArray = []
        this.taleAlphaDuration = 0.1
        this.talePauseTime = 0
        this.talePushDelay = 0.025
    }

    draw(ctx) {
        // ctx.beginPath()
        // ctx.arc(Math.floor(this.oldPos.x), Math.floor(this.oldPos.y), this.radius, 0, Math.PI * 2)
        // // ctx.arc(Math.floor(this.pos.x), Math.floor(this.pos.y), this.radius, 0, Math.PI * 2)
        // ctx.fillStyle = 'white'
        // ctx.fill()

        ctx.beginPath()
        ctx.arc(Math.floor(this.pos.x), Math.floor(this.pos.y), this.radius, 0, Math.PI * 2)
        ctx.fillStyle = this.color
        ctx.fill()


        ctx.strokeStyle = 'black'
        ctx.lineWidth = 1
        ctx.stroke()

        // this.drawVelocityVector(ctx)

        for (let i = 0; i < this.taleArray.length; i++) {
            ctx.beginPath()
            ctx.arc(Math.floor(this.taleArray[i].x), Math.floor(this.taleArray[i].y), this.radius, 0, Math.PI * 2)
            ctx.fillStyle = `hsla(40deg, 95%, ${60 + (1 - this.taleArray[i].alpha)*40}%, ${this.taleArray[i].alpha})`
            ctx.fill()
        }
    }

    update(dt) {
        this.velocityVector.x = this.vel.x * dt
        this.velocityVector.y = this.vel.y * dt
    }

    updateTale(dt) {
        for (let i = 0; i < this.taleArray.length; i++) {
            this.taleArray[i].alpha = Math.max((this.taleArray[i].alpha * this.taleAlphaDuration - dt) / this.taleAlphaDuration, 0)
            if (this.taleArray[i].alpha <= 0) {
                this.taleArray.splice(i, 1)
            }
        }

        // console.log(this.talePauseTime%0.5)

        if (this.isTalePush && this.talePauseTime > this.talePushDelay) {
            this.talePauseTime = 0
            this.taleArray.push({x: this.pos.x, y: this.pos.y, alpha: 1})
        }

        this.talePauseTime += dt
    }

    clampSpeed(theta, speed, speedBoost, spLower) {
        // console.log(speed/ this.maxSpeed)
        this.color = `hsl(40deg, 95%, ${60 - ((speed / this.maxSpeed)*10)}%)`
        this.isTalePush = false
        let vx = Math.cos(theta) * speed * speedBoost * spLower
        let vy = Math.sin(theta) * speed * speedBoost * spLower

        if (spLower < 1) {
            this.isFirstTale = false
        }

        speed = Math.sqrt(vx*vx + vy*vy)

        if (speed > this.minSpeed * 1.5) {
            if (!this.isFirstTale) {
                this.isFirstTale = true
                this.isTalePush = true
                const colorFactor = speed / this.maxSpeed
                this.color = `hsl(${40 - (colorFactor*5)}deg, 95%, ${60 - (colorFactor*10)}%)`
                this.talePushDelay = (this.minSpeed / speed) * 0.075
                this.taleAlphaDuration = this.talePushDelay * 4
            }
        } else {
            this.color = `hsl(40deg, 95%, 60%)`
        }

        if (speed > this.maxSpeed) {
            vx = (vx / speed) * this.maxSpeed
            vy = (vy / speed) * this.maxSpeed
        } else if (speed < this.minSpeed && speed > 0) {
            vx = (vx / speed) * this.minSpeed
            vy = (vy / speed) * this.minSpeed
        }
        return [vx, vy]
    }

    reset() {
        this.color = `hsl(40deg, 95%, 60%)`
        this.isTalePush = false
        this.isFirstTale = false
        this.vel = {x: 0, y: 0}
        this.acc = {x: 0, y: 0}
        this.curveCounter.reset()
        this.resetCurveBall()
    }

    placeBallToPlayer(player) {
        if (player.isLeft) {
            this.pos.x =  player.pos.x + player.width + this.radius
            this.pos.y = player.pos.y + player.height*0.5
        } else {
            this.pos.x =  player.pos.x - this.radius
            this.pos.y = player.pos.y + player.height*0.5
        }
    }

    setCurveBall(speed, theta) {
        // let a = Math.atan2(this.table.height*0.5 - this.pos.y, this.table.width*0.5 - this.pos.x)
        // let ac = Math.sin(a+theta) * (speed * Math.random() + speed* 0.5)
        // console.log(a, ac)
        if (speed < this.minSpeed*1.75) {
            return
        }

        let angle = 0
        let acc = 0

        if (Math.abs(Math.sin(theta)) < 0.3) {
            if (this.curveCounter.add()) {
                angle = Math.atan2(this.table.height*0.5 - this.pos.y, this.table.width*0.5 - this.pos.x)
                acc = Math.sin(angle) * (speed * Math.random() + speed* 0.5)
                // console.log(angle, acc)
                this.curveCounter.reset()
            }
        }

        // console.log(angle, acc)

        this.acc.y = acc
    }

    resetCurveBall() {
        this.acc.y = 0
        this.acc.x = 0
    }

    checkTableBorder(ballVelX, ballVelY, dt) {
        if (this.vel.y > 0) {
            const tBottom = ((this.table.y + this.table.height - this.radius) - this.pos.y) / ballVelY
            if (tBottom <= 0) {
                this.vel.y *= -1
                ballVelY = this.vel.y * dt
                this.resetCurveBall()
            } else if (tBottom <= 1) {
                ballVelX *= tBottom
                ballVelY *= tBottom
            }
        } else if (this.vel.y < 0) {
            const tTop = (this.table.y + this.radius - this.pos.y) / ballVelY
            if (tTop <= 0) {
                this.vel.y *= -1
                ballVelY = this.vel.y * dt
                this.resetCurveBall()
            } else if (tTop <= 1) {
                ballVelX *= tTop
                ballVelY *= tTop
            }
        }

        // if (this.vel.x > 0) {
        //     const tRight = ((this.table.x + this.table.width - this.radius) - this.pos.x) / ballVelX
        //     if (tRight <= 0) {
        //         this.vel.x *= -1
        //         ballVelX = this.vel.x * dt
        //         this.resetCurveBall()
        //     } else if (tRight <= 1) {
        //         ballVelX *= tRight
        //         ballVelY *= tRight
        //     }
        // } else if (this.vel.x < 0) {
        //     const tLeft = (this.table.x + this.radius - this.pos.x) / ballVelX
        //     if (tLeft <= 0) {
        //         this.vel.x *= -1
        //         ballVelX = this.vel.x * dt
        //         this.resetCurveBall()
        //     } else if (tLeft <= 1) {
        //         ballVelX *= tLeft
        //         ballVelY *= tLeft
        //     }
        // }
        return [ballVelX, ballVelY]
    }

    drawVelocityVector(ctx) {
        drawLine(ctx, this.pos.x, this.pos.y, this.pos.x + this.velocityVector.x, this.pos.y + this.velocityVector.y, {
            lineWidth: 4,
            color: `hsl(100deg, 40%, 100%)`
        })
    }
}