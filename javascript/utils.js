<<<<<<< HEAD
export function positiveMod(num, mod) {
    return ((num % mod) + mod) % mod
}

export function clamp(val, min, max) {
    return Math.min(Math.max(val, min), max)
}

export function progressGetter() {
    let elapsed = 0
    let progress = 0
    let direction = 1
    let isRunning = false
    return {
        update(deltatime) {
            if (!isRunning) {
                return this
            }
            elapsed += deltatime
            elapsed = Math.max(elapsed, 0)
            return this
        },
        getProgress(duration, delay = 0) {
            progress = Math.min(Math.max((elapsed - delay) / duration, 0), 1)
            if (direction < 0) {
                progress = 1 - progress
            }
            // return Math.min(Math.max(progress, 0), 1)
            return progress
        },
        reset() {
            progress = 0
            elapsed = 0
            direction = 1
            isRunning = false
            return this
        },
        reversed() {
            direction = -1
        },
        reverse() {
            direction *= -1
            return this
        },
        start() {
            isRunning = true
            return this
        },
        stop() {
            isRunning = false
            return this
        }
    }
}

export function animator(startTime, duration, iteration = 0) {
    const elapsed = performance.now() - startTime
    return Math.max(Math.min((elapsed / duration) - iteration, 1), 0)
}

export function roundNumber(number, precision) {
    const factor = Math.pow(10, precision)
    return Math.floor(number * factor) / factor
}

export function drawText(ctx, posX, posY, font, text,
    {
        color,
        strokeColor,
        align,
        base,
        letterSpacing,
        isStroke,
        lineWidth,
        isFill=true
    } = {}) {
    ctx.beginPath()
    ctx.letterSpacing = `${letterSpacing || 0}px`
    ctx.font = font
    ctx.textBaseline = base || 'top'
    ctx.textAlign = align || 'left'
    ctx.fillStyle = color || 'black'
    ctx.strokeStyle = strokeColor || 'black'
    ctx.lineWidth = lineWidth || 1
    if (isFill) ctx.fillText(`${text}`, posX, posY)
    if (isStroke) ctx.strokeText(`${text}`, posX, posY)
    ctx.closePath()
}

export function getTextSize(ctx, font, text, letterSpacing=0) {
        ctx.font = font
        ctx.letterSpacing = `${letterSpacing || 0}px`
        const metrics = ctx.measureText(text)
        const width = metrics.width
        const boundingBoxWidth = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent
        const fontHeight = metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent
        const boundingBoxHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent
        return {width, boundingBoxWidth, fontHeight, boundingBoxHeight}
    }

export function drawLine(ctx, sx, sy, ex, ey, {lineWidth, color=`hsl(100deg, 40%, 100%)`}) {
    ctx.beginPath()
    ctx.moveTo(sx, sy)
    ctx.lineTo(ex, ey)
    ctx.strokeStyle = color
    ctx.lineWidth = lineWidth || 1
    ctx.stroke()
    ctx.closePath()
}

export function drawCircle(ctx, x, y, radius, {fill, stroke, lineWidth} = {}) {
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI*2)
    ctx.fillStyle = fill || 'white'
    ctx.strokeStyle = stroke || 'black'
    ctx.lineWidth = lineWidth || 1
    if (fill) {
        ctx.fill()
    }
    if (stroke) {
        ctx.stroke()
    }
}

export function counter(max, initVal=1) {
    let count = initVal
    return {
        add: function() {
            if (count < max) {
                count++
                return false
            } else {
                // count = initVal
                return true
            }
            return false
        },
        reset: function() {
            count = initVal
            return true
        },
        get: function() {
            return count
        }
    }

    // return function(reset) {
    //     // console.log('count:'+count)
    //     if (count >= max) {
    //         count = 0
    //         return true
    //     } else if (reset) {
    //         count = 0
    //         return true
    //     } else {
    //         count++
    //         return false
    //     }
    // }
}

export function counter2(max, val=0) {
    let count = val
    count++

    if (count >= max) {
        count = 0
        return true
    }

    return {
        // console.log(count)
        reset: function() {
            count = 0
            return false
        }
    }
}

