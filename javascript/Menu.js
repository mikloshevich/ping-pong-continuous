import {drawText, getTextSize, positiveMod, clamp} from './utils.js'

export default class Menu {
    constructor(ctx, width, height) {
        this.ctx = ctx
        this.GW = width
        this.GH = height

        this.isActive = true

        this.fontSize = Math.floor(this.GW * 0.042) // 80
        this.letterSpacing = Math.floor(this.GW * 0.0055) // 10
        this.font = `600 ${this.fontSize}px "Funnel Sans", sans-serif`
        this.padding = Math.floor(this.GW * 0.0125) // 24
        this.horPadding = this.padding * 4
        this.vertPadding = this.padding * 2

        this.menuOptions = [
            // 'ИИ против ИИ',
            '1 Игрок',
            '2 Игрокa',
            'ИИ против ИИ',
        ]

        this.lineLength = {}
        this.line = {}

        this.minSize = {
            width: 0,
            height: 0,
        }

        for (let i = 0; i < this.menuOptions.length; i++) {
            const metrics = getTextSize(this.ctx, this.font, this.menuOptions[i], this.letterSpacing)
            this.lineLength[i] = 0
            this.line[i] = {
                len: 0,
                start: 0,
                elapsed: -1
            }

            if (this.minSize.width < metrics.width) {
                this.minSize.width = metrics.width
            }

            if (this.minSize.height < metrics.boundingBoxHeight) {
                this.minSize.height = metrics.boundingBoxHeight
            }

        }

        // console.log(this.line)

        this.textPos = {x: this.GW*0.5 - this.minSize.width*0.5, y: this.GH*0.5 - (this.minSize.height * this.menuOptions.length)*0.5}
        this.pos = {x: this.textPos.x, y: this.textPos.y}

        this.highlighter = {
            x: this.textPos.x - this.padding*2,
            y: this.textPos.y - this.padding,
            width: this.minSize.width + this.padding*4,
            height: this.minSize.height + this.padding*2
        }

        this.lineLength[0] = this.highlighter.width - this.padding*2
        this.line[0].len = this.highlighter.width - this.padding*2

        this.startY = this.pos.y
        this.moveElapsed = -1
        this.blink = 0
        this.blinkElapsed = 0

        this.index = 0

        this.gradient = this.ctx.createLinearGradient(
                Math.floor(this.textPos.x - this.padding),
                Math.floor(this.textPos.y + this.highlighter.height*0.5+this.padding*0.5), //+(this.minSize.height*i),
                Math.floor(this.textPos.x + this.highlighter.width+this.padding*10),
                Math.floor(this.textPos.y + this.highlighter.height*0.5+this.padding*0.5) //+(this.minSize.height*i)
            )
        // this.gradient.addColorStop(0, "white")
        // this.gradient.addColorStop(0.1, "white")
        // this.gradient.addColorStop(0.6, `hsla(40deg, 100%, 60%, ${1})`)
        // // this.gradient.addColorStop(0.9, `hsla(25deg, 100%, 50%, ${1})`)
        // this.gradient.addColorStop(0.7, `hsla(30deg, 100%, 60%, ${1})`)
        // this.gradient.addColorStop(0.9, `hsla(130deg, 100%, 70%, ${1})`)
        // this.gradient.addColorStop(1, `hsla(130deg, 100%, 70%, ${1})`)

        this.gradient.addColorStop(0, `hsla(40deg, 100%, 60%, ${1})`)
        this.gradient.addColorStop(0.1, `hsla(30deg, 100%, 60%, ${1})`)
        this.gradient.addColorStop(0.2, `hsla(40deg, 100%, 60%, ${1})`)
        // this.gradient.addColorStop(0.1, `hsla(130deg, 100%, 70%, ${1})`)
        // // this.gradient.addColorStop(0.2, `hsla(25deg, 100%, 50%, ${1})`)
        this.gradient.addColorStop(0.7, "white")
        this.gradient.addColorStop(1, "white")
    }

