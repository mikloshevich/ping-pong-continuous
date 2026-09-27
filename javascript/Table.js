<<<<<<< HEAD
const tableRatio = 1 / 1.8

export default class Table {
    constructor(gameWidth, gameHeight) {
        this.gameWidth = gameWidth
        this.gameHeight = gameHeight

        this.padding = {top: Math.floor(this.gameHeight * 0.1), bottom: Math.floor(this.gameHeight * 0.2)}
        this.height = Math.floor(this.gameHeight - this.padding.top - this.padding.bottom)
        this.width = Math.floor(this.height / tableRatio)

        this.x = Math.floor((this.gameWidth - this.width) * 0.5)
        this.y = Math.floor(this.padding.top)

        this.lineWidth = Math.floor(this.width * 0.0045) // 6
        this.netLineWidth = Math.max(Math.floor(this.lineWidth / 3), 1) // 2

        this.color = 'white'
        this.leftOutAlpha = 0
        this.rightOutAlpha = 0
    }

    draw(ctx) {
        this.drawTable(ctx)
        this.drawNet(ctx)
    }

    drawTable(ctx) {
        ctx.beginPath()
        ctx.roundRect(this.x, this.y, this.width, this.height, [10])//[top-left, top-right, bottom-right, bottom-left]
        ctx.fillStyle = this.color
        // ctx.fill()
        ctx.strokeStyle = this.color
        ctx.lineWidth = this.lineWidth
        ctx.stroke()

        ctx.beginPath()
        ctx.roundRect(this.x, this.y, this.width*0.5, this.height, [10, 0, 0, 10])
        ctx.fillStyle = `hsla(0deg, 100%, 63%, ${this.leftOutAlpha})`
        ctx.fill()
        ctx.beginPath()
        ctx.roundRect(this.x + this.width*0.5, this.y, this.width*0.5, this.height, [0, 10, 10, 0])
        ctx.fillStyle = `hsla(0deg, 100%, 63%, ${this.rightOutAlpha})`
        ctx.fill()
    }

    drawNet(ctx) {
        const dLength = Math.floor(this.height / 15)
        const remainder = this.height % dLength

        ctx.beginPath()
        ctx.moveTo(this.x + this.width*0.5, this.y)
        ctx.lineTo(this.x + this.width*0.5, this.y + this.height)
        ctx.strokeStyle = this.color
        ctx.lineWidth = this.netLineWidth

        ctx.lineDashOffset = (dLength/4) - remainder/2
        ctx.setLineDash([dLength/2, dLength/2])
        ctx.stroke()
        ctx.setLineDash([])
    }
=======
const tableRatio = 1 / 1.8

export default class Table {
    constructor(gameWidth, gameHeight) {
        this.gameWidth = gameWidth
        this.gameHeight = gameHeight

        this.padding = {top: Math.floor(this.gameHeight * 0.1), bottom: Math.floor(this.gameHeight * 0.2)}
        this.height = Math.floor(this.gameHeight - this.padding.top - this.padding.bottom)
        this.width = Math.floor(this.height / tableRatio)

        this.x = Math.floor((this.gameWidth - this.width) * 0.5)
        this.y = Math.floor(this.padding.top)

        this.lineWidth = Math.floor(this.width * 0.0045) // 6
        this.netLineWidth = Math.max(Math.floor(this.lineWidth / 3), 1) // 2

        this.color = 'white'
        this.leftOutAlpha = 0
        this.rightOutAlpha = 0
    }

    draw(ctx) {
        this.drawTable(ctx)
        this.drawNet(ctx)
    }

    drawTable(ctx) {
        ctx.beginPath()
        ctx.roundRect(this.x, this.y, this.width, this.height, [10])//[top-left, top-right, bottom-right, bottom-left]
        ctx.fillStyle = this.color
        // ctx.fill()
        ctx.strokeStyle = this.color
        ctx.lineWidth = this.lineWidth
        ctx.stroke()

        ctx.beginPath()
        ctx.roundRect(this.x, this.y, this.width*0.5, this.height, [10, 0, 0, 10])
        ctx.fillStyle = `hsla(0deg, 100%, 63%, ${this.leftOutAlpha})`
        ctx.fill()
        ctx.beginPath()
        ctx.roundRect(this.x + this.width*0.5, this.y, this.width*0.5, this.height, [0, 10, 10, 0])
        ctx.fillStyle = `hsla(0deg, 100%, 63%, ${this.rightOutAlpha})`
        ctx.fill()
    }

    drawNet(ctx) {
        const dLength = Math.floor(this.height / 15)
        const remainder = this.height % dLength

        ctx.beginPath()
        ctx.moveTo(this.x + this.width*0.5, this.y)
        ctx.lineTo(this.x + this.width*0.5, this.y + this.height)
        ctx.strokeStyle = this.color
        ctx.lineWidth = this.netLineWidth

        ctx.lineDashOffset = (dLength/4) - remainder/2
        ctx.setLineDash([dLength/2, dLength/2])
        ctx.stroke()
        ctx.setLineDash([])
    }
>>>>>>> 08e6d43a56df9441c86aaaa535937c1582bd5664
}