export function calcAngle(start, end) {
    // let dx = start.x - end.x
    // let dy = start.y - end.y
    let dx =  end.x - start.x
    let dy =  end.y - start.y

    const theta = Math.atan2(dy, dx)
    let dist = 0

    dist = Math.sqrt(dx*dx + dy*dy)

    const normDx = dist === 0 ? 0 : dx / dist
    const normDy = dist === 0 ? 0 : dy / dist

    return {theta, dist, dx, dy, normDx, normDy}
=======
export function positiveMod(num, mod) {
    return ((num % mod) + mod) % mod
}

export function clamp(val, min, max) {
    return Math.min(Math.max(val, min), max)
}

export function progressGetter() {
    let elapsed = 0
    let progress = 0
    let direction = 1
    let isRunning = false
    return {
        update(deltatime) {
            if (!isRunning) {
                return this
            }
            elapsed += deltatime
            elapsed = Math.max(elapsed, 0)
            return this
        },
        getProgress(duration, delay = 0) {
            progress = Math.min(Math.max((elapsed - delay) / duration, 0), 1)
            if (direction < 0) {
                progress = 1 - progress
            }
            // return Math.min(Math.max(progress, 0), 1)
            return progress
        },
        reset() {
            progress = 0
            elapsed = 0
            direction = 1
            isRunning = false
            return this
        },
        reversed() {
            direction = -1
        },
        reverse() {
            direction *= -1
            return this
        },
        start() {
            isRunning = true
            return this
        },
        stop() {
            isRunning = false
            return this
        }
    }
}

export function animator(startTime, duration, iteration = 0) {
    const elapsed = performance.now() - startTime
    return Math.max(Math.min((elapsed / duration) - iteration, 1), 0)
}

export function roundNumber(number, precision) {
    const factor = Math.pow(10, precision)
    return Math.floor(number * factor) / factor
}

export function drawText(ctx, posX, posY, font, text,
    {
        color,
        strokeColor,
        align,
        base,
        letterSpacing,
        isStroke,
        lineWidth,
        isFill=true
    } = {}) {
    ctx.beginPath()
    ctx.letterSpacing = `${letterSpacing || 0}px`
    ctx.font = font
    ctx.textBaseline = base || 'top'
    ctx.textAlign = align || 'left'
    ctx.fillStyle = color || 'black'
    ctx.strokeStyle = strokeColor || 'black'
    ctx.lineWidth = lineWidth || 1
    if (isFill) ctx.fillText(`${text}`, posX, posY)
    if (isStroke) ctx.strokeText(`${text}`, posX, posY)
    ctx.closePath()
}

export function getTextSize(ctx, font, text, letterSpacing=0) {
        ctx.font = font
        ctx.letterSpacing = `${letterSpacing || 0}px`
        const metrics = ctx.measureText(text)
        const width = metrics.width
        const boundingBoxWidth = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent
        const fontHeight = metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent
        const boundingBoxHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent
        return {width, boundingBoxWidth, fontHeight, boundingBoxHeight}
    }

export function drawLine(ctx, sx, sy, ex, ey, {lineWidth, color=`hsl(100deg, 40%, 100%)`}) {
    ctx.beginPath()
    ctx.moveTo(sx, sy)
    ctx.lineTo(ex, ey)
    ctx.strokeStyle = color
    ctx.lineWidth = lineWidth || 1
    ctx.stroke()
    ctx.closePath()
}

export function drawCircle(ctx, x, y, radius, {fill, stroke, lineWidth} = {}) {
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI*2)
    ctx.fillStyle = fill || 'white'
    ctx.strokeStyle = stroke || 'black'
    ctx.lineWidth = lineWidth || 1
    if (fill) {
        ctx.fill()
    }
    if (stroke) {
        ctx.stroke()
    }
}

export function counter(max, initVal=1) {
    let count = initVal
    return {
        add: function() {
            if (count < max) {
                count++
                return false
            } else {
                // count = initVal
                return true
            }
            return false
        },
        reset: function() {
            count = initVal
            return true
        },
        get: function() {
            return count
        }
    }

    // return function(reset) {
    //     // console.log('count:'+count)
    //     if (count >= max) {
    //         count = 0
    //         return true
    //     } else if (reset) {
    //         count = 0
    //         return true
    //     } else {
    //         count++
    //         return false
    //     }
    // }
}

export function counter2(max, val=0) {
    let count = val
    count++

    if (count >= max) {
        count = 0
        return true
    }

    return {
        // console.log(count)
        reset: function() {
            count = 0
            return false
        }
    }
}

export function calcAngle(start, end) {
    // let dx = start.x - end.x
    // let dy = start.y - end.y
    let dx =  end.x - start.x
    let dy =  end.y - start.y

    const theta = Math.atan2(dy, dx)
    let dist = 0

    dist = Math.sqrt(dx*dx + dy*dy)

    const normDx = dist === 0 ? 0 : dx / dist
    const normDy = dist === 0 ? 0 : dy / dist

    return {theta, dist, dx, dy, normDx, normDy}
>>>>>>> 08e6d43a56df9441c86aaaa535937c1582bd5664
}