    update(dt) {
        this.blink = (1 + Math.sin(this.blinkElapsed + Math.PI*0.5)) * 0.5
        this.blink = 1 - Math.pow(1 - this.blink, 3)
        this.blink = Math.pow(this.blink, 4)
        this.blinkElapsed += dt*8

        if (this.moveElapsed === 0) {
            this.startY = this.highlighter.y
        }

        if (this.moveElapsed >= 0) {
            let t = Math.min(this.moveElapsed / 0.25, 1) || 0
            /*
                Math.pow(t, 2), 1 - Math.cos((t * Math.PI) / 2),
                Math.sin((t * Math.PI) / 2), 1 - (1 - t) * (1 - t),
                1 - Math.pow(1 - t, 3), -(Math.cos(Math.PI * t) - 1) / 2,
                t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
                Math.sqrt(1 - Math.pow(t - 1, 2)),
            */
            t = Math.sin((t * Math.PI) / 2)

            this.highlighter.y = this.startY + ((this.textPos.y - this.padding + (this.highlighter.height * this.index)) - this.startY) * t
            // this.highlighter.y += ((this.textPos.y - this.padding + (this.highlighter.height * this.index)) - this.highlighter.y) * 0.1

            if (t >= 1) {
                this.moveElapsed = -1
            }

            this.moveElapsed += dt
        }

        for (let i = 0; i < this.menuOptions.length; i++) {
            if (this.line[i].elapsed === 0) {
                this.line[i].start = this.line[i].len
            }
            // console.log(this.line[i].elapsed)
            if (this.line[i].elapsed >= 0) {
                let t = Math.min(this.line[i].elapsed / 0.5, 1) || 0
                /*
                    Math.pow(t, 2), 1 - Math.cos((t * Math.PI) / 2),
                    Math.sin((t * Math.PI) / 2), 1 - (1 - t) * (1 - t),
                    1 - Math.pow(1 - t, 3), -(Math.cos(Math.PI * t) - 1) / 2,
                    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
                    Math.sqrt(1 - Math.pow(t - 1, 2)),
                */
                // x = Math.sin((x * Math.PI) / 2)

                let fac2 = clamp(Math.abs(this.index - i), 0, 1)
                fac2 = 1 - fac2

                if (i === 0) {
                    // console.log(fac2)
                }

                this.line[i].len = (this.line[i].start + ((this.highlighter.width - this.padding*2)*fac2 - this.line[i].start)*t)

                if (t >= 1) {
                    this.line[i].elapsed = -1
                }

                this.line[i].elapsed += dt
            }
        }
    }

    draw() {
            // BackGround
        this.ctx.beginPath()
        this.ctx.rect(0, 0, this.GW, this.GH)
        this.ctx.fillStyle = `hsla(140deg, 2%, 20%, ${1})`
        this.ctx.fill()


            // Middle BG
        this.ctx.beginPath()
        this.ctx.roundRect(
            Math.floor(this.textPos.x - this.highlighter.height - this.padding*3 - this.padding*4),
            Math.floor(this.textPos.y - this.padding - this.padding*4),
            this.highlighter.width + this.highlighter.height + this.padding + this.padding*8,
            (this.highlighter.height*this.menuOptions.length) + this.padding*8,
            [10]
        )
        this.ctx.fillStyle = `hsla(140deg, 2%, 40%, ${1})`
        this.ctx.fill()
        this.ctx.strokeStyle = `hsla(140deg, 0%, 100%, ${1})`
        this.ctx.lineWidth = 4
        this.ctx.stroke()

            // White Text
        for (let i = 0; i < this.menuOptions.length; i++) {
            drawText(this.ctx, Math.floor(this.textPos.x), Math.floor(this.textPos.y + (i*this.highlighter.height)), this.font, this.menuOptions[i], {
                color: 'hsl(140deg, 0%, 94%)',
                // isStroke: true,
                // isFill: false,
                strokeColor: `hsla(140deg, 0%, 0%, ${1})`,
                // lineWidth: 2,
                letterSpacing: this.letterSpacing
            })
        }

        this.ctx.beginPath()
        this.ctx.roundRect(Math.floor(this.highlighter.x+10), Math.floor(this.highlighter.y-10), this.highlighter.width, this.highlighter.height, [10])
        this.ctx.fillStyle = `hsla(140deg, 0%, 0%, ${0.2})`
        this.ctx.fill()

        this.ctx.beginPath()
        this.ctx.roundRect(Math.floor(this.highlighter.x), Math.floor(this.highlighter.y), this.highlighter.width, this.highlighter.height, [10])
        this.ctx.fillStyle = `hsla(140deg, 0%, 100%, ${1})`
        this.ctx.fill()
        this.ctx.strokeStyle = `hsla(140deg, 0%, 0%, ${1})`
        this.ctx.lineWidth = 2
        this.ctx.stroke()

        this.ctx.save()
        this.ctx.clip()
        for (let i = 0; i < this.menuOptions.length; i++) {
            // Math.sqrt(1 - Math.pow(x - 1, 2)), 1 - Math.sqrt(1 - Math.pow(x, 2))
            // fac = Math.sqrt(1 - Math.pow(fac - 1, 2)) //Math.sin((fac * Math.PI) / 2)

                // LINE //
            let fac2 = clamp(Math.abs(this.index - i), 0, 1)
            fac2 = 1 - fac2
            this.lineLength[i] += ((this.highlighter.width - this.padding*2)*fac2 - this.lineLength[i]) * 0.15*0.5
            let dist = this.lineLength[i] / (this.highlighter.width - this.padding*2)
            if (i === 0) {
                // console.log(this.lineLength[i] / (this.highlighter.width - this.padding*2))
                // console.log(fac2)
            }

            const x = fac2 === 1 ? (this.textPos.x - this.padding) + this.highlighter.width - this.padding*2 : this.textPos.x - this.padding
            const w = fac2 === 1 ? -this.line[i].len : this.line[i].len

            this.ctx.beginPath()
            this.ctx.roundRect(
                Math.floor(x),
                Math.floor(this.textPos.y + this.minSize.height*0.25 + 4) + (this.highlighter.height*i),
                 // -this.lineLength[i],
                // -(this.highlighter.width - this.padding*2)*Math.sqrt(1/(1/dist)),
                w,
                this.padding,
                [10]
                )
            // this.ctx.roundRect(
            //     Math.floor(this.textPos.x - this.padding),
            //     Math.floor(this.textPos.y + this.padding) + (this.highlighter.height*i),
            //     this.lineLength[i],
            //     this.padding,
            //     [10]
            //     )
            // console.log(this.line[i].len / (this.highlighter.width - this.padding*2))
            this.ctx.fillStyle =  this.gradient // `hsla(40deg, 95%, 60%, ${1})`
            // this.ctx.save()
            // this.ctx.globalAlpha = this.line[i].len / (this.highlighter.width - this.padding*2)
            this.ctx.fill()
            // this.ctx.restore()

            for (let j = 0; j < 3; j+=1) {
                const shadowOffset = j*2 + 2
                drawText(this.ctx, Math.floor(this.textPos.x + shadowOffset), Math.floor(this.textPos.y + (i*this.highlighter.height) - shadowOffset), this.font, this.menuOptions[i], {
                    color: `hsla(140deg, 0%, 0%, ${(1 - (j/3))*0.2})`,
                    letterSpacing: this.letterSpacing
                })
            }
            drawText(this.ctx, Math.floor(this.textPos.x), Math.floor(this.textPos.y + (i*this.highlighter.height)), this.font, this.menuOptions[i], {
                color: `hsla(140deg, 2%, 27%, ${1})`,
                isStroke: true,
                strokeColor: `hsla(140deg, 0%, 55%, ${1})`,
                letterSpacing: this.letterSpacing
            })
        }

        this.ctx.restore()

            // Left Paddle //
        this.ctx.beginPath()
        this.ctx.roundRect(
            Math.floor(this.textPos.x - this.padding*3 - this.highlighter.height+10),
            Math.floor(this.textPos.y - this.padding*2-10),
            this.highlighter.height,
            this.highlighter.height*this.menuOptions.length + this.padding*2,
            [10])
        this.ctx.fillStyle = `hsla(140deg, 0%, 0%, ${0.2})`
        this.ctx.fill()

        this.ctx.beginPath()
        this.ctx.roundRect(
            Math.floor(this.textPos.x - this.padding*3 - this.highlighter.height),
            Math.floor(this.textPos.y - this.padding*2),
            this.highlighter.height,
            this.highlighter.height*this.menuOptions.length + this.padding*2,
            [10])
        this.ctx.fillStyle = `hsla(140deg, 0%, 100%, ${1})`
        this.ctx.fill()
        this.ctx.strokeStyle = `hsla(140deg, 0%, 0%, ${1})`
        this.ctx.lineWidth = 2
        this.ctx.stroke()
            // Left Paddle End //


        // this.ctx.beginPath()
        // this.ctx.arc(Math.floor(10+this.pos.x-this.minSize.height*0.5 - this.padding), Math.floor(10+this.pos.y+this.minSize.height*0.5), this.minSize.height*0.5 - this.padding, 0, Math.PI*2)
        // this.ctx.fillStyle = `hsla(40deg, 95%, 0%, ${this.blink*0.2})`
        // this.ctx.fill()

            // Jumping Ball
        this.ctx.beginPath()
        this.ctx.arc(Math.floor(this.highlighter.x-this.highlighter.height*0.5 - this.padding), Math.floor(this.highlighter.y+this.highlighter.height*0.5), (this.highlighter.height*0.5 - this.padding*1.5)*this.blink+5, 0, Math.PI*2)
        this.ctx.fillStyle = `hsla(40deg, 95%, 60%, ${this.blink+0.1})`
        this.ctx.fill()
        this.ctx.lineWidth = 2
        this.ctx.strokeStyle = `hsla(40deg, 95%, 0%, ${this.blink})`
        this.ctx.stroke()
    }

    moveUp() {
        this.index--
        this.index = positiveMod(this.index, this.menuOptions.length)
        this.moveElapsed = 0
        for (let i = 0; i < this.menuOptions.length; i++) {
            this.line[i].elapsed = 0
        }
    }

    moveDown() {
        this.index++
        this.index = positiveMod(this.index, this.menuOptions.length)
        this.moveElapsed = 0
        for (let i = 0; i < this.menuOptions.length; i++) {
            this.line[i].elapsed = 0
        }
    }
}